import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import type { IconName } from '@/components/ui/icon-definitions';
import { paths } from '@/config/paths';
import { AccountMenu } from '@/components/navigation/account-menu';

interface AdminLayoutProps {
  children: ReactNode;
  displayName: string;
  pageLabel: string;
  onLogout: () => void;
  menu: readonly { label: string; to: string; icon: IconName; end?: boolean }[];
}

export function AdminLayout({
  children,
  displayName,
  pageLabel,
  onLogout,
  menu,
}: AdminLayoutProps) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    if (open) sidebar.current?.querySelector<HTMLAnchorElement>('nav a')?.focus();
  }, [open]);
  function closeNavigation() {
    setOpen(false);
    trigger.current?.focus();
  }
  return (
    <div
      className="tw:min-h-screen tw:bg-[var(--aw-background)] tw:text-body"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) closeNavigation();
      }}
    >
      <a href="#admin-content" className="aw-skip tw:p-3 tw:fixed tw:left-5 tw:z-50">
        Đến nội dung quản trị
      </a>
      <div className="tw:hidden tw:max-tablet:flex tw:items-center tw:justify-between tw:p-4 tw:border-b tw:border-[var(--aw-border)]">
        <Link to={paths.admin} className="tw:text-[var(--aw-text)] tw:font-bold">
          Anime Web <span className="tw:text-[var(--aw-accent)]">/ quản trị</span>
        </Link>
        <Button
          ref={trigger}
          variant="quiet"
          size="sm"
          label={open ? 'Đóng menu' : 'Mở menu'}
          aria-expanded={open}
          aria-controls="admin-sidebar"
          onClick={() => setOpen((value) => !value)}
          startIcon={<Icon name={open ? 'close' : 'arrow-down'} size="sm" />}
        />
      </div>
      <div className="tw:grid tw:grid-cols-[240px_minmax(0,1fr)] tw:max-tablet:grid-cols-1">
        <aside
          ref={sidebar}
          id="admin-sidebar"
          aria-label="Menu quản trị"
          className={`tw:border-r tw:border-[var(--aw-border)] tw:bg-[#10141f] tw:p-6 tw:sticky tw:top-0 tw:h-screen tw:flex tw:flex-col tw:max-tablet:static tw:max-tablet:h-auto tw:max-tablet:border-r-0 tw:max-tablet:border-b ${open ? '' : 'tw:max-tablet:hidden'}`}
        >
          <Link
            to={paths.admin}
            className="tw:text-xl tw:font-bold tw:text-white tw:no-underline tw:mb-1"
          >
            anime<span className="tw:text-[var(--aw-accent)]">web</span>
          </Link>
          <p className="tw:text-[var(--aw-muted)] tw:mb-10 tw:max-tablet:mb-4">
            Không gian quản trị
          </p>
          <p className="tw:text-[var(--aw-muted)] tw:font-semibold tw:mb-3">TỔNG QUAN</p>
          <nav aria-label="Điều hướng quản trị" className="tw:grid tw:gap-2">
            {menu.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => {
                  if (open) closeNavigation();
                }}
                className={({ isActive }) =>
                  `tw:flex tw:gap-3 tw:items-center tw:rounded-lg tw:px-4 tw:py-3 tw:no-underline ${isActive ? 'tw:bg-[#a697ff20] tw:text-[#c5baff]' : 'tw:text-[var(--aw-muted)] tw:hover:bg-[#ffffff08]'}`
                }
              >
                <Icon name={item.icon} />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="tw:mt-auto tw:pt-10 tw:max-tablet:pt-5">
            <div className="tw:rounded-xl tw:border tw:border-[var(--aw-border)] tw:p-4 tw:mb-5">
              <p className="tw:font-semibold tw:mb-2">Phiên quản trị mẫu</p>
              <p className="tw:text-[var(--aw-muted)] tw:mb-0">
                Chỉ đọc thống kê. Phiên kết thúc khi tải lại trang.
              </p>
            </div>
            <Link
              to={paths.home}
              className="tw:inline-flex tw:gap-2 tw:items-center tw:text-[var(--aw-muted)]"
            >
              <Icon name="arrow-left" size="sm" />
              Trang xem phim
            </Link>
          </div>
        </aside>
        <div className="tw:min-w-0">
          <header className="tw:border-b tw:border-[var(--aw-border)] tw:px-8 tw:py-5 tw:flex tw:items-center tw:justify-between tw:gap-4 tw:flex-wrap tw:max-phone:px-4">
            <nav
              aria-label="Đường dẫn quản trị"
              className="tw:flex tw:gap-2 tw:text-[var(--aw-muted)]"
            >
              <Link to={paths.admin}>Quản trị</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{pageLabel}</span>
            </nav>
            <div className="tw:ml-auto tw:flex tw:items-center">
              <AccountMenu
                identity="admin-preview"
                displayName={displayName}
                onLogout={onLogout}
                links={[
                  { label: 'Dashboard quản trị', to: paths.admin },
                  { label: 'Trang xem phim', to: paths.home },
                  { label: 'Đổi tài khoản', to: paths.login },
                ]}
              />
            </div>
          </header>
          <main
            id="admin-content"
            tabIndex={-1}
            className="tw:p-8 tw:max-phone:p-4 tw:max-w-400 tw:mx-auto"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
