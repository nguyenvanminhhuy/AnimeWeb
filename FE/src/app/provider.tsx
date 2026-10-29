import type { ReactNode } from 'react';
import { SessionProvider } from '@/stores/session';

export function AppProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
