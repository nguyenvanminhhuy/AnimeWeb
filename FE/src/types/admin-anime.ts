import type { Anime, CatalogResult } from '@/types/anime';
import type { CatalogQuery } from '@/types/catalog';

export type AdminAnimeQuery = CatalogQuery;
export interface AdminAnimeRow {
  anime: Anime;
  publishedEpisodes: number;
  publicSlug: string | null;
}
export interface AdminAnimeResult {
  genreOptions: { value: string; label: string }[];
  years: number[];
  data: AdminAnimeRow[];
  meta: CatalogResult['meta'];
}

export type AdminAnimeInput = Pick<
  Anime,
  | 'title'
  | 'slug'
  | 'subtitle'
  | 'synopsis'
  | 'releaseYear'
  | 'status'
  | 'format'
  | 'genres'
  | 'posterUrl'
  | 'bannerUrl'
>;
export type AdminAnimeFields = Partial<Record<keyof AdminAnimeInput, string>>;
