import type { AdminCommentRepository } from '@/lib/api/contracts/admin-comment-repository';
import type { AdminPreviewSession } from '@/types/admin';
import type { Comment } from '@/types/comment';
import type { CommentModeration } from '@/types/admin-comment';
import { adminCommentFixtures } from '@/testing/mocks/fixtures/admin-comments';
import { adminCatalogWorkspace } from '@/lib/api/mock/admin-catalog-workspace';
import { waitForAdminMock } from '@/lib/api/mock/admin-anime-workspace';
import { moderationReasonError } from '@/utils/admin-comment-validation';

const workspaces = new WeakMap<
  AdminPreviewSession,
  (Comment & { lastModeration: CommentModeration | null })[]
>();
function workspace(session: AdminPreviewSession, write = false) {
  if (
    !import.meta.env.DEV ||
    !session.permissions.includes('admin:comment:read') ||
    (write && !session.permissions.includes('admin:comment:moderate'))
  )
    throw new Error('Bạn chưa có quyền kiểm duyệt bình luận.');
  let rows = workspaces.get(session);
  if (!rows) {
    rows = structuredClone(adminCommentFixtures).map((row) => ({ ...row, lastModeration: null }));
    workspaces.set(session, rows);
  }
  return rows;
}
export const mockAdminCommentRepository: AdminCommentRepository = {
  async getCatalog(signal, session, fail) {
    workspace(session);
    await waitForAdminMock(signal, fail);
    const rows = workspace(session);
    return structuredClone({
      comments: rows.map((row) => ({ ...row, body: row.status === 'deleted' ? null : row.body })),
      anime: adminCatalogWorkspace(session).anime.map((row) => ({
        id: row.anime.id,
        title: row.anime.title,
        publicSlug: row.publicSlug,
      })),
    });
  },
  async moderate(id, action, reason, signal, session, fail) {
    workspace(session, true);
    await waitForAdminMock(signal, fail);
    const rows = workspace(session, true);
    const error = moderationReasonError(reason);
    if (error) throw new Error(error);
    if (!['hide', 'restore'].includes(action))
      throw new Error('Hành động kiểm duyệt không hợp lệ.');
    const row = rows.find((item) => item.id === id);
    if (!row) throw new Error('Không tìm thấy bình luận.');
    if (row.status === 'deleted')
      throw new Error('Bình luận đã xoá không thể được kiểm duyệt hoặc khôi phục.');
    if (
      (action === 'hide' && row.status !== 'visible') ||
      (action === 'restore' && row.status !== 'hidden')
    )
      throw new Error('Trạng thái bình luận đã thay đổi. Hãy làm mới danh sách.');
    const time = new Date().toISOString();
    row.status = action === 'hide' ? 'hidden' : 'visible';
    row.updatedAt = time;
    row.lastModeration = {
      action,
      reason: reason.trim(),
      moderatorName: session.displayName,
      moderatedAt: time,
    };
  },
};
