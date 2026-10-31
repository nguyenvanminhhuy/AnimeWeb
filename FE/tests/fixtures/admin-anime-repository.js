import { mockAdminAnimeRepository as repository } from '/src/lib/api/mock/mock-admin-anime-repository.ts';
import { anime } from '/src/testing/mocks/fixtures/anime.ts';
import { mockAdminGenreRepository as genres } from '/src/lib/api/mock/mock-admin-genre-repository.ts';

window.verifyAdminAnimeRepository = async () => {
  function check(condition, label) {
    if (!condition) throw new Error(label);
  }
  async function rejects(task, label) {
    try {
      await task();
    } catch (error) {
      return error;
    }
    throw new Error(label);
  }
  const session = (write) => ({
    id: crypto.randomUUID(),
    displayName: 'Repository test',
    permissions: [
      'admin:dashboard:read',
      'admin:anime:read',
      'admin:genre:read',
      ...(write ? ['admin:anime:write', 'admin:genre:write'] : []),
    ],
  });
  const read = session(false);
  const write = session(true);
  const other = session(true);
  const signal = new AbortController().signal;
  const input = {
    title: 'Repository anime',
    slug: 'repository-anime',
    subtitle: '',
    synopsis: 'Metadata fixture test',
    releaseYear: 2027,
    status: 'upcoming',
    format: 'tv',
    genres: ['Giả tưởng'],
    posterUrl: '/images/fallback.svg',
    bannerUrl: '/images/hero.svg',
  };
  const query = {
    q: '',
    genre: '',
    year: '',
    status: '',
    format: '',
    sort: 'newest',
    page: 1,
    pageSize: 24,
  };
  const snapshot = JSON.stringify(anime);
  for (const task of [
    () => repository.create(input, signal, read),
    () => repository.update('anime-01', input, signal, read),
    () => repository.remove('anime-08', signal, read),
  ]) {
    const error = await rejects(task, 'Read-only mutation succeeded');
    check(error.message.includes('quyền'), 'Read-only error missing');
  }
  const row = await repository.create(
    { ...input, id: 'forged-id', publicSlug: 'forged-public' },
    signal,
    write,
  );
  check(
    row.anime.id.startsWith('admin-anime-') && row.publicSlug === null,
    'Untrusted extra fields accepted',
  );
  const updated = await repository.update(
    row.anime.id,
    { ...input, title: 'Updated', id: 'replacement-id' },
    signal,
    write,
  );
  check(updated.anime.id === row.anime.id, 'Update changed ID');
  check(
    (await repository.list(query, 'ready', signal, other)).meta.total === 24,
    'Another session was changed',
  );
  const invalid = await rejects(
    () =>
      repository.create(
        { ...input, slug: 'invalid', posterUrl: 'https://outside.invalid/image.png' },
        signal,
        write,
      ),
    'External artwork accepted',
  );
  check(Boolean(invalid.fields.posterUrl), 'Artwork field error missing');
  const seeded = await repository.get('anime-01', signal, write);
  const invalidStatus = await rejects(
    () => repository.update('anime-01', { ...seeded.anime, status: 'upcoming' }, signal, write),
    'Published relations ignored',
  );
  check(Boolean(invalidStatus.fields.status), 'Referenced status field error missing');
  await rejects(() => repository.remove('anime-01', signal, write), 'Referenced anime deleted');
  check(Boolean(await repository.get('anime-01', signal, write)), 'Referenced anime missing');
  const concurrent = await Promise.allSettled([
    repository.create({ ...input, slug: 'concurrent' }, signal, write),
    repository.create({ ...input, slug: 'concurrent' }, signal, write),
  ]);
  check(
    concurrent.filter((result) => result.status === 'fulfilled').length === 1,
    'Concurrent duplicate slug accepted',
  );
  const before = (await repository.list(query, 'ready', signal, write)).meta.total;
  const controller = new AbortController();
  const cancelled = repository.create({ ...input, slug: 'cancelled' }, controller.signal, write);
  controller.abort();
  await rejects(() => cancelled, 'Aborted mutation completed');
  check(
    (await repository.list(query, 'ready', signal, write)).meta.total === before,
    'Aborted mutation changed data',
  );
  await repository.remove(row.anime.id, signal, write);
  check((await repository.get(row.anime.id, signal, write)) === null, 'Delete did not remove row');
  await rejects(
    () => genres.create({ name: 'Readonly', slug: 'readonly' }, signal, read),
    'Read-only genre creation succeeded',
  );
  const genre = await genres.create({ name: 'Mystery', slug: 'mystery' }, signal, write);
  check((await genres.options(signal, other)).length === 5, 'Another session taxonomy changed');
  const referenced = await repository.create(
    { ...input, slug: 'taxonomy-test', genres: ['Mystery'] },
    signal,
    write,
  );
  await rejects(() => genres.remove(genre.id, signal, write), 'Used genre deleted');
  await genres.update(
    genre.id,
    { name: 'Mystery renamed', slug: 'mystery-renamed' },
    signal,
    write,
  );
  check(
    (await repository.get(referenced.anime.id, signal, write)).anime.genres.includes(
      'Mystery renamed',
    ),
    'Genre rename orphaned anime',
  );
  check(
    (await repository.list({ ...query, genre: 'mystery-renamed' }, 'ready', signal, write)).meta
      .total === 1,
    'Renamed slug does not filter anime',
  );
  check(
    (await repository.list({ ...query, genre: 'missing-genre' }, 'ready', signal, write)).meta
      .total === 0,
    'Unknown genre leaked unfiltered catalog',
  );
  await repository.remove(referenced.anime.id, signal, write);
  await genres.remove(genre.id, signal, write);
  const genreController = new AbortController();
  const genrePending = genres.create(
    { name: 'Cancelled genre', slug: 'cancelled-genre' },
    genreController.signal,
    write,
  );
  genreController.abort();
  await rejects(() => genrePending, 'Aborted genre mutation completed');
  check(
    (await genres.options(signal, write)).length === 5,
    'Aborted genre mutation changed taxonomy',
  );
  const genreRace = await Promise.allSettled([
    genres.create({ name: 'Concurrent genre', slug: 'genre-race' }, signal, write),
    genres.create({ name: 'Concurrent genre', slug: 'genre-race' }, signal, write),
  ]);
  check(
    genreRace.filter((result) => result.status === 'fulfilled').length === 1,
    'Concurrent duplicate genres accepted',
  );
  check(JSON.stringify(anime) === snapshot, 'Public fixture changed');
  return 'read-only anime/genre guards, isolated workspaces, stable IDs/field allowlist, local assets, references, genre assignment/rename/filter/delete rules, concurrent uniqueness, abort before commit and public fixture unchanged';
};
