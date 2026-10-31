import type { AdminPreviewSession } from '@/types/admin';
import type { AdminAnimeRow } from '@/types/admin-anime';
import type { AdminGenre } from '@/types/admin-genre';
import type { Season } from '@/types/episode';
import type { AdminEpisode } from '@/types/admin-episode';
import type { AdminSource, AdminSubtitle } from '@/types/admin-playback';
import { anime } from '@/testing/mocks/fixtures/anime';
import { genreOptions } from '@/config/catalog';
import { createAnimeDetail } from '@/testing/mocks/fixtures/anime-details';

const workspaces = new WeakMap<
  AdminPreviewSession,
  {
    anime: AdminAnimeRow[];
    genres: AdminGenre[];
    seasons: Season[];
    episodes: AdminEpisode[];
    sources: AdminSource[];
    subtitles: AdminSubtitle[];
  }
>();

// Internal mock data store; each repository enforces its own read/write permissions.
export function adminCatalogWorkspace(session: AdminPreviewSession) {
  if (!import.meta.env.DEV) throw new Error('Phiên mẫu chỉ khả dụng trong dev.');
  let workspace = workspaces.get(session);
  if (!workspace) {
    workspace = {
      sources: [],
      subtitles: [],
      seasons: anime.flatMap((item) => structuredClone(createAnimeDetail(item).seasons)),
      episodes: anime.flatMap((item) => structuredClone(createAnimeDetail(item).episodes)),
      anime: anime.map((item) => ({
        anime: structuredClone(item),
        publicSlug: item.slug,
        publishedEpisodes: createAnimeDetail(item).episodes.length,
      })),
      genres: genreOptions.map((item) => ({
        id: `genre-${item.value}`,
        name: item.label,
        slug: item.value,
      })),
    };
    workspaces.set(session, workspace);
  }
  return workspace;
}
