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
    <div className="aw-shell aw-explore">
      <nav aria-label="Đường dẫn" className="aw-explore-breadcrumb">
        <Link to={paths.home}>Trang chủ</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Khám phá</span>
      </nav>
      <header className="aw-explore-heading">
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
        <div className="aw-explore-heading-art" aria-hidden="true">
          <span>✦</span>
          <i />
          <b>FIND YOUR NEXT STORY</b>
        </div>
      </header>

      <ExploreFilters query={query} />
      <div className="aw-explore-active" aria-label="Bộ lọc đang chọn">
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
                <span aria-hidden="true">×</span>
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
        className="aw-explore-results"
        data-query={catalogParams(query).toString()}
        aria-labelledby="explore-results-title"
        aria-busy={!result && !error}
      >
        <div className="aw-explore-results-heading">
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
          <div className="aw-explore-sort">
            <div className="aw-explore-field">
              <label htmlFor="explore-sort">Sắp xếp</label>
              <select
                id="explore-sort"
                className="form-select"
                name="sort"
                form={exploreFormId}
                key={query.sort}
                defaultValue={query.sort}
                onChange={(event) => event.currentTarget.form?.requestSubmit()}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="aw-explore-field">
              <label htmlFor="explore-page-size">Mỗi trang</label>
              <select
                id="explore-page-size"
                className="form-select"
                name="pageSize"
                form={exploreFormId}
                key={query.pageSize}
                defaultValue={query.pageSize}
                onChange={(event) => event.currentTarget.form?.requestSubmit()}
              >
                <option value="12">12 anime</option>
                <option value="24">24 anime</option>
              </select>
            </div>
          </div>
        </div>

        {error ? (
          <ContentState title="Chuyến khám phá tạm gián đoạn" description={error} retry={retry} />
        ) : !result ? (
          <div role="status" aria-label="Đang tải danh mục anime" className="aw-explore-grid">
            {Array.from({ length: 12 }, (_, index) => (
              <div key={index} className="aw-skeleton aw-skeleton-poster" />
            ))}
          </div>
        ) : !total ? (
          <div className="aw-explore-empty">
            <span aria-hidden="true">✧</span>
            <h3>Chưa tìm thấy câu chuyện phù hợp</h3>
            <p>Thử từ khóa ngắn hơn hoặc bỏ bớt bộ lọc để khám phá nhiều anime hơn.</p>
            <Link className="btn aw-btn-primary" to={paths.explore}>
              Xóa bộ lọc và khám phá lại
            </Link>
          </div>
        ) : (
          <>
            <div className="aw-explore-grid">
              {result.data.map((anime) => (
                <AnimeCard key={anime.id} anime={anime} />
              ))}
            </div>
            <Pagination
              page={result.meta.page}
              totalPages={result.meta.totalPages}
              hrefForPage={(page) => catalogHref({ ...query, page }, mock)}
            />
          </>
        )}
      </section>
      <aside className="aw-explore-note">
        <span aria-hidden="true">✦</span>
        <p>
          Những câu chuyện trong bản demo là nội dung hư cấu với hình ảnh minh họa. Chưa có nguồn
          phim thực tế.
        </p>
      </aside>
    </div>
  );
}
