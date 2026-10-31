export interface ChangePasswordValues {
  currentPassword: string;
  newPassword: string;
  confirmation: string;
}
export type ChangePasswordErrors = Partial<Record<keyof ChangePasswordValues, string>>;
