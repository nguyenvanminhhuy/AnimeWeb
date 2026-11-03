// BE v0.3 wire DTOs. Never send view models, mock actors or permissions as request bodies.
export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
export interface ApiObject<T> {
  data: T;
}
export interface ApiPage<T> {
  data: T[];
  meta: PageMeta;
}
export interface ApiSummaryPage<T, S> extends ApiPage<T> {
  summary: S;
}
export interface VersionInput {
  version: number;
}
export type Role = 'user' | 'manage' | 'admin';
export type AnimeFormat = 'tv' | 'movie' | 'ova' | 'ona' | 'special';
export type PublicationStatus = 'draft' | 'published';
export interface GenreDto {
  id: string;
  slug: string;
  name: string;
}
export interface AnimeSummaryDto {
  id: string;
  slug: string;
  title: string;
  posterUrl: string;
  status: 'upcoming' | 'airing' | 'completed';
  format: AnimeFormat;
  releaseYear: number;
  genres: GenreDto[];
}
export interface AnimeCardDto extends AnimeSummaryDto {
  subtitle: string;
  synopsis: string;
  bannerUrl: string | null;
}
export interface AnimeDetailDto extends AnimeSummaryDto {
  synopsis: string;
  alternativeTitles: string[];
  bannerUrl: string | null;
}
export interface RankingDto {
  anime: AnimeCardDto;
  viewCount: number;
}
export interface HomeDto {
  featured: AnimeCardDto[];
  updated: AnimeCardDto[];
  recommended: AnimeCardDto[];
  topViewed: RankingDto[];
}
export interface ProfileDto {
  id: string;
  displayName: string;
  email: string;
  roles: Role[];
  permissions: string[];
  avatarUrl: string | null;
  version: number;
}
export interface LoginInput {
  email: string;
  password: string;
}
export interface RegisterInput extends LoginInput {
  displayName: string;
}
export interface PasswordInput {
  currentPassword: string;
  newPassword: string;
}
export interface LoginDto {
  accessToken: string;
  tokenType: 'Bearer';
  expiresAt: string;
  profile: ProfileDto;
}
export interface SeasonDto {
  id: string;
  animeId: string;
  number: number;
  title: string;
  sortOrder: number;
}
export interface EpisodeDto {
  id: string;
  seasonId: string;
  number: number;
  title: string;
  sortOrder: number;
  durationSeconds: number | null;
  thumbnailUrl: string;
  publishedAt: string;
  status: 'published';
  hasPlayback: boolean;
}
export interface EpisodeDetailDto extends EpisodeDto {
  animeId: string;
  animeSlug: string;
}
export interface SubtitleDto {
  id: string;
  language: string;
  label: string;
  format: 'vtt' | 'srt';
  url: string;
  isDefault: boolean;
}
export interface SourceDto {
  id: string;
  type: 'mp4' | 'hls';
  label: string;
  language: string;
  url: string;
  expiresAt: string | null;
  subtitles: SubtitleDto[];
}
export interface PlaybackDto {
  episodeId: string;
  sources: SourceDto[];
  previousEpisodeId: string | null;
  nextEpisodeId: string | null;
}
export interface ViewInput {
  positionSeconds: number;
}
export interface ViewStartDto {
  id: string;
  startedAt: string;
}
export interface ViewConfirmDto {
  counted: boolean;
}
export type LibraryStatus = 'plan_to_watch' | 'watching' | 'completed' | 'on_hold' | 'dropped';
export interface LibraryInput extends VersionInput {
  status: LibraryStatus;
  isFavorite: boolean;
}
export interface ProgressInput extends VersionInput {
  positionSeconds: number;
  completed: boolean;
}
export interface LibraryDto extends LibraryInput {
  animeId: string;
  updatedAt: string;
}
export interface ProgressDto extends ProgressInput {
  episodeId: string;
  animeId: string;
  episodeNumber: number;
  durationSeconds: number | null;
  updatedAt: string;
}
export interface LibraryRow extends LibraryDto {
  anime: AnimeCardDto;
  progress: ProgressDto | null;
}
export interface ProgressRow extends ProgressDto {
  anime: AnimeCardDto;
}
export interface PersonalSummary {
  favoriteAnimeCount: number;
  inProgressEpisodeCount: number;
  completedEpisodeCount: number;
  historyEpisodeCount: number;
  preview: ProgressRow[];
}
export interface CommentInput extends VersionInput {
  body: string;
}
export interface CommentDto extends VersionInput {
  id: string;
  animeId: string;
  author: { id: string; displayName: string; avatarUrl: string | null };
  body: string | null;
  status: 'visible' | 'hidden' | 'deleted';
  createdAt: string;
  updatedAt: string;
}
export interface ModerationInput extends VersionInput {
  action: 'hide' | 'restore';
  reason: string;
}
export interface AdminCommentDto {
  comment: CommentDto;
  lastModeration: {
    action: 'hide' | 'restore';
    reason: string;
    moderatorName: string;
    moderatedAt: string;
  } | null;
}
export interface AdminAnimeInput extends VersionInput {
  title: string;
  slug: string;
  subtitle: string;
  alternativeTitles: string[];
  synopsis: string;
  releaseYear: number;
  status: AnimeSummaryDto['status'];
  format: AnimeFormat;
  publicationStatus: PublicationStatus;
  genreIds: string[];
  posterUrl: string;
  bannerUrl: string | null;
}
export interface AdminAnimeDto extends VersionInput {
  anime: AnimeCardDto;
  alternativeTitles: string[];
  publicationStatus: PublicationStatus;
  publicSlug: string | null;
  publishedEpisodes: number;
}
export interface GenreInput extends VersionInput {
  name: string;
  slug: string;
}
export interface AdminGenreDto extends GenreDto, VersionInput {
  animeCount: number;
}
export interface SeasonInput extends VersionInput {
  animeId: string;
  number: number;
  title: string;
  sortOrder: number;
}
export interface AdminSeasonDto extends SeasonDto, VersionInput {}
export interface EpisodeInput extends SeasonInput {
  seasonId: string;
  durationSeconds: number | null;
  status: 'draft' | 'published';
  thumbnailUrl: string;
}
export interface AdminEpisodeDto extends Omit<EpisodeDto, 'status' | 'publishedAt'>, VersionInput {
  animeId: string;
  status: 'draft' | 'published';
  publishedAt: string | null;
}
export interface SourceInput extends VersionInput {
  episodeId: string;
  providerKey: 'direct';
  label: string;
  language: string;
  type: 'mp4' | 'hls';
  url: string;
  enabled: boolean;
  expiresAt: string | null;
}
export interface SubtitleInput extends VersionInput {
  playbackSourceId: string;
  label: string;
  language: string;
  format: 'vtt' | 'srt';
  url: string;
  isDefault: boolean;
}
export interface AdminSourceDto extends SourceInput {
  id: string;
  createdAt: string;
}
export interface AdminSubtitleDto extends SubtitleInput {
  id: string;
}
export interface AdminUserDto {
  id: string;
  displayName: string;
  email: string;
  status: 'active' | 'blocked';
  roles: Role[];
  createdAt: string;
  version: number;
  avatarUrl: string | null;
}
export interface DashboardDto {
  totalAnime: number;
  publishedEpisodes: number;
  upcomingAnime: number;
  episodesWithoutVideo: number;
  totalSeasons: number;
  totalGenres: number;
  topViewed: RankingDto[];
  statuses: { status: AnimeSummaryDto['status']; label: string; count: number }[];
  recentAnime: {
    publicSlug: string | null;
    anime: AnimeCardDto;
    episodeCount: number;
    lastPublishedAt: string | null;
  }[];
}
