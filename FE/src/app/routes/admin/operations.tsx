import { OperationsPanel } from '@/features/operations/components/operations-panel';
import { useSession } from '@/stores/session';
export function AdminOperationsPage() {
  const { permissions } = useSession();
  return permissions.includes('admin:dashboard:read') ? (
    <OperationsPanel />
  ) : (
    <p>Bạn chưa có quyền xem giám sát vận hành.</p>
  );
}
