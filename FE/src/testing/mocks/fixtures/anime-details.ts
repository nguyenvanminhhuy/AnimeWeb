import { anime } from '@/testing/mocks/fixtures/anime';
import type { Anime, AnimeDetail } from '@/types/anime';
import type { Episode, Season } from '@/types/episode';

// Metadata only. No playback URL/provider is invented for these fictional titles.
export function createAnimeDetail(item: Anime): AnimeDetail {
  const key = item.id.replace('anime-', '');
  const seasons: Season[] =
    item.status === 'upcoming'
      ? []
      : [
          {
            id: `season-${key}-1`,
            animeId: item.id,
            number: 1,
            title: item.format === 'movie' ? 'Bản điện ảnh' : 'Mùa 1',
            sortOrder: 1,
          },
        ];
  const count =
    item.status === 'upcoming'
      ? 0
      : item.format === 'movie'
        ? 1
        : Number(item.episodeLabel.match(/Tập (\d+)/)?.[1] ?? 12);
  const titles = [
    'Khởi đầu của một lời hứa',
    'Những người bạn đồng hành',
    'Phía bên kia chân trời',
    'Dấu chân trên miền ký ức',
    'Bức thư chưa gửi',
    'Khoảng trời lặng im',
    'Ánh sáng cuối con đường',
    'Một vì sao mới',
  ];
  const episodes: Episode[] = Array.from({ length: count }, (_, index) => ({
    id: `episode-${key}-${String(index + 1).padStart(2, '0')}`,
    seasonId: seasons[0].id,
    number: index + 1,
    title: item.format === 'movie' ? item.title : titles[index % titles.length],
    sortOrder: (index + 1) * 10,
    durationSeconds: item.format === 'movie' ? 5400 : 1440,
    thumbnailUrl: item.posterUrl,
    publishedAt: `2026-10-${String(index + 1).padStart(2, '0')}T08:00:00Z`,
    status: 'published',
    hasPlayback: false,
  }));
  if (item.id === 'anime-01') {
    seasons.push({
      id: 'season-01-side',
      animeId: item.id,
      number: 2,
      title: 'Ngoại truyện · Những miền sao mới',
      sortOrder: 2,
    });
    for (const [index, id] of ['episode-01-side-a', 'episode-01-side-z'].entries())
      episodes.push({
        id,
        seasonId: 'season-01-side',
        number: index + 1,
        title: ['Lá thư từ bầu trời', 'Ngày chúng ta gặp lại'][index],
        sortOrder: 10 + index * 20,
        durationSeconds: 1440,
        thumbnailUrl: item.posterUrl,
        publishedAt: '2026-10-20T08:00:00Z',
        status: 'published',
        hasPlayback: false,
      });
    episodes.push({
      id: 'episode-01-draft',
      seasonId: 'season-01-1',
      number: 9,
      title: 'Tập chưa công bố',
      sortOrder: 90,
      durationSeconds: 1440,
      thumbnailUrl: item.posterUrl,
      publishedAt: '2026-10-29T08:00:00Z',
      status: 'draft',
      hasPlayback: false,
    });
  }
  return {
    ...item,
    alternativeTitles: [item.subtitle],
    seasons,
    episodes: episodes
      .filter((episode) => episode.status === 'published')
      .sort((a, b) => a.sortOrder - b.sortOrder),
    related: anime
      .filter(
        (other) =>
          other.id !== item.id && other.genres.some((genre) => item.genres.includes(genre)),
      )
      .slice(0, 4),
  };
}
