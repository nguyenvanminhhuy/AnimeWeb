export interface Progress {
  animeId: string;
  episodeId: string;
  episodeNumber: number;
  positionSeconds: number;
  durationSeconds: number;
  completed?: boolean;
  updatedAt?: string;
}
