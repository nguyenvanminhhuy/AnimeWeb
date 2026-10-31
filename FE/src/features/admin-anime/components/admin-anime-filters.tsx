import { useEffect, useLayoutEffect, useRef } from 'react';
import { Form, Link, useLocation, useNavigationType } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Selectbox } from '@/components/ui/selectbox';
import { Icon } from '@/components/ui/icon';
import {
  catalogYears,
  genreOptions,
  statusOptions,
  formatOptions,
  sortOptions,
} from '@/config/catalog';
import { paths } from '@/config/paths';
import type { AdminAnimeQuery } from '@/types/admin-anime';

export function AdminAnimeFilters({
  query,
  mock,
  years = [...catalogYears],
  genres = genreOptions,
}: {
  query: AdminAnimeQuery;
  mock: string | null;
  years?: number[];
  genres?: readonly { value: string; label: string }[];
}) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const previousQuery = useRef(query.q);
  const search = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const composing = useRef(false);
  function cancelSearch() {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }
  useLayoutEffect(() => {
    if (navigationType === 'REPLACE' && previousQuery.current === query.q) return;
    previousQuery.current = query.q;
    cancelSearch();
    if (search.current) search.current.value = query.q;
  }, [location.key, navigationType, query.q]);
  useEffect(() => cancelSearch, []);
  function scheduleSearch(input: HTMLInputElement) {
    cancelSearch();
    if (!composing.current)
      timer.current = setTimeout(() => {
        timer.current = null;
        input.form?.requestSubmit();
      }, 350);
  }
  const fields = [
    {
      name: 'genre',
      label: 'Thể loại',
      options: [
        { value: '', label: 'Tất cả thể loại' },
        ...genres,
        ...(query.genre && !genres.some((item) => item.value === query.genre)
          ? [{ value: query.genre, label: `Thể loại không còn tồn tại (${query.genre})` }]
          : []),
      ],
    },
    {
      name: 'status',
      label: 'Trạng thái',
      options: [{ value: '', label: 'Tất cả trạng thái' }, ...statusOptions],
    },
    {
      name: 'format',
      label: 'Định dạng',
      options: [{ value: '', label: 'Tất cả định dạng' }, ...formatOptions],
    },
    {
      name: 'year',
      label: 'Năm phát hành',
      options: [
        { value: '', label: 'Tất cả năm' },
        ...[...new Set([...years, ...(query.year ? [Number(query.year)] : [])])]
          .sort((a, b) => b - a)
          .map((year) => ({ value: String(year), label: String(year) })),
      ],
    },
    { name: 'sort', label: 'Sắp xếp', options: sortOptions },
  ] as const;
  return (
    <Form
      action={paths.adminAnime}
      method="get"
      role="search"
      aria-label="Tìm và lọc phim quản trị"
      className="aw-surface tw:p-5 tw:rounded-xl tw:mb-6 tw:max-phone:p-4"
      onSubmit={(event) => {
        cancelSearch();
        if (composing.current) event.preventDefault();
      }}
    >
      <div className="tw:flex tw:gap-4 tw:items-end tw:mb-5 tw:max-phone:flex-col tw:max-phone:items-stretch">
        <div className="tw:flex-1 tw:min-w-0">
          <label htmlFor="admin-anime-search" className="tw:block tw:mb-2">
            Tìm kiếm phim
          </label>
          <div className="tw:relative">
            <span className="tw:absolute tw:left-3 tw:top-1/2 tw:-translate-y-1/2 tw:text-[var(--aw-muted)]">
              <Icon name="search" />
            </span>
            <Input
              id="admin-anime-search"
              name="q"
              type="search"
              ref={search}
              defaultValue={query.q}
              className="tw:pl-10 tw:w-full"
              maxLength={100}
              placeholder="Tên phim hoặc tên tiếng Anh…"
              onChange={(event) => scheduleSearch(event.currentTarget)}
              onCompositionStart={() => {
                composing.current = true;
                cancelSearch();
              }}
              onCompositionEnd={(event) => {
                composing.current = false;
                scheduleSearch(event.currentTarget);
              }}
            />
          </div>
        </div>
        <Link to={paths.adminAnime} className="tw:py-3 tw:whitespace-nowrap">
          Đặt lại bộ lọc
        </Link>
      </div>
      <Input type="hidden" name="page" value="1" />
      <Input type="hidden" name="pageSize" value={query.pageSize} />
      {mock && import.meta.env.DEV && <Input type="hidden" name="mock" value={mock} />}
      <div className="tw:grid tw:grid-cols-3 tw:gap-4 tw:max-phone:grid-cols-1">
        {fields.map((field) => (
          <div key={field.name} className="tw:min-w-0">
            <label htmlFor={`admin-anime-${field.name}`} className="tw:block tw:mb-2">
              {field.label}
            </label>
            <Selectbox
              id={`admin-anime-${field.name}`}
              name={field.name}
              key={String(query[field.name])}
              defaultValue={query[field.name]}
              options={field.options}
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
            />
          </div>
        ))}
      </div>
    </Form>
  );
}
