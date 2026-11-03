import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import type { AdminUser, AdminUsersQuery } from '@/types/admin-user';
import { usersHref } from '@/features/admin-users/utils/users-query';
import {
  userStatusLabels,
  userStatusStyles,
  userCreatedDate,
  userRoleLabels,
} from '@/features/admin-users/utils/user-labels';

export function UsersTable({
  users,
  query,
  mock,
  selectedId,
  currentUserId,
  onChangeStatus,
  onChangeRole,
}: {
  users: AdminUser[];
  query: AdminUsersQuery;
  mock: string | null;
  selectedId: string | null;
  currentUserId?: string;
  onChangeStatus?: (user: AdminUser) => void;
  onChangeRole?: (user: AdminUser) => void;
}) {
  return (
    <div
      role="region"
      aria-label="Bảng người dùng"
      tabIndex={0}
      className="aw-surface tw:rounded-xl tw:border tw:border-[var(--aw-border)] tw:overflow-x-auto"
    >
      <table className="tw:w-full tw:min-w-215 tw:mb-0 tw:text-left tw:align-middle">
        <caption className="visually-hidden">Danh sách tài khoản và trạng thái truy cập</caption>
        <thead className="tw:bg-[#ffffff04] tw:text-[var(--aw-muted)]">
          <tr>
            {['Người dùng', 'Trạng thái', 'Vai trò', 'Ngày tạo', 'Thao tác'].map((label) => (
              <th key={label} scope="col" className="tw:p-4 tw:font-medium tw:whitespace-nowrap">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              data-user-id={user.id}
              className={`tw:border-t tw:border-[var(--aw-border)] ${selectedId === user.id ? 'tw:bg-[#a697ff0d]' : 'tw:hover:bg-[#ffffff03]'}`}
            >
              <th scope="row" className="tw:p-4 tw:font-normal tw:min-w-65">
                <div className="tw:flex tw:gap-3 tw:items-center">
                  <Avatar name={user.displayName} src={user.avatarUrl} />
                  <div>
                    <p className="tw:font-semibold tw:mb-1">{user.displayName}</p>
                    <p className="tw:mb-0 tw:text-[var(--aw-muted)] tw:break-all">{user.email}</p>
                    <span className="tw:text-[var(--aw-muted)]">{user.id}</span>
                  </div>
                </div>
              </th>
              <td className="tw:p-4">
                <span
                  className={`tw:inline-block tw:rounded-full tw:px-3 tw:py-1 tw:whitespace-nowrap ${userStatusStyles[user.status]}`}
                >
                  {userStatusLabels[user.status]}
                </span>
              </td>
              <td className="tw:p-4 tw:whitespace-nowrap">
                {user.roles.map((role) => userRoleLabels[role]).join(', ')}
              </td>
              <td className="tw:p-4 tw:whitespace-nowrap">
                <time dateTime={user.createdAt}>{userCreatedDate(user.createdAt)}</time>
              </td>
              <td className="tw:p-4">
                <div className="tw:inline-flex tw:flex-nowrap tw:items-center tw:gap-2">
                  <Button
                    id={`user-profile-${user.id}`}
                    as="link"
                    variant="quiet"
                    size="sm"
                    startIcon={<Icon name="eye" size="sm" />}
                    aria-label={`Xem hồ sơ ${user.displayName}`}
                    title={`Xem hồ sơ ${user.displayName}`}
                    aria-current={selectedId === user.id ? 'true' : undefined}
                    to={usersHref(query, mock, user.id)}
                    preventScrollReset
                  />
                  {onChangeRole && (
                    <Button
                      variant="quiet"
                      size="sm"
                      startIcon={<Icon name="edit" size="sm" />}
                      aria-label={`Đổi vai trò ${user.email}`}
                      title={
                        user.id === currentUserId
                          ? 'Không thể tự hạ quyền'
                          : `Đổi vai trò ${user.email}`
                      }
                      disabled={user.id === currentUserId}
                      onClick={() => onChangeRole(user)}
                    />
                  )}
                  {onChangeStatus && (
                    <Button
                      variant="quiet"
                      size="sm"
                      startIcon={
                        <Icon name={user.status === 'active' ? 'lock' : 'unlock'} size="sm" />
                      }
                      aria-label={`${user.status === 'active' ? 'Khoá' : 'Mở khoá'} tài khoản ${user.email}`}
                      title={
                        user.id === currentUserId
                          ? 'Không thể tự khoá tài khoản'
                          : `${user.status === 'active' ? 'Khoá' : 'Mở khoá'} tài khoản ${user.email}`
                      }
                      disabled={user.id === currentUserId}
                      onClick={() => onChangeStatus(user)}
                    />
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
