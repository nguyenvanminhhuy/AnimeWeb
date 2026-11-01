import type { AnimeDetail } from '@/types/anime';
import type { Episode } from '@/types/episode';

export interface PlaybackSource {
  id: string;
  label: string;
  url: string;
  type: 'video/mp4' | 'video/webm' | 'application/vnd.apple.mpegurl';
  expiresAt?: string | null;
  subtitles: {
    id: string;
    url: string;
    language: string;
    label: string;
    isDefault: boolean;
    format?: 'vtt' | 'srt';
  }[];
}

export interface WatchDetail {
  anime: AnimeDetail;
  episode: Episode;
  // Ordered across seasons; never infer a neighboring ID arithmetically.
  episodes: Episode[];
  sources: PlaybackSource[];
  previousEpisodeId?: string | null;
  nextEpisodeId?: string | null;
}
