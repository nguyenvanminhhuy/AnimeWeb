import { ApiError } from '@/lib/api/backend/error';
import { useEffect, useRef, useState } from 'react';
import { AdminAnimeError } from '@/utils/admin-anime-validation';
import { adminApiErrorMessage } from '@/utils/admin-api-error';

export function useAdminAnimeMutation() {
  const request = useRef<AbortController | null>(null);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<ApiError | null>(null);
  const [error, setError] = useState<AdminAnimeError | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  async function run<T>(task: (signal: AbortSignal) => Promise<T>, onSuccess: (value: T) => void) {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setError(null);
    setFailure(null);
    setPending(true);
    try {
      const value = await task(controller.signal);
      if (!controller.signal.aborted) onSuccess(value);
    } catch (cause) {
      if (!controller.signal.aborted) setFailure(cause instanceof ApiError ? cause : null);
      if (!controller.signal.aborted)
        setError(
          cause instanceof ApiError
            ? new AdminAnimeError(adminApiErrorMessage(cause), {
                ...cause.fields,
                ...(cause.fields.genreIds ? { genres: cause.fields.genreIds } : {}),
              })
            : cause instanceof AdminAnimeError
              ? cause
              : new AdminAnimeError('Thao tác chưa thành công. Vui lòng thử lại.'),
        );
    } finally {
      if (!controller.signal.aborted) {
        request.current = null;
        setPending(false);
      }
    }
  }
  return { pending, error, failure, run };
}
