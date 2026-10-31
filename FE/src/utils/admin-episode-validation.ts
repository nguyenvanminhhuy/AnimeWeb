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
  if (!input.title.trim() || input.title.trim().length > 200)
    errors.title = 'Nhập tiêu đề từ 1 đến 200 ký tự.';
  for (const key of ['number', 'sortOrder'] as const)
    if (!Number.isSafeInteger(input[key]) || input[key] < 1 || input[key] > 100000)
      errors[key] = 'Nhập số nguyên từ 1 đến 100000.';
  if ('seasonId' in input) {
    if (!input.seasonId) errors.seasonId = 'Chọn mùa/phần.';
    if (
      !Number.isSafeInteger(input.durationSeconds) ||
      input.durationSeconds < 1 ||
      input.durationSeconds > 86400
    )
      errors.durationSeconds = 'Thời lượng từ 1 đến 86400 giây.';
    if (!['draft', 'published'].includes(input.status)) errors.status = 'Trạng thái không hợp lệ.';
  }
  return errors;
}
