import { Input } from '../ui/Input';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
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
      <div className="aw-shell aw-header-inner tw:mx-auto tw:gap-8.5 tw:min-h-22 tw:flex tw:items-center tw:max-desktop:py-4.5 tw:max-desktop:gap-6 tw:max-desktop:flex-wrap tw:max-phone:gap-3 tw:max-phone:min-h-18">
        <Link
          className="aw-brand tw:inline-flex tw:items-center tw:whitespace-nowrap"
          to={paths.home}
          aria-label="Anime Web — Trang chủ"
        >
          <span className="aw-brand-mark tw:mr-2" aria-hidden="true">
            ✦
          </span>
          anime<span>web</span>
          <span className="aw-demo tw:px-1.5 tw:py-0.75 tw:rounded-sm tw:whitespace-nowrap">
            DEMO
          </span>
        </Link>
        <nav
          className="aw-nav tw:gap-6.5 tw:flex tw:self-stretch tw:items-stretch tw:text-body tw:whitespace-nowrap tw:max-desktop:self-center tw:max-phone:order-2 tw:max-phone:w-full tw:max-phone:justify-between"
          aria-label="Điều hướng chính"
        >
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
        <Form
          className="aw-search tw:px-3 tw:py-2 tw:gap-2 tw:ml-auto tw:flex tw:items-center tw:min-w-32.5 tw:w-60 tw:rounded-lg tw:max-desktop:order-3 tw:max-desktop:w-full"
          action={paths.explore}
          method="get"
          role="search"
        >
          <label className="visually-hidden" htmlFor="header-search">
            Tìm anime
          </label>
          <Icon name="search" />
          <Input
            variant="unstyled"
            id="header-search"
            name="q"
            placeholder="Tìm anime của bạn…"
            maxLength={100}
          />
        </Form>
        {user ? (
          <Button
            variant="quiet"
            className="aw-account tw:max-desktop:ml-auto tw:max-phone:p-2.25 tw:max-phone:text-body"
            onClick={logout}
            label="Đăng xuất demo"
          />
        ) : (
          <Button
            as="link"
            variant="quiet"
            className="aw-account tw:max-desktop:ml-auto tw:max-phone:p-2.25 tw:max-phone:text-body"
            to={paths.loginTo(returnTo)}
            label="Đăng nhập"
            endIcon={<Icon name="external-link" size="sm" />}
          />
        )}
      </div>
    </header>
  );
}
