import type { AdminPreviewSession } from '@/types/admin';
import type {
  AdminGenre,
  AdminGenreInput,
  AdminGenreQuery,
  AdminGenreResult,
} from '@/types/admin-genre';
import type { MockState } from '@/lib/api/contracts/anime-repository';

export interface AdminGenreRepository {
  list(
    query: AdminGenreQuery,
    state: MockState,
    signal: AbortSignal,
    session: AdminPreviewSession,
  ): Promise<AdminGenreResult>;
  options(signal: AbortSignal, session: AdminPreviewSession): Promise<AdminGenre[]>;
  create(
    input: AdminGenreInput,
    signal: AbortSignal,
    session: AdminPreviewSession,
    fail?: boolean,
  ): Promise<AdminGenre>;
  update(
    id: string,
    input: AdminGenreInput,
    signal: AbortSignal,
    session: AdminPreviewSession,
    fail?: boolean,
  ): Promise<AdminGenre>;
  remove(
    id: string,
    signal: AbortSignal,
    session: AdminPreviewSession,
    fail?: boolean,
  ): Promise<void>;
}
