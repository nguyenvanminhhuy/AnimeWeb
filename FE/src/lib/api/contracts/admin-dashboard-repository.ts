import type { MockState } from '@/lib/api/contracts/anime-repository';
import type { AdminDashboardData } from '@/types/admin';

export interface AdminDashboardRepository {
  getOverview(state: MockState, signal: AbortSignal): Promise<AdminDashboardData>;
}
