import { useEffect, useState } from 'react';
import { adminGenreRepository } from '@/lib/api/repositories';
import type { AdminPreviewSession } from '@/types/admin';
import type { AdminGenre } from '@/types/admin-genre';

export function useAnimeGenreOptions(session: AdminPreviewSession) {
  const [genres, setGenres] = useState<AdminGenre[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setGenres(null);
    setError(false);
    adminGenreRepository.options(controller.signal, session).then(
      (data) => {
        if (!controller.signal.aborted) setGenres(data);
      },
      () => {
        if (!controller.signal.aborted) setError(true);
      },
    );
    return () => controller.abort();
  }, [session, attempt]);
  return { genres, error, retry: () => setAttempt((value) => value + 1) };
}
