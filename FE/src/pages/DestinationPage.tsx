import { Link } from 'react-router-dom';
import { paths } from '../routes/paths';
export function DestinationPage({ kind }: { kind: 'watch' | 'not-found' }) {
  const title = kind === 'watch' ? 'Xem anime' : 'Không tìm thấy trang';
  return (
    <section className="aw-shell">
      <div className="aw-state aw-surface">
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
        <Link className="btn aw-btn-primary" to={paths.home}>
          ← Về Trang chủ
        </Link>
      </div>
    </section>
  );
}
