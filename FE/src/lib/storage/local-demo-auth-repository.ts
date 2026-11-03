import { demoAccount } from '@/lib/storage/demo-account';
import type { DemoProfile as Profile } from '@/types/auth';
import type { LoginDto } from '@/lib/api/backend/types';
function demoLogin(profile: Profile): LoginDto {
  return {
    accessToken: `mock-${crypto.randomUUID()}`,
    tokenType: 'Bearer',
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    profile: {
      ...profile,
      avatarUrl: null,
      version: 1,
      roles: ['user'],
      permissions: [
        'catalog:read',
        'playback:read',
        'comment:read',
        'library:read:own',
        'library:write:own',
        'progress:read:own',
        'progress:write:own',
        'comment:create',
        'comment:update:own',
        'comment:delete:own',
      ],
    },
  };
}
import { DemoAuthError } from '@/lib/api/contracts/auth-repository';
import type { AuthRepository } from '@/lib/api/contracts/auth-repository';
import { isDemoUser } from '@/utils/auth';
import type { AuthState, DemoProfile } from '@/types/auth';

const key = 'aw:profiles:v1';
const builtIn: DemoProfile[] = [
  { id: 'viewer', displayName: 'Tài khoản có lịch sử mẫu', email: 'viewer@anime.test' },
  { id: 'newcomer', displayName: 'Tài khoản mới, chưa có lịch sử', email: 'newcomer@anime.test' },
];
function readProfiles(): DemoProfile[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return [];
    const value = JSON.parse(raw);
    if (
      value?.version !== 1 ||
      !Array.isArray(value.profiles) ||
      !value.profiles.every(
        (profile: DemoProfile) =>
          profile &&
          isDemoUser(profile.id) &&
          profile.id.startsWith('local-') &&
          typeof profile.displayName === 'string' &&
          profile.displayName.trim().length >= 2 &&
          profile.displayName.length <= 40 &&
          typeof profile.email === 'string' &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email) &&
          profile.email.length <= 254,
      )
    )
      throw new Error('Invalid registry');
    const profiles: DemoProfile[] = value.profiles.map((profile: DemoProfile) => ({
      id: profile.id,
      displayName: profile.displayName,
      email: profile.email.trim().toLowerCase(),
    }));
    if (
      new Set(profiles.map((profile) => profile.id)).size !== profiles.length ||
      new Set([...builtIn, ...profiles].map((profile) => profile.email)).size !==
        builtIn.length + profiles.length
    )
      throw new Error('Duplicate registry');
    return profiles;
  } catch {
    throw new DemoAuthError(
      'Không đọc được hồ sơ demo trên trình duyệt. Bạn vẫn có thể dùng hai tài khoản mẫu.',
    );
  }
}
async function wait(state: AuthState, signal: AbortSignal) {
  await new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Cancelled', 'AbortError'));
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Cancelled', 'AbortError'));
    };
    const timer = setTimeout(
      () => {
        signal.removeEventListener('abort', onAbort);
        resolve();
      },
      state === 'slow' ? 1500 : 250,
    );
    signal.addEventListener('abort', onAbort, { once: true });
  });
  if (state === 'error') throw new DemoAuthError('Thao tác demo tạm thời thất bại. Hãy thử lại.');
}
export const localDemoAuthRepository: AuthRepository = {
  mode: 'mock',
  async readProfile() {
    throw new DemoAuthError('Chức năng này cần phiên đăng nhập máy chủ.');
  },
  async saveAvatar() {
    throw new DemoAuthError('Đổi ảnh đại diện cần phiên đăng nhập máy chủ.');
  },
  async restore(signal) {
    signal.throwIfAborted();
    const id = demoAccount.readSession();
    const profile = id ? localDemoAuthRepository.getProfile(id) : null;
    return profile ? demoLogin(profile) : null;
  },
  async logout(signal) {
    signal.throwIfAborted();
  },
  async changePassword(_input, state, signal) {
    await wait(state, signal); /* Offline validation only; never store passwords. */
  },
  getProfile(id) {
    const fixture = builtIn.find((profile) => profile.id === id);
    if (fixture) return fixture;
    try {
      return readProfiles().find((profile) => profile.id === id) ?? null;
    } catch {
      return null;
    }
  },
  async login(input, state, signal) {
    await wait(state, signal);
    const normalized = input.email.trim().toLowerCase();
    const profile =
      builtIn.find((profile) => profile.email === normalized) ??
      readProfiles().find((profile) => profile.email === normalized);
    if (!profile)
      throw new DemoAuthError(
        'Chưa có hồ sơ demo với email này. Hãy đăng ký hoặc chọn tài khoản mẫu.',
        'email',
      );
    return demoLogin(profile);
  },
  async previewPasswordChange(id, state, signal) {
    if (!isDemoUser(id) || !localDemoAuthRepository.getProfile(id))
      throw new DemoAuthError('Hồ sơ mẫu không còn khả dụng. Vui lòng đăng nhập lại.');
    await wait(state, signal);
    signal.throwIfAborted();
    if (!localDemoAuthRepository.getProfile(id))
      throw new DemoAuthError('Hồ sơ mẫu không còn khả dụng. Vui lòng đăng nhập lại.');
    return { status: 'preview-only' };
  },
  async register(input, state, signal) {
    await wait(state, signal);
    const profiles = readProfiles();
    const email = input.email.trim().toLowerCase();
    if ([...builtIn, ...profiles].some((profile) => profile.email === email))
      throw new DemoAuthError('Email này đã có hồ sơ demo. Hãy chuyển sang đăng nhập.', 'email');
    const profile: DemoProfile = {
      id: `local-${crypto.randomUUID()}`,
      displayName: input.displayName.trim(),
      email,
    };
    try {
      localStorage.setItem(key, JSON.stringify({ version: 1, profiles: [...profiles, profile] }));
    } catch {
      throw new DemoAuthError(
        'Trình duyệt không lưu được hồ sơ demo. Hãy cho phép lưu trữ hoặc dùng tài khoản mẫu.',
      );
    }
    return demoLogin(profile);
  },
};
