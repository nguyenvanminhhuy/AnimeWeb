import type { Anime } from '@/types/anime';

export interface AdminPreviewSession {
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
  statuses: { status: Anime['status']; label: string; count: number }[];
  recentAnime: {
    anime: Anime;
    episodeCount: number;
    lastPublishedAt: string | null;
  }[];
}
