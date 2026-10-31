import type { AuthState, DemoProfile, DemoUser } from '@/types/auth';
// Passwords are deliberately excluded: demo profiles and UI previews only, no credential changes.
export interface AuthRepository {
  getProfile(id: DemoUser): DemoProfile | null;
  login(email: string, state: AuthState, signal: AbortSignal): Promise<DemoProfile>;
  // UI-only preview: no passwords accepted, verified or stored by this adapter.
  previewPasswordChange(
    id: DemoUser,
    state: AuthState,
    signal: AbortSignal,
  ): Promise<{ status: 'preview-only' }>;
  register(
    input: { displayName: string; email: string },
    state: AuthState,
    signal: AbortSignal,
  ): Promise<DemoProfile>;
}
export class DemoAuthError extends Error {
  constructor(
    message: string,
    public field?: 'email',
  ) {
    super(message);
  }
}
