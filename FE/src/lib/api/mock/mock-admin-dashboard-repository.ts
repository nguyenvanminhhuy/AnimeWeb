import type { AdminDashboardRepository } from '@/lib/api/contracts/admin-dashboard-repository';
import { statusOptions } from '@/config/catalog';
import { adminAnimeWorkspace } from '@/lib/api/mock/admin-anime-workspace';
import { adminCatalogWorkspace } from '@/lib/api/mock/admin-catalog-workspace';
import { getTopViewedAnime } from '@/lib/api/mock/top-viewed-anime';

export const mockAdminDashboardRepository: AdminDashboardRepository = {
  async getOverview(state, signal, session) {
    await new Promise<void>((resolve, reject) => {
      if (signal.aborted) {
        reject(new DOMException('Cancelled', 'AbortError'));
        return;
      }
      const onAbort = () => {
        clearTimeout(timer);
        reject(new DOMException('Cancelled', 'AbortError'));
      };
      const timer = setTimeout(() => {
        signal.removeEventListener('abort', onAbort);
        resolve();
      }, 250);
      signal.addEventListener('abort', onAbort, { once: true });
    });
    if (state === 'error') throw new Error('Không thể tải dữ liệu tổng quan.');
    const rows = state === 'empty' ? [] : adminAnimeWorkspace(session);
    const items = rows.map((row) => row.anime);
    const details = rows.map((row) => {
      const store = adminCatalogWorkspace(session);
      const seasons = store.seasons.filter((season) => season.animeId === row.anime.id);
      const ids = new Set(seasons.map((season) => season.id));
      return {
        ...row.anime,
        seasons,
        episodes: store.episodes.filter(
          (episode) => ids.has(episode.seasonId) && episode.status === 'published',
        ),
        publicSlug: row.publicSlug,
      };
    });
    const episodes = details.flatMap((item) => item.episodes);
    return {
      totalAnime: items.length,
      topViewed: state === 'empty' ? [] : getTopViewedAnime(),
      publishedEpisodes: episodes.length,
      upcomingAnime: items.filter((item) => item.status === 'upcoming').length,
      episodesWithoutVideo: episodes.filter((episode) => !episode.hasPlayback).length,
      totalSeasons: details.reduce((total, item) => total + item.seasons.length, 0),
      totalGenres: state === 'empty' ? 0 : adminCatalogWorkspace(session).genres.length,
      statuses: statusOptions.map((option) => ({
        status: option.value,
        label: option.label,
        count: items.filter((item) => item.status === option.value).length,
      })),
      recentAnime: details
        .map((item) => ({
          anime: items.find((entry) => entry.id === item.id)!,
          publicSlug: item.publicSlug,
          episodeCount: item.episodes.length,
          lastPublishedAt:
            item.episodes
              .map((episode) => episode.publishedAt)
              .sort()
              .at(-1) ?? null,
        }))
        .sort(
          (a, b) =>
            (b.lastPublishedAt ?? '').localeCompare(a.lastPublishedAt ?? '') ||
            a.anime.id.localeCompare(b.anime.id),
        )
        .slice(0, 6),
    };
  },
};
