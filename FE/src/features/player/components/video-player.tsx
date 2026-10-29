import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useSession } from '@/stores/session';
import type { WatchDetail, PlaybackSource } from '@/types/player';

export function formatPlaybackTime(seconds: number) {
  const value = Math.max(0, Math.floor(seconds));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}

export function VideoPlayer({
  detail,
  source,
  onEnded,
}: {
  detail: WatchDetail;
  source: PlaybackSource | undefined;
  onEnded: () => void;
}) {
  const { user, progress, permissions, saveProgress } = useSession();
  const saved = progress.find((entry) => entry.episodeId === detail.episode.id);
  const resume = useRef(saved?.completed ? 0 : (saved?.positionSeconds ?? 0));
  const videoRef = useRef<HTMLVideoElement>(null);
  const writer = useRef(saveProgress);
  writer.current = saveProgress;
  const lastWrite = useRef(0);
  const hasPlayed = useRef(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const canSave = !!user && permissions.includes('progress:write:own');

  // This component is keyed by episode/source/account by WatchPage.
  useEffect(() => {
    const video = videoRef.current;
    function persist(force = false, completed = false) {
      if (
        !video ||
        !source ||
        !canSave ||
        !user ||
        !hasPlayed.current ||
        !Number.isFinite(video.duration) ||
        video.duration <= 0
      )
        return;
      const now = Date.now();
      if (!force && now - lastWrite.current < 10000) return;
      lastWrite.current = now;
      writer.current(user, {
        animeId: detail.anime.id,
        episodeId: detail.episode.id,
        episodeNumber: detail.episode.number,
        positionSeconds: completed ? video.duration : video.currentTime,
        durationSeconds: video.duration,
        completed,
      });
    }
    const tick = () => persist();
    const pause = () => persist(true);
    const end = () => {
      persist(true, true);
      onEnded();
    };
    const played = () => {
      hasPlayed.current = true;
    };
    const hidden = () => {
      if (document.visibilityState === 'hidden') persist(true);
    };
    video?.addEventListener('playing', played);
    video?.addEventListener('timeupdate', tick);
    video?.addEventListener('pause', pause);
    video?.addEventListener('ended', end);
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('pagehide', pause);
    return () => {
      persist(true, video?.ended ?? false);
      video?.removeEventListener('playing', played);
      video?.removeEventListener('timeupdate', tick);
      video?.removeEventListener('pause', pause);
      video?.removeEventListener('ended', end);
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('pagehide', pause);
    };
  }, [detail, source, user, canSave, onEnded, attempt]);

  if (!source)
    return (
      <div
        className="tw:aspect-video tw:max-phone:aspect-auto tw:min-h-64 tw:rounded-xl tw:bg-[#080b12] tw:border tw:border-[var(--aw-border)] tw:flex tw:flex-col tw:items-center tw:justify-center tw:p-6 tw:text-center"
        role="status"
      >
        <span className="tw:text-[var(--aw-accent)] tw:mb-4">
          <Icon name="play" size="lg" />
        </span>
        <h2 className="tw:text-xl tw:mb-3">Chưa có video demo</h2>
        <p className="tw:text-[var(--aw-muted)] tw:max-w-110 tw:mb-0">
          Tập phim đã có thông tin. Nguồn phát và phụ đề sẽ xuất hiện tại đây khi được bổ sung.
        </p>
      </div>
    );

  return (
    <div className="tw:rounded-xl tw:overflow-hidden tw:bg-black">
      <video
        key={attempt}
        ref={videoRef}
        className="tw:w-full tw:aspect-video tw:block"
        controls
        playsInline
        preload="metadata"
        aria-label={`Video tập ${detail.episode.number}: ${detail.episode.title}`}
        poster={detail.anime.bannerUrl}
        onLoadedMetadata={(event) => {
          const video = event.currentTarget;
          if (Number.isFinite(video.duration))
            video.currentTime = Math.min(resume.current, Math.max(0, video.duration - 1));
        }}
        onError={() => setFailed(true)}
      >
        <source src={source.url} type={source.type} onError={() => setFailed(true)} />
        {source.subtitles.map((track) => (
          <track
            key={track.id}
            kind="subtitles"
            src={track.url}
            srcLang={track.language}
            label={track.label}
            default={track.isDefault}
          />
        ))}
      </video>
      {failed && (
        <div role="alert" className="tw:p-5">
          <p>Không thể phát video. Hãy thử lại hoặc chọn nguồn khác.</p>
          <Button
            label="Thử phát lại"
            onClick={() => {
              resume.current = videoRef.current?.currentTime ?? resume.current;
              hasPlayed.current = false;
              lastWrite.current = 0;
              setFailed(false);
              setAttempt((value) => value + 1);
            }}
          />
        </div>
      )}
    </div>
  );
}
