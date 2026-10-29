import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { playbackRepository } from '@/lib/api/repositories';
import type { WatchDetail } from '@/types/player';

export function useWatchEpisode() {
  const { episodeId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const mock = import.meta.env.DEV ? params.get('mock') : null;
  const [attempt, setAttempt] = useState(0);
  const key = `${episodeId}:${mock}:${attempt}`;
  const [response, setResponse] = useState<{
    key: string;
    data: WatchDetail | null;
    error: string;
  } | null>(null);
  useEffect(() => {
    if (mock === 'loading') return;
    let active = true;
    playbackRepository
      .getEpisode(episodeId, mock === 'error' || mock === 'empty' ? mock : 'ready')
      .then((data) => {
        if (active) setResponse({ key, data, error: '' });
      })
      .catch(() => {
        if (active)
          setResponse({ key, data: null, error: 'Không thể tải tập phim. Vui lòng thử lại.' });
      });
    return () => {
      active = false;
    };
  }, [episodeId, mock, key]);
  const current = response?.key === key ? response : null;
  return {
    data: current?.data ?? null,
    loading: !current,
    error: current?.error ?? '',
    retry: () => {
      const next = new URLSearchParams(params);
      next.delete('mock');
      setParams(next, { replace: true, preventScrollReset: true });
      setAttempt((value) => value + 1);
    },
  };
}
