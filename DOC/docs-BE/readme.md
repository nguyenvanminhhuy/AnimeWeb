# Tài liệu backend

Trạng thái ngày 2026-10-30: **đã có nền BE**, solution/API Controller/test project, cấu hình, lỗi JSON, CORS, health/readiness, OpenAPI, DbContext và migration khởi đầu. SDK 10.0.403, EF Core 10.0.14, Npgsql provider 10.0.3; PostgreSQL Docker 18.6-bookworm. Chưa có module nghiệp vụ hoặc xác thực thật. Xem [hướng dẫn chạy](../../BE/README.md), [setup](setup.md) và [bằng chứng](verification.md).

## Phạm vi

BE cung cấp danh mục anime, mùa/tập, thông tin phát, xác thực thật, quyền truy cập, thư viện, tiến độ và bình luận. Khách được tìm kiếm/xem phim qua API common; thư viện và đăng bình luận yêu cầu đăng nhập. Có backend không đồng nghĩa có nguồn phim: chỉ tích hợp nội dung được phép sử dụng.

## Thứ tự đọc

Để generate code, bắt đầu bằng [prompt thực thi](prompts/module-generation.md). Ví dụ: **“Đọc DOC/docs-BE/prompts/module-generation.md và tạo module danh mục anime.”** Prompt sẽ kiểm tra nền BE, contract và quyết định công nghệ trước khi triển khai.

| Tài liệu | Nội dung |
| --- | --- |
| [rules/readme.md](rules/readme.md) | Quy tắc bắt buộc khi tạo/sửa code BE |
| [setup.md](setup.md) | Thông tin cần chốt và yêu cầu cho nền BE |
| [modules.md](modules.md) | Phạm vi, phụ thuộc và nghiệm thu từng module |
| [prompts/readme.md](prompts/readme.md) | Cách gọi prompt setup/generate/review |
| [architecture.md](architecture.md) | Ranh giới module, source và luồng request |
| [database.md](database.md) | Entity, ràng buộc, migration và seed |
| [api.md](api.md) | Contract, validation và điểm cần hoàn thiện |
| [auth-permissions.md](auth-permissions.md) | Phiên, permission, ownership và riêng tư |
| [integration.md](integration.md) | Khoảng cách giữa mock FE và API |
| [testing.md](testing.md) | Kế hoạch kiểm thử và nghiệm thu |
| [roadmap.md](roadmap.md) | Trình tự triển khai và quyết định còn mở |

API thống nhất tại [api-contract.md](../api-contract.md); entity tại [entities.md](../entities.md). Thay đổi hợp đồng phải cập nhật cả hai phía; không sao chép thành các bản riêng dễ lệch nhau.

Đã triển khai và kiểm tra phần nền; tình huống nghiệp vụ trong testing.md vẫn là kế hoạch. Dùng .NET SDK/NuGet cho BE; không đọc `.env`/credentials hoặc gọi dịch vụ thật khi kiểm tra. Repo thực hiện: `New folder/AnimeWeb`, branch Be-Dev; không ghi sang SRC/Anime-Web.
