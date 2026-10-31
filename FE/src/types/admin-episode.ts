import type { Anime } from '@/types/anime';
import type { Season, Episode } from '@/types/episode';

export type AdminSeasonInput = Omit<Season, 'id'>;
export interface AdminEpisodeInput {
  animeId: string;
  seasonId: string;
  number: number;
  title: string;
  sortOrder: number;
  durationSeconds: number;
  status: 'draft' | 'published';
}
export interface AdminEpisode extends Omit<Episode, 'publishedAt'> {
  publishedAt: string | null;
}
export interface AdminEpisodeCatalog {
  anime: Pick<Anime, 'id' | 'title' | 'status'>[];
  seasons: Season[];
  episodes: AdminEpisode[];
}
