import type { AdminUserRepository } from '@/lib/api/contracts/admin-user-repository';
import type { AdminPreviewSession } from '@/types/admin';
import { adminUsers } from '@/testing/mocks/fixtures/admin-users';
import { waitForAdminMock } from '@/lib/api/mock/admin-anime-workspace';
import { normalizeSearch } from '@/utils/search';

function authorize(session: AdminPreviewSession) {
  if (!import.meta.env.DEV || !session.permissions.includes('admin:user:read'))
    throw new Error('Bạn không có quyền đọc người dùng.');
}
export const mockAdminUserRepository: AdminUserRepository = {
  async list(query, state, signal, session) {
    authorize(session);
    await waitForAdminMock(signal, state === 'error');
    authorize(session);
    const items = state === 'empty' ? [] : adminUsers;
    const search = normalizeSearch(query.q);
    const filtered = items
      .filter(
        (user) =>
          (!search ||
            normalizeSearch(`${user.displayName} ${user.email} ${user.id}`).includes(search)) &&
          (!query.status || user.status === query.status),
      )
      .sort((a, b) =>
        query.sort === 'name'
          ? a.displayName.localeCompare(b.displayName, 'vi') || a.id.localeCompare(b.id)
          : (query.sort === 'oldest' ? 1 : -1) * a.createdAt.localeCompare(b.createdAt) ||
            a.id.localeCompare(b.id),
      );
    const total = filtered.length;
    const totalPages = Math.ceil(total / query.pageSize);
    const page = Math.min(query.page, Math.max(1, totalPages));
    return structuredClone({
      data: filtered.slice((page - 1) * query.pageSize, page * query.pageSize),
      meta: { total, totalPages, page, pageSize: query.pageSize },
      summary: {
        total: items.length,
        active: items.filter((user) => user.status === 'active').length,
        blocked: items.filter((user) => user.status === 'blocked').length,
      },
    });
  },
  async getById(id, state, signal, session) {
    authorize(session);
    await waitForAdminMock(signal, state === 'error');
    authorize(session);
    return structuredClone(
      state === 'empty' ? null : (adminUsers.find((user) => user.id === id) ?? null),
    );
  },
};
