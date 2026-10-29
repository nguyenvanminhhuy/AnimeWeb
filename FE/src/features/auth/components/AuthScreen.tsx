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
    <div className="aw-shell aw-auth">
      <Link className="aw-auth-back" to={paths.home}>
        ← Về Trang chủ
      </Link>
      <div className="aw-auth-grid">
        <aside className="aw-auth-art" aria-label="Chào mừng đến thế giới Anime Web">
          <Artwork src="/images/hero.svg" alt="Minh họa người lữ hành dưới bầu trời sao" eager />
          <div className="aw-auth-art-shade" />
          <div className="aw-auth-art-brand">
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
            <span className="aw-auth-art-caption">MỘT GÓC NHỎ CHO NGƯỜI YÊU ANIME</span>
          </div>
        </aside>
        <section className="aw-auth-panel" aria-labelledby={`${mode}-title`}>
          <span className="aw-auth-badge">✦ TÀI KHOẢN DEMO</span>
          <h1 id={`${mode}-title`}>
            {register ? 'Tạo tài khoản demo' : 'Chào mừng đến Anime Web'}
          </h1>
          <p className="aw-auth-intro">
            {register
              ? 'Một hồ sơ riêng cho những câu chuyện bạn muốn giữ lại.'
              : 'Đăng nhập để mở thư viện và tiếp tục câu chuyện của bạn.'}
          </p>
          <div className="aw-auth-demo-note">
            <strong>Đây là bản mô phỏng, chưa có xác thực thật.</strong>
            <p>
              Chỉ dùng thông tin giả. Mật khẩu chỉ kiểm tra form, không xác thực, không lưu và không
              gửi đi.
            </p>
          </div>
          {user ? (
            <div className="aw-auth-success">
              <span aria-hidden="true">✓</span>
              <h2>Phiên demo đã sẵn sàng</h2>
              <p>
                Bạn đang dùng hồ sơ <strong>{displayName}</strong>.
              </p>
              <Link className="btn aw-btn-primary" to={returnTo}>
                Tiếp tục về trang đã yêu cầu →
              </Link>
              <button className="aw-text-link" onClick={logout}>
                Đổi tài khoản demo
              </button>
            </div>
          ) : (
            <AuthForm key={mode} mode={mode} />
          )}
          <p className="aw-auth-switch">
            {register ? 'Đã có hồ sơ demo?' : 'Chưa có hồ sơ demo?'}{' '}
            <Link to={register ? paths.loginTo(returnTo) : paths.registerTo(returnTo)}>
              {register ? 'Đăng nhập' : 'Đăng ký ngay'} <span aria-hidden="true">↗</span>
            </Link>
          </p>
        </section>
      </div>
      <p className="aw-auth-bottom-note">
        Hồ sơ và thư viện demo chỉ thuộc trình duyệt hiện tại. Chưa hỗ trợ khôi phục mật khẩu hoặc
        đăng nhập mạng xã hội.
      </p>
    </div>
  );
}
