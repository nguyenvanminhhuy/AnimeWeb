import type { AdminPreviewSession } from '@/types/admin';
import type { AdminUser, AdminUsersQuery, AdminUsersResult } from '@/types/admin-user';
import type { MockState } from '@/lib/api/contracts/anime-repository';

export interface AdminUserRepository {
  setRole(
    id: string,
    role: AdminUser['roles'][number],
    version: number,
    signal: AbortSignal,
    session: AdminPreviewSession,
  ): Promise<AdminUser>;
  setStatus(
    id: string,
    status: AdminUser['status'],
    version: number,
    signal: AbortSignal,
    session: AdminPreviewSession,
  ): Promise<AdminUser>;
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
