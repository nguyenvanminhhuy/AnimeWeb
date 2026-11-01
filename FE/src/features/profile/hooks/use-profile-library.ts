import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSession } from '@/stores/session';
import { personalRepository } from '@/lib/api/repositories';
import type { ProfileSummary } from '@/types/personal';
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
  const key = JSON.stringify([user, canRead, favorites, progress, mock, attempt]);
  const [response, setResponse] = useState<{
    key: string;
    summary?: ProfileSummary;
    error: string;
  } | null>(null);
  useEffect(() => {
    if (!user || !canRead || mock === 'loading') return;
    const controller = new AbortController();
    personalRepository
      .summary({ id: user, permissions }, controller.signal)
      .then((summary) => {
        if (mock === 'error') throw new Error('Không thể tải nội dung thư viện. Hãy thử lại.');
        if (!controller.signal.aborted)
          setResponse({
            key,
            summary:
              mock === 'empty'
                ? {
                    ...summary,
                    favoriteAnimeCount: 0,
                    inProgressEpisodeCount: 0,
                    completedEpisodeCount: 0,
                    historyEpisodeCount: 0,
                    favoriteAnime: [],
                    preview: [],
                  }
                : summary,
            error: '',
          });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setResponse({ key, error: error.message });
      });
    return () => controller.abort();
  }, [key]);
  const current = response?.key === key ? response : null;
  const summary = current?.summary;
  return {
    canRead,
    summary,
    data: summary
      ? [
          ...new Map(
            [...summary.favoriteAnime, ...summary.preview.map((row) => row.anime)].map((row) => [
              row.id,
              row,
            ]),
          ).values(),
        ]
      : [],
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
