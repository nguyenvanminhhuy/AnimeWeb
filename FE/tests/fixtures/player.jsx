import { createRoot } from 'react-dom/client';
import { useCallback, useState } from 'react';
import { SessionProvider, useSession } from '@/stores/session';
import { VideoPlayer } from '@/features/player/components/video-player';
import { Button } from '@/components/ui/button';
import { mockPlaybackRepository } from '@/lib/api/mock/mock-playback-repository';
import '@/styles/index.css';

// Event-contract fixture only: no playable asset is supplied or claimed.
const details = await Promise.all(
  ['episode-01-03', 'episode-01-04'].map((id) => mockPlaybackRepository.getEpisode(id, 'ready')),
);
const source = {
  id: 'fixture',
  label: 'Fixture',
  url: '/__player-event-fixture.webm',
  type: 'video/webm',
  subtitles: [],
};
function Fixture() {
  const { user, login, logout, notice } = useSession();
  const [index, setIndex] = useState(0);
  const [ended, setEnded] = useState(0);
  const onEnded = useCallback(() => setEnded((count) => count + 1), []);
  return (
    <>
      <Button label="Viewer" onClick={() => login('viewer')} />
      <Button label="Newcomer" onClick={() => login('newcomer')} />
      <Button label="Logout" onClick={logout} />
      <Button label="Next" onClick={() => setIndex((value) => 1 - value)} />
      <output id="ended">{ended}</output>
      <output id="notice">{notice}</output>
      <VideoPlayer
        key={`${index}:${user}`}
        detail={details[index]}
        source={source}
        onEnded={onEnded}
      />
    </>
  );
}
createRoot(document.getElementById('root')).render(
  <SessionProvider>
    <Fixture />
  </SessionProvider>,
);
