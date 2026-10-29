import type { Anime } from './anime.types';
import { paths } from '../../routes/paths';

export const genreOptions = [
  { value: 'adventure', label: 'Phiêu lưu' },
  { value: 'fantasy', label: 'Giả tưởng' },
  { value: 'action', label: 'Hành động' },
  { value: 'slice-of-life', label: 'Đời thường' },
  { value: 'romance', label: 'Tình cảm' },
] as const;
export const statusOptions = [
  { value: 'airing', label: 'Đang phát hành' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'upcoming', label: 'Sắp ra mắt' },
] as const;
export const formatOptions = [
  { value: 'tv', label: 'TV series' },
  { value: 'movie', label: 'Điện ảnh' },
] as const;
export const catalogYears = [2026, 2025, 2024, 2023] as const;
export const sortOptions = [
  { value: 'newest', label: 'Năm phát hành mới nhất' },
  { value: 'title', label: 'Tên A–Z' },
] as const;

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

export function parseCatalogQuery(params: URLSearchParams): CatalogQuery {
  const genre = params.get('genre');
  const status = params.get('status');
  const format = params.get('format');
  const year = params.get('year') ?? '';
  const pageValue = params.get('page') ?? '';
  const page = /^\d+$/.test(pageValue) ? Number(pageValue) : 1;
  return {
    q: (params.get('q') ?? '').trim().slice(0, 100),
    // Older Home banners linked with the Vietnamese label; accept both forms.
    genre:
      genreOptions.find((option) => option.value === genre || option.label === genre)?.value ?? '',
    year: catalogYears.some((value) => String(value) === year) ? year : '',
    status: statusOptions.find((option) => option.value === status)?.value ?? '',
    format: formatOptions.find((option) => option.value === format)?.value ?? '',
    sort: params.get('sort') === 'title' ? 'title' : 'newest',
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    pageSize: params.get('pageSize') === '24' ? 24 : 12,
  };
}

export function catalogParams(query: CatalogQuery): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of ['q', 'genre', 'year', 'status', 'format'] as const) {
    if (query[key]) params.set(key, query[key]);
  }
  params.set('sort', query.sort);
  params.set('page', String(query.page));
  params.set('pageSize', String(query.pageSize));
  return params;
}

export function catalogHref(query: CatalogQuery, mock?: string | null): string {
  const params = catalogParams(query);
  if (import.meta.env.DEV && mock && ['loading', 'empty', 'error'].includes(mock))
    params.set('mock', mock);
  return `${paths.explore}?${params}`;
}

export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLocaleLowerCase('vi');
}
