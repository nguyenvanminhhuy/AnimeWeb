import { useEffect, useState } from 'react';
import { Form, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Selectbox } from '@/components/ui/selectbox';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/common/pagination';
import { ContentState } from '@/components/common/content-state';
import { adminAuditRepository } from '@/lib/api/repositories';
import { paths } from '@/config/paths';
import type { AuditQuery, AuditResult } from '@/types/audit';

const actions: Record<string, string> = {
  create: 'Thêm',
  update: 'Sửa',
  delete: 'Xoá',
  archive: 'Lưu trữ',
  restore: 'Khôi phục',
  change_role: 'Đổi vai trò',
  change_status: 'Khoá / mở khoá',
  moderate: 'Kiểm duyệt',
};
const resources: Record<string, string> = {
  anime: 'Phim',
  genre: 'Thể loại',
  season: 'Mùa/phần',
  episode: 'Tập phim',
  source: 'Nguồn phát',
  subtitle: 'Phụ đề',
  account: 'Tài khoản',
  comment: 'Bình luận',
};
export function AuditLog() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page'));
  const query: AuditQuery = {
    q: (params.get('q') ?? '').slice(0, 200),
    action: params.get('action') ?? '',
    resourceType: params.get('resourceType') ?? '',
    page: Number.isSafeInteger(page) && page > 0 && page <= 2147483647 ? page : 1,
    pageSize: params.get('pageSize') === '50' ? 50 : 20,
  };
  const key = JSON.stringify(query);
  const [attempt, setAttempt] = useState(0);
  const [response, setResponse] = useState<{ key: string; result?: AuditResult; error?: string }>();
  useEffect(() => {
    const controller = new AbortController();
    void adminAuditRepository
      .list(JSON.parse(key) as AuditQuery, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setResponse({ key, result });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setResponse({ key, error: 'Không thể tải lịch sử quản trị.' });
      });
    return () => controller.abort();
  }, [key, attempt]);
  const result = response?.key === key ? response.result : undefined;
  const error = response?.key === key ? response.error : undefined;
  const loading = !result && !error;
  const href = (page: number) => {
    const next = new URLSearchParams(params);
    next.set('page', String(page));
    return `${paths.adminAudit}?${next}`;
  };
  const paginate = {
    showSinglePage: true,
    page: query.page,
    totalPages: result?.meta.totalPages ?? 0,
    hrefForPage: href,
    disabled: loading || !!error,
  };
  return (
    <>
      <h1 className="tw:text-3xl">Lịch sử quản trị</h1>
      <p className="tw:text-[var(--aw-muted)]">
        Các thao tác đã ghi thành công từ khi bật nhật ký.
      </p>
      <Form
        method="get"
        action={paths.adminAudit}
        key={key}
        className="tw:flex tw:flex-wrap tw:items-end tw:gap-3 tw:mb-5"
      >
        <label className="tw:flex-1">
          Tìm người hoặc đối tượng
          <Input className="tw:mt-2" name="q" maxLength={200} defaultValue={query.q} />
        </label>
        <label>
          Thao tác
          <Selectbox
            className="tw:mt-2"
            name="action"
            defaultValue={query.action}
            options={[
              { value: '', label: 'Tất cả' },
              ...Object.entries(actions).map(([value, label]) => ({ value, label })),
            ]}
          />
        </label>
        <label>
          Đối tượng
          <Selectbox
            className="tw:mt-2"
            name="resourceType"
            defaultValue={query.resourceType}
            options={[
              { value: '', label: 'Tất cả' },
              ...Object.entries(resources).map(([value, label]) => ({ value, label })),
            ]}
          />
        </label>
        <Input type="hidden" name="pageSize" value={query.pageSize} />
        <Button type="submit" label="Lọc" />
      </Form>
      <Pagination
        {...paginate}
        label="Phân trang lịch sử quản trị phía trên"
        pageSizeControl={{
          value: query.pageSize,
          options: [20, 50],
          label: 'Mỗi trang',
          onChange: (size) => {
            const next = new URLSearchParams(params);
            next.set('pageSize', String(size));
            next.set('page', '1');
            setParams(next);
          },
        }}
      />
      <section aria-busy={loading} className="tw:my-4">
        {error ? (
          <ContentState
            title={error}
            description="Thử tải lại danh sách."
            retry={() => {
              setResponse(undefined);
              setAttempt((x) => x + 1);
            }}
          />
        ) : loading ? (
          <p role="status">Đang tải lịch sử…</p>
        ) : !result?.data.length ? (
          <ContentState
            title="Chưa có thao tác phù hợp"
            description="Thử thay đổi bộ lọc hoặc quay lại sau khi có thao tác quản trị."
          />
        ) : (
          <div className="tw:overflow-x-auto">
            <table className="aw-admin-records tw:w-full tw:min-w-200 tw:text-left">
              <caption className="visually-hidden">Nhật ký thao tác quản trị</caption>
              <thead>
                <tr>
                  {['Thời gian', 'Người thực hiện', 'Thao tác', 'Đối tượng', 'Trường thay đổi'].map(
                    (label) => (
                      <th key={label} scope="col" className="tw:p-3">
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {result.data.map((row) => (
                  <tr key={row.id} className="tw:border-t tw:border-[var(--aw-border)]">
                    <td data-label="Thời gian" className="tw:p-3 tw:whitespace-nowrap">
                      <div className="aw-admin-record-value">
                        {new Date(row.occurredAt).toLocaleString('vi-VN')}
                      </div>
                    </td>
                    <td data-label="Người thực hiện" className="tw:p-3">
                      <div className="aw-admin-record-value">
                        {row.actorName}
                        <br />
                        <span className="tw:text-[var(--aw-muted)]">{row.actorId}</span>
                      </div>
                    </td>
                    <td data-label="Thao tác" className="tw:p-3">
                      <div className="aw-admin-record-value">
                        {actions[row.action] ?? row.action}
                      </div>
                    </td>
                    <td data-label="Đối tượng" className="tw:p-3 tw:break-words">
                      <div className="aw-admin-record-value">
                        {resources[row.resourceType] ?? row.resourceType}: {row.targetLabel}
                        <br />
                        {row.resourceId}
                      </div>
                    </td>
                    <td data-label="Trường thay đổi" className="tw:p-3">
                      <div className="aw-admin-record-value">
                        {row.changedFields.join(', ') || '—'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {!!result?.data.length && (
        <Pagination {...paginate} label="Phân trang lịch sử quản trị phía dưới" />
      )}
    </>
  );
}
