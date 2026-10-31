# Tài liệu frontend

FE dùng React + TypeScript + Vite, Tailwind CSS và Bootstrap 5. Trang chủ, Khám phá, Chi tiết anime, Thư viện và Đăng nhập/Đăng ký đã có bản demo; Xem phim đã có giao diện/chuyển tập, chưa có asset video hoặc kết nối backend. Dashboard quản trị đã có FE đọc dữ liệu mẫu với phiên dev riêng, chưa có auth/API quản trị thật.

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
| [Generate quản trị](prompts/admin-screen-generation.md) | Dashboard, CRUD anime/thể loại/mùa và tập/nguồn và phụ đề, Người dùng chỉ đọc đã có FE mock; API quản trị chưa triển khai |
| [Kiểm chứng](verification.md) | Bằng chứng thực tế, chỉ bổ sung lịch sử |

## Màn hình

- [Trang chủ](home-screen.md): `/`.
- [Khám phá](explore-screen.md): `/anime`.
- [Chi tiết anime](anime-detail-screen.md): `/anime/:slug`.
- [Xem phim](watch-screen.md): `/watch/:episodeId`, công khai; chưa có nguồn video.
- [Thư viện](library-screen.md): `/library`, yêu cầu phiên demo.
- [Trang cá nhân](profile-screen.md): `/profile`, avatar/thông tin tài khoản/thống kê, yêu thích và tiếp tục xem; mở qua avatar Header sau đăng nhập.
- [Dashboard quản trị](admin-dashboard-screen.md): `/admin`, phiên mẫu riêng chỉ bật chủ động trong dev.
- [Quản lý anime](admin-anime-screen.md): `/admin/anime`, tìm/lọc/sắp xếp/phân trang, thêm/sửa/xoá theo quyền; dùng phiên quản trị mẫu riêng, dữ liệu reset khi reload/đổi phiên.
- [Quản lý thể loại](admin-genres-screen.md): `/admin/genres`, CRUD tên/slug, số phim sử dụng, liên kết quản trị Anime và chặn xoá thể loại đang dùng.
- [Mùa/phần và tập phim](admin-episodes-screen.md): `/admin/episodes`, CRUD mùa/phần và metadata tập, chặn xoá tài nguyên còn quan hệ hoặc đã công bố.
- [Nguồn phát và phụ đề](admin-playback-screen.md): `/admin/playback`, CRUD cấu hình nguồn theo tập, phụ đề theo nguồn, bật/tắt và phụ đề mặc định; chưa kiểm chứng playback.
- [Quản lý bình luận](admin-comments-screen.md): `/admin/comments`, tìm/lọc/phân trang, xem nội dung và ẩn/hiện lại kèm lý do; deleted không được khôi phục.
- [Quản lý người dùng](admin-users-screen.md): `/admin/users`, tìm/lọc/sort/phân trang và hồ sơ theo userId trên URL; chỉ đọc dữ liệu hư cấu.
- [Đăng nhập/Đăng ký](auth-screens.md): `/login`, `/register`; chưa xác thực thật.
- [Đổi mật khẩu](change-password-screen.md): `/profile/change-password`, member, form hiện tại/mới/xác nhận và preview; chưa thay mật khẩu thật.

API và entity dùng bản chung [api-contract.md](../api-contract.md), [entities.md](../entities.md). Khi nối BE, đọc [kế hoạch tích hợp](../docs-BE/integration.md); không dùng localStorage làm bằng chứng xác thực server.

Sau khi sửa code FE, chạy từ SRC: `pnpm --filter anime-web-fe run format`, `pnpm --filter anime-web-fe run format:check` và kiểm tra phù hợp với thay đổi.
