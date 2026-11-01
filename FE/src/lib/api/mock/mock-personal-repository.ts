import type { PersonalRepository } from '@/lib/api/contracts/personal-repository';
import type { PersonalActor, PersonalSnapshot, LibraryItem } from '@/types/personal';
import { demoAccount } from '@/lib/storage/demo-account';
import { isDemoUser } from '@/utils/auth';
import { anime } from '@/testing/mocks/fixtures/anime';
import { ApiError, assertVersion } from '@/lib/api/backend/error';
import { pageRows } from './page';

function authorize(actor: PersonalActor, permission: string, signal: AbortSignal) {
  signal.throwIfAborted();
  if (!isDemoUser(actor.id) || !actor.permissions.includes(permission))
    throw new ApiError(403, 'FORBIDDEN', 'Bạn chưa có quyền thực hiện thao tác này.');
  return actor.id;
}
function read(actor: PersonalActor): PersonalSnapshot {
  if (!isDemoUser(actor.id)) throw new ApiError(401, 'UNAUTHORIZED', 'Phiên không hợp lệ.');
  const data = demoAccount.read(actor.id);
  return {
    favorites: data.favorites,
    progress: data.progress.map((row) => ({ ...row, version: row.version ?? 1 })),
    library:
      data.library ??
      data.favorites.map((animeId) => ({
        animeId,
        status: 'plan_to_watch',
        isFavorite: true,
        version: 1,
        updatedAt: new Date(0).toISOString(),
      })),
  };
}
function save(actor: PersonalActor, snapshot: PersonalSnapshot) {
  if (!isDemoUser(actor.id) || !demoAccount.save(actor.id, { version: 1, ...snapshot }))
    throw new ApiError(500, 'STORAGE_ERROR', 'Không lưu được dữ liệu mẫu.');
  return structuredClone(snapshot);
}
function collections(snapshot: PersonalSnapshot) {
  const byId = new Map(anime.map((row) => [row.id, row]));
  const history: LibraryItem[] = snapshot.progress
    .flatMap((progress) => {
      const item = byId.get(progress.animeId);
      return item ? [{ key: progress.episodeId, anime: item, progress }] : [];
    })
    .sort(
      (a, b) =>
        (Date.parse(b.progress!.updatedAt ?? '') || 0) -
          (Date.parse(a.progress!.updatedAt ?? '') || 0) || a.key.localeCompare(b.key),
    );
  const latest = new Map<string, LibraryItem>();
  for (const item of history) if (!latest.has(item.anime.id)) latest.set(item.anime.id, item);
  return {
    history,
    watching: [...latest.values()].filter((row) => !row.progress?.completed),
    favorites: [...snapshot.favorites].reverse().flatMap((id) => {
      const item = byId.get(id);
      return item ? [{ key: id, anime: item, progress: latest.get(id)?.progress }] : [];
    }),
  };
}
export const mockPersonalRepository: PersonalRepository = {
  async snapshot(actor, signal) {
    authorize(actor, 'library:read:own', signal);
    return structuredClone(read(actor));
  },
  async list(actor, query, signal) {
    authorize(actor, query.tab === 'favorites' ? 'library:read:own' : 'progress:read:own', signal);
    const lists = collections(read(actor));
    const search = query.q.trim().toLowerCase();
    const rows = lists[query.tab].filter((row) =>
      `${row.anime.title} ${row.anime.subtitle}`.toLowerCase().includes(search),
    );
    if (query.sort === 'title')
      rows.sort(
        (a, b) =>
          a.anime.title.toLowerCase().localeCompare(b.anime.title.toLowerCase()) ||
          a.key.localeCompare(b.key),
      );
    const page = pageRows(rows, query.page, query.pageSize);
    return structuredClone({
      items: page.rows,
      meta: page.meta,
      counts: {
        favorites: lists.favorites.length,
        watching: lists.watching.length,
        history: lists.history.length,
      },
    });
  },
  async summary(actor, signal) {
    authorize(actor, 'library:read:own', signal);
    const data = read(actor);
    const lists = collections(data);
    return structuredClone({
      favoriteAnimeCount: lists.favorites.length,
      inProgressEpisodeCount: data.progress.filter((row) => !row.completed).length,
      completedEpisodeCount: data.progress.filter((row) => row.completed).length,
      historyEpisodeCount: lists.history.length,
      favoriteAnime: lists.favorites.slice(0, 4).map((row) => row.anime),
      preview: lists.watching.slice(0, 6),
    });
  },
  async setFavorite(actor, animeId, isFavorite, version, signal) {
    authorize(actor, 'library:write:own', signal);
    const data = read(actor);
    const current = data.library.find((row) => row.animeId === animeId);
    assertVersion(current?.version ?? 0, version);
    const entry = {
      animeId,
      isFavorite,
      status: current?.status ?? ('plan_to_watch' as const),
      version: version + 1,
      updatedAt: new Date().toISOString(),
    };
    data.library = [entry, ...data.library.filter((row) => row.animeId !== animeId)];
    data.favorites = isFavorite
      ? [...data.favorites.filter((id) => id !== animeId), animeId]
      : data.favorites.filter((id) => id !== animeId);
    return save(actor, data);
  },
  async saveProgress(actor, entry, signal) {
    authorize(actor, 'progress:write:own', signal);
    const data = read(actor);
    const current = data.progress.find((row) => row.episodeId === entry.episodeId);
    assertVersion(current?.version ?? 0, entry.version ?? 0);
    const next = {
      ...entry,
      positionSeconds: Math.floor(entry.positionSeconds),
      version: (entry.version ?? 0) + 1,
      updatedAt: new Date().toISOString(),
    };
    data.progress = [next, ...data.progress.filter((row) => row.episodeId !== entry.episodeId)];
    return save(actor, data);
  },
};
