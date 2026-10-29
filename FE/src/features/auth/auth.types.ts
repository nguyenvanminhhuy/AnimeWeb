export type DemoUser = 'viewer' | 'newcomer' | `local-${string}`;
export interface DemoProfile {
  id: DemoUser;
  displayName: string;
  email: string;
}
export type AuthMode = 'login' | 'register';
export type AuthState = 'ready' | 'error' | 'slow';
export interface AuthValues {
  displayName: string;
  email: string;
  password: string;
  confirmation: string;
}
export type AuthErrors = Partial<Record<keyof AuthValues, string>>;
export function isDemoUser(value: unknown): value is DemoUser {
  return (
    value === 'viewer' ||
    value === 'newcomer' ||
    (typeof value === 'string' && /^local-[a-f0-9-]{36}$/.test(value))
  );
}
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
