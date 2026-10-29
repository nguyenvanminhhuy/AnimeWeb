import type { WatchDetail } from '@/types/player';
import type { MockState } from '@/lib/api/contracts/anime-repository';

export interface PlaybackRepository {
  getEpisode(id: string, state: MockState): Promise<WatchDetail | null>;
}
