import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ContentState } from '@/components/common/content-state';
import { Pagination } from '@/components/common/pagination';
import { AdminAnimeFilters } from '@/features/admin-anime/components/admin-anime-filters';
import { AdminAnimeTable } from '@/features/admin-anime/components/admin-anime-table';
import { useAdminAnime } from '@/features/admin-anime/hooks/use-admin-anime';
import { adminAnimeHref, adminAnimeParams } from '@/features/admin-anime/utils/admin-anime-query';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '@/stores/session';
import { paths } from '@/config/paths';
import type { AdminAnimeRow } from '@/types/admin-anime';
import { DeleteAnimeDialog } from '@/features/admin-anime/components/delete-anime-dialog';

export function AdminAnimePage() {
  const navigate = useNavigate();
  const { canRead, query, result, error, loading, mock, refresh } = useAdminAnime();
  const total = result?.meta.total ?? 0;
  const { adminPreview, permissions } = useSession();
  const location = useLocation();
  const canWrite = canRead && permissions.includes('admin:anime:write');
  const [selected, setSelected] = useState<AdminAnimeRow | null>(null);
  const [notice, setNotice] = useState<string>(location.state?.adminAnimeNotice ?? '');
  const focusResults = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const returnTo = adminAnimeHref(query);
  useEffect(() => {
    if (focusResults.current && result) {
      focusResults.current = false;
      heading.current?.focus();
    }
  }, [result]);
  return (
    <>
      <header className="tw:flex tw:justify-between tw:items-start tw:gap-4 tw:flex-wrap tw:mb-7">
        <div>
          <p className="aw-eyebrow tw:mb-2">DANH MỤC NỘI DUNG</p>
          <h1 className="tw:text-3xl tw:mb-3 tw:max-phone:text-2xl">Quản lý anime</h1>
          <p className="tw:text-[var(--aw-muted)] tw:mb-0">
            Tra cứu phim, trạng thái phát hành và các tập đã công bố.
          </p>
        </div>
        <div className="tw:flex tw:gap-3 tw:flex-wrap">
          {canWrite && (
            <Button
              as="link"
              to={paths.adminAnimeNew(returnTo)}
              label="Thêm phim"
              startIcon={<Icon name="plus" size="sm" />}
            />
          )}
          {canRead && (
            <Button
              variant="quiet"
              label="Làm mới"
              loading={loading}
              onClick={refresh}
              startIcon={<Icon name="replay" size="sm" />}
            />
          )}
        </div>
      </header>
      {!canRead ? (
        <ContentState
          title="Bạn chưa có quyền xem danh sách phim"
          description="Trang này yêu cầu quyền đọc danh mục quản trị. Bạn vẫn có thể mở Dashboard nếu có quyền tương ứng."
        />
      ) : (
        <>
          <p className="tw:rounded-xl tw:bg-[#a697ff0d] tw:border tw:border-[var(--aw-border)] tw:p-4 tw:mb-6 tw:text-[var(--aw-muted)]">
            {canWrite
              ? 'Dữ liệu mẫu · Thêm, sửa và xoá chỉ tác động phiên hiện tại. Tải lại trang sẽ đặt lại dữ liệu.'
              : 'Dữ liệu mẫu · Phiên chỉ đọc. Đổi sang phiên có quyền chỉnh sửa để thêm, sửa hoặc xoá phim.'}
          </p>
          {notice && (
            <p role="status" className="tw:text-[#9fe3c2] tw:mb-5">
              {notice}
            </p>
          )}
          <AdminAnimeFilters
            query={query}
            mock={mock}
            years={result?.years}
            genres={result?.genreOptions}
          />
          <section
            aria-labelledby="admin-anime-results"
            aria-busy={loading}
            data-query={adminAnimeParams(query).toString()}
            data-admin-anime={loading ? 'loading' : error ? 'error' : 'ready'}
          >
            <div className="tw:flex tw:gap-3 tw:justify-between tw:items-center tw:flex-wrap tw:mb-4">
              <h2
                ref={heading}
                tabIndex={-1}
                id="admin-anime-results"
                className="tw:text-xl tw:mb-0"
              >
                Danh sách phim
              </h2>
              <p role="status" className="tw:mb-0 tw:text-[var(--aw-muted)]">
                {loading
                  ? 'Đang tải danh sách…'
                  : error
                    ? 'Chưa tải được dữ liệu'
                    : `${total} phim${total ? ` · Hiển thị ${(query.page - 1) * query.pageSize + 1}–${Math.min(query.page * query.pageSize, total)}` : ''}`}
              </p>
            </div>
            <Pagination
              showSinglePage
              disabled={loading || !!error}
              pageSizeControl={{
                value: query.pageSize,
                options: [12, 24],
                label: 'Mỗi trang',
                onChange: (pageSize) => {
                  if (pageSize === 12 || pageSize === 24)
                    navigate(adminAnimeHref({ ...query, page: 1, pageSize }, mock));
                },
              }}
              label="Phân trang phim quản trị phía trên"
              page={query.page}
              totalPages={result?.meta.totalPages ?? 0}
              hrefForPage={(page) => adminAnimeHref({ ...query, page }, mock)}
              className="tw:mb-4"
            />
            {error ? (
              <ContentState
                title="Chưa tải được danh sách phim"
                description={error}
                retry={refresh}
              />
            ) : loading ? (
              <div role="status" aria-label="Đang tải danh sách phim" className="tw:grid tw:gap-3">
                {Array.from({ length: 5 }, (_, index) => (
                  <div key={index} className="aw-skeleton tw:h-24 tw:rounded-xl" />
                ))}
              </div>
            ) : result?.data.length ? (
              <>
                <AdminAnimeTable
                  rows={result.data}
                  canWrite={canWrite}
                  returnTo={returnTo}
                  onDelete={setSelected}
                />
                <Pagination
                  showSinglePage
                  label="Phân trang phim quản trị"
                  page={query.page}
                  totalPages={result.meta.totalPages}
                  hrefForPage={(page) => adminAnimeHref({ ...query, page }, mock)}
                  className="tw:mt-6"
                />
              </>
            ) : (
              <ContentState
                title="Không có phim phù hợp"
                description="Thử thay đổi từ khóa hoặc đặt lại bộ lọc để xem danh mục mẫu."
              />
            )}
          </section>
        </>
      )}
      {canWrite && adminPreview && selected && (
        <DeleteAnimeDialog
          key={`${adminPreview.id}:${selected.anime.id}`}
          row={selected}
          session={adminPreview}
          fail={mock === 'delete-error'}
          onClose={() => setSelected(null)}
          onDeleted={() => {
            setSelected(null);
            setNotice('Đã xoá phim khỏi phiên mẫu.');
            focusResults.current = true;
            refresh();
          }}
        />
      )}
    </>
  );
}
