export interface Progress {
  version?: number;
  animeId: string;
  episodeId: string;
  episodeNumber: number;
  positionSeconds: number;
  durationSeconds: number | null;
  completed?: boolean;
  updatedAt?: string;
}
