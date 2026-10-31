import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSession } from '@/stores/session';
import { adminAnimeRepository } from '@/lib/api/repositories';
import { ContentState } from '@/components/common/content-state';
import { Button } from '@/components/ui/button';
import { AdminAnimeForm } from '@/features/admin-anime/components/admin-anime-form';
import { adminAnimeReturnTo } from '@/features/admin-anime/utils/admin-anime-return-to';
import type { AdminPreviewSession } from '@/types/admin';
import type { AdminAnimeRow } from '@/types/admin-anime';

export function AdminAnimeFormPage() {
  const { adminPreview, permissions } = useSession();
  const { animeId } = useParams();
  const location = useLocation();
  const [params] = useSearchParams();
  const returnTo = adminAnimeReturnTo(params.get('returnTo'));
  if (!import.meta.env.DEV || !adminPreview || !permissions.includes('admin:anime:write'))
    return (
      <>
        <h1 className="tw:text-2xl">Bạn chưa có quyền chỉnh sửa phim</h1>
        <p className="tw:text-[var(--aw-muted)]">
          Phiên chỉ đọc không được thêm hoặc thay đổi dữ liệu.
        </p>
        <Button as="link" to={returnTo} label="Về danh sách phim" />
      </>
    );
  return (
    <Editor
      key={`${adminPreview.id}:${animeId ?? 'new'}:${location.key}`}
      session={adminPreview}
      id={animeId}
      returnTo={returnTo}
    />
  );
}

function Editor({
  session,
  id,
  returnTo,
}: {
  session: AdminPreviewSession;
  id?: string;
  returnTo: string;
}) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<{ row: AdminAnimeRow | null; error: boolean } | null>(null);
  const mock = import.meta.env.DEV ? params.get('mock') : null;
  useEffect(() => {
    if (!id || mock === 'loading') return;
    const controller = new AbortController();
    setLoaded(null);
    adminAnimeRepository.get(id, controller.signal, session, mock === 'error').then(
      (row) => {
        if (!controller.signal.aborted) setLoaded({ row, error: false });
      },
      () => {
        if (!controller.signal.aborted) setLoaded({ row: null, error: true });
      },
    );
    return () => controller.abort();
  }, [id, session, mock, attempt]);
  const retry = () => {
    const next = new URLSearchParams(params);
    next.delete('mock');
    setParams(next, { replace: true });
    setAttempt((value) => value + 1);
  };
  return (
    <>
      <header className="tw:mb-7">
        <p className="aw-eyebrow">DANH MỤC NỘI DUNG</p>
        <h1 className="tw:text-3xl tw:max-phone:text-2xl">{id ? 'Sửa phim' : 'Thêm phim'}</h1>
        <p className="tw:mb-0 tw:text-[var(--aw-muted)]">Nhập thông tin và hình ảnh của phim.</p>
      </header>
      {id && !loaded ? (
        <p role="status">Đang tải thông tin phim…</p>
      ) : loaded?.error ? (
        <ContentState
          title="Chưa tải được thông tin phim"
          description="Vui lòng thử lại."
          retry={retry}
        />
      ) : id && !loaded?.row ? (
        <>
          <ContentState
            title="Không tìm thấy phim"
            description="Phim không tồn tại hoặc đã bị xoá trong phiên mẫu."
          />
          <Button as="link" to={returnTo} label="Về danh sách phim" />
        </>
      ) : (
        <AdminAnimeForm
          row={loaded?.row ?? null}
          session={session}
          returnTo={returnTo}
          fail={mock === 'save-error'}
          onSaved={() =>
            navigate(returnTo, {
              state: {
                adminAnimeNotice: id
                  ? 'Đã lưu thay đổi phim trong phiên mẫu.'
                  : 'Đã thêm phim trong phiên mẫu.',
              },
            })
          }
        />
      )}
    </>
  );
}
