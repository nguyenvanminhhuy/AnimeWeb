import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Selectbox } from '@/components/ui/selectbox';
import { ContentState } from '@/components/common/content-state';
import { useSession } from '@/stores/session';
import { useWatchEpisode } from '@/features/player/hooks/use-watch-episode';
import { VideoPlayer, formatPlaybackTime } from '@/features/player/components/video-player';
import { paths } from '@/config/paths';
import type { WatchDetail } from '@/types/player';

export function WatchPage() {
  const [theater, setTheater] = useState(false);
  const [autoNext, setAutoNext] = useState(false);
  const { data, loading, error, retry } = useWatchEpisode();
  if (loading)
    return (
      <div className="aw-shell tw:mx-auto tw:py-10" role="status" aria-label="Đang tải tập phim">
        <div className="aw-skeleton tw:aspect-video tw:rounded-xl" />
        <p className="tw:mt-4">Đang chuẩn bị tập phim…</p>
      </div>
    );
  if (error) return <ContentState title="Chưa thể mở tập phim" description={error} retry={retry} />;
  if (!data)
    return (
      <section className="aw-shell tw:mx-auto tw:py-10">
        <h1 className="tw:text-2xl">Không tìm thấy tập phim</h1>
        <p>Tập này không tồn tại hoặc chưa được công bố.</p>
        <Button as="link" to={paths.explore} label="Khám phá anime" />
      </section>
    );
  return (
    <WatchContent
      detail={data}
      theater={theater}
      autoNext={autoNext}
      toggleTheater={() => setTheater((value) => !value)}
      toggleAutoNext={() => setAutoNext((value) => !value)}
    />
  );
}

