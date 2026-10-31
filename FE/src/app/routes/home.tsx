import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Link, useSearchParams } from 'react-router-dom';
import { paths } from '@/config/paths';
import { useHomeCatalog } from '@/features/anime/hooks/use-home-catalog';
import { FeaturedBanner } from '@/features/anime/components/featured-banner';
import { AnimeCard } from '@/components/anime/anime-card';
import { TopViewedAnime } from '@/components/anime/top-viewed-anime';
import { ContinueWatching } from '@/features/anime/components/continue-watching';
import { ContentState } from '@/components/common/content-state';
const genres = ['Tất cả', 'Phiêu lưu', 'Giả tưởng', 'Đời thường', 'Tình cảm'];
export function HomePage() {
  const { data, error, retry } = useHomeCatalog();
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get('genre');
  const genre = value && genres.includes(value) ? value : 'Tất cả';
  function selectGenre(value: string) {
    const next = new URLSearchParams(searchParams);
    if (value === 'Tất cả') next.delete('genre');
    else next.set('genre', value);
    next.delete('page');
    setSearchParams(next, { replace: true, preventScrollReset: true });
  }
  if (error)
    return (
      <div className="aw-shell tw:mx-auto">
        <ContentState title="Hẹn bạn thử lại một chút" description={error} retry={retry} />
      </div>
    );
  if (!data)
    return (
      <div
        className="aw-shell aw-home-loading tw:mx-auto tw:pt-7"
        role="status"
        aria-label="Đang tải Trang chủ"
      >
        <div className="aw-skeleton aw-skeleton-hero tw:rounded-[12px] tw:h-133.75 tw:mb-6" />
        <p>Đang mở ra thế giới anime…</p>
        <div className="aw-anime-grid tw:gap-5 tw:grid tw:grid-cols-6 tw:max-tablet:grid-cols-3 tw:max-phone:grid-cols-2 tw:max-phone:gap-x-3.5">
          {Array.from({ length: 6 }, (_, i) => (
            <div className="aw-skeleton aw-skeleton-poster tw:rounded-[12px]" key={i} />
          ))}
        </div>
      </div>
    );
  if (!data.featured.length)
    return (
      <div className="aw-shell tw:mx-auto">
        <ContentState
          title="Những câu chuyện đang được chuẩn bị"
          description="Chưa có anime để hiển thị. Hãy quay lại sau hoặc tải lại danh sách demo."
          retry={retry}
        />
      </div>
    );
  const recommendations = data.recommended.filter(
    (item) => genre === 'Tất cả' || item.genres.includes(genre),
  );
  return (
    <div className="aw-shell tw:mx-auto">
      <FeaturedBanner items={data.featured} />
      <div className="aw-home-intro tw:py-5.75 tw:gap-3.75 tw:flex tw:justify-between tw:text-body">
        <span>
          <i className="aw-status-dot tw:inline-block tw:w-1.25 tw:h-1.25 tw:rounded-[50%]" /> GÓC
          NHỎ CHO TÍN ĐỒ ANIME
        </span>
        <span>
          Nội dung mẫu, cảm hứng không giới hạn <span aria-hidden="true">✧</span>
        </span>
      </div>
      <ContinueWatching items={[...data.updated, ...data.recommended]} />
      <div className="tw:mt-8">
        <TopViewedAnime items={data.topViewed} />
      </div>
      <section
        className="aw-section tw:mt-10.5 tw:max-phone:mt-7.5"
        aria-labelledby="updated-title"
      >
        <div className="aw-section-heading tw:gap-4.5 tw:flex tw:items-center tw:justify-between tw:mb-5.5">
          <div>
            <span className="aw-eyebrow">LUÔN CÓ ĐIỀU MỚI ĐỂ XEM</span>
            <h2 id="updated-title">
              Mới cập nhật<span className="aw-heading-dot">.</span>
            </h2>
          </div>
          <Link
            className="aw-text-link tw:text-body tw:whitespace-nowrap"
            to={`${paths.explore}?sort=newest&page=1`}
          >
            Xem tất cả <Icon name="external-link" size="sm" />
          </Link>
        </div>
        <div className="aw-anime-grid tw:gap-5 tw:grid tw:grid-cols-6 tw:max-tablet:grid-cols-3 tw:max-phone:grid-cols-2 tw:max-phone:gap-x-3.5">
          {data.updated.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      </section>
      <section
        className="aw-section aw-recommendations tw:mt-10.5 tw:pt-8 tw:max-phone:mt-7.5"
        aria-labelledby="recommended-title"
      >
        <div className="aw-section-heading tw:gap-4.5 tw:flex tw:items-center tw:justify-between tw:mb-5.5">
          <div>
            <span className="aw-eyebrow">CHỌN MỘT THẾ GIỚI ĐỂ ĐẮM CHÌM</span>
            <h2 id="recommended-title">
              Có thể bạn sẽ thích<span className="aw-heading-dot">.</span>
            </h2>
          </div>
          <span className="aw-curated tw:text-body tw:max-phone:hidden">
            ✦ Đề xuất biên tập · Mẫu
          </span>
        </div>
        <div
          className="aw-filter-chips tw:gap-2.25 tw:flex tw:flex-wrap tw:mb-6"
          role="group"
          aria-label="Thể loại đề xuất"
        >
          {genres.map((item) => (
            <Button
              variant="unstyled"
              key={item}
              aria-pressed={genre === item}
              onClick={() => selectGenre(item)}
              label={item}
            />
          ))}
        </div>
        {recommendations.length ? (
          <div className="aw-anime-grid aw-recommendation-grid tw:gap-5 tw:grid tw:grid-cols-4 tw:max-phone:grid-cols-2 tw:max-phone:gap-x-3.5">
            {recommendations.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>
        ) : (
          <ContentState
            title="Chưa có đề xuất cho thể loại này"
            description="Bạn có thể chọn thể loại khác hoặc quay lại Tất cả."
          />
        )}
      </section>
      <aside className="aw-discover-strip tw:p-7.5 tw:gap-5 tw:rounded-[12px] tw:flex tw:items-center tw:justify-between tw:mt-11.25 tw:max-phone:p-6 tw:max-phone:items-start tw:max-phone:flex-col">
        <div>
          <span className="aw-eyebrow">CÂU CHUYỆN TIẾP THEO ĐANG CHỜ</span>
          <h2>Hôm nay, bạn muốn đi đâu?</h2>
          <p>Tìm một thế giới phù hợp với tâm trạng của bạn.</p>
        </div>
        <Button
          as="link"
          variant="glass"
          to={paths.explore}
          label="Khám phá anime"
          endIcon={<Icon name="external-link" size="sm" />}
        />
      </aside>
    </div>
  );
}
