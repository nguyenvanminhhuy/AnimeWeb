import type { AdminListQuery } from '@/types/admin-query';
import { useEffect, useState } from 'react';
import { useSession } from '@/stores/session';
import { adminEpisodeRepository } from '@/lib/api/repositories';
import type { AdminEpisodeCatalog, AdminEpisodePage } from '@/types/admin-episode';

export function useEpisodeCatalog(
  fail = false,
  query?: AdminListQuery,
  form?: { episodeId?: string; animeId?: string; seasonId?: string },
) {
  const { adminPreview, permissions } = useSession();
  const canRead = Boolean(adminPreview && permissions.includes('admin:episode:read'));
  const canWrite = canRead && permissions.includes('admin:episode:write');
  const queryKey = JSON.stringify([query, form]);
  const [revision, setRevision] = useState(0);
  const requestKey = JSON.stringify([adminPreview?.id, queryKey, revision, fail]);
  const [state, setState] = useState<{
    key?: string;
    data?: AdminEpisodeCatalog & Partial<AdminEpisodePage>;
    error?: string;
    loading: boolean;
  }>({ loading: true });
  useEffect(() => {
    const controller = new AbortController();
    if (!canRead || !adminPreview) return;
    setState({ key: requestKey, loading: true });
    const request = query
      ? adminEpisodeRepository.list(query, controller.signal, adminPreview, fail)
      : adminEpisodeRepository.getCatalog(controller.signal, adminPreview, fail, form);
    request.then(
      (data) => {
        if (!controller.signal.aborted) setState({ key: requestKey, data, loading: false });
      },
      (error: Error) => {
        if (!controller.signal.aborted)
          setState({ key: requestKey, error: error.message, loading: false });
      },
    );
    return () => controller.abort();
  }, [adminPreview, canRead, revision, fail, queryKey]);
  return {
    ...(state.key === requestKey ? state : { loading: canRead, data: undefined, error: undefined }),
    canRead,
    canWrite,
    session: adminPreview,
    refresh: () => setRevision((n) => n + 1),
  };
}
