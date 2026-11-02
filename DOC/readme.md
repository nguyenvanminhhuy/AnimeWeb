# Anime Web — Tổng quan tài liệu

Trạng thái: **FE có các màn hình demo và lớp tương thích API v0.3; BE đã có API catalog, tài khoản/phân quyền, thư viện/tiến độ, bình luận, playback metadata và quản trị theo contract v0.3. FE đã nối BE local qua HTTP/proxy; chưa có nguồn phim thật.**

Mục tiêu là web xem anime hoạt động thực tế. FE mặc định dùng API BE, mock chỉ bật riêng trong dev; auth demo không lưu/xác thực mật khẩu. Trang xem đã có giao diện và native video, chưa có video để kiểm chứng playback. BE dùng C#/ASP.NET Core Controller, PostgreSQL và EF Core. Xem [hướng dẫn chạy](../BE/README.md), [hiện trạng BE](docs-BE/current-status.md) và [kết quả kiểm chứng](docs-BE/verification.md).

## FE đọc tài liệu API BE ở đâu?

Điểm tra cứu API hiện có: **[DOC/docs-BE/feature-reference.md](docs-BE/feature-reference.md)**. Tài liệu mô tả từng feature, method/path, path/query/body, kiểu dữ liệu, response, validation và permission; dùng khi hoàn thiện HTTP transport và thay repository mock FE. FE đã có [lớp tương thích BE](docs-FE/backend-compatibility.md), đã bật kết nối HTTP mặc định.

| Cần tra cứu | Đường dẫn |
| --- | --- |
| Endpoint, DTO, tham số và quy tắc dữ liệu đã code | [Tham chiếu API BE](docs-BE/feature-reference.md) |
| Quyết định nghiệp vụ, auth, version và hợp đồng chung | [API contract v0.3](api-contract.md) |
| Flow màn hình, repository mock và nhu cầu mapping của FE | [Bàn giao FE/BE](fe-backend-handoff.md) |
| Cách chạy API và cấu hình môi trường local | [BE/README.md](../BE/README.md) |

