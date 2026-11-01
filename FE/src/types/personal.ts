import type { Anime } from '@/types/anime';
import type { Progress } from '@/types/progress';
import type { LibraryStatus, PageMeta } from '@/lib/api/backend/types';
export interface PersonalActor {
  id: string;
  permissions: readonly string[];
}
export interface LibraryItem {
  key: string;
  anime: Anime;
  progress?: Progress;
}
export interface PersonalQuery {
  tab: 'favorites' | 'watching' | 'history';
  q: string;
  sort: 'recent' | 'title';
  page: number;
  pageSize: number;
}
export interface LibraryEntry {
  animeId: string;
  status: LibraryStatus;
  isFavorite: boolean;
  version: number;
  updatedAt: string;
}
export interface PersonalSnapshot {
  favorites: string[];
  progress: Progress[];
  library: LibraryEntry[];
}
export interface PersonalPage {
  items: LibraryItem[];
  meta: PageMeta;
  counts: { favorites: number; watching: number; history: number };
}
export interface ProfileSummary {
  favoriteAnimeCount: number;
  inProgressEpisodeCount: number;
  completedEpisodeCount: number;
  historyEpisodeCount: number;
  favoriteAnime: Anime[];
  preview: LibraryItem[];
}
