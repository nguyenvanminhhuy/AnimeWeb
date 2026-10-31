# Prompt thực thi: tạo màn hình quản trị

Cách gọi: **“Đọc Anime-Web/DOC/docs-FE/prompts/admin-screen-generation.md và tạo màn hình [tên màn hình].”**

Thực hiện toàn bộ quy trình trong [screen-generation.md](screen-generation.md), đồng thời áp dụng [quy tắc trang quản trị](../rules/admin-screens.md). Đây là điểm vào chuyên cho admin, không phải một quy trình kiến trúc/router khác. Tên màn hình, route dự kiến và phạm vi mặc định nằm trong bảng của admin-screens.md; không yêu cầu người dùng điền lại template.

Ví dụ:

- `[admin-screen-generation.md] Dashboard quản trị`
- `[admin-screen-generation.md] Quản lý phim`
- `[admin-screen-generation.md] Thêm phim`
- `[admin-screen-generation.md] Quản lý tập phim`
- `[admin-screen-generation.md] Mùa/phần và tập phim`
- `[admin-screen-generation.md] Quản lý nguồn phát và phụ đề`
- `[admin-screen-generation.md] Quản lý thể loại`
- `[admin-screen-generation.md] Quản lý bình luận`
- `[admin-screen-generation.md] Comment`
- `[admin-screen-generation.md] Quản lý người dùng`

Chỉ code màn hình được gọi và nền cần thiết. Giữ layout quản trị riêng, router/provider chung, feature độc lập, common controls và Tailwind hiện có. Khi chưa có API/quyền quản trị thật, dùng repository/phiên mẫu riêng theo admin-screens.md và nêu giới hạn; không cấp quyền quản trị cho member hiện tại hoặc triển khai BE ngoài yêu cầu.

Nếu chỉ được yêu cầu tạo/sửa/review tài liệu này thì chỉ sửa tài liệu, không tạo route, màn hình hoặc tài khoản quản trị.
