import type { Anime } from '../anime.types';
import { useSession } from '../../auth/SessionProvider';
import { Artwork } from '../../../components/common/Artwork';
import { Link } from 'react-router-dom';
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
    <section className="aw-section" aria-labelledby="continue-title">
      <div className="aw-section-heading">
        <div>
          <span className="aw-eyebrow">CÂU CHUYỆN CÒN DANG DỞ</span>
          <h2 id="continue-title">
            Tiếp tục xem <span className="aw-demo">LỊCH SỬ MẪU</span>
          </h2>
        </div>
      </div>
      <div className="aw-continue-grid">
        {entries.map((entry) => (
          <Link
            className="aw-continue-card aw-surface"
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
              <span>Tiếp tục câu chuyện →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
