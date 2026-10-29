import { Link, Outlet, ScrollRestoration } from 'react-router-dom';
import { paths } from '../routes/paths';
import { Header } from '../components/navigation/Header';
import { useSession } from '../features/auth/SessionProvider';
export function MainLayout() {
  const { user, displayName, notice } = useSession();
  return (
    <>
      <a className="aw-skip" href="#main-content">
        Đến nội dung chính
      </a>
      <Header />
      {user && (
        <div className="aw-shell aw-session-note">Phiên thành viên demo · {displayName}</div>
      )}
      {notice && (
        <p className="aw-shell aw-notice" role="status">
          {notice}
        </p>
      )}
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="aw-footer aw-shell">
        <Link className="aw-brand" to={paths.home}>
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
