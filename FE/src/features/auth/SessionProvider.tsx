import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { demoAccount } from '../../data/local/demoAccount';
import type { DemoUser, Progress } from '../../data/local/demoAccount';
import { authRepository } from '../../data/repositories';
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
      setAccount(demoAccount.read(next));
      setProfile(nextProfile);
      setNotice(
        demoAccount.saveSession(next)
          ? ''
          : 'Trình duyệt không lưu được phiên demo. Phiên chỉ tồn tại trong lần mở này.',
      );
      return true;
    },
    logout() {
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
      setNotice(
        demoAccount.save(user, next)
          ? 'Đã cập nhật yêu thích trong tài khoản demo.'
          : 'Đã cập nhật trong phiên này; trình duyệt không lưu được dữ liệu.',
      );
    },
  };
  return <Context.Provider value={session}>{children}</Context.Provider>;
}
export function useSession() {
  const value = useContext(Context);
  if (!value) throw new Error('Thiếu SessionProvider');
  return value;
}
