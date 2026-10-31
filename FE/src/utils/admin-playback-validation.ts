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
      ((value.startsWith('/') &&
        !value.startsWith('//') &&
        url.origin === 'https://anime-web.invalid') ||
        (/^https:\/\//i.test(value) && url.protocol === 'https:'))
    );
  } catch {
    return false;
  }
}
export function validateAdminPlayback(input: AdminSourceInput | AdminSubtitleInput) {
  const fields: Record<string, string> = {};
  if (!input.label.trim() || input.label.trim().length > 100)
    fields.label = 'Nhập nhãn từ 1 đến 100 ký tự.';
  try {
    if (
      !/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(input.language) ||
      !Intl.getCanonicalLocales(input.language).length
    )
      throw new Error();
  } catch {
    fields.language = 'Nhập mã ngôn ngữ hợp lệ, ví dụ vi, ja hoặc en-US.';
  }
  if (!validMediaReference(input.url))
    fields.url =
      'Nhập URL HTTPS hoặc đường dẫn nội bộ bắt đầu bằng /, không chứa tài khoản hoặc fragment.';
  if ('episodeId' in input) {
    if (!input.episodeId) fields.episodeId = 'Chọn tập phim.';
    if (!/^[a-z0-9][a-z0-9-]{0,49}$/.test(input.providerKey))
      fields.providerKey = 'Mã nhà cung cấp gồm chữ thường, số, dấu nối; tối đa 50 ký tự.';
    if (!['mp4', 'hls'].includes(input.type)) fields.type = 'Định dạng nguồn không hợp lệ.';
    if (typeof input.enabled !== 'boolean') fields.enabled = 'Trạng thái không hợp lệ.';
  } else {
    if (!input.playbackSourceId) fields.playbackSourceId = 'Chọn nguồn phát.';
    if (!['vtt', 'srt'].includes(input.format)) fields.format = 'Định dạng phụ đề không hợp lệ.';
    if (typeof input.isDefault !== 'boolean') fields.isDefault = 'Giá trị mặc định không hợp lệ.';
  }
  return fields;
}
