import type { Comment } from '@/types/comment';

export type ModerationAction = 'hide' | 'restore';
export interface CommentModeration {
  action: ModerationAction;
  reason: string;
  moderatorName: string;
  moderatedAt: string;
}
export interface AdminComment extends Omit<Comment, 'body'> {
  version: number;
  body: string | null;
  lastModeration: CommentModeration | null;
}
export interface AdminCommentCatalog {
  comments: AdminComment[];
  anime: { id: string; title: string; publicSlug: string | null }[];
}

export interface AdminCommentPage extends AdminCommentCatalog {
  meta: import('@/lib/api/backend/types').PageMeta;
  summary: { total: number; visible: number; hidden: number; deleted: number };
  selectedComment: AdminComment | null;
}
