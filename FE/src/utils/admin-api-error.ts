import { ApiError } from '@/lib/api/backend/error';

/** Admin UI copy stays Vietnamese; preserve typed field errors separately in each form. */
export function adminApiErrorMessage(
  error: unknown,
  fallback = 'Thao tác chưa thành công. Vui lòng thử lại.',
): string {
  if (!(error instanceof ApiError)) return error instanceof Error ? error.message : fallback;
  if (error.code === 'ANIME_ARCHIVED')
    return 'Phim đã lưu trữ. Khôi phục về bản nháp trước khi sửa hoặc xoá.';
  if (error.code === 'ANIME_NOT_ARCHIVED')
    return 'Phim chưa lưu trữ. Tải lại danh sách để kiểm tra trạng thái.';
  if (error.code === 'STALE_VERSION')
    return 'Dữ liệu đã thay đổi. Hãy tải lại danh sách và kiểm tra trước khi xác nhận lại.';
  if (error.code === 'ANIME_PUBLISHED')
    return 'Phim đang được công bố. Hãy chuyển về bản nháp trước khi xoá.';
  if (error.code === 'ANIME_IN_USE')
    return 'Phim còn mùa/phần, tập phim, thư viện, bình luận hoặc lượt xem liên quan nên chưa thể xoá. Không xoá dây chuyền dữ liệu.';
  if (error.status === 401) return 'Phiên đã hết hạn. Vui lòng đăng nhập lại.';
  if (error.status === 403) return 'Bạn không còn quyền thực hiện thao tác này.';
  if (error.status === 404) return 'Dữ liệu không còn tồn tại. Hãy tải lại danh sách.';
  if (error.status === 409)
    return 'Dữ liệu đã thay đổi, bị trùng hoặc đang được liên kết. Hãy tải lại trang và kiểm tra trước khi thao tác tiếp.';
  if (error.status === 400 || error.status === 422)
    return 'Dữ liệu chưa hợp lệ. Kiểm tra các trường trong biểu mẫu.';
  if (error.status === 429) return 'Bạn thao tác quá nhanh. Vui lòng đợi một lúc rồi thử lại.';
  if (error.status === 0) return 'Không kết nối được máy chủ. Kiểm tra kết nối rồi thử lại.';
  if (error.status >= 500) return 'Máy chủ chưa xử lý được yêu cầu. Vui lòng thử lại sau.';
  return fallback;
}
