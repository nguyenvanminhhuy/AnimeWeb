import { Input } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { useSession } from '@/stores/session';
import { Form, Link, NavLink, useLocation, useMatch } from 'react-router-dom';
import { paths, routePatterns, safeReturnTo } from '@/config/paths';
import { AccountMenu } from '@/components/navigation/account-menu';
export function Header() {
  const { user, displayName, avatarUrl, adminPreview, permissions, logout } = useSession();
  const canReadAdmin = adminPreview && permissions.includes('admin:dashboard:read');
  const { pathname, search } = useLocation();
  const loginMatch = useMatch(routePatterns.login);
  const registerMatch = useMatch(routePatterns.register);
  const returnTo =
    loginMatch || registerMatch
      ? safeReturnTo(new URLSearchParams(search).get('returnTo'))
      : pathname + search;
  return (
    <header className="aw-header">
      <div className="aw-shell aw-header-inner tw:mx-auto tw:gap-8 tw:min-h-22 tw:flex tw:items-center tw:max-desktop:py-3 tw:max-desktop:gap-3 tw:max-desktop:flex-wrap tw:max-phone:gap-2 tw:max-phone:py-2">
        <Link
          className="aw-brand tw:inline-flex tw:items-center tw:whitespace-nowrap"
          to={paths.home}
          aria-label="Anime Web — Trang chủ"
        >
          <span className="aw-brand-mark tw:mr-2 tw:leading-none" aria-hidden="true">
            ✦
          </span>
          anime<span>web</span>
        </Link>
        <nav
          className="aw-nav tw:gap-6 tw:flex tw:self-center tw:items-center tw:[&>a]:min-h-11 tw:[&>a]:py-2.5 tw:text-body tw:whitespace-nowrap tw:max-phone:order-2 tw:max-phone:w-full tw:max-phone:justify-between"
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
          className="aw-search tw:px-3 tw:py-2 tw:gap-2 tw:ml-auto tw:flex tw:items-center tw:min-h-11 tw:min-w-32.5 tw:w-60 tw:rounded-lg tw:max-desktop:order-3 tw:max-desktop:w-full"
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
        {user || adminPreview ? (
          <div className="tw:max-desktop:ml-auto">
            <AccountMenu
              avatarUrl={avatarUrl}
              identity={user ?? 'admin-preview'}
              displayName={displayName}
              onLogout={logout}
              links={[
                ...(user
                  ? [
                      { label: 'Trang cá nhân', to: paths.profile },
                      { label: 'Đổi mật khẩu', to: paths.changePassword },
                      { label: 'Thư viện của tôi', to: paths.library },
                    ]
                  : []),
                ...(canReadAdmin
                  ? [
                      { label: 'Dashboard quản trị', to: paths.admin },
                      { label: 'Đổi tài khoản', to: paths.login },
                    ]
                  : []),
              ]}
            />
          </div>
        ) : (
          <Button
            as="link"
            variant="quiet"
            className="aw-account tw:max-desktop:ml-auto tw:max-phone:p-2.25 tw:max-phone:text-body"
            to={paths.loginTo(returnTo)}
            label="Đăng nhập"
          />
        )}
      </div>
    </header>
  );
}
