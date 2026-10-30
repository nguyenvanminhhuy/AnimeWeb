import type { AdminPreviewSession } from '@/types/admin';

// Read-only preview; never persisted or assigned to a member account.
export const adminPreviewSession: AdminPreviewSession = {
  displayName: 'Quản trị viên mẫu',
  permissions: ['admin:dashboard:read'],
};
