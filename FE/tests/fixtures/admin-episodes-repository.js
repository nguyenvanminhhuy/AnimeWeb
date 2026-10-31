import {
  adminEpisodeRepository as repo,
  adminAnimeRepository as films,
  adminDashboardRepository as dashboard,
} from '/src/lib/api/repositories.ts';
import { anime } from '/src/testing/mocks/fixtures/anime.ts';
import { createAnimeDetail } from '/src/testing/mocks/fixtures/anime-details.ts';

window.verifyAdminEpisodesRepository = async () => {
  const check = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const denied = async (action, message) => {
    try {
      await action();
    } catch (e) {
      if (e.name === 'AbortError' || /quyền|tồn tại|mùa|Mùa|tập|Tập|thông tin/.test(e.message))
        return;
      throw e;
    }
    throw new Error(message);
  };
  const permissions = [
    'admin:episode:read',
    'admin:episode:write',
    'admin:anime:read',
    'admin:anime:write',
    'admin:dashboard:read',
  ];
  const session = { id: 'test', displayName: 'Test', permissions };
  const readOnly = { ...session, permissions: ['admin:episode:read'] };
  const signal = () => new AbortController().signal;
  const catalog = () => repo.getCatalog(signal(), session);
  const before = await catalog();
  check(before.seasons.length === 22 && before.episodes.length === 155, 'Stable seed');
  const owner = before.anime[0].id;
  const publicBefore = JSON.stringify(createAnimeDetail(anime[0]));
  const input = { animeId: owner, number: 99, title: 'Season test', sortOrder: 999 };
  await denied(() => repo.saveSeason(null, input, signal(), readOnly), 'Read-only write allowed');
  await denied(
    () => repo.getCatalog(signal(), { ...session, permissions: [] }),
    'Read permission ignored',
  );
  const controller = new AbortController();
  const pending = repo.saveSeason(null, input, controller.signal, session);
  controller.abort();
  await denied(() => pending, 'Aborted mutation committed');
  check((await catalog()).seasons.length === 22, 'Abort persisted');
  await repo.saveSeason(null, input, signal(), session);
  let current = await catalog();
  const season = current.seasons.find((s) => s.title === input.title);
  check(season && season.animeId === owner, 'Season create');
  await denied(() => repo.saveSeason(null, input, signal(), session), 'Duplicate season');
  await repo.saveSeason(season.id, { ...input, title: 'Renamed season' }, signal(), session);
  const episode = {
    animeId: owner,
    seasonId: season.id,
    number: 1,
    title: 'Episode test',
    sortOrder: 10,
    durationSeconds: 1440,
    status: 'draft',
  };
  await denied(
    () => repo.saveEpisode(null, { ...episode, animeId: before.anime[1].id }, signal(), session),
    'Foreign season accepted',
  );
  await denied(
    () => repo.saveEpisode(null, { ...episode, durationSeconds: 0 }, signal(), session),
    'Duration accepted',
  );
  await Promise.all([
    repo.saveEpisode(null, episode, signal(), session),
    repo.saveEpisode(null, episode, signal(), session),
  ]).then(
    () => {
      throw new Error('Concurrent duplicate');
    },
    () => {},
  );
  current = await catalog();
  let row = current.episodes.find((e) => e.title === episode.title);
  check(current.episodes.filter((e) => e.title === episode.title).length === 1, 'Duplicate race');
  check(!row.hasPlayback && row.publishedAt === null, 'Draft fabricated playback/date');
  await denied(() => repo.remove('season', season.id, signal(), session), 'Cascade deletion');
  await denied(() => films.remove(owner, signal(), session), 'Anime dependency deleted');
  await repo.saveEpisode(row.id, { ...episode, title: 'Edited draft' }, signal(), session);
  await repo.remove('episode', row.id, signal(), session);
  await repo.remove('season', season.id, signal(), session);
  check((await catalog()).seasons.length === 22, 'Season delete');
  const baseSeason = before.seasons.find((s) => s.animeId === owner);
  const publish = {
    ...episode,
    seasonId: baseSeason.id,
    number: 999,
    sortOrder: 999,
    status: 'published',
  };
  await repo.saveEpisode(null, publish, signal(), session);
  current = await catalog();
  row = current.episodes.find((e) => e.number === 999);
  check(row && row.publishedAt && !row.hasPlayback, 'Published metadata');
  await denied(() => repo.remove('episode', row.id, signal(), session), 'Published deletion');
  await denied(
    () => repo.saveEpisode(row.id, { ...publish, status: 'draft' }, signal(), session),
    'Published withdrawal',
  );
  check(
    (await dashboard.getOverview('normal', signal(), session)).publishedEpisodes === 156,
    'Dashboard stale',
  );
  check(
    (await films.get(owner, signal(), session)).publishedEpisodes ===
      before.episodes.filter((e) =>
        before.seasons.some((s) => s.animeId === owner && s.id === e.seasonId),
      ).length +
        1,
    'Anime count stale',
  );
  check(JSON.stringify(createAnimeDetail(anime[0])) === publicBefore, 'Public fixture mutated');
  current.episodes.length = 0;
  check((await catalog()).episodes.length === 156, 'Returned references mutable');
  check(
    (await repo.getCatalog(signal(), { ...session, id: 'new' })).episodes.length === 155,
    'Session leaked',
  );
  return 'permissions, abort, relational/unique/range validation, concurrent duplicates, season/episode CRUD, published restrictions, shared counts, public isolation and cloned snapshots';
};
