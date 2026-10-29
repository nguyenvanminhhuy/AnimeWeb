import { Link, Outlet, ScrollRestoration } from 'react-router-dom';
import { paths } from '@/config/paths';
import { Header } from '@/components/navigation/header';
import { useSession } from '@/stores/session';
export function MainLayout() {
  const { user, displayName, notice } = useSession();
  return (
    <>
      <a className="aw-skip tw:p-3 tw:fixed tw:left-5 tw:z-[10]" href="#main-content">
        Đến nội dung chính
      </a>
      <Header />
      {user && (
        <div className="aw-shell aw-session-note tw:py-2.5 tw:mx-auto tw:text-body">
          Phiên thành viên demo · {displayName}
        </div>
      )}
      {notice && (
        <p className="aw-shell aw-notice tw:py-2.5 tw:mx-auto tw:my-0 tw:text-body" role="status">
          {notice}
        </p>
      )}
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="aw-footer aw-shell tw:py-7 tw:mx-auto tw:gap-4.5 tw:flex tw:flex-wrap tw:items-center tw:mt-15 tw:text-body tw:max-phone:gap-2.5 tw:max-phone:flex-col tw:max-phone:items-start">
        <Link
          className="aw-brand tw:inline-flex tw:items-center tw:whitespace-nowrap"
          to={paths.home}
        >
          ✦ anime<span>web</span>
        </Link>
        <p>Một thế giới mới, trong từng thước phim.</p>
        <span>Bản demo giao diện · Nội dung và hình ảnh minh họa</span>
        <span>Chưa có nguồn phim hoặc API thực tế.</span>
      </footer>
      <ScrollRestoration />
    </>
  );
}
