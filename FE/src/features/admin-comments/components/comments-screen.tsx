import { useEffect, useRef, useState } from 'react';
import { Form, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Selectbox } from '@/components/ui/selectbox';
import { Avatar } from '@/components/ui/avatar';
import { ContentState } from '@/components/common/content-state';
import { Pagination } from '@/components/common/pagination';
import { paths } from '@/config/paths';
import { normalizeSearch } from '@/utils/search';
import type { AdminComment, ModerationAction } from '@/types/admin-comment';
import { useCommentCatalog } from '@/features/admin-comments/hooks/use-comment-catalog';
import { ModerationDialog } from '@/features/admin-comments/components/moderation-dialog';
import {
  commentDate,
  commentStatusClasses,
  commentStatusLabels,
  commentsHref,
  readCommentQuery,
} from '@/features/admin-comments/utils/comment-query';

export function CommentsScreen() {
  const [params, setParams] = useSearchParams();
  const query = readCommentQuery(params);
  const { q, animeId, status, sort, pageSize, commentId } = query;
  const mock = import.meta.env.DEV ? params.get('mock') : null;
  const { data, loading, error, canRead, canModerate, session, refresh } = useCommentCatalog(
    mock === 'error',
  );
  const [search, setSearch] = useState(q);
  const [composing, setComposing] = useState(false);
  const [target, setTarget] = useState<{ comment: AdminComment; action: ModerationAction } | null>(
    null,
  );
  const [notice, setNotice] = useState('');
  const listHeading = useRef<HTMLHeadingElement>(null);
  const panelHeading = useRef<HTMLHeadingElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const previousSelection = useRef('');
  useEffect(() => {
    setSearch(q);
  }, [q]);
  useEffect(() => {
    if (composing || search.trim().slice(0, 200) === q) return;
    const timer = setTimeout(
      () =>
        setParams((current) => {
          const next = new URLSearchParams(current);
          next.delete('page');
          next.delete('commentId');
          if (search.trim()) next.set('q', search.trim().slice(0, 200));
          else next.delete('q');
          return next;
        }),
      350,
    );
    return () => clearTimeout(timer);
  }, [composing, search, q, setParams]);
  const selected = data?.comments.find((row) => row.id === commentId);
  const items = mock === 'empty' ? [] : (data?.comments ?? []);
  const rows = items
    .filter(
      (row) =>
        (!animeId || row.animeId === animeId) &&
        (!status || row.status === status) &&
        (!q ||
          normalizeSearch(`${row.body ?? ''} ${row.authorName} ${row.userId} ${row.id}`).includes(
            normalizeSearch(q),
          )),
    )
    .sort((a, b) => {
      const field = sort === 'updated' ? 'updatedAt' : 'createdAt';
      return (
        (sort === 'oldest' ? 1 : -1) * (Date.parse(a[field]) - Date.parse(b[field])) ||
        a.id.localeCompare(b.id)
      );
    });
  const totalPages = Math.ceil(rows.length / pageSize);
  const page = Math.min(query.page, Math.max(1, totalPages));
  useEffect(() => {
    if (!data) return;
    const next = new URLSearchParams(params);
    if (params.has('page') && params.get('page') !== String(page)) next.set('page', String(page));
    if (params.has('pageSize') && params.get('pageSize') !== String(pageSize))
      next.set('pageSize', String(pageSize));
    if (params.has('status') && params.get('status') !== status) next.delete('status');
    if (params.has('sort') && params.get('sort') !== sort) next.set('sort', sort);
    if (params.has('q') && params.get('q') !== q) {
      if (q) next.set('q', q);
      else next.delete('q');
    }
    if (next.toString() !== params.toString())
      setParams(next, { replace: true, preventScrollReset: true });
  }, [data, params, setParams, page, pageSize, status, sort, q]);
  useEffect(() => {
    if (!data) return;
    if (commentId) panelHeading.current?.focus();
    else if (previousSelection.current) {
      if (returnFocus.current?.isConnected) returnFocus.current.focus();
      else listHeading.current?.focus();
    }
    previousSelection.current = commentId;
  }, [commentId, data]);
  function change(key: string, value: string) {
    const next = new URLSearchParams(params);
    next.delete('page');
    next.delete('commentId');
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { preventScrollReset: true });
  }
  const film = (id: string) => data?.anime.find((row) => row.id === id);
  if (!canRead)
    return (
      <ContentState
        title="Bạn chưa có quyền xem bình luận quản trị"
        description="Trang này yêu cầu quyền đọc bình luận quản trị."
      />
    );
  return (
    <>
      <header className="tw:flex tw:justify-between tw:items-start tw:gap-4 tw:flex-wrap tw:mb-6">
        <div>
          <p className="aw-eyebrow">CỘNG ĐỒNG</p>
          <h1 className="tw:text-3xl tw:max-phone:text-2xl">Quản lý bình luận</h1>
          <p className="tw:text-[var(--aw-muted)] tw:mb-0">
            Xem thảo luận và kiểm duyệt nội dung theo từng bộ phim.
          </p>
        </div>
        <Button label="Làm mới" variant="quiet" loading={loading} onClick={refresh} />
      </header>
      <p className="tw:p-4 tw:rounded-xl tw:bg-[#a697ff0d] tw:border tw:border-[var(--aw-border)] tw:text-[var(--aw-muted)]">
        Dữ liệu mẫu ·{' '}
        {canModerate
          ? 'Thay đổi kiểm duyệt chỉ lưu trong phiên này, tải lại hoặc đổi phiên sẽ đặt lại.'
          : 'Phiên chỉ đọc. Dùng phiên có quyền chỉnh sửa để kiểm duyệt.'}{' '}
        Không thay đổi bình luận trên trang phim công khai hoặc dữ liệu tài khoản cục bộ.
      </p>
      {notice && (
        <p role="status" className="tw:text-[#9fe3c2]">
          {notice}
        </p>
      )}
      {error ? (
        <ContentState
          title="Chưa tải được bình luận"
          description={error}
          retry={() => {
            const next = new URLSearchParams(params);
            next.delete('mock');
            setParams(next, { replace: true });
            refresh();
          }}
        />
      ) : loading || !data ? (
        <p role="status">Đang tải bình luận…</p>
      ) : (
        <div data-admin-comments="ready" className="tw:grid tw:gap-6 tw:min-w-0">
          <div className="tw:grid tw:grid-cols-4 tw:gap-4 tw:max-phone:grid-cols-2">
            {[
              { key: 'total', label: 'Tổng bình luận', count: items.length },
              ...(['visible', 'hidden', 'deleted'] as const).map((key) => ({
                key,
                label: commentStatusLabels[key],
                count: items.filter((row) => row.status === key).length,
              })),
            ].map((item) => (
              <div key={item.key} className="aw-surface tw:rounded-xl tw:p-4">
                <span className="tw:block tw:text-[var(--aw-muted)]">{item.label}</span>
                <strong data-comment-count={item.key} className="tw:block tw:text-2xl tw:mt-2">
                  {item.count}
                </strong>
              </div>
            ))}
          </div>
          <Form
            method="get"
            onSubmit={(e) => {
              e.preventDefault();
              change('q', search.trim());
            }}
            className="aw-surface tw:rounded-xl tw:p-5 tw:grid tw:grid-cols-4 tw:gap-4 tw:max-tablet:grid-cols-2 tw:max-phone:grid-cols-1"
          >
            <div>
              <label htmlFor="comments-search">Tìm bình luận</label>
              <Input
                id="comments-search"
                type="search"
                maxLength={200}
                value={search}
                placeholder="Nội dung, tác giả hoặc mã"
                onChange={(e) => setSearch(e.target.value)}
                onCompositionStart={() => setComposing(true)}
                onCompositionEnd={() => setComposing(false)}
              />
            </div>
            <div>
              <label htmlFor="comments-anime">Phim</label>
              <Selectbox
                id="comments-anime"
                value={animeId}
                onChange={(e) => change('animeId', e.target.value)}
                options={[
                  { value: '', label: 'Tất cả phim' },
                  ...data.anime.map((row) => ({ value: row.id, label: row.title })),
                ]}
              />
            </div>
            <div>
              <label htmlFor="comments-status">Trạng thái</label>
              <Selectbox
                id="comments-status"
                value={status}
                onChange={(e) => change('status', e.target.value)}
                options={[
                  { value: '', label: 'Tất cả trạng thái' },
                  ...Object.entries(commentStatusLabels).map(([value, label]) => ({
                    value,
                    label,
                  })),
                ]}
              />
            </div>
            <div>
              <label htmlFor="comments-sort">Sắp xếp</label>
              <Selectbox
                id="comments-sort"
                value={sort}
                onChange={(e) => change('sort', e.target.value)}
                options={[
                  { value: 'newest', label: 'Mới nhất' },
                  { value: 'oldest', label: 'Cũ nhất' },
                  { value: 'updated', label: 'Cập nhật gần nhất' },
                ]}
              />
            </div>
          </Form>
          <div
            className={`tw:grid tw:gap-6 tw:items-start tw:min-w-0 ${commentId ? 'tw:grid-cols-[minmax(0,1fr)_360px] tw:max-tablet:grid-cols-1' : 'tw:grid-cols-1'}`}
          >
            <section aria-labelledby="comments-heading" className="tw:min-w-0">
              <div className="tw:flex tw:justify-between tw:items-center tw:gap-3 tw:flex-wrap tw:mb-4">
                <h2
                  id="comments-heading"
                  ref={listHeading}
                  tabIndex={-1}
                  className="tw:text-xl tw:mb-0"
                >
                  Danh sách bình luận ({rows.length})
                </h2>
              </div>
              <Pagination
                showSinglePage
                pageSizeControl={{
                  value: pageSize,
                  options: [5, 10, 20],
                  label: 'Số dòng mỗi trang',
                  onChange: (value) => change('pageSize', String(value)),
                }}
                label="Phân trang bình luận quản trị phía trên"
                page={page}
                totalPages={totalPages}
                hrefForPage={(next) => commentsHref(params, { page: String(next) })}
                className="tw:mb-4"
              />
              {!rows.length ? (
                <ContentState
                  title="Không có bình luận phù hợp"
                  description="Thử đổi từ khoá, phim hoặc trạng thái lọc."
                />
              ) : (
                <>
                  <div
                    role="region"
                    aria-label="Bảng bình luận"
                    tabIndex={0}
                    className="aw-surface tw:rounded-xl tw:overflow-x-auto tw:border tw:border-[var(--aw-border)]"
                  >
                    <table className="tw:w-full tw:min-w-160 tw:mb-0 tw:text-left">
                      <caption className="visually-hidden">
                        Bình luận mẫu quản trị, nội dung đã xoá được lược bỏ
                      </caption>
                      <thead>
                        <tr>
                          {['Tác giả / Nội dung', 'Phim', 'Trạng thái / Ngày gửi', 'Chi tiết'].map(
                            (label) => (
                              <th
                                key={label}
                                scope="col"
                                className="tw:p-4 tw:font-medium tw:text-[var(--aw-muted)]"
                              >
                                {label}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice((page - 1) * pageSize, page * pageSize).map((row) => (
                          <tr
                            key={row.id}
                            data-comment-id={row.id}
                            className="tw:border-t tw:border-[var(--aw-border)]"
                          >
                            <th scope="row" className="tw:p-4 tw:font-normal tw:max-w-80">
                              <div className="tw:flex tw:gap-3 tw:items-center tw:mb-2">
                                <Avatar name={row.authorName} size="sm" />
                                <strong>{row.authorName}</strong>
                              </div>
                              <p className="tw:line-clamp-2 tw:break-words tw:mb-0 tw:text-[var(--aw-muted)]">
                                {row.body ?? 'Nội dung đã được xoá.'}
                              </p>
                            </th>
                            <td className="tw:p-4 tw:min-w-36">
                              {film(row.animeId)?.title ?? 'Phim không còn trong danh mục'}
                            </td>
                            <td className="tw:p-4 tw:whitespace-nowrap">
                              <span className={commentStatusClasses[row.status]}>
                                {commentStatusLabels[row.status]}
                              </span>
                              <time
                                dateTime={row.createdAt}
                                className="tw:block tw:mt-1 tw:text-[var(--aw-muted)]"
                              >
                                {commentDate(row.createdAt)}
                              </time>
                            </td>
                            <td className="tw:p-4">
                              <Button
                                as="link"
                                to={commentsHref(params, { commentId: row.id })}
                                label="Xem nội dung"
                                aria-label={`Xem bình luận ${row.id}`}
                                variant="quiet"
                                size="sm"
                                onClick={(e) => {
                                  returnFocus.current = e.currentTarget;
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    showSinglePage
                    label="Phân trang bình luận quản trị"
                    page={page}
                    totalPages={totalPages}
                    hrefForPage={(next) => commentsHref(params, { page: String(next) })}
                    className="tw:mt-5"
                  />
                </>
              )}
            </section>
            {commentId && (
              <section
                aria-labelledby="comment-detail-heading"
                className="aw-surface tw:rounded-xl tw:p-5 tw:min-w-0"
              >
                <div className="tw:flex tw:justify-between tw:items-start tw:gap-3 tw:mb-5">
                  <h2
                    ref={panelHeading}
                    tabIndex={-1}
                    id="comment-detail-heading"
                    className="tw:text-xl tw:mb-0"
                  >
                    Nội dung bình luận
                  </h2>
                  <Button
                    as="link"
                    to={commentsHref(params, { commentId: null })}
                    label="Đóng"
                    size="sm"
                    variant="quiet"
                  />
                </div>
                {!selected ? (
                  <ContentState
                    title="Không tìm thấy bình luận"
                    description="ID không tồn tại trong phiên mẫu. Đóng chi tiết và chọn bình luận khác."
                  />
                ) : (
                  <div data-comment-detail={selected.id} className="tw:grid tw:gap-4">
                    <div className="tw:flex tw:gap-3 tw:items-center">
                      <Avatar name={selected.authorName} />
                      <div className="tw:min-w-0">
                        <strong className="tw:break-words">{selected.authorName}</strong>
                        <span className={`tw:block ${commentStatusClasses[selected.status]}`}>
                          {commentStatusLabels[selected.status]}
                        </span>
                      </div>
                    </div>
                    <p className="tw:whitespace-pre-wrap tw:break-words tw:leading-relaxed tw:mb-0">
                      {selected.body ??
                        'Bình luận đã được tác giả xoá. Nội dung không còn được cung cấp.'}
                    </p>
                    <dl className="tw:mb-0 tw:grid tw:gap-2 tw:text-[var(--aw-muted)]">
                      {[
                        ['Mã bình luận', selected.id],
                        ['Mã tác giả', selected.userId],
                        ['Phim', film(selected.animeId)?.title ?? 'Phim không còn trong danh mục'],
                        ['Ngày gửi', commentDate(selected.createdAt)],
                        ['Cập nhật', commentDate(selected.updatedAt)],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <dt className="tw:font-medium">{label}</dt>
                          <dd className="tw:mb-0 tw:break-words">{value}</dd>
                        </div>
                      ))}
                    </dl>
                    {selected.lastModeration && (
                      <div className="tw:rounded-xl tw:p-4 tw:bg-[#ffffff04] tw:border tw:border-[var(--aw-border)]">
                        <h3 className="tw:text-body tw:font-semibold">Kiểm duyệt gần nhất</h3>
                        <p className="tw:mb-1">
                          {selected.lastModeration.action === 'hide' ? 'Ẩn' : 'Hiện lại'} ·{' '}
                          {selected.lastModeration.moderatorName}
                        </p>
                        <p className="tw:break-words tw:mb-1">{selected.lastModeration.reason}</p>
                        <time
                          dateTime={selected.lastModeration.moderatedAt}
                          className="tw:text-[var(--aw-muted)]"
                        >
                          {commentDate(selected.lastModeration.moderatedAt)}
                        </time>
                      </div>
                    )}
                    {selected.status === 'deleted' ? (
                      <p className="tw:text-[var(--aw-muted)] tw:mb-0">
                        Bình luận đã xoá không thể được khôi phục hoặc kiểm duyệt.
                      </p>
                    ) : canModerate ? (
                      <Button
                        label={
                          selected.status === 'visible' ? 'Ẩn bình luận' : 'Hiện lại bình luận'
                        }
                        onClick={() =>
                          setTarget({
                            comment: selected,
                            action: selected.status === 'visible' ? 'hide' : 'restore',
                          })
                        }
                      />
                    ) : (
                      <p className="tw:text-[var(--aw-muted)] tw:mb-0">
                        Phiên chỉ có quyền xem nội dung bình luận.
                      </p>
                    )}
                    {film(selected.animeId)?.publicSlug && (
                      <Button
                        as="link"
                        variant="quiet"
                        label="Xem trang phim"
                        to={paths.animeDetail(film(selected.animeId)!.publicSlug!)}
                      />
                    )}
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      )}
      {target && canModerate && session && (
        <ModerationDialog
          key={`${target.comment.id}:${target.action}`}
          comment={target.comment}
          action={target.action}
          session={session}
          fail={mock === 'moderation-error'}
          onClose={() => setTarget(null)}
          onSaved={() => {
            setTarget(null);
            setNotice(
              target.action === 'hide'
                ? 'Đã ẩn bình luận trong phiên mẫu.'
                : 'Đã hiện lại bình luận trong phiên mẫu.',
            );
            refresh();
          }}
        />
      )}
    </>
  );
}
