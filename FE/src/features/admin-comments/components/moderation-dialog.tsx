import { useLayoutEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminCommentRepository } from '@/lib/api/repositories';
import type { AdminComment, ModerationAction } from '@/types/admin-comment';
import type { AdminPreviewSession } from '@/types/admin';
import { moderationReasonError } from '@/utils/admin-comment-validation';

export function ModerationDialog({
  comment,
  action,
  session,
  fail,
  onClose,
  onSaved,
}: {
  comment: AdminComment;
  action: ModerationAction;
  session: AdminPreviewSession;
  fail: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const failed = useRef(false);
  const [reason, setReason] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
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
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (request.current) return;
    const invalid = moderationReasonError(reason);
    setFieldError(invalid);
    if (invalid) {
      input.current?.focus();
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    setError('');
    try {
      const shouldFail = fail && !failed.current;
      failed.current = true;
      await adminCommentRepository.moderate(
        comment.id,
        action,
        reason,
        controller.signal,
        session,
        shouldFail,
      );
      if (!controller.signal.aborted) onSaved();
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(cause instanceof Error ? cause.message : 'Không thể kiểm duyệt bình luận.');
    } finally {
      if (!controller.signal.aborted) {
        request.current = null;
        setPending(false);
      }
    }
  }
  const verb = action === 'hide' ? 'Ẩn' : 'Hiện lại';
  return (
    <dialog
      ref={dialog}
      aria-labelledby="moderation-title"
      aria-describedby="moderation-description"
      onCancel={(e) => {
        e.preventDefault();
        if (!pending) onClose();
      }}
      className="aw-surface tw:text-[var(--aw-text)] tw:rounded-2xl tw:p-6 tw:w-[min(520px,calc(100%_-_32px))] tw:border tw:border-[var(--aw-border)] tw:backdrop:bg-black/70"
    >
      <form
        onSubmit={submit}
        noValidate
        aria-label="Xác nhận kiểm duyệt"
        className="tw:grid tw:gap-4"
      >
        <h2 id="moderation-title" className="tw:text-xl tw:mb-0">
          {verb} bình luận?
        </h2>
        <p id="moderation-description" className="tw:mb-0">
          Bình luận của {comment.authorName} sẽ{' '}
          {action === 'hide' ? 'chuyển từ hiển thị sang đã ẩn' : 'chuyển từ đã ẩn sang hiển thị'}{' '}
          trong phiên quản trị mẫu. Nội dung tác giả không đổi; dữ liệu trên trang phim công khai
          không thay đổi.
        </p>
        <div>
          <label htmlFor="moderation-reason">Lý do kiểm duyệt *</label>
          <Input
            id="moderation-reason"
            ref={input}
            required
            minLength={3}
            maxLength={300}
            value={reason}
            disabled={pending}
            aria-invalid={Boolean(fieldError)}
            aria-describedby={fieldError ? 'moderation-reason-error' : 'moderation-reason-help'}
            onChange={(e) => setReason(e.target.value)}
          />
          <p id="moderation-reason-help" className="tw:text-[var(--aw-muted)] tw:mt-2 tw:mb-0">
            Từ 3 đến 300 ký tự; chỉ lưu cùng lần kiểm duyệt gần nhất trong phiên mẫu.
          </p>
          {fieldError && (
            <p id="moderation-reason-error" role="alert" className="tw:text-[#ffb4bc] tw:mb-0">
              {fieldError}
            </p>
          )}
        </div>
        {error && (
          <p role="alert" className="tw:text-[#ffb4bc] tw:mb-0">
            {error}
          </p>
        )}
        <div className="tw:flex tw:gap-3 tw:flex-wrap">
          <Button ref={cancel} label="Huỷ" variant="quiet" disabled={pending} onClick={onClose} />
          <Button
            type="submit"
            label={`Xác nhận ${action === 'hide' ? 'ẩn' : 'hiện lại'}`}
            loading={pending}
          />
        </div>
      </form>
    </dialog>
  );
}
