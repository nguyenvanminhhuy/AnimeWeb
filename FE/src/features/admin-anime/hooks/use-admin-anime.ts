import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { adminAnimeRepository } from '@/lib/api/repositories';
import { useSession } from '@/stores/session';
import type { AdminAnimeResult } from '@/types/admin-anime';
import type { MockState } from '@/lib/api/contracts/anime-repository';
import {
  adminAnimeHref,
  adminAnimeParams,
  parseAdminAnimeQuery,
} from '@/features/admin-anime/utils/admin-anime-query';

export function useAdminAnime() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { adminPreview, permissions } = useSession();
  const mock = import.meta.env.DEV ? params.get('mock') : null;
  const canRead = Boolean(
    adminPreview && permissions.includes('admin:anime:read') && mock !== 'forbidden',
  );
  const queryKey = adminAnimeParams(parseAdminAnimeQuery(params)).toString();
  const query = useMemo(() => parseAdminAnimeQuery(new URLSearchParams(queryKey)), [queryKey]);
  const state: MockState =
    mock === 'error' || mock === 'empty' || mock === 'loading' ? mock : 'ready';
  const [attempt, setAttempt] = useState(0);
  const key = `${adminPreview?.id}:${canRead}:${queryKey}:${state}:${attempt}`;
  const [response, setResponse] = useState<{
    key: string;
    resolvedKey: string;
    result: AdminAnimeResult | null;
    error: string;
  } | null>(null);
  const matches = response?.key === key || response?.resolvedKey === key;
  const result = canRead && matches ? (response?.result ?? null) : null;
  const error = canRead && matches ? (response?.error ?? '') : '';

  useEffect(() => {
    if (
      !canRead ||
      !adminPreview ||
      state === 'loading' ||
      response?.key === key ||
      response?.resolvedKey === key
    )
      return;
    const controller = new AbortController();
    adminAnimeRepository.list(query, state, controller.signal, adminPreview).then(
      (data) => {
        if (!controller.signal.aborted)
          setResponse({
            key,
            resolvedKey: `${adminPreview.id}:${canRead}:${adminAnimeParams({ ...query, page: data.meta.page })}:${state}:${attempt}`,
            result: data,
            error: '',
          });
      },
      () => {
        if (!controller.signal.aborted)
          setResponse({
            key,
            resolvedKey: key,
            result: null,
            error: 'Không thể tải danh sách phim. Vui lòng thử lại.',
          });
      },
    );
    return () => controller.abort();
  }, [canRead, key, query, state, attempt, response, adminPreview]);

  const resolvedPage = result
    ? Math.min(query.page, Math.max(1, result.meta.totalPages))
    : query.page;
  const canonicalHref = result ? adminAnimeHref({ ...query, page: resolvedPage }, mock) : null;
  useEffect(() => {
    if (canonicalHref && canonicalHref !== location.pathname + location.search)
      navigate(canonicalHref + location.hash, { replace: true, preventScrollReset: true });
  }, [canonicalHref, location.pathname, location.search, location.hash, navigate]);

  return {
    canRead,
    query: { ...query, page: resolvedPage },
    result,
    error,
    mock,
    loading: canRead && !result && !error,
    refresh: () => {
      const next = new URLSearchParams(params);
      next.delete('mock');
      setParams(next, { replace: true, preventScrollReset: true });
      setAttempt((value) => value + 1);
    },
  };
}
