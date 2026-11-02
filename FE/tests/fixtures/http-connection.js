import { httpTransport } from '/src/lib/api/backend/transport.ts';
import { createCredentialStore } from '/src/lib/api/backend/credentials.ts';
import { createBackendClient } from '/src/lib/api/backend/client.ts';
import { ApiError } from '/src/lib/api/backend/error.ts';
import { createBackendRepositories } from '/src/lib/api/backend/repositories.ts';

window.verifyHttpConnection = async () => {
  const check = (value, label) => {
    if (!value) throw new Error(label);
  };
  const original = window.fetch;
  let captured;
  try {
    window.fetch = async (path, init) => {
      captured = { path, init };
      return new Response(null, { status: 204 });
    };
    const api = createBackendClient(httpTransport, () => 'fixture-token');
    await api.auth.logout();
    check(
      captured.path === '/api/v1/auth/logout' && captured.init.method === 'POST',
      'HTTP endpoint mismatch',
    );
    check(
      captured.init.headers.Authorization === 'Bearer fixture-token' &&
        captured.init.credentials === 'same-origin',
      'HTTP bearer/cookie missing',
    );
    await api.playback.startView('opaque-id', { positionSeconds: 1.9 });
    check(
      captured.init.credentials === 'include' && captured.init.body === '{"positionSeconds":1}',
      'View body/credentials mismatch',
    );
    window.fetch = async () => new Response('<html>wrong proxy</html>', { status: 200 });
    try {
      await api.auth.me();
      throw new Error('HTML accepted');
    } catch (error) {
      check(
        error instanceof ApiError && error.code === 'INVALID_API_RESPONSE',
        'Invalid JSON error lost',
      );
    }
    window.fetch = async () => {
      throw new TypeError('offline');
    };
    try {
      await api.auth.me();
      throw new Error('network failure ignored');
    } catch (error) {
      check(error instanceof ApiError && error.code === 'NETWORK_ERROR', 'Network error mismatch');
    }
    const controller = new AbortController();
    controller.abort();
    try {
      await api.auth.me(controller.signal);
      throw new Error('Abort ignored');
    } catch (error) {
      check(error.name === 'AbortError', 'Abort was reclassified');
    }
  } finally {
    window.fetch = original;
  }
  const storage = new Map();
  const fakeStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
  const store = createCredentialStore(fakeStorage);
  const credential = {
    accessToken: 'fixture-old',
    expiresAt: '2099-01-01T00:00:00Z',
    password: 'never-persist',
    profile: { roles: ['admin'] },
  };
  store.write(credential);
  const saved = [...storage.values()][0];
  check(
    !saved.includes('password') && !saved.includes('profile') && !saved.includes('roles'),
    'Credential store persisted forbidden fields',
  );
  check(
    createCredentialStore(fakeStorage).read().accessToken === 'fixture-old',
    'Reload lost token',
  );
  let expired = 0;
  store.subscribe(() => expired++);
  store.write({ ...credential, accessToken: 'fixture-new' });
  store.expire('fixture-old');
  check(
    expired === 0 && store.read().accessToken === 'fixture-new',
    'Late 401 cleared the new session',
  );
  store.expire('fixture-new');
  check(
    expired === 1 && store.read() === null && storage.size === 0,
    '401 did not clear active session',
  );
  const blocked = createCredentialStore({
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('blocked');
    },
    removeItem: () => {},
  });
  blocked.write(credential);
  check(blocked.read().accessToken === 'fixture-old', 'Memory fallback failed');
  const delayedStore = createCredentialStore();
  delayedStore.write(credential);
  let finishLogout;
  const delayed = createBackendRepositories(
    createBackendClient(
      async () =>
        new Promise((resolve) => {
          finishLogout = resolve;
        }),
    ),
    delayedStore,
  );
  const pendingLogout = delayed.authRepository.logout(new AbortController().signal);
  delayedStore.write({ ...credential, accessToken: 'replacement-login' });
  finishLogout({ status: 204 });
  await pendingLogout;
  check(
    delayedStore.read().accessToken === 'replacement-login',
    'Late logout cleared replacement login',
  );
  return 'HTTP request/204/bearer/cookies/network/abort/invalid JSON, per-tab credential whitelist, reload, storage failure and late-401 isolation';
};
