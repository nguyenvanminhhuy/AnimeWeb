import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminDashboardRepository } from '@/lib/api/repositories';
import type { AdminDashboardData } from '@/types/admin';

export function useAdminDashboard() {
  const [params, setParams] = useSearchParams();
  const mock = import.meta.env.DEV ? params.get('mock') : null;
  const [revision, setRevision] = useState(0);
  const key = `${mock}:${revision}`;
  const [response, setResponse] = useState<{
    key: string;
    data: AdminDashboardData | null;
    error: string;
  } | null>(null);
  useEffect(() => {
    if (mock === 'loading') return;
    const controller = new AbortController();
    adminDashboardRepository
      .getOverview(mock === 'error' || mock === 'empty' ? mock : 'ready', controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setResponse({ key, data, error: '' });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setResponse({ key, data: null, error: 'Không thể tải tổng quan. Vui lòng thử lại.' });
      });
    return () => controller.abort();
  }, [mock, key]);
  const current = response?.key === key ? response : null;
  return {
    data: current?.data ?? null,
    loading: !current,
    error: current?.error ?? '',
    refresh: () => {
      const updated = new URLSearchParams(params);
      updated.delete('mock');
      setParams(updated, { replace: true, preventScrollReset: true });
      setRevision((value) => value + 1);
    },
  };
}
