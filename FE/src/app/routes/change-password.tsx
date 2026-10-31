import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChangePasswordScreen } from '@/features/auth/components/change-password-screen';
import { useSession } from '@/stores/session';
import { paths } from '@/config/paths';

export function ChangePasswordPage() {
  const { user } = useSession();
  const location = useLocation();
  if (!user)
    return (
      <section className="aw-shell tw:mx-auto tw:py-12">
        <h1 className="tw:text-2xl">Đăng nhập để đổi mật khẩu</h1>
        <p className="tw:text-[var(--aw-muted)]">
          Trang này dành cho tài khoản thành viên đang đăng nhập.
        </p>
        <div className="tw:flex tw:gap-3 tw:flex-wrap">
          <Button
            as="link"
            to={paths.loginTo(location.pathname + location.search + location.hash)}
            label="Đăng nhập"
          />
          <Button as="link" to={paths.home} variant="quiet" label="Về trang chủ" />
        </div>
      </section>
    );
  return <ChangePasswordScreen key={user} />;
}
