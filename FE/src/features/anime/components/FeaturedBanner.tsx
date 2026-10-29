import { useState } from 'react';
import type { Anime } from '../anime.types';
import { Artwork } from '../../../components/common/Artwork';
import { useSession } from '../../auth/SessionProvider';
import { Link, useLocation } from 'react-router-dom';
import { paths } from '../../../routes/paths';
export function FeaturedBanner({ items }: { items: Anime[] }) {
  const [index, setIndex] = useState(0);
  const location = useLocation();
  const { user, favorites, toggleFavorite } = useSession();
  const item = items[index];
  if (!item) return null;
  return (
    <section className="aw-hero" aria-label="Anime nổi bật">
      <Artwork
        key={item.bannerUrl}
        src={item.bannerUrl}
        alt={`Minh họa ${item.title}`}
        className="aw-hero-art"
        eager
      />
      <div className="aw-hero-shade" />
      <div className="aw-hero-content">
        <p className="aw-eyebrow">
          <span aria-hidden="true">✦</span> TÂM ĐIỂM HÔM NAY{' '}
          <span className="aw-demo">NỘI DUNG MẪU</span>
        </p>
        <p className="aw-hero-subtitle">{item.subtitle}</p>
        <h1>{item.title}</h1>
        <div className="aw-hero-meta">
          <span className="aw-status-dot" />
          {item.status === 'airing' ? 'Đang phát hành' : 'Hoàn thành'}
          <span>·</span>
          {item.releaseYear}
          <span>·</span>
          {item.episodeLabel}
          <span className="aw-language">VIETSUB</span>
        </div>
        <p className="aw-hero-synopsis">{item.synopsis}</p>
        <div className="tw:flex tw:flex-wrap tw:gap-2 aw-genre-tags">
          {item.genres.map((genre) => (
            <Link key={genre} to={`${paths.explore}?genre=${encodeURIComponent(genre)}&page=1`}>
              {genre}
            </Link>
          ))}
        </div>
        <div className="tw:flex tw:flex-wrap tw:gap-3 aw-hero-actions">
          <Link className="btn aw-btn-primary" to={paths.animeDetail(item.slug)}>
            <span aria-hidden="true">▷</span> Khám phá câu chuyện
          </Link>
          {user ? (
            <button
              className="btn aw-btn-glass"
              aria-pressed={favorites.includes(item.id)}
              onClick={() => toggleFavorite(item.id)}
            >
              {favorites.includes(item.id) ? '✓ Đã yêu thích' : '＋ Yêu thích'}
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
      </div>
      <div className="aw-hero-bottom">
        <span className="aw-hero-caption">ĐI XA HƠN NHỮNG ĐIỀU BẠN BIẾT.</span>
        <div className="aw-slide-controls">
          <span className="aw-slide-counter">
            0{index + 1} <span>/ 0{items.length}</span>
          </span>
          {items.map((anime, i) => (
            <button
              key={anime.id}
              aria-label={`Nổi bật: ${anime.title}`}
              aria-pressed={i === index}
              className={i === index ? 'active' : ''}
              onClick={() => setIndex(i)}
            />
          ))}
          <button
            className="aw-slide-next"
            aria-label="Anime nổi bật tiếp theo"
            onClick={() => setIndex((index + 1) % items.length)}
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}
