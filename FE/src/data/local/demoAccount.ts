import { isDemoUser } from '../../features/auth/auth.types';
import type { DemoUser } from '../../features/auth/auth.types';
export type { DemoUser } from '../../features/auth/auth.types';
export interface Progress {
  animeId: string;
  episodeId: string;
  episodeNumber: number;
  positionSeconds: number;
  durationSeconds: number;
  completed?: boolean;
  updatedAt?: string;
}
interface Account {
  version: 1;
  favorites: string[];
  progress: Progress[];
}
const sessionKey = 'aw:session:v1';
export const demoAccount = {
  readSession(): DemoUser | null {
    try {
      const value = JSON.parse(localStorage.getItem(sessionKey) ?? 'null');
      return value?.version === 1 && isDemoUser(value.user) ? value.user : null;
    } catch {
      return null;
    }
  },
  saveSession(user: DemoUser | null): boolean {
    try {
      if (user) localStorage.setItem(sessionKey, JSON.stringify({ version: 1, user }));
      else localStorage.removeItem(sessionKey);
      return true;
    } catch {
      return false;
    }
  },
  read(user: DemoUser): Account {
    try {
      const value = JSON.parse(localStorage.getItem(`aw:account:v1:${user}`) ?? 'null');
      if (
        value?.version === 1 &&
        Array.isArray(value.favorites) &&
        value.favorites.every((id: unknown) => typeof id === 'string') &&
        Array.isArray(value.progress) &&
        value.progress.every(
          (p: Progress) =>
            p &&
            typeof p.animeId === 'string' &&
            typeof p.episodeId === 'string' &&
            Number.isInteger(p.episodeNumber) &&
            p.episodeNumber > 0 &&
            Number.isFinite(p.positionSeconds) &&
            p.positionSeconds >= 0 &&
            Number.isFinite(p.durationSeconds) &&
            p.durationSeconds > 0 &&
            p.durationSeconds >= p.positionSeconds &&
            (p.completed === undefined || typeof p.completed === 'boolean') &&
            (p.updatedAt === undefined ||
              (typeof p.updatedAt === 'string' && Number.isFinite(Date.parse(p.updatedAt)))),
        )
      )
        return value;
    } catch {
      /* Invalid storage uses a safe demo account. */
    }
    return {
      version: 1,
      favorites: [],
      progress:
        user === 'viewer'
          ? [
              {
                animeId: 'anime-01',
                episodeId: 'episode-01-03',
                episodeNumber: 3,
                positionSeconds: 510,
                durationSeconds: 1440,
              },
              {
                animeId: 'anime-02',
                episodeId: 'episode-02-02',
                episodeNumber: 2,
                positionSeconds: 960,
                durationSeconds: 1440,
              },
            ]
          : [],
    };
  },
  save(user: DemoUser, account: Account): boolean {
    try {
      localStorage.setItem(`aw:account:v1:${user}`, JSON.stringify(account));
      return true;
    } catch {
      return false;
    }
  },
};
