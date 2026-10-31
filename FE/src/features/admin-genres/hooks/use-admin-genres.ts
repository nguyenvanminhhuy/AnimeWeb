import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { adminGenreRepository } from '@/lib/api/repositories';
import { useSession } from '@/stores/session';
import type { AdminGenreResult } from '@/types/admin-genre';
import { genreHref, genreParams, parseGenreQuery } from '@/features/admin-genres/utils/genre-query';

export function useAdminGenres() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { adminPreview, permissions } = useSession();
  const mock = import.meta.env.DEV ? params.get('mock') : null;
  const canRead = Boolean(
    import.meta.env.DEV &&
    adminPreview &&
    permissions.includes('admin:genre:read') &&
    mock !== 'forbidden',
  );
  const canWrite = canRead && permissions.includes('admin:genre:write');
  const queryKey = genreParams(parseGenreQuery(params)).toString();
  const query = useMemo(() => parseGenreQuery(new URLSearchParams(queryKey)), [queryKey]);
  const [revision, setRevision] = useState(0);
  const state = mock === 'error' || mock === 'empty' ? mock : 'ready';
  const key = `${adminPreview?.id}:${canRead}:${queryKey}:${mock}:${revision}`;
  const [response, setResponse] = useState<{
    key: string;
    resolvedKey: string;
    data: AdminGenreResult | null;
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
    adminGenreRepository.list(query, state, controller.signal, adminPreview).then(
      (data) => {
        if (!controller.signal.aborted)
          setResponse({
            key,
            resolvedKey: `${adminPreview.id}:${canRead}:${genreParams({ ...query, page: data.meta.page })}:${mock}:${revision}`,
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
            error: 'Không thể tải thể loại. Vui lòng thử lại.',
          });
      },
    );
    return () => controller.abort();
  }, [canRead, adminPreview, mock, response, key, query, state, revision]);
  const canonical = result ? genreHref({ ...query, page: result.meta.page }, mock) : null;
  useEffect(() => {
    if (canonical && canonical !== location.pathname + location.search)
      navigate(canonical + location.hash, { replace: true, preventScrollReset: true });
  }, [canonical, location.pathname, location.search, location.hash, navigate]);
  return {
    canRead,
    canWrite,
    query: { ...query, page: result?.meta.page ?? query.page },
    result,
    error,
    mock,
    loading: canRead && !result && !error,
    refresh: () => {
      const next = new URLSearchParams(params);
      next.delete('mock');
      setParams(next, { replace: true, preventScrollReset: true });
      setRevision((value) => value + 1);
    },
  };
}
