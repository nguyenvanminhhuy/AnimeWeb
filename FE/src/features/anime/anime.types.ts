import type { Season, Episode } from '../episode/episode.types';
export interface Anime {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  synopsis: string;
  posterUrl: string;
  bannerUrl: string;
  releaseYear: number;
  status: 'airing' | 'completed' | 'upcoming';
  format: 'tv' | 'movie';
  genres: string[];
  episodeLabel: string;
}
export interface AnimeDetail extends Anime {
  alternativeTitles: string[];
  seasons: Season[];
  episodes: Episode[];
  related: Anime[];
}
export interface HomeCatalog {
  featured: Anime[];
  updated: Anime[];
  recommended: Anime[];
}
export interface CatalogResult {
  data: Anime[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}
