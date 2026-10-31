import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminUserRepository } from '@/lib/api/repositories';
import type { AdminPreviewSession } from '@/types/admin';
import type { AdminUser } from '@/types/admin-user';

export function useAdminUser(id: string, session: AdminPreviewSession) {
  const [params, setParams] = useSearchParams();
  const mock = import.meta.env.DEV ? params.get('mock') : null;
  const [attempt, setAttempt] = useState(0);
  const key = `${session.id}:${id}:${mock}:${attempt}`;
  const [response, setResponse] = useState<{
    key: string;
    data: AdminUser | null;
    error: boolean;
  } | null>(null);
  useEffect(() => {
    if (mock === 'detail-loading') return;
    const controller = new AbortController();
    adminUserRepository
      .getById(
        id,
        mock === 'detail-error' ? 'error' : mock === 'detail-empty' ? 'empty' : 'ready',
        controller.signal,
        session,
      )
      .then(
        (data) => {
          if (!controller.signal.aborted) setResponse({ key, data, error: false });
        },
        () => {
          if (!controller.signal.aborted) setResponse({ key, data: null, error: true });
        },
      );
    return () => controller.abort();
  }, [id, session, key, mock]);
  const current = response?.key === key ? response : null;
  return {
    user: current?.data ?? null,
    loading: !current,
    error: current?.error ?? false,
    retry: () => {
      const next = new URLSearchParams(params);
      next.delete('mock');
      setParams(next, { replace: true, preventScrollReset: true });
      setAttempt((value) => value + 1);
    },
  };
}
