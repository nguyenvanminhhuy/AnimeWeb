import type { CommentRepository } from '@/lib/api/contracts/comment-repository';
import type { Comment, CommentActor, CommentState } from '@/types/comment';
import { isDemoUser } from '@/utils/auth';
import { commentFixtures } from '@/testing/mocks/fixtures/comments';
import { anime } from '@/testing/mocks/fixtures/anime';

const prefix = 'aw:comments:v1:';
function read(userId: string): Comment[] {
  try {
    const raw = localStorage.getItem(prefix + userId);
    if (raw === null) return [];
    const value = JSON.parse(raw);
    if (
      value?.version !== 1 ||
      !Array.isArray(value.comments) ||
      !value.comments.every(
        (item: Comment) =>
          item &&
          typeof item.id === 'string' &&
          item.userId === userId &&
          typeof item.animeId === 'string' &&
          typeof item.authorName === 'string' &&
          typeof item.body === 'string' &&
          item.body.length <= 2000 &&
          ['visible', 'hidden', 'deleted'].includes(item.status) &&
          typeof item.createdAt === 'string' &&
          typeof item.updatedAt === 'string' &&
          Number.isFinite(Date.parse(item.createdAt)) &&
          Number.isFinite(Date.parse(item.updatedAt)),
      )
    )
      throw new Error('Invalid data');
    if (new Set(value.comments.map((item: Comment) => item.id)).size !== value.comments.length)
      throw new Error('Duplicate IDs');
    return value.comments;
  } catch {
    throw new Error('Không đọc được bình luận cục bộ. Dữ liệu cũ chưa bị ghi đè.');
  }
}
function save(id: string, comments: Comment[]) {
  try {
    localStorage.setItem(prefix + id, JSON.stringify({ version: 1, comments }));
  } catch {
    throw new Error(
      'Không lưu được bình luận. Hãy kiểm tra quyền lưu trữ của trình duyệt rồi thử lại.',
    );
  }
}
function authorize(actor: CommentActor, permission: string) {
  if (!isDemoUser(actor.id) || !actor.permissions.includes(permission))
    throw new Error('Bạn chưa có quyền thực hiện thao tác này.');
}
function bodyValue(body: string) {
  const value = body.trim();
  if (!value || value.length > 2000) throw new Error('Bình luận cần từ 1 đến 2000 ký tự.');
  return value;
}
async function wait(signal: AbortSignal, state: CommentState = 'ready') {
  await new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Cancelled', 'AbortError'));
      return;
    }
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException('Cancelled', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, 180);
    signal.addEventListener('abort', abort, { once: true });
  });
  if (state === 'error') throw new Error('Không thể tải bình luận demo. Vui lòng thử lại.');
}
export const localCommentRepository: CommentRepository = {
  async list(animeId, state, signal) {
    await wait(signal, state);
    if (state === 'empty') return [];
    const stored: Comment[] = [];
    try {
      for (let index = 0; index < localStorage.length; index++) {
        const key = localStorage.key(index);
        if (key?.startsWith(prefix) && isDemoUser(key.slice(prefix.length)))
          stored.push(...read(key.slice(prefix.length)));
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Không đọc được bình luận cục bộ.');
    }
    return [...commentFixtures, ...stored]
      .filter((item) => item.animeId === animeId && item.status === 'visible')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id));
  },
  async create(actor, animeId, body, signal) {
    authorize(actor, 'comment:create');
    const value = bodyValue(body);
    if (!anime.some((item) => item.id === animeId)) throw new Error('Anime không tồn tại.');
    await wait(signal);
    const comments = read(actor.id);
    const time = new Date().toISOString();
    comments.push({
      id: `comment-${crypto.randomUUID()}`,
      animeId,
      userId: actor.id,
      authorName: actor.displayName,
      body: value,
      status: 'visible',
      createdAt: time,
      updatedAt: time,
    });
    save(actor.id, comments);
  },
  async update(actor, id, body, signal) {
    authorize(actor, 'comment:update:own');
    const value = bodyValue(body);
    await wait(signal);
    const comments = read(actor.id);
    const item = comments.find(
      (comment) => comment.id === id && comment.userId === actor.id && comment.status === 'visible',
    );
    if (!item) throw new Error('Không thể sửa bình luận không thuộc bạn hoặc không còn hiển thị.');
    item.body = value;
    item.updatedAt = new Date().toISOString();
    save(actor.id, comments);
  },
  async remove(actor, id, signal) {
    authorize(actor, 'comment:delete:own');
    await wait(signal);
    const comments = read(actor.id);
    const item = comments.find(
      (comment) => comment.id === id && comment.userId === actor.id && comment.status === 'visible',
    );
    if (!item) throw new Error('Không thể xóa bình luận không thuộc bạn hoặc không còn hiển thị.');
    item.status = 'deleted';
    item.updatedAt = new Date().toISOString();
    save(actor.id, comments);
  },
};
