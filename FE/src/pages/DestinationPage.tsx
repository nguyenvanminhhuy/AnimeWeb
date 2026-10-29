import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { paths } from '../routes/paths';
export function DestinationPage({ kind }: { kind: 'watch' | 'not-found' }) {
  const title = kind === 'watch' ? 'Xem anime' : 'Không tìm thấy trang';
  return (
    <section className="aw-shell tw:mx-auto">
      <div className="aw-state aw-surface tw:px-6 tw:py-16 tw:mx-auto tw:my-12 tw:rounded-[16px] tw:text-center tw:max-w-210">
        <span className="aw-eyebrow">ANIME WEB · DEMO</span>
        <h1>{title}</h1>
        <p>
          {kind !== 'not-found'
            ? 'Màn hình này chưa được triển khai. Bạn đang xem bản demo giao diện Anime Web.'
            : 'Đường dẫn này không tồn tại trong ứng dụng.'}
        </p>
        {kind === 'watch' && (
          <p>Chưa có video demo. Lịch sử trên Trang chủ là dữ liệu mẫu, chưa có phát video.</p>
        )}
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
