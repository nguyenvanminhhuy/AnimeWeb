export interface Season {
  id: string;
  animeId: string;
  number: number;
  title: string;
  sortOrder: number;
}
export interface Episode {
  id: string;
  seasonId: string;
  number: number;
  title: string;
  sortOrder: number;
  durationSeconds: number;
  thumbnailUrl: string;
  publishedAt: string;
  status: 'published' | 'draft';
  hasPlayback: boolean;
}
