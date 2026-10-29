import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import type { AnimeDetail } from '@/types/anime';
import { animeRepository } from '@/lib/api/repositories';

export function useAnimeDetail() {
  const { slug = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const mock = import.meta.env.DEV ? params.get('mock') : null;
  const [attempt, setAttempt] = useState(0);
  const key = `${slug}:${mock}:${attempt}`;
  const [response, setResponse] = useState<{
    key: string;
    data: AnimeDetail | null;
    error: string;
  } | null>(null);
  useEffect(() => {
    if (mock === 'loading') return;
    let active = true;
    animeRepository
      .getBySlug(slug, mock === 'error' || mock === 'empty' ? mock : 'ready')
      .then((data) => {
        if (active) setResponse({ key, data, error: '' });
      })
      .catch(() => {
        if (active)
          setResponse({
            key,
            data: null,
            error: 'Không thể tải chi tiết anime. Vui lòng thử lại.',
          });
      });
    return () => {
      active = false;
    };
  }, [slug, mock, key]);
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
