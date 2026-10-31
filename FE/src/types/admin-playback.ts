import type { AdminEpisodeCatalog } from '@/types/admin-episode';

export interface AdminSourceInput {
  episodeId: string;
  providerKey: string;
  label: string;
  language: string;
  type: 'mp4' | 'hls';
  url: string;
  enabled: boolean;
}
export interface AdminSource extends AdminSourceInput {
  id: string;
}
export interface AdminSubtitleInput {
  playbackSourceId: string;
  label: string;
  language: string;
  format: 'vtt' | 'srt';
  url: string;
  isDefault: boolean;
}
export interface AdminSubtitle extends AdminSubtitleInput {
  id: string;
}
export interface AdminPlaybackCatalog extends AdminEpisodeCatalog {
  sources: AdminSource[];
  subtitles: AdminSubtitle[];
}
