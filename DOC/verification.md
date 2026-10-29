
## 2026-10-29 — Bỏ chữ demo khỏi button và Header

- Xóa badge DEMO cạnh tên Anime Web trên Header. Rút gọn nhãn Button thành Đăng nhập, Đăng xuất, Đăng ký, Đổi tài khoản và Gửi bình luận tại Header/Library/Auth/Comments. Không thay logic phiên hoặc lưu trữ.
- Đồng bộ locator trong các browser suite theo nhãn mới. Lượt Library đầu bị strict locator do Header và CTA cùng tên Đăng nhập; scope locator vào aw-library-guest rồi chạy lại PASS.
- pnpm --filter anime-web-fe run format, build (format:check/typecheck/Vite) và format:check sau chỉnh locator: PASS. verifyAuth, verifyNavigation, verifyDetail và verifyLibrary PASS với dữ liệu mock/Chromium, không gọi API/model thật.
