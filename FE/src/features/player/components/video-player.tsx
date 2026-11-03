import { SubtitleTrack } from '@/features/player/components/subtitle-track';
import { playbackRepository } from '@/lib/api/repositories';
import { scheduleDeadline } from '@/utils/deadline';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Selectbox } from '@/components/ui/selectbox';
import {
  readPlayerPreferences,
  writePlayerPreferences,
} from '@/features/player/utils/player-preferences';
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
  getResumePosition,
  onPositionSnapshot,
}: {
  detail: WatchDetail;
  source: PlaybackSource | undefined;
  onEnded: () => void;
  onRefresh?: () => void;
  getResumePosition?: () => number | undefined;
  onPositionSnapshot?: (seconds: number) => void;
}) {
  const { user, progress, permissions, saveProgress, progressConflicts, resolveProgressConflict } =
    useSession();
  const conflict = progressConflicts.find((row) => row.episodeId === detail.episode.id);
  const [resolving, setResolving] = useState(false);
  const [conflictError, setConflictError] = useState('');
  const saved = progress.find((entry) => entry.episodeId === detail.episode.id);
  const resume = useRef(saved?.completed ? 0 : (saved?.positionSeconds ?? 0));
  const latestSaved = useRef(saved);
  latestSaved.current = saved;
  const [preferences, setPreferences] = useState(readPlayerPreferences);
  const preferencesRef = useRef(preferences);
  preferencesRef.current = preferences;
  const snapshot = useRef(onPositionSnapshot);
  snapshot.current = onPositionSnapshot;
  useEffect(() => {
    writePlayerPreferences(preferences);
  }, [preferences]);
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
  const reported = useRef(new Set<string>());
  useEffect(() => {
    const controller = new AbortController();
    const kinds: ('media' | 'hls' | 'subtitle' | 'expired')[] = [];
    if (failed) kinds.push(source?.type === 'application/vnd.apple.mpegurl' ? 'hls' : 'media');
    if (subtitleFailed) kinds.push('subtitle');
    if (expired) kinds.push('expired');
    for (const kind of kinds) {
      const key = `${attempt}:${kind}`;
      if (reported.current.has(key)) continue;
      reported.current.add(key);
      void playbackRepository.report(detail.episode.id, kind, controller.signal).catch(() => {});
    }
    return () => controller.abort();
  }, [failed, subtitleFailed, expired, attempt, source?.type, detail.episode.id]);
  useEffect(() => {
    if (conflict) videoRef.current?.pause();
  }, [conflict]);
  async function resolveConflict(useRemote: boolean) {
    if (resolving) return;
    setResolving(true);
    setConflictError('');
    try {
      const remote = await resolveProgressConflict(detail.episode.id);
      if (useRemote && videoRef.current) {
        hasPlayed.current = false;
        const position = remote?.completed ? 0 : (remote?.positionSeconds ?? 0);
        videoRef.current.currentTime = Number.isFinite(videoRef.current.duration)
          ? Math.min(position, Math.max(0, videoRef.current.duration - 1))
          : position;
      }
    } catch {
      setConflictError('Chưa tải được tiến độ mới. Hãy thử lại.');
    } finally {
      setResolving(false);
    }
  }
  useEffect(() => {
    const video = videoRef.current;
    if (
      video &&
      video.readyState >= 1 &&
      !hasPlayed.current &&
      video.currentTime === 0 &&
      saved &&
      !saved.completed &&
      getResumePosition?.() === undefined &&
      Number.isFinite(video.duration)
    )
      video.currentTime = Math.min(saved.positionSeconds, Math.max(0, video.duration - 1));
  }, [saved?.positionSeconds, saved?.completed, getResumePosition]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const current = preferencesRef.current;
    video.volume = current.volume;
    video.muted = current.muted;
    video.playbackRate = current.rate;
    const sync = () =>
      setPreferences((value) => ({
        ...value,
        volume: video.volume,
        muted: video.muted,
        rate: video.playbackRate,
      }));
    video.addEventListener('volumechange', sync);
    video.addEventListener('ratechange', sync);
    return () => {
      video.removeEventListener('volumechange', sync);
      video.removeEventListener('ratechange', sync);
    };
  }, [attempt, expired, source]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const apply = () => {
      const tracks = Array.from(video.querySelectorAll('track'));
      const selected =
        preferences.subtitle === 'default'
          ? tracks.find((track) => track.default)
          : tracks.find((track) => track.srclang === preferences.subtitle);
      for (const track of tracks)
        track.track.mode =
          track === selected && preferences.subtitle !== 'off' ? 'showing' : 'disabled';
    };
    apply();
    const sync = () => {
      const showing = Array.from(video.textTracks).find((track) => track.mode === 'showing');
      const tracks = Array.from(video.querySelectorAll('track'));
      const expected =
        preferencesRef.current.subtitle === 'default'
          ? tracks.find((track) => track.default)?.srclang
          : preferencesRef.current.subtitle === 'off'
            ? undefined
            : preferencesRef.current.subtitle;
      if (
        showing?.language !== expected &&
        (showing || expected === undefined || tracks.some((track) => track.srclang === expected))
      )
        setPreferences((value) => ({ ...value, subtitle: showing?.language ?? 'off' }));
    };
    video.textTracks.addEventListener('addtrack', apply);
    video.textTracks.addEventListener('change', sync);
    video.addEventListener('loadedmetadata', apply);
    return () => {
      video.textTracks.removeEventListener('addtrack', apply);
      video.textTracks.removeEventListener('change', sync);
      video.removeEventListener('loadedmetadata', apply);
    };
  }, [preferences.subtitle, attempt, source, expired]);
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
      if (video && hasPlayed.current && Number.isFinite(video.currentTime))
        snapshot.current?.(video.ended ? 0 : video.currentTime);
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
          const savedPosition = latestSaved.current?.completed
            ? 0
            : latestSaved.current?.positionSeconds;
          const position =
            getResumePosition?.() ??
            (attempt > 0 ? resume.current : (savedPosition ?? resume.current));
          if (Number.isFinite(video.duration))
            video.currentTime = Math.min(Math.max(0, position), Math.max(0, video.duration - 1));
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
      {conflict && (
        <div role="alert" className="tw:p-4 tw:bg-[#252137]">
          <p>Tiến độ đã được cập nhật ở tab hoặc thiết bị khác. Đã tạm dừng đồng bộ để bạn chọn.</p>
          {conflict.remote && (
            <p>
              Tiến độ đã lưu: {formatPlaybackTime(conflict.remote.positionSeconds)}
              {conflict.remote.completed ? ' · Đã xem xong' : ''}.
            </p>
          )}
          {conflictError && <p>{conflictError}</p>}
          <div className="tw:flex tw:flex-wrap tw:gap-3">
            <Button
              label="Tiếp tục ở vị trí hiện tại"
              loading={resolving}
              onClick={() => void resolveConflict(false)}
            />
            <Button
              variant="quiet"
              label="Dùng tiến độ đã lưu"
              disabled={resolving}
              onClick={() => void resolveConflict(true)}
            />
          </div>
        </div>
      )}
      <div className="tw:flex tw:flex-wrap tw:gap-4 tw:items-end tw:p-4 tw:bg-[#141925]">
        <Button
          variant="quiet"
          size="sm"
          label={preferences.muted ? 'Bật tiếng' : 'Tắt tiếng'}
          aria-pressed={preferences.muted}
          onClick={() => {
            if (videoRef.current) videoRef.current.muted = !videoRef.current.muted;
          }}
        />
        <label>
          Âm lượng {Math.round(preferences.volume * 100)}%
          <Input
            type="range"
            min={0}
            max={1}
            step={0.05}
            aria-label="Âm lượng"
            value={preferences.volume}
            onChange={(event) => {
              if (videoRef.current) {
                videoRef.current.volume = Number(event.target.value);
                videoRef.current.muted = false;
              }
            }}
          />
        </label>
        <label>
          Tốc độ
          <Selectbox
            aria-label="Tốc độ phát"
            value={preferences.rate}
            options={[0.5, 0.75, 1, 1.25, 1.5, 2].map((value) => ({
              value: String(value),
              label: `${value}×`,
            }))}
            onChange={(event) => {
              if (videoRef.current) videoRef.current.playbackRate = Number(event.target.value);
            }}
          />
        </label>
        <label>
          Phụ đề
          <Selectbox
            aria-label="Phụ đề"
            value={preferences.subtitle}
            options={[
              { value: 'default', label: 'Mặc định' },
              { value: 'off', label: 'Tắt phụ đề' },
              ...Array.from(
                new Map(
                  source.subtitles.map((track) => [
                    track.language,
                    { value: track.language, label: track.label },
                  ]),
                ).values(),
              ),
              ...(!['default', 'off', ...source.subtitles.map((track) => track.language)].includes(
                preferences.subtitle,
              )
                ? [{ value: preferences.subtitle, label: 'Ngôn ngữ đã chọn không có ở nguồn này' }]
                : []),
            ]}
            onChange={(event) =>
              setPreferences((value) => ({ ...value, subtitle: event.target.value }))
            }
          />
        </label>
      </div>
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
