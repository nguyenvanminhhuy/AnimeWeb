import type { CredentialStore } from './repositories';
import type { LoginDto } from './types';

type Credentials = Pick<LoginDto, 'accessToken' | 'expiresAt'>;
const key = 'aw:backend:session:v1';

/** Per-tab session; only the opaque token and expiry are stored, never password or permissions. */
export function createCredentialStore(storage?: Storage) {
  let memory: Credentials | null = null;
  let hydrated = false;
  const listeners = new Set<() => void>();
  const store: CredentialStore & {
    expire: (token: string) => void;
    subscribe: (listener: () => void) => () => void;
  } = {
    read() {
      if (!hydrated) {
        hydrated = true;
        try {
          const saved = JSON.parse(storage?.getItem(key) ?? 'null');
          if (
            saved?.version === 1 &&
            typeof saved.accessToken === 'string' &&
            saved.accessToken &&
            typeof saved.expiresAt === 'string' &&
            Number.isFinite(Date.parse(saved.expiresAt)) &&
            Date.parse(saved.expiresAt) > Date.now()
          )
            memory = { accessToken: saved.accessToken, expiresAt: saved.expiresAt };
          else storage?.removeItem(key);
        } catch {
          memory = null;
        }
      }
      return memory;
    },
    write(value) {
      hydrated = true;
      memory = value ? { accessToken: value.accessToken, expiresAt: value.expiresAt } : null;
      try {
        if (memory) storage?.setItem(key, JSON.stringify({ version: 1, ...memory }));
        else storage?.removeItem(key);
      } catch {
        // A blocked/quota-limited browser still supports the current in-memory session.
      }
    },
    expire(token) {
      // A late 401 from an old request must not sign out a newly authenticated session.
      if (store.read()?.accessToken !== token) return;
      store.write(null);
      for (const listener of listeners) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
  return store;
}

let tabStorage: Storage | undefined;
try {
  tabStorage = window.sessionStorage;
} catch {
  /* Memory fallback. */
}
export const backendCredentials = createCredentialStore(tabStorage);
