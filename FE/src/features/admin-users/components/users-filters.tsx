import { useEffect, useLayoutEffect, useRef } from 'react';
import { Form, Link, useLocation, useNavigationType } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Selectbox } from '@/components/ui/selectbox';
import { paths } from '@/config/paths';
import type { AdminUsersQuery } from '@/types/admin-user';

export function UsersFilters({ query, mock }: { query: AdminUsersQuery; mock: string | null }) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const previous = useRef(query.q);
  const input = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const composing = useRef(false);
  function cancel() {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }
  useEffect(() => cancel, []);
  useLayoutEffect(() => {
    if (navigationType === 'REPLACE' && previous.current === query.q) return;
    previous.current = query.q;
    cancel();
    if (input.current) input.current.value = query.q;
  }, [location.key, navigationType, query.q]);
  function schedule(element: HTMLInputElement) {
    cancel();
    if (!composing.current)
      timer.current = setTimeout(() => {
        timer.current = null;
        element.form?.requestSubmit();
      }, 350);
  }
  const fields = [
    {
      name: 'status',
      label: 'Trạng thái',
      options: [
        { value: '', label: 'Tất cả trạng thái' },
        { value: 'active', label: 'Đang hoạt động' },
        { value: 'blocked', label: 'Đã khoá' },
      ],
    },
    {
      name: 'sort',
      label: 'Sắp xếp',
      options: [
        { value: 'newest', label: 'Ngày tạo mới nhất' },
        { value: 'oldest', label: 'Ngày tạo cũ nhất' },
        { value: 'name', label: 'Tên A–Z' },
      ],
    },
  ] as const;
  return (
    <Form
      action={paths.adminUsers}
      method="get"
      role="search"
      aria-label="Tìm và lọc người dùng"
      className="aw-surface tw:rounded-xl tw:p-5 tw:mb-6 tw:max-phone:p-4"
      onSubmit={(event) => {
        cancel();
        if (composing.current) event.preventDefault();
      }}
    >
      <div className="tw:flex tw:gap-4 tw:items-end tw:mb-4 tw:max-phone:flex-col tw:max-phone:items-stretch">
        <div className="tw:flex-1 tw:min-w-0">
          <label htmlFor="users-search" className="tw:block tw:mb-2">
            Tìm kiếm người dùng
          </label>
          <Input
            ref={input}
            id="users-search"
            name="q"
            type="search"
            defaultValue={query.q}
            maxLength={100}
            placeholder="Tên, email hoặc mã người dùng…"
            onChange={(event) => schedule(event.currentTarget)}
            onCompositionStart={() => {
              composing.current = true;
              cancel();
            }}
            onCompositionEnd={(event) => {
              composing.current = false;
              schedule(event.currentTarget);
            }}
          />
        </div>
        <Link className="tw:py-3" to={paths.adminUsers}>
          Đặt lại bộ lọc
        </Link>
      </div>
      <Input type="hidden" name="page" value="1" />
      <Input type="hidden" name="pageSize" value={query.pageSize} />
      {mock && <Input type="hidden" name="mock" value={mock} />}
      <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:max-phone:grid-cols-1">
        {fields.map((field) => (
          <div key={field.name} className="tw:min-w-0">
            <label htmlFor={`users-${field.name}`} className="tw:block tw:mb-2">
              {field.label}
            </label>
            <Selectbox
              id={`users-${field.name}`}
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
