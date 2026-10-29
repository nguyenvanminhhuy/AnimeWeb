import { Form, Link, useLocation } from 'react-router-dom';
import { paths } from '../routes/paths';
import { useLibrary } from '../features/library/hooks/useLibrary';
import { libraryHref } from '../features/library/libraryQuery';
import { libraryPageSize, libraryTabs } from '../features/library/library.types';
import { LibraryCard } from '../features/library/components/LibraryCard';
import { ContentState } from '../components/common/ContentState';
import { Pagination } from '../components/common/Pagination';

const emptyMessages = {
  favorites: {
    title: 'Chưa có anime yêu thích',
    description: 'Nhấn Yêu thích trên Trang chủ để giữ lại những câu chuyện bạn muốn xem.',
  },
  watching: {
    title: 'Chưa có câu chuyện đang xem',
    description:
      'Những tập có tiến độ chưa hoàn thành sẽ xuất hiện ở đây. Tài khoản demo có lịch sử mẫu để bạn trải nghiệm.',
  },
  history: {
    title: 'Lịch sử của bạn đang trống',
    description:
      'Những tập đã xem sẽ được lưu ở đây khi có trình phát. Hiện bạn có thể thử tài khoản có lịch sử mẫu.',
  },
};

export function LibraryPage() {
  const library = useLibrary();
  const { user, canRead, query, counts, items, total, totalPages, mock, loading, error } = library;
  const location = useLocation();
  const returnTo = location.pathname + location.search;
  if (!user)
    return (
      <section className="aw-shell aw-library-guest">
        <div className="aw-state aw-surface">
          <span className="aw-library-guest-symbol" aria-hidden="true">
            ♡
          </span>
          <span className="aw-eyebrow">KHÔNG GIAN CỦA RIÊNG BẠN</span>
          <h1>Thư viện dành cho thành viên</h1>
          <p>
            Giữ những anime bạn yêu thích, tiếp nối câu chuyện đang xem và tìm lại các tập đã qua.
            Đăng nhập demo để mở thư viện của bạn.
          </p>
          <Link className="btn aw-btn-primary" to={paths.loginTo(returnTo)}>
            Đăng nhập demo ↗
          </Link>
          <p>
            <Link className="aw-text-link" to={paths.explore}>
              Khám phá anime trước
            </Link>
          </p>
        </div>
      </section>
    );
  if (!canRead)
    return (
      <section className="aw-shell">
        <ContentState
          title="Bạn chưa có quyền xem thư viện"
          description="Tài khoản hiện tại cần quyền đọc thư viện và tiến độ cá nhân. Đây là trạng thái mô phỏng trong bản demo."
        />
        <p className="aw-library-return">
          <Link className="btn aw-btn-glass" to={paths.home}>
            ← Về Trang chủ
          </Link>
        </p>
      </section>
    );
  const tabLabel = libraryTabs.find((tab) => tab.value === query.tab)!.label;
  const empty = emptyMessages[query.tab];
  return (
    <div className="aw-shell aw-library">
      <nav className="aw-library-breadcrumb" aria-label="Đường dẫn">
        <Link to={paths.home}>Trang chủ</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Thư viện</span>
      </nav>
      <header className="aw-library-heading">
        <div>
          <p className="aw-eyebrow">NHỮNG CÂU CHUYỆN BẠN MUỐN GIỮ LẠI</p>
          <h1>
            Thư viện của bạn
            <span className="aw-heading-dot" aria-hidden="true">
              .
            </span>
          </h1>
          <p>
            Một nơi cho những điều yêu thích.
            <br />
            Và những hành trình còn đang tiếp diễn.
          </p>
        </div>
        <Link className="btn aw-btn-glass" to={paths.explore}>
          Tìm câu chuyện mới <span aria-hidden="true">↗</span>
        </Link>
      </header>
      <div className="aw-library-summary" aria-label="Tổng quan thư viện">
        {libraryTabs.map((tab) => (
          <Link
            key={tab.value}
            to={libraryHref({ ...query, tab: tab.value, q: '', page: 1 }, mock)}
          >
            <span className="aw-library-summary-icon" aria-hidden="true">
              {tab.icon}
            </span>
            <div>
              <span>{tab.label}</span>
              <strong>{loading || error ? '—' : counts[tab.value]}</strong>
            </div>
            <span className="aw-library-summary-unit">
              {tab.value === 'history' ? 'tập đã lưu' : 'anime'}
            </span>
          </Link>
        ))}
      </div>
      <section
        className="aw-library-collection"
        aria-labelledby="library-collection-title"
        aria-busy={loading}
        data-query={libraryHref(query, mock).split('?')[1]}
      >
        <nav className="aw-library-tabs" aria-label="Các bộ sưu tập">
          {libraryTabs.map((tab) => (
            <Link
              key={tab.value}
              to={libraryHref({ ...query, tab: tab.value, q: '', page: 1 }, mock)}
              aria-current={tab.value === query.tab ? 'page' : undefined}
            >
              <span aria-hidden="true">{tab.icon}</span>
              {tab.label}
              <span className="aw-library-tab-count">
                {loading || error ? '—' : counts[tab.value]}
              </span>
            </Link>
          ))}
        </nav>
        <div className="aw-library-toolbar">
          <div>
            <h2 id="library-collection-title">{tabLabel}</h2>
            <p role="status">
              {error
                ? 'Thư viện tạm thời chưa tải được'
                : loading
                  ? 'Đang mở bộ sưu tập…'
                  : `${total} ${query.tab === 'history' ? 'tập' : 'anime'}${total ? ` · Hiển thị ${(query.page - 1) * libraryPageSize + 1}–${Math.min(query.page * libraryPageSize, total)}` : ''}`}
            </p>
          </div>
          <Form
            className="aw-library-search"
            action={paths.library}
            method="get"
            role="search"
            aria-label="Tìm trong thư viện"
          >
            <input type="hidden" name="tab" value={query.tab} />
            <input type="hidden" name="page" value="1" />
            <label htmlFor="library-search" className="visually-hidden">
              Tìm trong bộ sưu tập
            </label>
            <input
              id="library-search"
              key={`${query.tab}:${query.q}`}
              name="q"
              type="search"
              defaultValue={query.q}
              maxLength={100}
              placeholder="Tìm trong bộ sưu tập…"
            />
            <button className="btn aw-btn-quiet" type="submit" aria-label="Tìm trong bộ sưu tập">
              ⌕
            </button>
            <label htmlFor="library-sort" className="visually-hidden">
              Sắp xếp thư viện
            </label>
            <select
              className="form-select"
              id="library-sort"
              key={query.sort}
              name="sort"
              defaultValue={query.sort}
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
            >
              <option value="recent">Thứ tự lưu</option>
              <option value="title">Tên A–Z</option>
            </select>
          </Form>
        </div>
        {error ? (
          <ContentState title="Chưa mở được thư viện" description={error} retry={library.retry} />
        ) : loading ? (
          <div className="aw-library-grid" role="status" aria-label="Đang tải thư viện">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="aw-skeleton aw-skeleton-poster" />
            ))}
          </div>
        ) : items.length ? (
          <>
            <div className="aw-library-grid">
              {items.map((item) => (
                <LibraryCard
                  key={item.key}
                  item={item}
                  tab={query.tab}
                  favorite={library.favorites.includes(item.anime.id)}
                  canWrite={library.canWrite}
                  onToggleFavorite={library.toggleFavorite}
                />
              ))}
            </div>
            <Pagination
              page={query.page}
              totalPages={totalPages}
              hrefForPage={(page) => libraryHref({ ...query, page }, mock)}
            />
          </>
        ) : (
          <div className="aw-library-empty">
            <span aria-hidden="true">
              {query.q ? '⌕' : libraryTabs.find((tab) => tab.value === query.tab)!.icon}
            </span>
            <h3>{query.q ? 'Không tìm thấy trong bộ sưu tập' : empty.title}</h3>
            <p>
              {query.q
                ? `Không có kết quả cho “${query.q}”. Thử từ khóa khác hoặc bỏ tìm kiếm.`
                : empty.description}
            </p>
            <Link
              className="btn aw-btn-primary"
              to={query.q ? libraryHref({ ...query, q: '', page: 1 }, mock) : paths.explore}
            >
              {query.q ? 'Bỏ tìm kiếm' : 'Khám phá anime ↗'}
            </Link>
            {query.tab === 'favorites' && !query.q && (
              <Link className="aw-text-link" to={paths.home}>
                Về Trang chủ để thêm yêu thích
              </Link>
            )}
          </div>
        )}
      </section>
      <aside className="aw-library-note">
        <span aria-hidden="true">✦</span>
        <p>
          Thư viện demo chỉ lưu trên trình duyệt này và tách riêng theo tài khoản. Lịch sử là dữ
          liệu mẫu; chưa có phát video thực tế.
        </p>
      </aside>
    </div>
  );
}
