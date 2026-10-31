import { EpisodeFormScreen } from '@/features/admin-episodes/components/episode-form-screen';
import { useSession } from '@/stores/session';
import { useLocation } from 'react-router-dom';
export function AdminEpisodeFormPage() {
  const { adminPreview } = useSession();
  const location = useLocation();
  return <EpisodeFormScreen key={`${adminPreview?.id ?? 'guest'}:${location.key}`} />;
}
