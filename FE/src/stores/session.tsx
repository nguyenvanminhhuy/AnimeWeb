import { createContext, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { demoAccount } from '@/lib/storage/demo-account';
import type { DemoUser } from '@/types/auth';
import type { Progress } from '@/types/progress';
import { authRepository } from '@/lib/api/repositories';
interface Session {
  user: DemoUser | null;
  displayName: string;
  favorites: string[];
  progress: Progress[];
  permissions: readonly string[];
  notice: string;
  login: (user: DemoUser) => boolean;
  logout: () => void;
  toggleFavorite: (id: string) => void;
  saveProgress: (owner: DemoUser, entry: Progress) => void;
}
const Context = createContext<Session | null>(null);
export function SessionProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState(() => {
    const id = demoAccount.readSession();
    return id ? authRepository.getProfile(id) : null;
  });
  const user = profile?.id ?? null;
  const [account, setAccount] = useState(() => (user ? demoAccount.read(user) : null));
  const [notice, setNotice] = useState('');
  const current = useRef({ user, account });
  current.current = { user, account };
  const session: Session = {
    user,
    displayName: profile?.displayName ?? '',
    favorites: account?.favorites ?? [],
    progress: account?.progress ?? [],
    permissions: user
      ? [
          'library:read:own',
          'library:write:own',
          'progress:read:own',
          'progress:write:own',
          'comment:create',
          'comment:update:own',
          'comment:delete:own',
        ]
      : [],
    notice,
    login(next) {
      const nextProfile = authRepository.getProfile(next);
      if (!nextProfile) {
        setNotice('Không tìm thấy hồ sơ demo. Hãy đăng nhập lại.');
        return false;
      }
      const nextAccount = demoAccount.read(next);
      current.current = { user: next, account: nextAccount };
      setAccount(nextAccount);
      setProfile(nextProfile);
      setNotice(
        demoAccount.saveSession(next)
          ? ''
          : 'Trình duyệt không lưu được phiên demo. Phiên chỉ tồn tại trong lần mở này.',
      );
      return true;
    },
    logout() {
      current.current = { user: null, account: null };
      setProfile(null);
      setAccount(null);
      setNotice(
        demoAccount.saveSession(null)
          ? ''
          : 'Không thể xóa phiên đã lưu. Hãy cho phép lưu trữ rồi đăng xuất lại.',
      );
    },
    toggleFavorite(id) {
      if (!user || !account) return;
      const next = {
        ...account,
        favorites: account.favorites.includes(id)
          ? account.favorites.filter((item) => item !== id)
          : [...account.favorites, id],
      };
      setAccount(next);
      current.current = { user, account: next };
      setNotice(
        demoAccount.save(user, next)
          ? 'Đã cập nhật yêu thích trong tài khoản demo.'
          : 'Đã cập nhật trong phiên này; trình duyệt không lưu được dữ liệu.',
      );
    },
    saveProgress(owner, entry) {
      const snapshot = current.current;
      if (
        owner !== snapshot.user ||
        !snapshot.account ||
        !Number.isFinite(entry.positionSeconds) ||
        !Number.isFinite(entry.durationSeconds) ||
        entry.durationSeconds <= 0
      )
        return;
      const positionSeconds = Math.min(entry.durationSeconds, Math.max(0, entry.positionSeconds));
      const next = {
        ...snapshot.account,
        progress: [
          { ...entry, positionSeconds, updatedAt: new Date().toISOString() },
          ...snapshot.account.progress.filter((value) => value.episodeId !== entry.episodeId),
        ],
      };
      current.current = { user: owner, account: next };
      setAccount(next);
      if (!demoAccount.save(owner, next)) {
        setNotice('Tiến độ được giữ trong phiên này; trình duyệt không lưu được dữ liệu.');
      }
    },
  };
  return <Context.Provider value={session}>{children}</Context.Provider>;
}
export function useSession() {
  const value = useContext(Context);
  if (!value) throw new Error('Thiếu SessionProvider');
  return value;
}
