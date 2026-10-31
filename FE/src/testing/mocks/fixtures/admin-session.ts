import type { AdminPreviewSession } from '@/types/admin';

// Read-only preview; never persisted or assigned to a member account.
export const adminPreviewSession: AdminPreviewSession = {
  id: 'admin-preview-template',
  displayName: 'Quản trị viên mẫu',
  permissions: [
    'admin:dashboard:read',
    'admin:anime:read',
    'admin:genre:read',
    'admin:user:read',
    'admin:episode:read',
    'admin:playback:read',
    'admin:comment:read',
  ],
};
