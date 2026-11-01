import type { AdminPreviewSession } from '@/types/admin';
import type { AdminCommentCatalog, ModerationAction } from '@/types/admin-comment';

export interface AdminCommentRepository {
  list(
    query: import('@/types/admin-query').AdminListQuery,
    signal: AbortSignal,
    session: AdminPreviewSession,
    fail?: boolean,
  ): Promise<import('@/types/admin-comment').AdminCommentPage>;
  getById(
    id: string,
    signal: AbortSignal,
    session: AdminPreviewSession,
  ): Promise<import('@/types/admin-comment').AdminComment | null>;

  getCatalog(
    signal: AbortSignal,
    session: AdminPreviewSession,
    fail?: boolean,
  ): Promise<AdminCommentCatalog>;
  moderate(
    id: string,
    action: ModerationAction,
    reason: string,
    version: number,
    signal: AbortSignal,
    session: AdminPreviewSession,
    fail?: boolean,
  ): Promise<void>;
}
