# Anime Web — Tổng quan tài liệu

Trạng thái: **FE có Trang chủ, Khám phá, Chi tiết anime, Xem phim, Thư viện và Đăng nhập/Đăng ký demo; BE chưa triển khai, chưa có API hoặc nguồn phim thật.**

Mục tiêu là web xem anime hoạt động thực tế. FE dùng mock và dữ liệu cục bộ; auth demo không lưu/xác thực mật khẩu. Trang xem đã có giao diện, chuyển tập và nhánh video native; xem [Xem phim](docs-FE/watch-screen.md), chưa có video để kiểm chứng playback. Framework BE và database chưa chọn.

## Cấu trúc

```text
Anime-Web/
├── FE/                     # Source frontend
├── BE/                     # Source backend, hiện còn trống
└── DOC/
    ├── readme.md           # Mục lục chung
    ├── roadmap.md          # Lộ trình toàn dự án
    ├── decisions.md        # Quyết định và câu hỏi còn mở
    ├── entities.md         # Entity dùng chung (đề xuất)
    ├── api-contract.md     # Hợp đồng FE/BE dùng chung (nháp)
    ├── docs-FE/            # Màn hình, thiết kế, rules, prompt, kiểm chứng FE
    └── docs-BE/            # Kiến trúc, dữ liệu, xác thực, tích hợp, kiểm thử BE
```

`AGENTS.md` giữ tại phạm vi áp dụng. Dự án dùng pnpm@11.10.0 và lockfile chung tại SRC; không tạo lockfile riêng FE/BE.

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

[Kiểm chứng FE](docs-FE/verification.md) được chuyển nguyên trạng. Các đường dẫn trong bằng chứng cũ phản ánh thời điểm chạy, không sửa lại lịch sử khi đổi vị trí tài liệu.
