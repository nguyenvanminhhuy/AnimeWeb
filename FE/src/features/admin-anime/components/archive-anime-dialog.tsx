import { useLayoutEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { adminAnimeRepository } from '@/lib/api/repositories';
import { useAdminAnimeMutation } from '@/features/admin-anime/hooks/use-admin-anime-mutation';
import type { AdminAnimeRow } from '@/types/admin-anime';
import type { AdminPreviewSession } from '@/types/admin';

export function ArchiveAnimeDialog({
  row,
  session,
  onClose,
  onSaved,
  onRefresh,
}: {
  row: AdminAnimeRow;
  session: AdminPreviewSession;
  onClose: () => void;
  onSaved: () => void;
  onRefresh: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const mutation = useAdminAnimeMutation();
  const archived = row.publicationStatus === 'archived';
  const label = archived ? 'Khôi phục' : 'Lưu trữ';
  useLayoutEffect(() => {
    const previous = document.activeElement;
    const node = dialog.current!;
    node.showModal();
    cancel.current?.focus();
    return () => {
      node.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);
  const reload = mutation.failure?.status === 404 || mutation.failure?.status === 409;
  return (
    <dialog
      ref={dialog}
      aria-labelledby="archive-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!mutation.pending) onClose();
      }}
      className="tw:fixed tw:inset-0 tw:m-auto tw:w-[calc(100vw-2rem)] tw:max-w-120 tw:rounded-2xl tw:border tw:border-[var(--aw-border)] tw:bg-[#141925] tw:text-[var(--aw-text)] tw:p-6 tw:backdrop:bg-black/70"
    >
      <h2 id="archive-title">{label} phim?</h2>
      <p>
        “{row.anime.title}” —{' '}
        {archived
          ? 'Phim sẽ về bản nháp. Kiểm tra thông tin trước khi công bố lại.'
          : 'Phim sẽ ẩn khỏi danh mục và dừng phát. Tập phim, bình luận, yêu thích và lịch sử vẫn được giữ.'}
      </p>
      {mutation.error && <p role="alert">{mutation.error.message}</p>}
      <div className="tw:flex tw:justify-end tw:gap-3">
        <Button
          ref={cancel}
          variant="quiet"
          label="Huỷ"
          disabled={mutation.pending}
          onClick={onClose}
        />
        {reload ? (
          <Button label="Tải lại danh sách" onClick={onRefresh} />
        ) : (
          <Button
            label={`Xác nhận ${label.toLowerCase()}`}
            loading={mutation.pending}
            disabled={mutation.failure?.status === 403}
            onClick={() =>
              void mutation.run(
                (signal) =>
                  adminAnimeRepository.archive(
                    row.anime.id,
                    !archived,
                    row.version,
                    signal,
                    session,
                  ),
                onSaved,
              )
            }
          />
        )}
      </div>
    </dialog>
  );
}
