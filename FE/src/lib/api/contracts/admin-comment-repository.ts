import type { AdminPreviewSession } from '@/types/admin';
import type { AdminCommentCatalog, ModerationAction } from '@/types/admin-comment';

export interface AdminCommentRepository {
  getCatalog(
    signal: AbortSignal,
    session: AdminPreviewSession,
    fail?: boolean,
  ): Promise<AdminCommentCatalog>;
  moderate(
    id: string,
    action: ModerationAction,
    reason: string,
    signal: AbortSignal,
    session: AdminPreviewSession,
    fail?: boolean,
  ): Promise<void>;
}
