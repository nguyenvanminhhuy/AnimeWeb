import { pageRows } from '@/lib/api/mock/page';
import { assertVersion } from '@/lib/api/backend/error';
import type { AdminPlaybackRepository } from '@/lib/api/contracts/admin-playback-repository';
import { adminCatalogWorkspace } from '@/lib/api/mock/admin-catalog-workspace';
import { waitForAdminMock } from '@/lib/api/mock/admin-anime-workspace';
import type { AdminPreviewSession } from '@/types/admin';
import { AdminPlaybackError, validateAdminPlayback } from '@/utils/admin-playback-validation';
import { normalizeSearch } from '@/utils/search';

function workspace(session: AdminPreviewSession, write = false) {
  if (
    !import.meta.env.DEV ||
    !session.permissions.includes('admin:playback:read') ||
    (write && !session.permissions.includes('admin:playback:write'))
  )
    throw new AdminPlaybackError('Bạn chưa có quyền quản lý nguồn phát và phụ đề.');
  return adminCatalogWorkspace(session);
}
export const mockAdminPlaybackRepository: AdminPlaybackRepository = {
  async list(query, signal, session, fail) {
    const data = await mockAdminPlaybackRepository.getCatalog(signal, session, fail);
    const rows = (query.empty ? [] : data.sources)
      .filter(
        (row) =>
          row.episodeId === query.episodeId &&
          (!query.enabled || row.enabled === (query.enabled === 'yes')) &&
          (!query.q ||
            normalizeSearch(`${row.label} ${row.providerKey} ${row.language}`).includes(
              normalizeSearch(query.q),
            )),
      )
      .sort((a, b) =>
        query.sort === 'label'
          ? a.label.toLowerCase().localeCompare(b.label.toLowerCase()) || a.id.localeCompare(b.id)
          : Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id),
      );
    const page = pageRows(rows, query.page, query.pageSize);
    return {
      ...data,
      sources: page.rows,
      selectedSource:
        data.sources.find(
          (row) => row.id === query.sourceId && row.episodeId === query.episodeId,
        ) ?? null,
      subtitles: data.subtitles.filter((row) => row.playbackSourceId === query.sourceId),
      meta: page.meta,
    };
  },
  async getById(id, signal, session) {
    const data = await mockAdminPlaybackRepository.getCatalog(signal, session);
    return data.sources.find((row) => row.id === id) ?? null;
  },

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
      sources: store.sources,
      subtitles: store.subtitles,
    });
  },
  async saveSource(id, input, signal, session, fail) {
    workspace(session, true);
    await waitForAdminMock(signal, fail);
    const store = workspace(session, true);
    const clean = {
      version: input.version,
      expiresAt: input.expiresAt,
      episodeId: input.episodeId,
      providerKey: input.providerKey.trim(),
      label: input.label.trim(),
      language: input.language.trim(),
      type: input.type,
      url: input.url.trim(),
      enabled: input.enabled,
    };
    const fields = validateAdminPlayback(clean);
    if (!store.episodes.some((e) => e.id === clean.episodeId))
      fields.episodeId = 'Tập phim không tồn tại.';
    const current = store.sources.find((s) => s.id === id);
    if (id && !current) throw new AdminPlaybackError('Không tìm thấy nguồn phát.');
    if (current && current.episodeId !== clean.episodeId)
      fields.episodeId = 'Không chuyển nguồn sang tập khác.';
    if (
      store.sources.some(
        (s) =>
          s.id !== id &&
          s.episodeId === clean.episodeId &&
          normalizeSearch(s.label) === normalizeSearch(clean.label),
      )
    )
      fields.label = 'Nhãn nguồn đã được dùng trong tập này.';
    if (
      store.sources.some(
        (s) => s.id !== id && s.episodeId === clean.episodeId && s.url === clean.url,
      )
    )
      fields.url = 'Địa chỉ nguồn đã được dùng trong tập này.';
    if (Object.keys(fields).length)
      throw new AdminPlaybackError('Kiểm tra thông tin nguồn phát.', fields);
    assertVersion(current?.version ?? 0, input.version);
    if (current) {
      Object.assign(current, clean, { version: current.version + 1 });
    } else
      store.sources.push({
        ...clean,
        version: 1,
        createdAt: new Date().toISOString(),
        id: `admin-source-${crypto.randomUUID()}`,
      });
    // Configuration is unverified; never mark an episode playable or mutate the public player.
  },
  async saveSubtitle(id, input, signal, session, fail) {
    workspace(session, true);
    await waitForAdminMock(signal, fail);
    const store = workspace(session, true);
    const clean = {
      version: input.version,
      playbackSourceId: input.playbackSourceId,
      label: input.label.trim(),
      language: input.language.trim(),
      format: input.format,
      url: input.url.trim(),
      isDefault: input.isDefault,
    };
    const fields = validateAdminPlayback(clean);
    if (!store.sources.some((s) => s.id === clean.playbackSourceId))
      fields.playbackSourceId = 'Nguồn phát không tồn tại.';
    const current = store.subtitles.find((s) => s.id === id);
    if (id && !current) throw new AdminPlaybackError('Không tìm thấy phụ đề.');
    if (current && current.playbackSourceId !== clean.playbackSourceId)
      fields.playbackSourceId = 'Không chuyển phụ đề sang nguồn khác.';
    if (
      store.subtitles.some(
        (s) =>
          s.id !== id &&
          s.playbackSourceId === clean.playbackSourceId &&
          s.language === clean.language &&
          normalizeSearch(s.label) === normalizeSearch(clean.label),
      )
    )
      fields.label = 'Phụ đề cùng ngôn ngữ và nhãn đã tồn tại.';
    if (
      store.subtitles.some(
        (s) => s.id !== id && s.playbackSourceId === clean.playbackSourceId && s.url === clean.url,
      )
    )
      fields.url = 'Địa chỉ phụ đề đã được dùng cho nguồn này.';
    if (Object.keys(fields).length)
      throw new AdminPlaybackError('Kiểm tra thông tin phụ đề.', fields);
    assertVersion(current?.version ?? 0, input.version);
    if (clean.isDefault)
      for (const row of store.subtitles)
        if (row.playbackSourceId === clean.playbackSourceId && row.id !== id)
          if (row.isDefault) {
            row.isDefault = false;
            row.version++;
          }
    if (current) {
      assertVersion(current.version, input.version);
      Object.assign(current, clean, { version: current.version + 1 });
    } else
      store.subtitles.push({ ...clean, version: 1, id: `admin-subtitle-${crypto.randomUUID()}` });
  },
  async remove(kind, id, version, signal, session, fail) {
    workspace(session, true);
    await waitForAdminMock(signal, fail);
    const store = workspace(session, true);
    if (kind === 'source') {
      const index = store.sources.findIndex((s) => s.id === id);
      if (index < 0) throw new AdminPlaybackError('Không tìm thấy nguồn phát.');
      if (store.subtitles.some((s) => s.playbackSourceId === id))
        throw new AdminPlaybackError('Nguồn còn phụ đề. Xoá phụ đề trước; không xoá dây chuyền.');
      assertVersion(store.sources[index].version, version);
      store.sources.splice(index, 1);
    } else {
      const index = store.subtitles.findIndex((s) => s.id === id);
      if (index < 0) throw new AdminPlaybackError('Không tìm thấy phụ đề.');
      assertVersion(store.subtitles[index].version, version);
      store.subtitles.splice(index, 1);
      // Removing the default track leaves no default; do not silently select another language.
    }
  },
};
