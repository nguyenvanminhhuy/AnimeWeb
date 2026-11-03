import { ApiError, parseApiError } from './error';
import type * as D from './types';

/** Inject a transport later. This module deliberately has no fetch, base URL or live connection. */
export interface BackendRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  headers: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
  credentials?: 'include';
}
export type BackendTransport = (
  request: BackendRequest,
) => Promise<{ status: number; body?: unknown }>;
export interface ListQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  sort?: string;
}
export interface CatalogQuery extends ListQuery {
  genre?: string;
  year?: number;
  status?: string;
  format?: D.AnimeFormat;
  publicationStatus?: D.PublicationStatus;
}
export interface AdminQuery extends ListQuery {
  animeId?: string;
  seasonId?: string;
  episodeId?: string;
  status?: string;
  usage?: 'used' | 'unused';
  enabled?: boolean;
}
export interface PersonalQuery extends ListQuery {
  status?: D.LibraryStatus;
  isFavorite?: boolean;
  animeId?: string;
  completed?: boolean;
  collection?: 'history' | 'watching';
}
const id = (value: string) => encodeURIComponent(value);
function url(path: string, query?: object) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {}))
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  return `/api/v1${path}${params.size ? `?${params}` : ''}`;
}
export function createBackendClient(
  transport: BackendTransport,
  getToken: () => string | null = () => null,
  onUnauthorized?: (token: string) => void,
) {
  async function request<T>(
    method: BackendRequest['method'],
    path: string,
    query?: object,
    body?: unknown,
    signal?: AbortSignal,
    viewer = false,
  ): Promise<T> {
    signal?.throwIfAborted();
    const token = getToken();
    const result = await transport({
      method,
      path: url(path, query),
      body,
      signal,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body === undefined
          ? {}
          : { 'Content-Type': body instanceof Blob ? body.type : 'application/json' }),
      },
      ...(viewer ? { credentials: 'include' as const } : {}),
    });
    signal?.throwIfAborted();
    if (result.status === 401 && token) onUnauthorized?.(token);
    if (result.status < 200 || result.status >= 300)
      throw parseApiError(result.status, result.body);
    if (result.status === 204) return undefined as T;
    return result.body as T;
  }
  const get = <T>(path: string, query?: object, signal?: AbortSignal) =>
    request<T>('GET', path, query, undefined, signal);
  const post = <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>('POST', path, undefined, body, signal);
  const patch = <T>(path: string, body: unknown, signal?: AbortSignal) =>
    request<T>('PATCH', path, undefined, body, signal);
  const remove = (path: string, version: number, signal?: AbortSignal) =>
    request<void>('DELETE', path, { version }, undefined, signal);
  return {
    auth: {
      login: (input: D.LoginInput, signal?: AbortSignal) =>
        post<D.ApiObject<D.LoginDto>>(
          '/auth/login',
          { email: input.email, password: input.password },
          signal,
        ),
      register: (input: D.RegisterInput, signal?: AbortSignal) =>
        post<D.ApiObject<D.LoginDto>>(
          '/auth/register',
          { email: input.email, password: input.password, displayName: input.displayName },
          signal,
        ),
      me: (signal?: AbortSignal) => get<D.ApiObject<D.ProfileDto>>('/me', undefined, signal),
      saveAvatar: (image: Blob | null, version: number, signal?: AbortSignal) => {
        if (!Number.isSafeInteger(version) || version < 1)
          throw new ApiError(
            400,
            'INVALID_VERSION',
            'Hồ sơ chưa có phiên bản hợp lệ. Hãy tải lại hồ sơ.',
          );
        return request<D.ApiObject<D.ProfileDto>>(
          image ? 'PUT' : 'DELETE',
          '/me/avatar',
          { version },
          image ?? undefined,
          signal,
        );
      },
      logout: (signal?: AbortSignal) => post<void>('/auth/logout', undefined, signal),
      changePassword: (input: D.PasswordInput, signal?: AbortSignal) =>
        post<void>(
          '/me/change-password',
          { currentPassword: input.currentPassword, newPassword: input.newPassword },
          signal,
        ),
    },
    catalog: {
      list: (query: CatalogQuery, signal?: AbortSignal) =>
        get<D.ApiPage<D.AnimeSummaryDto>>('/common/anime', query, signal),
      detail: (slug: string, signal?: AbortSignal) =>
        get<D.ApiObject<D.AnimeDetailDto>>(`/common/anime/${id(slug)}`, undefined, signal),
      genres: (signal?: AbortSignal) =>
        get<D.ApiObject<D.GenreDto[]>>('/common/genres', undefined, signal),
      options: (signal?: AbortSignal) =>
        get<D.ApiObject<{ years: number[]; formats: D.AnimeFormat[] }>>(
          '/common/catalog/options',
          undefined,
          signal,
        ),
      home: (genre?: string, signal?: AbortSignal) =>
        get<D.ApiObject<D.HomeDto>>('/common/home', { genre }, signal),
      related: (animeId: string, signal?: AbortSignal) =>
        get<D.ApiObject<D.AnimeCardDto[]>>(
          `/common/anime/${id(animeId)}/related`,
          undefined,
          signal,
        ),
      ranking: (limit = 10, signal?: AbortSignal) =>
        get<D.ApiObject<D.RankingDto[]>>(
          '/common/rankings/anime',
          { metric: 'views', limit },
          signal,
        ),
      seasons: (animeId: string, signal?: AbortSignal) =>
        get<D.ApiObject<D.SeasonDto[]>>(`/common/anime/${id(animeId)}/seasons`, undefined, signal),
      episodes: (seasonId: string, query: ListQuery, signal?: AbortSignal) =>
        get<D.ApiPage<D.EpisodeDto>>(`/common/seasons/${id(seasonId)}/episodes`, query, signal),
      episode: (episodeId: string, signal?: AbortSignal) =>
        get<D.ApiObject<D.EpisodeDetailDto>>(
          `/common/episodes/${id(episodeId)}`,
          undefined,
          signal,
        ),
    },
    playback: {
      get: (episodeId: string, signal?: AbortSignal) =>
        get<D.ApiObject<D.PlaybackDto>>(
          `/common/episodes/${id(episodeId)}/playback`,
          undefined,
          signal,
        ),
      startView: (episodeId: string, input: D.ViewInput, signal?: AbortSignal) =>
        request<D.ApiObject<D.ViewStartDto>>(
          'POST',
          `/common/episodes/${id(episodeId)}/view-sessions`,
          undefined,
          { positionSeconds: Math.floor(input.positionSeconds) },
          signal,
          true,
        ),
      confirmView: (sessionId: string, input: D.ViewInput, signal?: AbortSignal) =>
        request<D.ApiObject<D.ViewConfirmDto>>(
          'POST',
          `/common/view-sessions/${id(sessionId)}/confirm`,
          undefined,
          { positionSeconds: Math.floor(input.positionSeconds) },
          signal,
          true,
        ),
    },
    personal: {
      library: (query: PersonalQuery, signal?: AbortSignal) =>
        get<D.ApiSummaryPage<D.LibraryRow, { total: number }>>('/me/library', query, signal),
      progress: (query: PersonalQuery, signal?: AbortSignal) =>
        get<D.ApiSummaryPage<D.ProgressRow, { total: number }>>('/me/progress', query, signal),
      summary: (signal?: AbortSignal) =>
        get<D.ApiObject<D.PersonalSummary>>('/me/library/summary', undefined, signal),
      saveLibrary: (animeId: string, input: D.LibraryInput, signal?: AbortSignal) =>
        request<D.ApiObject<D.LibraryDto>>(
          'PUT',
          `/me/library/${id(animeId)}`,
          undefined,
          { status: input.status, isFavorite: input.isFavorite, version: input.version },
          signal,
        ),
      removeLibrary: (animeId: string, version: number, signal?: AbortSignal) =>
        remove(`/me/library/${id(animeId)}`, version, signal),
      saveProgress: (episodeId: string, input: D.ProgressInput, signal?: AbortSignal) =>
        request<D.ApiObject<D.ProgressDto>>(
          'PUT',
          `/me/progress/${id(episodeId)}`,
          undefined,
          {
            positionSeconds: Math.floor(input.positionSeconds),
            completed: input.completed,
            version: input.version,
          },
          signal,
        ),
    },
    comments: {
      list: (animeId: string, query: ListQuery, signal?: AbortSignal) =>
        get<D.ApiPage<D.CommentDto>>(`/common/anime/${id(animeId)}/comments`, query, signal),
      create: (animeId: string, input: D.CommentInput, signal?: AbortSignal) =>
        post<D.ApiObject<D.CommentDto>>(
          `/me/anime/${id(animeId)}/comments`,
          { body: input.body, version: input.version },
          signal,
        ),
      update: (commentId: string, input: D.CommentInput, signal?: AbortSignal) =>
        patch<D.ApiObject<D.CommentDto>>(
          `/me/comments/${id(commentId)}`,
          { body: input.body, version: input.version },
          signal,
        ),
      remove: (commentId: string, version: number, signal?: AbortSignal) =>
        remove(`/me/comments/${id(commentId)}`, version, signal),
      adminList: (query: AdminQuery, signal?: AbortSignal) =>
        get<
          D.ApiSummaryPage<
            D.AdminCommentDto,
            { total: number; visible: number; hidden: number; deleted: number }
          >
        >('/admin/comments', query, signal),
      adminGet: (commentId: string, signal?: AbortSignal) =>
        get<D.ApiObject<D.AdminCommentDto>>(`/admin/comments/${id(commentId)}`, undefined, signal),
      moderate: (commentId: string, input: D.ModerationInput, signal?: AbortSignal) =>
        post<D.ApiObject<D.AdminCommentDto>>(
          `/admin/comments/${id(commentId)}/moderations`,
          { action: input.action, reason: input.reason, version: input.version },
          signal,
        ),
    },
    admin: {
      dashboard: (signal?: AbortSignal) =>
        get<D.ApiObject<D.DashboardDto>>('/admin/dashboard', undefined, signal),
      anime: (query: CatalogQuery, signal?: AbortSignal) =>
        get<D.ApiPage<D.AdminAnimeDto> & { genreOptions: D.AdminGenreDto[]; years: number[] }>(
          '/admin/anime',
          query,
          signal,
        ),
      animeDetail: (animeId: string, signal?: AbortSignal) =>
        get<D.ApiObject<D.AdminAnimeDto>>(`/admin/anime/${id(animeId)}`, undefined, signal),
      animeOptions: (signal?: AbortSignal) =>
        get<
          D.ApiObject<
            {
              id: string;
              title: string;
              status: D.AnimeSummaryDto['status'];
              publicationStatus: D.PublicationStatus;
              publicSlug: string | null;
            }[]
          >
        >('/admin/anime/options', undefined, signal),
      createAnime: (input: D.AdminAnimeInput, signal?: AbortSignal) =>
        post<D.ApiObject<D.AdminAnimeDto>>('/admin/anime', input, signal),
      updateAnime: (animeId: string, input: D.AdminAnimeInput, signal?: AbortSignal) =>
        patch<D.ApiObject<D.AdminAnimeDto>>(`/admin/anime/${id(animeId)}`, input, signal),
      removeAnime: (animeId: string, version: number, signal?: AbortSignal) =>
        remove(`/admin/anime/${id(animeId)}`, version, signal),
      genres: (query: AdminQuery, signal?: AbortSignal) =>
        get<D.ApiPage<D.AdminGenreDto>>('/admin/genres', query, signal),
      genre: (genreId: string, signal?: AbortSignal) =>
        get<D.ApiObject<D.AdminGenreDto>>(`/admin/genres/${id(genreId)}`, undefined, signal),
      genreOptions: (signal?: AbortSignal) =>
        get<D.ApiObject<D.AdminGenreDto[]>>('/admin/genres/options', undefined, signal),
      createGenre: (input: D.GenreInput, signal?: AbortSignal) =>
        post<D.ApiObject<D.AdminGenreDto>>('/admin/genres', input, signal),
      updateGenre: (genreId: string, input: D.GenreInput, signal?: AbortSignal) =>
        patch<D.ApiObject<D.AdminGenreDto>>(`/admin/genres/${id(genreId)}`, input, signal),
      removeGenre: (genreId: string, version: number, signal?: AbortSignal) =>
        remove(`/admin/genres/${id(genreId)}`, version, signal),
      seasons: (query: AdminQuery, signal?: AbortSignal) =>
        get<D.ApiPage<D.AdminSeasonDto>>('/admin/seasons', query, signal),
      season: (seasonId: string, signal?: AbortSignal) =>
        get<D.ApiObject<D.AdminSeasonDto>>(`/admin/seasons/${id(seasonId)}`, undefined, signal),
      createSeason: (input: D.SeasonInput, signal?: AbortSignal) =>
        post<D.ApiObject<D.AdminSeasonDto>>('/admin/seasons', input, signal),
      updateSeason: (seasonId: string, input: D.SeasonInput, signal?: AbortSignal) =>
        patch<D.ApiObject<D.AdminSeasonDto>>(`/admin/seasons/${id(seasonId)}`, input, signal),
      removeSeason: (seasonId: string, version: number, signal?: AbortSignal) =>
        remove(`/admin/seasons/${id(seasonId)}`, version, signal),
      episodes: (query: AdminQuery, signal?: AbortSignal) =>
        get<D.ApiPage<D.AdminEpisodeDto>>('/admin/episodes', query, signal),
      episode: (episodeId: string, signal?: AbortSignal) =>
        get<D.ApiObject<D.AdminEpisodeDto>>(`/admin/episodes/${id(episodeId)}`, undefined, signal),
      createEpisode: (input: D.EpisodeInput, signal?: AbortSignal) =>
        post<D.ApiObject<D.AdminEpisodeDto>>('/admin/episodes', input, signal),
      updateEpisode: (episodeId: string, input: D.EpisodeInput, signal?: AbortSignal) =>
        patch<D.ApiObject<D.AdminEpisodeDto>>(`/admin/episodes/${id(episodeId)}`, input, signal),
      removeEpisode: (episodeId: string, version: number, signal?: AbortSignal) =>
        remove(`/admin/episodes/${id(episodeId)}`, version, signal),
      sources: (query: AdminQuery, signal?: AbortSignal) =>
        get<D.ApiPage<D.AdminSourceDto>>('/admin/playback-sources', query, signal),
      source: (sourceId: string, signal?: AbortSignal) =>
        get<D.ApiObject<D.AdminSourceDto>>(
          `/admin/playback-sources/${id(sourceId)}`,
          undefined,
          signal,
        ),
      createSource: (input: D.SourceInput, signal?: AbortSignal) =>
        post<D.ApiObject<D.AdminSourceDto>>('/admin/playback-sources', input, signal),
      updateSource: (sourceId: string, input: D.SourceInput, signal?: AbortSignal) =>
        patch<D.ApiObject<D.AdminSourceDto>>(
          `/admin/playback-sources/${id(sourceId)}`,
          input,
          signal,
        ),
      removeSource: (sourceId: string, version: number, signal?: AbortSignal) =>
        remove(`/admin/playback-sources/${id(sourceId)}`, version, signal),
      subtitles: (sourceId: string, signal?: AbortSignal) =>
        get<D.ApiObject<D.AdminSubtitleDto[]>>(
          `/admin/playback-sources/${id(sourceId)}/subtitles`,
          undefined,
          signal,
        ),
      subtitle: (subtitleId: string, signal?: AbortSignal) =>
        get<D.ApiObject<D.AdminSubtitleDto>>(
          `/admin/subtitles/${id(subtitleId)}`,
          undefined,
          signal,
        ),
      createSubtitle: (input: D.SubtitleInput, signal?: AbortSignal) =>
        post<D.ApiObject<D.AdminSubtitleDto>>('/admin/subtitles', input, signal),
      updateSubtitle: (subtitleId: string, input: D.SubtitleInput, signal?: AbortSignal) =>
        patch<D.ApiObject<D.AdminSubtitleDto>>(`/admin/subtitles/${id(subtitleId)}`, input, signal),
      removeSubtitle: (subtitleId: string, version: number, signal?: AbortSignal) =>
        remove(`/admin/subtitles/${id(subtitleId)}`, version, signal),
      users: (query: AdminQuery, signal?: AbortSignal) =>
        get<D.ApiSummaryPage<D.AdminUserDto, { total: number; active: number; blocked: number }>>(
          '/admin/users',
          query,
          signal,
        ),
      user: (userId: string, signal?: AbortSignal) =>
        get<D.ApiObject<D.AdminUserDto>>(`/admin/users/${id(userId)}`, undefined, signal),
      setUserRole: (
        userId: string,
        role: D.AdminUserDto['roles'][number],
        version: number,
        signal?: AbortSignal,
      ) =>
        request<D.ApiObject<D.AdminUserDto>>(
          'PATCH',
          `/admin/users/${id(userId)}/role`,
          undefined,
          { role, version },
          signal,
        ),
      setUserStatus: (
        userId: string,
        status: D.AdminUserDto['status'],
        version: number,
        signal?: AbortSignal,
      ) =>
        request<D.ApiObject<D.AdminUserDto>>(
          'PATCH',
          `/admin/users/${id(userId)}/status`,
          undefined,
          { status, version },
          signal,
        ),
    },
  };
}
export type BackendClient = ReturnType<typeof createBackendClient>;
