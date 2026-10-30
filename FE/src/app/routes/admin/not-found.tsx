import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';

export function AdminNotFoundPage() {
  return (
    <section className="aw-surface tw:rounded-xl tw:p-8 tw:text-center">
      <h1 className="tw:text-2xl">Không tìm thấy trang quản trị</h1>
      <p>Chức năng này chưa có trong ứng dụng.</p>
      <Button as="link" to={paths.admin} label="Về Dashboard" />
    </section>
  );
}
