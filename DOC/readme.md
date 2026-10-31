# Anime Web — Tổng quan tài liệu

Trạng thái: **FE có các màn hình demo; BE đã có nền ASP.NET Core và API đọc danh mục Anime (list/detail/genres). Chưa nối FE với BE hoặc có nguồn phim thật.**

Mục tiêu là web xem anime hoạt động thực tế. FE dùng mock và dữ liệu cục bộ; auth demo không lưu/xác thực mật khẩu. Trang xem đã có giao diện và native video, chưa có video để kiểm chứng playback. BE dùng C#/ASP.NET Core Controller, PostgreSQL và EF Core; feature Anime có migration, seed demo và API công khai. Xem [hướng dẫn chạy](../BE/README.md); các feature nghiệp vụ còn lại chưa triển khai.

## Cấu trúc

FE bổ sung [quản lý Mùa/phần và tập phim](docs-FE/admin-episodes-screen.md) tại `/admin/episodes`: CRUD metadata trong phiên quản trị mẫu; chưa có API mùa/tập hoặc nguồn phát thật.

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
| [roadmap.md](roadmap.md) | Phạm vi và các giai đoạn toàn dự án |
| [decisions.md](decisions.md) | Yêu cầu đã xác nhận và đề xuất chưa duyệt |
| [docs-FE/readme.md](docs-FE/readme.md) | Điểm bắt đầu cho frontend |
| [docs-BE/readme.md](docs-BE/readme.md) | Điểm bắt đầu cho backend |
| [Generate module BE](docs-BE/prompts/module-generation.md) | Quy trình tạo code theo tên module, kiểm tra nền và contract |
| [entities.md](entities.md) | Entity, quan hệ và ràng buộc dữ liệu |
| [api-contract.md](api-contract.md) | API common/me, DTO và lỗi |

API/entity, roadmap và quyết định chung giữ một bản tại DOC để FE và BE cùng tham chiếu. Tài liệu BE là thiết kế cho giai đoạn tiếp theo, chưa phải bằng chứng server chạy được.

## Chạy FE hiện có

[Đổi mật khẩu](docs-FE/change-password-screen.md) tại `/profile/change-password` đã có form cho member, mở qua avatar/Profile; chỉ kiểm tra giao diện, chưa xác thực hoặc thay đổi mật khẩu thật.

Từ SRC chạy `pnpm --filter anime-web-fe run dev`, hoặc chạy `pnpm dev` trong `Anime-Web/FE`. Route: `/`, `/anime`, `/anime/:slug`, `/watch/:episodeId`, `/library`, `/login`, `/register`; thư viện yêu cầu phiên demo.

[Dashboard quản trị](docs-FE/admin-dashboard-screen.md) tại `/admin` đã có UI tổng hợp workspace mẫu; mở phiên quản trị riêng qua Login trong dev. Production từ chối khi chưa có auth/quyền thật; chưa có API quản trị.

[Quản lý anime](docs-FE/admin-anime-screen.md) tại `/admin/anime` đã có tìm/lọc/sort/phân trang, thêm/sửa/xoá và liên kết công khai hợp lệ. Chọn phiên có quyền chỉnh sửa tại Login để dùng CRUD; phiên chỉ đọc vẫn dùng được danh sách. Dữ liệu chỉ ở bộ nhớ theo phiên, không đổi fixture công khai; reload/đổi phiên đặt lại seed.

[Quản lý thể loại](docs-FE/admin-genres-screen.md) tại `/admin/genres` đã có CRUD tên/slug và liên kết với Anime trong cùng workspace; chặn xoá khi còn phim sử dụng. Dùng cùng lựa chọn phiên chỉ đọc/chỉnh sửa, không gọi API quản trị thật.

[Quản lý người dùng](docs-FE/admin-users-screen.md) tại `/admin/users` đã có danh sách/tìm/lọc/sort/phân trang và xem hồ sơ hư cấu theo userId. Cả hai preview đều chỉ đọc User; chưa có khoá/mở khoá, xoá tài khoản hoặc cấp role.

[Kiểm chứng FE](docs-FE/verification.md) được chuyển nguyên trạng. Các đường dẫn trong bằng chứng cũ phản ánh thời điểm chạy, không sửa lại lịch sử khi đổi vị trí tài liệu.
