import { formatOptions, genreOptions, statusOptions } from '@/config/catalog';
import type { AdminAnimeFields, AdminAnimeInput } from '@/types/admin-anime';

export class AdminAnimeError extends Error {
  constructor(
    message: string,
    public fields: AdminAnimeFields = {},
  ) {
    super(message);
    this.name = 'AdminAnimeError';
  }
}

export function validateAdminAnime(
  input: AdminAnimeInput,
  genreNames: readonly string[] = genreOptions.map((item) => item.label),
): AdminAnimeFields {
  const errors: AdminAnimeFields = {};
  if (!input.title.trim() || input.title.trim().length > 300)
    errors.title = 'Nhập tên phim từ 1 đến 300 ký tự.';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug) || input.slug.length > 200)
    errors.slug = 'Slug tối đa 200 ký tự, chỉ gồm chữ thường không dấu, số và dấu nối.';
  if (input.subtitle.trim().length > 300) errors.subtitle = 'Tên tiếng Anh tối đa 300 ký tự.';
  if (input.synopsis.trim().length > 10000) errors.synopsis = 'Nhập mô tả tối đa 10000 ký tự.';
  if (!Number.isInteger(input.releaseYear) || input.releaseYear < 1 || input.releaseYear > 9999)
    errors.releaseYear = 'Năm phát hành phải là số nguyên từ 1 đến 9999.';
  if (!statusOptions.some((item) => item.value === input.status))
    errors.status = 'Chọn trạng thái hợp lệ.';
  if (!formatOptions.some((item) => item.value === input.format))
    errors.format = 'Chọn định dạng hợp lệ.';
  if (!input.genres.length || input.genres.some((genre) => !genreNames.includes(genre)))
    errors.genres = 'Chọn ít nhất một thể loại hợp lệ.';
  for (const field of ['posterUrl', 'bannerUrl'] as const)
    if ((field === 'posterUrl' && !input[field]) || input[field].length > 2048)
      errors[field] = 'Nhập địa chỉ ảnh hợp lệ, tối đa 2048 ký tự.';
  if (!['draft', 'published'].includes(input.publicationStatus))
    errors.publicationStatus = 'Chọn trạng thái công khai.';
  if (
    input.alternativeTitles.filter((value) => value.trim()).length > 20 ||
    input.alternativeTitles.some((value) => value.length > 300)
  )
    errors.alternativeTitles = 'Tối đa 20 tên khác, mỗi tên tối đa 300 ký tự.';
  return errors;
}
