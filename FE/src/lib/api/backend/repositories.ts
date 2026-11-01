import type { BackendClient } from './client';
import { ApiError } from './error';
import {
  collectPages,
  loadAnimeDetail,
  loadWatchDetail,
  mapAdminAnime,
  mapAdminComment,
  mapAnime,
  mapComment,
  mapHome,
  serializeAdminAnime,
} from './mappers';
import type * as D from './types';
import type { AuthRepository } from '@/lib/api/contracts/auth-repository';
import type { AnimeRepository } from '@/lib/api/contracts/anime-repository';
import type { PlaybackRepository } from '@/lib/api/contracts/playback-repository';
import type { CommentRepository } from '@/lib/api/contracts/comment-repository';
import type { PersonalRepository } from '@/lib/api/contracts/personal-repository';
import type { AdminAnimeRepository } from '@/lib/api/contracts/admin-anime-repository';
import type { AdminGenreRepository } from '@/lib/api/contracts/admin-genre-repository';
import type { AdminEpisodeRepository } from '@/lib/api/contracts/admin-episode-repository';
import type { AdminPlaybackRepository } from '@/lib/api/contracts/admin-playback-repository';
import type { AdminCommentRepository } from '@/lib/api/contracts/admin-comment-repository';
import type { AdminUserRepository } from '@/lib/api/contracts/admin-user-repository';
import type { AdminDashboardRepository } from '@/lib/api/contracts/admin-dashboard-repository';
import type { AdminListQuery } from '@/types/admin-query';
import type { Progress } from '@/types/progress';

export interface CredentialStore {
  read(): Pick<D.LoginDto, 'accessToken' | 'expiresAt'> | null;
  write(value: D.LoginDto | null): void;
}
const missing = <T>(task: Promise<T>): Promise<T | null> =>
  task.catch((error) => {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  });
