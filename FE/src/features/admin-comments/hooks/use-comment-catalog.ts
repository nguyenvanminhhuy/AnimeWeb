import type { AdminListQuery } from '@/types/admin-query';
import { adminApiErrorMessage } from '@/utils/admin-api-error';
import { useEffect, useState } from 'react';
import { useSession } from '@/stores/session';
import { adminCommentRepository } from '@/lib/api/repositories';
import type { AdminCommentCatalog, AdminCommentPage } from '@/types/admin-comment';

export function useCommentCatalog(fail: boolean, query?: AdminListQuery) {
  const { adminPreview, permissions } = useSession();
  const canRead = Boolean(adminPreview && permissions.includes('admin:comment:read'));
  const canModerate = canRead && permissions.includes('admin:comment:moderate');
  const queryKey = JSON.stringify(query);
  const [revision, setRevision] = useState(0);
  const requestKey = JSON.stringify([adminPreview?.id, queryKey, revision, fail]);
  const [state, setState] = useState<{
    key?: string;
    data?: AdminCommentCatalog & Partial<AdminCommentPage>;
    error?: string;
    loading: boolean;
  }>({ loading: true });
  useEffect(() => {
    const controller = new AbortController();
    if (!canRead || !adminPreview) return;
    setState({ key: requestKey, loading: true });
    const request = query
      ? adminCommentRepository.list(query, controller.signal, adminPreview, fail)
      : adminCommentRepository.getCatalog(controller.signal, adminPreview, fail);
    request.then(
      (data) => {
        if (!controller.signal.aborted) setState({ key: requestKey, data, loading: false });
      },
      (error: Error) => {
        if (!controller.signal.aborted)
          setState({ key: requestKey, error: adminApiErrorMessage(error), loading: false });
      },
    );
    return () => controller.abort();
  }, [adminPreview, canRead, revision, fail, queryKey]);
  return {
    ...(state.key === requestKey ? state : { loading: canRead, data: undefined, error: undefined }),
    session: adminPreview,
    canRead,
    canModerate,
    refresh: () => setRevision((n) => n + 1),
  };
}
