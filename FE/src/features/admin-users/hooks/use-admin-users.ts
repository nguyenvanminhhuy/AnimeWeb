import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useSession } from '@/stores/session';
import { adminUserRepository } from '@/lib/api/repositories';
import { parseUsersQuery, usersHref, usersParams } from '@/features/admin-users/utils/users-query';
import type { AdminUsersResult } from '@/types/admin-user';

export function useAdminUsers() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { adminPreview, permissions } = useSession();
  const mock = import.meta.env.DEV ? params.get('mock') : null;
  const userId = params.get('userId')?.slice(0, 100) || null;
  const canRead = Boolean(
    import.meta.env.DEV &&
    adminPreview &&
    permissions.includes('admin:user:read') &&
    mock !== 'forbidden',
  );
  const queryKey = usersParams(parseUsersQuery(params)).toString();
  const query = useMemo(() => parseUsersQuery(new URLSearchParams(queryKey)), [queryKey]);
  const state = mock === 'error' || mock === 'empty' ? mock : 'ready';
  const [revision, setRevision] = useState(0);
  const key = `${adminPreview?.id}:${canRead}:${queryKey}:${state}:${mock === 'loading'}:${revision}`;
  const [response, setResponse] = useState<{
    key: string;
    resolvedKey: string;
    data: AdminUsersResult | null;
    error: string;
  } | null>(null);
  const matches = response?.key === key || response?.resolvedKey === key;
  const result = canRead && matches ? (response?.data ?? null) : null;
  const error = canRead && matches ? (response?.error ?? '') : '';
  useEffect(() => {
    if (
      !canRead ||
      !adminPreview ||
      mock === 'loading' ||
      response?.key === key ||
      response?.resolvedKey === key
    )
      return;
    const controller = new AbortController();
    adminUserRepository.list(query, state, controller.signal, adminPreview).then(
      (data) => {
        if (!controller.signal.aborted)
          setResponse({
            key,
            resolvedKey: `${adminPreview.id}:${canRead}:${usersParams({ ...query, page: data.meta.page })}:${state}:false:${revision}`,
            data,
            error: '',
          });
      },
      () => {
        if (!controller.signal.aborted)
          setResponse({
            key,
            resolvedKey: key,
            data: null,
            error: 'Không thể tải danh sách người dùng. Vui lòng thử lại.',
          });
      },
    );
    return () => controller.abort();
  }, [canRead, adminPreview, mock, response, key, query, state, revision]);
  const canonical = result ? usersHref({ ...query, page: result.meta.page }, mock, userId) : null;
  useEffect(() => {
    if (canonical && canonical !== location.pathname + location.search)
      navigate(canonical + location.hash, { replace: true, preventScrollReset: true });
  }, [canonical, location.pathname, location.search, location.hash, navigate]);
  return {
    canRead,
    userId,
    mock,
    query: { ...query, page: result?.meta.page ?? query.page },
    result,
    error,
    loading: canRead && !result && !error,
    refresh: () => {
      const next = new URLSearchParams(params);
      next.delete('mock');
      setParams(next, { replace: true, preventScrollReset: true });
      setRevision((value) => value + 1);
    },
  };
}
