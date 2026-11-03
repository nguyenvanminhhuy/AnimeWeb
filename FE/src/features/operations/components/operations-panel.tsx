import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ContentState } from '@/components/common/content-state';
import { operationsRepository } from '@/lib/api/repositories';
import type { Operations } from '@/types/operations';

export function OperationsPanel() {
  const [data, setData] = useState<Operations>();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    void operationsRepository
      .get(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError('Chưa tải được trạng thái vận hành.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);
  return (
    <>
      <div className="tw:flex tw:justify-between tw:gap-4 tw:mb-5">
        <h1 className="tw:text-3xl">Giám sát vận hành</h1>
        <Button label="Làm mới" loading={loading} onClick={() => setAttempt((x) => x + 1)} />
      </div>
      <p className="tw:text-[var(--aw-muted)]">
        Thống kê của tiến trình BE hiện tại, tính từ lần khởi động. P95 là cận trên theo nhóm thời
        gian.
      </p>
      {error ? (
        <ContentState
          title={error}
          description="Kiểm tra kết nối BE rồi thử lại."
          retry={() => setAttempt((x) => x + 1)}
        />
      ) : !data ? (
        <p role="status">Đang tải trạng thái…</p>
      ) : (
        <section aria-busy={loading}>
          <div className="tw:grid tw:grid-cols-3 tw:gap-4 tw:mb-6 tw:max-mobile:grid-cols-1">
            <div className="aw-surface tw:p-4 tw:rounded-xl">
              <h2 className="tw:text-xl">Database</h2>
              <p>
                {data.databaseReady ? 'Kết nối được' : 'Không kết nối được'} ·{' '}
                {data.databaseProbeMs} ms
              </p>
              <p>
                {data.runtime.database.count} lệnh · {data.runtime.database.errors} lỗi
              </p>
              <p>P95 ≤ {data.runtime.database.p95UpperBoundMs} ms</p>
            </div>
            <div className="aw-surface tw:p-4 tw:rounded-xl">
              <h2 className="tw:text-xl">API</h2>
              <p>{data.runtime.activeRequests} request đang xử lý</p>
              <p>Bắt đầu: {new Date(data.runtime.startedAt).toLocaleString('vi-VN')}</p>
            </div>
            <div className="aw-surface tw:p-4 tw:rounded-xl">
              <h2 className="tw:text-xl">Dọn phiên xem</h2>
              <p>
                Lần gần nhất:{' '}
                {data.runtime.cleanup.lastRunAt
                  ? new Date(data.runtime.cleanup.lastRunAt).toLocaleString('vi-VN')
                  : 'Chưa chạy'}
              </p>
              <p>Đã xoá: {data.runtime.cleanup.removed} phiên</p>
              {data.runtime.cleanup.errorType && (
                <p role="alert">Lần chạy gần nhất thất bại: {data.runtime.cleanup.errorType}</p>
              )}
            </div>
          </div>
          <h2 className="tw:text-xl">Lỗi phát do trình duyệt báo</h2>
          <div className="tw:flex tw:flex-wrap tw:gap-4 tw:mb-6">
            {Object.entries(data.runtime.clientPlaybackFailures).map(([kind, count]) => (
              <p key={kind}>
                {kind}: {count}
              </p>
            ))}
          </div>
          <div className="tw:overflow-x-auto">
            <table className="aw-admin-records tw:w-full tw:min-w-200 tw:text-left">
              <caption className="visually-hidden">Thống kê request API</caption>
              <thead>
                <tr>
                  {[
                    'Route',
                    'Request',
                    '5xx',
                    '429',
                    'Trung bình ms',
                    'P95 ≤ ms',
                    'Lớn nhất ms',
                  ].map((label) => (
                    <th className="tw:p-3" scope="col" key={label}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.runtime.requests.map((row) => (
                  <tr className="tw:border-t tw:border-[var(--aw-border)]" key={row.name}>
                    <th scope="row" className="tw:p-3 tw:font-normal">
                      {row.name}
                    </th>
                    {[
                      row.count,
                      row.errors,
                      row.limited,
                      row.averageMs,
                      row.p95UpperBoundMs,
                      row.maxMs,
                    ].map((value, index) => (
                      <td
                        data-label={
                          ['Request', '5xx', '429', 'Trung bình ms', 'P95 ≤ ms', 'Lớn nhất ms'][
                            index
                          ]
                        }
                        className="tw:p-3"
                        key={index}
                      >
                        <div className="aw-admin-record-value">{value}</div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
