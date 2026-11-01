// Server IDs are opaque strings; isDemoUser still restricts local fixture activation.
export type DemoUser = string;
export interface DemoProfile {
  id: DemoUser;
  displayName: string;
  email: string;
}

export type AuthState = 'ready' | 'error' | 'slow';

export type {
  ProfileDto,
  LoginDto,
  LoginInput,
  RegisterInput,
  PasswordInput,
} from '@/lib/api/backend/types';
