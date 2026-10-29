# Anime Web — Tổng quan tài liệu

Trạng thái: **đã triển khai Trang chủ, Khám phá, Chi tiết anime, Thư viện và Đăng nhập/Đăng ký demo; chưa có BE hoặc nguồn phim**.

Mục tiêu là xây dựng web xem anime hoạt động thực tế. Trước mắt hoàn thiện giao diện với dữ liệu mẫu và video demo; sau đó tích hợp backend và nguồn nội dung được phép sử dụng. Hiện chưa có nguồn phim hoặc API.

## Thứ tự đọc đề xuất

| Tài liệu | Nội dung |
| --- | --- |
| [roadmap.md](roadmap.md) | Phạm vi bản đầu, các bước và điều kiện hoàn thành |
| [design/wireframes.md](design/wireframes.md) | Luồng sử dụng và khung các màn hình |
| [rules/readme.md](rules/readme.md) | Mục lục quy định khi generate màn hình |
| [rules/architecture.md](rules/architecture.md) | Cấu trúc source FE/BE và cách thay nguồn dữ liệu |
| [rules/fe-structure.md](rules/fe-structure.md) | Khung thư mục FE đã tạo và quy tắc pnpm |
| [rules/styling.md](rules/styling.md) | Tailwind, Bootstrap 5, CSS common và quy tắc style riêng |
| [rules/common/readme.md](rules/common/readme.md) | Component dùng chung: Button, Input, Combobox, Selectbox và Icon/Font Awesome |
| [rules/routes.md](rules/routes.md) | React Router, route tập trung, navigation và query |
| [entities.md](entities.md) | Các entity và quan hệ |
| [api-contract.md](api-contract.md) | Phác thảo API để FE và BE phối hợp |
| [rules/roles-permissions.md](rules/roles-permissions.md) | API common, API cá nhân, ma trận quyền và ownership |
| [decisions.md](decisions.md) | Điều đã thống nhất và các lựa chọn còn mở |
| [prompts/readme.md](prompts/readme.md) | Prompt mẫu theo từng giai đoạn |
| [prompts/screen-prompt-template.md](prompts/screen-prompt-template.md) | Prompt khung sinh code từng màn hình từ UI |
| [prompts/screen-generation.md](prompts/screen-generation.md) | Prompt thực thi: chỉ cần gửi tên màn hình |
| [verification.md](verification.md) | Bằng chứng kiểm chứng thực tế |

## Cấu trúc đã thống nhất

```text
Anime-Web/
├── FE/     # Source frontend
├── BE/     # Source backend
└── DOC/    # Tài liệu, Markdown, thiết kế và prompt
```

API vẫn là **đề xuất**. Chạy `pnpm dev` trong Anime-Web/FE: [Trang chủ](home-screen.md) tại `/`, [Khám phá](explore-screen.md) tại `/anime`, [Chi tiết anime](anime-detail-screen.md) tại `/anime/:slug`, [Thư viện](library-screen.md) tại `/library` (cần phiên demo), [Đăng nhập/Đăng ký](auth-screens.md) tại `/login` và `/register`. Xem tập vẫn là thông báo tối thiểu vì chưa có video. Auth chỉ là mô phỏng cục bộ, không lưu/xác thực mật khẩu; xem [rules/styling.md](rules/styling.md) cho quy tắc CSS.

Quy tắc vận hành như `AGENTS.md` vẫn đặt tại vị trí cần áp dụng; tài liệu dự án tập trung trong `DOC`. Toàn bộ dự án tiếp tục tuân theo quy tắc pnpm workspace của `SRC`.

## Những điểm nên góp ý trước

1. Một anime chứa nhiều mùa/phần hay mỗi mùa là một mục riêng?
2. Giao diện tối giản kiểu rạp phim hay nhiều thông tin kiểu thư viện anime?
3. Khi nào triển khai đăng nhập thật? Yêu cầu mới: thư viện và gửi bình luận chỉ dành cho người đăng nhập; FE có thể mô phỏng trước khi có BE.
4. Bạn muốn học và tự chỉnh sửa từng bước hay ưu tiên hoàn thiện sản phẩm trước?
