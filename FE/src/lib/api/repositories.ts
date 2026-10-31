import { mockAnimeRepository } from '@/lib/api/mock/mock-anime-repository';
export const animeRepository = mockAnimeRepository;
import { localDemoAuthRepository } from '@/lib/storage/local-demo-auth-repository';
export const authRepository = localDemoAuthRepository;
import { localCommentRepository } from '@/lib/storage/local-comment-repository';
export const commentRepository = localCommentRepository;
import { mockPlaybackRepository } from '@/lib/api/mock/mock-playback-repository';
export const playbackRepository = mockPlaybackRepository;
import { mockAdminDashboardRepository } from '@/lib/api/mock/mock-admin-dashboard-repository';
export const adminDashboardRepository = mockAdminDashboardRepository;
import { mockAdminAnimeRepository } from '@/lib/api/mock/mock-admin-anime-repository';
export const adminAnimeRepository = mockAdminAnimeRepository;
import { mockAdminGenreRepository } from '@/lib/api/mock/mock-admin-genre-repository';
export const adminGenreRepository = mockAdminGenreRepository;
import { mockAdminUserRepository } from '@/lib/api/mock/mock-admin-user-repository';
export const adminUserRepository = mockAdminUserRepository;
import { mockAdminEpisodeRepository } from '@/lib/api/mock/mock-admin-episode-repository';
export const adminEpisodeRepository = mockAdminEpisodeRepository;
import { mockAdminPlaybackRepository } from '@/lib/api/mock/mock-admin-playback-repository';
export const adminPlaybackRepository = mockAdminPlaybackRepository;
import type { AdminCommentRepository } from '@/lib/api/contracts/admin-comment-repository';
// Load moderation fixtures only when this module is requested.
export const adminCommentRepository: AdminCommentRepository = {
  getCatalog: (...args) =>
    import('@/lib/api/mock/mock-admin-comment-repository').then(({ mockAdminCommentRepository }) =>
      mockAdminCommentRepository.getCatalog(...args),
    ),
  moderate: (...args) =>
    import('@/lib/api/mock/mock-admin-comment-repository').then(({ mockAdminCommentRepository }) =>
      mockAdminCommentRepository.moderate(...args),
    ),
};
