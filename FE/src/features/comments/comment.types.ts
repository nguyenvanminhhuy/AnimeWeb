import type { DemoUser } from '../auth/auth.types';
export interface Comment {
  id: string;
  animeId: string;
  userId: string;
  authorName: string;
  body: string;
  status: 'visible' | 'hidden' | 'deleted';
  createdAt: string;
  updatedAt: string;
}
export interface CommentActor {
  id: DemoUser;
  displayName: string;
  permissions: readonly string[];
}
export type CommentState = 'ready' | 'empty' | 'error' | 'loading';
