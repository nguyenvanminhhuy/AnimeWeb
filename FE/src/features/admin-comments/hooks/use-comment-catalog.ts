import { useEffect, useState } from 'react';
import { useSession } from '@/stores/session';
import { adminCommentRepository } from '@/lib/api/repositories';
import type { AdminCommentCatalog } from '@/types/admin-comment';

export function useCommentCatalog(fail: boolean) {
  const { adminPreview, permissions } = useSession();
  const canRead = Boolean(
    import.meta.env.DEV && adminPreview && permissions.includes('admin:comment:read'),
  );
  const canModerate = canRead && permissions.includes('admin:comment:moderate');
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{
    data?: AdminCommentCatalog;
    error?: string;
    loading: boolean;
  }>({ loading: true });
  useEffect(() => {
    const controller = new AbortController();
    if (!canRead || !adminPreview) return;
    setState({ loading: true });
    adminCommentRepository.getCatalog(controller.signal, adminPreview, fail).then(
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
    canModerate,
    refresh: () => setRevision((n) => n + 1),
  };
}
