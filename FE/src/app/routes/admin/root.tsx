import {
  Link,
  Outlet,
  ScrollRestoration,
  useLocation,
  useNavigate,
  useMatch,
} from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { useSession } from '@/stores/session';
import { paths } from '@/config/paths';

export function AdminRoot() {
  const { user, adminPreview, permissions, displayName, logout, notice } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = useMatch({ path: paths.admin, end: true });
  const returnTo = location.pathname + location.search + location.hash;
  const canRead =
    import.meta.env.DEV && adminPreview && permissions.includes('admin:dashboard:read');
  if (!canRead)
    return (
      <main className="tw:min-h-screen tw:grid tw:place-items-center tw:p-6 tw:bg-[var(--aw-background)]">
        <section className="aw-surface tw:rounded-2xl tw:p-8 tw:max-w-140 tw:w-full tw:text-center tw:max-phone:p-5">
          <Link
            to={paths.home}
            className="tw:text-xl tw:font-bold tw:text-[var(--aw-accent)] tw:inline-block tw:mb-6"
          >
            Anime Web
          </Link>
          <h1 className="tw:text-2xl tw:mb-4">
            {user || adminPreview ? 'Bạn chưa có quyền quản trị' : 'Đăng nhập để mở trang quản trị'}
          </h1>
          <p className="tw:text-[var(--aw-muted)] tw:mb-6">
            {user
              ? 'Tài khoản hiện tại không có quyền đọc Dashboard. Thành viên không tự được cấp quyền quản trị.'
              : 'Khu vực này yêu cầu quyền quản trị. Giao diện xem phim vẫn có thể truy cập bình thường.'}
          </p>
          <div className="tw:flex tw:gap-3 tw:justify-center tw:flex-wrap">
            {user || adminPreview ? (
              <Button
                label="Đổi phiên đăng nhập"
                onClick={() => {
                  logout();
                  navigate(paths.loginTo(returnTo));
                }}
              />
            ) : (
              <Button as="link" to={paths.loginTo(returnTo)} label="Đăng nhập" />
            )}
            <Button as="link" variant="quiet" to={paths.home} label="Về Trang chủ" />
          </div>
          {import.meta.env.DEV && (
            <p className="tw:text-[var(--aw-muted)] tw:mt-6 tw:mb-0">
              Khi thử giao diện, chọn “Dùng phiên quản trị mẫu” trên trang đăng nhập. Phiên chỉ tồn
              tại trong lần mở này.
            </p>
          )}
        </section>
      </main>
    );
  return (
    <AdminLayout
      displayName={displayName}
      pageLabel={isDashboard ? 'Tổng quan' : 'Không tìm thấy'}
      menu={[{ label: 'Dashboard', to: paths.admin, icon: 'history', end: true }]}
      onLogout={() => {
        logout();
        navigate(paths.loginTo(paths.admin), { replace: true });
      }}
    >
      {notice && (
        <p role="status" className="tw:mb-4 tw:text-[var(--aw-muted)]">
          {notice}
        </p>
      )}
      <Outlet />
      <ScrollRestoration />
    </AdminLayout>
  );
}
