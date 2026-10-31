import { useLayoutEffect, useRef } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useAdminUser } from '@/features/admin-users/hooks/use-admin-user';
import {
  userStatusLabels,
  userStatusStyles,
  userCreatedDate,
} from '@/features/admin-users/utils/user-labels';
import type { AdminPreviewSession } from '@/types/admin';

export function UserProfile({
  id,
  session,
  closeTo,
  onClose,
}: {
  id: string;
  session: AdminPreviewSession;
  closeTo: string;
  onClose: () => void;
}) {
  const { user, loading, error, retry } = useAdminUser(id, session);
  const heading = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    heading.current?.focus();
  }, [id]);
  return (
    <section
      aria-labelledby="user-profile-title"
      aria-busy={loading}
      data-user-profile={loading ? 'loading' : error ? 'error' : user ? 'ready' : 'empty'}
      className="aw-surface tw:rounded-xl tw:p-6 tw:min-w-0 tw:self-start tw:sticky tw:top-6 tw:max-tablet:static tw:max-phone:p-4"
    >
      <div className="tw:flex tw:justify-between tw:items-start tw:gap-3 tw:mb-6">
        <h2 ref={heading} tabIndex={-1} id="user-profile-title" className="tw:text-xl tw:mb-0">
          Hồ sơ người dùng
        </h2>
        <Button
          as="link"
          variant="quiet"
          size="sm"
          to={closeTo}
          onClick={onClose}
          preventScrollReset
          aria-label="Đóng hồ sơ người dùng"
          startIcon={<Icon name="close" size="sm" />}
        />
      </div>
      {loading ? (
        <div role="status" aria-label="Đang tải hồ sơ người dùng">
          <div className="aw-skeleton tw:h-36 tw:rounded-xl tw:mb-4" />
          <p className="tw:text-[var(--aw-muted)]">Đang tải hồ sơ…</p>
        </div>
      ) : error ? (
        <div role="alert">
          <p>Chưa tải được hồ sơ người dùng.</p>
          <Button variant="quiet" label="Thử lại hồ sơ" onClick={retry} />
        </div>
      ) : !user ? (
        <div role="status">
          <h3 className="tw:text-lg">Không tìm thấy người dùng</h3>
          <p className="tw:text-[var(--aw-muted)] tw:mb-0">
            Mã người dùng không tồn tại trong dữ liệu mẫu.
          </p>
        </div>
      ) : (
        <>
          <div className="tw:flex tw:flex-col tw:items-center tw:text-center tw:gap-3 tw:mb-6">
            <Avatar name={user.displayName} size="lg" />
            <h3 className="tw:text-xl tw:mb-0 tw:break-words">{user.displayName}</h3>
            <p className="tw:mb-0 tw:text-[var(--aw-muted)] tw:break-all">{user.email}</p>
            <span className={`tw:rounded-full tw:px-3 tw:py-1 ${userStatusStyles[user.status]}`}>
              {userStatusLabels[user.status]}
            </span>
          </div>
          <dl className="tw:grid tw:gap-4 tw:mb-0">
            {[
              { label: 'Mã người dùng', value: user.id },
              { label: 'Vai trò', value: 'Thành viên' },
              { label: 'Ngày tạo', value: userCreatedDate(user.createdAt) },
            ].map((field) => (
              <div key={field.label} className="tw:border-t tw:border-[var(--aw-border)] tw:pt-4">
                <dt className="tw:font-normal tw:text-[var(--aw-muted)] tw:mb-1">{field.label}</dt>
                <dd className="tw:mb-0 tw:break-words">{field.value}</dd>
              </div>
            ))}
          </dl>
          <p className="tw:mt-6 tw:mb-0 tw:text-[var(--aw-muted)]">
            Hồ sơ mẫu chỉ đọc. Trạng thái hiển thị không thay đổi tài khoản đăng nhập hoặc quyền
            thực tế.
          </p>
        </>
      )}
    </section>
  );
}
