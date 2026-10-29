import type { Anime } from '@/types/anime';
export interface CatalogQuery {
  q: string;
  genre: string;
  year: string;
  status: Anime['status'] | '';
  format: Anime['format'] | '';
  sort: 'newest' | 'title';
  page: number;
  pageSize: 12 | 24;
}
