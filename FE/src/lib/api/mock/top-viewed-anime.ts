import { anime } from '@/testing/mocks/fixtures/anime';
import { animeViewCounts } from '@/testing/mocks/fixtures/anime-views';
import type { TopViewedAnimeEntry } from '@/types/anime';

export function getTopViewedAnime(): TopViewedAnimeEntry[] {
  return anime
    .filter((item) => item.status !== 'upcoming' && (animeViewCounts[item.id] ?? 0) > 0)
    .map((item) => ({
      anime: { ...item, genres: [...item.genres] },
      viewCount: animeViewCounts[item.id],
    }))
    .sort((a, b) => b.viewCount - a.viewCount || a.anime.id.localeCompare(b.anime.id))
    .slice(0, 10);
}
