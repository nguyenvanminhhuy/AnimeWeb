import { paths } from '@/config/paths';
import type { Comment } from '@/types/comment';

export const commentStatusLabels: Record<Comment['status'], string> = {
  visible: 'Đang hiển thị',
  hidden: 'Đã ẩn',
  deleted: 'Đã xoá',
};
export const commentStatusClasses: Record<Comment['status'], string> = {
  visible: 'tw:text-[#9fe3c2]',
  hidden: 'tw:text-[#e6c48d]',
  deleted: 'tw:text-[var(--aw-muted)]',
};
export function readCommentQuery(params: URLSearchParams) {
  const page = Number(params.get('page'));
  const pageSize = Number(params.get('pageSize'));
  const status = params.get('status') ?? '';
  return {
    q: (params.get('q') ?? '').trim().slice(0, 200),
    animeId: params.get('animeId') ?? '',
    commentId: params.get('commentId') ?? '',
    status: ['visible', 'hidden', 'deleted'].includes(status) ? (status as Comment['status']) : '',
    sort: ['oldest', 'updated'].includes(params.get('sort') ?? '') ? params.get('sort')! : 'newest',
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    pageSize: [5, 10, 20].includes(pageSize) ? pageSize : 10,
  };
}
export function commentsHref(params: URLSearchParams, updates: Record<string, string | null>) {
  const next = new URLSearchParams(params);
  for (const [key, value] of Object.entries(updates)) {
    if (value) next.set(key, value);
    else next.delete(key);
  }
  return `${paths.adminComments}${next.size ? `?${next}` : ''}`;
}
export function commentDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(value));
}
