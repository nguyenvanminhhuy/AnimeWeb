import type { AdminEpisodeRepository } from '@/lib/api/contracts/admin-episode-repository';
import { adminCatalogWorkspace } from '@/lib/api/mock/admin-catalog-workspace';
import { waitForAdminMock } from '@/lib/api/mock/admin-anime-workspace';
import type { AdminPreviewSession } from '@/types/admin';
import { AdminEpisodeError, validateAdminEpisode } from '@/utils/admin-episode-validation';

function workspace(session: AdminPreviewSession, write = false) {
  if (
    !import.meta.env.DEV ||
    !session.permissions.includes('admin:episode:read') ||
    (write && !session.permissions.includes('admin:episode:write'))
  )
    throw new AdminEpisodeError('Bạn chưa có quyền thực hiện thao tác này.');
  return adminCatalogWorkspace(session);
}
function syncCounts(session: AdminPreviewSession) {
  const store = workspace(session, true);
  for (const row of store.anime) {
    const ids = new Set(store.seasons.filter((s) => s.animeId === row.anime.id).map((s) => s.id));
    row.publishedEpisodes = store.episodes.filter(
      (e) => ids.has(e.seasonId) && e.status === 'published',
    ).length;
  }
}
export const mockAdminEpisodeRepository: AdminEpisodeRepository = {
  async getCatalog(signal, session, fail) {
    workspace(session);
    await waitForAdminMock(signal, fail);
    const store = workspace(session);
    return structuredClone({
      anime: store.anime.map(({ anime }) => ({
        id: anime.id,
        title: anime.title,
        status: anime.status,
      })),
      seasons: store.seasons,
      episodes: store.episodes,
    });
  },
  async saveSeason(id, input, signal, session, fail) {
    workspace(session, true);
    await waitForAdminMock(signal, fail);
    const store = workspace(session, true);
    const clean = {
      animeId: input.animeId,
      title: input.title.trim(),
      number: input.number,
      sortOrder: input.sortOrder,
    };
    const fields = validateAdminEpisode(clean);
    if (!store.anime.some((row) => row.anime.id === clean.animeId))
      fields.animeId = 'Phim không tồn tại.';
    const current = store.seasons.find((s) => s.id === id);
    if (id && !current) throw new AdminEpisodeError('Không tìm thấy mùa/phần.');
    if (current && current.animeId !== clean.animeId)
      fields.animeId = 'Không chuyển mùa sang phim khác.';
    for (const key of ['number', 'sortOrder'] as const)
      if (
        store.seasons.some(
          (s) => s.id !== id && s.animeId === clean.animeId && s[key] === clean[key],
        )
      )
        fields[key] = 'Giá trị đã được dùng trong phim này.';
    if (Object.keys(fields).length)
      throw new AdminEpisodeError('Kiểm tra thông tin mùa/phần.', fields);
    if (current) Object.assign(current, clean);
    else store.seasons.push({ ...clean, id: `admin-season-${crypto.randomUUID()}` });
  },
  async saveEpisode(id, input, signal, session, fail) {
    workspace(session, true);
    await waitForAdminMock(signal, fail);
    const store = workspace(session, true);
    const clean = {
      animeId: input.animeId,
      seasonId: input.seasonId,
      title: input.title.trim(),
      number: input.number,
      sortOrder: input.sortOrder,
      durationSeconds: input.durationSeconds,
      status: input.status,
    };
    const fields = validateAdminEpisode(clean);
    const season = store.seasons.find(
      (s) => s.id === clean.seasonId && s.animeId === clean.animeId,
    );
    if (!season) fields.seasonId = 'Mùa/phần không thuộc phim đã chọn.';
    const anime = store.anime.find((row) => row.anime.id === clean.animeId)?.anime;
    if (!anime) fields.animeId = 'Phim không tồn tại.';
    if (anime?.status === 'upcoming' && clean.status === 'published')
      fields.status = 'Phim sắp ra mắt chỉ được lưu tập nháp.';
    const current = store.episodes.find((e) => e.id === id);
    if (id && !current) throw new AdminEpisodeError('Không tìm thấy tập phim.');
    if (current && current.seasonId !== clean.seasonId)
      fields.seasonId = 'Không chuyển tập sang mùa khác; tạo tập mới nếu cần.';
    if (current?.status === 'published' && clean.status !== 'published')
      fields.status = 'Chưa hỗ trợ thu hồi tập đã công bố.';
    for (const key of ['number', 'sortOrder'] as const)
      if (
        store.episodes.some(
          (e) => e.id !== id && e.seasonId === clean.seasonId && e[key] === clean[key],
        )
      )
        fields[key] = 'Giá trị đã được dùng trong mùa này.';
    if (Object.keys(fields).length)
      throw new AdminEpisodeError('Kiểm tra thông tin tập phim.', fields);
    const { animeId: _animeId, ...metadata } = clean;
    if (current)
      Object.assign(current, metadata, {
        publishedAt:
          current.publishedAt ?? (clean.status === 'published' ? new Date().toISOString() : null),
      });
    else
      store.episodes.push({
        ...metadata,
        id: `admin-episode-${crypto.randomUUID()}`,
        thumbnailUrl: anime!.posterUrl,
        publishedAt: clean.status === 'published' ? new Date().toISOString() : null,
        hasPlayback: false,
      });
    syncCounts(session);
  },
  async remove(kind, id, signal, session, fail) {
    workspace(session, true);
    await waitForAdminMock(signal, fail);
    const store = workspace(session, true);
    if (kind === 'season') {
      const index = store.seasons.findIndex((s) => s.id === id);
      if (index < 0) throw new AdminEpisodeError('Không tìm thấy mùa/phần.');
      if (store.episodes.some((e) => e.seasonId === id))
        throw new AdminEpisodeError(
          'Mùa còn tập phim. Hãy xử lý các tập trước; không xoá dây chuyền.',
        );
      store.seasons.splice(index, 1);
    } else {
      const index = store.episodes.findIndex((e) => e.id === id);
      if (index < 0) throw new AdminEpisodeError('Không tìm thấy tập phim.');
      if (store.sources.some((source) => source.episodeId === id))
        throw new AdminEpisodeError(
          'Tập còn nguồn phát. Xử lý nguồn và phụ đề trước; không xoá dây chuyền.',
        );
      if (store.episodes[index].status === 'published')
        throw new AdminEpisodeError(
          'Không thể xoá tập đã công bố khi chưa có chính sách lịch sử xem. Chỉ xoá tập nháp.',
        );
      store.episodes.splice(index, 1);
    }
    syncCounts(session);
  },
};
