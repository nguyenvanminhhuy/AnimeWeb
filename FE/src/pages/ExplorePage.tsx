import { Selectbox } from '../components/ui/Selectbox';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { AnimeCard } from '../features/anime/components/AnimeCard';
import { ExploreFilters, exploreFormId } from '../features/anime/components/ExploreFilters';
import { useExploreCatalog } from '../features/anime/hooks/useExploreCatalog';
import {
  catalogHref,
  catalogParams,
  formatOptions,
  genreOptions,
  sortOptions,
  statusOptions,
} from '../features/anime/catalogQuery';
import { ContentState } from '../components/common/ContentState';
import { Pagination } from '../components/common/Pagination';
import { Link } from 'react-router-dom';
import { paths } from '../routes/paths';

export function ExplorePage() {
  const { query, result, error, retry, mock } = useExploreCatalog();
  const activeFilters = [
    { key: 'q', label: query.q ? `Từ khóa: ${query.q}` : '' },
    {
      key: 'genre',
      label: genreOptions.find((option) => option.value === query.genre)?.label ?? '',
    },
    { key: 'year', label: query.year },
    {
      key: 'status',
      label: statusOptions.find((option) => option.value === query.status)?.label ?? '',
    },
    {
      key: 'format',
      label: formatOptions.find((option) => option.value === query.format)?.label ?? '',
    },
  ] as const;
  const selected = activeFilters.filter((filter) => filter.label);
  const total = result?.meta.total ?? 0;
  const start = total ? (query.page - 1) * query.pageSize + 1 : 0;
  const end = Math.min(query.page * query.pageSize, total);

  return (
    <div className="aw-shell aw-explore tw:mx-auto tw:pt-7">
      <nav aria-label="Đường dẫn" className="aw-explore-breadcrumb tw:gap-3 tw:flex tw:text-body">
        <Link to={paths.home}>Trang chủ</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Khám phá</span>
      </nav>
      <header className="aw-explore-heading tw:py-7.5 tw:relative tw:overflow-hidden tw:flex tw:justify-between tw:items-center tw:min-h-57.5">
        <div>
          <p className="aw-eyebrow">MỖI LỰA CHỌN, MỘT THẾ GIỚI MỚI</p>
          <h1>
            Khám phá anime
            <span className="aw-heading-dot" aria-hidden="true">
              .
            </span>
          </h1>
          <p>
            Từ những chuyến phiêu lưu kỳ ảo đến những ngày bình yên.
            <br />
            Tìm câu chuyện dành riêng cho bạn.
          </p>
        </div>
        <div
          className="aw-explore-heading-art tw:shrink-0 tw:grid tw:place-items-center tw:max-mobile:hidden"
          aria-hidden="true"
        >
          <span>✦</span>
          <i />
          <b>FIND YOUR NEXT STORY</b>
        </div>
      </header>

      <ExploreFilters query={query} suggestions={result?.data.map((anime) => anime.title) ?? []} />
      <div
        className="aw-explore-active tw:py-3.75 tw:gap-2.25 tw:min-h-15 tw:flex tw:flex-wrap tw:items-center tw:text-body"
        aria-label="Bộ lọc đang chọn"
      >
        {selected.length ? (
          <>
            <span>Đang lọc</span>
            {selected.map((filter) => (
              <Link
                key={filter.key}
                to={catalogHref({ ...query, [filter.key]: '', page: 1 }, mock)}
                aria-label={`Bỏ lọc ${filter.label}`}
              >
                {filter.label}
                <Icon name="close" size="sm" />
              </Link>
            ))}
            <Link className="aw-explore-clear" to={paths.explore}>
              Xóa tất cả
            </Link>
          </>
        ) : (
          <span>Gợi ý: tìm bằng tên tiếng Việt có dấu hoặc không dấu.</span>
        )}
      </div>

      <section
        className="aw-explore-results tw:pt-6.5 tw:mt-1"
        data-query={catalogParams(query).toString()}
        aria-labelledby="explore-results-title"
        aria-busy={!result && !error}
      >
        <div className="aw-explore-results-heading tw:gap-5 tw:flex tw:items-center tw:justify-between tw:mb-6.5 tw:max-mobile:flex-col tw:max-mobile:items-start">
          <div>
            <h2 id="explore-results-title">
              {selected.length ? 'Kết quả dành cho bạn' : 'Tất cả anime'}
            </h2>
            <p role="status">
              {error
                ? 'Danh mục tạm thời chưa tải được'
                : result
                  ? `${total} anime · Dữ liệu mẫu${total ? ` · Hiển thị ${start}–${end}` : ''}`
                  : 'Đang tìm những câu chuyện…'}
            </p>
          </div>
          <div className="aw-explore-sort tw:gap-3.5 tw:flex tw:max-mobile:w-full">
            <div className="aw-explore-field tw:grid tw:text-body">
              <label htmlFor="explore-sort">Sắp xếp</label>
              <Selectbox
                id="explore-sort"
                name="sort"
                form={exploreFormId}
                key={query.sort}
                options={sortOptions}
                defaultValue={query.sort}
                onChange={(event) => event.currentTarget.form?.requestSubmit()}
              />
            </div>
            <div className="aw-explore-field tw:grid tw:text-body">
              <label htmlFor="explore-page-size">Mỗi trang</label>
              <Selectbox
                id="explore-page-size"
                name="pageSize"
                form={exploreFormId}
                key={query.pageSize}
                defaultValue={query.pageSize}
                onChange={(event) => event.currentTarget.form?.requestSubmit()}
              >
                <option value="12">12 anime</option>
                <option value="24">24 anime</option>
              </Selectbox>
            </div>
          </div>
        </div>

        {error ? (
          <ContentState title="Chuyến khám phá tạm gián đoạn" description={error} retry={retry} />
        ) : !result ? (
          <div
            role="status"
            aria-label="Đang tải danh mục anime"
            className="aw-explore-grid tw:grid tw:grid-cols-6 tw:gap-y-7.5 tw:gap-x-5 tw:max-tablet:grid-cols-3 tw:max-mobile:grid-cols-2 tw:max-mobile:gap-y-6 tw:max-mobile:gap-x-3.5"
          >
            {Array.from({ length: 12 }, (_, index) => (
              <div key={index} className="aw-skeleton aw-skeleton-poster tw:rounded-[12px]" />
            ))}
          </div>
        ) : !total ? (
          <div className="aw-explore-empty tw:px-5 tw:py-14 tw:text-center tw:rounded-[12px]">
            <span aria-hidden="true">✧</span>
            <h3>Chưa tìm thấy câu chuyện phù hợp</h3>
            <p>Thử từ khóa ngắn hơn hoặc bỏ bớt bộ lọc để khám phá nhiều anime hơn.</p>
            <Button
              as="link"
              variant="primary"
              to={paths.explore}
              label="Xóa bộ lọc và khám phá lại"
            />
          </div>
        ) : (
          <>
            <div className="aw-explore-grid tw:grid tw:grid-cols-6 tw:gap-y-7.5 tw:gap-x-5 tw:max-tablet:grid-cols-3 tw:max-mobile:grid-cols-2 tw:max-mobile:gap-y-6 tw:max-mobile:gap-x-3.5">
              {result.data.map((anime) => (
                <AnimeCard key={anime.id} anime={anime} />
              ))}
            </div>
            <Pagination
              label="Phân trang anime"
              page={result.meta.page}
              totalPages={result.meta.totalPages}
              hrefForPage={(page) => catalogHref({ ...query, page }, mock)}
            />
          </>
        )}
      </section>
      <aside className="aw-explore-note tw:gap-3 tw:mt-10 tw:pt-5.5 tw:flex tw:items-center tw:text-body tw:leading-[1.8]">
        <span aria-hidden="true">✦</span>
        <p>
          Những câu chuyện trong bản demo là nội dung hư cấu với hình ảnh minh họa. Chưa có nguồn
          phim thực tế.
        </p>
      </aside>
    </div>
  );
}
