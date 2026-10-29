import { Selectbox } from '@/components/ui/selectbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Form, Link, useLocation } from 'react-router-dom';
import { paths } from '@/config/paths';
import { useLibrary } from '@/features/library/hooks/use-library';
import { libraryHref } from '@/features/library/utils/library-query';
import { libraryPageSize, libraryTabs } from '@/features/library/config/library';
import { LibraryCard } from '@/features/library/components/library-card';
import { ContentState } from '@/components/common/content-state';
import { Pagination } from '@/components/common/pagination';

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
      <section className="aw-shell aw-library-guest tw:mx-auto">
        <div className="aw-state aw-surface tw:px-6 tw:py-16 tw:mx-auto tw:my-12 tw:rounded-[16px] tw:text-center tw:max-w-210">
          <span
            className="aw-library-guest-symbol tw:block tw:leading-[1] tw:mb-6"
            aria-hidden="true"
          >
            <Icon name="heart" size="lg" />
          </span>
          <span className="aw-eyebrow">KHÔNG GIAN CỦA RIÊNG BẠN</span>
          <h1>Thư viện dành cho thành viên</h1>
          <p>
            Giữ những anime bạn yêu thích, tiếp nối câu chuyện đang xem và tìm lại các tập đã qua.
            Đăng nhập demo để mở thư viện của bạn.
          </p>
          <Button
            as="link"
            variant="primary"
            to={paths.loginTo(returnTo)}
            label="Đăng nhập"
            endIcon={<Icon name="external-link" size="sm" />}
          />
          <p>
            <Link className="aw-text-link tw:text-body tw:whitespace-nowrap" to={paths.explore}>
              Khám phá anime trước
            </Link>
          </p>
        </div>
      </section>
    );
  if (!canRead)
    return (
      <section className="aw-shell tw:mx-auto">
        <ContentState
          title="Bạn chưa có quyền xem thư viện"
          description="Tài khoản hiện tại cần quyền đọc thư viện và tiến độ cá nhân. Đây là trạng thái mô phỏng trong bản demo."
        />
        <p className="aw-library-return tw:text-center">
          <Button
            as="link"
            variant="glass"
            to={paths.home}
            startIcon={<Icon name="arrow-left" size="sm" />}
            label="Về Trang chủ"
          />
        </p>
      </section>
    );
  const tabLabel = libraryTabs.find((tab) => tab.value === query.tab)!.label;
  const empty = emptyMessages[query.tab];
  return (
    <div className="aw-shell aw-library tw:mx-auto tw:pt-7">
      <nav className="aw-library-breadcrumb tw:gap-3 tw:flex tw:text-body" aria-label="Đường dẫn">
        <Link to={paths.home}>Trang chủ</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Thư viện</span>
      </nav>
      <header className="aw-library-heading tw:gap-6 tw:flex tw:items-center tw:justify-between tw:pt-10 tw:pb-8 tw:max-phone:items-start tw:max-phone:flex-col tw:max-phone:pt-7.5 tw:max-phone:pb-6.25">
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
        <Button
          as="link"
          variant="glass"
          to={paths.explore}
          label="Tìm câu chuyện mới"
          endIcon={<Icon name="external-link" size="sm" />}
        />
      </header>
      <div
        className="aw-library-summary tw:gap-4 tw:grid tw:grid-cols-3 tw:mb-8.5 tw:max-phone:gap-2 tw:max-phone:mb-5"
        aria-label="Tổng quan thư viện"
      >
        {libraryTabs.map((tab) => (
          <Link
            key={tab.value}
            to={libraryHref({ ...query, tab: tab.value, q: '', page: 1 }, mock)}
          >
            <span
              className="aw-library-summary-icon tw:grid tw:place-items-center tw:w-11 tw:h-11 tw:rounded-[10px] tw:shrink-0 tw:max-phone:w-8 tw:max-phone:h-8 tw:max-phone:rounded-[6px]"
              aria-hidden="true"
            >
              <Icon name={tab.icon} size="lg" />
            </span>
            <div>
              <span>{tab.label}</span>
              <strong>{loading || error ? '—' : counts[tab.value]}</strong>
            </div>
            <span className="aw-library-summary-unit tw:ml-auto tw:self-end tw:text-body tw:max-tablet:hidden">
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
        <nav
          className="aw-library-tabs tw:gap-7.5 tw:flex tw:max-phone:gap-2 tw:max-phone:justify-between"
          aria-label="Các bộ sưu tập"
        >
          {libraryTabs.map((tab) => (
            <Link
              key={tab.value}
              to={libraryHref({ ...query, tab: tab.value, q: '', page: 1 }, mock)}
              aria-current={tab.value === query.tab ? 'page' : undefined}
            >
              <Icon name={tab.icon} size="sm" />
              {tab.label}
              <span className="aw-library-tab-count tw:px-1.5 tw:py-px tw:rounded-[4px] tw:text-body">
                {loading || error ? '—' : counts[tab.value]}
              </span>
            </Link>
          ))}
        </nav>
        <div className="aw-library-toolbar tw:py-7 tw:gap-5 tw:flex tw:items-center tw:justify-between tw:max-tablet:items-start tw:max-tablet:flex-col">
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
            className="aw-library-search tw:gap-2 tw:flex tw:items-center tw:min-w-0 tw:max-phone:w-full tw:max-phone:flex-wrap"
            action={paths.library}
            method="get"
            role="search"
            aria-label="Tìm trong thư viện"
          >
            <Input variant="unstyled" type="hidden" name="tab" value={query.tab} />
            <Input variant="unstyled" type="hidden" name="page" value="1" />
            <label htmlFor="library-search" className="visually-hidden">
              Tìm trong bộ sưu tập
            </label>
            <Input
              variant="unstyled"
              id="library-search"
              key={`${query.tab}:${query.q}`}
              name="q"
              type="search"
              defaultValue={query.q}
              maxLength={100}
              placeholder="Tìm trong bộ sưu tập…"
            />
            <Button
              variant="quiet"
              type="submit"
              aria-label="Tìm trong bộ sưu tập"
              startIcon={<Icon name="search" />}
            />
            <label htmlFor="library-sort" className="visually-hidden">
              Sắp xếp thư viện
            </label>
            <Selectbox
              id="library-sort"
              key={query.sort}
              name="sort"
              defaultValue={query.sort}
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
            >
              <option value="recent">Thứ tự lưu</option>
              <option value="title">Tên A–Z</option>
            </Selectbox>
          </Form>
        </div>
        {error ? (
          <ContentState title="Chưa mở được thư viện" description={error} retry={library.retry} />
        ) : loading ? (
          <div
            className="aw-library-grid tw:grid tw:grid-cols-4 tw:gap-y-7.5 tw:gap-x-5.5 tw:max-tablet:grid-cols-3 tw:max-phone:grid-cols-2 tw:max-phone:gap-y-6.5 tw:max-phone:gap-x-3.5"
            role="status"
            aria-label="Đang tải thư viện"
          >
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="aw-skeleton aw-skeleton-poster tw:rounded-[12px]" />
            ))}
          </div>
        ) : items.length ? (
          <>
            <div className="aw-library-grid tw:grid tw:grid-cols-4 tw:gap-y-7.5 tw:gap-x-5.5 tw:max-tablet:grid-cols-3 tw:max-phone:grid-cols-2 tw:max-phone:gap-y-6.5 tw:max-phone:gap-x-3.5">
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
              label="Phân trang thư viện"
              page={query.page}
              totalPages={totalPages}
              hrefForPage={(page) => libraryHref({ ...query, page }, mock)}
            />
          </>
        ) : (
          <div className="aw-library-empty tw:px-5 tw:py-13.5 tw:text-center tw:rounded-[12px]">
            <span aria-hidden="true">
              <Icon
                name={query.q ? 'search' : libraryTabs.find((tab) => tab.value === query.tab)!.icon}
                size="lg"
              />
            </span>
            <h3>{query.q ? 'Không tìm thấy trong bộ sưu tập' : empty.title}</h3>
            <p>
              {query.q
                ? `Không có kết quả cho “${query.q}”. Thử từ khóa khác hoặc bỏ tìm kiếm.`
                : empty.description}
            </p>
            <Button
              as="link"
              variant="primary"
              to={query.q ? libraryHref({ ...query, q: '', page: 1 }, mock) : paths.explore}
              label={query.q ? 'Bỏ tìm kiếm' : 'Khám phá anime'}
              endIcon={!query.q ? <Icon name="external-link" size="sm" /> : undefined}
            />
            {query.tab === 'favorites' && !query.q && (
              <Link className="aw-text-link tw:text-body tw:whitespace-nowrap" to={paths.home}>
                Về Trang chủ để thêm yêu thích
              </Link>
            )}
          </div>
        )}
      </section>
      <aside className="aw-library-note tw:gap-3 tw:flex tw:items-center tw:mt-10 tw:pt-5.5 tw:text-body tw:leading-[1.8]">
        <span aria-hidden="true">✦</span>
        <p>
          Thư viện demo chỉ lưu trên trình duyệt này và tách riêng theo tài khoản. Lịch sử là dữ
          liệu mẫu; chưa có phát video thực tế.
        </p>
      </aside>
    </div>
  );
}
