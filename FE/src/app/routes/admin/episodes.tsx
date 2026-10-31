import { EpisodesScreen } from '@/features/admin-episodes/components/episodes-screen';
import { useSession } from '@/stores/session';
export function AdminEpisodesPage() {
  const { adminPreview } = useSession();
  return <EpisodesScreen key={adminPreview?.id ?? 'guest'} />;
}
