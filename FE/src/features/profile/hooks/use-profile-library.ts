import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSession } from '@/stores/session';
import { animeRepository } from '@/lib/api/repositories';
import type { Anime } from '@/types/anime';

export function useProfileLibrary() {
  const { user, permissions, favorites, progress } = useSession();
  const [params, setParams] = useSearchParams();
  const mock = import.meta.env.DEV ? params.get('mock') : null;
  const canRead =
    !!user &&
    permissions.includes('library:read:own') &&
    permissions.includes('progress:read:own') &&
    mock !== 'forbidden';
  const [attempt, setAttempt] = useState(0);
  const idsKey = JSON.stringify(
    [...new Set([...favorites, ...progress.map((entry) => entry.animeId)])].sort(),
  );
  const ids = useMemo<string[]>(() => JSON.parse(idsKey), [idsKey]);
  const key = `${user}:${canRead}:${idsKey}:${mock}:${attempt}`;
  const [response, setResponse] = useState<{ key: string; data: Anime[]; error: string } | null>(
    null,
  );
  useEffect(() => {
    if (!canRead || mock === 'loading') return;
    let active = true;
    animeRepository
      .getByIds(ids, mock === 'error' || mock === 'empty' ? mock : 'ready')
      .then((data) => {
        if (active) setResponse({ key, data, error: '' });
      })
      .catch(() => {
        if (active)
          setResponse({ key, data: [], error: 'Không thể tải nội dung thư viện. Hãy thử lại.' });
      });
    return () => {
      active = false;
    };
  }, [key, ids, canRead, mock]);
  const current = response?.key === key ? response : null;
  return {
    canRead,
    data: current?.data ?? [],
    loading: canRead && !current,
    error: current?.error ?? '',
    retry: () => {
      const next = new URLSearchParams(params);
      next.delete('mock');
      setParams(next, { replace: true, preventScrollReset: true });
      setAttempt((value) => value + 1);
    },
  };
}
