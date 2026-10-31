import type { AdminUser } from '@/types/admin-user';

// Fictional administration records, independent of demo login/profile storage.
const names = [
  ['Minh An', 'minhan'],
  ['Ngọc Linh', 'ngoclinh'],
  ['Hải Đăng', 'haidang'],
  ['Thu Hà', 'thuha'],
  ['Bảo Ngọc', 'baongoc'],
  ['Đức Anh', 'ducanh'],
  ['Khánh Vy', 'khanhvy'],
  ['Quang Huy', 'quanghuy'],
  ['Mai Chi', 'maichi'],
  ['Hoàng Nam', 'hoangnam'],
  ['Thanh Trúc', 'thanhtruc'],
  ['Gia Bảo', 'giabao'],
  ['Phương Anh', 'phuonganh'],
  ['Tuấn Kiệt', 'tuankiet'],
  ['Yến Nhi', 'yennhi'],
  ['Nhật Minh', 'nhatminh'],
  ['Hồng Nhung', 'hongnhung'],
  ['Việt Hoàng', 'viethoang'],
  ['Lan Phương', 'lanphuong'],
  ['Trọng Nhân', 'trongnhan'],
  ['Thảo Nguyên', 'thaonguyen'],
  ['Thiên Ân', 'thienan'],
  ['Diệu Linh', 'dieulinh'],
  ['Anh Khoa', 'anhkhoa'],
] as const;
export const adminUsers: AdminUser[] = names.map(([displayName, email], index) => ({
  id: `admin-user-${String(index + 1).padStart(3, '0')}`,
  displayName,
  email: `${email}@anime.test`,
  status: (index + 1) % 4 === 0 ? 'blocked' : 'active',
  roles: ['member'],
  createdAt: `2026-10-${String(index + 1).padStart(2, '0')}T08:00:00Z`,
}));
