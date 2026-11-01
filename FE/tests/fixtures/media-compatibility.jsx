import { createRoot } from 'react-dom/client';
import { useCallback, useState } from 'react';
import { SessionProvider } from '@/stores/session';
import { VideoPlayer } from '@/features/player/components/video-player';
import { playbackRepository } from '@/lib/api/repositories';
import '@/styles/index.css';

// Intercepted media and fake repository only. No BE or playable content is used.
window.viewCalls = [];
playbackRepository.startView = async (id, input) => {
  window.viewCalls.push({ action: 'start', id, input });
  return { id: 'fixture-view', startedAt: new Date(Date.now() - 31000).toISOString() };
};
playbackRepository.confirmView = async (id, input) => {
  window.viewCalls.push({ action: 'confirm', id, input });
  return { counted: true };
};
const detail = await playbackRepository.getEpisode('episode-01-03', 'ready');
function Fixture() {
  const [mode, setMode] = useState('srt');
  const source = {
    id: mode,
    label: 'Fixture',
    url: mode === 'hls' ? '/__fixture.m3u8' : '/__fixture.mp4',
    type: mode === 'hls' ? 'application/vnd.apple.mpegurl' : 'video/mp4',
    expiresAt:
      mode === 'expired'
        ? '2020-01-01T00:00:00Z'
        : mode === 'invalid'
          ? 'invalid-date'
          : mode === 'long'
            ? new Date(Date.now() + 2147484647).toISOString()
            : null,
    subtitles:
      mode === 'srt'
        ? [
            {
              id: 'srt',
              format: 'srt',
              language: 'vi',
              label: 'Vietnamese',
              url: '/__fixture.srt',
              isDefault: true,
            },
          ]
        : [],
  };
  const ended = useCallback(() => {}, []);
  return (
    <>
      <button onClick={() => setMode('expired')}>Expired fixture</button>
      <button onClick={() => setMode('hls')}>HLS fixture</button>
      <button onClick={() => setMode('long')}>Long expiry fixture</button>
      <button onClick={() => setMode('invalid')}>Invalid expiry fixture</button>
      <VideoPlayer
        key={mode}
        detail={detail}
        source={source}
        onEnded={ended}
        onRefresh={() => setMode('fresh')}
      />
    </>
  );
}
createRoot(document.getElementById('root')).render(
  <SessionProvider>
    <Fixture />
  </SessionProvider>,
);
