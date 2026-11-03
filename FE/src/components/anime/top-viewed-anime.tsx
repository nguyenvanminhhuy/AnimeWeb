import { isMockApi } from '@/config/api';
import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Artwork } from '@/components/common/artwork';
import { paths } from '@/config/paths';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import type { TopViewedAnimeEntry } from '@/types/anime';

const number = new Intl.NumberFormat('vi-VN');

export function TopViewedAnime({ items }: { items: readonly TopViewedAnimeEntry[] }) {
  const headingId = useId();
  const listId = useId();
  const list = useRef<HTMLOListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });
  function updateEdges() {
    const element = list.current;
    if (!element) return;
    setEdges({
      start: element.scrollLeft <= 1,
      end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 1,
    });
  }
  useEffect(() => {
    const element = list.current;
    if (!element) return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(element);
    updateEdges();
    return () => observer.disconnect();
  }, [items]);
  function scroll(direction: number) {
    const element = list.current;
    if (!element) return;
    element.scrollBy({
      left: direction * element.clientWidth * 0.85,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  }
  return (
    <section
      className="aw-surface tw:rounded-xl tw:p-6 tw:min-w-0 tw:max-phone:p-4"
      aria-labelledby={headingId}
    >
      <h2 id={headingId} className="tw:text-xl tw:mb-2">
        Top 10 phim được xem nhiều nhất
      </h2>
      <p className="tw:text-[var(--aw-muted)] tw:mb-5">
        Xếp theo tổng lượt xem{isMockApi ? ' · Số liệu mẫu.' : ' đã xác nhận.'}
      </p>
      {items.length > 1 && (
        <div className="tw:hidden tw:max-mobile:flex tw:items-center tw:justify-between tw:gap-3 tw:mb-3">
          <span className="tw:text-[var(--aw-muted)]">Cuộn để xem đủ bảng xếp hạng</span>
          <div className="tw:flex tw:gap-2 tw:shrink-0">
            <Button
              variant="quiet"
              aria-label="Xếp hạng trước"
              aria-controls={listId}
              disabled={edges.start}
              onClick={() => scroll(-1)}
              startIcon={<Icon name="arrow-left" />}
            />
            <Button
              variant="quiet"
              aria-label="Xếp hạng tiếp theo"
              aria-controls={listId}
              disabled={edges.end}
              onClick={() => scroll(1)}
              startIcon={<Icon name="arrow-right" />}
            />
          </div>
        </div>
      )}
      {items.length ? (
        <ol
          id={listId}
          ref={list}
          onScroll={updateEdges}
          className="tw:grid tw:grid-cols-2 tw:gap-x-6 tw:gap-y-3 tw:list-none tw:p-0 tw:m-0 tw:max-mobile:flex tw:max-mobile:gap-3 tw:max-mobile:overflow-x-auto tw:max-mobile:snap-x tw:max-mobile:snap-mandatory tw:max-mobile:pb-3"
        >
          {items.map(({ anime, viewCount }, index) => (
            <li
              key={anime.id}
              data-top-anime={anime.id}
              data-view-count={viewCount}
              className="tw:min-w-0 tw:max-mobile:flex-[0_0_85%] tw:max-mobile:snap-start"
            >
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