function WatchContent({
  detail,
  theater,
  autoNext,
  toggleTheater,
  toggleAutoNext,
}: {
  detail: WatchDetail;
  theater: boolean;
  autoNext: boolean;
  toggleTheater: () => void;
  toggleAutoNext: () => void;
}) {
  const { user, progress } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const [sourceId, setSourceId] = useState('');
  const source = detail.sources.find((entry) => entry.id === sourceId) ?? detail.sources[0];
  const currentSeason = detail.anime.seasons.find((entry) => entry.id === detail.episode.seasonId);
  const selectedSeason =
    detail.anime.seasons.find((entry) => entry.id === params.get('season')) ?? currentSeason;
  const episodes = detail.episodes.filter((entry) => entry.seasonId === selectedSeason?.id);
  const index = detail.episodes.findIndex((entry) => entry.id === detail.episode.id);
  const previous = index > 0 ? detail.episodes[index - 1] : undefined;
  const next = index >= 0 ? detail.episodes[index + 1] : undefined;
  const saved = progress.find((entry) => entry.episodeId === detail.episode.id);

  useEffect(() => {
    if (params.has('season') && params.get('season') !== selectedSeason?.id) {
      const corrected = new URLSearchParams(params);
      if (selectedSeason) corrected.set('season', selectedSeason.id);
      else corrected.delete('season');
      setParams(corrected, { replace: true, preventScrollReset: true });
    }
  }, [params, selectedSeason, setParams]);

  const onEnded = useCallback(() => {
    if (autoNext && next) navigate(paths.watch(next.id));
  }, [autoNext, next, navigate]);

  return (
    <div
      className="aw-shell aw-watch tw:mx-auto tw:py-7"
      data-episode-id={detail.episode.id}
      data-theater={theater}
    >
      <nav
        aria-label="Đường dẫn"
        className="tw:flex tw:flex-wrap tw:gap-2 tw:mb-6 tw:text-[var(--aw-muted)]"
      >
        <Link to={paths.home}>Trang chủ</Link>
        <span aria-hidden="true">/</span>
        <Link to={paths.animeDetail(detail.anime.slug)}>{detail.anime.title}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Tập {detail.episode.number}</span>
      </nav>
      <header className="tw:flex tw:flex-wrap tw:justify-between tw:items-center tw:gap-4 tw:mb-6">
        <div>
          <p className="aw-eyebrow tw:mb-2">
            {currentSeason?.title} · TẬP {String(detail.episode.number).padStart(2, '0')}
          </p>
          <h1 className="tw:text-3xl tw:max-mobile:text-2xl tw:mb-2">{detail.anime.title}</h1>
          <p className="tw:text-[var(--aw-muted)] tw:mb-0">{detail.episode.title}</p>
        </div>
        <Button
          as="link"
          variant="quiet"
          to={paths.animeDetail(detail.anime.slug)}
          label="Thông tin phim"
          startIcon={<Icon name="arrow-left" size="sm" />}
        />
      </header>
      <div
        className={
          theater
            ? 'tw:grid tw:grid-cols-1 tw:gap-6'
            : 'tw:grid tw:grid-cols-[minmax(0,1fr)_320px] tw:gap-6 tw:max-tablet:grid-cols-1'
        }
      >
        <section aria-label="Trình phát" className="tw:min-w-0">
          <VideoPlayer
            key={`${detail.episode.id}:${source?.id ?? 'none'}:${user ?? 'guest'}`}
            detail={detail}
            source={source}
            onEnded={onEnded}
          />
          <div className="tw:flex tw:flex-wrap tw:gap-3 tw:items-center tw:justify-between tw:py-4">
            <nav aria-label="Chuyển tập" className="tw:flex tw:gap-2">
              {previous ? (
                <Button
                  as="link"
                  variant="glass"
                  to={paths.watch(previous.id)}
                  label="Tập trước"
                  startIcon={<Icon name="arrow-left" size="sm" />}
                />
              ) : (
                <Button variant="glass" disabled label="Tập trước" />
              )}
              {next ? (
                <Button
                  as="link"
                  variant="glass"
                  to={paths.watch(next.id)}
                  label="Tập sau"
                  endIcon={<Icon name="arrow-right" size="sm" />}
                />
              ) : (
                <Button variant="glass" disabled label="Tập sau" />
              )}
            </nav>
            <Button
              variant="quiet"
              label={theater ? 'Thoát chế độ rạp' : 'Chế độ rạp'}
              aria-pressed={theater}
              onClick={toggleTheater}
            />
          </div>
          <div className="aw-surface tw:p-5 tw:rounded-xl tw:grid tw:grid-cols-2 tw:gap-4 tw:max-phone:grid-cols-1">
            <div>
              <label htmlFor="watch-source" className="tw:block tw:mb-2">
                Nguồn phát
              </label>
              <Selectbox
                id="watch-source"
                disabled={!source}
                value={source?.id ?? ''}
                onChange={(event) => setSourceId(event.target.value)}
              >
                {!source && <option value="">Chưa có nguồn phát</option>}
                {detail.sources.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label}
                  </option>
                ))}
              </Selectbox>
            </div>
            <div className="tw:flex tw:flex-col tw:justify-center tw:gap-2">
              <label className="tw:flex tw:items-center tw:gap-2">
                <Input
                  type="checkbox"
                  variant="unstyled"
                  checked={autoNext}
                  onChange={toggleAutoNext}
                />
                Tự chuyển tập
              </label>
              <span className="tw:text-[var(--aw-muted)]">
                {source?.subtitles.length
                  ? 'Chọn phụ đề trong điều khiển video.'
                  : 'Chưa có phụ đề.'}
              </span>
            </div>
          </div>
          <div className="tw:mt-5 tw:text-[var(--aw-muted)] tw:leading-relaxed">
            {user ? (
              <p>
                {saved
                  ? `Tiến độ đã lưu: ${formatPlaybackTime(saved.positionSeconds)} / ${formatPlaybackTime(saved.durationSeconds)}${saved.completed ? ' · Đã xem xong' : ''}.`
                  : 'Tiến độ sẽ được lưu khi bạn phát video.'}
              </p>
            ) : (
              <p>
                <Link to={paths.loginTo(location.pathname + location.search)}>
                  Đăng nhập để lưu tiến độ
                </Link>
                . Bạn vẫn có thể xem khi chưa đăng nhập.
              </p>
            )}
            <p className="tw:mb-0">
              Nội dung và hình ảnh minh họa. Chưa có nguồn phim thực tế; mở thông tin tập không làm
              thay đổi lịch sử xem.
            </p>
          </div>
        </section>
        <aside
          className="aw-surface tw:min-w-0 tw:p-5 tw:rounded-xl tw:self-start"
          aria-labelledby="watch-episodes-title"
        >
          <div className="tw:flex tw:justify-between tw:items-center tw:gap-3 tw:mb-4">
            <h2 id="watch-episodes-title" className="tw:text-xl tw:m-0">
              Danh sách tập
            </h2>
            <span className="tw:text-[var(--aw-muted)]">{episodes.length} tập</span>
          </div>
          <label htmlFor="watch-season" className="tw:block tw:mb-2">
            Chọn mùa
          </label>
          <Selectbox
            id="watch-season"
            value={selectedSeason?.id ?? ''}
            onChange={(event) => {
              const updated = new URLSearchParams(params);
              updated.set('season', event.target.value);
              setParams(updated, { preventScrollReset: true });
            }}
          >
            {detail.anime.seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.title}
              </option>
            ))}
          </Selectbox>
          <ol
            className="tw:list-none tw:p-0 tw:mb-0 tw:mt-4 tw:grid tw:gap-2 tw:max-h-120 tw:overflow-y-auto"
            aria-label="Các tập đã công bố"
          >
            {episodes.map((episode) => (
              <li key={episode.id}>
                <Link
                  to={paths.watch(episode.id)}
                  aria-current={episode.id === detail.episode.id ? 'page' : undefined}
                  className={
                    episode.id === detail.episode.id
                      ? 'tw:flex tw:gap-3 tw:p-3 tw:rounded-lg tw:bg-[var(--aw-accent)] tw:text-[#10121b]'
                      : 'tw:flex tw:gap-3 tw:p-3 tw:rounded-lg tw:text-[var(--aw-text)] tw:hover:bg-[#242a3a]'
                  }
                >
                  <span className="tw:font-semibold tw:shrink-0">
                    {String(episode.number).padStart(2, '0')}
                  </span>
                  <span className="tw:min-w-0">
                    <span className="tw:block">{episode.title}</span>
                    <span className="tw:block">
                      {episode.id === detail.episode.id ? 'Đang chọn · ' : ''}
                      {Math.ceil(episode.durationSeconds / 60)} phút
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          {!episodes.length && (
            <p className="tw:mt-4 tw:mb-0">Chưa có tập đã công bố trong danh sách này.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
