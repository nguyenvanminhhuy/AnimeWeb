# Xác thực và phân quyền BE

Yêu cầu đã xác nhận và ma trận quyền nằm tại [roles-permissions.md](../docs-FE/rules/roles-permissions.md). Tài liệu này tập trung vào server. Cơ chế xác thực chưa chọn; phiên demo FE không phải đăng nhập thật.

Khách tìm kiếm/xem phim qua common; member dùng cùng common. Chức năng cá nhân yêu cầu tài khoản hoạt động và permission tương ứng. Guest là ngữ cảnh chưa đăng nhập, không phải role trong database. Moderator/admin và API quản trị chưa thuộc phạm vi đã chốt.

```text
Request me → Xác thực phiên → Tài khoản active
           → Permission → Ownership/trạng thái → Đọc/ghi dữ liệu
```

UserId, role, permission không lấy từ body, localStorage hoặc actor FE tự khai báo. API comments nhận plain text, server tự gán tác giả. Quyền own phải kiểm tra tài nguyên trong phạm vi user đang đăng nhập.

| Trường hợp | Kết quả dự kiến |
| --- | --- |
| Thiếu phiên, phiên hết hạn/không hợp lệ | 401 cho API cá nhân |
| Thiếu permission hoặc tài khoản blocked | 403 cho thao tác cá nhân |
| Tài nguyên không có/không công khai | 404 |
| Tài nguyên cá nhân thuộc user khác | 404 theo contract |
| Vượt giới hạn request | 429; hạn mức chưa chọn |

User blocked vẫn có thể đọc common như khách. Không mặc định admin bỏ qua ownership. Bình luận hidden/deleted không được sửa để tự xuất hiện lại.

## Thiết kế phiên cần chốt

Chọn cookie hoặc token, mô tả login/logout, hết hạn, thu hồi và cập nhật quyền/khóa tài khoản. Nếu dùng cookie, xác định Secure/HttpOnly/SameSite, CORS credentials và CSRF theo môi trường triển khai. Nếu dùng token, xác định nơi lưu, thời hạn và thu hồi/refresh. Đây là yêu cầu thiết kế có điều kiện, chưa phải cấu hình đã cài.

Nếu đăng nhập bằng mật khẩu, chọn cơ chế hash và chống dò tài khoản trước khi triển khai; không lưu mật khẩu plain text hoặc log bí mật. DTO bình luận công khai không trả email/hash/thông tin phiên. `/me` chỉ trả dữ liệu cần cho chính tài khoản đó.

FE phải xóa cache cá nhân khi logout/đổi tài khoản, xử lý 401/403 và chỉ nhận đường dẫn quay lại nội bộ. Ẩn nút phục vụ trải nghiệm; server vẫn kiểm tra đầy đủ.
