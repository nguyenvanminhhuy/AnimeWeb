import type { DemoUser } from '@/types/auth';
export interface Comment {
  version?: number;
  id: string;
  animeId: string;
  userId: string;
  authorName: string;
  authorAvatarUrl?: string | null;
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
