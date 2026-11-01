import type { AdminListQuery } from '@/types/admin-query';
import { useEffect, useState } from 'react';
import { useSession } from '@/stores/session';
import { adminPlaybackRepository } from '@/lib/api/repositories';
import type { AdminPlaybackCatalog, AdminPlaybackPage } from '@/types/admin-playback';

export function usePlaybackCatalog(fail: boolean, query?: AdminListQuery) {
  const { adminPreview, permissions } = useSession();
  const canRead = Boolean(adminPreview && permissions.includes('admin:playback:read'));
  const canWrite = canRead && permissions.includes('admin:playback:write');
  const queryKey = JSON.stringify(query);
  const [revision, setRevision] = useState(0);
  const requestKey = JSON.stringify([adminPreview?.id, queryKey, revision, fail]);
  const [state, setState] = useState<{
    key?: string;
    data?: AdminPlaybackCatalog & Partial<AdminPlaybackPage>;
    error?: string;
    loading: boolean;
  }>({ loading: true });
  useEffect(() => {
    const controller = new AbortController();
    if (!canRead || !adminPreview) return;
    setState({ key: requestKey, loading: true });
    const request = query
      ? adminPlaybackRepository.list(query, controller.signal, adminPreview, fail)
      : adminPlaybackRepository.getCatalog(controller.signal, adminPreview, fail);
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
    session: adminPreview,
    canRead,
    canWrite,
    refresh: () => setRevision((n) => n + 1),
  };
}
