import { Link } from 'react-router-dom';
import { Artwork } from '@/components/common/artwork';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import type { IconName } from '@/components/ui/icon-definitions';
import { paths } from '@/config/paths';
import type { AdminDashboardData } from '@/types/admin';

const number = new Intl.NumberFormat('vi-VN');
const date = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function DashboardOverview({ data }: { data: AdminDashboardData }) {
  const metrics: {
    key: string;
    label: string;
    value: number;
    note: string;
    icon: IconName;
    tone: string;
  }[] = [
    {
      key: 'anime',
      label: 'Tổng số anime',
      value: data.totalAnime,
      note: 'Trong danh mục mẫu',
      icon: 'play',
      tone: 'tw:text-[#b7a7ff] tw:bg-[#a697ff18]',
    },
    {
      key: 'episodes',
      label: 'Tập đã công bố',
      value: data.publishedEpisodes,
      note: 'Nội dung đã công bố',
      icon: 'check',
      tone: 'tw:text-[#75d6b3] tw:bg-[#75d6b318]',
    },
    {
      key: 'upcoming',
      label: 'Anime sắp ra mắt',
      value: data.upcomingAnime,
      note: 'Chưa có tập công bố',
      icon: 'history',
      tone: 'tw:text-[#eec787] tw:bg-[#eec78718]',
    },
    {
      key: 'missing-video',
      label: 'Tập chưa có video',
      value: data.episodesWithoutVideo,
      note: 'Cần bổ sung nguồn phát',
      icon: 'close',
      tone: 'tw:text-[#e9a1b4] tw:bg-[#e9a1b418]',
    },
  ];
  return (
    <div className="tw:grid tw:gap-6" data-admin-dashboard="ready">
      <section
        className="tw:grid tw:grid-cols-4 tw:gap-4 tw:max-desktop:grid-cols-2 tw:max-phone:grid-cols-1"
        aria-label="Số liệu tổng quan"
      >
        {metrics.map((metric) => (
          <article key={metric.key} className="aw-surface tw:p-5 tw:rounded-xl tw:min-w-0">
            <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:mb-5">
              <h2 className="tw:text-body tw:font-medium tw:text-[var(--aw-muted)] tw:m-0">
                {metric.label}
              </h2>
              <span
                className={`tw:inline-flex tw:items-center tw:justify-center tw:rounded-lg tw:w-9 tw:h-9 tw:shrink-0 ${metric.tone}`}
              >
                <Icon name={metric.icon} />
              </span>
            </div>
            <p className="tw:text-3xl tw:font-semibold tw:mb-2" data-metric={metric.key}>
              {number.format(metric.value)}
            </p>
            <p className="tw:text-[var(--aw-muted)] tw:mb-0">{metric.note}</p>
          </article>
        ))}
      </section>
      <div className="tw:grid tw:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] tw:gap-6 tw:max-tablet:grid-cols-1">
        <section
          className="aw-surface tw:p-6 tw:rounded-xl tw:min-w-0"
          aria-labelledby="admin-distribution-title"
        >
          <div className="tw:flex tw:justify-between tw:items-center tw:gap-3 tw:mb-6">
            <h2 id="admin-distribution-title" className="tw:text-lg tw:m-0">
              Trạng thái danh mục
            </h2>
            <span className="tw:text-[var(--aw-muted)]">
              {number.format(data.totalAnime)} anime
            </span>
          </div>
          <div className="tw:grid tw:gap-5">
            {data.statuses.map((item) => (
              <div key={item.status}>
                <div className="tw:flex tw:justify-between tw:gap-3 tw:mb-2">
                  <span>{item.label}</span>
                  <span className="tw:text-[var(--aw-muted)]">
                    {item.count} ·{' '}
                    {data.totalAnime ? Math.round((item.count / data.totalAnime) * 100) : 0}%
                  </span>
                </div>
                <progress
                  value={item.count}
                  max={Math.max(1, data.totalAnime)}
                  aria-label={item.label}
                  className="tw:block tw:w-full tw:h-2 tw:accent-[var(--aw-accent)]"
                />
              </div>
            ))}
          </div>
        </section>
        <section
          className="aw-surface tw:p-6 tw:rounded-xl tw:min-w-0"
          aria-labelledby="admin-health-title"
        >
          <h2 id="admin-health-title" className="tw:text-lg tw:mb-5">
            Tình trạng nội dung
          </h2>
          <dl className="tw:grid tw:gap-3 tw:mb-5">
            <div className="tw:flex tw:justify-between tw:gap-3">
              <dt className="tw:text-[var(--aw-muted)] tw:font-normal">Mùa / phần</dt>
              <dd className="tw:m-0 tw:font-semibold">{data.totalSeasons}</dd>
            </div>
            <div className="tw:flex tw:justify-between tw:gap-3">
              <dt className="tw:text-[var(--aw-muted)] tw:font-normal">Thể loại đang dùng</dt>
              <dd className="tw:m-0 tw:font-semibold">{data.totalGenres}</dd>
            </div>
            <div className="tw:flex tw:justify-between tw:gap-3">
              <dt className="tw:text-[var(--aw-muted)] tw:font-normal">Tập có nguồn phát</dt>
              <dd className="tw:m-0 tw:font-semibold">
                {data.publishedEpisodes - data.episodesWithoutVideo} / {data.publishedEpisodes}
              </dd>
            </div>
          </dl>
          <p className="tw:rounded-lg tw:bg-[#eec7870c] tw:border tw:border-[#eec78725] tw:text-[#eec787] tw:p-3 tw:mb-0">
            {data.episodesWithoutVideo
              ? 'Các tập hiện chỉ có thông tin, chưa có video để phát.'
              : 'Số liệu này chỉ phản ánh nội dung mẫu trong danh mục.'}
          </p>
        </section>
      </div>
      <section className="aw-surface tw:rounded-xl tw:min-w-0" aria-labelledby="admin-recent-title">
        <div className="tw:p-6 tw:flex tw:justify-between tw:items-center tw:gap-4 tw:flex-wrap">
          <div>
            <h2 id="admin-recent-title" className="tw:text-lg tw:mb-2">
              Phim cập nhật gần đây
            </h2>
            <p className="tw:text-[var(--aw-muted)] tw:mb-0">
              Theo thời gian công bố tập gần nhất trong dữ liệu mẫu.
            </p>
          </div>
          <Button
            as="link"
            variant="quiet"
            size="sm"
            to={paths.explore}
            label="Xem danh mục"
            endIcon={<Icon name="arrow-right" size="sm" />}
          />
        </div>
        <div
          className="tw:overflow-x-auto tw:rounded-b-xl"
          role="region"
          aria-label="Bảng phim gần đây"
          tabIndex={0}
        >
          <table className="tw:w-full tw:min-w-160 tw:text-body">
            <caption className="visually-hidden">
              Anime có tập công bố gần nhất; liên kết mở trang chi tiết công khai
            </caption>
            <thead className="tw:bg-[#ffffff03] tw:text-[var(--aw-muted)]">
              <tr>
                {['Tên phim', 'Định dạng', 'Tập công bố', 'Cập nhật', 'Chi tiết'].map((title) => (
                  <th
                    key={title}
                    scope="col"
                    className="tw:px-6 tw:py-3 tw:font-medium tw:whitespace-nowrap"
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recentAnime.map((item) => (
                <tr key={item.anime.id} className="tw:border-t tw:border-[var(--aw-border)]">
                  <th scope="row" className="tw:px-6 tw:py-4 tw:font-medium">
                    <div className="tw:flex tw:gap-3 tw:items-center">
                      <Artwork
                        src={item.anime.posterUrl}
                        alt=""
                        className="tw:w-10 tw:h-14 tw:object-cover tw:rounded-md"
                      />
                      <span className="tw:max-w-65">{item.anime.title}</span>
                    </div>
                  </th>
                  <td className="tw:px-6 tw:py-4 tw:whitespace-nowrap tw:text-[var(--aw-muted)]">
                    {item.anime.format === 'tv' ? 'TV series' : 'Điện ảnh'}
                  </td>
                  <td className="tw:px-6 tw:py-4">{item.episodeCount}</td>
                  <td className="tw:px-6 tw:py-4 tw:whitespace-nowrap tw:text-[var(--aw-muted)]">
                    {item.lastPublishedAt
                      ? date.format(new Date(item.lastPublishedAt))
                      : 'Chưa có tập'}
                  </td>
                  <td className="tw:px-6 tw:py-4">
                    <Link
                      to={paths.animeDetail(item.anime.slug)}
                      aria-label={`Xem chi tiết ${item.anime.title}`}
                      className="tw:text-[var(--aw-accent)]"
                    >
                      Xem <Icon name="arrow-right" size="sm" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="tw:text-[var(--aw-muted)] tw:mb-0 tw:text-center">
        Các thống kê được tính từ dữ liệu mẫu. Chưa phải số liệu vận hành của hệ thống.
      </p>
    </div>
  );
}
