import { isMockApi } from '@/config/api';
import { isDemoUser } from '@/utils/auth';
import { scheduleDeadline } from '@/utils/deadline';
import { backendCredentials } from '@/lib/api/backend/credentials';
import type { LoginDto, ProfileDto } from '@/lib/api/backend/types';
import { ApiError } from '@/lib/api/backend/error';
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
  progressConflicts: { episodeId: string; remote?: Progress }[];
  resolveProgressConflict: (episodeId: string) => Promise<Progress | undefined>;
  user: DemoUser | null;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  canEditAvatar: boolean;
  saveAvatar: (image: Blob | null, signal: AbortSignal) => Promise<void>;
  refreshProfile: (signal: AbortSignal) => Promise<void>;
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
  const blockedProgress = useRef(new Set<string>());
  const [progressConflicts, setProgressConflicts] = useState<
    { owner: string; episodeId: string; remote?: Progress }[]
  >([]);
  useEffect(() => {
    blockedProgress.current.clear();
    setProgressConflicts([]);
  }, [user]);
  const [initializing, setInitializing] = useState(true);
  const authRevision = useRef(0);
  const personalRevision = useRef(0);
  const mutationQueue = useRef<Promise<void>>(Promise.resolve());
  const [credentials, setCredentials] = useState<LoginDto | null>(null);
  const [adminPreview, setAdminPreview] = useState<AdminPreviewSession | null>(null);
  const current = useRef({ user, account });
  current.current = { user, account };
  function applyProfile(next: ProfileDto, generation: number) {
    if (generation !== authRevision.current || current.current.user !== next.id) return;
    setProfile(next);
    setCredentials((previous) =>
      previous?.profile.id === next.id ? { ...previous, profile: next } : previous,
    );
  }
  function invalidateSession(message = 'Phiên đã hết hạn. Vui lòng đăng nhập lại.') {
    authRevision.current++;
    backendCredentials.write(null);
    setCredentials(null);
    setProfile(null);
    setAccount(null);
    setAdminPreview(null);
    current.current = { user: null, account: null };
    setNotice(message);
    if (isMockApi) demoAccount.saveSession(null);
  }
  useEffect(() => backendCredentials.subscribe(() => invalidateSession()), []);
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
      invalidateSession();
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
    task: (
      snapshot: NonNullable<typeof account>,
    ) => Promise<PersonalSnapshot | NonNullable<typeof account>>,
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
      } catch (error) {
        if (current.current.user === owner && generation === authRevision.current)
          setNotice(error instanceof Error ? error.message : 'Không lưu được dữ liệu.');
      }
    };
    // Read versions when each queued write starts, including pause/ended/unmount in the same tick.
    mutationQueue.current = mutationQueue.current.then(run, run);
    return mutationQueue.current;
  }
  const session: Session = {
    progressConflicts: progressConflicts.filter((conflict) => conflict.owner === user),
    async resolveProgressConflict(episodeId) {
      const owner = current.current.user;
      if (!owner) throw new Error('Vui lòng đăng nhập lại.');
      const key = `${owner}:${episodeId}`,
        revision = authRevision.current;
      let remote: Progress | undefined,
        failed = false;
      await mutatePersonal(owner, async () => {
        try {
          const next = await personalRepository.snapshot(
            { id: owner, permissions: session.permissions },
            new AbortController().signal,
          );
          if (revision !== authRevision.current || current.current.user !== owner)
            throw new DOMException('Phiên đã thay đổi.', 'AbortError');
          remote = next.progress.find((row) => row.episodeId === episodeId);
          blockedProgress.current.delete(key);
          setProgressConflicts((rows) =>
            rows.filter((row) => row.owner !== owner || row.episodeId !== episodeId),
          );
          return next;
        } catch (error) {
          failed = true;
          throw error;
        }
      });
      if (failed || revision !== authRevision.current)
        throw new Error('Chưa tải được tiến độ mới. Hãy thử lại.');
      return remote;
    },
    user,
    initializing,
    invalidateSession,
    accessToken: credentials?.accessToken ?? null,
    expiresAt: credentials?.expiresAt ?? null,
    roles: credentials?.profile.roles ?? (user ? ['user'] : []),
    displayName: adminPreview?.displayName ?? profile?.displayName ?? '',
    email: profile?.email ?? '',
    avatarUrl: profile?.avatarUrl ?? null,
    canEditAvatar:
      authRepository.mode === 'backend' &&
      !!credentials?.profile.permissions.includes('profile:avatar:write:own'),
    async refreshProfile(signal) {
      const generation = authRevision.current;
      const next = await authRepository.readProfile(signal);
      signal.throwIfAborted();
      applyProfile(next, generation);
    },
    async saveAvatar(image, signal) {
      if (!credentials || authRepository.mode !== 'backend')
        throw new Error('Vui lòng đăng nhập lại.');
      const generation = authRevision.current;
      try {
        let version = credentials.profile.version;
        if (!Number.isSafeInteger(version) || version < 1) {
          const latest = await authRepository.readProfile(signal);
          signal.throwIfAborted();
          applyProfile(latest, generation);
          version = latest.version;
          if (!Number.isSafeInteger(version) || version < 1)
            throw new Error(
              'Máy chủ chưa hỗ trợ ảnh đại diện. Hãy khởi động lại BE và đăng nhập lại.',
            );
        }
        signal.throwIfAborted();
        if (generation !== authRevision.current || current.current.user !== credentials.profile.id)
          throw new DOMException('Phiên đã thay đổi.', 'AbortError');
        const next = await authRepository.saveAvatar(image, version, signal);
        signal.throwIfAborted();
        applyProfile(next, generation);
      } catch (error) {
        if (error instanceof ApiError && error.status === 409 && !signal.aborted) {
          const next = await authRepository.readProfile(signal);
          signal.throwIfAborted();
          applyProfile(next, generation);
        }
        throw error;
      }
    },
    favorites: account?.favorites ?? [],
    progress: account?.progress ?? [],
    permissions:
      isMockApi && adminPreview
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
      if (!isMockApi) return;
      authRevision.current++;
      setInitializing(false);
      setCredentials(null);
      if (!isMockApi) return;
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
                'admin:user:status:write',
                'admin:user:role:write',
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
      if (!isMockApi && typeof next === 'string') return false;
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
      mutatePersonal(user, (snapshot) => {
        const entry = snapshot.library?.find((row) => row.animeId === id);
        const version = entry?.version ?? (snapshot.favorites.includes(id) ? 1 : 0);
        return personalRepository.setFavorite(
          actor,
          id,
          isFavorite,
          version,
          new AbortController().signal,
        );
      });
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
      mutatePersonal(owner, async (latest) => {
        const key = `${owner}:${entry.episodeId}`,
          revision = authRevision.current;
        if (blockedProgress.current.has(key)) return latest;
        const existing = latest.progress.find((row) => row.episodeId === entry.episodeId);
        try {
          return await personalRepository.saveProgress(
            { id: owner, permissions: session.permissions },
            { ...entry, version: existing?.version ?? (existing ? 1 : 0) },
            new AbortController().signal,
          );
        } catch (error) {
          if (!(error instanceof ApiError) || error.status !== 409) throw error;
          if (revision !== authRevision.current || current.current.user !== owner) return latest;
          blockedProgress.current.add(key);
          setProgressConflicts((rows) => [
            ...rows.filter((row) => row.owner !== owner || row.episodeId !== entry.episodeId),
            { owner, episodeId: entry.episodeId },
          ]);
          try {
            const next = await personalRepository.snapshot(
              { id: owner, permissions: session.permissions },
              new AbortController().signal,
            );
            if (revision !== authRevision.current || current.current.user !== owner) return latest;
            const remote = next.progress.find((row) => row.episodeId === entry.episodeId);
            setProgressConflicts((rows) =>
              rows.map((row) =>
                row.owner === owner && row.episodeId === entry.episodeId ? { ...row, remote } : row,
              ),
            );
            return next;
          } catch {
            return latest;
          }
        }
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
