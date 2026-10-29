import type { PlaybackRepository } from '@/lib/api/contracts/playback-repository';
import { anime } from '@/testing/mocks/fixtures/anime';
import { createAnimeDetail } from '@/testing/mocks/fixtures/anime-details';

export const mockPlaybackRepository: PlaybackRepository = {
  async getEpisode(id, state) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (state === 'error') throw new Error('Không thể tải thông tin tập phim.');
    for (const item of anime) {
      const detail = createAnimeDetail(item);
      const episode = detail.episodes.find((entry) => entry.id === id);
      if (!episode) continue;
      const seasons = [...detail.seasons].sort((a, b) => a.sortOrder - b.sortOrder);
      const episodes = seasons.flatMap((season) =>
        detail.episodes
          .filter((entry) => entry.seasonId === season.id)
          .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)),
      );
      // No local licensed video exists. Published metadata does not imply playback availability.
      return { anime: detail, episode, episodes: state === 'empty' ? [] : episodes, sources: [] };
    }
    return null;
  },
};
