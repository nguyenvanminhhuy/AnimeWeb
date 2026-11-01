import type { AdminEpisodeInput, AdminSeasonInput } from '@/types/admin-episode';

export class AdminEpisodeError extends Error {
  constructor(
    message: string,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}
export function validateAdminEpisode(input: AdminSeasonInput | AdminEpisodeInput) {
  const errors: Record<string, string> = {};
  if (!input.animeId) errors.animeId = 'Chọn phim.';
  if (!input.title.trim() || input.title.trim().length > 300)
    errors.title = 'Nhập tiêu đề từ 1 đến 300 ký tự.';
  for (const key of ['number', 'sortOrder'] as const)
    if (
      (key === 'sortOrder' || !('seasonId' in input)
        ? !Number.isSafeInteger(input[key])
        : !Number.isFinite(input[key])) ||
      input[key] < 0 ||
      input[key] > (key === 'number' && 'seasonId' in input ? 999999.99 : 2147483647) ||
      (key === 'number' &&
        'seasonId' in input &&
        Math.abs(input[key] * 100 - Math.round(input[key] * 100)) > 0.000001)
    )
      errors[key] =
        key === 'number' && 'seasonId' in input
          ? 'Nhập số từ 0 đến 999999.99, tối đa 2 chữ số thập phân.'
          : 'Nhập số nguyên từ 0 đến 2147483647.';
  if ('seasonId' in input) {
    if (!input.seasonId) errors.seasonId = 'Chọn mùa/phần.';
    if (
      input.durationSeconds !== null &&
      (!Number.isSafeInteger(input.durationSeconds) ||
        input.durationSeconds < 0 ||
        input.durationSeconds > 2147483647)
    )
      errors.durationSeconds = 'Để trống hoặc nhập số giây nguyên từ 0 đến 2147483647.';
    if (input.thumbnailUrl.length > 2048) errors.thumbnailUrl = 'Địa chỉ ảnh tối đa 2048 ký tự.';
    if (!['draft', 'published'].includes(input.status)) errors.status = 'Trạng thái không hợp lệ.';
  }
  return errors;
}
