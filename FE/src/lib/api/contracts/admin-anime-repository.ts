import type {
  AdminAnimeQuery,
  AdminAnimeResult,
  AdminAnimeInput,
  AdminAnimeRow,
} from '@/types/admin-anime';
import type { AdminPreviewSession } from '@/types/admin';
import type { MockState } from '@/lib/api/contracts/anime-repository';

export interface AdminAnimeRepository {
  list(
    query: AdminAnimeQuery,
    state: MockState,
    signal: AbortSignal,
    session: AdminPreviewSession,
  ): Promise<AdminAnimeResult>;
  get(
    id: string,
    signal: AbortSignal,
    session: AdminPreviewSession,
    fail?: boolean,
  ): Promise<AdminAnimeRow | null>;
  create(
    input: AdminAnimeInput,
    signal: AbortSignal,
    session: AdminPreviewSession,
    fail?: boolean,
  ): Promise<AdminAnimeRow>;
  update(
    id: string,
    input: AdminAnimeInput,
    signal: AbortSignal,
    session: AdminPreviewSession,
    fail?: boolean,
  ): Promise<AdminAnimeRow>;
  remove(
    id: string,
    signal: AbortSignal,
    session: AdminPreviewSession,
    fail?: boolean,
  ): Promise<void>;
}
