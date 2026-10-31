import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Selectbox } from '@/components/ui/selectbox';
import { Artwork } from '@/components/common/artwork';
import { statusOptions, formatOptions } from '@/config/catalog';
import { animeArtwork } from '@/config/anime-artwork';
import type { AdminAnimeFields, AdminAnimeInput, AdminAnimeRow } from '@/types/admin-anime';
import type { AdminPreviewSession } from '@/types/admin';
import { adminAnimeRepository } from '@/lib/api/repositories';
import { validateAdminAnime } from '@/utils/admin-anime-validation';
import { useAdminAnimeMutation } from '@/features/admin-anime/hooks/use-admin-anime-mutation';
import { useAnimeGenreOptions } from '@/features/admin-anime/hooks/use-anime-genre-options';

const empty: AdminAnimeInput = {
  title: '',
  slug: '',
  subtitle: '',
  synopsis: '',
  releaseYear: 2026,
  status: 'upcoming',
  format: 'tv',
  genres: [],
  posterUrl: '/images/fallback.svg',
  bannerUrl: '/images/hero.svg',
};

export function AdminAnimeForm({
  row,
  session,
  returnTo,
  fail,
  onSaved,
}: {
  row: AdminAnimeRow | null;
  session: AdminPreviewSession;
  returnTo: string;
  fail: boolean;
  onSaved: () => void;
}) {
  const [value, setValue] = useState<AdminAnimeInput>(row?.anime ?? empty);
  const [validation, setValidation] = useState<AdminAnimeFields>({});
  const mutation = useAdminAnimeMutation();
  const taxonomy = useAnimeGenreOptions(session);
  const failOnce = useRef(fail);
  const errors = { ...validation, ...mutation.error?.fields };
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (Object.keys(validation).length || mutation.error)
      (
        form.current?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
        form.current?.querySelector<HTMLElement>('[role="alert"]')
      )?.focus();
  }, [validation, mutation.error]);
  function update<K extends keyof AdminAnimeInput>(key: K, next: AdminAnimeInput[K]) {
    setValue((current) => ({ ...current, [key]: next }));
  }
  const fieldProps = (name: keyof AdminAnimeInput) => ({
    id: `anime-form-${name}`,
    name,
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `anime-error-${name}` : undefined,
  });
  const errorMessage = (name: keyof AdminAnimeInput) =>
    errors[name] && (
      <p id={`anime-error-${name}`} className="tw:text-[#edacbc] tw:mt-2 tw:mb-0">
        {errors[name]}
      </p>
    );
  return (
    <form
      ref={form}
      noValidate
      aria-label={row ? 'Sửa thông tin phim' : 'Thêm thông tin phim'}
      onSubmit={(event) => {
        event.preventDefault();
        if (mutation.pending || !taxonomy.genres) return;
        const fields = validateAdminAnime(
          value,
          taxonomy.genres.map((item) => item.name),
        );
        setValidation(fields);
        if (Object.keys(fields).length) return;
        const shouldFail = failOnce.current;
        failOnce.current = false;
        void mutation.run(
          (signal) =>
            row
              ? adminAnimeRepository.update(row.anime.id, value, signal, session, shouldFail)
              : adminAnimeRepository.create(value, signal, session, shouldFail),
          onSaved,
        );
      }}
    >
      {mutation.error && (
        <p
          role="alert"
          tabIndex={-1}
          className="tw:p-4 tw:rounded-xl tw:bg-[#edacbc10] tw:text-[#edacbc]"
        >
          {mutation.error.message}
        </p>
      )}
      <fieldset disabled={mutation.pending} className="tw:min-w-0">
        <div className="tw:grid tw:grid-cols-[minmax(0,1fr)_240px] tw:gap-6 tw:max-tablet:grid-cols-1">
          <div className="aw-surface tw:p-6 tw:rounded-xl tw:grid tw:gap-5 tw:max-phone:p-4">
            <h2 className="tw:text-xl tw:mb-0">Thông tin phim</h2>
            {(['title', 'slug', 'subtitle'] as const).map((name) => (
              <div key={name}>
                <label htmlFor={`anime-form-${name}`} className="tw:block tw:mb-2">
                  {{ title: 'Tên phim', slug: 'Slug', subtitle: 'Tên tiếng Anh' }[name]}
                  {name !== 'subtitle' ? ' *' : ''}
                </label>
                <Input
                  {...fieldProps(name)}
                  value={value[name]}
                  onChange={(event) => update(name, event.currentTarget.value)}
                  maxLength={200}
                  required={name !== 'subtitle'}
                  autoComplete="off"
                />
                {errorMessage(name)}
                {name === 'slug' && (
                  <p className="tw:mt-2 tw:mb-0 tw:text-[var(--aw-muted)]">
                    Ví dụ: hanh-trinh-anh-sao. Slug độc lập với ID phim.
                  </p>
                )}
              </div>
            ))}
            <div>
              <label htmlFor="anime-form-synopsis" className="tw:block tw:mb-2">
                Mô tả *
              </label>
              <textarea
                {...fieldProps('synopsis')}
                value={value.synopsis}
                onChange={(event) => update('synopsis', event.currentTarget.value)}
                rows={6}
                required
                maxLength={5000}
                className="aw-input tw:resize-y"
              />
              {errorMessage('synopsis')}
            </div>
            <div className="tw:grid tw:grid-cols-3 tw:gap-4 tw:max-phone:grid-cols-1">
              <div>
                <label htmlFor="anime-form-releaseYear" className="tw:block tw:mb-2">
                  Năm phát hành *
                </label>
                <Input
                  {...fieldProps('releaseYear')}
                  type="number"
                  min={1}
                  max={9999}
                  required
                  value={Number.isNaN(value.releaseYear) ? '' : value.releaseYear}
                  onChange={(event) => update('releaseYear', event.currentTarget.valueAsNumber)}
                />
                {errorMessage('releaseYear')}
              </div>
              <div>
                <label htmlFor="anime-form-status" className="tw:block tw:mb-2">
                  Trạng thái *
                </label>
                <Selectbox
                  {...fieldProps('status')}
                  value={value.status}
                  options={statusOptions}
                  onChange={(event) =>
                    update('status', event.currentTarget.value as AdminAnimeInput['status'])
                  }
                />
                {errorMessage('status')}
              </div>
              <div>
                <label htmlFor="anime-form-format" className="tw:block tw:mb-2">
                  Định dạng *
                </label>
                <Selectbox
                  {...fieldProps('format')}
                  value={value.format}
                  options={formatOptions}
                  onChange={(event) =>
                    update('format', event.currentTarget.value as AdminAnimeInput['format'])
                  }
                />
                {errorMessage('format')}
              </div>
            </div>
            <fieldset>
              <legend className="tw:text-body tw:mb-3">Thể loại *</legend>
              <div className="tw:flex tw:flex-wrap tw:gap-4">
                {(taxonomy.genres ?? []).map((genre) => (
                  <label key={genre.id} className="tw:inline-flex tw:gap-2 tw:items-center">
                    <Input
                      variant="unstyled"
                      type="checkbox"
                      name="genres"
                      value={genre.name}
                      checked={value.genres.includes(genre.name)}
                      aria-invalid={Boolean(errors.genres)}
                      aria-describedby={errors.genres ? 'anime-error-genres' : undefined}
                      onChange={(event) =>
                        update(
                          'genres',
                          event.currentTarget.checked
                            ? [...value.genres, genre.name]
                            : value.genres.filter((item) => item !== genre.name),
                        )
                      }
                    />
                    {genre.name}
                  </label>
                ))}
              </div>
              {errorMessage('genres')}
              {taxonomy.error ? (
                <p role="alert">
                  Chưa tải được thể loại.{' '}
                  <Button
                    variant="quiet"
                    size="sm"
                    label="Tải lại thể loại"
                    onClick={taxonomy.retry}
                  />
                </p>
              ) : !taxonomy.genres ? (
                <p role="status">Đang tải thể loại…</p>
              ) : !taxonomy.genres.length ? (
                <p>Chưa có thể loại. Thêm thể loại trong trang quản lý trước khi lưu phim.</p>
              ) : null}
            </fieldset>
          </div>
          <section
            className="aw-surface tw:p-5 tw:rounded-xl tw:self-start"
            aria-labelledby="anime-artwork-title"
          >
            <h2 id="anime-artwork-title" className="tw:text-xl tw:mb-4">
              Hình ảnh
            </h2>
            <Artwork
              key={value.posterUrl}
              src={value.posterUrl}
              alt="Xem trước poster phim"
              className="tw:w-full tw:max-w-45 tw:aspect-[2/3] tw:object-cover tw:rounded-xl tw:mb-5"
            />
            {(['posterUrl', 'bannerUrl'] as const).map((name) => (
              <div key={name} className="tw:mb-4">
                <label htmlFor={`anime-form-${name}`} className="tw:block tw:mb-2">
                  {name === 'posterUrl' ? 'Poster' : 'Banner'}
                </label>
                <Selectbox
                  {...fieldProps(name)}
                  value={value[name]}
                  options={animeArtwork}
                  onChange={(event) => update(name, event.currentTarget.value)}
                />
                {errorMessage(name)}
              </div>
            ))}
            <p className="tw:mb-0 tw:text-[var(--aw-muted)]">
              Chọn ảnh có sẵn. Chưa hỗ trợ tải ảnh lên.
            </p>
          </section>
        </div>
      </fieldset>
      <div className="tw:flex tw:gap-3 tw:mt-6 tw:flex-wrap">
        <Button
          type="submit"
          loading={mutation.pending}
          disabled={!taxonomy.genres || taxonomy.genres.length === 0}
          label={mutation.pending ? 'Đang lưu…' : 'Lưu phim'}
        />
        <Button as="link" variant="quiet" to={returnTo} label="Huỷ" />
      </div>
      <p className="tw:mt-4 tw:text-[var(--aw-muted)]">
        Thay đổi chỉ lưu trong phiên quản trị mẫu và được đặt lại khi tải lại hoặc đổi phiên.
      </p>
    </form>
  );
}
