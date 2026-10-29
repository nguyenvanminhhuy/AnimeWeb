import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Form } from 'react-router-dom';
import { paths } from '@/config/paths';
import { useAuthForm } from '@/features/auth/hooks/use-auth-form';
import { useSession } from '@/stores/session';
import { PasswordField } from '@/features/auth/components/password-field';
import type { AuthMode } from '@/features/auth/types/auth';

export function AuthForm({ mode }: { mode: AuthMode }) {
  const { values, errors, error, pending, change, submit } = useAuthForm(mode);
  const { login } = useSession();
  const register = mode === 'register';
  return (
    <>
      <Form
        method="post"
        action={register ? paths.register : paths.login}
        onSubmit={submit}
        noValidate
        className="aw-auth-form tw:gap-4.25 tw:grid"
        aria-label={register ? 'Đăng ký demo' : 'Đăng nhập bằng email demo'}
        aria-busy={pending}
      >
        {(error || Object.values(errors).some(Boolean)) && (
          <div
            className="aw-auth-error tw:px-3.25 tw:py-2.75 tw:rounded-[6px] tw:text-body tw:leading-[1.7]"
            role="alert"
          >
            {error || 'Vui lòng kiểm tra các trường được đánh dấu bên dưới.'}
          </div>
        )}
        {register && (
          <div className="aw-auth-field tw:gap-2 tw:grid tw:min-w-0">
            <label htmlFor="register-displayName">Tên hiển thị</label>
            <Input
              id="register-displayName"
              name="displayName"
              value={values.displayName}
              onChange={(event) => change('displayName', event.target.value)}
              required
              minLength={2}
              maxLength={40}
              autoComplete="nickname"
              disabled={pending}
              aria-invalid={Boolean(errors.displayName)}
              aria-describedby={errors.displayName ? 'register-displayName-error' : undefined}
              placeholder="Bạn muốn được gọi là gì?"
            />
            {errors.displayName && (
              <p
                className="aw-auth-field-error tw:m-0 tw:text-body tw:leading-[1.6]"
                id="register-displayName-error"
              >
                {errors.displayName}
              </p>
            )}
          </div>
        )}
        <div className="aw-auth-field tw:gap-2 tw:grid tw:min-w-0">
          <label htmlFor={`${mode}-email`}>Email demo</label>
          <Input
            id={`${mode}-email`}
            name="email"
            type="email"
            value={values.email}
            onChange={(event) => change('email', event.target.value)}
            required
            maxLength={254}
            autoComplete="username"
            spellCheck={false}
            disabled={pending}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? `${mode}-email-error` : undefined}
            placeholder={register ? 'ban@vi-du.test' : 'viewer@anime.test'}
          />
          {errors.email && (
            <p
              className="aw-auth-field-error tw:m-0 tw:text-body tw:leading-[1.6]"
              id={`${mode}-email-error`}
            >
              {errors.email}
            </p>
          )}
        </div>
        <PasswordField
          id={`${mode}-password`}
          name="password"
          label="Mật khẩu demo"
          value={values.password}
          onChange={(value) => change('password', value)}
          error={errors.password}
          disabled={pending}
          autoComplete={register ? 'new-password' : 'current-password'}
        />
        {register && (
          <>
            <PasswordField
              id="register-confirmation"
              name="confirmation"
              label="Nhập lại mật khẩu demo"
              value={values.confirmation}
              onChange={(value) => change('confirmation', value)}
              error={errors.confirmation}
              disabled={pending}
              autoComplete="new-password"
            />
          </>
        )}
        <Button
          variant="primary"
          className="aw-auth-submit tw:w-full tw:flex tw:items-center tw:justify-center tw:mt-0.75"
          type="submit"
          loading={pending}
          label={pending ? 'Đang xử lý…' : register ? 'Đăng ký' : 'Đăng nhập'}
          startIcon={pending ? <span className="spinner-border spinner-border-sm" /> : undefined}
          endIcon={!pending ? <Icon name="arrow-right" size="sm" /> : undefined}
        />
        {pending && (
          <p className="aw-auth-pending tw:m-0 tw:text-body" role="status">
            Đang xử lý hồ sơ demo trên trình duyệt…
          </p>
        )}
      </Form>
      {!register && (
        <div className="aw-auth-demo-accounts tw:gap-2.25 tw:grid tw:mt-5.75">
          <p>
            <span />
            HOẶC TRẢI NGHIỆM NHANH
            <span />
          </p>
          <Button
            variant="glass"
            disabled={pending}
            onClick={() => login('viewer')}
            label="Dùng tài khoản có lịch sử mẫu"
          />
          <Button
            variant="glass"
            disabled={pending}
            onClick={() => login('newcomer')}
            label="Dùng tài khoản mới"
          />
          <small>
            Email mẫu: viewer@anime.test hoặc newcomer@anime.test. Mật khẩu bất kỳ từ 8 ký tự chỉ để
            thử form.
          </small>
        </div>
      )}
    </>
  );
}
