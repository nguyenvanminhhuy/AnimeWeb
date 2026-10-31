import { createSearchParams, generatePath } from 'react-router-dom';

export const routePatterns = {
  home: '/',
  explore: '/anime',
  animeDetail: '/anime/:slug',
  watch: '/watch/:episodeId',
  library: '/library',
  login: '/login',
  register: '/register',
  admin: '/admin',
  adminAnime: '/admin/anime',
  adminAnimeNew: '/admin/anime/new',
  adminAnimeEdit: '/admin/anime/:animeId/edit',
  adminGenres: '/admin/genres',
  adminUsers: '/admin/users',
  adminEpisodes: '/admin/episodes',
  adminPlayback: '/admin/playback',
  adminComments: '/admin/comments',
  adminEpisodeNew: '/admin/episodes/new',
  adminEpisodeEdit: '/admin/episodes/:episodeId/edit',
  profile: '/profile',
  changePassword: '/profile/change-password',
} as const;

export const paths = {
  home: routePatterns.home,
  explore: routePatterns.explore,
  library: routePatterns.library,
  login: routePatterns.login,
  register: routePatterns.register,
  admin: routePatterns.admin,
  adminAnime: routePatterns.adminAnime,
  adminGenres: routePatterns.adminGenres,
  adminUsers: routePatterns.adminUsers,
  adminEpisodes: routePatterns.adminEpisodes,
  adminPlayback: routePatterns.adminPlayback,
  adminComments: routePatterns.adminComments,
  adminPlaybackForEpisode: (episodeId: string) =>
    `${routePatterns.adminPlayback}?${createSearchParams({ episodeId })}`,
  adminEpisodeNew: (animeId = '', seasonId = '', returnTo: string = routePatterns.adminEpisodes) =>
    `${routePatterns.adminEpisodeNew}?${createSearchParams({ animeId, seasonId, returnTo })}`,
  adminEpisodeEdit: (episodeId: string, returnTo: string = routePatterns.adminEpisodes) =>
    `${generatePath(routePatterns.adminEpisodeEdit, { episodeId: encodeURIComponent(episodeId) })}?${createSearchParams({ returnTo })}`,
  adminAnimeNew: (returnTo?: string) =>
    `${routePatterns.adminAnimeNew}${returnTo ? `?${createSearchParams({ returnTo })}` : ''}`,
  adminAnimeEdit: (animeId: string, returnTo?: string) =>
    `${generatePath(routePatterns.adminAnimeEdit, { animeId: encodeURIComponent(animeId) })}${returnTo ? `?${createSearchParams({ returnTo })}` : ''}`,
  profile: routePatterns.profile,
  changePassword: routePatterns.changePassword,
  animeDetail: (slug: string) =>
    generatePath(routePatterns.animeDetail, { slug: encodeURIComponent(slug) }),
  watch: (episodeId: string) =>
    generatePath(routePatterns.watch, { episodeId: encodeURIComponent(episodeId) }),
  loginTo: (returnTo: string) => `${routePatterns.login}?${createSearchParams({ returnTo })}`,
  registerTo: (returnTo: string) => `${routePatterns.register}?${createSearchParams({ returnTo })}`,
};

export function safeReturnTo(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return paths.home;
  try {
    const base = 'https://anime-web.invalid';
    const url = new URL(value, base);
    const pathname = decodeURIComponent(url.pathname).replace(/\/+$/, '').toLowerCase();
    return url.origin === base && pathname !== paths.login && pathname !== paths.register
      ? url.pathname + url.search + url.hash
      : paths.home;
  } catch {
    return paths.home;
  }
}
