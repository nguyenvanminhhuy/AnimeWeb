import type { AdminGenreRepository } from '@/lib/api/contracts/admin-genre-repository';
import type { AdminPreviewSession } from '@/types/admin';
import type { AdminGenreInput } from '@/types/admin-genre';
import { adminCatalogWorkspace } from '@/lib/api/mock/admin-catalog-workspace';
import { waitForAdminMock } from '@/lib/api/mock/admin-anime-workspace';
import { AdminGenreError, validateAdminGenre } from '@/utils/admin-genre-validation';
import { normalizeSearch } from '@/utils/search';

function workspace(session: AdminPreviewSession, write = false) {
  if (
    !import.meta.env.DEV ||
    !session.permissions.includes('admin:genre:read') ||
    (write && !session.permissions.includes('admin:genre:write'))
  )
    throw new AdminGenreError('Bạn không có quyền thực hiện thao tác thể loại này.');
  return adminCatalogWorkspace(session);
}
function validated(input: AdminGenreInput, session: AdminPreviewSession, id?: string) {
  const clean = {
    name: input.name.trim().replace(/\s+/g, ' ').normalize('NFC'),
    slug: input.slug.trim(),
  };
  const fields = validateAdminGenre(clean);
  const genres = workspace(session, true).genres;
  if (
    genres.some(
      (item) => item.id !== id && normalizeSearch(item.name) === normalizeSearch(clean.name),
    )
  )
    fields.name = 'Tên thể loại này đã được sử dụng.';
  if (genres.some((item) => item.id !== id && item.slug === clean.slug))
    fields.slug = 'Slug này đã được sử dụng.';
  if (Object.keys(fields).length)
    throw new AdminGenreError('Kiểm tra lại thông tin thể loại.', fields);
  return clean;
}
export const mockAdminGenreRepository: AdminGenreRepository = {
  async list(query, state, signal, session) {
    workspace(session);
    await waitForAdminMock(signal, state === 'error');
    const data = workspace(session);
    const search = normalizeSearch(query.q);
    const rows = (state === 'empty' ? [] : data.genres)
      .map((genre) => ({
        ...genre,
        animeCount: data.anime.filter((row) => row.anime.genres.includes(genre.name)).length,
      }))
      .filter(
        (row) =>
          (!search || normalizeSearch(`${row.name} ${row.slug}`).includes(search)) &&
          (query.usage === 'used'
            ? row.animeCount > 0
            : query.usage === 'unused'
              ? row.animeCount === 0
              : true),
      )
      .sort(
        (a, b) =>
          (query.sort === 'name-desc' ? -1 : 1) * a.name.localeCompare(b.name, 'vi') ||
          a.id.localeCompare(b.id),
      );
    const total = rows.length;
    const totalPages = Math.ceil(total / query.pageSize);
    const page = Math.min(query.page, Math.max(1, totalPages));
    return structuredClone({
      data: rows.slice((page - 1) * query.pageSize, page * query.pageSize),
      meta: { total, totalPages, page, pageSize: query.pageSize },
    });
  },
  async options(signal, session) {
    // Anime editors may read taxonomy options without access to the management page.
    if (
      !import.meta.env.DEV ||
      !session.permissions.some((permission) =>
        ['admin:genre:read', 'admin:anime:read'].includes(permission),
      )
    )
      throw new AdminGenreError('Bạn không có quyền đọc thể loại.');
    await waitForAdminMock(signal);
    return structuredClone(adminCatalogWorkspace(session).genres).sort((a, b) =>
      a.name.localeCompare(b.name, 'vi'),
    );
  },
  async create(input, signal, session, fail) {
    workspace(session, true);
    await waitForAdminMock(signal, fail);
    const data = workspace(session, true);
    const row = { ...validated(input, session), id: `genre-${crypto.randomUUID()}` };
    data.genres.push(row);
    return structuredClone(row);
  },
  async update(id, input, signal, session, fail) {
    workspace(session, true);
    await waitForAdminMock(signal, fail);
    const data = workspace(session, true);
    const row = data.genres.find((item) => item.id === id);
    if (!row) throw new AdminGenreError('Thể loại không còn tồn tại trong phiên mẫu.');
    const clean = validated(input, session, id);
    // Only rename references inside the same admin snapshot; never change public fixtures.
    for (const item of data.anime)
      item.anime.genres = item.anime.genres.map((name) => (name === row.name ? clean.name : name));
    Object.assign(row, clean);
    return structuredClone(row);
  },
  async remove(id, signal, session, fail) {
    workspace(session, true);
    await waitForAdminMock(signal, fail);
    const data = workspace(session, true);
    const index = data.genres.findIndex((row) => row.id === id);
    if (index < 0) throw new AdminGenreError('Thể loại không còn tồn tại trong phiên mẫu.');
    if (data.anime.some((row) => row.anime.genres.includes(data.genres[index].name)))
      throw new AdminGenreError(
        'Không thể xoá thể loại đang được phim sử dụng. Hãy đổi thể loại của các phim liên quan trước.',
      );
    data.genres.splice(index, 1);
  },
};
