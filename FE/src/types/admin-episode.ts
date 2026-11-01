import type { Anime } from '@/types/anime';
import type { Season, Episode } from '@/types/episode';

export interface AdminSeason extends Season {
  version: number;
}
export type AdminSeasonInput = Omit<AdminSeason, 'id'>;
export interface AdminEpisodeInput {
  version: number;
  thumbnailUrl: string;
  animeId: string;
  seasonId: string;
  number: number;
  title: string;
  sortOrder: number;
  durationSeconds: number | null;
  status: 'draft' | 'published';
}
export interface AdminEpisode extends Omit<Episode, 'publishedAt'> {
  version: number;
  publishedAt: string | null;
}
export interface AdminEpisodeCatalog {
  anime: Pick<Anime, 'id' | 'title' | 'status'>[];
  seasons: AdminSeason[];
  episodes: AdminEpisode[];
}

export interface AdminEpisodePage extends AdminEpisodeCatalog {
  meta: import('@/lib/api/backend/types').PageMeta;
}
