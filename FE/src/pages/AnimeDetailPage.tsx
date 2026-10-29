import { Link, useLocation } from 'react-router-dom';
import { useAnimeDetail } from '../features/anime/hooks/useAnimeDetail';
import { useSession } from '../features/auth/SessionProvider';
import { Artwork } from '../components/common/Artwork';
import { ContentState } from '../components/common/ContentState';
import { AnimeCard } from '../features/anime/components/AnimeCard';
import { SeasonEpisodes } from '../features/episode/components/SeasonEpisodes';
import { CommentsPanel } from '../features/comments/components/CommentsPanel';
import { genreOptions, statusOptions } from '../features/anime/catalogQuery';
import { paths } from '../routes/paths';

export function AnimeDetailPage() {
  const { data, loading, error, retry } = useAnimeDetail();
  const { user, favorites, progress, permissions, toggleFavorite } = useSession();
  const location = useLocation();
  if (loading)
    return (
      <div
        className="aw-shell aw-detail-loading"
        role="status"
        aria-label="Đang tải chi tiết anime"
      >
        <div className="aw-skeleton aw-detail-loading-banner" />
        <p>Đang mở câu chuyện…</p>
      </div>
    );
  if (error)
    return (
      <div className="aw-shell">
        <ContentState title="Chưa mở được câu chuyện" description={error} retry={retry} />
      </div>
    );
  if (!data)
    return (
      <div className="aw-shell">
        <ContentState
          title="Không tìm thấy anime"
          description="Anime này không tồn tại hoặc chưa được công bố."
        />
        <p className="aw-detail-return">
          <Link className="btn aw-btn-primary" to={paths.explore}>
            Khám phá anime khác ↗
          </Link>
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
  return (
    <div className="aw-shell aw-detail" data-anime-id={data.id}>
      <nav className="aw-detail-breadcrumb" aria-label="Đường dẫn">
        <Link to={paths.home}>Trang chủ</Link>
        <span aria-hidden="true">/</span>
        <Link to={paths.explore}>Khám phá</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{data.title}</span>
      </nav>
      <section className="aw-detail-hero" aria-labelledby="detail-title">
        <Artwork
          key={data.bannerUrl}
          src={data.bannerUrl}
          alt={`Banner minh họa ${data.title}`}
          className="aw-detail-banner"
          eager
        />
        <div className="aw-detail-shade" />
        <Artwork
          key={data.posterUrl}
          src={data.posterUrl}
          alt={`Poster minh họa ${data.title}`}
          className="aw-detail-poster"
          eager
        />
        <div className="aw-detail-hero-copy">
          <span className="aw-eyebrow">CHI TIẾT ANIME · NỘI DUNG MẪU</span>
          <p className="aw-detail-subtitle">{data.alternativeTitles.join(' / ')}</p>
          <h1 id="detail-title">{data.title}</h1>
          <div className="aw-detail-meta">
            <span>{status}</span>
            <span>{data.releaseYear}</span>
            <span>{data.format === 'movie' ? 'Điện ảnh' : 'TV series'}</span>
            <span>{data.seasons.length} phần</span>
          </div>
          <div className="aw-detail-genres">
            {data.genres.map((genre) => (
              <Link
                key={genre}
                to={`${paths.explore}?genre=${genreOptions.find((option) => option.label === genre)?.value ?? encodeURIComponent(genre)}&page=1`}
              >
                {genre}
              </Link>
            ))}
          </div>
          <p className="aw-detail-intro">{data.synopsis}</p>
          <div className="aw-detail-actions">
            {playable ? (
              <Link className="btn aw-btn-primary" to={paths.watch(playable.id)}>
                {playable.id === saved?.episodeId ? '▷ Xem tiếp' : '▷ Xem ngay'}
              </Link>
            ) : (
              <a className="btn aw-btn-primary" href="#episodes">
                Danh sách tập ↓
              </a>
            )}
            {user ? (
              <button
                className="btn aw-btn-glass"
                aria-pressed={favorite}
                disabled={!permissions.includes('library:write:own')}
                onClick={() => toggleFavorite(data.id)}
              >
                {favorite ? '✓ Đã yêu thích' : '＋ Yêu thích'}
              </button>
            ) : (
              <Link
                className="btn aw-btn-glass"
                to={paths.loginTo(location.pathname + location.search)}
              >
                ＋ Yêu thích
              </Link>
            )}
          </div>
          <p className="aw-detail-source-status">
            {playable
              ? 'Nguồn demo khả dụng'
              : 'Chưa có video demo · Bạn vẫn có thể xem thông tin và danh sách tập.'}
          </p>
        </div>
      </section>
      <div className="aw-detail-body">
        <div className="aw-detail-main">
          <section className="aw-detail-section" aria-labelledby="synopsis-title">
            <span className="aw-eyebrow">ĐIỀU GÌ ĐANG CHỜ PHÍA TRƯỚC?</span>
            <h2 id="synopsis-title">Câu chuyện</h2>
            <p className="aw-detail-synopsis">{data.synopsis}</p>
            <p className="aw-detail-fiction-note">
              Tên phim, nội dung và hình ảnh là minh họa cho bản demo Anime Web.
            </p>
            {saved && (
              <div className="aw-detail-saved" role="status">
                Tiến độ mẫu của bạn: Tập {saved.episodeNumber} ·{' '}
                {Math.floor(saved.positionSeconds / 60)}/{Math.ceil(saved.durationSeconds / 60)}{' '}
                phút. Chưa có nguồn video để tiếp tục phát.
              </div>
            )}
          </section>
          <SeasonEpisodes detail={data} />
          <CommentsPanel key={`${data.id}:${user ?? 'guest'}`} animeId={data.id} />
        </div>
        <aside className="aw-detail-info" aria-labelledby="anime-info-title">
          <span className="aw-eyebrow">GÓC NHỎ VỀ CÂU CHUYỆN</span>
          <h2 id="anime-info-title">Thông tin anime</h2>
          <dl>
            <div>
              <dt>Định dạng</dt>
              <dd>{data.format === 'movie' ? 'Điện ảnh' : 'TV series'}</dd>
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
              <dt>Số phần mẫu</dt>
              <dd>{data.seasons.length}</dd>
            </div>
            <div>
              <dt>Tập đã công bố</dt>
              <dd>{data.episodes.length}</dd>
            </div>
            <div>
              <dt>Tên khác</dt>
              <dd>{data.alternativeTitles.join(' / ')}</dd>
            </div>
          </dl>
          <p>Mô hình một anime có nhiều mùa/phần đang được dùng tạm cho giao diện.</p>
          <Link to={paths.explore}>Tìm thêm câu chuyện ↗</Link>
        </aside>
      </div>
      {data.related.length > 0 && (
        <section className="aw-detail-related" aria-labelledby="related-title">
          <div className="aw-detail-section-heading">
            <div>
              <span className="aw-eyebrow">Ở LẠI THÊM MỘT CHÚT</span>
              <h2 id="related-title">
                Cùng thế giới bạn yêu thích<span className="aw-heading-dot">.</span>
              </h2>
            </div>
            <Link className="aw-text-link" to={paths.explore}>
              Khám phá thêm ↗
            </Link>
          </div>
          <div className="aw-detail-related-grid">
            {data.related.map((item) => (
              <AnimeCard key={item.id} anime={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
