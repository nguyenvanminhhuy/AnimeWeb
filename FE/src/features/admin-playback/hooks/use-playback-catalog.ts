import { useEffect, useState } from 'react';
import { useSession } from '@/stores/session';
import { adminPlaybackRepository } from '@/lib/api/repositories';
import type { AdminPlaybackCatalog } from '@/types/admin-playback';

export function usePlaybackCatalog(fail: boolean) {
  const { adminPreview, permissions } = useSession();
  const canRead = Boolean(
    import.meta.env.DEV && adminPreview && permissions.includes('admin:playback:read'),
  );
  const canWrite = canRead && permissions.includes('admin:playback:write');
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{
    data?: AdminPlaybackCatalog;
    error?: string;
    loading: boolean;
  }>({ loading: true });
  useEffect(() => {
    const controller = new AbortController();
    if (!canRead || !adminPreview) return;
    setState({ loading: true });
    adminPlaybackRepository.getCatalog(controller.signal, adminPreview, fail).then(
      (data) => {
        if (!controller.signal.aborted) setState({ data, loading: false });
      },
      (error: Error) => {
        if (!controller.signal.aborted) setState({ error: error.message, loading: false });
      },
    );
    return () => controller.abort();
  }, [adminPreview, canRead, revision, fail]);
  return {
    ...state,
    session: adminPreview,
    canRead,
    canWrite,
    refresh: () => setRevision((n) => n + 1),
  };
}
