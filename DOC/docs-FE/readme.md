# Tài liệu frontend

FE dùng React + TypeScript + Vite, Tailwind CSS và Bootstrap 5. Trang chủ, Khám phá, Chi tiết anime, Thư viện và Đăng nhập/Đăng ký đã có bản demo; Xem phim đã có giao diện/chuyển tập, chưa có asset video hoặc kết nối backend.

## Thứ tự đọc

| Tài liệu | Nội dung |
| --- | --- |
| [Tổng quan dự án](../readme.md) | Trạng thái và tài liệu dùng chung |
| [Quyết định](../decisions.md) | Yêu cầu đã xác nhận và đề xuất chưa duyệt |
| [Rules](rules/readme.md) | Quy tắc tạo/sửa FE |
| [Kiến trúc](rules/architecture.md) | Repository, adapter và phụ thuộc |
| [Cấu trúc FE](rules/fe-structure.md) | Source và pnpm |
| [Style](rules/styling.md) | Tailwind, font và responsive |
| [Common components](rules/common/readme.md) | Button, Input, Combobox, Selectbox, Icon, Pagination |
| [Routes](rules/routes.md) | React Router, URL builder và query |
| [Role/permission](rules/roles-permissions.md) | Guest/member, ownership và cache |
| [Wireframes](design/wireframes.md) | Luồng sử dụng và bố cục |
| [Prompt](prompts/readme.md) | Quy trình sinh màn hình |
| [Kiểm chứng](verification.md) | Bằng chứng thực tế, chỉ bổ sung lịch sử |

## Màn hình

- [Trang chủ](home-screen.md): `/`.
- [Khám phá](explore-screen.md): `/anime`.
- [Chi tiết anime](anime-detail-screen.md): `/anime/:slug`.
- [Xem phim](watch-screen.md): `/watch/:episodeId`, công khai; chưa có nguồn video.: `/library`, yêu cầu phiên demo.
- [Đăng nhập/Đăng ký](auth-screens.md): `/login`, `/register`; chưa xác thực thật.

API và entity dùng bản chung [api-contract.md](../api-contract.md), [entities.md](../entities.md). Khi nối BE, đọc [kế hoạch tích hợp](../docs-BE/integration.md); không dùng localStorage làm bằng chứng xác thực server.

Sau khi sửa code FE, chạy từ SRC: `pnpm --filter anime-web-fe run format`, `pnpm --filter anime-web-fe run format:check` và kiểm tra phù hợp với thay đổi.
