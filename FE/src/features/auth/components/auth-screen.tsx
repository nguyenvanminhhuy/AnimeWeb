import { isMockApi } from '@/config/api';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Link, useSearchParams } from 'react-router-dom';
import type { AuthMode } from '@/features/auth/types/auth';
import { useSession } from '@/stores/session';
import { paths, safeReturnTo } from '@/config/paths';
import { Artwork } from '@/components/common/artwork';
import { AuthForm } from '@/features/auth/components/auth-form';

export function AuthScreen({ mode }: { mode: AuthMode }) {
  const [params] = useSearchParams();
  const returnTo = safeReturnTo(params.get('returnTo'));
  const { user, displayName, logout, adminPreview, openAdminPreview, notice } = useSession();
  const requestedPath = returnTo.split(/[?#]/, 1)[0];
  const adminRequested =
    requestedPath === paths.admin || requestedPath.startsWith(paths.admin + '/');
  const register = mode === 'register';
  return (
    <div className="aw-shell aw-auth tw:mx-auto tw:pt-6.25 tw:max-mobile:pt-5">
      {notice && <p role="status">{notice}</p>}
      <Link className="aw-auth-back tw:text-body" to={paths.home}>
        <Icon name="arrow-left" size="sm" /> Về Trang chủ
      </Link>
      <div className="aw-auth-grid tw:grid tw:grid-cols-[1fr_1fr] tw:mt-6 tw:rounded-[16px] tw:overflow-hidden tw:max-mobile:grid-cols-[1fr] tw:max-mobile:mt-5">
        <aside
          className="aw-auth-art tw:p-9.5 tw:relative tw:isolate tw:min-w-0 tw:min-h-175 tw:flex tw:flex-col tw:justify-between tw:max-desktop:p-7.5 tw:max-mobile:hidden"
          aria-label="Chào mừng đến thế giới Anime Web"
        >
          <Artwork src="/images/hero.svg" alt="Minh họa người lữ hành dưới bầu trời sao" eager />
          <div className="aw-auth-art-shade tw:absolute tw:inset-0 tw:z-[-2]" />
          <div className="aw-auth-art-brand tw:text-body">
            <span aria-hidden="true">✦</span> ANIME WEB
          </div>
          <div className="aw-auth-art-copy">
            <span className="aw-eyebrow">YOUR NEXT STORY STARTS HERE</span>
            <h2>
              {register ? (
                <>
                  Thế giới mới.
                  <br />
                  Câu chuyện của bạn.
                </>
              ) : (
                <>
                  Mỗi lần trở lại,
                  <br />
                  một câu chuyện mới.
                </>
              )}
            </h2>
            <p>
              Lưu những điều yêu thích.
              <br />
              Tiếp nối hành trình còn dang dở.
            </p>
            <span className="aw-auth-art-caption tw:text-body">
              MỘT GÓC NHỎ CHO NGƯỜI YÊU ANIME
            </span>
          </div>
        </aside>
        <section
          className="aw-auth-panel tw:px-11.5 tw:py-10.5 tw:min-w-0 tw:max-desktop:px-7 tw:max-desktop:py-8.5 tw:max-mobile:px-6 tw:max-mobile:py-7.5"
          aria-labelledby={`${mode}-title`}
        >
          <span className="aw-auth-badge tw:inline-block tw:text-body tw:mb-4.5">
            ✦ {isMockApi ? 'TÀI KHOẢN DEMO' : 'TÀI KHOẢN'}
          </span>
          <h1 id={`${mode}-title`}>
            {register
              ? isMockApi
                ? 'Tạo tài khoản demo'
                : 'Tạo tài khoản'
              : 'Chào mừng đến Anime Web'}
          </h1>
          <p className="aw-auth-intro tw:text-body tw:leading-[1.8] tw:mb-6">
            {register
              ? 'Một hồ sơ riêng cho những câu chuyện bạn muốn giữ lại.'
              : 'Đăng nhập để mở thư viện và tiếp tục câu chuyện của bạn.'}
          </p>
          {isMockApi && (
            <div className="aw-auth-demo-note tw:px-3.5 tw:py-2.75 tw:mb-6 tw:text-body tw:leading-[1.7]">
              <strong>Đây là bản mô phỏng, chưa có xác thực thật.</strong>
              <p>
                Chỉ dùng thông tin giả. Mật khẩu chỉ kiểm tra form, không xác thực, không lưu và
                không gửi đi.
              </p>
            </div>
          )}
          {user || (adminPreview && adminRequested) ? (
            <div className="aw-auth-success tw:px-5 tw:py-7 tw:my-6 tw:rounded-[10px] tw:text-center">
              <span aria-hidden="true">
                <Icon name="check" size="lg" />
              </span>
              <h2>{isMockApi ? 'Phiên demo đã sẵn sàng' : 'Đăng nhập thành công'}</h2>
              <p>
                Bạn đang dùng hồ sơ <strong>{displayName}</strong>.
              </p>
              <Button
                as="link"
                variant="primary"
                to={returnTo}
                label="Tiếp tục về trang đã yêu cầu"
                endIcon={<Icon name="arrow-right" size="sm" />}
              />
              <Button
                variant="unstyled"
                className="aw-text-link tw:text-body tw:whitespace-nowrap"
                onClick={logout}
                label="Đổi tài khoản"
              />
            </div>
          ) : (
            <>
              <AuthForm key={mode} mode={mode} />
              {isMockApi && !register && adminRequested && (
                <div className="tw:mt-6 tw:border-t tw:border-[var(--aw-border)] tw:pt-5">
                  <p className="tw:text-[var(--aw-muted)]">
                    Phiên quản trị mẫu chỉ để xem giao diện trong dev; không lưu sau khi tải lại.
                  </p>
                  <Button
                    variant="glass"
                    className="tw:w-full"
                    onClick={() => openAdminPreview()}
                    label="Dùng phiên quản trị mẫu"
                  />
                  <Button
                    variant="quiet"
                    className="tw:w-full tw:mt-3"
                    onClick={() => openAdminPreview(true)}
                    label="Dùng phiên quản trị có quyền chỉnh sửa"
                  />
                </div>
              )}
            </>
          )}
          <p className="aw-auth-switch tw:mx-0 tw:text-body tw:text-center tw:mt-6 tw:mb-0 tw:leading-[1.8]">
            {register ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
            <Link to={register ? paths.loginTo(returnTo) : paths.registerTo(returnTo)}>
              {register ? 'Đăng nhập' : 'Đăng ký ngay'} <Icon name="external-link" size="sm" />
            </Link>
          </p>
        </section>
      </div>
      <p className="aw-auth-bottom-note tw:mx-auto tw:text-body tw:text-center tw:mt-5 tw:mb-0 tw:leading-[1.8]">
        {isMockApi
          ? 'Hồ sơ và thư viện demo chỉ thuộc trình duyệt hiện tại.'
          : 'Hồ sơ và thư viện được lưu trên máy chủ.'}{' '}
        Chưa hỗ trợ khôi phục mật khẩu hoặc đăng nhập mạng xã hội.
      </p>
    </div>
  );
}
