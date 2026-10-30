import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ContentState } from '@/components/common/content-state';
import { DashboardOverview } from '@/features/admin-dashboard/components/dashboard-overview';
import { useAdminDashboard } from '@/features/admin-dashboard/hooks/use-admin-dashboard';

export function AdminDashboardPage() {
  const { data, loading, error, refresh } = useAdminDashboard();
  return (
    <>
      <header className="tw:flex tw:items-start tw:justify-between tw:gap-5 tw:flex-wrap tw:mb-7">
        <div>
          <p className="aw-eyebrow tw:mb-2">KHÔNG GIAN QUẢN TRỊ</p>
          <h1 className="tw:text-3xl tw:mb-3 tw:max-phone:text-2xl">Tổng quan quản trị</h1>
          <p className="tw:text-[var(--aw-muted)] tw:mb-0">
            Một góc nhìn chung về danh mục và tình trạng nội dung.
          </p>
        </div>
        <Button
          variant="quiet"
          label="Làm mới"
          loading={loading}
          onClick={refresh}
          startIcon={<Icon name="replay" size="sm" />}
        />
      </header>
      <section aria-label="Tổng quan Dashboard" aria-busy={loading}>
        {error ? (
          <ContentState title="Chưa tải được Dashboard" description={error} retry={refresh} />
        ) : loading ? (
          <div role="status" aria-label="Đang tải Dashboard">
            <div className="tw:grid tw:grid-cols-4 tw:gap-4 tw:max-desktop:grid-cols-2 tw:max-phone:grid-cols-1">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="aw-skeleton tw:h-44 tw:rounded-xl" />
              ))}
            </div>
            <p className="tw:mt-4 tw:text-[var(--aw-muted)]">Đang tổng hợp dữ liệu…</p>
          </div>
        ) : data?.totalAnime ? (
          <DashboardOverview data={data} />
        ) : (
          <ContentState
            title="Chưa có dữ liệu tổng quan"
            description="Danh mục mẫu hiện chưa có nội dung để thống kê."
            retry={refresh}
          />
        )}
      </section>
    </>
  );
}
