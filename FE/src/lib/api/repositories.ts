import { isMockApi } from '@/config/api';
import { createBackendClient } from './backend/client';
import { createBackendRepositories } from './backend/repositories';
import { backendCredentials } from './backend/credentials';
import { httpTransport } from './backend/transport';
import * as mockRepositories from './mock/repositories';

const client = createBackendClient(
  httpTransport,
  () => backendCredentials.read()?.accessToken ?? null,
  backendCredentials.expire,
);
const repositories = isMockApi
  ? mockRepositories
  : createBackendRepositories(client, backendCredentials);
export const {
  animeRepository,
  authRepository,
  personalRepository,
  commentRepository,
  playbackRepository,
  adminDashboardRepository,
  adminAnimeRepository,
  adminGenreRepository,
  adminUserRepository,
  adminEpisodeRepository,
  adminPlaybackRepository,
  adminCommentRepository,
  adminAuditRepository,
  operationsRepository,
} = repositories;
