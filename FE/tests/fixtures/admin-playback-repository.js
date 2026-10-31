import {
  adminPlaybackRepository as repo,
  adminEpisodeRepository as episodes,
  playbackRepository,
} from '/src/lib/api/repositories.ts';

window.verifyAdminPlaybackRepository = async () => {
  const check = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const rejects = async (action, message) => {
    let rejected = false;
    try {
      await action();
    } catch {
      rejected = true;
    }
    check(rejected, message);
  };
  const session = {
    id: 'media-test',
    displayName: 'Test',
    permissions: [
      'admin:playback:read',
      'admin:playback:write',
      'admin:episode:read',
      'admin:episode:write',
    ],
  };
  const signal = () => new AbortController().signal;
  const catalog = () => repo.getCatalog(signal(), session);
  const initial = await catalog();
  const episode = initial.episodes[0];
  check(initial.sources.length === 0 && initial.subtitles.length === 0, 'Fabricated seed media');
  const source = {
    episodeId: episode.id,
    label: 'Primary',
    providerKey: 'local',
    type: 'mp4',
    language: 'ja',
    url: '/media/test.mp4',
    enabled: false,
  };
  await rejects(
    () => repo.getCatalog(signal(), { ...session, permissions: [] }),
    'Missing read guard',
  );
  await rejects(
    () =>
      repo.saveSource(null, source, signal(), { ...session, permissions: ['admin:playback:read'] }),
    'Missing write guard',
  );
  for (const url of [
    'javascript:alert(1)',
    'data:video/mp4,abc',
    '//other.test/file.mp4',
    'https://user:pass@example.test/file.mp4',
    '/\\example.test/file.mp4',
  ])
    await rejects(
      () => repo.saveSource(null, { ...source, url }, signal(), session),
      'Invalid URL accepted',
    );
  await rejects(
    () => repo.saveSource(null, { ...source, episodeId: 'missing' }, signal(), session),
    'Invalid episode',
  );
  const controller = new AbortController();
  const pending = repo.saveSource(null, source, controller.signal, session);
  controller.abort();
  await rejects(() => pending, 'Abort ignored');
  check((await catalog()).sources.length === 0, 'Aborted write persisted');
  const results = await Promise.allSettled([
    repo.saveSource(null, { ...source, hasPlayback: true }, signal(), session),
    repo.saveSource(null, source, signal(), session),
  ]);
  check(
    results.filter((r) => r.status === 'fulfilled').length === 1,
    'Concurrent duplicate source',
  );
  let state = await catalog();
  const saved = state.sources[0];
  check(!('hasPlayback' in saved), 'Extra source fields persisted');
  await repo.saveSource(
    saved.id,
    { ...source, label: 'Edited source', enabled: true },
    signal(),
    session,
  );
  await rejects(
    () =>
      repo.saveSource(
        saved.id,
        { ...source, episodeId: initial.episodes[1].id },
        signal(),
        session,
      ),
    'Source reassigned',
  );
  const track = {
    playbackSourceId: saved.id,
    label: 'Vietnamese',
    language: 'vi',
    format: 'vtt',
    url: '/media/vi.vtt',
    isDefault: true,
  };
  await rejects(
    () => repo.saveSubtitle(null, { ...track, playbackSourceId: 'missing' }, signal(), session),
    'Invalid source',
  );
  await repo.saveSubtitle(null, track, signal(), session);
  await rejects(() => repo.saveSubtitle(null, track, signal(), session), 'Duplicate subtitle');
  await repo.saveSubtitle(
    null,
    { ...track, label: 'English', language: 'en', url: '/media/en.vtt' },
    signal(),
    session,
  );
  state = await catalog();
  check(
    state.subtitles.filter((t) => t.isDefault).length === 1 &&
      state.subtitles.find((t) => t.isDefault).language === 'en',
    'Default uniqueness',
  );
  const english = state.subtitles.find((t) => t.language === 'en');
  await repo.saveSubtitle(
    english.id,
    {
      ...track,
      label: 'English edited',
      language: 'en',
      format: 'srt',
      url: '/media/en.srt',
      isDefault: false,
    },
    signal(),
    session,
  );
  check(!(await catalog()).subtitles.some((t) => t.isDefault), 'Default removal');
  await rejects(() => repo.remove('source', saved.id, signal(), session), 'Source cascade delete');
  // A draft episode with configured media also cannot be removed through the episode repository.
  const season = initial.seasons[0];
  await episodes.saveEpisode(
    null,
    {
      animeId: season.animeId,
      seasonId: season.id,
      title: 'Draft with source',
      number: 999,
      sortOrder: 999,
      durationSeconds: 1200,
      status: 'draft',
    },
    signal(),
    session,
  );
  const draft = (await catalog()).episodes.find((e) => e.title === 'Draft with source');
  await repo.saveSource(null, { ...source, episodeId: draft.id }, signal(), session);
  await rejects(
    () => episodes.remove('episode', draft.id, signal(), session),
    'Episode cascade delete',
  );
  check(
    !(await catalog()).episodes.find((e) => e.id === episode.id).hasPlayback,
    'Unverified configuration marked playable',
  );
  check(
    (await playbackRepository.getEpisode(episode.id, 'normal')).sources.length === 0,
    'Public player mutated',
  );
  for (const subtitle of state.subtitles)
    await repo.remove('subtitle', subtitle.id, signal(), session);
  await repo.remove('source', saved.id, signal(), session);
  check(!(await catalog()).sources.some((s) => s.id === saved.id), 'Delete failed');
  state.sources.length = 0;
  check((await catalog()).sources.length === 1, 'Snapshot leaked references');
  check(
    (await repo.getCatalog(signal(), { ...session, id: 'other' })).sources.length === 0,
    'Session leakage',
  );
  const revoked = { ...session, permissions: [...session.permissions] };
  const mutation = repo.saveSource(null, source, signal(), revoked);
  revoked.permissions = [];
  await rejects(() => mutation, 'Permission not rechecked before commit');
  return 'read/write guards, URL/foreign-key/duplicate validation, abort and revoked permissions, source/subtitle CRUD, default uniqueness, dependency deletion guards, cloned snapshots, session and public-player isolation';
};
