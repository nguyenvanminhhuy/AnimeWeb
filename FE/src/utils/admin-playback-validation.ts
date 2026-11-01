import type { AdminSourceInput, AdminSubtitleInput } from '@/types/admin-playback';

export class AdminPlaybackError extends Error {
  constructor(
    message: string,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}
export function validMediaReference(value: string) {
  if (!value || value.length > 2048 || /[\s\\\u0000-\u001f]/u.test(value)) return false;
  try {
    const url = new URL(value, 'https://anime-web.invalid');
    return (
      !url.username &&
      !url.password &&
      !url.hash &&
      (/^https:\/\//i.test(value) || (import.meta.env.DEV && /^http:\/\//i.test(value)))
    );
  } catch {
    return false;
  }
}
export function validateAdminPlayback(input: AdminSourceInput | AdminSubtitleInput) {
  const fields: Record<string, string> = {};
  if (!input.label.trim() || input.label.trim().length > 100)
    fields.label = 'Nhập nhãn từ 1 đến 100 ký tự.';
  if (!input.language.trim() || input.language.trim().length > 30)
    fields.language = 'Nhập ngôn ngữ từ 1 đến 30 ký tự.';
  if (!validMediaReference(input.url))
    fields.url =
      'Nhập URL HTTPS tuyệt đối (HTTP được phép ở dev), không chứa tài khoản hoặc fragment.';
  if ('episodeId' in input) {
    if (
      input.expiresAt &&
      (!/^\d{4}-\d{2}-\d{2}T/.test(input.expiresAt) ||
        !Number.isFinite(Date.parse(input.expiresAt)))
    )
      fields.expiresAt = 'Nhập thời điểm ISO 8601 hợp lệ.';
    if (!input.episodeId) fields.episodeId = 'Chọn tập phim.';
    if (input.providerKey !== 'direct')
      fields.providerKey = 'API hiện chỉ hỗ trợ nhà cung cấp direct.';
    if (!['mp4', 'hls'].includes(input.type)) fields.type = 'Định dạng nguồn không hợp lệ.';
    if (typeof input.enabled !== 'boolean') fields.enabled = 'Trạng thái không hợp lệ.';
  } else {
    if (!input.playbackSourceId) fields.playbackSourceId = 'Chọn nguồn phát.';
    if (!['vtt', 'srt'].includes(input.format)) fields.format = 'Định dạng phụ đề không hợp lệ.';
    if (typeof input.isDefault !== 'boolean') fields.isDefault = 'Giá trị mặc định không hợp lệ.';
  }
  return fields;
}
