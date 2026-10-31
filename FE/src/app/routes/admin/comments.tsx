import { CommentsScreen } from '@/features/admin-comments/components/comments-screen';
import { useSession } from '@/stores/session';
export function AdminCommentsPage() {
  const { adminPreview } = useSession();
  return <CommentsScreen key={adminPreview?.id ?? 'guest'} />;
}
