import { normalizeSearch } from '@/utils/search';
import { pageRows } from '@/lib/api/mock/page';
import { assertVersion } from '@/lib/api/backend/error';
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
    rows = structuredClone(adminCommentFixtures).map((row) => ({
      ...row,
      version: 1,
      lastModeration: null,
    }));
    workspaces.set(session, rows);
  }
  return rows;
}
export const mockAdminCommentRepository: AdminCommentRepository = {
  async list(query, signal, session, fail) {
    const data = await mockAdminCommentRepository.getCatalog(signal, session, fail);
    const items = query.empty ? [] : data.comments;
    const rows = items
      .filter(
        (row) =>
          (!query.animeId || row.animeId === query.animeId) &&
          (!query.status || row.status === query.status) &&
          (!query.q ||
            normalizeSearch(
              `${row.status === 'deleted' ? '' : (row.body ?? '')} ${row.authorName} ${row.userId} ${row.id}`,
            ).includes(normalizeSearch(query.q))),
      )
      .sort((a, b) => {
        const field = query.sort === 'updated' ? 'updatedAt' : 'createdAt';
        return (
          (query.sort === 'oldest' ? 1 : -1) * (Date.parse(a[field]) - Date.parse(b[field])) ||
          a.id.localeCompare(b.id)
        );
      });
    const page = pageRows(rows, query.page, query.pageSize);
    return {
      ...data,
      comments: page.rows,
      selectedComment: data.comments.find((row) => row.id === query.commentId) ?? null,
      meta: page.meta,
      summary: {
        total: items.length,
        visible: items.filter((row) => row.status === 'visible').length,
        hidden: items.filter((row) => row.status === 'hidden').length,
        deleted: items.filter((row) => row.status === 'deleted').length,
      },
    };
  },
  async getById(id, signal, session) {
    const data = await mockAdminCommentRepository.getCatalog(signal, session);
    return data.comments.find((row) => row.id === id) ?? null;
  },

  async getCatalog(signal, session, fail) {
    workspace(session);
    await waitForAdminMock(signal, fail);
    const rows = workspace(session);
    return structuredClone({
      comments: rows.map((row) => ({
        ...row,
        version: row.version ?? 1,
        body: row.status === 'deleted' ? null : row.body,
      })),
      anime: adminCatalogWorkspace(session).anime.map((row) => ({
        id: row.anime.id,
        title: row.anime.title,
        publicSlug: row.publicSlug,
      })),
    });
  },
  async moderate(id, action, reason, version, signal, session, fail) {
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
    assertVersion(row.version ?? 1, version);
    row.version = version + 1;
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
