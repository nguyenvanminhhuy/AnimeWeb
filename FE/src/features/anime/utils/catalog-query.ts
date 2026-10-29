import type { CatalogQuery } from '@/types/catalog';
import { genreOptions, statusOptions, formatOptions, catalogYears } from '@/config/catalog';
import { paths } from '@/config/paths';

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
