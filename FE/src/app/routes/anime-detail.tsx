import { animeFormatLabel } from '@/config/catalog';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Link, useLocation } from 'react-router-dom';
import { useAnimeDetail } from '@/features/anime/hooks/use-anime-detail';
import { useSession } from '@/stores/session';
import { Artwork } from '@/components/common/artwork';
import { ContentState } from '@/components/common/content-state';
import { AnimeCard } from '@/components/anime/anime-card';
import { SeasonEpisodes } from '@/features/episode/components/season-episodes';
import { CommentsPanel } from '@/features/comments/components/comments-panel';
import { genreOptions, statusOptions } from '@/config/catalog';
import { paths } from '@/config/paths';
import { isMockApi } from '@/config/api';

export function AnimeDetailPage() {
  const { data, loading, error, retry } = useAnimeDetail();
  const { user, favorites, progress, permissions, toggleFavorite } = useSession();
  const location = useLocation();
  if (loading)
    return (
      <div
        className="aw-shell aw-detail-loading tw:mx-auto tw:pt-7.5"
        role="status"
        aria-label="Đang tải chi tiết anime"
      >
        <div className="aw-skeleton aw-detail-loading-banner tw:rounded-xl tw:h-102.5 tw:mb-5" />
        <p>Đang mở câu chuyện…</p>
      </div>
    );
  if (error)
    return (
      <div className="aw-shell tw:mx-auto">
        <ContentState title="Chưa mở được câu chuyện" description={error} retry={retry} />
      </div>
    );
  if (!data)
    return (
      <div className="aw-shell tw:mx-auto">
        <ContentState
          title="Không tìm thấy anime"
          description="Anime này không tồn tại hoặc chưa được công bố."
        />
        <p className="aw-detail-return tw:text-center">
          <Button
            as="link"
            variant="primary"
            to={paths.explore}
            label="Khám phá anime khác"
            endIcon={<Icon name="arrow-right" size="sm" />}
          />
        </p>
      </div>
    );
  const favorite = favorites.includes(data.id);
  const saved = progress
    .filter(
      (entry) =>
        entry.animeId === data.id &&
        data.episodes.some((episode) => episode.id === entry.episodeId),
    )
    .sort(
      (a, b) =>
        (b.updatedAt ? Date.parse(b.updatedAt) : 0) - (a.updatedAt ? Date.parse(a.updatedAt) : 0),
    )[0];
  const playable =
    data.episodes.find((episode) => episode.id === saved?.episodeId && episode.hasPlayback) ??
    data.episodes.find((episode) => episode.hasPlayback);
  const status = statusOptions.find((option) => option.value === data.status)?.label;
  const subtitle =
    data.subtitle.trim() ||
    data.alternativeTitles.find(
      (title) => title.trim().toLowerCase() !== data.title.trim().toLowerCase(),
    );
  const synopsis = data.synopsis.trim();
  return (
    <div className="aw-shell aw-detail tw:mx-auto tw:pt-6.5" data-anime-id={data.id}>
      <nav
        className="aw-detail-breadcrumb tw:gap-2.75 tw:flex tw:items-center tw:flex-wrap tw:text-body tw:mb-6.25"
        aria-label="Đường dẫn"
      >
        <Link to={paths.home}>Trang chủ</Link>
        <span aria-hidden="true">/</span>
        <Link to={paths.explore}>Khám phá</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{data.title}</span>
      </nav>
      <section
        className="aw-detail-hero tw:p-10 tw:gap-8 tw:grid tw:grid-cols-[190px_minmax(0,1fr)] tw:rounded-[14px] tw:relative tw:isolate tw:overflow-hidden tw:max-tablet:p-7 tw:max-tablet:gap-6 tw:max-tablet:grid-cols-[150px_minmax(0,1fr)] tw:max-mobile:p-4 tw:max-mobile:gap-4 tw:max-mobile:grid-cols-[90px_minmax(0,1fr)]"
        aria-labelledby="detail-title"
      >
        <Artwork
          key={data.bannerUrl}
          src={data.bannerUrl}
          alt={`Banner minh họa ${data.title}`}
          className="aw-detail-banner tw:absolute tw:z-[-3] tw:inset-0 tw:w-full tw:h-full tw:object-cover"
          eager
        />
        <div className="aw-detail-shade tw:absolute tw:z-[-2] tw:inset-0" />
        <Artwork
          key={data.posterUrl}
          src={data.posterUrl}
          alt={`Poster minh họa ${data.title}`}
          className="aw-detail-poster tw:w-47.5 tw:object-cover tw:rounded-lg tw:max-tablet:w-37.5 tw:max-mobile:w-22.5"
          eager
        />
        <div className="aw-detail-hero-copy tw:min-w-0 tw:max-mobile:contents">
          <div className="tw:min-w-0">
            <h1 id="detail-title">{data.title}</h1>
            {subtitle && (
              <p className="aw-detail-subtitle tw:mx-0 tw:text-body tw:line-clamp-2 tw:mb-3">
                {subtitle}
              </p>
            )}
            <div className="aw-detail-meta tw:flex tw:flex-wrap tw:gap-y-2 tw:gap-x-5 tw:text-body tw:max-mobile:gap-y-1.75 tw:max-mobile:gap-x-3">
              <span>{status}</span>
              <span>{data.releaseYear}</span>
              <span>{animeFormatLabel(data.format)}</span>
              <span>{data.seasons.length} phần</span>
            </div>
            <div className="aw-detail-genres tw:gap-1.75 tw:flex tw:flex-wrap tw:mt-4">
              {data.genres.map((genre) => (
                <Link
                  key={genre}
                  to={`${paths.explore}?genre=${genreOptions.find((option) => option.label === genre)?.value ?? encodeURIComponent(genre)}&page=1`}
                >
                  {genre}
                </Link>
              ))}
            </div>
            {synopsis && (
              <p className="aw-detail-intro tw:mx-0 tw:text-body tw:line-clamp-4 tw:leading-[1.9] tw:max-w-167.5 tw:mt-4.5 tw:mb-5.5 tw:max-mobile:hidden">
                {synopsis}
              </p>
            )}
          </div>
          <div className="tw:max-mobile:col-span-2">
            <div className="aw-detail-actions tw:gap-3 tw:flex tw:flex-wrap tw:mt-5 tw:max-mobile:mt-0 tw:max-mobile:gap-2">
              {playable ? (
                <Button
                  as="link"
                  variant="primary"
                  to={paths.watch(playable.id)}
                  startIcon={<Icon name="play" size="sm" />}
                  label={playable.id === saved?.episodeId ? 'Xem tiếp' : 'Xem ngay'}
                />
              ) : (
                <Button as="anchor" variant="primary" href="#episodes" label="Danh sách tập" />
              )}
              {user ? (
                <Button
                  variant="glass"
                  aria-pressed={favorite}
                  disabled={!permissions.includes('library:write:own')}
                  onClick={() => toggleFavorite(data.id)}
                  startIcon={<Icon name={favorite ? 'heart-filled' : 'heart'} />}
                  label={favorite ? 'Đã yêu thích' : 'Yêu thích'}
                />
              ) : (
                <Button
                  as="link"
                  variant="glass"
                  to={paths.loginTo(location.pathname + location.search)}
                  startIcon={<Icon name="heart" />}
                  label="Yêu thích"
                />
              )}
            </div>
            <p className="aw-detail-source-status tw:mx-0 tw:text-body tw:leading-[1.8] tw:mt-3.75 tw:mb-0">
              {playable
                ? 'Đã có nguồn phát'
                : 'Chưa có nguồn phát · Bạn vẫn có thể xem thông tin và danh sách tập.'}
            </p>
          </div>
        </div>
      </section>
      <div className="aw-detail-body tw:gap-10.5 tw:grid tw:grid-cols-[minmax(0,1fr)_280px] tw:mt-10 tw:max-tablet:gap-6.25 tw:max-tablet:grid-cols-[minmax(0,1fr)_230px] tw:max-mobile:grid-cols-[1fr]">
        <div className="aw-detail-main tw:min-w-0">
          <SeasonEpisodes detail={data} />
          <section className="aw-detail-section" aria-labelledby="synopsis-title">
            <h2 id="synopsis-title">Câu chuyện</h2>
            <p className="aw-detail-synopsis tw:text-body tw:leading-loose">
              {synopsis || 'Chưa có mô tả nội dung cho phim này.'}
            </p>
            {isMockApi && (
              <p className="aw-detail-fiction-note tw:mx-0 tw:my-4.5 tw:text-body tw:leading-[1.8]">
                Tên phim, nội dung và hình ảnh là minh họa cho bản demo Anime Web.
              </p>
            )}
            {saved && (
              <div
                className="aw-detail-saved tw:px-3.75 tw:py-3 tw:text-body tw:leading-[1.8]"
                role="status"
              >
                Tiến độ mẫu của bạn: Tập {saved.episodeNumber} ·{' '}
                {Math.floor(saved.positionSeconds / 60)}/
                {saved.durationSeconds === null ? '—' : Math.ceil(saved.durationSeconds / 60)} phút.
                Chưa có nguồn video để tiếp tục phát.
              </div>
            )}
          </section>
        </div>
        <aside
          className="aw-detail-info tw:p-6 tw:rounded-xl tw:max-tablet:p-5"
          aria-labelledby="anime-info-title"
        >
          <h2 id="anime-info-title">Thông tin anime</h2>
          <dl>
            <div>
              <dt>Định dạng</dt>
              <dd>{animeFormatLabel(data.format)}</dd>
            </div>
            <div>
              <dt>Năm phát hành</dt>
              <dd>{data.releaseYear}</dd>
            </div>
            <div>
              <dt>Trạng thái</dt>
              <dd>{status}</dd>
            </div>
            <div>
              <dt>Số phần</dt>
              <dd>{data.seasons.length}</dd>
            </div>
            <div>
              <dt>Tập đã công bố</dt>
              <dd>{data.episodes.length}</dd>
            </div>
            <div>
              <dt>Tên khác</dt>
              <dd>
                {data.alternativeTitles.length ? (
                  <details>
                    <summary className="tw:cursor-pointer">
                      Xem {data.alternativeTitles.length} tên khác
                    </summary>
                    <ul className="tw:pl-4 tw:mt-2 tw:space-y-1">
                      {data.alternativeTitles.map((title) => (
                        <li key={title}>{title}</li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  'Chưa cập nhật'
                )}
              </dd>
            </div>
          </dl>
          <Link to={paths.explore}>
            Tìm thêm câu chuyện <Icon name="arrow-right" size="sm" />
          </Link>
        </aside>
        <div className="tw:min-w-0 tw:col-start-1">
          <CommentsPanel key={`${data.id}:${user ?? 'guest'}`} animeId={data.id} />
        </div>
      </div>
      {data.related.length > 0 && (
        <section
          className="aw-detail-related tw:mt-11.25 tw:pt-8.75"
          aria-labelledby="related-title"
        >
          <div className="aw-detail-section-heading tw:gap-4.5 tw:flex tw:items-center tw:justify-between tw:mb-4.5 tw:max-mobile:items-start tw:max-mobile:flex-wrap">
            <div>
              <h2 id="related-title">
                Cùng thế giới bạn yêu thích<span className="aw-heading-dot">.</span>
              </h2>
            </div>
            <Link className="aw-text-link tw:text-body tw:whitespace-nowrap" to={paths.explore}>
              Khám phá thêm <Icon name="arrow-right" size="sm" />
            </Link>
          </div>
          <div className="aw-detail-related-grid tw:gap-5.5 tw:grid tw:grid-cols-4 tw:mt-6 tw:max-mobile:grid-cols-2 tw:max-mobile:gap-x-3.5">
            {data.related.map((item) => (
              <AnimeCard key={item.id} anime={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
