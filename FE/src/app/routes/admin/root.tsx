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
import { paths, routePatterns } from '@/config/paths';

export function AdminRoot() {
  const { user, adminPreview, permissions, displayName, logout, notice } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = useMatch({ path: paths.admin, end: true });
  const isAnime = useMatch({ path: paths.adminAnime + '/*', end: false });
  const isNew = useMatch(routePatterns.adminAnimeNew);
  const isEdit = useMatch(routePatterns.adminAnimeEdit);
  const isGenres = useMatch(routePatterns.adminGenres);
  const isUsers = useMatch(routePatterns.adminUsers);
  const isEpisodes = useMatch({ path: paths.adminEpisodes + '/*', end: false });
  const isPlayback = useMatch(routePatterns.adminPlayback);
  const isComments = useMatch(routePatterns.adminComments);
  const returnTo = location.pathname + location.search + location.hash;
  const canRead =
    import.meta.env.DEV &&
    adminPreview &&
    permissions.includes(
      isComments
        ? 'admin:comment:read'
        : isPlayback
          ? 'admin:playback:read'
          : isEpisodes
            ? 'admin:episode:read'
            : isUsers
              ? 'admin:user:read'
              : isGenres
                ? 'admin:genre:read'
                : isAnime
                  ? 'admin:anime:read'
                  : 'admin:dashboard:read',
    );
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
              ? 'Tài khoản hiện tại không có quyền đọc trang quản trị này. Thành viên không tự được cấp quyền quản trị.'
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
      pageLabel={
        isComments
          ? 'Quản lý bình luận'
          : isPlayback
            ? 'Nguồn phát và phụ đề'
            : isEpisodes
              ? 'Mùa/phần và tập phim'
              : isDashboard
                ? 'Tổng quan'
                : isNew
                  ? 'Thêm phim'
                  : isEdit
                    ? 'Sửa phim'
                    : isAnime
                      ? 'Quản lý anime'
                      : isGenres
                        ? 'Quản lý thể loại'
                        : isUsers
                          ? 'Quản lý người dùng'
                          : 'Không tìm thấy'
      }
      previewWritable={
        permissions.includes('admin:anime:write') ||
        permissions.includes('admin:genre:write') ||
        permissions.includes('admin:episode:write') ||
        permissions.includes('admin:playback:write') ||
        permissions.includes('admin:comment:moderate')
      }
      menu={[
        ...(permissions.includes('admin:dashboard:read')
          ? [{ label: 'Dashboard', to: paths.admin, icon: 'history' as const, end: true }]
          : []),
        ...(permissions.includes('admin:anime:read')
          ? [{ label: 'Quản lý anime', to: paths.adminAnime, icon: 'play' as const }]
          : []),
        ...(permissions.includes('admin:episode:read')
          ? [{ label: 'Mùa/phần và tập phim', to: paths.adminEpisodes, icon: 'play' as const }]
          : []),
        ...(permissions.includes('admin:genre:read')
          ? [{ label: 'Quản lý thể loại', to: paths.adminGenres, icon: 'tags' as const, end: true }]
          : []),
        ...(permissions.includes('admin:playback:read')
          ? [
              {
                label: 'Nguồn phát và phụ đề',
                to: paths.adminPlayback,
                icon: 'play' as const,
                end: true,
              },
            ]
          : []),
        ...(permissions.includes('admin:user:read')
          ? [
              {
                label: 'Quản lý người dùng',
                to: paths.adminUsers,
                icon: 'users' as const,
                end: true,
              },
            ]
          : []),
        ...(permissions.includes('admin:comment:read')
          ? [
              {
                label: 'Quản lý bình luận',
                to: paths.adminComments,
                icon: 'users' as const,
                end: true,
              },
            ]
          : []),
      ]}
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
