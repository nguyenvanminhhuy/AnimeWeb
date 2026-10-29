import { Link, useSearchParams } from 'react-router-dom';
import { paths } from '../routes/paths';
import { useHomeCatalog } from '../features/anime/hooks/useHomeCatalog';
import { FeaturedBanner } from '../features/anime/components/FeaturedBanner';
import { AnimeCard } from '../features/anime/components/AnimeCard';
import { ContinueWatching } from '../features/anime/components/ContinueWatching';
import { ContentState } from '../components/common/ContentState';
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
      <div className="aw-shell">
        <ContentState title="Hẹn bạn thử lại một chút" description={error} retry={retry} />
      </div>
    );
  if (!data)
    return (
      <div className="aw-shell aw-home-loading" role="status" aria-label="Đang tải Trang chủ">
        <div className="aw-skeleton aw-skeleton-hero" />
        <p>Đang mở ra thế giới anime…</p>
        <div className="aw-anime-grid">
          {Array.from({ length: 6 }, (_, i) => (
            <div className="aw-skeleton aw-skeleton-poster" key={i} />
          ))}
        </div>
      </div>
    );
  if (!data.featured.length)
    return (
      <div className="aw-shell">
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
    <div className="aw-shell">
      <FeaturedBanner items={data.featured} />
      <div className="aw-home-intro">
        <span>
          <i className="aw-status-dot" /> GÓC NHỎ CHO TÍN ĐỒ ANIME
        </span>
        <span>
          Nội dung mẫu, cảm hứng không giới hạn <span aria-hidden="true">✧</span>
        </span>
      </div>
      <ContinueWatching items={[...data.updated, ...data.recommended]} />
      <section className="aw-section" aria-labelledby="updated-title">
        <div className="aw-section-heading">
          <div>
            <span className="aw-eyebrow">LUÔN CÓ ĐIỀU MỚI ĐỂ XEM</span>
            <h2 id="updated-title">
              Mới cập nhật<span className="aw-heading-dot">.</span>
            </h2>
          </div>
          <Link className="aw-text-link" to={`${paths.explore}?sort=newest&page=1`}>
            Xem tất cả <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="aw-anime-grid">
          {data.updated.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      </section>
      <section className="aw-section aw-recommendations" aria-labelledby="recommended-title">
        <div className="aw-section-heading">
          <div>
            <span className="aw-eyebrow">CHỌN MỘT THẾ GIỚI ĐỂ ĐẮM CHÌM</span>
            <h2 id="recommended-title">
              Có thể bạn sẽ thích<span className="aw-heading-dot">.</span>
            </h2>
          </div>
          <span className="aw-curated">✦ Đề xuất biên tập · Mẫu</span>
        </div>
        <div className="aw-filter-chips" role="group" aria-label="Thể loại đề xuất">
          {genres.map((item) => (
            <button key={item} aria-pressed={genre === item} onClick={() => selectGenre(item)}>
              {item}
            </button>
          ))}
        </div>
        {recommendations.length ? (
          <div className="aw-anime-grid aw-recommendation-grid">
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
      <aside className="aw-discover-strip">
        <div>
          <span className="aw-eyebrow">CÂU CHUYỆN TIẾP THEO ĐANG CHỜ</span>
          <h2>Hôm nay, bạn muốn đi đâu?</h2>
          <p>Tìm một thế giới phù hợp với tâm trạng của bạn.</p>
        </div>
        <Link className="btn aw-btn-glass" to={paths.explore}>
          Khám phá anime <span aria-hidden="true">↗</span>
        </Link>
      </aside>
    </div>
  );
}
