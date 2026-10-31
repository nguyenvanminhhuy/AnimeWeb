import type { AdminPreviewSession } from '@/types/admin';
import type {
  AdminPlaybackCatalog,
  AdminSourceInput,
  AdminSubtitleInput,
} from '@/types/admin-playback';

export interface AdminPlaybackRepository {
  getCatalog(
    signal: AbortSignal,
    session: AdminPreviewSession,
    fail?: boolean,
  ): Promise<AdminPlaybackCatalog>;
  saveSource(
    id: string | null,
    input: AdminSourceInput,
    signal: AbortSignal,
    session: AdminPreviewSession,
    fail?: boolean,
  ): Promise<void>;
  saveSubtitle(
    id: string | null,
    input: AdminSubtitleInput,
    signal: AbortSignal,
    session: AdminPreviewSession,
    fail?: boolean,
  ): Promise<void>;
  remove(
    kind: 'source' | 'subtitle',
    id: string,
    signal: AbortSignal,
    session: AdminPreviewSession,
    fail?: boolean,
  ): Promise<void>;
}
