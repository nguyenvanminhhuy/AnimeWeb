import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Selectbox } from '@/components/ui/selectbox';
import { adminEpisodeRepository } from '@/lib/api/repositories';
import type { AdminPreviewSession } from '@/types/admin';
import type {
  AdminEpisodeCatalog,
  AdminEpisodeInput,
  AdminSeasonInput,
} from '@/types/admin-episode';
import { AdminEpisodeError, validateAdminEpisode } from '@/utils/admin-episode-validation';

export function MetadataForm({
  kind,
  id,
  initial,
  catalog,
  session,
  fail,
  onSaved,
  onCancel,
}: {
  kind: 'season' | 'episode';
  id: string | null;
  initial: AdminSeasonInput | AdminEpisodeInput;
  catalog: AdminEpisodeCatalog;
  session: AdminPreviewSession;
  fail?: boolean;
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
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    form.current
      ?.querySelector<HTMLElement>('input:not(:disabled), select:not(:disabled)')
      ?.focus();
  }, []);
  const episode = 'seasonId' in value ? value : null;
  const publishing =
    episode?.status === 'published' && (!('status' in initial) || initial.status !== 'published');
  function showFields(next: Record<string, string>) {
    setFields(next);
    requestAnimationFrame(() =>
      form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
    );
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (request.current || pending) return;
    const invalid = validateAdminEpisode(value);
    if (publishing && !confirmed) invalid.status = 'Xác nhận công bố tập phim trước khi lưu.';
    showFields(invalid);
    if (Object.keys(invalid).length) return;
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    setError('');
    try {
      const shouldFail = Boolean(fail && !failed.current);
      failed.current = true;
      if (kind === 'season')
        await adminEpisodeRepository.saveSeason(id, value, controller.signal, session, shouldFail);
      else
        await adminEpisodeRepository.saveEpisode(
          id,
          value as AdminEpisodeInput,
          controller.signal,
          session,
          shouldFail,
        );
      if (!controller.signal.aborted) onSaved();
    } catch (reason) {
      if (!controller.signal.aborted) {
        setError(reason instanceof Error ? reason.message : 'Không thể lưu.');
        if (reason instanceof AdminEpisodeError) showFields(reason.fields);
      }
    } finally {
      if (!controller.signal.aborted) {
        request.current = null;
        setPending(false);
      }
    }
  }
  const update = (key: string, next: string | number) => {
    setValue((current) => ({
      ...current,
      [key]: next,
      ...(key === 'animeId' && episode ? { seasonId: '' } : {}),
    }));
    setConfirmed(false);
  };
  const label = kind === 'season' ? 'mùa/phần' : 'tập phim';
  return (
    <form
      ref={form}
      onSubmit={submit}
      noValidate
      aria-label={`Thông tin ${label}`}
      className="aw-surface tw:rounded-2xl tw:p-6 tw:grid tw:gap-5 tw:min-w-0"
    >
      <h2 className="tw:text-xl tw:mb-0">
        {id ? 'Sửa' : 'Thêm'} {label}
      </h2>
      {error && (
        <p role="alert" className="tw:text-[#ffb4bc] tw:mb-0">
          {error}
        </p>
      )}
      <fieldset
        disabled={pending}
        className="tw:grid tw:grid-cols-2 tw:gap-5 tw:max-phone:grid-cols-1"
      >
        <div className="tw:col-span-full">
          <label htmlFor="metadata-animeId">Phim *</label>
          <Selectbox
            id="metadata-animeId"
            value={value.animeId}
            disabled={Boolean(id)}
            aria-invalid={Boolean(fields.animeId)}
            aria-describedby={fields.animeId ? 'metadata-animeId-error' : undefined}
            onChange={(e) => update('animeId', e.target.value)}
            options={[
              { value: '', label: 'Chọn phim' },
              ...catalog.anime.map((a) => ({ value: a.id, label: a.title })),
            ]}
          />
          {fields.animeId && (
            <p id="metadata-animeId-error" className="tw:text-[#ffb4bc]">
              {fields.animeId}
            </p>
          )}
        </div>
        {episode && (
          <div className="tw:col-span-full">
            <label htmlFor="metadata-seasonId">Mùa/phần *</label>
            <Selectbox
              id="metadata-seasonId"
              value={episode.seasonId}
              disabled={Boolean(id)}
              aria-invalid={Boolean(fields.seasonId)}
              aria-describedby={fields.seasonId ? 'metadata-seasonId-error' : undefined}
              onChange={(e) => update('seasonId', e.target.value)}
              options={[
                { value: '', label: 'Chọn mùa/phần' },
                ...catalog.seasons
                  .filter((s) => s.animeId === value.animeId)
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((s) => ({ value: s.id, label: s.title })),
              ]}
            />
            {fields.seasonId && (
              <p id="metadata-seasonId-error" className="tw:text-[#ffb4bc]">
                {fields.seasonId}
              </p>
            )}
          </div>
        )}
        {(['title', 'number', 'sortOrder', ...(episode ? ['durationSeconds'] : [])] as const).map(
          (key) => (
            <div key={key} className={key === 'title' ? 'tw:col-span-full' : ''}>
              <label htmlFor={`metadata-${key}`}>
                {
                  (
                    {
                      title: 'Tiêu đề',
                      number: kind === 'season' ? 'Số mùa/phần' : 'Số tập',
                      sortOrder: 'Thứ tự hiển thị',
                      durationSeconds: 'Thời lượng (giây)',
                    } as Record<string, string>
                  )[key]
                }{' '}
                *
              </label>
              <Input
                id={`metadata-${key}`}
                type={key === 'title' ? 'text' : 'number'}
                required
                min={key === 'title' ? undefined : 1}
                max={key === 'durationSeconds' ? 86400 : 100000}
                step={1}
                maxLength={key === 'title' ? 200 : undefined}
                value={
                  key === 'title'
                    ? value.title
                    : Number.isFinite((value as unknown as Record<string, unknown>)[key])
                      ? String((value as unknown as Record<string, unknown>)[key])
                      : ''
                }
                aria-invalid={Boolean(fields[key])}
                aria-describedby={fields[key] ? `metadata-${key}-error` : undefined}
                onChange={(e) =>
                  update(
                    key,
                    key === 'title'
                      ? e.target.value
                      : e.target.value === ''
                        ? NaN
                        : Number(e.target.value),
                  )
                }
              />
              {fields[key] && (
                <p id={`metadata-${key}-error`} className="tw:text-[#ffb4bc] tw:mb-0">
                  {fields[key]}
                </p>
              )}
            </div>
          ),
        )}
        {episode && (
          <div className="tw:col-span-full">
            <label htmlFor="metadata-status">Trạng thái *</label>
            <Selectbox
              id="metadata-status"
              value={episode.status}
              aria-invalid={Boolean(fields.status)}
              aria-describedby={
                fields.status
                  ? 'metadata-status-help metadata-status-error'
                  : 'metadata-status-help'
              }
              onChange={(e) => update('status', e.target.value)}
              options={[
                { value: 'draft', label: 'Bản nháp' },
                { value: 'published', label: 'Đã công bố' },
              ]}
            />
            <p id="metadata-status-help" className="tw:text-[var(--aw-muted)] tw:mt-2 tw:mb-0">
              Công bố chỉ cập nhật metadata trong phiên quản trị, không tạo nguồn phát. Chưa hỗ trợ
              thu hồi hoặc xoá tập đã công bố.
            </p>
            {fields.status && (
              <p id="metadata-status-error" role="alert" className="tw:text-[#ffb4bc]">
                {fields.status}
              </p>
            )}
          </div>
        )}
        {publishing && (
          <label className="tw:col-span-full tw:flex tw:gap-3 tw:items-start">
            <Input
              type="checkbox"
              variant="unstyled"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            Xác nhận công bố tập phim trong phiên mẫu.
          </label>
        )}
      </fieldset>
      <div className="tw:flex tw:gap-3 tw:flex-wrap">
        <Button type="submit" label={`Lưu ${label}`} loading={pending} />
        <Button label="Huỷ" variant="quiet" disabled={pending} onClick={onCancel} />
      </div>
    </form>
  );
}
