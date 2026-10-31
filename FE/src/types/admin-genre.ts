export interface AdminGenre {
  id: string;
  name: string;
  slug: string;
}
export interface AdminGenreRow extends AdminGenre {
  animeCount: number;
}
export type AdminGenreInput = Pick<AdminGenre, 'name' | 'slug'>;
export type AdminGenreFields = Partial<Record<keyof AdminGenreInput, string>>;
export interface AdminGenreQuery {
  q: string;
  usage: '' | 'used' | 'unused';
  sort: 'name' | 'name-desc';
  page: number;
  pageSize: 5 | 10 | 20;
}
export interface AdminGenreResult {
  data: AdminGenreRow[];
  meta: { total: number; totalPages: number; page: number; pageSize: number };
}
