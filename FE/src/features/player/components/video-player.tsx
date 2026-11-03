import { SubtitleTrack } from '@/features/player/components/subtitle-track';
import { playbackRepository } from '@/lib/api/repositories';
import { scheduleDeadline } from '@/utils/deadline';
import { useEffect, useRef, useState, useCallback } from 'react';
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
  onRefresh,
}: {
  detail: WatchDetail;
  source: PlaybackSource | undefined;
  onEnded: () => void;
  onRefresh?: () => void;
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
  const [expired, setExpired] = useState(
    !!source?.expiresAt &&
      (!Number.isFinite(Date.parse(source.expiresAt)) ||
        Date.parse(source.expiresAt) <= Date.now()),
  );
  const [subtitleFailed, setSubtitleFailed] = useState(false);
  const trackFailure = useCallback(() => setSubtitleFailed(true), []);
  useEffect(() => {
    if (!source?.expiresAt) return;
    return scheduleDeadline(Date.parse(source.expiresAt), () => setExpired(true));
  }, [source?.expiresAt]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !source || expired || source.type !== 'application/vnd.apple.mpegurl') return;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source.url;
      return;
    }
    let cancelled = false;
    let player: import('hls.js').default | undefined;
    import('hls.js')
      .then(({ default: Hls }) => {
        if (cancelled) return;
        if (!Hls.isSupported()) {
          setFailed(true);
          return;
        }
        player = new Hls();
        player.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) setFailed(true);
        });
        player.loadSource(source.url);
        player.attachMedia(video);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      player?.destroy();
    };
  }, [source, expired, attempt]);
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

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !source || expired) return;
    const controller = new AbortController();
    let session: { id: string; startedAt: string } | null = null;
    let counted = false;
    let busy = false;
    let lastAttempt = 0;
    const start = () => {
      if (session || busy) return;
      busy = true;
      void playbackRepository
        .startView(
          detail.episode.id,
          { positionSeconds: Math.floor(video.currentTime) },
          controller.signal,
        )
        .then((value) => {
          session = value;
        })
        .catch(() => {})
        .finally(() => {
          busy = false;
        });
    };
    const confirm = () => {
      if (
        !session ||
        counted ||
        busy ||
        video.paused ||
        Date.now() - Date.parse(session.startedAt) < 30000 ||
        Date.now() - lastAttempt < 5000
      )
        return;
      busy = true;
      lastAttempt = Date.now();
      void playbackRepository
        .confirmView(
          session.id,
          { positionSeconds: Math.floor(video.currentTime) },
          controller.signal,
        )
        .then((value) => {
          counted = value.counted;
        })
        .catch(() => {})
        .finally(() => {
          busy = false;
        });
    };
    video.addEventListener('playing', start);
    video.addEventListener('timeupdate', confirm);
    return () => {
      controller.abort();
      video.removeEventListener('playing', start);
      video.removeEventListener('timeupdate', confirm);
    };
  }, [detail.episode.id, source, expired, attempt]);
  if (expired)
    return (
      <div role="status" className="tw:p-6 tw:text-center">
        <p>Nguồn phát đã hết hạn. Tải lại để lấy nguồn mới.</p>
        <Button label="Tải lại nguồn" onClick={onRefresh} disabled={!onRefresh} />
      </div>
    );

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
        {source.type !== 'application/vnd.apple.mpegurl' ? (
          <source src={source.url} type={source.type} onError={() => setFailed(true)} />
        ) : null}
        {source.subtitles.map((track) => (
          <SubtitleTrack
            key={`${track.id}:${track.url}:${track.format}`}
            track={track}
            onFailure={trackFailure}
          />
        ))}
      </video>
      {subtitleFailed && (
        <p role="status" className="tw:p-4">
          Không tải được phụ đề. Bạn vẫn có thể xem video hoặc chọn nguồn khác.
        </p>
      )}
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
