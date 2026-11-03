import { useLayoutEffect, useRef, useState } from 'react';
import { Selectbox } from '@/components/ui/selectbox';
import { userRoleLabels } from '@/features/admin-users/utils/user-labels';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/backend/error';
import { adminUserRepository } from '@/lib/api/repositories';
import type { AdminUser } from '@/types/admin-user';
import type { AdminPreviewSession } from '@/types/admin';

export function UserAccessDialog({
  kind,
  user,
  session,
  onClose,
  onChanged,
  onRefresh,
}: {
  kind: 'status' | 'role';
  user: AdminUser;
  session: AdminPreviewSession;
  onClose: () => void;
  onChanged: (user: AdminUser) => void;
  onRefresh: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const request = useRef<AbortController | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [stale, setStale] = useState(false);
  const [role, setRole] = useState<AdminUser['roles'][number]>(user.roles[0] ?? 'user');
  const roleChange = kind === 'role';
  const unchangedRole = user.roles.length === 1 && role === user.roles[0];
  const blocking = user.status === 'active';
  const action = roleChange ? 'Đổi vai trò' : blocking ? 'Khoá' : 'Mở khoá';
  useLayoutEffect(() => {
    const element = dialog.current!;
    const previous = document.activeElement;
    element.showModal();
    cancel.current?.focus();
    return () => {
      request.current?.abort();
      element.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
      else document.getElementById('users-results-title')?.focus();
    };
  }, []);
  async function confirm() {
    if (request.current || (roleChange && unchangedRole)) return;
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    setError('');
    try {
      const result = roleChange
        ? await adminUserRepository.setRole(user.id, role, user.version, controller.signal, session)
        : await adminUserRepository.setStatus(
            user.id,
            blocking ? 'blocked' : 'active',
            user.version,
            controller.signal,
            session,
          );
      if (!controller.signal.aborted) onChanged(result);
    } catch (failure) {
      if (controller.signal.aborted) return;
      const code = failure instanceof ApiError ? failure.code : '';
      setStale(failure instanceof ApiError && (failure.status === 409 || failure.status === 404));
      setError(
        code === 'SELF_ROLE_CHANGE_NOT_ALLOWED'
          ? 'Bạn không thể tự hạ quyền tài khoản của mình.'
          : code === 'SELF_BLOCK_NOT_ALLOWED'
            ? 'Bạn không thể tự khoá tài khoản của mình.'
            : code === 'LAST_ACTIVE_ADMIN'
              ? 'Không thể khoá hoặc hạ quyền quản trị viên hoạt động cuối cùng.'
              : code === 'CONFLICT'
                ? 'Tài khoản đã thay đổi. Hãy tải lại danh sách trước khi xác nhận lại.'
                : failure instanceof ApiError && failure.status === 403
                  ? 'Bạn không còn quyền thực hiện thao tác này.'
                  : failure instanceof ApiError && failure.status === 404
                    ? 'Tài khoản không còn tồn tại.'
                    : 'Chưa cập nhật được tài khoản. Vui lòng thử lại.',
      );
    } finally {
      if (!controller.signal.aborted) {
        request.current = null;
        setPending(false);
      }
    }
  }
  return (
    <dialog
      ref={dialog}
      aria-labelledby="user-status-title"
      aria-describedby="user-status-description"
      className="tw:fixed tw:inset-0 tw:m-auto tw:w-[calc(100vw-2rem)] tw:max-w-120 tw:max-h-[calc(100dvh-2rem)] tw:overflow-y-auto tw:rounded-2xl tw:border tw:border-[var(--aw-border)] tw:bg-[#141925] tw:text-[var(--aw-text)] tw:p-6 tw:backdrop:bg-black/70"
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onClose();
      }}
    >
      <h2 id="user-status-title" className="tw:text-2xl">
        {action} tài khoản?
      </h2>
      <p id="user-status-description" className="tw:break-words">
        {action} tài khoản <strong>{user.displayName}</strong> ({user.email}).
      </p>
      <p className="tw:text-[var(--aw-muted)]">
        {roleChange
          ? 'Vai trò mới thay thế toàn bộ vai trò hiện tại. Các phiên đăng nhập sẽ bị thu hồi; tài khoản cần đăng nhập lại để nhận quyền mới. Trạng thái khoá được giữ nguyên.'
          : blocking
            ? 'Tài khoản sẽ không đăng nhập được và các phiên đăng nhập hiện tại sẽ bị thu hồi.'
            : 'Tài khoản có thể đăng nhập lại. Các phiên đã bị thu hồi sẽ không được khôi phục.'}
      </p>
      {roleChange && (
        <div className="tw:my-4">
          <label htmlFor="user-new-role">Vai trò mới</label>
          <Selectbox
            id="user-new-role"
            value={role}
            disabled={pending || stale}
            onChange={(event) => setRole(event.currentTarget.value as AdminUser['roles'][number])}
            options={(['user', 'manage', 'admin'] as const).map((value) => ({
              value,
              label: `${userRoleLabels[value]} (${value})`,
            }))}
          />
          <p className="tw:text-[var(--aw-muted)]">
            Hiện tại: {user.roles.map((value) => userRoleLabels[value]).join(', ')}.
          </p>
        </div>
      )}
      {error && (
        <p role="alert" className="tw:text-[#edacbc]">
          {error}
        </p>
      )}
      <div className="tw:flex tw:justify-end tw:flex-wrap tw:gap-3 tw:mt-6">
        <Button ref={cancel} variant="quiet" disabled={pending} label="Huỷ" onClick={onClose} />
        {stale ? (
          <Button label="Tải lại danh sách" onClick={onRefresh} />
        ) : (
          <Button
            label={pending ? 'Đang cập nhật…' : `Xác nhận ${action.toLowerCase()}`}
            disabled={roleChange && unchangedRole}
            loading={pending}
            onClick={() => void confirm()}
          />
        )}
      </div>
    </dialog>
  );
}
