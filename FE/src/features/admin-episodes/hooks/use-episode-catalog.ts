import { useEffect, useState } from 'react';
import { useSession } from '@/stores/session';
import { adminEpisodeRepository } from '@/lib/api/repositories';
import type { AdminEpisodeCatalog } from '@/types/admin-episode';

export function useEpisodeCatalog(fail = false) {
  const { adminPreview, permissions } = useSession();
  const canRead = Boolean(
    import.meta.env.DEV && adminPreview && permissions.includes('admin:episode:read'),
  );
  const canWrite = canRead && permissions.includes('admin:episode:write');
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{
    data?: AdminEpisodeCatalog;
    error?: string;
    loading: boolean;
  }>({ loading: true });
  useEffect(() => {
    const controller = new AbortController();
    if (!canRead || !adminPreview) return;
    setState({ loading: true });
    adminEpisodeRepository.getCatalog(controller.signal, adminPreview, fail).then(
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
    canRead,
    canWrite,
    session: adminPreview,
    refresh: () => setRevision((n) => n + 1),
  };
}
