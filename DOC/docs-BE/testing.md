# Kế hoạch kiểm thử BE

**Chưa thực thi:** chưa có code/lệnh test BE. Chỉ ghi lệnh và bằng chứng sau khi test runner được cài và chạy thật. Các tình huống dưới đây chưa phải kết quả đạt.

Unit test cho validation, permission và nghiệp vụ đã chốt. Integration test dùng database kiểm thử/migration thật để kiểm tra constraint, transaction và truy vấn theo user. Contract test xác nhận HTTP status, DTO, phân trang và lỗi. Luồng FE/BE dùng server cục bộ, fixture và fake playback provider.

| Nhóm | Tình huống nghiệm thu |
| --- | --- |
| Common | Guest/member đọc cùng public; không lộ draft, kể cả ID tập thuộc cha bị ẩn |
| Danh mục | Filter kết hợp, query sai, thứ tự ổn định, empty và page vượt cuối theo quy tắc chốt |
| Phiên/quyền | 401 khi thiếu/hết phiên; 403 khi blocked/thiếu quyền; thu hồi/đổi quyền có hiệu lực |
| Ownership | Hai user A/B; A không đọc/ghi dữ liệu B bằng ID, body/query; không gán role từ client |
| Library | Upsert không trùng; DELETE 204; bỏ library giữ progress |
| Progress | Không âm, kiểm tra thời lượng, cập nhật đồng thời/xem lại theo chính sách |
| Comments | Guest không đăng; trim/giới hạn body; không nhận authorId/status; chỉ đọc visible; không phục hồi hidden/deleted qua sửa |
| Playback | 404 không tồn tại, 200 nguồn rỗng, 503 provider lỗi; hết hạn, phụ đề, tập trước/sau |
| Riêng tư | Không lộ email/hash/bí mật/stack trace; logout/đổi tài khoản xóa cache cá nhân FE |
| Database | Migration từ rỗng và phiên bản trước; unique/foreign key; ghi đồng thời không tạo trùng |

## Bằng chứng

Khi triển khai, tạo verification BE ghi ngày, phiên bản code, lệnh thực tế, fixture, kết quả và giới hạn. Không sửa lịch sử [verification FE](../docs-FE/verification.md). Không đọc `.env`/credentials hoặc gọi API/model thật khi kiểm tra.

Nghiệm thu khi contract thống nhất, kiểm tra liên quan đạt và FE xử lý loading/empty/error/unauthorized. Fake provider đạt không chứng minh đã có nguồn phim thật; nguồn được phép sử dụng cần kiểm chứng riêng.
