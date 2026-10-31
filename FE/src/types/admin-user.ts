export interface AdminUser {
  id: string;
  displayName: string;
  email: string;
  status: 'active' | 'blocked';
  roles: 'member'[];
  createdAt: string;
}
export interface AdminUsersQuery {
  q: string;
  status: AdminUser['status'] | '';
  sort: 'newest' | 'oldest' | 'name';
  page: number;
  pageSize: 10 | 20 | 50;
}
export interface AdminUsersResult {
  data: AdminUser[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
  summary: { total: number; active: number; blocked: number };
}
