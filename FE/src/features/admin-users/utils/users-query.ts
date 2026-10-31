import { paths } from '@/config/paths';
import type { AdminUsersQuery } from '@/types/admin-user';

export function parseUsersQuery(params: URLSearchParams): AdminUsersQuery {
  const page = Number(params.get('page') ?? 1);
  return {
    q: (params.get('q') ?? '').trim().slice(0, 100),
    status:
      params.get('status') === 'active'
        ? 'active'
        : params.get('status') === 'blocked'
          ? 'blocked'
          : '',
    sort:
      params.get('sort') === 'name'
        ? 'name'
        : params.get('sort') === 'oldest'
          ? 'oldest'
          : 'newest',
    page:
      /^\d+$/.test(params.get('page') ?? '1') && Number.isSafeInteger(page) && page > 0 ? page : 1,
    pageSize: params.get('pageSize') === '50' ? 50 : params.get('pageSize') === '20' ? 20 : 10,
  };
}
export function usersParams(query: AdminUsersQuery) {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.status) params.set('status', query.status);
  params.set('sort', query.sort);
  params.set('page', String(query.page));
  params.set('pageSize', String(query.pageSize));
  return params;
}
export function usersHref(query: AdminUsersQuery, mock?: string | null, userId?: string | null) {
  const params = usersParams(query);
  if (userId) params.set('userId', userId.slice(0, 100));
  if (
    import.meta.env.DEV &&
    mock &&
    [
      'loading',
      'empty',
      'error',
      'forbidden',
      'detail-error',
      'detail-loading',
      'detail-empty',
    ].includes(mock)
  )
    params.set('mock', mock);
  return `${paths.adminUsers}?${params}`;
}
