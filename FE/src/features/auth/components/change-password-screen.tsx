import { useEffect, useRef } from 'react';
import { Form, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { PasswordField } from '@/features/auth/components/password-field';
import { useChangePassword } from '@/features/auth/hooks/use-change-password';
import { useSession } from '@/stores/session';
import { paths } from '@/config/paths';

export function ChangePasswordScreen() {
  const { displayName, email } = useSession();
  const { values, errors, error, pending, previewed, change, submit, reset } = useChangePassword();
  const resultHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (previewed) resultHeading.current?.focus();
  }, [previewed]);
  return (
    <div className="aw-shell tw:mx-auto tw:py-8 tw:max-phone:py-6">
      <nav
        aria-label="Đường dẫn"
        className="tw:flex tw:gap-3 tw:flex-wrap tw:mb-6 tw:text-[var(--aw-muted)]"
      >
        <Link to={paths.home}>Trang chủ</Link>
        <span aria-hidden="true">/</span>
        <Link to={paths.profile}>Trang cá nhân</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Đổi mật khẩu</span>
      </nav>
      <header className="tw:mb-7">
        <p className="aw-eyebrow">TÀI KHOẢN CỦA BẠN</p>
        <h1 className="tw:text-3xl tw:mb-3">Đổi mật khẩu</h1>
        <p className="tw:text-[var(--aw-muted)] tw:mb-0">
          Kiểm tra thông tin trước khi cập nhật mật khẩu tài khoản.
        </p>
      </header>
      <div className="tw:grid tw:grid-cols-[320px_minmax(0,1fr)] tw:gap-6 tw:items-start tw:max-tablet:grid-cols-1 tw:max-w-250">
        <aside className="aw-surface tw:rounded-2xl tw:p-6 tw:grid tw:gap-5 tw:min-w-0">
          <div className="tw:flex tw:items-center tw:gap-3">
            <Avatar name={displayName} />
            <div className="tw:min-w-0">
              <strong className="tw:block tw:break-words">{displayName}</strong>
              <span className="tw:block tw:break-all tw:text-[var(--aw-muted)]">{email}</span>
            </div>
          </div>
          <div className="tw:border-t tw:border-[var(--aw-border)] tw:pt-5">
            <h2 className="tw:text-lg">Chế độ mô phỏng</h2>
            <p className="tw:text-[var(--aw-muted)] tw:mb-0 tw:leading-relaxed">
              Dự án chưa có dịch vụ xác thực mật khẩu. Biểu mẫu chỉ kiểm tra dữ liệu nhập, không xác
              minh mật khẩu hiện tại và chưa thay đổi mật khẩu đăng nhập. Chỉ dùng chuỗi giả để thử
              giao diện.
            </p>
          </div>
          <ul className="tw:pl-5 tw:mb-0 tw:grid tw:gap-2 tw:text-[var(--aw-muted)]">
            <li>Mật khẩu mới từ 8 đến 128 ký tự.</li>
            <li>Khác mật khẩu hiện tại và khớp ô xác nhận.</li>
            <li>Dữ liệu mật khẩu không được lưu vào hồ sơ mẫu.</li>
          </ul>
        </aside>
        <section
          className="aw-surface tw:rounded-2xl tw:p-7 tw:max-phone:p-5 tw:min-w-0"
          aria-labelledby="change-password-form-title"
        >
          {previewed ? (
            <div role="status" className="tw:grid tw:gap-4">
              <h2
                ref={resultHeading}
                tabIndex={-1}
                id="change-password-form-title"
                className="tw:text-2xl tw:mb-0"
              >
                Biểu mẫu đã hợp lệ
              </h2>
              <p className="tw:text-[var(--aw-muted)] tw:mb-0">
                Đã hoàn tất kiểm tra giao diện. Mật khẩu chưa được thay đổi vì chưa kết nối dịch vụ
                xác thực. Các ô mật khẩu đã được xoá.
              </p>
              <div className="tw:flex tw:gap-3 tw:flex-wrap">
                <Button as="link" to={paths.profile} label="Về trang cá nhân" />
                <Button
                  variant="quiet"
                  label="Thử lại biểu mẫu"
                  onClick={() => {
                    reset();
                    requestAnimationFrame(() =>
                      document.getElementById('change-password-currentPassword')?.focus(),
                    );
                  }}
                />
              </div>
            </div>
          ) : (
            <>
              <h2 id="change-password-form-title" className="tw:text-xl tw:mb-5">
                Thông tin đổi mật khẩu
              </h2>
              <Form
                method="post"
                onSubmit={submit}
                noValidate
                aria-label="Đổi mật khẩu"
                aria-busy={pending}
                className="tw:grid tw:gap-5"
              >
                {error && (
                  <p
                    role="alert"
                    className="tw:p-3 tw:rounded-lg tw:bg-[#e3849d14] tw:text-[#ffb4bc] tw:mb-0"
                  >
                    {error}
                  </p>
                )}
                <div className="tw:grid tw:gap-2">
                  <label htmlFor="change-password-account">Tài khoản</label>
                  <Input
                    id="change-password-account"
                    type="email"
                    value={email}
                    readOnly
                    autoComplete="username"
                  />
                </div>
                <PasswordField
                  id="change-password-currentPassword"
                  name="currentPassword"
                  label="Mật khẩu hiện tại"
                  value={values.currentPassword}
                  error={errors.currentPassword}
                  disabled={pending}
                  autoComplete="current-password"
                  onChange={(value) => change('currentPassword', value)}
                />
                <PasswordField
                  id="change-password-newPassword"
                  name="newPassword"
                  label="Mật khẩu mới"
                  value={values.newPassword}
                  error={errors.newPassword}
                  disabled={pending}
                  autoComplete="new-password"
                  onChange={(value) => change('newPassword', value)}
                />
                <PasswordField
                  id="change-password-confirmation"
                  name="confirmation"
                  label="Nhập lại mật khẩu mới"
                  value={values.confirmation}
                  error={errors.confirmation}
                  disabled={pending}
                  autoComplete="new-password"
                  onChange={(value) => change('confirmation', value)}
                />
                <div className="tw:flex tw:gap-3 tw:flex-wrap">
                  <Button
                    type="submit"
                    label={pending ? 'Đang kiểm tra…' : 'Đổi mật khẩu'}
                    loading={pending}
                  />
                  <Button as="link" variant="quiet" to={paths.profile} label="Huỷ" />
                </div>
                {pending && (
                  <p role="status" className="tw:text-[var(--aw-muted)] tw:mb-0">
                    Đang mô phỏng xử lý biểu mẫu…
                  </p>
                )}
              </Form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
