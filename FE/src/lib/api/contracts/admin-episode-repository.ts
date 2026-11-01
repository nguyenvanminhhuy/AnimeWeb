import type { AdminPreviewSession } from '@/types/admin';
import type {
  AdminEpisodeCatalog,
  AdminEpisodeInput,
  AdminSeasonInput,
} from '@/types/admin-episode';

export interface AdminEpisodeRepository {
  list(
    query: import('@/types/admin-query').AdminListQuery,
    signal: AbortSignal,
    session: AdminPreviewSession,
    fail?: boolean,
  ): Promise<import('@/types/admin-episode').AdminEpisodePage>;
  getById(
    id: string,
    signal: AbortSignal,
    session: AdminPreviewSession,
  ): Promise<import('@/types/admin-episode').AdminEpisode | null>;

  getCatalog(
    signal: AbortSignal,
    session: AdminPreviewSession,
    fail?: boolean,
    form?: { episodeId?: string; animeId?: string; seasonId?: string },
  ): Promise<AdminEpisodeCatalog>;
  saveSeason(
    id: string | null,
    input: AdminSeasonInput,
    signal: AbortSignal,
    session: AdminPreviewSession,
    fail?: boolean,
  ): Promise<void>;
  saveEpisode(
    id: string | null,
    input: AdminEpisodeInput,
    signal: AbortSignal,
    session: AdminPreviewSession,
    fail?: boolean,
  ): Promise<void>;
  remove(
    kind: 'season' | 'episode',
    id: string,
    version: number,
    signal: AbortSignal,
    session: AdminPreviewSession,
    fail?: boolean,
  ): Promise<void>;
}
