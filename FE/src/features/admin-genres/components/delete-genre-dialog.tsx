import { useLayoutEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { adminGenreRepository } from '@/lib/api/repositories';
import type { AdminGenreRow } from '@/types/admin-genre';
import type { AdminPreviewSession } from '@/types/admin';
import { useGenreMutation } from '@/features/admin-genres/hooks/use-genre-mutation';

export function DeleteGenreDialog({
  row,
  session,
  fail,
  onClose,
  onDeleted,
}: {
  row: AdminGenreRow;
  session: AdminPreviewSession;
  fail: boolean;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const failOnce = useRef(fail);
  const { run, pending, error } = useGenreMutation();
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
      aria-labelledby="delete-genre-title"
      aria-describedby="delete-genre-description"
      className="tw:fixed tw:inset-0 tw:m-auto tw:w-[calc(100vw-2rem)] tw:max-w-120 tw:max-h-[calc(100dvh-2rem)] tw:overflow-y-auto tw:rounded-2xl tw:border tw:border-[var(--aw-border)] tw:bg-[#141925] tw:text-[var(--aw-text)] tw:p-6 tw:backdrop:bg-black/70"
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) {
          dialog.current?.close();
          onClose();
        }
      }}
    >
      <h2 id="delete-genre-title" className="tw:text-2xl">
        Xoá thể loại?
      </h2>
      <p id="delete-genre-description" className="tw:break-words">
        Xoá “{row.name}” khỏi phiên quản trị mẫu. Không thể hoàn tác trong phiên này. Danh mục công
        khai không thay đổi.
      </p>
      {row.animeCount > 0 && (
        <p className="tw:text-[#f1cd8a]">
          Thể loại đang được {row.animeCount} phim sử dụng nên không thể xoá.
        </p>
      )}
      {error && (
        <p role="alert" className="tw:text-[#edacbc]">
          {error.message}
        </p>
      )}
      <div className="tw:flex tw:gap-3 tw:justify-end tw:flex-wrap tw:mt-6">
        <Button ref={cancel} variant="quiet" disabled={pending} label="Huỷ" onClick={onClose} />
        <Button
          label={pending ? 'Đang xoá…' : 'Xác nhận xoá'}
          loading={pending}
          onClick={() => {
            const shouldFail = failOnce.current;
            failOnce.current = false;
            void run(
              (signal) => adminGenreRepository.remove(row.id, signal, session, shouldFail),
              onDeleted,
            );
          }}
        />
      </div>
    </dialog>
  );
}
