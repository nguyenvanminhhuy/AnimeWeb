# Lộ trình backend

Đây là thứ tự đề xuất, chưa cam kết thời hạn. Đối chiếu [roadmap chung](../roadmap.md); ghi lựa chọn được xác nhận tại [decisions.md](../decisions.md).

| Bước | Công việc | Điều kiện hoàn thành |
| --- | --- | --- |
| 1. Thiết kế | Stack, database, mùa/phần, publication, phiên, API thiếu | Ghi quyết định và cập nhật contract đủ cho module đầu tiên |
| 2. Nền BE | Cấu hình, validation, lỗi, database, migration/seed, test runner | Khởi động cục bộ, migration và smoke test bằng fixture |
| 3. Common | Anime, genre, mùa/tập, tìm/lọc/phân trang | Public/draft và DTO đạt; adapter FE chạy cục bộ |
| 4. Auth/quyền | Phiên thật, me, trạng thái tài khoản, permission/ownership | Guest/member/blocked, thu hồi phiên, hai user cách ly |
| 5. Cá nhân | Library, progress, comments | Constraint/upsert/xóa mềm và policy đã chốt được kiểm thử |
| 6. Playback | Fake provider, nguồn/phụ đề, hết hạn và lỗi | Phân biệt nguồn rỗng/404/503; không lộ cấu hình provider |
| 7. Tích hợp | Đổi adapter, cache theo phiên, luồng FE/BE | Có bằng chứng theo testing.md, ghi rõ giới hạn nguồn phim |

## Cần quyết định

- Framework/runtime, database/ORM, test runner và nhận package BE trong workspace nếu dùng Node.
- Cơ chế phiên, endpoint auth, thu hồi và chính sách mật khẩu nếu có.
- Nhiều mùa, movie, publication anime, thứ tự và pagination.
- DTO trang chủ/chi tiết/related, tìm kiếm library và format mở rộng.
- Hoàn thành tập, xem lại, xung đột nhiều thiết bị và nhập dữ liệu demo.
- Bình luận hiện ngay hay duyệt trước, quyền sửa/xóa, giới hạn request.
- Nguồn video hợp lệ, CDN/storage, hạ tầng và phát hành.

Các lựa chọn này chưa được duyệt. Tạo tài liệu không tự kích hoạt viết backend hoặc xuất bản dịch vụ.
