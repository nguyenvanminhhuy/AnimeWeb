import type { AdminUserRepository } from '@/lib/api/contracts/admin-user-repository';
import type { AdminPreviewSession } from '@/types/admin';
import { adminUsers } from '@/testing/mocks/fixtures/admin-users';
import { waitForAdminMock } from '@/lib/api/mock/admin-anime-workspace';
import { normalizeSearch } from '@/utils/search';
import { ApiError, assertVersion } from '@/lib/api/backend/error';
const workspaces = new Map<string, typeof adminUsers>();
function workspace(session: AdminPreviewSession) {
  if (!workspaces.has(session.id)) workspaces.set(session.id, structuredClone(adminUsers));
  return workspaces.get(session.id)!;
}

function authorize(session: AdminPreviewSession, write = false) {
  if (!import.meta.env.DEV || !session.permissions.includes('admin:user:read'))
    throw new Error('Bạn không có quyền đọc người dùng.');
  if (write && !session.permissions.includes('admin:user:status:write'))
    throw new ApiError(403, 'FORBIDDEN', 'Bạn không có quyền thay đổi trạng thái.');
}
export const mockAdminUserRepository: AdminUserRepository = {
  async setRole(id, role, version, signal, session) {
    const authorizeRole = () => {
      authorize(session);
      if (!session.permissions.includes('admin:user:role:write'))
        throw new ApiError(403, 'FORBIDDEN', 'Bạn không có quyền thay đổi vai trò.');
    };
    authorizeRole();
    await waitForAdminMock(signal, false);
    authorizeRole();
    if (!['user', 'manage', 'admin'].includes(role))
      throw new ApiError(400, 'VALIDATION_ERROR', 'Vai trò không hợp lệ.');
    const items = workspace(session);
    const user = items.find((row) => row.id === id);
    if (!user) throw new ApiError(404, 'NOT_FOUND', 'Không tìm thấy tài khoản.');
    assertVersion(user.version, version);
    if (id === session.id && role !== 'admin')
      throw new ApiError(409, 'SELF_ROLE_CHANGE_NOT_ALLOWED', 'Không thể tự hạ quyền.');
    if (
      role !== 'admin' &&
      user.status === 'active' &&
      user.roles.includes('admin') &&
      items.filter((row) => row.status === 'active' && row.roles.includes('admin')).length <= 1
    )
      throw new ApiError(409, 'LAST_ACTIVE_ADMIN', 'Không thể hạ quyền quản trị viên cuối cùng.');
    if (user.roles.length !== 1 || user.roles[0] !== role) {
      user.roles = [role];
      user.version++;
    }
    return structuredClone(user);
  },
  async setStatus(id, status, version, signal, session) {
    authorize(session, true);
    await waitForAdminMock(signal, false);
    authorize(session, true);
    if (status !== 'active' && status !== 'blocked')
      throw new ApiError(400, 'VALIDATION_ERROR', 'Trạng thái không hợp lệ.');
    const user = workspace(session).find((row) => row.id === id);
    if (!user) throw new ApiError(404, 'NOT_FOUND', 'Không tìm thấy tài khoản.');
    assertVersion(user.version, version);
    if (id === session.id && status === 'blocked')
      throw new ApiError(409, 'SELF_BLOCK_NOT_ALLOWED', 'Không thể tự khoá tài khoản.');
    if (
      status === 'blocked' &&
      user.status === 'active' &&
      user.roles.includes('admin') &&
      workspace(session).filter((row) => row.status === 'active' && row.roles.includes('admin'))
        .length <= 1
    )
      throw new ApiError(409, 'LAST_ACTIVE_ADMIN', 'Không thể khoá quản trị viên cuối cùng.');
    if (user.status !== status) {
      user.status = status;
      user.version++;
    }
    return structuredClone(user);
  },
  async list(query, state, signal, session) {
    authorize(session);
    await waitForAdminMock(signal, state === 'error');
    authorize(session);
    const items = state === 'empty' ? [] : workspace(session);
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
      state === 'empty' ? null : (workspace(session).find((user) => user.id === id) ?? null),
    );
  },
};
