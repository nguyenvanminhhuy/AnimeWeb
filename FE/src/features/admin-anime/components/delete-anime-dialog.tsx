import { useLayoutEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { adminAnimeRepository } from '@/lib/api/repositories';
import type { AdminAnimeRow } from '@/types/admin-anime';
import type { AdminPreviewSession } from '@/types/admin';
import { useAdminAnimeMutation } from '@/features/admin-anime/hooks/use-admin-anime-mutation';
import { paths } from '@/config/paths';

export function DeleteAnimeDialog({
  row,
  session,
  fail,
  onClose,
  onDeleted,
  onRefresh,
  returnTo,
}: {
  row: AdminAnimeRow;
  session: AdminPreviewSession;
  fail: boolean;
  onClose: () => void;
  onDeleted: () => void;
  onRefresh: () => void;
  returnTo: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const failOnce = useRef(fail);
  const { run, pending, error, failure } = useAdminAnimeMutation();
  const published = row.publicationStatus === 'published' || failure?.code === 'ANIME_PUBLISHED';
  const inUse = row.publishedEpisodes > 0 || failure?.code === 'ANIME_IN_USE';
  const reloadRequired =
    failure?.status === 404 ||
    (failure?.status === 409 && !['ANIME_PUBLISHED', 'ANIME_IN_USE'].includes(failure.code));
  useLayoutEffect(() => {
    const element = dialog.current!;
    const previous = document.activeElement;
    element.showModal();
    cancel.current?.focus();
    return () => {
      element.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
      else document.getElementById('admin-anime-results')?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-labelledby="delete-anime-title"
      aria-describedby="delete-anime-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) {
          dialog.current?.close();
          onClose();
        }
      }}
      className="tw:fixed tw:inset-0 tw:m-auto tw:w-[calc(100vw-2rem)] tw:max-w-120 tw:max-h-[calc(100dvh-2rem)] tw:overflow-y-auto tw:rounded-2xl tw:border tw:border-[var(--aw-border)] tw:bg-[#141925] tw:text-[var(--aw-text)] tw:p-6 tw:backdrop:bg-black/70"
    >
      <h2 id="delete-anime-title" className="tw:text-2xl">
        Xoá phim?
      </h2>
      <p id="delete-anime-description" className="tw:break-words">
        Xoá vĩnh viễn “{row.anime.title}”. Không thể hoàn tác. Chỉ xoá được phim ở bản nháp và không
        còn dữ liệu liên quan.
      </p>
      {(published || inUse) && (
        <p className="tw:text-[#f1cd8a]">
          {published
            ? 'Phim đang được công bố. Chuyển về bản nháp trước khi xoá.'
            : 'Phim còn tập hoặc dữ liệu liên quan nên chưa thể xoá. Dữ liệu liên quan được giữ nguyên.'}
        </p>
      )}
      {error && (
        <p role="alert" className="tw:text-[#edacbc]">
          {error.message}
        </p>
      )}
      <div className="tw:flex tw:justify-end tw:gap-3 tw:mt-6 tw:flex-wrap">
        <Button ref={cancel} variant="quiet" disabled={pending} label="Huỷ" onClick={onClose} />
        {published && (
          <Button
            as="link"
            variant="quiet"
            to={paths.adminAnimeEdit(row.anime.id, returnTo)}
            label="Chỉnh sửa phim"
          />
        )}
        {reloadRequired ? (
          <Button label="Tải lại danh sách" onClick={onRefresh} />
        ) : (
          <Button
            label={pending ? 'Đang xoá…' : 'Xác nhận xoá'}
            loading={pending}
            disabled={published || inUse || failure?.status === 403}
            onClick={() => {
              const shouldFail = failOnce.current;
              failOnce.current = false;
              void run(
                (signal) =>
                  adminAnimeRepository.remove(
                    row.anime.id,
                    row.version,
                    signal,
                    session,
                    shouldFail,
                  ),
                onDeleted,
              );
            }}
          />
        )}
      </div>
    </dialog>
  );
}
