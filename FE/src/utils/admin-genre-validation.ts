import type { AdminGenreFields, AdminGenreInput } from '@/types/admin-genre';

export class AdminGenreError extends Error {
  constructor(
    message: string,
    public fields: AdminGenreFields = {},
  ) {
    super(message);
    this.name = 'AdminGenreError';
  }
}
export function validateAdminGenre(input: AdminGenreInput): AdminGenreFields {
  const fields: AdminGenreFields = {};
  if (!input.name.trim() || input.name.trim().length > 100)
    fields.name = 'Nhập tên thể loại từ 1 đến 100 ký tự.';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug) || input.slug.length > 100)
    fields.slug = 'Slug tối đa 100 ký tự, gồm chữ thường không dấu, số và dấu nối.';
  return fields;
}
