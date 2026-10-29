import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { Link, useSearchParams } from 'react-router-dom';
import type { AuthMode } from '../auth.types';
import { useSession } from '../SessionProvider';
import { paths, safeReturnTo } from '../../../routes/paths';
import { Artwork } from '../../../components/common/Artwork';
import { AuthForm } from './AuthForm';

export function AuthScreen({ mode }: { mode: AuthMode }) {
  const [params] = useSearchParams();
  const returnTo = safeReturnTo(params.get('returnTo'));
  const { user, displayName, logout } = useSession();
  const register = mode === 'register';
  return (
    <div className="aw-shell aw-auth tw:mx-auto tw:pt-6.25 tw:max-mobile:pt-5">
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
            ✦ TÀI KHOẢN DEMO
          </span>
          <h1 id={`${mode}-title`}>
            {register ? 'Tạo tài khoản demo' : 'Chào mừng đến Anime Web'}
          </h1>
          <p className="aw-auth-intro tw:text-body tw:leading-[1.8] tw:mb-6">
            {register
              ? 'Một hồ sơ riêng cho những câu chuyện bạn muốn giữ lại.'
              : 'Đăng nhập để mở thư viện và tiếp tục câu chuyện của bạn.'}
          </p>
          <div className="aw-auth-demo-note tw:px-3.5 tw:py-2.75 tw:mb-6 tw:text-body tw:leading-[1.7]">
            <strong>Đây là bản mô phỏng, chưa có xác thực thật.</strong>
            <p>
              Chỉ dùng thông tin giả. Mật khẩu chỉ kiểm tra form, không xác thực, không lưu và không
              gửi đi.
            </p>
          </div>
          {user ? (
            <div className="aw-auth-success tw:px-5 tw:py-7 tw:my-6 tw:rounded-[10px] tw:text-center">
              <span aria-hidden="true">
                <Icon name="check" size="lg" />
              </span>
              <h2>Phiên demo đã sẵn sàng</h2>
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
                label="Đổi tài khoản demo"
              />
            </div>
          ) : (
            <AuthForm key={mode} mode={mode} />
          )}
          <p className="aw-auth-switch tw:mx-0 tw:text-body tw:text-center tw:mt-6 tw:mb-0 tw:leading-[1.8]">
            {register ? 'Đã có hồ sơ demo?' : 'Chưa có hồ sơ demo?'}{' '}
            <Link to={register ? paths.loginTo(returnTo) : paths.registerTo(returnTo)}>
              {register ? 'Đăng nhập' : 'Đăng ký ngay'} <Icon name="external-link" size="sm" />
            </Link>
          </p>
        </section>
      </div>
      <p className="aw-auth-bottom-note tw:mx-auto tw:text-body tw:text-center tw:mt-5 tw:mb-0 tw:leading-[1.8]">
        Hồ sơ và thư viện demo chỉ thuộc trình duyệt hiện tại. Chưa hỗ trợ khôi phục mật khẩu hoặc
        đăng nhập mạng xã hội.
      </p>
    </div>
  );
}
