import type { Anime } from '../anime/anime.types';
import type { Progress } from '../../data/local/demoAccount';

export type LibraryTab = 'favorites' | 'watching' | 'history';
export interface LibraryQuery {
  tab: LibraryTab;
  q: string;
  sort: 'recent' | 'title';
  page: number;
}
export interface LibraryItem {
  key: string;
  anime: Anime;
  progress?: Progress;
}
export const libraryPageSize = 8;
export const libraryTabs = [
  { value: 'favorites', label: 'Yêu thích', icon: 'heart' },
  { value: 'watching', label: 'Đang xem', icon: 'play' },
  { value: 'history', label: 'Lịch sử', icon: 'history' },
] as const;
export function isCompleted(progress: Progress) {
  return progress.completed === true || progress.positionSeconds >= progress.durationSeconds;
}
