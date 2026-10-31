import { useLayoutEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { adminEpisodeRepository } from '@/lib/api/repositories';
import type { AdminPreviewSession } from '@/types/admin';

export function DeleteMetadataDialog({
  target,
  session,
  fail,
  onClose,
  onDeleted,
}: {
  target: { kind: 'season' | 'episode'; id: string; title: string };
  session: AdminPreviewSession;
  fail?: boolean;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const request = useRef<AbortController | null>(null);
  const failed = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  useLayoutEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = dialog.current;
    element?.showModal();
    cancel.current?.focus();
    return () => {
      request.current?.abort();
      element?.close();
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  async function remove() {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    setError('');
    try {
      const shouldFail = Boolean(fail && !failed.current);
      failed.current = true;
      await adminEpisodeRepository.remove(
        target.kind,
        target.id,
        controller.signal,
        session,
        shouldFail,
      );
      if (!controller.signal.aborted) onDeleted();
    } catch (reason) {
      if (!controller.signal.aborted)
        setError(reason instanceof Error ? reason.message : 'Không thể xoá.');
    } finally {
      if (!controller.signal.aborted) {
        setPending(false);
        request.current = null;
      }
    }
  }
  return (
    <dialog
      ref={dialog}
      aria-labelledby="delete-metadata-title"
      aria-describedby="delete-metadata-description"
      onCancel={(e) => {
        e.preventDefault();
        if (!pending) onClose();
      }}
      className="aw-surface tw:text-[var(--aw-text)] tw:rounded-2xl tw:p-6 tw:w-[min(480px,calc(100%-32px))] tw:border tw:border-[var(--aw-border)] tw:backdrop:bg-black/70"
    >
      <h2 id="delete-metadata-title" className="tw:text-xl">
        Xoá {target.kind === 'season' ? 'mùa/phần' : 'tập phim'}?
      </h2>
      <p id="delete-metadata-description">
        “{target.title}” sẽ bị xoá khỏi phiên mẫu. Không thể hoàn tác. Mùa còn tập và tập đã công bố
        sẽ bị chặn; không xoá dây chuyền hoặc lịch sử xem.
      </p>
      {error && (
        <p role="alert" className="tw:text-[#ffb4bc]">
          {error}
        </p>
      )}
      <div className="tw:flex tw:gap-3 tw:flex-wrap">
        <Button ref={cancel} label="Huỷ" variant="quiet" disabled={pending} onClick={onClose} />
        <Button label="Xác nhận xoá" loading={pending} onClick={remove} />
      </div>
    </dialog>
  );
}
