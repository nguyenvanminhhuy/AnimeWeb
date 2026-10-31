import { paths } from '@/config/paths';
import type { AdminGenreQuery } from '@/types/admin-genre';

export function parseGenreQuery(params: URLSearchParams): AdminGenreQuery {
  const page = Number(params.get('page') ?? 1);
  return {
    q: (params.get('q') ?? '').trim().slice(0, 100),
    usage:
      params.get('usage') === 'used' ? 'used' : params.get('usage') === 'unused' ? 'unused' : '',
    sort: params.get('sort') === 'name-desc' ? 'name-desc' : 'name',
    page:
      /^\d+$/.test(params.get('page') ?? '1') && Number.isSafeInteger(page) && page > 0 ? page : 1,
    pageSize: params.get('pageSize') === '20' ? 20 : params.get('pageSize') === '10' ? 10 : 5,
  };
}
export function genreParams(query: AdminGenreQuery) {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.usage) params.set('usage', query.usage);
  params.set('sort', query.sort);
  params.set('page', String(query.page));
  params.set('pageSize', String(query.pageSize));
  return params;
}
export function genreHref(query: AdminGenreQuery, mock?: string | null) {
  const params = genreParams(query);
  if (
    import.meta.env.DEV &&
    mock &&
    ['loading', 'error', 'empty', 'forbidden', 'save-error', 'delete-error'].includes(mock)
  )
    params.set('mock', mock);
  return `${paths.adminGenres}?${params}`;
}
