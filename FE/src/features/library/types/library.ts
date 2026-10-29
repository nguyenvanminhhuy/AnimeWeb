import type { Anime } from '@/types/anime';
import type { Progress } from '@/types/progress';

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
