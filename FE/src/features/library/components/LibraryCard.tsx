import { Link } from 'react-router-dom';
import { AnimeCard } from '../../anime/components/AnimeCard';
import { paths } from '../../../routes/paths';
import { isCompleted } from '../library.types';
import type { LibraryItem, LibraryTab } from '../library.types';

interface Props {
  item: LibraryItem;
  tab: LibraryTab;
  favorite: boolean;
  canWrite: boolean;
  onToggleFavorite: (id: string) => void;
}

export function LibraryCard({ item, tab, favorite, canWrite, onToggleFavorite }: Props) {
  const { anime, progress } = item;
  const completed = progress ? isCompleted(progress) : false;
  const minutes = progress ? Math.floor(progress.positionSeconds / 60) : 0;
  return (
    <div className="aw-library-card" data-item-id={item.key}>
      <AnimeCard anime={anime} />
      {progress ? (
        <div className="aw-library-progress">
          <div>
            <span>Tập {progress.episodeNumber}</span>
            <span>
              {completed
                ? 'Đã xem xong'
                : `${Math.round((progress.positionSeconds / progress.durationSeconds) * 100)}%`}
            </span>
          </div>
          <progress
            value={progress.positionSeconds}
            max={progress.durationSeconds}
            aria-label={`Tiến độ tập ${progress.episodeNumber} của ${anime.title}`}
          />
          <p>
            {minutes} / {Math.ceil(progress.durationSeconds / 60)} phút · Tiến độ mẫu
          </p>
          {tab === 'history' && progress.updatedAt && (
            <p>
              {new Intl.DateTimeFormat('vi-VN', {
                timeZone: 'Asia/Ho_Chi_Minh',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              }).format(new Date(progress.updatedAt))}
            </p>
          )}
        </div>
      ) : (
        <p className="aw-library-not-started">Đã lưu cho một ngày muốn xem.</p>
      )}
      <div className="aw-library-card-actions">
        {progress ? (
          <Link className="btn aw-btn-glass" to={paths.watch(progress.episodeId)}>
            {completed ? '↻ Xem lại' : '▷ Xem tiếp'}
          </Link>
        ) : (
          <Link className="btn aw-btn-glass" to={paths.animeDetail(anime.slug)}>
            Xem chi tiết ↗
          </Link>
        )}
        {canWrite && (
          <button
            className="aw-library-favorite"
            type="button"
            aria-label={`${favorite ? 'Bỏ yêu thích' : 'Yêu thích'} ${anime.title}`}
            aria-pressed={favorite}
            onClick={() => onToggleFavorite(anime.id)}
          >
            {favorite ? '♥' : '♡'}
            <span>{favorite ? 'Bỏ yêu thích' : 'Yêu thích'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
