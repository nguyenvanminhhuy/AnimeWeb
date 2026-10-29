import { useSession } from '../../features/auth/SessionProvider';
import { Form, Link, NavLink, useLocation, useMatch } from 'react-router-dom';
import { paths, routePatterns, safeReturnTo } from '../../routes/paths';
export function Header() {
  const { user, logout } = useSession();
  const { pathname, search } = useLocation();
  const loginMatch = useMatch(routePatterns.login);
  const registerMatch = useMatch(routePatterns.register);
  const returnTo =
    loginMatch || registerMatch
      ? safeReturnTo(new URLSearchParams(search).get('returnTo'))
      : pathname + search;
  return (
    <header className="aw-header">
      <div className="aw-shell aw-header-inner">
        <Link className="aw-brand" to={paths.home} aria-label="Anime Web — Trang chủ">
          <span className="aw-brand-mark" aria-hidden="true">
            ✦
          </span>
          anime<span>web</span>
          <span className="aw-demo">DEMO</span>
        </Link>
        <nav className="aw-nav" aria-label="Điều hướng chính">
          <NavLink to={paths.home} end>
            Trang chủ
          </NavLink>
          <NavLink to={paths.explore}>Khám phá</NavLink>
          {user ? (
            <NavLink to={paths.library}>Thư viện</NavLink>
          ) : (
            <Link to={paths.loginTo(paths.library)}>Thư viện</Link>
          )}
        </nav>
        <Form className="aw-search" action={paths.explore} method="get" role="search">
          <label className="visually-hidden" htmlFor="header-search">
            Tìm anime
          </label>
          <span aria-hidden="true">⌕</span>
          <input id="header-search" name="q" placeholder="Tìm anime của bạn…" maxLength={100} />
          <input type="hidden" name="page" value="1" />
          <button type="submit" aria-label="Tìm kiếm">
            ↵
          </button>
        </Form>
        {user ? (
          <button className="btn aw-btn-quiet aw-account" onClick={logout}>
            Đăng xuất demo
          </button>
        ) : (
          <Link className="btn aw-btn-quiet aw-account" to={paths.loginTo(returnTo)}>
            Đăng nhập <span aria-hidden="true">↗</span>
          </Link>
        )}
      </div>
    </header>
  );
}
