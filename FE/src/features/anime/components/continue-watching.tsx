import { isMockApi } from '@/config/api';
import { useEffect, useState } from 'react';
import { personalRepository } from '@/lib/api/repositories';
import type { LibraryItem } from '@/types/personal';
import { useSession } from '@/stores/session';
import { Artwork } from '@/components/common/artwork';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { isCompleted } from '@/utils/progress';
export function ContinueWatching({ items }: { items?: LibraryItem[] }) {
  const supplied = items !== undefined;
  const { user, progress, permissions } = useSession();
  const key = JSON.stringify([user, progress, permissions]);
  const [response, setResponse] = useState<{ key: string; items: LibraryItem[] } | null>(null);
  useEffect(() => {
    if (supplied || !user || !permissions.includes('progress:read:own')) return;
    const controller = new AbortController();
    personalRepository
      .list(
        { id: user, permissions },
        { tab: 'watching', q: '', sort: 'recent', page: 1, pageSize: 6 },
        controller.signal,
      )
      .then((data) => {
        if (!controller.signal.aborted) setResponse({ key, items: data.items });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResponse({ key, items: [] });
      });
    return () => controller.abort();
  }, [key, supplied]);
  const entries = (items ?? (response?.key === key ? response.items : [])).flatMap((item) =>
    item.progress && !isCompleted(item.progress) ? [{ ...item.progress, anime: item.anime }] : [],
  );
  if (!user || !entries.length) return null;
  return (
    <section className="aw-section tw:mt-10.5 tw:max-phone:mt-7.5" aria-labelledby="continue-title">
      <div className="aw-section-heading tw:gap-4.5 tw:flex tw:items-center tw:justify-between tw:mb-5.5">
        <div>
          <span className="aw-eyebrow">CÂU CHUYỆN CÒN DANG DỞ</span>
          <h2 id="continue-title">
            Tiếp tục xem{' '}
            {isMockApi && (
              <span className="aw-demo tw:px-1.5 tw:py-0.75 tw:rounded-[4px] tw:whitespace-nowrap">
                LỊCH SỬ MẪU
              </span>
            )}
          </h2>
        </div>
      </div>
      <div className="aw-continue-grid tw:gap-5 tw:grid tw:grid-cols-2 tw:max-phone:grid-cols-[1fr]">
        {entries.map((entry) => (
          <Link
            className="aw-continue-card aw-surface tw:p-3 tw:gap-4.5 tw:flex tw:rounded-[10px]"
            key={entry.episodeId}
            to={paths.watch(entry.episodeId)}
          >
            <Artwork src={entry.anime.posterUrl} alt={`Minh họa ${entry.anime.title}`} />
            <div>
              <h3>{entry.anime.title}</h3>
              <p>
                Tập {entry.episodeNumber} · Còn{' '}
                {entry.durationSeconds === null
                  ? '—'
                  : Math.ceil((entry.durationSeconds - entry.positionSeconds) / 60)}{' '}
                phút
              </p>
              <progress
                value={entry.durationSeconds === null ? undefined : entry.positionSeconds}
                max={entry.durationSeconds ?? undefined}
                aria-label={`Tiến độ tập ${entry.episodeNumber} của ${entry.anime.title}`}
              />
              <span>
                Tiếp tục câu chuyện <Icon name="arrow-right" size="sm" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
