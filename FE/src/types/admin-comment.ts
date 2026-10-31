import type { Comment } from '@/types/comment';

export type ModerationAction = 'hide' | 'restore';
export interface CommentModeration {
  action: ModerationAction;
  reason: string;
  moderatorName: string;
  moderatedAt: string;
}
export interface AdminComment extends Omit<Comment, 'body'> {
  body: string | null;
  lastModeration: CommentModeration | null;
}
export interface AdminCommentCatalog {
  comments: AdminComment[];
  anime: { id: string; title: string; publicSlug: string | null }[];
}
