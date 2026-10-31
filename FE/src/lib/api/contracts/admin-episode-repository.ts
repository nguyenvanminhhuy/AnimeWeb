import type { AdminPreviewSession } from '@/types/admin';
import type {
  AdminEpisodeCatalog,
  AdminEpisodeInput,
  AdminSeasonInput,
} from '@/types/admin-episode';

export interface AdminEpisodeRepository {
  getCatalog(
    signal: AbortSignal,
    session: AdminPreviewSession,
    fail?: boolean,
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
    signal: AbortSignal,
    session: AdminPreviewSession,
    fail?: boolean,
  ): Promise<void>;
}
