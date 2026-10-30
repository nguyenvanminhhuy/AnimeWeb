# Kế hoạch kiểm thử BE

**Đã kiểm tra nền, Anime và Mùa/tập:** API catalog, mùa, tập phân trang/detail, draft/cha bị ẩn, metadata chưa có nguồn phát, migration/constraint và seed PostgreSQL. Chi tiết tại [verification.md](verification.md). Các tình huống Auth/Library/Progress/Comments/Playback bên dưới vẫn là kế hoạch.

Unit test cho validation, permission và nghiệp vụ đã chốt. Integration test dùng database kiểm thử/migration thật để kiểm tra constraint, transaction và truy vấn theo user. Contract test xác nhận HTTP status, DTO, phân trang và lỗi. Luồng FE/BE dùng server cục bộ, fixture và fake playback provider.

## Công cụ C#

Dùng xUnit và Microsoft.AspNetCore.Mvc.Testing/WebApplicationFactory theo [hướng dẫn Microsoft](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-10.0). Test project tham chiếu API; test host thay provider bên ngoài bằng fake và chỉ cài test authentication handler trong môi trường test.

Test ràng buộc, migration và truy vấn đặc thù phải dùng PostgreSQL riêng, không dùng EF InMemory/SQLite để kết luận tương thích PostgreSQL. Có thể cấp database cục bộ hoặc container test khi môi trường hỗ trợ; không mặc định Docker đã cài. Cô lập dữ liệu giữa test, chỉ reset database test được xác định rõ. Pin version công cụ khi triển khai.

Chạy format/build/test theo [setup.md](setup.md). Test thường ghi rõ PostgreSQL case skipped nếu chưa cấp fixture; chạy `BE/scripts/test-database.ps1` để khởi động PostgreSQL riêng, kiểm tra baseline/readiness rồi dừng container test. Không dùng database dev cho script này.

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
