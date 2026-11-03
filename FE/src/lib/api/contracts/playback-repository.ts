import type { WatchDetail } from '@/types/player';
import type { MockState } from '@/lib/api/contracts/anime-repository';

export interface PlaybackRepository {
  report(
    episodeId: string,
    kind: 'media' | 'hls' | 'subtitle' | 'expired',
    signal: AbortSignal,
  ): Promise<void>;
  startView(
    episodeId: string,
    input: import('@/lib/api/backend/types').ViewInput,
    signal: AbortSignal,
  ): Promise<import('@/lib/api/backend/types').ViewStartDto>;
  confirmView(
    sessionId: string,
    input: import('@/lib/api/backend/types').ViewInput,
    signal: AbortSignal,
  ): Promise<import('@/lib/api/backend/types').ViewConfirmDto>;
  getEpisode(id: string, state: MockState): Promise<WatchDetail | null>;
}
