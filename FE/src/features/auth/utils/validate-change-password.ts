import type {
  ChangePasswordErrors,
  ChangePasswordValues,
} from '@/features/auth/types/change-password';

export function validateChangePassword(values: ChangePasswordValues): ChangePasswordErrors {
  const errors: ChangePasswordErrors = {};
  if (
    values.currentPassword.length < 8 ||
    values.currentPassword.length > 128 ||
    !values.currentPassword.trim()
  )
    errors.currentPassword = 'Nhập mật khẩu hiện tại từ 8 đến 128 ký tự để thử biểu mẫu.';
  if (
    values.newPassword.length < 8 ||
    values.newPassword.length > 128 ||
    !values.newPassword.trim()
  )
    errors.newPassword = 'Mật khẩu mới cần từ 8 đến 128 ký tự và không chỉ gồm dấu cách.';
  else if (values.newPassword === values.currentPassword)
    errors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại.';
  if (!values.confirmation || values.confirmation !== values.newPassword)
    errors.confirmation = 'Mật khẩu nhập lại chưa khớp.';
  return errors;
}
