# Avatar và menu tài khoản

Source: `FE/src/components/navigation/account-menu.tsx`, dùng trong Header công khai và AdminLayout. Dùng [Avatar](avatar.md) size md để hiển thị chữ viết tắt (NFC/vi-VN), thống nhất với trang Profile và không tải ảnh ngoài. Chưa có chức năng upload/đổi avatar.

| Prop | Ý nghĩa |
| --- | --- |
| `displayName` | Tên hiển thị và nhãn truy cập của nút avatar |
| `identity` | Khóa phiên/tài khoản; thay đổi khóa đóng menu |
| `links` | Danh sách `{label, to}` đã được nơi gọi lọc theo quyền và route có sẵn |
| `onLogout` | Callback đăng xuất do nơi gọi cung cấp |

Nút avatar dùng common Button, có aria-expanded/aria-controls. Nội dung là nav disclosure với các Link và Button đăng xuất, không dùng role menu nên giữ trình tự Tab native. Mở menu focus hành động đầu tiên; Escape đóng và trả focus; click ngoài, focus rời vùng, chuyển route hoặc đổi identity đều đóng menu. Panel bám cạnh phải và giới hạn chiều rộng theo viewport, font 14px; tên dài được rút gọn trên trigger và xuống dòng trong panel.

Component không đọc store/quyền hoặc tự điều hướng sau đăng xuất. Header chọn Trang cá nhân/Thư viện cho member, Dashboard/Đổi tài khoản cho phiên quản trị mẫu có quyền đọc. AdminLayout dùng cùng component cho Dashboard/Trang xem phim/Đổi tài khoản. Không thêm link admin cho mọi tài khoản hoặc tạo quyền từ menu.

Guest thấy nút Đăng nhập. Sau đăng nhập, Đăng xuất nằm trong menu avatar; browser suites dùng helper `tests/helpers/account-menu.mjs` để thao tác theo UI mới. `tests/account-menu.browser.mjs` kiểm tra responsive, focus/Escape/outside close, điều hướng và trang cá nhân; xem [profile-screen.md](../../profile-screen.md).
