import { Link } from 'react-router-dom';
import { Artwork } from '@/components/common/artwork';
import { Button } from '@/components/ui/button';
import { statusOptions, formatOptions } from '@/config/catalog';
import { paths } from '@/config/paths';
import type { AdminAnimeRow } from '@/types/admin-anime';

const statusStyles = {
  airing: 'tw:bg-[#9fe3c218] tw:text-[#9fe3c2]',
  completed: 'tw:bg-[#a697ff20] tw:text-[#c5baff]',
  upcoming: 'tw:bg-[#f1cd8a18] tw:text-[#f1cd8a]',
};

export function AdminAnimeTable({
  rows,
  canWrite,
  returnTo,
  onDelete,
}: {
  rows: AdminAnimeRow[];
  canWrite: boolean;
  returnTo: string;
  onDelete: (row: AdminAnimeRow) => void;
}) {
  return (
    <div
      role="region"
      aria-label="Bảng quản lý phim"
      tabIndex={0}
      className="aw-surface tw:overflow-x-auto tw:rounded-xl tw:border tw:border-[var(--aw-border)]"
    >
      <table className="tw:w-full tw:min-w-225 tw:text-left tw:align-middle tw:mb-0">
        <caption className="visually-hidden">
          Danh sách phim mẫu. Trạng thái là trạng thái phát hành, không phải trạng thái công bố.
        </caption>
        <thead className="tw:bg-[#ffffff04] tw:text-[var(--aw-muted)]">
          <tr>
            {[
              'Phim',
              'Trạng thái phát hành',
              'Định dạng / Năm',
              'Thể loại',
              'Tập công khai',
              'Thao tác',
            ].map((title) => (
              <th key={title} scope="col" className="tw:p-4 tw:font-medium tw:whitespace-nowrap">
                {title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const { anime, publishedEpisodes, publicSlug } = row;
            return (
              <tr
                key={anime.id}
                data-anime-id={anime.id}
                className="tw:border-t tw:border-[var(--aw-border)] tw:hover:bg-[#ffffff03]"
              >
                <th scope="row" className="tw:p-4 tw:font-normal tw:min-w-70">
                  <div className="tw:flex tw:gap-3 tw:items-center">
                    <Artwork
                      src={anime.posterUrl}
                      alt=""
                      className="tw:w-12 tw:h-17 tw:object-cover tw:rounded-lg tw:shrink-0"
                    />
                    <div>
                      {publicSlug ? (
                        <Link
                          to={paths.animeDetail(publicSlug)}
                          className="tw:font-semibold tw:text-[var(--aw-text)]"
                        >
                          {anime.title}
                        </Link>
                      ) : (
                        <span className="tw:font-semibold">{anime.title}</span>
                      )}
                      <p className="tw:mb-0 tw:mt-1 tw:text-[var(--aw-muted)]">{anime.id}</p>
                    </div>
                  </div>
                </th>
                <td className="tw:p-4">
                  <span
                    className={`tw:inline-block tw:rounded-full tw:px-3 tw:py-1 tw:whitespace-nowrap ${statusStyles[anime.status]}`}
                  >
                    {statusOptions.find((option) => option.value === anime.status)?.label}
                  </span>
                </td>
                <td className="tw:p-4 tw:whitespace-nowrap">
                  {formatOptions.find((option) => option.value === anime.format)?.label}
                  <br />
                  <span className="tw:text-[var(--aw-muted)]">{anime.releaseYear}</span>
                </td>
                <td className="tw:p-4 tw:min-w-40 tw:text-[var(--aw-muted)]">
                  {anime.genres.join(', ')}
                </td>
                <td className="tw:p-4">{publishedEpisodes}</td>
                <td className="tw:p-4">
                  <div className="tw:flex tw:gap-2 tw:flex-wrap tw:min-w-32">
                    {publicSlug && (
                      <Button
                        as="link"
                        to={paths.animeDetail(publicSlug)}
                        variant="quiet"
                        size="sm"
                        label="Xem chi tiết"
                        aria-label={`Xem chi tiết ${anime.title}`}
                      />
                    )}
                    {canWrite && (
                      <>
                        <Button
                          as="link"
                          variant="quiet"
                          size="sm"
                          to={paths.adminAnimeEdit(anime.id, returnTo)}
                          label="Sửa"
                          aria-label={`Sửa ${anime.title}`}
                        />
                        <Button
                          variant="quiet"
                          size="sm"
                          label="Xoá"
                          aria-label={`Xoá ${anime.title}`}
                          onClick={() => onDelete(row)}
                        />
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
