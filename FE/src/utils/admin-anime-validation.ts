import { animeArtwork } from '@/config/anime-artwork';
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
  if (!input.title.trim() || input.title.trim().length > 200)
    errors.title = 'Nhập tên phim từ 1 đến 200 ký tự.';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug) || input.slug.length > 200)
    errors.slug = 'Slug tối đa 200 ký tự, chỉ gồm chữ thường không dấu, số và dấu nối.';
  if (input.subtitle.trim().length > 200) errors.subtitle = 'Tên tiếng Anh tối đa 200 ký tự.';
  if (!input.synopsis.trim() || input.synopsis.trim().length > 5000)
    errors.synopsis = 'Nhập mô tả từ 1 đến 5000 ký tự.';
  if (!Number.isInteger(input.releaseYear) || input.releaseYear < 1 || input.releaseYear > 9999)
    errors.releaseYear = 'Năm phát hành phải là số nguyên từ 1 đến 9999.';
  if (!statusOptions.some((item) => item.value === input.status))
    errors.status = 'Chọn trạng thái hợp lệ.';
  if (!formatOptions.some((item) => item.value === input.format))
    errors.format = 'Chọn định dạng hợp lệ.';
  if (!input.genres.length || input.genres.some((genre) => !genreNames.includes(genre)))
    errors.genres = 'Chọn ít nhất một thể loại hợp lệ.';
  for (const field of ['posterUrl', 'bannerUrl'] as const)
    if (!animeArtwork.some((item) => item.value === input[field]))
      errors[field] = 'Chọn ảnh có sẵn trong dự án.';
  return errors;
}
