import type { AnimeRepository } from '@/lib/api/contracts/anime-repository';
import { anime } from '@/testing/mocks/fixtures/anime';
import { createAnimeDetail } from '@/testing/mocks/fixtures/anime-details';
import { genreOptions } from '@/config/catalog';
import { normalizeSearch } from '@/utils/search';
import { getTopViewedAnime } from '@/lib/api/mock/top-viewed-anime';
export const mockAnimeRepository: AnimeRepository = {
  async getBySlug(slug, state) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (state === 'error') throw new Error('Không thể tải chi tiết anime demo.');
    const item = anime.find((value) => value.slug === slug);
    if (!item) return null;
    const detail = createAnimeDetail(item);
    return state === 'empty' ? { ...detail, episodes: [], related: [] } : detail;
  },
  async getByIds(ids, state) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (state === 'error') throw new Error('Không thể tải thông tin trong thư viện demo.');
    return state === 'empty' ? [] : anime.filter((item) => ids.includes(item.id));
  },
  async getHome(state) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    if (state === 'error') throw new Error('Không thể tải danh sách anime demo.');
    if (state === 'empty') return { featured: [], updated: [], recommended: [], topViewed: [] };
    return {
      featured: [anime[0], anime[2], anime[4]],
      updated: anime.slice(0, 6),
      recommended: [anime[5], anime[3], anime[6], anime[7]],
      topViewed: getTopViewedAnime(),
    };
  },
  async list(query, state) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    if (state === 'error') throw new Error('Không thể tải danh mục demo.');
    const genreLabel = genreOptions.find((option) => option.value === query.genre)?.label;
    const search = normalizeSearch(query.q);
    const items = (state === 'empty' ? [] : anime).filter(
      (item) =>
        (!search || normalizeSearch(`${item.title} ${item.subtitle}`).includes(search)) &&
        (!genreLabel || item.genres.includes(genreLabel)) &&
        (!query.year || item.releaseYear === Number(query.year)) &&
        (!query.status || item.status === query.status) &&
        (!query.format || item.format === query.format),
    );
    items.sort((a, b) =>
      query.sort === 'title'
        ? a.title.localeCompare(b.title, 'vi') || a.id.localeCompare(b.id)
        : b.releaseYear - a.releaseYear || a.id.localeCompare(b.id),
    );
    const total = items.length;
    const totalPages = Math.ceil(total / query.pageSize);
    const page = Math.min(query.page, Math.max(1, totalPages));
    return {
      data: items.slice((page - 1) * query.pageSize, page * query.pageSize),
      meta: { page, pageSize: query.pageSize, total, totalPages },
    };
  },
};
