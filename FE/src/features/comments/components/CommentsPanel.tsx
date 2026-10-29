import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useComments } from '../hooks/useComments';
import { paths } from '../../../routes/paths';
import { ContentState } from '../../../components/common/ContentState';
import { Pagination } from '../../../components/common/Pagination';

export function CommentsPanel({ animeId }: { animeId: string }) {
  const comments = useComments(animeId);
  const location = useLocation();
  const [params] = useSearchParams();
  const [body, setBody] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const returnTo = location.pathname + location.search;
  const date = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return (
    <section
      className="aw-detail-section aw-comments"
      id="comments"
      aria-labelledby="comments-title"
      aria-busy={comments.loading}
      data-comment-page={comments.page}
    >
      <div className="aw-detail-section-heading tw:gap-4.5 tw:flex tw:items-center tw:justify-between tw:mb-4.5 tw:max-mobile:items-start tw:max-mobile:flex-wrap">
        <div>
          <span className="aw-eyebrow">CÙNG NHAU CHIA SẺ CẢM NHẬN</span>
          <h2 id="comments-title">
            Bình luận <span>{comments.loading ? '…' : comments.total}</span>
          </h2>
        </div>
        <span className="aw-detail-demo-label tw:px-1.75 tw:py-1 tw:text-body tw:rounded-[4px] tw:whitespace-nowrap">
          MẪU · CỤC BỘ
        </span>
      </div>
      <p className="aw-comments-description tw:text-body tw:leading-[1.9] tw:mb-5">
        Bình luận demo hiển thị công khai trên trình duyệt này. Chỉ tác giả có thể sửa hoặc xóa bình
        luận của mình.
      </p>
      {!comments.user ? (
        <div className="aw-comments-invitation tw:p-5 tw:rounded-[8px] tw:mb-6">
          <p>Đăng nhập demo để chia sẻ cảm nhận của bạn.</p>
          <Button
            as="link"
            variant="glass"
            to={paths.loginTo(returnTo)}
            label="Đăng nhập để bình luận"
            endIcon={<Icon name="external-link" size="sm" />}
          />
        </div>
      ) : !comments.canCreate ? (
        <p
          className="aw-detail-empty tw:px-5 tw:py-6.25 tw:rounded-[8px] tw:text-body tw:leading-[1.9]"
          role="status"
        >
          Tài khoản hiện tại chưa có quyền viết bình luận.
        </p>
      ) : (
        <form
          className="aw-comment-form tw:gap-2.5 tw:grid tw:mb-6.25"
          onSubmit={async (event) => {
            event.preventDefault();
            if (await comments.mutate('create', '', body)) setBody('');
            else input.current?.focus();
          }}
        >
          <label htmlFor="comment-body">Cảm nhận của bạn</label>
          <textarea
            ref={input}
            id="comment-body"
            value={body}
            maxLength={2000}
            rows={4}
            onChange={(event) => setBody(event.target.value)}
            disabled={comments.pending}
            placeholder="Chia sẻ về câu chuyện, tránh tiết lộ nội dung quan trọng…"
            aria-describedby="comment-length"
          />
          <div>
            <span id="comment-length">{body.length}/2000 ký tự</span>
            <Button
              variant="primary"
              disabled={comments.pending || comments.loading}
              type="submit"
              label={comments.pending ? 'Đang lưu…' : 'Gửi bình luận'}
            />
          </div>
        </form>
      )}
      {comments.actionError && (
        <p className="aw-comment-error tw:p-3 tw:text-body tw:rounded-[6px]" role="alert">
          {comments.actionError}
        </p>
      )}
      {comments.notice && (
        <p className="aw-comment-notice tw:text-body" role="status">
          {comments.notice}
        </p>
      )}
      {comments.error ? (
        <ContentState
          title="Chưa tải được bình luận"
          description={comments.error}
          retry={comments.retry}
        />
      ) : comments.loading ? (
        <p role="status">Đang tải bình luận…</p>
      ) : !comments.total ? (
        <p className="aw-detail-empty tw:px-5 tw:py-6.25 tw:rounded-[8px] tw:text-body tw:leading-[1.9]">
          Chưa có bình luận. Hãy là người đầu tiên chia sẻ cảm nhận.
        </p>
      ) : (
        <>
          <div className="aw-comment-list tw:gap-5.5 tw:grid tw:mt-6.25">
            {comments.items.map((comment) => {
              const own = comment.userId === comments.user;
              return (
                <article
                  className="aw-comment tw:gap-3.5 tw:flex tw:pb-5"
                  key={comment.id}
                  data-comment-id={comment.id}
                >
                  <div
                    className="aw-comment-avatar tw:w-8.75 tw:h-8.75 tw:rounded-[50%] tw:grid tw:place-items-center tw:text-body tw:shrink-0"
                    aria-hidden="true"
                  >
                    {comment.authorName.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="aw-comment-content tw:min-w-0 tw:flex-1">
                    <header>
                      <h3>
                        {comment.authorName}
                        {own && <span> · Bạn</span>}
                      </h3>
                      <time dateTime={comment.createdAt}>
                        {date.format(new Date(comment.createdAt))}
                      </time>
                    </header>
                    {editing === comment.id ? (
                      <form
                        onSubmit={async (event) => {
                          event.preventDefault();
                          if (await comments.mutate('update', comment.id, editBody))
                            setEditing(null);
                        }}
                        className="aw-comment-edit tw:gap-2.5 tw:grid tw:mb-6.25"
                      >
                        <label className="visually-hidden" htmlFor={`edit-${comment.id}`}>
                          Sửa bình luận của bạn
                        </label>
                        <textarea
                          id={`edit-${comment.id}`}
                          value={editBody}
                          onChange={(event) => setEditBody(event.target.value)}
                          maxLength={2000}
                          rows={3}
                          disabled={comments.pending}
                          autoFocus
                        />
                        <div>
                          <Button
                            variant="primary"
                            disabled={comments.pending}
                            type="submit"
                            label="Lưu bình luận"
                          />
                          <Button
                            type="button"
                            variant="quiet"
                            disabled={comments.pending}
                            onClick={() => setEditing(null)}
                            label="Hủy sửa"
                          />
                        </div>
                      </form>
                    ) : (
                      <p>{comment.body}</p>
                    )}
                    {own && comments.canCreate && (
                      <div className="aw-comment-actions tw:gap-3.75 tw:flex tw:mt-2.5">
                        {comments.permissions.includes('comment:update:own') && (
                          <Button
                            variant="unstyled"
                            disabled={comments.pending || editing === comment.id}
                            onClick={() => {
                              setDeleting(null);
                              setEditing(comment.id);
                              setEditBody(comment.body);
                            }}
                            label="Sửa"
                          />
                        )}
                        {comments.permissions.includes('comment:delete:own') && (
                          <Button
                            variant="unstyled"
                            disabled={comments.pending}
                            onClick={() => {
                              setEditing(null);
                              setDeleting(comment.id);
                            }}
                            label="Xóa"
                          />
                        )}
                      </div>
                    )}
                    {deleting === comment.id && (
                      <div
                        className="aw-comment-confirm tw:mt-3 tw:pl-3"
                        role="group"
                        aria-label="Xác nhận xóa bình luận"
                      >
                        <p>Xóa bình luận này?</p>
                        <Button
                          variant="glass"
                          disabled={comments.pending}
                          onClick={async () => {
                            if (await comments.mutate('remove', comment.id)) {
                              setDeleting(null);
                              input.current?.focus();
                            }
                          }}
                          label="Xác nhận xóa"
                        />
                        <Button
                          variant="quiet"
                          disabled={comments.pending}
                          onClick={() => setDeleting(null)}
                          label="Hủy xóa"
                        />
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          <Pagination
            label="Phân trang bình luận"
            page={comments.page}
            totalPages={comments.totalPages}
            hrefForPage={(page) => {
              const next = new URLSearchParams(params);
              next.set('commentPage', String(page));
              return location.pathname + '?' + next;
            }}
          />
        </>
      )}
    </section>
  );
}
