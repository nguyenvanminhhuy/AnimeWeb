import { Form } from 'react-router-dom';
import { paths } from '../../../routes/paths';
import { useAuthForm } from '../hooks/useAuthForm';
import { useSession } from '../SessionProvider';
import { PasswordField } from './PasswordField';
import type { AuthMode } from '../auth.types';

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
        className="aw-auth-form"
        aria-label={register ? 'Đăng ký demo' : 'Đăng nhập bằng email demo'}
        aria-busy={pending}
      >
        {(error || Object.values(errors).some(Boolean)) && (
          <div className="aw-auth-error" role="alert">
            {error || 'Vui lòng kiểm tra các trường được đánh dấu bên dưới.'}
          </div>
        )}
        {register && (
          <div className="aw-auth-field">
            <label htmlFor="register-displayName">Tên hiển thị</label>
            <input
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
              <p className="aw-auth-field-error" id="register-displayName-error">
                {errors.displayName}
              </p>
            )}
          </div>
        )}
        <div className="aw-auth-field">
          <label htmlFor={`${mode}-email`}>Email demo</label>
          <input
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
            <p className="aw-auth-field-error" id={`${mode}-email-error`}>
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
        <button className="btn aw-btn-primary aw-auth-submit" type="submit" disabled={pending}>
          {pending ? (
            <>
              <span className="spinner-border spinner-border-sm" aria-hidden="true" /> Đang xử lý…
            </>
          ) : (
            <>
              {register ? 'Đăng ký demo' : 'Đăng nhập demo'} <span aria-hidden="true">→</span>
            </>
          )}
        </button>
        {pending && (
          <p className="aw-auth-pending" role="status">
            Đang xử lý hồ sơ demo trên trình duyệt…
          </p>
        )}
      </Form>
      {!register && (
        <div className="aw-auth-demo-accounts">
          <p>
            <span />
            HOẶC TRẢI NGHIỆM NHANH
            <span />
          </p>
          <button className="btn aw-btn-glass" disabled={pending} onClick={() => login('viewer')}>
            Dùng tài khoản có lịch sử mẫu
          </button>
          <button className="btn aw-btn-glass" disabled={pending} onClick={() => login('newcomer')}>
            Dùng tài khoản mới
          </button>
          <small>
            Email mẫu: viewer@anime.test hoặc newcomer@anime.test. Mật khẩu bất kỳ từ 8 ký tự chỉ để
            thử form.
          </small>
        </div>
      )}
    </>
  );
}
