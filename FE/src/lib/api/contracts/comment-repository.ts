import type { Comment, CommentActor, CommentState } from '@/types/comment';
export interface CommentRepository {
  list(
    animeId: string,
    query: { page: number; pageSize: number },
    state: CommentState,
    signal: AbortSignal,
  ): Promise<{ data: Comment[]; meta: import('@/lib/api/backend/types').PageMeta }>;
  create(actor: CommentActor, animeId: string, body: string, signal: AbortSignal): Promise<void>;
  update(
    actor: CommentActor,
    id: string,
    body: string,
    version: number,
    signal: AbortSignal,
  ): Promise<void>;
  remove(actor: CommentActor, id: string, version: number, signal: AbortSignal): Promise<void>;
}
