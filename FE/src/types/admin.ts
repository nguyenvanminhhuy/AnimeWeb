import type { Anime, TopViewedAnimeEntry } from '@/types/anime';

export interface AdminPreviewSession {
  id: string;
  displayName: string;
  permissions: readonly string[];
}

export interface AdminDashboardData {
  totalAnime: number;
  publishedEpisodes: number;
  upcomingAnime: number;
  episodesWithoutVideo: number;
  totalSeasons: number;
  totalGenres: number;
  topViewed: TopViewedAnimeEntry[];
  statuses: { status: Anime['status']; label: string; count: number }[];
  recentAnime: {
    publicSlug: string | null;
    anime: Anime;
    episodeCount: number;
    lastPublishedAt: string | null;
  }[];
}
