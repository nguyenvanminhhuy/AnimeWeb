import { mockAnimeRepository } from '@/lib/api/mock/mock-anime-repository';
export const animeRepository = mockAnimeRepository;
import { localDemoAuthRepository } from '@/lib/storage/local-demo-auth-repository';
export const authRepository = localDemoAuthRepository;
import { localCommentRepository } from '@/lib/storage/local-comment-repository';
export const commentRepository = localCommentRepository;
import { mockPlaybackRepository } from '@/lib/api/mock/mock-playback-repository';
export const playbackRepository = mockPlaybackRepository;
