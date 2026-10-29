export type DemoUser = 'viewer' | 'newcomer' | `local-${string}`;
export interface DemoProfile {
  id: DemoUser;
  displayName: string;
  email: string;
}

export type AuthState = 'ready' | 'error' | 'slow';
