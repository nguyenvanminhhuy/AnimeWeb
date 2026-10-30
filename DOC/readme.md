# Anime Web — Tổng quan tài liệu

Trạng thái: **FE có các màn hình demo; BE đã có nền ASP.NET Core, API Anime và Mùa/tập. Chưa nối FE với BE hoặc có nguồn phim thật.**

Mục tiêu là web xem anime hoạt động thực tế. FE dùng mock và dữ liệu cục bộ; auth demo không lưu/xác thực mật khẩu. Trang xem đã có giao diện và native video, chưa có video để kiểm chứng playback. BE dùng C#/ASP.NET Core Controller, PostgreSQL và EF Core; Anime và Mùa/tập có migration, seed demo và API công khai. Xem [hướng dẫn chạy](../BE/README.md); các feature nghiệp vụ còn lại chưa triển khai.

## Cấu trúc

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
| [roadmap.md](roadmap.md) | Phạm vi và các giai đoạn toàn dự án |
| [decisions.md](decisions.md) | Yêu cầu đã xác nhận và đề xuất chưa duyệt |
| [docs-FE/readme.md](docs-FE/readme.md) | Điểm bắt đầu cho frontend |
| [docs-BE/readme.md](docs-BE/readme.md) | Điểm bắt đầu cho backend |
| [Generate module BE](docs-BE/prompts/module-generation.md) | Quy trình tạo code theo tên module, kiểm tra nền và contract |
| [entities.md](entities.md) | Entity, quan hệ và ràng buộc dữ liệu |
| [api-contract.md](api-contract.md) | API common/me, DTO và lỗi |

API/entity, roadmap và quyết định chung giữ một bản tại DOC để FE và BE cùng tham chiếu. Tài liệu BE là thiết kế cho giai đoạn tiếp theo, chưa phải bằng chứng server chạy được.

## Chạy FE hiện có

Từ SRC chạy `pnpm --filter anime-web-fe run dev`, hoặc chạy `pnpm dev` trong `Anime-Web/FE`. Route: `/`, `/anime`, `/anime/:slug`, `/watch/:episodeId`, `/library`, `/login`, `/register`; thư viện yêu cầu phiên demo.

[Dashboard quản trị](docs-FE/admin-dashboard-screen.md) tại `/admin` đã có UI đọc dữ liệu mẫu; mở phiên quản trị riêng qua Login trong dev. Production từ chối khi chưa có auth/quyền thật; chưa triển khai CRUD hoặc API quản trị.

[Kiểm chứng FE](docs-FE/verification.md) được chuyển nguyên trạng. Các đường dẫn trong bằng chứng cũ phản ánh thời điểm chạy, không sửa lại lịch sử khi đổi vị trí tài liệu.
