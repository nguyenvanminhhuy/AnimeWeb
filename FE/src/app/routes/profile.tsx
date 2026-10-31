import { Button } from '@/components/ui/button';
import { useSession } from '@/stores/session';
import { paths } from '@/config/paths';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/icon';
import { ContentState } from '@/components/common/content-state';
import { AnimeCard } from '@/components/anime/anime-card';
import { ContinueWatching } from '@/features/anime/components/continue-watching';
import { ProfileInfo, ProfileOverview } from '@/features/profile/components/profile-overview';
import { useProfileLibrary } from '@/features/profile/hooks/use-profile-library';
import { libraryHref } from '@/features/library/utils/library-query';
import type { LibraryTab } from '@/features/library/types/library';
import { isCompleted } from '@/utils/progress';

export function ProfilePage() {
  const { user } = useSession();
  if (!user)
    return (
      <section className="aw-shell tw:mx-auto tw:py-12">
        <h1 className="tw:text-2xl">Đăng nhập để xem trang cá nhân</h1>
        <p className="tw:text-(--aw-muted)">
          Thông tin cá nhân chỉ hiển thị cho tài khoản đang đăng nhập.
        </p>
        <Button as="link" to={paths.loginTo(paths.profile)} label="Đăng nhập" />
      </section>
    );
  return <ProfileContent key={user} />;
}

function ProfileContent() {
  const { displayName, email, favorites, progress } = useSession();
  const { data, loading, error, canRead, retry } = useProfileLibrary();
  const toLibrary = (tab: LibraryTab) => libraryHref({ tab, q: '', sort: 'recent', page: 1 });
  const completed = progress.filter(isCompleted).length;
  const favoriteAnime = data.filter((anime) => favorites.includes(anime.id)).slice(0, 4);
  const stats = [
    { label: 'Phim yêu thích', value: favorites.length, to: toLibrary('favorites') },
    { label: 'Tập đang xem', value: progress.length - completed, to: toLibrary('watching') },
    { label: 'Tập đã xem xong', value: completed, to: toLibrary('history') },
    { label: 'Tập có lịch sử', value: progress.length, to: toLibrary('history') },
  ];
  return (
    <div className="aw-shell aw-profile tw:mx-auto tw:py-8 tw:max-phone:py-6">
      <nav aria-label="Đường dẫn" className="tw:flex tw:gap-3 tw:mb-6 tw:text-[var(--aw-muted)]">
        <Link to={paths.home}>Trang chủ</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Trang cá nhân</span>
      </nav>
      <header className="tw:mb-7">
        <p className="aw-eyebrow tw:mb-2">KHÔNG GIAN CỦA RIÊNG BẠN</p>
        <h1 className="tw:text-3xl tw:mb-3">Trang cá nhân</h1>
        <p className="tw:text-(--aw-muted) tw:mb-0">
          Những câu chuyện yêu thích và hành trình xem của bạn, ở cùng một nơi.
        </p>
      </header>
      <ProfileOverview
        displayName={displayName}
        email={email}
        stats={canRead ? stats : []}
        libraryTo={paths.library}
        historyTo={toLibrary('history')}
      />
      <div className="tw:grid tw:grid-cols-[300px_minmax(0,1fr)] tw:gap-6 tw:mt-8 tw:max-tablet:grid-cols-1">
        <ProfileInfo
          displayName={displayName}
          email={email}
          changePasswordTo={paths.changePassword}
        />
        <section aria-label="Nội dung thư viện cá nhân" aria-busy={loading} className="tw:min-w-0">
          {!canRead ? (
            <ContentState
              title="Bạn chưa có quyền xem thư viện"
              description="Phiên hiện tại chưa được phép đọc dữ liệu cá nhân này."
            />
          ) : error ? (
            <ContentState title="Thư viện tạm thời gián đoạn" description={error} retry={retry} />
          ) : loading ? (
            <div role="status" aria-label="Đang tải hồ sơ">
              <div className="aw-skeleton tw:h-60 tw:rounded-xl" />
              <p className="tw:mt-4 tw:text-[var(--aw-muted)]">
                Đang tải những câu chuyện của bạn…
              </p>
            </div>
          ) : (
            <>
              <section
                aria-labelledby="profile-favorites-title"
                className="aw-surface tw:rounded-xl tw:p-6 tw:max-phone:p-4"
              >
                <div className="tw:flex tw:justify-between tw:items-center tw:gap-3 tw:flex-wrap tw:mb-5">
                  <h2 id="profile-favorites-title" className="tw:text-xl tw:m-0">
                    Phim yêu thích
                  </h2>
                  <Link
                    to={toLibrary('favorites')}
                    className="tw:text-[var(--aw-accent)] tw:inline-flex tw:items-center tw:gap-2"
                  >
                    Tất cả yêu thích <Icon name="arrow-right" size="sm" />
                  </Link>
                </div>
                {favoriteAnime.length ? (
                  <div className="tw:grid tw:grid-cols-4 tw:gap-4 tw:max-desktop:grid-cols-2">
                    {favoriteAnime.map((anime) => (
                      <AnimeCard key={anime.id} anime={anime} />
                    ))}
                  </div>
                ) : (
                  <div className="tw:py-7 tw:text-center">
                    <p className="tw:text-[var(--aw-muted)]">
                      Chưa có phim yêu thích để hiển thị. Tìm một câu chuyện bạn muốn giữ lại.
                    </p>
                    <Button as="link" variant="glass" to={paths.explore} label="Khám phá anime" />
                  </div>
                )}
              </section>
              <ContinueWatching items={data} />
              {!data.some((anime) =>
                progress.some((entry) => entry.animeId === anime.id && !isCompleted(entry)),
              ) && (
                <section className="aw-surface tw:rounded-xl tw:p-6 tw:mt-6">
                  <h2 className="tw:text-xl tw:mb-3">Tiếp tục xem</h2>
                  <p className="tw:text-[var(--aw-muted)] tw:mb-0">
                    Chưa có tập đang xem để tiếp tục.
                  </p>
                </section>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