const mapProgress = (row: D.ProgressDto): Progress => ({ ...row });
/** Prepared adapter factory. Nothing is connected until the application explicitly injects a transport. */
export function createBackendRepositories(api: BackendClient, credentials: CredentialStore) {
  const profiles = new Map<string, D.ProfileDto>();
  const entries = new Map<string, Map<string, D.LibraryDto>>();
  const authRepository: AuthRepository = {
    mode: 'backend',
    getProfile: (id) => profiles.get(id) ?? null,
    async restore(signal) {
      const saved = credentials.read();
      if (!saved) return null;
      const deadline = Date.parse(saved.expiresAt);
      if (!Number.isFinite(deadline) || deadline <= Date.now()) {
        credentials.write(null);
        return null;
      }
      try {
        const { data: profile } = await api.auth.me(signal);
        profiles.set(profile.id, profile);
        return { ...saved, tokenType: 'Bearer', profile };
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          credentials.write(null);
          return null;
        }
        throw error;
      }
    },
    async login(input, _state, signal) {
      const { data } = await api.auth.login(input, signal);
      credentials.write(data);
      profiles.set(data.profile.id, data.profile);
      return data;
    },
    async register(input, _state, signal) {
      const { data } = await api.auth.register(input, signal);
      credentials.write(data);
      profiles.set(data.profile.id, data.profile);
      return data;
    },
    async logout(signal) {
      try {
        await api.auth.logout(signal);
      } finally {
        credentials.write(null);
        profiles.clear();
        entries.clear();
      }
    },
    async changePassword(input, _state, signal) {
      await api.auth.changePassword(input, signal);
      credentials.write(null);
      profiles.clear();
      entries.clear();
    },
    async previewPasswordChange() {
      throw new ApiError(400, 'PREVIEW_UNAVAILABLE', 'Chế độ API không hỗ trợ preview mật khẩu.');
    },
  };
  const animeRepository: AnimeRepository = {
    async list(query, _state) {
      const [result, genres, options] = await Promise.all([
        api.catalog.list({
          ...query,
          year: query.year ? Number(query.year) : undefined,
          format: query.format || undefined,
        }),
        api.catalog.genres(),
        api.catalog.options(),
      ]);
      return {
        ...result,
        data: result.data.map(mapAnime),
        options: {
          genres: genres.data.map((row) => ({ value: row.slug, label: row.name })),
          years: options.data.years,
        },
      };
    },
    async getHome(_state, genre) {
      return mapHome((await api.catalog.home(genre)).data);
    },
    async getBySlug(slug) {
      return missing(loadAnimeDetail(api, slug));
    },
    async getByIds() {
      throw new ApiError(
        400,
        'BULK_LOOKUP_UNAVAILABLE',
        'Dùng personal repository có summary; BE không có endpoint by-ids.',
      );
    },
  };
  const playbackRepository: PlaybackRepository = {
    async getEpisode(id) {
      return missing(loadWatchDetail(api, id));
    },
    async startView(id, input, signal) {
      return (await api.playback.startView(id, input, signal)).data;
    },
    async confirmView(id, input, signal) {
      return (await api.playback.confirmView(id, input, signal)).data;
    },
  };
  const commentRepository: CommentRepository = {
    async list(id, query, _state, signal) {
      const result = await api.comments.list(id, query, signal);
      return { ...result, data: result.data.map(mapComment) };
    },
    async create(_actor, id, body, signal) {
      await api.comments.create(id, { body, version: 0 }, signal);
    },
    async update(_actor, id, body, version, signal) {
      await api.comments.update(id, { body, version }, signal);
    },
    async remove(_actor, id, version, signal) {
      await api.comments.remove(id, version, signal);
    },
  };
  const personalRepository: PersonalRepository = {
    async snapshot(actor, signal) {
      const [library, progress] = await Promise.all([
        collectPages((page) => api.personal.library({ page, pageSize: 50 }, signal), signal),
        collectPages(
          (page) => api.personal.progress({ page, pageSize: 50, collection: 'history' }, signal),
          signal,
        ),
      ]);
      entries.set(actor.id, new Map(library.map((row) => [row.animeId, row])));
      return {
        favorites: library.filter((row) => row.isFavorite).map((row) => row.animeId),
        library: library.map(({ animeId, status, isFavorite, version, updatedAt }) => ({
          animeId,
          status,
          isFavorite,
          version,
          updatedAt,
        })),
        progress: progress.map(mapProgress),
      };
    },
    async list(_actor, query, signal) {
      const base = { q: query.q, sort: query.sort, page: query.page, pageSize: query.pageSize };
      const [result, favorites, watching, history] = await Promise.all([
        query.tab === 'favorites'
          ? api.personal.library({ ...base, isFavorite: true }, signal)
          : api.personal.progress({ ...base, collection: query.tab }, signal),
        api.personal.library({ isFavorite: true, pageSize: 1 }, signal),
        api.personal.progress({ collection: 'watching', pageSize: 1 }, signal),
        api.personal.progress({ collection: 'history', pageSize: 1 }, signal),
      ]);
      const items = result.data.map((row) => ({
        key: 'episodeId' in row ? row.episodeId : row.animeId,
        anime: mapAnime(row.anime),
        progress:
          'episodeId' in row
            ? mapProgress(row)
            : row.progress
              ? mapProgress(row.progress)
              : undefined,
      }));
      return {
        items,
        meta: result.meta,
        counts: {
          favorites: favorites.summary.total,
          watching: watching.summary.total,
          history: history.summary.total,
        },
      };
    },
    async summary(_actor, signal) {
      const [{ data }, favorites] = await Promise.all([
        api.personal.summary(signal),
        api.personal.library({ isFavorite: true, page: 1, pageSize: 4 }, signal),
      ]);
      return {
        ...data,
        favoriteAnime: favorites.data.map((row) => mapAnime(row.anime)),
        preview: data.preview.map((row) => ({
          key: row.episodeId,
          anime: mapAnime(row.anime),
          progress: mapProgress(row),
        })),
      };
    },
    async setFavorite(actor, id, isFavorite, version, signal) {
      const current = entries.get(actor.id)?.get(id);
      await api.personal.saveLibrary(
        id,
        { status: current?.status ?? 'plan_to_watch', isFavorite, version },
        signal,
      );
      return personalRepository.snapshot(actor, signal);
    },
    async saveProgress(actor, entry, signal) {
      await api.personal.saveProgress(
        entry.episodeId,
        {
          positionSeconds: entry.positionSeconds,
          completed: entry.completed === true,
          version: entry.version ?? 0,
        },
        signal,
      );
      return personalRepository.snapshot(actor, signal);
    },
  };
  const adminGenreRepository: AdminGenreRepository = {
    async list(query, _state, signal) {
      return api.admin.genres({ ...query, usage: query.usage || undefined }, signal);
    },
    async options(signal) {
      return (await api.admin.genreOptions(signal)).data;
    },
    async create(input, signal) {
      return (
        await api.admin.createGenre(
          { name: input.name, slug: input.slug, version: input.version },
          signal,
        )
      ).data;
    },
    async update(id, input, signal) {
      return (
        await api.admin.updateGenre(
          id,
          { name: input.name, slug: input.slug, version: input.version },
          signal,
        )
      ).data;
    },
    async remove(id, version, signal) {
      await api.admin.removeGenre(id, version, signal);
    },
  };
  const adminAnimeRepository: AdminAnimeRepository = {
    async list(query, _state, signal) {
      const result = await api.admin.anime(
        {
          ...query,
          year: query.year ? Number(query.year) : undefined,
          format: query.format || undefined,
        },
        signal,
      );
      return {
        ...result,
        data: result.data.map(mapAdminAnime),
        genreOptions: result.genreOptions.map((row) => ({ value: row.slug, label: row.name })),
      };
    },
    async get(id, signal) {
      const result = await missing(api.admin.animeDetail(id, signal));
      return result ? mapAdminAnime(result.data) : null;
    },
    async create(input, signal) {
      const genres = (await api.admin.genreOptions(signal)).data;
      return mapAdminAnime(
        (await api.admin.createAnime(serializeAdminAnime(input, genres), signal)).data,
      );
    },
    async update(id, input, signal) {
      const genres = (await api.admin.genreOptions(signal)).data;
      return mapAdminAnime(
        (await api.admin.updateAnime(id, serializeAdminAnime(input, genres), signal)).data,
      );
    },
    async remove(id, version, signal) {
      await api.admin.removeAnime(id, version, signal);
    },
  };
  async function episodeContext(query: AdminListQuery, signal: AbortSignal) {
    const [anime, seasons] = await Promise.all([
      api.admin.animeOptions(signal),
      query.animeId
        ? collectPages(
            (page) => api.admin.seasons({ animeId: query.animeId, page, pageSize: 50 }, signal),
            signal,
          )
        : Promise.resolve([]),
    ]);
    return { anime: anime.data, seasons };
  }
  const adminEpisodeRepository: AdminEpisodeRepository = {
    async list(query, signal) {
      const [context, result] = await Promise.all([
        episodeContext(query, signal),
        api.admin.episodes(
          {
            q: query.q,
            animeId: query.animeId,
            seasonId: query.seasonId,
            status: query.status,
            sort: query.sort,
            page: query.page,
            pageSize: query.pageSize,
          },
          signal,
        ),
      ]);
      const seasons = [...context.seasons];
      for (const seasonId of new Set(result.data.map((row) => row.seasonId)))
        if (!seasons.some((row) => row.id === seasonId))
          seasons.push((await api.admin.season(seasonId, signal)).data);
      return { ...context, seasons, episodes: result.data, meta: result.meta };
    },
    async getById(id, signal) {
      return (await missing(api.admin.episode(id, signal)))?.data ?? null;
    },
    async getCatalog(signal, _session, _fail, form) {
      const selected = form?.episodeId
        ? (await missing(api.admin.episode(form.episodeId, signal)))?.data
        : null;
      const context = await episodeContext(
        { page: 1, pageSize: 50, animeId: selected?.animeId ?? form?.animeId },
        signal,
      );
      const peers =
        form?.seasonId || selected?.seasonId
          ? await collectPages(
              (page) =>
                api.admin.episodes(
                  { seasonId: selected?.seasonId ?? form?.seasonId, page, pageSize: 50 },
                  signal,
                ),
              signal,
            )
          : [];
      return { ...context, episodes: peers };
    },
    async saveSeason(id, input, signal) {
      const value: D.SeasonInput = {
        animeId: input.animeId,
        number: input.number,
        title: input.title,
        sortOrder: input.sortOrder,
        version: input.version,
      };
      await (id
        ? api.admin.updateSeason(id, value, signal)
        : api.admin.createSeason(value, signal));
    },
    async saveEpisode(id, input, signal) {
      const value: D.EpisodeInput = {
        animeId: input.animeId,
        seasonId: input.seasonId,
        number: input.number,
        title: input.title,
        sortOrder: input.sortOrder,
        durationSeconds: input.durationSeconds,
        thumbnailUrl: input.thumbnailUrl,
        status: input.status,
        version: input.version,
      };
      await (id
        ? api.admin.updateEpisode(id, value, signal)
        : api.admin.createEpisode(value, signal));
    },
    async remove(kind, id, version, signal) {
      await (kind === 'season'
        ? api.admin.removeSeason(id, version, signal)
        : api.admin.removeEpisode(id, version, signal));
    },
  };
  const adminPlaybackRepository: AdminPlaybackRepository = {
    async list(query, signal, session) {
      const source = query.sourceId
        ? ((await missing(api.admin.source(query.sourceId, signal)))?.data ?? null)
        : null;
      const episodeId = query.episodeId || source?.episodeId;
      const episode = episodeId
        ? (await missing(api.admin.episode(episodeId, signal)))?.data
        : null;
      const context = await episodeContext(
        { ...query, animeId: episode?.animeId ?? query.animeId },
        signal,
      );
      const seasonId = episode?.seasonId ?? query.seasonId;
      const [episodes, result, subtitles] = await Promise.all([
        seasonId
          ? collectPages(
              (page) => api.admin.episodes({ seasonId, page, pageSize: 50 }, signal),
              signal,
            )
          : Promise.resolve([]),
        episodeId
          ? api.admin.sources(
              {
                episodeId,
                q: query.q,
                enabled: query.enabled ? query.enabled === 'yes' : undefined,
                sort: query.sort,
                page: query.page,
                pageSize: query.pageSize,
              },
              signal,
            )
          : Promise.resolve({
              data: [],
              meta: { page: query.page, pageSize: query.pageSize, total: 0, totalPages: 0 },
            }),
        source && source.episodeId === episodeId
          ? api.admin.subtitles(source.id, signal).then((result) => result.data)
          : Promise.resolve([]),
      ]);
      return {
        ...context,
        episodes,
        sources: result.data,
        subtitles,
        selectedSource: source && source.episodeId === episodeId ? source : null,
        meta: result.meta,
      };
    },
    async getById(id, signal) {
      return (await missing(api.admin.source(id, signal)))?.data ?? null;
    },
    async getCatalog(signal, session) {
      return adminPlaybackRepository.list({ page: 1, pageSize: 50 }, signal, session);
    },
    async saveSource(id, input, signal) {
      if (input.providerKey !== 'direct')
        throw new ApiError(400, 'VALIDATION_ERROR', 'Chỉ hỗ trợ direct.', {
          providerKey: 'Chọn direct.',
        });
      const value: D.SourceInput = {
        episodeId: input.episodeId,
        providerKey: 'direct',
        label: input.label,
        language: input.language,
        type: input.type,
        url: input.url,
        enabled: input.enabled,
        expiresAt: input.expiresAt ? new Date(input.expiresAt).toISOString() : null,
        version: input.version,
      };
      await (id
        ? api.admin.updateSource(id, value, signal)
        : api.admin.createSource(value, signal));
    },
    async saveSubtitle(id, input, signal) {
      const value: D.SubtitleInput = {
        playbackSourceId: input.playbackSourceId,
        label: input.label,
        language: input.language,
        format: input.format,
        url: input.url,
        isDefault: input.isDefault,
        version: input.version,
      };
      await (id
        ? api.admin.updateSubtitle(id, value, signal)
        : api.admin.createSubtitle(value, signal));
    },
    async remove(kind, id, version, signal) {
      await (kind === 'source'
        ? api.admin.removeSource(id, version, signal)
        : api.admin.removeSubtitle(id, version, signal));
    },
  };
  const adminCommentRepository: AdminCommentRepository = {
    async list(query, signal) {
      const [result, anime, selected] = await Promise.all([
        api.comments.adminList(
          {
            q: query.q,
            animeId: query.animeId,
            status: query.status,
            sort: query.sort,
            page: query.page,
            pageSize: query.pageSize,
          },
          signal,
        ),
        api.admin.animeOptions(signal),
        query.commentId
          ? missing(api.comments.adminGet(query.commentId, signal))
          : Promise.resolve(null),
      ]);
      return {
        comments: result.data.map(mapAdminComment),
        meta: result.meta,
        summary: result.summary,
        anime: anime.data.map((row) => ({
          id: row.id,
          title: row.title,
          publicSlug: row.publicSlug,
        })),
        selectedComment: selected ? mapAdminComment(selected.data) : null,
      };
    },
    async getById(id, signal) {
      const result = await missing(api.comments.adminGet(id, signal));
      return result ? mapAdminComment(result.data) : null;
    },
    async getCatalog(signal, session) {
      return adminCommentRepository.list({ page: 1, pageSize: 50 }, signal, session);
    },
    async moderate(id, action, reason, version, signal) {
      await api.comments.moderate(id, { action, reason, version }, signal);
    },
  };
  const adminUserRepository: AdminUserRepository = {
    async list(query, _state, signal) {
      return api.admin.users(query, signal);
    },
    async getById(id, _state, signal) {
      return (await missing(api.admin.user(id, signal)))?.data ?? null;
    },
  };
  const adminDashboardRepository: AdminDashboardRepository = {
    async getOverview(_state, signal) {
      const { data } = await api.admin.dashboard(signal);
      return {
        ...data,
        topViewed: data.topViewed.map((row) => ({
          anime: mapAnime(row.anime),
          viewCount: row.viewCount,
        })),
        recentAnime: data.recentAnime.map((row) => ({ ...row, anime: mapAnime(row.anime) })),
      };
    },
  };
  return {
    authRepository,
    animeRepository,
    playbackRepository,
    commentRepository,
    personalRepository,
    adminAnimeRepository,
    adminGenreRepository,
    adminEpisodeRepository,
    adminPlaybackRepository,
    adminCommentRepository,
    adminUserRepository,
    adminDashboardRepository,
  };
}
