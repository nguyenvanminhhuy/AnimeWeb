import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
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
    <section
      className="aw-hero tw:relative tw:isolate tw:mt-7 tw:min-h-133.75 tw:rounded-[16px] tw:overflow-hidden tw:max-phone:mt-4 tw:max-phone:min-h-155"
      aria-label="Anime nổi bật"
    >
      <Artwork
        key={item.bannerUrl}
        src={item.bannerUrl}
        alt={`Minh họa ${item.title}`}
        className="aw-hero-art tw:absolute tw:inset-0 tw:w-full tw:h-full tw:object-cover tw:z-[-3] tw:max-phone:opacity-80"
        eager
      />
      <div className="aw-hero-shade tw:absolute tw:inset-0 tw:z-[-2]" />
      <div className="aw-hero-content tw:px-12 tw:pt-12 tw:pb-25 tw:max-w-162.5 tw:max-tablet:pl-8 tw:max-phone:px-5.5 tw:max-phone:pt-32.5 tw:max-phone:pb-22.5">
        <p className="aw-eyebrow">
          <span aria-hidden="true">✦</span> TÂM ĐIỂM HÔM NAY{' '}
          <span className="aw-demo tw:px-1.5 tw:py-0.75 tw:rounded-[4px] tw:whitespace-nowrap">
            NỘI DUNG MẪU
          </span>
        </p>
        <p className="aw-hero-subtitle tw:text-body tw:mb-2">{item.subtitle}</p>
        <h1>{item.title}</h1>
        <div className="aw-hero-meta tw:gap-2.5 tw:flex tw:flex-wrap tw:items-center tw:text-body">
          <span className="aw-status-dot tw:inline-block tw:w-1.25 tw:h-1.25 tw:rounded-[50%]" />
          {item.status === 'airing' ? 'Đang phát hành' : 'Hoàn thành'}
          <span>·</span>
          {item.releaseYear}
          <span>·</span>
          {item.episodeLabel}
          <span className="aw-language tw:px-1 tw:py-px tw:text-body tw:rounded-[3px]">
            VIETSUB
          </span>
        </div>
        <p className="aw-hero-synopsis tw:mx-0 tw:text-body tw:leading-[1.9] tw:mt-5 tw:mb-4 tw:max-w-107.5">
          {item.synopsis}
        </p>
        <div className="tw:flex tw:flex-wrap tw:gap-2 aw-genre-tags">
          {item.genres.map((genre) => (
            <Link key={genre} to={`${paths.explore}?genre=${encodeURIComponent(genre)}&page=1`}>
              {genre}
            </Link>
          ))}
        </div>
        <div className="tw:flex tw:flex-wrap tw:gap-3 aw-hero-actions tw:mt-6.25">
          <Button
            as="link"
            variant="primary"
            to={paths.animeDetail(item.slug)}
            startIcon={<Icon name="play" size="sm" />}
            label="Khám phá câu chuyện"
          />
          {user ? (
            <Button
              variant="glass"
              aria-pressed={favorites.includes(item.id)}
              onClick={() => toggleFavorite(item.id)}
              startIcon={<Icon name={favorites.includes(item.id) ? 'heart-filled' : 'heart'} />}
              label={favorites.includes(item.id) ? 'Đã yêu thích' : 'Yêu thích'}
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
      </div>
      <div className="aw-hero-bottom tw:gap-5 tw:absolute tw:bottom-6 tw:left-12 tw:right-8 tw:flex tw:items-center tw:justify-between tw:max-tablet:left-8 tw:max-phone:left-5.5 tw:max-phone:right-5.5 tw:max-phone:bottom-4.5">
        <span className="aw-hero-caption tw:text-body tw:max-phone:hidden">
          ĐI XA HƠN NHỮNG ĐIỀU BẠN BIẾT.
        </span>
        <div className="aw-slide-controls tw:gap-2.25 tw:flex tw:items-center tw:max-phone:ml-auto">
          <span className="aw-slide-counter tw:text-body tw:mr-3">
            0{index + 1} <span>/ 0{items.length}</span>
          </span>
          {items.map((anime, i) => (
            <Button
              variant="unstyled"
              key={anime.id}
              aria-label={`Nổi bật: ${anime.title}`}
              aria-pressed={i === index}
              className={i === index ? 'active' : ''}
              onClick={() => setIndex(i)}
            />
          ))}
          <Button
            variant="unstyled"
            className="aw-slide-next"
            aria-label="Anime nổi bật tiếp theo"
            onClick={() => setIndex((index + 1) % items.length)}
            startIcon={<Icon name="arrow-right" size="sm" />}
          />
        </div>
      </div>
    </section>
  );
}
