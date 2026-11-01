import type { PageResult } from '@/types/admin-query';
export function pageRows<T>(rows: T[], page: number, pageSize: number): PageResult<T> {
  return {
    rows: rows.slice((page - 1) * pageSize, page * pageSize),
    meta: { page, pageSize, total: rows.length, totalPages: Math.ceil(rows.length / pageSize) },
  };
}
