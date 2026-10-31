import type { AdminPreviewSession } from '@/types/admin';
import type { AdminAnimeRow } from '@/types/admin-anime';
import { adminCatalogWorkspace } from '@/lib/api/mock/admin-catalog-workspace';
import { AdminAnimeError } from '@/utils/admin-anime-validation';

export function adminAnimeWorkspace(session: AdminPreviewSession, write = false): AdminAnimeRow[] {
  if (
    !import.meta.env.DEV ||
    !session.permissions.includes('admin:anime:read') ||
    (write && !session.permissions.includes('admin:anime:write'))
  )
    throw new AdminAnimeError('Bạn không có quyền thực hiện thao tác này.');
  return adminCatalogWorkspace(session).anime;
}

export function waitForAdminMock(signal: AbortSignal, fail = false): Promise<void> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException('Cancelled', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      if (fail) reject(new AdminAnimeError('Không thể lưu thay đổi mẫu. Vui lòng thử lại.'));
      else resolve();
    }, 350);
    signal.addEventListener('abort', abort, { once: true });
  });
}
