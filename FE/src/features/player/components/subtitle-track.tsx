import { useEffect, useState } from 'react';
import type { PlaybackSource } from '@/types/player';
import { srtToVtt } from '@/features/player/utils/subtitles';
export function SubtitleTrack({
  track,
  onFailure,
}: {
  track: PlaybackSource['subtitles'][number];
  onFailure: () => void;
}) {
  const [converted, setConverted] = useState('');
  useEffect(() => {
    if (track.format !== 'srt') return;
    const controller = new AbortController();
    let blobUrl = '';
    fetch(track.url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Subtitle unavailable');
        return response.text();
      })
      .then((text) => {
        if (controller.signal.aborted) return;
        blobUrl = URL.createObjectURL(new Blob([srtToVtt(text)], { type: 'text/vtt' }));
        setConverted(blobUrl);
      })
      .catch(() => {
        if (!controller.signal.aborted) onFailure();
      });
    return () => {
      controller.abort();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [track.url, track.format, onFailure]);
  if (track.format === 'srt' && !converted) return null;
  return (
    <track
      kind="subtitles"
      src={track.format === 'srt' ? converted : track.url}
      srcLang={track.language}
      label={track.label}
      default={track.isDefault}
      onError={onFailure}
    />
  );
}
