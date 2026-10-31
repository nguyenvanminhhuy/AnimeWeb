import { useLayoutEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { adminAnimeRepository } from '@/lib/api/repositories';
import type { AdminAnimeRow } from '@/types/admin-anime';
import type { AdminPreviewSession } from '@/types/admin';
import { useAdminAnimeMutation } from '@/features/admin-anime/hooks/use-admin-anime-mutation';

export function DeleteAnimeDialog({
  row,
  session,
  fail,
  onClose,
  onDeleted,
}: {
  row: AdminAnimeRow;
  session: AdminPreviewSession;
  fail: boolean;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const failOnce = useRef(fail);
  const { run, pending, error } = useAdminAnimeMutation();
  useLayoutEffect(() => {
    const element = dialog.current!;
    const previous = document.activeElement;
    element.showModal();
    cancel.current?.focus();
    return () => {
      element.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
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
        Xoá “{row.anime.title}” khỏi dữ liệu của phiên quản trị mẫu. Không thể hoàn tác trong phiên
        này. Danh mục công khai và thư viện cá nhân không thay đổi.
      </p>
      {row.publishedEpisodes > 0 && (
        <p className="tw:text-[#f1cd8a]">
          Phim đã có tập công khai nên không thể xoá. Dữ liệu tập phim sẽ được giữ nguyên.
        </p>
      )}
      {error && (
        <p role="alert" className="tw:text-[#edacbc]">
          {error.message}
        </p>
      )}
      <div className="tw:flex tw:justify-end tw:gap-3 tw:mt-6 tw:flex-wrap">
        <Button ref={cancel} variant="quiet" disabled={pending} label="Huỷ" onClick={onClose} />
        <Button
          label={pending ? 'Đang xoá…' : 'Xác nhận xoá'}
          loading={pending}
          onClick={() => {
            const shouldFail = failOnce.current;
            failOnce.current = false;
            void run(
              (signal) => adminAnimeRepository.remove(row.anime.id, signal, session, shouldFail),
              onDeleted,
            );
          }}
        />
      </div>
    </dialog>
  );
}
