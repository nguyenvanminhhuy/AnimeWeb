export type AuthMode = 'login' | 'register';

export interface AuthValues {
  displayName: string;
  email: string;
  password: string;
  confirmation: string;
}
export type AuthErrors = Partial<Record<keyof AuthValues, string>>;
