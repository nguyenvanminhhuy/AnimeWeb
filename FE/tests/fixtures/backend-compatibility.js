import { createBackendClient } from '/src/lib/api/backend/client.ts';
import { createBackendRepositories } from '/src/lib/api/backend/repositories.ts';
import {
  serializeAdminAnime,
  mapAnime,
  mapAdminComment,
  loadAnimeDetail,
} from '/src/lib/api/backend/mappers.ts';
import { ApiError, parseApiError } from '/src/lib/api/backend/error.ts';
import { mockAdminAnimeRepository as animeRepository } from '/src/lib/api/mock/mock-admin-anime-repository.ts';
import { mockAdminEpisodeRepository as episodeRepository } from '/src/lib/api/mock/mock-admin-episode-repository.ts';
import { mockAdminPlaybackRepository as playbackRepository } from '/src/lib/api/mock/mock-admin-playback-repository.ts';
import { srtToVtt } from '/src/features/player/utils/subtitles.ts';

window.verifyBackendCompatibility = async () => {
  const check = (condition, label) => {
    if (!condition) throw new Error(label);
  };
  const requests = [];
  let response = { status: 200, body: { data: {} } };
  let unauthorizedCount = 0;
  const client = createBackendClient(
    async (request) => {
      requests.push(request);
      return response;
    },
    () => 'fixture-token',
    () => {
      unauthorizedCount++;
    },
  );
  const beforeInvalidAvatar = requests.length;
  for (const invalid of [undefined, 0, NaN]) {
    let rejected = false;
    try {
      await client.auth.saveAvatar(new Blob(['fixture'], { type: 'image/png' }), invalid);
    } catch (error) {
      rejected = error instanceof ApiError && error.code === 'INVALID_VERSION';
    }
    check(rejected, 'Avatar accepted a missing/invalid version');
  }
  check(requests.length === beforeInvalidAvatar, 'Invalid avatar version reached transport');
  await client.auth.login({
    email: 'fixture@example.test',
    password: 'fake-password',
    roles: ['admin'],
  });
  check(
    Object.keys(requests.at(-1).body).sort().join(',') === 'email,password',
    'Auth leaked non-DTO fields',
  );
  await client.admin.setUserRole('user/with space', 'manage', 7);
  check(
    requests.at(-1).method === 'PATCH' &&
      requests.at(-1).path === '/api/v1/admin/users/user%2Fwith%20space/role' &&
      JSON.stringify(requests.at(-1).body) === '{"role":"manage","version":7}',
    'Role PATCH path/payload/version mismatch',
  );
  response = { status: 204 };
  check(
    (await client.admin.removeAnime('anime/with space', 7)) === undefined,
    '204 parsed as JSON',
  );
  check(
    requests.at(-1).path === '/api/v1/admin/anime/anime%2Fwith%20space?version=7',
    'DELETE version or encoded ID missing',
  );
  check(requests.at(-1).headers.Authorization === 'Bearer fixture-token', 'Bearer missing');
  await client.personal.saveProgress('episode-id', {
    positionSeconds: 1.75,
    completed: false,
    version: 12,
    actor: 'not-a-dto-field',
  });
  check(
    JSON.stringify(requests.at(-1).body) === '{"positionSeconds":1,"completed":false,"version":12}',
    'Progress body mismatch',
  );
  await client.playback.startView('episode-id', { positionSeconds: 0 });
  check(requests.at(-1).credentials === 'include', 'Guest viewer identity not preserved');
  const before = requests.length;
  const aborted = new AbortController();
  aborted.abort();
  try {
    await client.auth.me(aborted.signal);
    throw new Error('aborted request accepted');
  } catch (error) {
    check(error.name === 'AbortError', 'abort became another error');
  }
  check(requests.length === before, 'Aborted request reached transport');
  response = { status: 401, body: { error: { code: 'UNAUTHORIZED', message: 'Fixture' } } };
  try {
    await client.auth.me();
  } catch (error) {
    check(error.status === 401, '401 status lost');
  }
  check(unauthorizedCount === 1, '401 did not notify session boundary');
  const validation = parseApiError(400, {
    error: {
      code: 'VALIDATION_ERROR',
      message: 'invalid',
      fields: { genreIds: ['Unknown genre'] },
      requestId: 'fixture-request',
    },
  });
  check(
    validation.fields.genreIds === 'Unknown genre' && validation.requestId === 'fixture-request',
    'Error envelope lost fields',
  );

  const genre = { id: 'genre-id', name: 'Phiêu lưu', slug: 'adventure', version: 3 };
  const input = {
    title: 'Fixture',
    slug: 'fixture',
    subtitle: '',
    synopsis: '',
    releaseYear: 2026,
    status: 'airing',
    format: 'special',
    publicationStatus: 'published',
    genres: ['Phiêu lưu'],
    posterUrl: '/images/fallback.svg',
    bannerUrl: '',
    alternativeTitles: ['Alias'],
    version: 9,
  };
  const body = serializeAdminAnime(input, [genre]);
  check(
    body.genreIds[0] === 'genre-id' &&
      body.version === 9 &&
      body.publicationStatus === 'published' &&
      body.bannerUrl === null &&
      !('genres' in body),
    'Anime serializer lost metadata',
  );
  check(JSON.stringify(body.alternativeTitles) === '["Alias"]', 'Alternative titles lost');
  const card = {
    id: 'anime-id',
    slug: 'fixture',
    title: 'Fixture',
    subtitle: '',
    synopsis: '',
    posterUrl: '/images/fallback.svg',
    bannerUrl: null,
    releaseYear: 2026,
    status: 'airing',
    format: 'special',
    genres: [genre],
  };
  check(
    mapAnime(card).format === 'special' && mapAnime(card).genres[0] === 'Phiêu lưu',
    'Anime mapper failed',
  );
  check(mapAnime(card).episodeLabel === '', 'Invented episode count');
  const deleted = mapAdminComment({
    comment: {
      id: 'comment-id',
      animeId: 'anime-id',
      author: { id: 'user-id', displayName: 'Author', avatarUrl: null },
      body: null,
      status: 'deleted',
      createdAt: '2026-11-01T00:00:00Z',
      updatedAt: '2026-11-01T00:00:00Z',
      version: 4,
    },
    lastModeration: null,
  });
  check(
    deleted.body === null && deleted.version === 4 && deleted.authorName === 'Author',
    'Deleted comment mapping failed',
  );

  const pageRequests = [];
  const paged = createBackendClient(async (request) => {
    const path = new URL(request.path, 'https://fixture.invalid');
    pageRequests.push(path.pathname + path.search);
    if (path.pathname.endsWith('/seasons'))
      return {
        status: 200,
        body: {
          data: [
            { id: 'season-id', animeId: 'anime-id', number: 0, title: 'Special', sortOrder: 0 },
          ],
        },
      };
    if (path.pathname.endsWith('/episodes')) {
      const page = Number(path.searchParams.get('page'));
      return {
        status: 200,
        body: {
          data: [
            {
              id: `opaque-${page}`,
              seasonId: 'season-id',
              number: page === 1 ? 0 : 1.5,
              title: 'Episode',
              sortOrder: page,
              durationSeconds: null,
              thumbnailUrl: '',
              publishedAt: '2026-11-01T00:00:00Z',
              status: 'published',
              hasPlayback: false,
            },
          ],
          meta: { page, pageSize: 50, total: 51, totalPages: 2 },
        },
      };
    }
    if (path.pathname.endsWith('/related')) return { status: 200, body: { data: [] } };
    return { status: 200, body: { data: { ...card, alternativeTitles: ['Alternative'] } } };
  });
  const detail = await loadAnimeDetail(paged, 'fixture');
  check(
    detail.episodes.length === 2 &&
      detail.episodes[1].number === 1.5 &&
      detail.episodes[0].durationSeconds === null,
    'Playlist paging/nullable duration failed',
  );
  check(
    pageRequests.some((path) => path.includes('page=2')),
    'Playlist only loaded first page',
  );
  const fakeCredentials = {
    value: { accessToken: 'fixture-token', expiresAt: '2099-01-01T00:00:00Z' },
    read() {
      return this.value;
    },
    write(value) {
      this.value = value;
    },
  };
  const unauthorized = createBackendRepositories(
    createBackendClient(async () => ({
      status: 401,
      body: { error: { code: 'UNAUTHORIZED', message: 'expired' } },
    })),
    fakeCredentials,
  );
  check(
    (await unauthorized.authRepository.restore(new AbortController().signal)) === null &&
      fakeCredentials.value === null,
    '401 did not clear restored credentials',
  );
  let invalidExpiryRequests = 0;
  fakeCredentials.value = { accessToken: 'fixture-token', expiresAt: 'invalid-date' };
  const invalidExpiry = createBackendRepositories(
    createBackendClient(async () => {
      invalidExpiryRequests++;
      return { status: 200 };
    }),
    fakeCredentials,
  );
  check(
    (await invalidExpiry.authRepository.restore(new AbortController().signal)) === null &&
      fakeCredentials.value === null &&
      invalidExpiryRequests === 0,
    'Invalid persisted expiry reached transport or kept credentials',
  );
  const wireCalls = [];
  const wire = createBackendRepositories(
    createBackendClient(async (request) => {
      wireCalls.push(request);
      if (request.path.startsWith('/api/v1/admin/genres/options'))
        return { status: 200, body: { data: [genre] } };
      return {
        status: 200,
        body: {
          data: {
            anime: card,
            publicationStatus: 'published',
            alternativeTitles: ['Alias'],
            publicSlug: 'fixture',
            publishedEpisodes: 0,
            version: 10,
          },
        },
      };
    }),
    { read: () => null, write: () => {} },
  );
  const saved = await wire.adminAnimeRepository.update(
    'anime-id',
    input,
    new AbortController().signal,
    {},
  );
  check(
    saved.version === 10 &&
      wireCalls.at(-1).body.genreIds[0] === 'genre-id' &&
      !('id' in wireCalls.at(-1).body),
    'Adapter leaked view model into PATCH',
  );

  const session = {
    id: crypto.randomUUID(),
    displayName: 'Fixture admin',
    permissions: [
      'admin:anime:read',
      'admin:anime:write',
      'admin:genre:read',
      'admin:episode:read',
      'admin:episode:write',
      'admin:playback:read',
      'admin:playback:write',
    ],
  };
  const signal = new AbortController().signal;
  const row = await animeRepository.create(
    { ...input, version: 0, publicationStatus: 'draft', format: 'tv', synopsis: 'Fixture' },
    signal,
    session,
  );
  check(row.version === 1, 'Create version is not 1');
  await animeRepository.update(
    row.anime.id,
    {
      ...input,
      version: row.version,
      publicationStatus: 'draft',
      format: 'tv',
      synopsis: 'Fixture',
    },
    signal,
    session,
  );
  try {
    await animeRepository.update(
      row.anime.id,
      { ...input, version: 1, publicationStatus: 'draft' },
      signal,
      session,
    );
    throw new Error('stale mutation accepted');
  } catch (error) {
    check(error instanceof ApiError && error.status === 409, 'stale update did not produce 409');
  }
  check(
    (await animeRepository.get(row.anime.id, signal, session)).version === 2,
    'Stale mutation changed data',
  );
  const page = await episodeRepository.list({ page: 999, pageSize: 10 }, signal, session);
  check(
    page.episodes.length === 0 && page.meta.page === 999 && page.meta.total > 0,
    'Server paging semantics not preserved',
  );
  const catalog = await playbackRepository.getCatalog(signal, session);
  const episode = catalog.episodes[0];
  await playbackRepository.saveSource(
    null,
    {
      episodeId: episode.id,
      providerKey: 'direct',
      label: 'Source',
      language: 'ja',
      type: 'mp4',
      url: 'https://media.example.invalid/video.mp4',
      enabled: false,
      expiresAt: null,
      version: 0,
    },
    signal,
    session,
  );
  const source = (await playbackRepository.getCatalog(signal, session)).sources[0];
  const track = {
    playbackSourceId: source.id,
    label: 'Track A',
    language: 'vi',
    format: 'vtt',
    url: 'https://media.example.invalid/a.vtt',
    isDefault: true,
    version: 0,
  };
  await playbackRepository.saveSubtitle(null, track, signal, session);
  await playbackRepository.saveSubtitle(
    null,
    { ...track, label: 'Track B', language: 'en', url: 'https://media.example.invalid/b.vtt' },
    signal,
    session,
  );
  const tracks = (await playbackRepository.getCatalog(signal, session)).subtitles;
  check(
    tracks.filter((row) => row.isDefault).length === 1 &&
      tracks.find((row) => row.label === 'Track A').version === 2,
    'Default track version not updated atomically',
  );
  check(
    srtToVtt('1\r\n00:00:01,500 --> 00:00:02,500\r\nText').includes(
      '00:00:01.500 --> 00:00:02.500',
    ),
    'SRT conversion failed',
  );
  return 'BE payloads/204/bearer/error/abort, DTO mappers, full playlist pages, restore 401, version conflict, page boundaries, default-track concurrency and SRT';
};
