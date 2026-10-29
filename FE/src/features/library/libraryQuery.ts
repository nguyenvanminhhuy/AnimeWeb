import { paths } from '../../routes/paths';
import { libraryTabs } from './library.types';
import type { LibraryQuery } from './library.types';

export function parseLibraryQuery(params: URLSearchParams): LibraryQuery {
  const rawPage = params.get('page') ?? '';
  const page = /^\d+$/.test(rawPage) ? Number(rawPage) : 1;
  return {
    tab: libraryTabs.find((tab) => tab.value === params.get('tab'))?.value ?? 'favorites',
    q: (params.get('q') ?? '').trim().slice(0, 100),
    sort: params.get('sort') === 'title' ? 'title' : 'recent',
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}

export function libraryHref(query: LibraryQuery, mock?: string | null) {
  const params = new URLSearchParams({
    tab: query.tab,
    sort: query.sort,
    page: String(query.page),
  });
  if (query.q) params.set('q', query.q);
  if (import.meta.env.DEV && mock && ['loading', 'empty', 'error', 'forbidden'].includes(mock))
    params.set('mock', mock);
  return `${paths.library}?${params}`;
}
