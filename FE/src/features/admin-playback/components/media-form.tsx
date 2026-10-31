import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Selectbox } from '@/components/ui/selectbox';
import type { AdminPreviewSession } from '@/types/admin';
import type { AdminSourceInput, AdminSubtitleInput } from '@/types/admin-playback';
import { adminPlaybackRepository } from '@/lib/api/repositories';
import { AdminPlaybackError, validateAdminPlayback } from '@/utils/admin-playback-validation';

export function MediaForm({
  id,
  initial,
  session,
  fail,
  onSaved,
  onCancel,
}: {
  id: string | null;
  initial: AdminSourceInput | AdminSubtitleInput;
  session: AdminPreviewSession;
  fail: boolean;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const request = useRef<AbortController | null>(null);
  const failed = useRef(false);
  const source = 'episodeId' in value;
  const noun = source ? 'nguồn phát' : 'phụ đề';
  const statusChanged = source && 'enabled' in initial && value.enabled !== initial.enabled;
  useEffect(() => {
    form.current?.querySelector<HTMLInputElement>('input')?.focus();
    return () => request.current?.abort();
  }, []);
  const invalid = (next: Record<string, string>) => {
    setFields(next);
    requestAnimationFrame(() =>
      form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
    );
  };
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (request.current) return;
    const errors = validateAdminPlayback(value);
    if (statusChanged && !confirmed)
      errors.enabled = 'Xác nhận thay đổi trạng thái nguồn trước khi lưu.';
    invalid(errors);
    if (Object.keys(errors).length) return;
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    setError('');
    try {
      const shouldFail = fail && !failed.current;
      failed.current = true;
      if ('episodeId' in value)
        await adminPlaybackRepository.saveSource(id, value, controller.signal, session, shouldFail);
      else
        await adminPlaybackRepository.saveSubtitle(
          id,
          value,
          controller.signal,
          session,
          shouldFail,
        );
      if (!controller.signal.aborted) onSaved();
    } catch (reason) {
      if (!controller.signal.aborted) {
        setError(reason instanceof Error ? reason.message : 'Không thể lưu.');
        if (reason instanceof AdminPlaybackError) invalid(reason.fields);
      }
    } finally {
      if (!controller.signal.aborted) {
        request.current = null;
        setPending(false);
      }
    }
  }
  function update(key: string, next: string | boolean) {
    setValue((current) => ({ ...current, [key]: next }));
    if (key === 'enabled') setConfirmed(false);
  }
  const keys = source ? ['label', 'providerKey', 'language', 'url'] : ['label', 'language', 'url'];
  const names: Record<string, string> = {
    label: 'Nhãn',
    providerKey: 'Mã nhà cung cấp',
    language: 'Ngôn ngữ',
    url: 'Địa chỉ tài nguyên',
  };
  return (
    <form
      ref={form}
      onSubmit={submit}
      noValidate
      aria-label={`Thông tin ${noun}`}
      className="aw-surface tw:rounded-xl tw:p-6 tw:grid tw:gap-5"
    >
      <h2 className="tw:text-xl tw:mb-0">
        {id ? 'Sửa' : 'Thêm'} {noun}
      </h2>
      {error && (
        <p role="alert" className="tw:text-[#ffb4bc] tw:mb-0">
          {error} {fields.episodeId ?? fields.playbackSourceId}
        </p>
      )}
      <fieldset
        disabled={pending}
        className="tw:grid tw:grid-cols-2 tw:gap-5 tw:max-phone:grid-cols-1"
      >
        {keys.map((key) => (
          <div key={key} className={key === 'url' ? 'tw:col-span-full' : ''}>
            <label htmlFor={`media-${key}`}>{names[key]} *</label>
            <Input
              id={`media-${key}`}
              required
              type="text"
              maxLength={
                key === 'url' ? 2048 : key === 'providerKey' ? 50 : key === 'language' ? 35 : 100
              }
              value={String(value[key as keyof typeof value])}
              placeholder={
                key === 'language'
                  ? 'vi, ja, en-US'
                  : key === 'url'
                    ? '/media/... hoặc https://...'
                    : undefined
              }
              aria-invalid={Boolean(fields[key])}
              aria-describedby={
                fields[key] ? `media-${key}-error` : key === 'url' ? 'media-url-help' : undefined
              }
              onChange={(e) => update(key, e.target.value)}
            />
            {fields[key] && (
              <p id={`media-${key}-error`} className="tw:text-[#ffb4bc] tw:mb-0">
                {fields[key]}
              </p>
            )}
          </div>
        ))}
        <p id="media-url-help" className="tw:col-span-full tw:text-[var(--aw-muted)] tw:mb-0">
          Chỉ lưu cấu hình. Không tải, kiểm tra hoặc phát tài nguyên khi nhập địa chỉ. Chỉ dùng tài
          nguyên bạn được phép sử dụng.
        </p>
        <div>
          <label htmlFor="media-format">Định dạng *</label>
          <Selectbox
            id="media-format"
            required
            value={source ? value.type : value.format}
            aria-invalid={Boolean(fields.type ?? fields.format)}
            aria-describedby={fields.type || fields.format ? 'media-format-error' : undefined}
            onChange={(e) => update(source ? 'type' : 'format', e.target.value)}
            options={
              source
                ? [
                    { value: 'mp4', label: 'MP4' },
                    { value: 'hls', label: 'HLS' },
                  ]
                : [
                    { value: 'vtt', label: 'WebVTT (.vtt)' },
                    { value: 'srt', label: 'SubRip (.srt)' },
                  ]
            }
          />
          {(fields.type || fields.format) && (
            <p id="media-format-error" className="tw:text-[#ffb4bc]">
              {fields.type ?? fields.format}
            </p>
          )}
        </div>
        <div className="tw:col-span-full">
          <label className="tw:flex tw:items-center tw:gap-3">
            <Input
              variant="unstyled"
              type="checkbox"
              checked={source ? value.enabled : value.isDefault}
              aria-invalid={Boolean(fields.enabled ?? fields.isDefault)}
              aria-describedby={fields.enabled ? 'media-status-error' : 'media-status-help'}
              onChange={(e) => update(source ? 'enabled' : 'isDefault', e.target.checked)}
            />
            {source ? 'Bật nguồn phát' : 'Đặt làm phụ đề mặc định'}
          </label>
          <p id="media-status-help" className="tw:text-[var(--aw-muted)] tw:mt-2 tw:mb-0">
            {source
              ? 'Bật/tắt chỉ thay đổi cấu hình quản trị mẫu. Nguồn chưa được kiểm chứng, không tự xuất hiện trong player.'
              : 'Mỗi nguồn có tối đa một phụ đề mặc định. Chọn mục này sẽ bỏ mặc định của phụ đề khác trong cùng nguồn; SRT chưa được chuyển đổi sang WebVTT.'}
          </p>
          {fields.enabled && (
            <p id="media-status-error" role="alert" className="tw:text-[#ffb4bc]">
              {fields.enabled}
            </p>
          )}
        </div>
        {statusChanged && (
          <label className="tw:col-span-full tw:flex tw:gap-3 tw:items-start">
            <Input
              type="checkbox"
              variant="unstyled"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            Xác nhận {source && value.enabled ? 'bật' : 'tắt'} nguồn trong phiên mẫu.
          </label>
        )}
      </fieldset>
      <div className="tw:flex tw:gap-3 tw:flex-wrap">
        <Button type="submit" label={`Lưu ${noun}`} loading={pending} />
        <Button label="Huỷ" variant="quiet" disabled={pending} onClick={onCancel} />
      </div>
    </form>
  );
}
