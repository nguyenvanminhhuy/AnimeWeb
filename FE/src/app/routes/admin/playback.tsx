import { PlaybackScreen } from '@/features/admin-playback/components/playback-screen';
import { useSession } from '@/stores/session';
export function AdminPlaybackPage() {
  const { adminPreview } = useSession();
  return <PlaybackScreen key={adminPreview?.id ?? 'guest'} />;
}
