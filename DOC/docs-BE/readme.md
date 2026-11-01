# Tài liệu backend

Trạng thái ngày **2026-11-01**: đã triển khai nền, Anime/Mùa/tập, Auth/RBAC, Library/Progress, Comments/moderation, Playback metadata, Home/related/options/ranking và API admin theo handoff. Xem [hiện trạng và giới hạn](current-status.md), [hướng dẫn chạy](../../BE/README.md) và [bằng chứng](verification.md). SDK 10.0.403, EF Core 10.0.14, Npgsql provider 10.0.3; PostgreSQL 18.6-bookworm được giữ nguyên.

Đồng bộ ngày **2026-11-01** theo [fe-backend-handoff.md](../fe-backend-handoff.md): bổ sung nhu cầu Home/related/ranking và các màn quản trị, mapping DTO/query/summary, quyền và tiêu chí nghiệm thu. Các phần mới là phạm vi đặc tả theo feature, chưa phải API đã triển khai hoặc contract đã duyệt. Lượt đồng bộ chỉ sửa tài liệu, không chạy lại API/test; giữ nguyên lịch sử verification.

## Phạm vi

BE cung cấp danh mục anime, mùa/tập, thông tin phát, xác thực thật, quyền truy cập, thư viện, tiến độ và bình luận. Khách được tìm kiếm/xem phim qua API common; thư viện và đăng bình luận yêu cầu đăng nhập. Có backend không đồng nghĩa có nguồn phim: chỉ tích hợp nội dung được phép sử dụng.

## Thứ tự đọc

Để generate code, bắt đầu bằng [prompt thực thi](prompts/module-generation.md). Ví dụ: **“Đọc DOC/docs-BE/prompts/module-generation.md và tạo module danh mục anime.”** Prompt sẽ kiểm tra nền BE, contract và quyết định công nghệ trước khi triển khai.

| Tài liệu | Nội dung |
| --- | --- |
| [feature-reference.md](feature-reference.md) | Tra cứu đầy đủ 69 thao tác HTTP, feature, field/DTO, query/body/path params, response, quyền và lỗi theo source |
| [fe-backend-handoff.md](../fe-backend-handoff.md) | Nguồn yêu cầu dữ liệu FE: lời gọi repository/storage, input/output và query |
| [feature-api-review.md](../feature-api-review.md) | Inventory và khoảng cách tích hợp; đối chiếu source BE trước khi dùng trạng thái |
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

Quy trình mỗi thay đổi tiếp theo: đối chiếu code → lấy nhu cầu handoff → đặc tả vào API contract → chốt nghiệp vụ còn mở → code đúng phạm vi → kiểm chứng. Role user/manage/admin đã có policy runtime; Users vẫn chỉ đọc. Không tự thêm CRUD user, cấp role, upload hoặc quên mật khẩu để đủ bộ tính năng.

Phạm vi đã chạy thật xem verification; testing.md còn gồm kế hoạch tích hợp FE/media chưa thực hiện. Dùng .NET SDK/NuGet cho BE; không đọc `.env`/credentials hoặc gọi dịch vụ thật khi kiểm tra. Repo thực hiện: `New folder/AnimeWeb`; không ghi sang SRC/Anime-Web.
