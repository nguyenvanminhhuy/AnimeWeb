import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { AdminGenre, AdminGenreFields, AdminGenreInput } from '@/types/admin-genre';
import type { AdminPreviewSession } from '@/types/admin';
import { adminGenreRepository } from '@/lib/api/repositories';
import { validateAdminGenre } from '@/utils/admin-genre-validation';
import { useGenreMutation } from '@/features/admin-genres/hooks/use-genre-mutation';

export function GenreForm({
  row,
  session,
  autoFocus,
  fail,
  onCancel,
  onSaved,
}: {
  row: AdminGenre | null;
  session: AdminPreviewSession;
  autoFocus: boolean;
  fail: boolean;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [value, setValue] = useState<AdminGenreInput>({
    name: row?.name ?? '',
    slug: row?.slug ?? '',
  });
  const [validation, setValidation] = useState<AdminGenreFields>({});
  const { run, pending, error } = useGenreMutation();
  const form = useRef<HTMLFormElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const failOnce = useRef(fail);
  const fields = { ...validation, ...error?.fields };
  useEffect(() => {
    if (autoFocus) nameInput.current?.focus();
  }, [autoFocus]);
  useEffect(() => {
    if (Object.keys(validation).length || error)
      (
        form.current?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
        form.current?.querySelector<HTMLElement>('[role="alert"]')
      )?.focus();
  }, [validation, error]);
  return (
    <form
      ref={form}
      noValidate
      aria-label={row ? 'Sửa thể loại' : 'Thêm thể loại'}
      className="aw-surface tw:rounded-xl tw:p-6 tw:sticky tw:top-6 tw:max-tablet:static tw:max-phone:p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (pending) return;
        const errors = validateAdminGenre(value);
        setValidation(errors);
        if (Object.keys(errors).length) return;
        const shouldFail = failOnce.current;
        failOnce.current = false;
        void run(
          (signal) =>
            row
              ? adminGenreRepository.update(row.id, value, signal, session, shouldFail)
              : adminGenreRepository.create(value, signal, session, shouldFail),
          onSaved,
        );
      }}
    >
      <h2 className="tw:text-xl tw:mb-2">{row ? 'Sửa thể loại' : 'Thêm thể loại'}</h2>
      <p className="tw:mb-5 tw:text-[var(--aw-muted)]">
        {row
          ? 'Đổi tên vẫn giữ nguyên liên kết với phim trong phiên mẫu.'
          : 'Tạo thể loại để phân nhóm nội dung.'}
      </p>
      {error && (
        <p role="alert" tabIndex={-1} className="tw:text-[#edacbc]">
          {error.message}
        </p>
      )}
      <fieldset disabled={pending} className="tw:min-w-0 tw:grid tw:gap-5">
        {(['name', 'slug'] as const).map((key) => (
          <div key={key}>
            <label htmlFor={`genre-${key}`} className="tw:block tw:mb-2">
              {key === 'name' ? 'Tên thể loại' : 'Slug'} *
            </label>
            <Input
              id={`genre-${key}`}
              ref={key === 'name' ? nameInput : undefined}
              name={key}
              required
              maxLength={100}
              value={value[key]}
              aria-invalid={Boolean(fields[key])}
              aria-describedby={
                fields[key] ? `genre-error-${key}` : key === 'slug' ? 'genre-slug-hint' : undefined
              }
              onChange={(event) => {
                const next = event.currentTarget.value;
                setValue((current) => ({ ...current, [key]: next }));
              }}
            />
            {fields[key] && (
              <p id={`genre-error-${key}`} className="tw:mt-2 tw:mb-0 tw:text-[#edacbc]">
                {fields[key]}
              </p>
            )}
          </div>
        ))}
      </fieldset>
      <p id="genre-slug-hint" className="tw:mt-3 tw:text-[var(--aw-muted)]">
        Slug dùng chữ thường không dấu, số và dấu nối. Ví dụ: khoa-hoc-vien-tuong.
      </p>
      <div className="tw:flex tw:gap-3 tw:flex-wrap tw:mt-6">
        <Button type="submit" loading={pending} label={pending ? 'Đang lưu…' : 'Lưu thể loại'} />
        <Button variant="quiet" label="Huỷ" onClick={onCancel} />
      </div>
    </form>
  );
}
