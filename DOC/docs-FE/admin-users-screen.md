# Quản lý người dùng

Cập nhật 2026-11-02: [Đổi vai trò tài khoản](../docs-BE/account-role-management.md) đã có BE/FE. PATCH `/api/v1/admin/users/{id}/role`, body `{role, version}`; admin cần `admin:user:read` và `admin:user:role:write`. Chọn đúng một role user/manage/admin, chặn tự hạ quyền/admin active cuối, thu hồi phiên khi đổi. Manage chỉ đọc.

Route `/admin/users`, đã nối API BE. Cập nhật 2026-11-02: admin có thể khoá/mở khoá; manage chỉ xem. Có đổi vai trò qua dialog xác nhận; không tạo/xoá tài khoản quản trị hoặc reset mật khẩu người khác.

## Quyền và dữ liệu

- `admin:user:read`: danh sách/hồ sơ, dành cho manage/admin. `admin:user:status:write`: khoá/mở khoá, chỉ admin. `admin:user:role:write`: đổi role, chỉ admin. Guest/user bị guard; quyền thật lấy từ profile BE, không nhận role tự khai báo.
- DTO gồm id, displayName, email, status active/blocked, roles user/manage/admin, createdAt và version >=1. Không có hash/password/token. Hiển thị vai trò thật và ngày vi-VN/Asia/Ho_Chi_Minh.
- GET `/api/v1/admin/users` với q/status/sort/page/pageSize trả data/meta/summary. GET `/{id}` tải panel độc lập với trang hiện tại. PATCH `/{id}/status` body `{status,version}` trả DTO mới. Chi tiết bảo vệ/phiên/migration tại [contract BE](../docs-BE/account-status-management.md).

## Giao diện

- Tìm tên/email bằng debounce, lọc active/blocked, sort newest/oldest/name, pageSize 10/20/50; query nằm trong URL. Thay điều kiện về trang 1; tìm/lọc vẫn hoạt động sau đổi trạng thái.
- Pagination chung trên/dưới, ô số bản ghi chỉ ở thanh trên. Summary toàn collection trước bộ lọc; page vượt cuối được chuẩn hoá bằng hook. Không lọc/sắp xếp lại một page ở FE để giả lập toàn collection.
- Bảng có Avatar, tên/email/ID, status, roles, ngày tạo. Thao tác icon xem hồ sơ/đổi vai trò/khoá/mở khoá một hàng, tooltip và aria-label có ngữ cảnh. Manager không có nút trạng thái; nút tự khoá bị disabled, BE vẫn chặn request giả mạo.
- Hộp xác nhận ghi rõ tên/email và hệ quả: khoá thu hồi phiên, mở khoá yêu cầu đăng nhập lại. Native dialog giữ focus, Escape/huỷ chỉ khi không pending, chống gửi trùng và abort khi unmount/đổi phiên.
- Chỉ cập nhật sau API thành công; refresh danh sách/summary/panel đang mở. 409/404 hiển thị lỗi và nút tải lại trước khi thử lại. Không thay trạng thái giả khi mạng lỗi hoặc thiếu quyền.
- Panel hồ sơ dùng query userId, Back/Forward/direct URL, focus tiêu đề khi mở, trả focus khi đóng. Responsive cuộn trong bảng, font 14px, dùng Button/Icon/Avatar/Pagination và Tailwind; không thêm dependency.

## Source và mock

App route ghép feature admin-users; contract admin-user-repository có list/getById/setStatus/setRole. Backend adapter dùng HTTP thật mặc định. Mock chỉ bật explicit trong dev, fixture có version, workspace tách theo session; thay đổi mock không đụng login thật hoặc fixture gốc. Mock read-only session không có quyền đổi trạng thái. Không dựa vào mock để khẳng định tính an toàn BE.

Khởi động FE/BE theo SETUP; đăng nhập admin rồi vào `/admin/users`. Khi vừa apply migration/permission mới, tải lại FE hoặc đăng nhập lại. Không thêm route user edit riêng.

Bằng chứng thực tế nối thêm tại [verification FE](verification.md); fixture PostgreSQL, phiên và concurrency tại [verification BE](../docs-BE/verification.md). Các suite browser cũ vẫn có kiểm tra UI/adapter mock; cập nhật expectation khi contract mở rộng, không coi trạng thái mô phỏng là dữ liệu vận hành thật.
