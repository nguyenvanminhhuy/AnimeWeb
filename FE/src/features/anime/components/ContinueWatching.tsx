import type { Anime } from '../anime.types';
import { useSession } from '../../auth/SessionProvider';
import { Artwork } from '../../../components/common/Artwork';
import { Link } from 'react-router-dom';
import { Icon } from '../../../components/ui/Icon';
import { paths } from '../../../routes/paths';
import { isCompleted } from '../../library/library.types';
export function ContinueWatching({ items }: { items: Anime[] }) {
  const { user, progress } = useSession();
  const entries = progress.flatMap((entry) => {
    if (isCompleted(entry)) return [];
    const anime = items.find((item) => item.id === entry.animeId);
    return anime ? [{ ...entry, anime }] : [];
  });
  if (!user || !entries.length) return null;
  return (
    <section className="aw-section tw:mt-10.5 tw:max-phone:mt-7.5" aria-labelledby="continue-title">
      <div className="aw-section-heading tw:gap-4.5 tw:flex tw:items-center tw:justify-between tw:mb-5.5">
        <div>
          <span className="aw-eyebrow">CÂU CHUYỆN CÒN DANG DỞ</span>
          <h2 id="continue-title">
            Tiếp tục xem{' '}
            <span className="aw-demo tw:px-1.5 tw:py-0.75 tw:rounded-[4px] tw:whitespace-nowrap">
              LỊCH SỬ MẪU
            </span>
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
                {Math.ceil((entry.durationSeconds - entry.positionSeconds) / 60)} phút
              </p>
              <progress
                value={entry.positionSeconds}
                max={entry.durationSeconds}
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
