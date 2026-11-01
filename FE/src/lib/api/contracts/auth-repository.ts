import type { LoginInput, RegisterInput, PasswordInput, LoginDto } from '@/lib/api/backend/types';
import type { AuthState, DemoProfile, DemoUser } from '@/types/auth';
// Passwords are deliberately excluded: demo profiles and UI previews only, no credential changes.
export interface AuthRepository {
  readonly mode: 'mock' | 'backend';
  restore(signal: AbortSignal): Promise<LoginDto | null>;
  getProfile(id: DemoUser): DemoProfile | null;
  changePassword(input: PasswordInput, state: AuthState, signal: AbortSignal): Promise<void>;
  logout(signal: AbortSignal): Promise<void>;
  login(input: LoginInput, state: AuthState, signal: AbortSignal): Promise<LoginDto>;
  // UI-only preview: no passwords accepted, verified or stored by this adapter.
  previewPasswordChange(
    id: DemoUser,
    state: AuthState,
    signal: AbortSignal,
  ): Promise<{ status: 'preview-only' }>;
  register(input: RegisterInput, state: AuthState, signal: AbortSignal): Promise<LoginDto>;
}
export class DemoAuthError extends Error {
  constructor(
    message: string,
    public field?: 'email',
  ) {
    super(message);
  }
}
