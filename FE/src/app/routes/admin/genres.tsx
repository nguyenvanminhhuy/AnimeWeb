import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '@/stores/session';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ContentState } from '@/components/common/content-state';
import { Pagination } from '@/components/common/pagination';
import { useAdminGenres } from '@/features/admin-genres/hooks/use-admin-genres';
import { GenreFilters } from '@/features/admin-genres/components/genre-filters';
import { GenreForm } from '@/features/admin-genres/components/genre-form';
import { DeleteGenreDialog } from '@/features/admin-genres/components/delete-genre-dialog';
import { genreHref, genreParams } from '@/features/admin-genres/utils/genre-query';
import type { AdminGenreRow } from '@/types/admin-genre';
import { paths } from '@/config/paths';

export function AdminGenresPage() {
  const { adminPreview } = useSession();
  return <GenresContent key={adminPreview?.id ?? 'guest'} />;
}
function GenresContent() {
  const navigate = useNavigate();
  const { adminPreview } = useSession();
  const { canRead, canWrite, result, loading, error, query, mock, refresh } = useAdminGenres();
  const [editor, setEditor] = useState<{
    row: AdminGenreRow | null;
    revision: number;
    focus: boolean;
  }>({ row: null, revision: 0, focus: false });
  const [selected, setSelected] = useState<AdminGenreRow | null>(null);
  const [notice, setNotice] = useState('');
  const focusResults = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const resetEditor = (focus = false) =>
    setEditor((value) => ({ row: null, revision: value.revision + 1, focus }));
  useEffect(() => {
    if (focusResults.current && result) {
      focusResults.current = false;
      heading.current?.focus();
    }
  }, [result]);
  const total = result?.meta.total ?? 0;
  return (
    <>
      <header className="tw:flex tw:justify-between tw:items-start tw:gap-4 tw:flex-wrap tw:mb-7">
        <div>
          <p className="aw-eyebrow">PHÂN NHÓM NỘI DUNG</p>
          <h1 className="tw:text-3xl tw:max-phone:text-2xl">Quản lý thể loại</h1>
          <p className="tw:mb-0 tw:text-[var(--aw-muted)]">
            Sắp xếp danh mục theo những câu chuyện và chủ đề.
          </p>
        </div>
        <div className="tw:flex tw:gap-3 tw:flex-wrap">
          {canWrite && (
            <Button
              label="Thêm thể loại"
              startIcon={<Icon name="plus" size="sm" />}
              onClick={() => resetEditor(true)}
            />
          )}
          {canRead && (
            <Button
              variant="quiet"
              label="Làm mới"
              loading={loading}
              startIcon={<Icon name="replay" size="sm" />}
              onClick={refresh}
            />
          )}
        </div>
      </header>
      {!canRead ? (
        <ContentState
          title="Bạn chưa có quyền xem thể loại"
          description="Trang này yêu cầu quyền đọc thể loại quản trị."
        />
      ) : (
        <>
          <p className="tw:p-4 tw:mb-6 tw:rounded-xl tw:bg-[#a697ff0d] tw:border tw:border-[var(--aw-border)] tw:text-[var(--aw-muted)]">
            Dữ liệu mẫu ·{' '}
            {canWrite
              ? 'Thay đổi chỉ lưu trong phiên này; tải lại hoặc đổi phiên sẽ đặt lại dữ liệu.'
              : 'Phiên chỉ đọc. Đổi sang phiên có quyền chỉnh sửa để thêm, sửa hoặc xoá thể loại.'}
          </p>
          {notice && (
            <p role="status" className="tw:text-[#9fe3c2]">
              {notice}
            </p>
          )}
          <GenreFilters query={query} mock={mock} />
          <div
            className={`tw:grid tw:gap-6 tw:items-start ${canWrite ? 'tw:grid-cols-[minmax(0,1fr)_320px] tw:max-tablet:grid-cols-1' : 'tw:grid-cols-1'}`}
          >
            <section
              aria-labelledby="genre-results-title"
              aria-busy={loading}
              data-admin-genres={loading ? 'loading' : error ? 'error' : 'ready'}
              data-query={genreParams(query).toString()}
              className="tw:min-w-0"
            >
              <div className="tw:flex tw:gap-3 tw:justify-between tw:items-center tw:flex-wrap tw:mb-4">
                <h2
                  ref={heading}
                  tabIndex={-1}
                  id="genre-results-title"
                  className="tw:text-xl tw:mb-0"
                >
                  Danh sách thể loại
                </h2>
                <p role="status" className="tw:text-[var(--aw-muted)] tw:mb-0">
                  {loading
                    ? 'Đang tải thể loại…'
                    : error
                      ? 'Chưa tải được dữ liệu'
                      : `${total} thể loại`}
                </p>
              </div>
              <Pagination
                showSinglePage
                disabled={loading || !!error}
                pageSizeControl={{
                  value: query.pageSize,
                  options: [5, 10, 20],
                  label: 'Mỗi trang',
                  onChange: (pageSize) => {
                    if (pageSize === 5 || pageSize === 10 || pageSize === 20)
                      navigate(genreHref({ ...query, page: 1, pageSize }, mock));
                  },
                }}
                label="Phân trang thể loại phía trên"
                page={query.page}
                totalPages={result?.meta.totalPages ?? 0}
                hrefForPage={(page) => genreHref({ ...query, page }, mock)}
                className="tw:mb-4"
              />
              {error ? (
                <ContentState title="Chưa tải được thể loại" description={error} retry={refresh} />
              ) : loading ? (
                <div
                  role="status"
                  aria-label="Đang tải danh sách thể loại"
                  className="tw:grid tw:gap-3"
                >
                  {Array.from({ length: 5 }, (_, index) => (
                    <div key={index} className="aw-skeleton tw:h-20 tw:rounded-xl" />
                  ))}
                </div>
              ) : result?.data.length ? (
                <>
                  <div
                    role="region"
                    aria-label="Bảng thể loại"
                    tabIndex={0}
                    className="aw-surface tw:rounded-xl tw:overflow-x-auto tw:border tw:border-[var(--aw-border)]"
                  >
                    <table className="tw:w-full tw:min-w-140 tw:mb-0 tw:text-left tw:align-middle">
                      <caption className="visually-hidden">
                        Thể loại và số phim sử dụng trong phiên quản trị mẫu
                      </caption>
                      <thead className="tw:bg-[#ffffff04] tw:text-[var(--aw-muted)]">
                        <tr>
                          {[
                            'Tên thể loại',
                            'Slug',
                            'Số phim',
                            ...(canWrite ? ['Thao tác'] : []),
                          ].map((label) => (
                            <th
                              key={label}
                              scope="col"
                              className="tw:p-4 tw:font-medium tw:whitespace-nowrap"
                            >
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.data.map((row) => (
                          <tr
                            key={row.id}
                            data-genre-id={row.id}
                            className="tw:border-t tw:border-[var(--aw-border)]"
                          >
                            <th scope="row" className="tw:p-4 tw:font-semibold tw:min-w-40">
                              {row.name}
                            </th>
                            <td className="tw:p-4 tw:text-[var(--aw-muted)] tw:break-words">
                              {row.slug}
                            </td>
                            <td className="tw:p-4">
                              <Link
                                aria-label={`Xem ${row.animeCount} phim thuộc ${row.name}`}
                                to={`${paths.adminAnime}?${new URLSearchParams({ genre: row.slug })}`}
                              >
                                {row.animeCount}
                              </Link>
                            </td>
                            {canWrite && (
                              <td className="tw:p-4">
                                <div className="tw:flex tw:gap-2">
                                  <Button
                                    variant="quiet"
                                    size="sm"
                                    label="Sửa"
                                    aria-label={`Sửa ${row.name}`}
                                    onClick={() =>
                                      setEditor((current) => ({
                                        row,
                                        revision: current.revision + 1,
                                        focus: true,
                                      }))
                                    }
                                  />
                                  <Button
                                    variant="quiet"
                                    size="sm"
                                    label="Xoá"
                                    aria-label={`Xoá ${row.name}`}
                                    onClick={() => setSelected(row)}
                                  />
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    showSinglePage
                    label="Phân trang thể loại"
                    page={query.page}
                    totalPages={result.meta.totalPages}
                    hrefForPage={(page) => genreHref({ ...query, page }, mock)}
                    className="tw:mt-6"
                  />
                </>
              ) : (
                <ContentState
                  title="Không có thể loại phù hợp"
                  description="Thử đổi từ khóa, bỏ điều kiện lọc hoặc thêm thể loại mới khi có quyền chỉnh sửa."
                />
              )}
            </section>
            {canWrite && adminPreview && (
              <GenreForm
                key={`${editor.row?.id ?? 'new'}:${editor.revision}`}
                row={editor.row}
                session={adminPreview}
                autoFocus={editor.focus}
                fail={mock === 'save-error'}
                onCancel={() => resetEditor()}
                onSaved={() => {
                  setNotice(
                    editor.row
                      ? 'Đã lưu thay đổi thể loại trong phiên mẫu.'
                      : 'Đã thêm thể loại trong phiên mẫu.',
                  );
                  resetEditor();
                  refresh();
                }}
              />
            )}
          </div>
        </>
      )}
      {canWrite && adminPreview && selected && (
        <DeleteGenreDialog
          key={selected.id}
          row={selected}
          session={adminPreview}
          fail={mock === 'delete-error'}
          onClose={() => setSelected(null)}
          onDeleted={() => {
            if (editor.row?.id === selected.id) resetEditor();
            setSelected(null);
            setNotice('Đã xoá thể loại khỏi phiên mẫu.');
            focusResults.current = true;
            refresh();
          }}
        />
      )}
    </>
  );
}
