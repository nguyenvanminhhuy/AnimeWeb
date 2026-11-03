import type * as D from './types';
import type { BackendClient } from './client';
import { ApiError } from './error';
import type { Anime, AnimeDetail, HomeCatalog } from '@/types/anime';
import type { AdminAnimeInput, AdminAnimeRow } from '@/types/admin-anime';
import type { AdminGenre } from '@/types/admin-genre';
import type { Comment } from '@/types/comment';
import type { AdminComment } from '@/types/admin-comment';
import type { WatchDetail } from '@/types/player';

export function mapAnime(dto: D.AnimeSummaryDto | D.AnimeDetailDto | D.AnimeCardDto): Anime {
  return {
    id: dto.id,
    slug: dto.slug,
    title: dto.title,
    posterUrl: dto.posterUrl || '/images/fallback.svg',
    subtitle: 'subtitle' in dto ? dto.subtitle : '',
    synopsis: 'synopsis' in dto ? dto.synopsis : '',
    bannerUrl:
      ('bannerUrl' in dto ? dto.bannerUrl : null) || dto.posterUrl || '/images/fallback.svg',
    status: dto.status,
    format: dto.format,
    releaseYear: dto.releaseYear,
    genres: dto.genres.map((genre) => genre.name),
    episodeLabel: '',
  };
}
export function mapHome(dto: D.HomeDto): HomeCatalog {
  return {
    featured: dto.featured.map(mapAnime),
    updated: dto.updated.map(mapAnime),
    recommended: dto.recommended.map(mapAnime),
    topViewed: dto.topViewed.map((row) => ({
      anime: mapAnime(row.anime),
      viewCount: row.viewCount,
    })),
  };
}
export function mapAdminAnime(dto: D.AdminAnimeDto): AdminAnimeRow {
  return {
    anime: mapAnime(dto.anime),
    version: dto.version,
    publicationStatus: dto.publicationStatus,
    alternativeTitles: [...dto.alternativeTitles],
    publishedEpisodes: dto.publishedEpisodes,
    publicSlug: dto.publicSlug,
  };
}
export function serializeAdminAnime(
  input: AdminAnimeInput,
  genres: readonly AdminGenre[],
): D.AdminAnimeInput {
  const genreIds = input.genres.map((name) => {
    const genre = genres.find((item) => item.name === name);
    if (!genre)
      throw new ApiError(400, 'VALIDATION_ERROR', 'Thể loại không còn tồn tại.', {
        genres: 'Tải lại danh sách thể loại.',
      });
    return genre.id;
  });
  return {
    title: input.title,
    slug: input.slug,
    subtitle: input.subtitle,
    alternativeTitles: input.alternativeTitles.map((value) => value.trim()).filter(Boolean),
    synopsis: input.synopsis,
    releaseYear: input.releaseYear,
    status: input.status,
    format: input.format,
    publicationStatus: input.publicationStatus,
    genreIds,
    posterUrl: input.posterUrl,
    bannerUrl: input.bannerUrl || null,
    version: input.version,
  };
}
export function mapComment(dto: D.CommentDto): Comment {
  return {
    id: dto.id,
    animeId: dto.animeId,
    userId: dto.author.id,
    authorName: dto.author.displayName,
    authorAvatarUrl: dto.author.avatarUrl,
    body: dto.body ?? '',
    status: dto.status,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    version: dto.version,
  };
}
export function mapAdminComment(dto: D.AdminCommentDto): AdminComment {
  return {
    ...mapComment(dto.comment),
    body: dto.comment.body,
    version: dto.comment.version,
    lastModeration: dto.lastModeration,
  };
}
/** Used for a complete public playlist, never to emulate server paging for admin lists. */
export async function collectPages<T>(
  load: (page: number) => Promise<D.ApiPage<T>>,
  signal?: AbortSignal,
): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 1; page <= 10000; page++) {
    signal?.throwIfAborted();
    const result = await load(page);
    rows.push(...result.data);
    if (page >= result.meta.totalPages) return rows;
  }
  throw new ApiError(500, 'PAGINATION_LIMIT', 'Danh sách tập vượt giới hạn tải.');
}
export async function loadAnimeDetail(
  api: BackendClient,
  slug: string,
  signal?: AbortSignal,
): Promise<AnimeDetail> {
  const { data: detail } = await api.catalog.detail(slug, signal);
  const [{ data: seasons }, { data: related }] = await Promise.all([
    api.catalog.seasons(detail.id, signal),
    api.catalog.related(detail.id, signal),
  ]);
  const episodes = (
    await Promise.all(
      seasons.map((season) =>
        collectPages(
          (page) => api.catalog.episodes(season.id, { page, pageSize: 50 }, signal),
          signal,
        ),
      ),
    )
  ).flat();
  return {
    ...mapAnime(detail),
    alternativeTitles: detail.alternativeTitles,
    seasons,
    episodes,
    related: related.map(mapAnime),
    episodeLabel: episodes.length ? `${episodes.length} tập đã công bố` : 'Chưa có tập',
  };
}
export async function loadWatchDetail(
  api: BackendClient,
  episodeId: string,
  signal?: AbortSignal,
): Promise<WatchDetail> {
  const { data: episode } = await api.catalog.episode(episodeId, signal);
  const [anime, { data: playback }] = await Promise.all([
    loadAnimeDetail(api, episode.animeSlug, signal),
    api.playback.get(episodeId, signal),
  ]);
  return {
    anime,
    episode,
    episodes: anime.episodes,
    sources: playback.sources.map((source) => ({
      ...source,
      type:
        source.type === 'hls' ? ('application/vnd.apple.mpegurl' as const) : ('video/mp4' as const),
      subtitles: source.subtitles,
    })),
    previousEpisodeId: playback.previousEpisodeId,
    nextEpisodeId: playback.nextEpisodeId,
  };
}
