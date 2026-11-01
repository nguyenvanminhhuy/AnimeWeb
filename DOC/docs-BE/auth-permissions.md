# Xác thực và phân quyền BE

Yêu cầu đã xác nhận và ma trận quyền nằm tại [roles-permissions.md](../docs-FE/rules/roles-permissions.md). Server đã triển khai bearer opaque 7 ngày, PasswordHasher framework, DB session/hash và policy theo permission. Logout thu hồi phiên hiện tại, đổi mật khẩu thu hồi mọi phiên; trạng thái/quyền đọc lại mỗi request. Phiên demo FE không phải đăng nhập thật và FE chưa tích hợp.

Khách tìm kiếm/xem phim qua common; user dùng cùng common. Chức năng cá nhân yêu cầu tài khoản hoạt động và permission tương ứng. Guest là ngữ cảnh chưa đăng nhập, không phải role trong database.

## Quy định quyền và hiện trạng (đồng bộ 2026-11-01)

Ba mã role đã xác nhận theo [decisions.md](../decisions.md) và [ma trận quyền FE](../docs-FE/rules/roles-permissions.md) là `user`, `manage`, `admin`. `member` chỉ là tên cũ/demo, không tạo thêm role tương đương hoặc đổi `manage` thành `manager`/`moderator`.

| Role | Quyền thiết kế |
| --- | --- |
| user | Đọc public; hồ sơ, library/progress và comments của mình theo permission |
| manage | Quyền của user và đọc quản trị theo permission; không mutation/kiểm duyệt |
| admin | Quyền của manage và ghi nội dung/kiểm duyệt theo các permission được liệt kê; không wildcard bypass |

Map RolePermission theo ma trận nguồn, không suy ra quyền chỉ từ tên/thứ tự role. Đăng ký mới mặc định user, không nhận roles/permissions từ client. Users chỉ đọc cho manage/admin; chưa cấp quyền tạo/xóa/khóa tài khoản, đổi role hoặc reset mật khẩu người khác. Admin vẫn chịu ownership và constraint; kiểm duyệt chỉ visible ↔ hidden, không khôi phục deleted hoặc sửa body/tác giả người khác.

Permission quản trị gồm `admin:dashboard:read`, `admin:anime:read`, `admin:anime:write`, `admin:genre:read`, `admin:genre:write`, `admin:episode:read`, `admin:episode:write`, `admin:playback:read`, `admin:playback:write`, `admin:comment:read`, `admin:comment:moderate`, `admin:user:read`. Không thêm permission ngoài ma trận chỉ vì UI có tên quản lý.

Đã có Account/LoginSession/UserRole/RolePermission và policy runtime theo [contract v0.3](../api-contract.md); không wildcard bypass own/constraint. FE còn member/adminPreview và cần refactor khi tích hợp. Bootstrap admin đầu tiên chỉ qua CLI explicit, không có API cấp role hoặc tài khoản/mật khẩu mặc định. Các hướng dẫn lựa chọn cookie/token bên dưới là tham chiếu cho thay đổi cơ chế sau này; hiện đã chọn bearer, không refresh, không CORS credentials.

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

Yêu cầu cụ thể lấy mục 3 và 9 của [handoff FE](../fe-backend-handoff.md): login `{email,password}`, register `{displayName,email,password}`, logout thu hồi server, me có id/displayName/email/roles/permissions, change-password chỉ của chính mình với currentPassword/newPassword. Các URL/DTO mới cần đặc tả trong contract trước code. FE hiện chưa truyền password vào repository và còn bootstrap phiên local đồng bộ; triển khai API không tự biến demo thành phiên thật.

Baseline form FE: displayName 2–40 sau trim, email tối đa 254, password 8–128; đổi mật khẩu mới khác hiện tại, confirmation ở FE. Không trim/lowercase password. Đây là đầu vào để chốt validation server, không thay chính sách credential/phiên hoặc tự xác nhận giới hạn chưa duyệt. Profile chỉ đọc, không tự thêm sửa hồ sơ/avatar, quên mật khẩu hoặc cấp role.

Chọn cookie hoặc token, mô tả login/logout, hết hạn, thu hồi và cập nhật quyền/khóa tài khoản. Nếu dùng cookie, xác định Secure/HttpOnly/SameSite, CORS credentials và CSRF theo môi trường triển khai. Nếu dùng token, xác định nơi lưu, thời hạn và thu hồi/refresh. Đây là yêu cầu thiết kế có điều kiện, chưa phải cấu hình đã cài.

Nếu đăng nhập bằng mật khẩu, chọn cơ chế hash và chống dò tài khoản trước khi triển khai; không lưu mật khẩu plain text hoặc log bí mật. DTO bình luận công khai không trả email/hash/thông tin phiên. `/me` chỉ trả dữ liệu cần cho chính tài khoản đó.

FE phải xóa cache cá nhân khi logout/đổi tài khoản, xử lý 401/403 và chỉ nhận đường dẫn quay lại nội bộ. Ẩn nút phục vụ trải nghiệm; server vẫn kiểm tra đầy đủ.

## Áp dụng ASP.NET Core

Đăng ký authentication scheme theo cơ chế phiên sẽ chọn, policy authorization và handler cho permission; thứ tự middleware authentication trước authorization. Controller common cho phép guest; controller/action me yêu cầu policy tương ứng. Claims userId phải xuất phát từ phiên/token đã xác thực; kiểm tra active/quyền có hiệu lực khi tài khoản bị khóa hoặc quyền bị thu hồi.

Ownership được ràng buộc trong truy vấn/ghi theo userId, không chỉ qua attribute hoặc role. Chuẩn hóa challenge/forbid thành JSON error 401/403 theo contract, không redirect trang login. Test handler chỉ dùng trong WebApplicationFactory test host, không đăng ký ở runtime.

Nếu chọn mật khẩu, ưu tiên thành phần xác thực/hash được framework hỗ trợ, không tự viết thuật toán hash. Việc dùng ASP.NET Core Identity, cookie hay JWT chưa được chốt trong lượt chọn stack; cần mô tả endpoint/vòng đời phiên trước module Auth.
