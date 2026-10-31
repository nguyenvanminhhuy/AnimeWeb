import { useId } from 'react';
import { Link } from 'react-router-dom';
import { Artwork } from '@/components/common/artwork';
import { paths } from '@/config/paths';
import type { TopViewedAnimeEntry } from '@/types/anime';

const number = new Intl.NumberFormat('vi-VN');

export function TopViewedAnime({ items }: { items: readonly TopViewedAnimeEntry[] }) {
  const headingId = useId();
  return (
    <section
      className="aw-surface tw:rounded-xl tw:p-6 tw:min-w-0 tw:max-phone:p-4"
      aria-labelledby={headingId}
    >
      <h2 id={headingId} className="tw:text-xl tw:mb-2">
        Top 10 phim được xem nhiều nhất
      </h2>
      <p className="tw:text-[var(--aw-muted)] tw:mb-5">Xếp theo tổng lượt xem · Số liệu mẫu.</p>
      {items.length ? (
        <ol className="tw:grid tw:grid-cols-2 tw:gap-x-6 tw:gap-y-3 tw:list-none tw:p-0 tw:m-0 tw:max-mobile:grid-cols-1">
          {items.map(({ anime, viewCount }, index) => (
            <li key={anime.id} data-top-anime={anime.id} data-view-count={viewCount}>
              <Link
                to={paths.animeDetail(anime.slug)}
                className="tw:flex tw:items-center tw:gap-3 tw:p-3 tw:rounded-lg tw:bg-[#ffffff03] tw:hover:bg-[#a697ff12] tw:h-full"
              >
                <span
                  className="tw:text-xl tw:font-semibold tw:text-[var(--aw-accent)] tw:w-8 tw:shrink-0 tw:text-center"
                  aria-label={`Hạng ${index + 1}`}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <Artwork
                  src={anime.posterUrl}
                  alt=""
                  className="tw:w-12 tw:h-16 tw:object-cover tw:rounded-md tw:shrink-0"
                />
                <div className="tw:min-w-0">
                  <h3 className="tw:text-body tw:font-semibold tw:mb-2 tw:break-words">
                    {anime.title}
                  </h3>
                  <p className="tw:text-[var(--aw-muted)] tw:text-body tw:mb-0">
                    {number.format(viewCount)} lượt xem
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="tw:text-[var(--aw-muted)] tw:mb-0">Chưa có dữ liệu lượt xem.</p>
      )}
    </section>
  );
}
