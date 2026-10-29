import { useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
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
      <div className="aw-detail-section-heading">
        <div>
          <span className="aw-eyebrow">CÙNG NHAU CHIA SẺ CẢM NHẬN</span>
          <h2 id="comments-title">
            Bình luận <span>{comments.loading ? '…' : comments.total}</span>
          </h2>
        </div>
        <span className="aw-detail-demo-label">MẪU · CỤC BỘ</span>
      </div>
      <p className="aw-comments-description">
        Bình luận demo hiển thị công khai trên trình duyệt này. Chỉ tác giả có thể sửa hoặc xóa bình
        luận của mình.
      </p>
      {!comments.user ? (
        <div className="aw-comments-invitation">
          <p>Đăng nhập demo để chia sẻ cảm nhận của bạn.</p>
          <Link className="btn aw-btn-glass" to={paths.loginTo(returnTo)}>
            Đăng nhập để bình luận ↗
          </Link>
        </div>
      ) : !comments.canCreate ? (
        <p className="aw-detail-empty" role="status">
          Tài khoản hiện tại chưa có quyền viết bình luận.
        </p>
      ) : (
        <form
          className="aw-comment-form"
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
            <button
              className="btn aw-btn-primary"
              disabled={comments.pending || comments.loading}
              type="submit"
            >
              {comments.pending ? 'Đang lưu…' : 'Gửi bình luận demo'}
            </button>
          </div>
        </form>
      )}
      {comments.actionError && (
        <p className="aw-comment-error" role="alert">
          {comments.actionError}
        </p>
      )}
      {comments.notice && (
        <p className="aw-comment-notice" role="status">
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
        <p className="aw-detail-empty">
          Chưa có bình luận. Hãy là người đầu tiên chia sẻ cảm nhận.
        </p>
      ) : (
        <>
          <div className="aw-comment-list">
            {comments.items.map((comment) => {
              const own = comment.userId === comments.user;
              return (
                <article className="aw-comment" key={comment.id} data-comment-id={comment.id}>
                  <div className="aw-comment-avatar" aria-hidden="true">
                    {comment.authorName.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="aw-comment-content">
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
                        className="aw-comment-edit"
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
                          <button
                            className="btn aw-btn-primary"
                            disabled={comments.pending}
                            type="submit"
                          >
                            Lưu bình luận
                          </button>
                          <button
                            type="button"
                            className="btn aw-btn-quiet"
                            disabled={comments.pending}
                            onClick={() => setEditing(null)}
                          >
                            Hủy sửa
                          </button>
                        </div>
                      </form>
                    ) : (
                      <p>{comment.body}</p>
                    )}
                    {own && comments.canCreate && (
                      <div className="aw-comment-actions">
                        {comments.permissions.includes('comment:update:own') && (
                          <button
                            disabled={comments.pending || editing === comment.id}
                            onClick={() => {
                              setDeleting(null);
                              setEditing(comment.id);
                              setEditBody(comment.body);
                            }}
                          >
                            Sửa
                          </button>
                        )}
                        {comments.permissions.includes('comment:delete:own') && (
                          <button
                            disabled={comments.pending}
                            onClick={() => {
                              setEditing(null);
                              setDeleting(comment.id);
                            }}
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    )}
                    {deleting === comment.id && (
                      <div
                        className="aw-comment-confirm"
                        role="group"
                        aria-label="Xác nhận xóa bình luận"
                      >
                        <p>Xóa bình luận này?</p>
                        <button
                          className="btn aw-btn-glass"
                          disabled={comments.pending}
                          onClick={async () => {
                            if (await comments.mutate('remove', comment.id)) {
                              setDeleting(null);
                              input.current?.focus();
                            }
                          }}
                        >
                          Xác nhận xóa
                        </button>
                        <button
                          className="btn aw-btn-quiet"
                          disabled={comments.pending}
                          onClick={() => setDeleting(null)}
                        >
                          Hủy xóa
                        </button>
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
