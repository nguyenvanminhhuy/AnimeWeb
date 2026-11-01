import { isDemoUser } from '@/utils/auth';
import { scheduleDeadline } from '@/utils/deadline';
import type { LoginDto } from '@/lib/api/backend/types';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { demoAccount } from '@/lib/storage/demo-account';
import type { DemoUser } from '@/types/auth';
import type { PersonalSnapshot } from '@/types/personal';
import type { Progress } from '@/types/progress';
import { personalRepository, authRepository } from '@/lib/api/repositories';
import type { AdminPreviewSession } from '@/types/admin';
import { adminPreviewSession } from '@/testing/mocks/fixtures/admin-session';
interface Session {
  user: DemoUser | null;
  displayName: string;
  email: string;
  favorites: string[];
  progress: Progress[];
  permissions: readonly string[];
  notice: string;
  accessToken: string | null;
  expiresAt: string | null;
  roles: readonly string[];
  initializing: boolean;
  invalidateSession: (message?: string) => void;
  adminPreview: AdminPreviewSession | null;
  openAdminPreview: (writable?: boolean) => void;
  login: (user: DemoUser | LoginDto) => boolean;
  logout: () => void;
  toggleFavorite: (id: string) => void;
  saveProgress: (owner: DemoUser, entry: Progress) => void;
}
const Context = createContext<Session | null>(null);
export function SessionProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState(() => {
    const id = authRepository.mode === 'mock' ? demoAccount.readSession() : null;
    return id ? authRepository.getProfile(id) : null;
  });
  const user = profile?.id ?? null;
  const [account, setAccount] = useState(() => (user ? demoAccount.read(user) : null));
  const [notice, setNotice] = useState('');
  const [initializing, setInitializing] = useState(true);
  const authRevision = useRef(0);
  const personalRevision = useRef(0);
  const mutationQueue = useRef<Promise<void>>(Promise.resolve());
  const [credentials, setCredentials] = useState<LoginDto | null>(null);
  const [adminPreview, setAdminPreview] = useState<AdminPreviewSession | null>(null);
  const current = useRef({ user, account });
  current.current = { user, account };
  useEffect(() => {
    const controller = new AbortController();
    const revision = authRevision.current;
    authRepository
      .restore(controller.signal)
      .then(async (result) => {
        if (controller.signal.aborted || revision !== authRevision.current) return;
        if (
          !result ||
          !Number.isFinite(Date.parse(result.expiresAt)) ||
          Date.parse(result.expiresAt) <= Date.now()
        ) {
          setProfile(null);
          setCredentials(null);
          setAccount(null);
          current.current = { user: null, account: null };
          return;
        }
        if (result && Date.parse(result.expiresAt) > Date.now()) {
          const snapshot = await personalRepository.snapshot(
            { id: result.profile.id, permissions: result.profile.permissions },
            controller.signal,
          );
          if (controller.signal.aborted || revision !== authRevision.current) return;
          const restored = { version: 1 as const, ...snapshot };
          setProfile(result.profile);
          setCredentials(result);
          setAccount(restored);
          current.current = { user: result.profile.id, account: restored };
        }
      })
      .catch(() => {
        if (!controller.signal.aborted && revision === authRevision.current) {
          setProfile(null);
          setAccount(null);
          setCredentials(null);
          current.current = { user: null, account: null };
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setInitializing(false);
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!credentials) return;
    return scheduleDeadline(Date.parse(credentials.expiresAt), () => {
      authRevision.current++;
      demoAccount.saveSession(null);
      setCredentials(null);
      setProfile(null);
      setAccount(null);
      setAdminPreview(null);
      current.current = { user: null, account: null };
      setNotice('Phiên đã hết hạn. Vui lòng đăng nhập lại.');
    });
  }, [credentials]);
  const adminContext =
    adminPreview ??
    (credentials?.profile.roles.some((role) => role === 'manage' || role === 'admin')
      ? {
          id: credentials.profile.id,
          displayName: credentials.profile.displayName,
          permissions: credentials.profile.permissions,
        }
      : null);
  function mutatePersonal(
    owner: string,
    task: (snapshot: NonNullable<typeof account>) => Promise<PersonalSnapshot>,
    message?: string,
  ) {
    const generation = authRevision.current;
    personalRevision.current++;
    const run = async () => {
      if (
        current.current.user !== owner ||
        generation !== authRevision.current ||
        !current.current.account
      )
        return;
      try {
        const next = await task(current.current.account);
        if (current.current.user !== owner || generation !== authRevision.current) return;
        const saved = { version: 1 as const, ...next };
        current.current = { user: owner, account: saved };
        setAccount(saved);
        if (message) setNotice(message);
      } catch (error) {
        if (current.current.user === owner && generation === authRevision.current)
          setNotice(error instanceof Error ? error.message : 'Không lưu được dữ liệu.');
      }
    };
    // Read versions when each queued write starts, including pause/ended/unmount in the same tick.
    mutationQueue.current = mutationQueue.current.then(run, run);
  }
  const session: Session = {
    user,
    initializing,
    invalidateSession(message = 'Phiên đã hết hạn. Vui lòng đăng nhập lại.') {
      authRevision.current++;
      setCredentials(null);
      setProfile(null);
      setAccount(null);
      setAdminPreview(null);
      current.current = { user: null, account: null };
      setNotice(message);
      demoAccount.saveSession(null);
    },
    accessToken: credentials?.accessToken ?? null,
    expiresAt: credentials?.expiresAt ?? null,
    roles: credentials?.profile.roles ?? (user ? ['user'] : []),
    displayName: adminPreview?.displayName ?? profile?.displayName ?? '',
    email: profile?.email ?? '',
    favorites: account?.favorites ?? [],
    progress: account?.progress ?? [],
    permissions:
      import.meta.env.DEV && adminPreview
        ? adminPreview.permissions
        : credentials
          ? credentials.profile.permissions
          : user
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
    adminPreview: adminContext,
    openAdminPreview(writable = false) {
      authRevision.current++;
      setInitializing(false);
      setCredentials(null);
      if (!import.meta.env.DEV) return;
      current.current = { user: null, account: null };
      setProfile(null);
      setAccount(null);
      setAdminPreview({
        ...adminPreviewSession,
        id: crypto.randomUUID(),
        permissions: [
          ...adminPreviewSession.permissions,
          ...(writable
            ? [
                'admin:anime:write',
                'admin:genre:write',
                'admin:episode:write',
                'admin:playback:write',
                'admin:comment:moderate',
              ]
            : []),
        ],
      });
      const cleared = demoAccount.saveSession(null);
      setNotice(
        cleared ? '' : 'Không thể xóa phiên đã lưu; tải lại có thể khôi phục tài khoản cũ.',
      );
    },
    login(next) {
      authRevision.current++;
      setInitializing(false);
      const generation = authRevision.current;
      const revision = personalRevision.current;
      const credential = typeof next === 'string' ? null : next;
      const nextProfile = credential?.profile ?? authRepository.getProfile(next as DemoUser);
      const nextId = nextProfile?.id as DemoUser;
      setCredentials(credential);
      if (!nextProfile) {
        setNotice('Không tìm thấy hồ sơ demo. Hãy đăng nhập lại.');
        return false;
      }
      const nextAccount = isDemoUser(nextId)
        ? demoAccount.read(nextId)
        : { version: 1 as const, favorites: [], progress: [] };
      if (credential)
        void personalRepository
          .snapshot(
            { id: nextId, permissions: credential.profile.permissions },
            new AbortController().signal,
          )
          .then((snapshot) => {
            if (
              current.current.user === nextId &&
              authRevision.current === generation &&
              personalRevision.current === revision
            ) {
              const next = { version: 1 as const, ...snapshot };
              current.current = { user: nextId, account: next };
              setAccount(next);
            }
          })
          .catch((error) => setNotice(error.message));
      setAdminPreview(null);
      current.current = { user: nextId, account: nextAccount };
      setAccount(nextAccount);
      setProfile({ ...nextProfile, id: nextId });
      setNotice(
        (isDemoUser(nextId) ? demoAccount.saveSession(nextId) : true)
          ? ''
          : 'Trình duyệt không lưu được phiên demo. Phiên chỉ tồn tại trong lần mở này.',
      );
      return true;
    },
    logout() {
      authRevision.current++;
      setInitializing(false);
      setCredentials(null);
      void authRepository
        .logout(new AbortController().signal)
        .catch(() => setNotice('Chưa hoàn tất đăng xuất.'));
      setAdminPreview(null);
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
      const actor = { id: user, permissions: session.permissions };
      const isFavorite = !current.current.account?.favorites.includes(id);
      mutatePersonal(
        user,
        (snapshot) => {
          const entry = snapshot.library?.find((row) => row.animeId === id);
          const version = entry?.version ?? (snapshot.favorites.includes(id) ? 1 : 0);
          return personalRepository.setFavorite(
            actor,
            id,
            isFavorite,
            version,
            new AbortController().signal,
          );
        },
        'Đã cập nhật yêu thích.',
      );
    },
    saveProgress(owner, entry) {
      const snapshot = current.current;
      if (
        owner !== snapshot.user ||
        !snapshot.account ||
        !Number.isFinite(entry.positionSeconds) ||
        (entry.durationSeconds !== null &&
          (!Number.isFinite(entry.durationSeconds) || entry.durationSeconds <= 0))
      )
        return;
      mutatePersonal(owner, (latest) => {
        const existing = latest.progress.find((row) => row.episodeId === entry.episodeId);
        return personalRepository.saveProgress(
          { id: owner, permissions: session.permissions },
          { ...entry, version: existing?.version ?? (existing ? 1 : 0) },
          new AbortController().signal,
        );
      });
    },
  };
  return <Context.Provider value={session}>{children}</Context.Provider>;
}
export function useSession() {
  const value = useContext(Context);
  if (!value) throw new Error('Thiếu SessionProvider');
  return value;
}
