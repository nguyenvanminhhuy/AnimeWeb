import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ContentState } from '@/components/common/content-state';
import { Pagination } from '@/components/common/pagination';
import { useSession } from '@/stores/session';
import { useAdminUsers } from '@/features/admin-users/hooks/use-admin-users';
import { UsersFilters } from '@/features/admin-users/components/users-filters';
import { UsersTable } from '@/features/admin-users/components/users-table';
import { UserProfile } from '@/features/admin-users/components/user-profile';
import { UserAccessDialog } from '@/features/admin-users/components/user-access-dialog';
import type { AdminUser } from '@/types/admin-user';
import { usersHref, usersParams } from '@/features/admin-users/utils/users-query';

export function AdminUsersPage() {
  const { adminPreview } = useSession();
  return <UsersContent key={adminPreview?.id ?? 'guest'} />;
}
function UsersContent() {
  const navigate = useNavigate();
  const { adminPreview } = useSession();
  const { canRead, canWrite, query, userId, result, loading, error, mock, refresh } =
    useAdminUsers();
  const canChangeRole = canRead && !!adminPreview?.permissions.includes('admin:user:role:write');
  const [changeKind, setChangeKind] = useState<'status' | 'role'>('status');
  const [target, setTarget] = useState<AdminUser | null>(null);
  const [notice, setNotice] = useState('');
  const [profileRevision, setProfileRevision] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const closingId = useRef<string | null>(null);
  useEffect(() => {
    if (!userId && closingId.current) {
      (document.getElementById(`user-profile-${closingId.current}`) ?? heading.current)?.focus();
      closingId.current = null;
    }
  }, [userId]);
  const total = result?.meta.total ?? 0;
  return (
    <>
      <header className="tw:flex tw:justify-between tw:items-start tw:gap-4 tw:flex-wrap tw:mb-7">
        <div>
          <p className="aw-eyebrow">TÀI KHOẢN & CỘNG ĐỒNG</p>
          <h1 className="tw:text-3xl tw:max-phone:text-2xl">Quản lý người dùng</h1>
          <p className="tw:text-[var(--aw-muted)] tw:mb-0">
            Tra cứu danh sách và thông tin tài khoản cơ bản.
          </p>
        </div>
        {canRead && (
          <Button
            variant="quiet"
            label="Làm mới"
            loading={loading}
            startIcon={<Icon name="replay" size="sm" />}
            onClick={refresh}
          />
        )}
      </header>
      {!canRead ? (
        <ContentState
          title="Bạn chưa có quyền xem người dùng"
          description="Trang này yêu cầu quyền đọc người dùng quản trị."
        />
      ) : (
        <>
          <p className="tw:rounded-xl tw:border tw:border-[var(--aw-border)] tw:bg-[#a697ff0d] tw:p-4 tw:mb-6 tw:text-[var(--aw-muted)]">
            {canWrite
              ? 'Bạn có thể khoá/mở khoá tài khoản theo quyền. Thao tác đổi vai trò yêu cầu quyền riêng; không thể tự hạ quyền hoặc làm mất quản trị viên hoạt động cuối cùng.'
              : 'Bạn có quyền xem danh sách và hồ sơ; chỉ admin được khoá/mở khoá hoặc đổi vai trò tài khoản.'}
          </p>
          {notice && (
            <p role="status" className="tw:text-[#9fe3c2]">
              {notice}
            </p>
          )}
          {result && (
            <dl
              aria-label="Thống kê người dùng"
              className="tw:grid tw:grid-cols-3 tw:gap-4 tw:mb-6 tw:max-phone:grid-cols-1"
            >
              {[
                { key: 'total', label: 'Tổng tài khoản', style: 'tw:text-[#c5baff]' },
                { key: 'active', label: 'Đang hoạt động', style: 'tw:text-[#9fe3c2]' },
                { key: 'blocked', label: 'Đã khoá', style: 'tw:text-[#edacbc]' },
              ].map((item) => (
                <div key={item.key} className="aw-surface tw:rounded-xl tw:p-5">
                  <dt className="tw:font-normal tw:text-[var(--aw-muted)] tw:mb-2">{item.label}</dt>
                  <dd
                    data-user-metric={item.key}
                    className={`tw:text-3xl tw:font-semibold tw:mb-0 ${item.style}`}
                  >
                    {result.summary[item.key as keyof typeof result.summary]}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          <UsersFilters query={query} mock={mock} />
          <div
            className={`tw:grid tw:gap-6 tw:items-start ${userId ? 'tw:grid-cols-[minmax(0,1fr)_320px] tw:max-tablet:grid-cols-1' : 'tw:grid-cols-1'}`}
          >
            <section
              aria-labelledby="users-results-title"
              aria-busy={loading}
              data-admin-users={loading ? 'loading' : error ? 'error' : 'ready'}
              data-query={usersParams(query).toString()}
              className="tw:min-w-0"
            >
              <div className="tw:flex tw:justify-between tw:items-center tw:gap-3 tw:flex-wrap tw:mb-4">
                <h2
                  ref={heading}
                  tabIndex={-1}
                  id="users-results-title"
                  className="tw:text-xl tw:mb-0"
                >
                  Danh sách người dùng
                </h2>
                <p role="status" className="tw:mb-0 tw:text-[var(--aw-muted)]">
                  {loading
                    ? 'Đang tải người dùng…'
                    : error
                      ? 'Chưa tải được dữ liệu'
                      : `${total} kết quả${total ? ` · Hiển thị ${(query.page - 1) * query.pageSize + 1}–${Math.min(query.page * query.pageSize, total)}` : ''}`}
                </p>
              </div>
              <Pagination
                showSinglePage
                disabled={loading || !!error}
                pageSizeControl={{
                  value: query.pageSize,
                  options: [10, 20, 50],
                  label: 'Mỗi trang',
                  onChange: (pageSize) => {
                    if (pageSize === 10 || pageSize === 20 || pageSize === 50)
                      navigate(usersHref({ ...query, page: 1, pageSize }, mock));
                  },
                }}
                label="Phân trang người dùng phía trên"
                page={query.page}
                totalPages={result?.meta.totalPages ?? 0}
                hrefForPage={(page) => usersHref({ ...query, page }, mock, userId)}
                className="tw:mb-4"
              />
              {error ? (
                <ContentState
                  title="Chưa tải được người dùng"
                  description={error}
                  retry={refresh}
                />
              ) : loading ? (
                <div
                  role="status"
                  aria-label="Đang tải danh sách người dùng"
                  className="tw:grid tw:gap-3"
                >
                  {Array.from({ length: 5 }, (_, index) => (
                    <div key={index} className="aw-skeleton tw:h-24 tw:rounded-xl" />
                  ))}
                </div>
              ) : result?.data.length ? (
                <>
                  <UsersTable
                    users={result.data}
                    query={query}
                    mock={mock}
                    selectedId={userId}
                    currentUserId={adminPreview?.id}
                    onChangeRole={
                      canChangeRole
                        ? (user) => {
                            setNotice('');
                            setChangeKind('role');
                            setTarget(user);
                          }
                        : undefined
                    }
                    onChangeStatus={
                      canWrite
                        ? (user) => {
                            setNotice('');
                            setChangeKind('status');
                            setTarget(user);
                          }
                        : undefined
                    }
                  />
                  <Pagination
                    showSinglePage
                    label="Phân trang người dùng"
                    page={query.page}
                    totalPages={result.meta.totalPages}
                    hrefForPage={(page) => usersHref({ ...query, page }, mock, userId)}
                    className="tw:mt-6"
                  />
                </>
              ) : (
                <ContentState
                  title="Không có người dùng phù hợp"
                  description="Thử đổi từ khóa hoặc đặt lại bộ lọc để xem danh sách tài khoản."
                />
              )}
            </section>
            {userId && adminPreview && (
              <UserProfile
                revision={profileRevision}
                id={userId}
                session={adminPreview}
                closeTo={usersHref(query, mock)}
                onClose={() => {
                  closingId.current = userId;
                }}
              />
            )}
          </div>
          {target && (changeKind === 'role' ? canChangeRole : canWrite) && adminPreview && (
            <UserAccessDialog
              kind={changeKind}
              key={`${changeKind}:${target.id}:${target.version}`}
              user={target}
              session={adminPreview}
              onClose={() => setTarget(null)}
              onRefresh={() => {
                setTarget(null);
                setProfileRevision((value) => value + 1);
                refresh();
              }}
              onChanged={(user) => {
                setTarget(null);
                setNotice(
                  changeKind === 'role'
                    ? `Đã đổi vai trò tài khoản ${user.email}. Tài khoản cần đăng nhập lại.`
                    : `Đã ${user.status === 'blocked' ? 'khoá' : 'mở khoá'} tài khoản ${user.email}.`,
                );
                setProfileRevision((value) => value + 1);
                refresh();
              }}
            />
          )}
        </>
      )}
    </>
  );
}
