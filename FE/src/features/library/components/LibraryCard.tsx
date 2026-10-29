import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
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
    <div className="aw-library-card tw:min-w-0" data-item-id={item.key}>
      <AnimeCard anime={anime} />
      {progress ? (
        <div className="aw-library-progress tw:mt-4.5">
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
      <div className="aw-library-card-actions tw:gap-2 tw:flex tw:items-center tw:mt-3.75 tw:flex-wrap tw:max-phone:items-stretch">
        {progress ? (
          <Button
            as="link"
            variant="glass"
            to={paths.watch(progress.episodeId)}
            startIcon={<Icon name={completed ? 'replay' : 'play'} size="sm" />}
            label={completed ? 'Xem lại' : 'Xem tiếp'}
          />
        ) : (
          <Button
            as="link"
            variant="glass"
            to={paths.animeDetail(anime.slug)}
            label="Xem chi tiết"
            endIcon={<Icon name="external-link" size="sm" />}
          />
        )}
        {canWrite && (
          <Button
            variant="unstyled"
            className="aw-library-favorite tw:px-2.5 tw:py-1.75 tw:rounded-[6px] tw:min-h-9 tw:text-body tw:max-phone:w-full"
            type="button"
            aria-label={`${favorite ? 'Bỏ yêu thích' : 'Yêu thích'} ${anime.title}`}
            aria-pressed={favorite}
            onClick={() => onToggleFavorite(anime.id)}
            startIcon={<Icon name={favorite ? 'heart-filled' : 'heart'} />}
            label={favorite ? 'Bỏ yêu thích' : 'Yêu thích'}
          />
        )}
      </div>
    </div>
  );
}
