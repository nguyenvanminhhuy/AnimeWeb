import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useSession } from '@/stores/session';
import { personalRepository } from '@/lib/api/repositories';
import type { PersonalPage } from '@/types/personal';
import { libraryPageSize } from '@/features/library/config/library';
import { libraryHref, parseLibraryQuery } from '@/features/library/utils/library-query';

export function useLibrary() {
  const { user, favorites, progress, permissions, toggleFavorite } = useSession();
  const [params, setParams] = useSearchParams();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const query = parseLibraryQuery(params);
  const mock = import.meta.env.DEV ? params.get('mock') : null;
  const canRead =
    permissions.includes('library:read:own') &&
    permissions.includes('progress:read:own') &&
    mock !== 'forbidden';
  const canWrite = permissions.includes('library:write:own');
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([user, canRead, query, mock, attempt, favorites, progress]);
  const [response, setResponse] = useState<{
    key: string;
    data?: PersonalPage;
    error: string;
  } | null>(null);
  useEffect(() => {
    if (!user || !canRead || mock === 'loading') return;
    const controller = new AbortController();
    personalRepository
      .list({ id: user, permissions }, { ...query, pageSize: libraryPageSize }, controller.signal)
      .then((data) => {
        if (mock === 'error') throw new Error('Không thể tải thư viện. Vui lòng thử lại.');
        if (!controller.signal.aborted)
          setResponse({
            key,
            data:
              mock === 'empty'
                ? {
                    ...data,
                    items: [],
                    meta: { ...data.meta, total: 0, totalPages: 0 },
                    counts: { favorites: 0, watching: 0, history: 0 },
                  }
                : data,
            error: '',
          });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setResponse({ key, error: error.message });
      });
    return () => controller.abort();
  }, [key]);
  const current = response?.key === key ? response : null;
  const resolvedQuery = current?.data
    ? { ...query, page: Math.min(query.page, Math.max(1, current.data.meta.totalPages)) }
    : query;
  const canonical =
    current && !current.error && user && canRead
      ? libraryHref(
          {
            ...query,
            page: Math.min(query.page, Math.max(1, current.data?.meta.totalPages ?? query.page)),
          },
          mock,
        )
      : null;
  useEffect(() => {
    if (canonical && canonical !== pathname + search)
      navigate(canonical, { replace: true, preventScrollReset: true });
  }, [canonical, pathname, search, navigate]);
  return {
    user,
    canRead,
    canWrite,
    query: resolvedQuery,
    counts: current?.data?.counts ?? { favorites: 0, watching: 0, history: 0 },
    total: current?.data?.meta.total ?? 0,
    totalPages: current?.data?.meta.totalPages ?? 0,
    mock,
    items: current?.data?.items ?? [],
    loading: Boolean(user && canRead && !current),
    error: current?.error ?? '',
    favorites,
    toggleFavorite,
    retry: () => {
      const next = new URLSearchParams(params);
      next.delete('mock');
      setParams(next, { replace: true, preventScrollReset: true });
      setAttempt((value) => value + 1);
    },
  };
}
