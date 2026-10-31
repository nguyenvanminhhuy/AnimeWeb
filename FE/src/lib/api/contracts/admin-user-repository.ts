import type { AdminPreviewSession } from '@/types/admin';
import type { AdminUser, AdminUsersQuery, AdminUsersResult } from '@/types/admin-user';
import type { MockState } from '@/lib/api/contracts/anime-repository';

export interface AdminUserRepository {
  list(
    query: AdminUsersQuery,
    state: MockState,
    signal: AbortSignal,
    session: AdminPreviewSession,
  ): Promise<AdminUsersResult>;
  getById(
    id: string,
    state: MockState,
    signal: AbortSignal,
    session: AdminPreviewSession,
  ): Promise<AdminUser | null>;
}
