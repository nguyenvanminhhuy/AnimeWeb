import type { DemoUser } from '@/types/auth';
export function isDemoUser(value: unknown): value is DemoUser {
  return (
    value === 'viewer' ||
    value === 'newcomer' ||
    (typeof value === 'string' && /^local-[a-f0-9-]{36}$/.test(value))
  );
}
