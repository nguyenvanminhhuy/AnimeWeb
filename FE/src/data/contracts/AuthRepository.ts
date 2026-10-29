import type { AuthState, DemoProfile, DemoUser } from '../../features/auth/auth.types';
// Passwords are deliberately excluded: this repository only selects/creates demo profiles.
export interface AuthRepository {
  getProfile(id: DemoUser): DemoProfile | null;
  login(email: string, state: AuthState, signal: AbortSignal): Promise<DemoProfile>;
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
