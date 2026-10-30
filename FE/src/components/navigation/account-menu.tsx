import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Avatar } from '@/components/ui/avatar';

export interface AccountMenuProps {
  displayName: string;
  identity: string;
  links: readonly { label: string; to: string }[];
  onLogout: () => void;
}

export function AccountMenu({ displayName, identity, links, onLogout }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const id = useId();
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.key, identity]);
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>('a, button')?.focus();
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !container.current?.contains(event.target))
        setOpen(false);
    }
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  function close(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus();
  }

  return (
    <div
      ref={container}
      className="tw:relative tw:shrink-0"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.stopPropagation();
          close(true);
        }
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close();
      }}
    >
      <Button
        ref={trigger}
        variant="unstyled"
        className="tw:p-1 tw:rounded-full tw:border-0 tw:bg-transparent tw:text-[var(--aw-text)] tw:hover:bg-[#ffffff08]"
        aria-label={`Tài khoản của ${displayName}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
        label={
          <span className="tw:flex tw:items-center tw:gap-2">
            <Avatar name={displayName} />
            <span className="tw:max-w-36 tw:truncate tw:max-phone:hidden">{displayName}</span>
          </span>
        }
        endIcon={<Icon name="arrow-down" size="sm" />}
      />
      {open && (
        <nav
          ref={panel}
          id={id}
          aria-label="Tài khoản"
          className="tw:absolute tw:right-0 tw:top-full tw:mt-2 tw:z-50 tw:w-64 tw:max-w-[calc(100vw-2rem)] tw:rounded-xl tw:border tw:border-[var(--aw-border)] tw:bg-[#141925] tw:p-2 tw:shadow-xl"
        >
          <p className="tw:px-3 tw:py-2 tw:mb-1 tw:font-semibold tw:break-words">{displayName}</p>
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="tw:block tw:px-3 tw:py-2.5 tw:rounded-lg tw:text-[var(--aw-text)] tw:hover:bg-[#a697ff18]"
              onClick={() => close()}
            >
              {link.label}
            </Link>
          ))}
          <div className="tw:mt-2 tw:pt-2 tw:border-t tw:border-[var(--aw-border)]">
            <Button
              variant="unstyled"
              className="tw:block tw:w-full tw:text-left tw:px-3 tw:py-2.5 tw:rounded-lg tw:border-0 tw:bg-transparent tw:text-[#edacbc] tw:hover:bg-[#edacbc10]"
              label="Đăng xuất"
              onClick={() => {
                close();
                onLogout();
              }}
            />
          </div>
        </nav>
      )}
    </div>
  );
}
