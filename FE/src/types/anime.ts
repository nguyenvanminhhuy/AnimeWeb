import type { Season, Episode } from '@/types/episode';
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
  format: 'tv' | 'movie' | 'ova' | 'ona' | 'special';
  genres: string[];
  episodeLabel: string;
}
export interface AnimeDetail extends Anime {
  alternativeTitles: string[];
  seasons: Season[];
  episodes: Episode[];
  related: Anime[];
}
export interface TopViewedAnimeEntry {
  anime: Anime;
  viewCount: number;
}
export interface HomeCatalog {
  featured: Anime[];
  updated: Anime[];
  recommended: Anime[];
  topViewed: TopViewedAnimeEntry[];
}
export interface CatalogResult {
  options?: { genres: { value: string; label: string }[]; years: number[] };
  data: Anime[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}
