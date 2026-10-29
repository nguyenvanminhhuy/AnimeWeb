import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
export function DestinationPage() {
  return (
    <section className="aw-shell tw:mx-auto">
      <div className="aw-state aw-surface tw:px-6 tw:py-16 tw:mx-auto tw:my-12 tw:rounded-[16px] tw:text-center tw:max-w-210">
        <span className="aw-eyebrow">ANIME WEB · DEMO</span>
        <h1>Không tìm thấy trang</h1>
        <p>Đường dẫn này không tồn tại trong ứng dụng.</p>
        <Button
          as="link"
          variant="primary"
          to={paths.home}
          startIcon={<Icon name="arrow-left" size="sm" />}
          label="Về Trang chủ"
        />
      </div>
    </section>
  );
}
