import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Artwork } from '@/components/common/artwork';

interface ProfileOverviewProps {
  displayName: string;
  email: string;
  stats: { label: string; value: number; to: string }[];
  libraryTo: string;
  historyTo: string;
}

export function ProfileOverview({
  displayName,
  email,
  stats,
  libraryTo,
  historyTo,
}: ProfileOverviewProps) {
  return (
    <>
      <section
        className="aw-surface tw:relative tw:isolate tw:overflow-hidden tw:rounded-2xl tw:p-8 tw:max-phone:p-5"
        aria-label="Tóm tắt hồ sơ"
      >
        <Artwork
          src="/images/hero.svg"
          alt=""
          eager
          className="tw:absolute tw:inset-0 tw:z-[-2] tw:w-full tw:h-full tw:object-cover tw:opacity-15"
        />
        <div className="tw:absolute tw:inset-0 tw:z-[-1] tw:bg-[#141925b3]" />
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-6 tw:flex-wrap">
          <div className="tw:flex tw:items-center tw:gap-5 tw:min-w-0 tw:max-phone:flex-col tw:max-phone:items-start">
            <Avatar name={displayName} size="lg" />
            <div className="tw:min-w-0">
              <p className="tw:text-[var(--aw-accent)] tw:mb-2 tw:font-medium">
                Thành viên Anime Web
              </p>
              <h2 className="tw:text-2xl tw:mb-2 tw:break-words">{displayName}</h2>
              <p className="tw:text-[var(--aw-muted)] tw:mb-0 tw:break-all">{email}</p>
            </div>
          </div>
          <div className="tw:flex tw:flex-wrap tw:gap-3">
            <Button
              as="link"
              to={libraryTo}
              label="Mở thư viện của tôi"
              startIcon={<Icon name="heart" size="sm" />}
            />
            <Button
              as="link"
              to={historyTo}
              variant="glass"
              label="Lịch sử xem"
              startIcon={<Icon name="history" size="sm" />}
            />
          </div>
        </div>
      </section>
      {stats.length > 0 && (
        <section
          aria-label="Thống kê thư viện cá nhân"
          className="tw:grid tw:grid-cols-4 tw:gap-4 tw:mt-6 tw:max-tablet:grid-cols-2 tw:max-phone:gap-3"
        >
          {stats.map((stat) => (
            <Link
              key={stat.label}
              to={stat.to}
              className="aw-surface tw:rounded-xl tw:p-5 tw:max-phone:p-4 tw:block tw:hover:border-[var(--aw-accent)]"
            >
              <span className="tw:block tw:text-[var(--aw-muted)] tw:mb-3">{stat.label}</span>
              <span className="tw:block tw:text-3xl tw:font-semibold tw:text-[var(--aw-text)]">
                {stat.value}
              </span>
            </Link>
          ))}
        </section>
      )}
    </>
  );
}

export function ProfileInfo({
  displayName,
  email,
  changePasswordTo,
}: Pick<ProfileOverviewProps, 'displayName' | 'email'> & { changePasswordTo: string }) {
  return (
    <section
      className="aw-surface tw:rounded-xl tw:p-6 tw:self-start"
      aria-labelledby="profile-info-title"
    >
      <h2 id="profile-info-title" className="tw:text-xl tw:mb-6">
        Thông tin tài khoản
      </h2>
      <dl className="tw:grid tw:gap-5 tw:mb-6">
        <div>
          <dt className="tw:text-[var(--aw-muted)] tw:font-normal tw:mb-2">Tên hiển thị</dt>
          <dd className="tw:mb-0 tw:break-words">{displayName}</dd>
        </div>
        <div>
          <dt className="tw:text-[var(--aw-muted)] tw:font-normal tw:mb-2">Email</dt>
          <dd className="tw:mb-0 tw:break-all">{email}</dd>
        </div>
        <div>
          <dt className="tw:text-[var(--aw-muted)] tw:font-normal tw:mb-2">Loại tài khoản</dt>
          <dd className="tw:mb-0">Thành viên</dd>
        </div>
      </dl>
      <p className="tw:p-3 tw:rounded-lg tw:bg-[#a697ff0c] tw:text-[var(--aw-muted)] tw:mb-0 tw:leading-relaxed">
        Hồ sơ mẫu và thư viện chỉ thuộc trình duyệt hiện tại. Thông tin đang được hiển thị ở chế độ
        chỉ đọc.
      </p>
      <Button
        as="link"
        to={changePasswordTo}
        variant="quiet"
        label="Đổi mật khẩu"
        className="tw:mt-4"
      />
    </section>
  );
}
