import type { AuthMode, AuthValues, AuthErrors } from '@/features/auth/types/auth';
export function validateAuth(mode: AuthMode, values: AuthValues): AuthErrors {
  const errors: AuthErrors = {};
  if (
    mode === 'register' &&
    (values.displayName.trim().length < 2 || values.displayName.trim().length > 40)
  )
    errors.displayName = 'Tên hiển thị cần từ 2 đến 40 ký tự.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) || values.email.trim().length > 254)
    errors.email = 'Nhập email demo đúng định dạng.';
  if (values.password.length < 8 || values.password.length > 128)
    errors.password = 'Mật khẩu demo cần từ 8 đến 128 ký tự.';
  if (mode === 'register' && values.confirmation !== values.password)
    errors.confirmation = 'Mật khẩu nhập lại chưa khớp.';
  return errors;
}
