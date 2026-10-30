import type { AdminDashboardRepository } from '@/lib/api/contracts/admin-dashboard-repository';
import { anime } from '@/testing/mocks/fixtures/anime';
import { createAnimeDetail } from '@/testing/mocks/fixtures/anime-details';
import { statusOptions } from '@/config/catalog';

export const mockAdminDashboardRepository: AdminDashboardRepository = {
  async getOverview(state, signal) {
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
    const items = state === 'empty' ? [] : anime;
    const details = items.map(createAnimeDetail);
    const episodes = details.flatMap((item) => item.episodes);
    return {
      totalAnime: items.length,
      publishedEpisodes: episodes.length,
      upcomingAnime: items.filter((item) => item.status === 'upcoming').length,
      episodesWithoutVideo: episodes.filter((episode) => !episode.hasPlayback).length,
      totalSeasons: details.reduce((total, item) => total + item.seasons.length, 0),
      totalGenres: new Set(items.flatMap((item) => item.genres)).size,
      statuses: statusOptions.map((option) => ({
        status: option.value,
        label: option.label,
        count: items.filter((item) => item.status === option.value).length,
      })),
      recentAnime: details
        .map((item) => ({
          anime: items.find((entry) => entry.id === item.id)!,
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
