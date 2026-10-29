import type { Comment, CommentActor, CommentState } from '@/types/comment';
export interface CommentRepository {
  list(animeId: string, state: CommentState, signal: AbortSignal): Promise<Comment[]>;
  create(actor: CommentActor, animeId: string, body: string, signal: AbortSignal): Promise<void>;
  update(actor: CommentActor, id: string, body: string, signal: AbortSignal): Promise<void>;
  remove(actor: CommentActor, id: string, signal: AbortSignal): Promise<void>;
}
