import { AuditLog } from '@/features/admin-audit/components/audit-log';
import { useSession } from '@/stores/session';
export function AdminAuditPage() {
  const { permissions } = useSession();
  return permissions.includes('admin:audit:read') ? (
    <AuditLog />
  ) : (
    <p>Bạn chưa có quyền xem lịch sử quản trị.</p>
  );
}
