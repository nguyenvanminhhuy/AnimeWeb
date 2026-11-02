import { useEffect, useRef, useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSession } from '@/stores/session';
import { ApiError } from '@/lib/api/backend/error';
import { prepareAvatar } from '@/features/profile/utils/prepare-avatar';

export function AvatarEditor() {
  const { displayName, avatarUrl, canEditAvatar, saveAvatar } = useSession();
  const [image, setImage] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const operation = useRef<AbortController | null>(null);
  useEffect(() => () => operation.current?.abort(), []);
  useEffect(() => {
    if (!image) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);
  if (!canEditAvatar) return null;

  async function choose(file: File) {
    if (operation.current) return;
    const controller = new AbortController();
    operation.current = controller;
    setBusy(true);
    setError('');
    setNotice('');
    setRemoving(false);
    setImage(null);
    try {
      setImage(await prepareAvatar(file, controller.signal));
    } catch (failure) {
      if (!controller.signal.aborted)
        setError(failure instanceof Error ? failure.message : 'Không đọc được ảnh.');
    } finally {
      if (!controller.signal.aborted) {
        operation.current = null;
        setBusy(false);
      }
    }
  }
  async function submit(remove = false) {
    if (operation.current || (!remove && !image)) return;
    const controller = new AbortController();
    operation.current = controller;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await saveAvatar(remove ? null : image, controller.signal);
      if (!controller.signal.aborted) {
        setImage(null);
        setRemoving(false);
        setNotice(remove ? 'Đã xoá ảnh đại diện.' : 'Đã lưu ảnh đại diện.');
      }
    } catch (failure) {
      if (controller.signal.aborted) return;
      setError(
        failure instanceof ApiError
          ? failure.status === 409
            ? 'Hồ sơ đã thay đổi. Hãy kiểm tra lại ảnh và nhấn Lưu lần nữa.'
            : failure.status === 401
              ? 'Phiên đã hết hạn. Vui lòng đăng nhập lại.'
              : failure.status === 403
                ? 'Bạn không có quyền đổi ảnh đại diện.'
                : failure.status === 413
                  ? 'Ảnh quá lớn. Vui lòng chọn ảnh khác.'
                  : failure.status === 400 || failure.status === 415
                    ? 'Ảnh không hợp lệ. Vui lòng chọn lại.'
                    : 'Không lưu được ảnh. Vui lòng thử lại.'
          : failure instanceof Error
            ? failure.message
            : 'Không lưu được ảnh.',
      );
    } finally {
      if (!controller.signal.aborted) {
        operation.current = null;
        setBusy(false);
      }
    }
  }
  return (
    <section
      aria-labelledby="avatar-editor-title"
      aria-busy={busy}
      className="aw-surface tw:rounded-xl tw:p-6"
    >
      <h2 id="avatar-editor-title" className="tw:text-xl">
        Ảnh đại diện
      </h2>
      <div className="tw:my-5">
        <Avatar name={displayName} src={preview ?? avatarUrl} size="lg" />
      </div>
      <label htmlFor="profile-avatar-file">Chọn ảnh mới</label>
      <Input
        id="profile-avatar-file"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        disabled={busy}
        aria-describedby="avatar-file-help"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = '';
          if (file) void choose(file);
        }}
      />
      <p id="avatar-file-help" className="tw:text-[var(--aw-muted)] tw:mt-2">
        PNG, JPG hoặc WebP, tối đa 5 MB. Ảnh được cắt vuông ở giữa và thu về tối đa 512px.
      </p>
      {error && (
        <p role="alert" className="tw:text-[#edacbc]">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {removing && <p>Bạn muốn xoá ảnh đại diện và dùng chữ viết tắt?</p>}
      <div className="tw:flex tw:flex-wrap tw:gap-2">
        {removing ? (
          <>
            <Button
              label="Xác nhận xoá ảnh"
              disabled={busy}
              loading={busy}
              onClick={() => void submit(true)}
            />
            <Button
              variant="quiet"
              label="Huỷ"
              disabled={busy}
              onClick={() => setRemoving(false)}
            />
          </>
        ) : (
          <>
            <Button
              label={busy ? 'Đang xử lý…' : 'Lưu ảnh'}
              loading={busy}
              disabled={!image || busy}
              onClick={() => void submit()}
            />
            {image && (
              <Button
                label="Huỷ chọn ảnh"
                variant="quiet"
                disabled={busy}
                onClick={() => {
                  setImage(null);
                  setError('');
                }}
              />
            )}
            {avatarUrl && (
              <Button
                label="Xoá ảnh"
                variant="quiet"
                disabled={busy}
                onClick={() => {
                  setRemoving(true);
                  setError('');
                  setNotice('');
                }}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}
