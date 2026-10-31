import { formatOptions, statusOptions } from '@/config/catalog';
import { paths } from '@/config/paths';
import type { AdminAnimeQuery } from '@/types/admin-anime';

export function parseAdminAnimeQuery(params: URLSearchParams): AdminAnimeQuery {
  const page = Number(params.get('page') ?? '1');
  return {
    q: (params.get('q') ?? '').trim().slice(0, 100),
    genre:
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(params.get('genre') ?? '') &&
      (params.get('genre')?.length ?? 0) <= 100
        ? params.get('genre')!
        : '',
    status: statusOptions.find((item) => item.value === params.get('status'))?.value ?? '',
    format: formatOptions.find((item) => item.value === params.get('format'))?.value ?? '',
    year:
      /^\d{1,4}$/.test(params.get('year') ?? '') && Number(params.get('year')) > 0
        ? params.get('year')!
        : '',
    sort: params.get('sort') === 'title' ? 'title' : 'newest',
    page:
      /^\d+$/.test(params.get('page') ?? '1') && Number.isSafeInteger(page) && page > 0 ? page : 1,
    pageSize: params.get('pageSize') === '24' ? 24 : 12,
  };
}

export function adminAnimeParams(query: AdminAnimeQuery): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of ['q', 'genre', 'year', 'status', 'format'] as const) {
    if (query[key]) params.set(key, query[key]);
  }
  params.set('sort', query.sort);
  params.set('page', String(query.page));
  params.set('pageSize', String(query.pageSize));
  return params;
}

export function adminAnimeHref(query: AdminAnimeQuery, mock?: string | null): string {
  const params = adminAnimeParams(query);
  if (
    import.meta.env.DEV &&
    mock &&
    ['loading', 'empty', 'error', 'forbidden', 'delete-error'].includes(mock)
  )
    params.set('mock', mock);
  return `${paths.adminAnime}?${params}`;
}
