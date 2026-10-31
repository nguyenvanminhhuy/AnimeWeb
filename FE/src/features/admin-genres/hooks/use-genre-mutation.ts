import { useEffect, useRef, useState } from 'react';
import { AdminGenreError } from '@/utils/admin-genre-validation';

export function useGenreMutation() {
  const request = useRef<AbortController | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<AdminGenreError | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  async function run<T>(task: (signal: AbortSignal) => Promise<T>, onSuccess: (result: T) => void) {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    setError(null);
    try {
      const result = await task(controller.signal);
      if (!controller.signal.aborted) onSuccess(result);
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(
          cause instanceof AdminGenreError
            ? cause
            : new AdminGenreError(
                cause instanceof Error
                  ? cause.message
                  : 'Thao tác chưa thành công. Vui lòng thử lại.',
              ),
        );
    } finally {
      if (!controller.signal.aborted) {
        request.current = null;
        setPending(false);
      }
    }
  }
  return { pending, error, run };
}
