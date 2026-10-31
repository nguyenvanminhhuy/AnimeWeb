import type { MockState } from '@/lib/api/contracts/anime-repository';
import type { AdminDashboardData, AdminPreviewSession } from '@/types/admin';

export interface AdminDashboardRepository {
  getOverview(
    state: MockState,
    signal: AbortSignal,
    session: AdminPreviewSession,
  ): Promise<AdminDashboardData>;
}
