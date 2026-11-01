import type { PageMeta } from '@/lib/api/backend/types';
export interface AdminListQuery {
  q?: string;
  animeId?: string;
  seasonId?: string;
  episodeId?: string;
  sourceId?: string;
  commentId?: string;
  status?: string;
  enabled?: string;
  sort?: string;
  page: number;
  pageSize: number;
  empty?: boolean;
}
export interface PageResult<T> {
  rows: T[];
  meta: PageMeta;
}
