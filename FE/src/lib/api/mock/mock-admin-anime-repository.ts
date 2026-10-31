import type { AdminAnimeRepository } from '@/lib/api/contracts/admin-anime-repository';
import type { AdminAnimeInput, AdminAnimeRow } from '@/types/admin-anime';
import { adminAnimeWorkspace, waitForAdminMock } from '@/lib/api/mock/admin-anime-workspace';
import { adminCatalogWorkspace } from '@/lib/api/mock/admin-catalog-workspace';
import type { AdminPreviewSession } from '@/types/admin';
import { normalizeSearch } from '@/utils/search';
import { AdminAnimeError, validateAdminAnime } from '@/utils/admin-anime-validation';

function validated(
  input: AdminAnimeInput,
  rows: AdminAnimeRow[],
  session: AdminPreviewSession,
  id?: string,
): AdminAnimeInput {
  const clean: AdminAnimeInput = {
    title: input.title.trim(),
    subtitle: input.subtitle.trim(),
    synopsis: input.synopsis.trim(),
    slug: input.slug.trim(),
    genres: [...new Set(input.genres)],
    releaseYear: input.releaseYear,
    status: input.status,
    format: input.format,
    posterUrl: input.posterUrl,
    bannerUrl: input.bannerUrl,
  };
  const errors = validateAdminAnime(
    clean,
    adminCatalogWorkspace(session).genres.map((item) => item.name),
  );
  if (rows.some((row) => row.anime.id !== id && row.anime.slug === clean.slug))
    errors.slug = 'Slug này đã được sử dụng.';
  const current = rows.find((row) => row.anime.id === id);
  if (current?.publishedEpisodes) {
    if (current.anime.format !== clean.format)
      errors.format = 'Phim đã có tập; chưa hỗ trợ đổi định dạng.';
    if (clean.status === 'upcoming')
      errors.status = 'Phim đã có tập công khai, không thể chuyển về sắp ra mắt.';
  }
  if (Object.keys(errors).length) throw new AdminAnimeError('Kiểm tra lại thông tin phim.', errors);
  return clean;
}

export const mockAdminAnimeRepository: AdminAnimeRepository = {
  async list(query, state, signal, session) {
    adminAnimeWorkspace(session);
    await waitForAdminMock(signal, state === 'error');
    const rows = adminAnimeWorkspace(session);
    const search = normalizeSearch(query.q);
    const genres = adminCatalogWorkspace(session).genres;
    const genre = genres.find((option) => option.slug === query.genre)?.name;
    const items = (state === 'empty' ? [] : rows)
      .filter(
        ({ anime }) =>
          (!search || normalizeSearch(`${anime.title} ${anime.subtitle}`).includes(search)) &&
          (!query.genre || Boolean(genre && anime.genres.includes(genre))) &&
          (!query.year || anime.releaseYear === Number(query.year)) &&
          (!query.status || anime.status === query.status) &&
          (!query.format || anime.format === query.format),
      )
      .sort((a, b) =>
        query.sort === 'title'
          ? a.anime.title.localeCompare(b.anime.title, 'vi') || a.anime.id.localeCompare(b.anime.id)
          : b.anime.releaseYear - a.anime.releaseYear || a.anime.id.localeCompare(b.anime.id),
      );
    const total = items.length;
    const totalPages = Math.ceil(total / query.pageSize);
    const page = Math.min(query.page, Math.max(1, totalPages));
    return structuredClone({
      data: items.slice((page - 1) * query.pageSize, page * query.pageSize),
      years: [...new Set(rows.map((row) => row.anime.releaseYear))].sort((a, b) => b - a),
      genreOptions: genres.map((item) => ({ value: item.slug, label: item.name })),
      meta: { total, totalPages, page, pageSize: query.pageSize },
    });
  },
  async get(id, signal, session, fail) {
    adminAnimeWorkspace(session);
    await waitForAdminMock(signal, fail);
    return structuredClone(adminAnimeWorkspace(session).find((row) => row.anime.id === id) ?? null);
  },
  async create(input, signal, session, fail) {
    adminAnimeWorkspace(session, true);
    await waitForAdminMock(signal, fail);
    const rows = adminAnimeWorkspace(session, true);
    const row: AdminAnimeRow = {
      anime: {
        ...validated(input, rows, session),
        id: `admin-anime-${crypto.randomUUID()}`,
        episodeLabel: 'Chưa có tập',
      },
      publishedEpisodes: 0,
      publicSlug: null,
    };
    rows.push(row);
    return structuredClone(row);
  },
  async update(id, input, signal, session, fail) {
    adminAnimeWorkspace(session, true);
    await waitForAdminMock(signal, fail);
    const rows = adminAnimeWorkspace(session, true);
    const row = rows.find((item) => item.anime.id === id);
    if (!row) throw new AdminAnimeError('Phim không còn tồn tại trong phiên mẫu.');
    row.anime = { ...row.anime, ...validated(input, rows, session, id) };
    return structuredClone(row);
  },
  async remove(id, signal, session, fail) {
    adminAnimeWorkspace(session, true);
    await waitForAdminMock(signal, fail);
    const rows = adminAnimeWorkspace(session, true);
    const index = rows.findIndex((row) => row.anime.id === id);
    if (index < 0) throw new AdminAnimeError('Phim không còn tồn tại trong phiên mẫu.');
    if (rows[index].publishedEpisodes > 0)
      throw new AdminAnimeError(
        'Không thể xoá phim đã có tập công khai. Không xoá dây chuyền các tập hoặc lịch sử.',
      );
    if (adminCatalogWorkspace(session).seasons.some((season) => season.animeId === id))
      throw new AdminAnimeError(
        'Không thể xoá phim còn mùa/phần. Không xoá dây chuyền các tập hoặc lịch sử.',
      );
    rows.splice(index, 1);
  },
};