API local theo script setup dùng `http://localhost:5200`, prefix `/api/v1`. Khi API chạy ở Development, đọc schema tại [OpenAPI JSON](http://localhost:5200/openapi/v1.json); chưa có Swagger UI. Xem hướng dẫn chạy nếu đổi host/port.

Khi nối FE, gửi `Authorization: Bearer <accessToken>` cho API cần đăng nhập, unwrap `{data}`/`{data,meta}` và xử lý lỗi `{error:{code,message,requestId,fields?}}`. Gắn `fields` vào form khi lỗi `400`, xử lý phiên ở `401`, quyền ở `403`, tải lại dữ liệu khi `409`. Mutation dùng `version` theo từng endpoint; PATCH quản trị gửi đủ form. Phần baseline mock trong handoff có các đề xuất cũ: đối chiếu tham chiếu API và quyết định v0.3 trước khi tích hợp, không mặc định mọi endpoint trong bảng handoff đều tồn tại.

## Cấu trúc

FE bổ sung [quản lý Mùa/phần và tập phim](docs-FE/admin-episodes-screen.md) tại `/admin/episodes`: CRUD metadata trong phiên quản trị mẫu; chưa kết nối API mùa/tập hoặc có nguồn phát thật.

[Nguồn phát và phụ đề](docs-FE/admin-playback-screen.md) tại `/admin/playback` đã có CRUD cấu hình nguồn theo tập và phụ đề theo nguồn trong FE mock; chưa fetch/kiểm chứng video hoặc nối player/API thật.

[Quản lý bình luận](docs-FE/admin-comments-screen.md) tại `/admin/comments` có danh sách/bộ lọc/panel nội dung và ẩn/hiện lại theo quyền trong phiên mẫu; không sửa bình luận cá nhân hoặc triển khai API kiểm duyệt BE.

```text
Anime-Web/
├── FE/                     # Source frontend
├── BE/                     # Nền ASP.NET Core API và kiểm thử
└── DOC/
    ├── readme.md           # Mục lục chung
    ├── roadmap.md          # Lộ trình toàn dự án
    ├── decisions.md        # Quyết định và câu hỏi còn mở
    ├── entities.md         # Entity dùng chung (đề xuất)
    ├── api-contract.md     # Hợp đồng FE/BE dùng chung (nháp)
    ├── docs-FE/            # Màn hình, thiết kế, rules, prompt, kiểm chứng FE
    └── docs-BE/            # Kiến trúc, dữ liệu, xác thực, tích hợp, kiểm thử BE
```

`AGENTS.md` giữ tại phạm vi áp dụng. FE/công cụ JavaScript dùng pnpm@11.10.0 và lockfile chung tại SRC. BE C# dùng .NET SDK/NuGet, không tạo package pnpm hoặc lockfile pnpm riêng cho BE.

## Thứ tự đọc

| Tài liệu | Nội dung |
| --- | --- |
| [docs-BE/feature-reference.md](docs-BE/feature-reference.md) | FE tra cứu API BE đã code: feature, field, path/query/body, response, validation và quyền |
| [fe-backend-handoff.md](fe-backend-handoff.md) | Bàn giao BE: feature → lời gọi FE thực tế → input/output → HTTP API thay thế |
| [feature-api-review.md](feature-api-review.md) | Review toàn bộ feature, API đã có/còn thiếu, khoảng cách FE/BE và checklist triển khai — 2026-11-01 |
| [roadmap.md](roadmap.md) | Phạm vi và các giai đoạn toàn dự án |
| [decisions.md](decisions.md) | Yêu cầu đã xác nhận và đề xuất chưa duyệt |
| [docs-FE/readme.md](docs-FE/readme.md) | Điểm bắt đầu cho frontend |
| [docs-BE/readme.md](docs-BE/readme.md) | Điểm bắt đầu cho backend |
| [Generate module BE](docs-BE/prompts/module-generation.md) | Quy trình tạo code theo tên module, kiểm tra nền và contract |
| [entities.md](entities.md) | Entity, quan hệ và ràng buộc dữ liệu |
| [api-contract.md](api-contract.md) | API common/me, DTO và lỗi |

API/entity, roadmap và quyết định chung giữ tại DOC để FE và BE cùng tham chiếu. Tham chiếu API mô tả code hiện có; kết quả kiểm chứng và giới hạn triển khai nằm trong [verification](docs-BE/verification.md) và [current-status](docs-BE/current-status.md), không suy ra đã deploy hoặc đã tích hợp FE.

## Chạy FE hiện có

[Setup BE/FE không Docker Desktop](../SETUP.md): PostgreSQL Windows, BE/setup.ps1 và start.ps1; FE/setup.ps1 cài pnpm workspace, FE/start.ps1 mở Vite. FE vẫn dùng mock cho đến khi triển khai kết nối HTTP.

[Đổi mật khẩu](docs-FE/change-password-screen.md) tại `/profile/change-password` đã có form cho member, mở qua avatar/Profile; chỉ kiểm tra giao diện, chưa xác thực hoặc thay đổi mật khẩu thật.

Từ SRC chạy `pnpm --filter anime-web-fe run dev`, hoặc chạy `pnpm dev` trong `Anime-Web/FE`. Route: `/`, `/anime`, `/anime/:slug`, `/watch/:episodeId`, `/library`, `/login`, `/register`; thư viện yêu cầu phiên demo.

[Dashboard quản trị](docs-FE/admin-dashboard-screen.md) tại `/admin` đã có UI tổng hợp workspace mẫu; mở phiên quản trị riêng qua Login trong dev. Production từ chối khi chưa có auth/quyền thật; chưa kết nối API quản trị.

[Quản lý anime](docs-FE/admin-anime-screen.md) tại `/admin/anime` đã có tìm/lọc/sort/phân trang, thêm/sửa/xoá và liên kết công khai hợp lệ. Chọn phiên có quyền chỉnh sửa tại Login để dùng CRUD; phiên chỉ đọc vẫn dùng được danh sách. Dữ liệu chỉ ở bộ nhớ theo phiên, không đổi fixture công khai; reload/đổi phiên đặt lại seed.

[Quản lý thể loại](docs-FE/admin-genres-screen.md) tại `/admin/genres` đã có CRUD tên/slug và liên kết với Anime trong cùng workspace; chặn xoá khi còn phim sử dụng. Dùng cùng lựa chọn phiên chỉ đọc/chỉnh sửa, không gọi API quản trị thật.

[Quản lý người dùng](docs-FE/admin-users-screen.md) tại `/admin/users` đã có danh sách/tìm/lọc/sort/phân trang và xem hồ sơ hư cấu theo userId. Cả hai preview đều chỉ đọc User; chưa có khoá/mở khoá, xoá tài khoản hoặc cấp role.

[Kiểm chứng FE](docs-FE/verification.md) được chuyển nguyên trạng. Các đường dẫn trong bằng chứng cũ phản ánh thời điểm chạy, không sửa lại lịch sử khi đổi vị trí tài liệu.
