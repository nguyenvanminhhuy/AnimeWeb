# Thay đổi vai trò tài khoản

Đã triển khai BE và FE ngày 2026-11-02 theo yêu cầu người dùng. Tại `/admin/users`, admin nhấn icon Sửa có nhãn “Đổi vai trò <email>”, chọn vai trò và xác nhận. Manage chỉ xem. Không thay đổi API đăng ký: tài khoản mới luôn là user.

## API và quyền

`PATCH /api/v1/admin/users/{id}/role`

Yêu cầu bearer hợp lệ, tài khoản active và cả `admin:user:read`, `admin:user:role:write`. Permission ghi role chỉ seed cho admin; không dùng permission khoá/mở khoá thay thế. Actor lấy từ phiên server, không nhận actor hoặc quyền từ body.

```json
{ "role": "manage", "version": 3 }
```

- Role chỉ nhận `user`, `manage`, `admin` (không nhận manager, member hoặc mảng roles). Version bắt buộc, nguyên >=1, lấy từ GET list/detail Users mới nhất.
- Vai trò mới **thay thế toàn bộ** UserRole của tài khoản bằng đúng một role chuẩn. Không cộng dồn quyền hoặc cho phép client gửi permissions.
- Thành công 200 `{data: AdminUserDto}` với id/displayName/email/status/createdAt/roles/version. Role assignment thực sự thay đổi làm version tăng 1; status, password và dữ liệu cá nhân được giữ nguyên.
- Cùng role duy nhất và cùng version là no-op: giữ version và phiên đăng nhập. Nếu tài khoản có nhiều role cũ, chọn một role sẽ chuẩn hoá thành một role và tăng version.

| HTTP | Code / trường hợp |
| --- | --- |
| 400 | VALIDATION_ERROR: thiếu/sai role hoặc version |
| 401 | Chưa đăng nhập, phiên hết hạn/đã thu hồi |
| 403 | Thiếu quyền hoặc actor không còn active/còn quyền sau khi chờ lock |
| 404 | NOT_FOUND: tài khoản không tồn tại |
| 409 | CONFLICT: version cũ, kể cả khi thao tác trạng thái/password đã thay đổi trước |
| 409 | SELF_ROLE_CHANGE_NOT_ALLOWED: tự hạ quyền khỏi admin |
| 409 | LAST_ACTIVE_ADMIN: bỏ role admin của admin active cuối cùng |

## Transaction, đồng thời và phiên

SetRole chia sẻ advisory transaction lock `animeweb-bootstrap-admin` với bootstrap và khoá/mở khoá; sau đó lấy lock account theo id giống login/đổi password. Kiểm tra lại actor active và permission sau khi lấy lock. Transaction bao gồm thay UserRole, tăng Accounts.Version và thu hồi toàn bộ LoginSession chưa revoke của tài khoản đích. Account.Version là concurrency token dùng chung với status/password, không tạo version riêng cho role.

Không được tự hạ quyền. Hai admin hạ quyền chéo hoặc đổi role đồng thời với khoá admin không thể làm mất admin active cuối cùng; request chờ phải kiểm tra lại quyền actor và version. Tài khoản đang blocked vẫn đổi role được nhưng giữ blocked; việc đổi role không mở khoá.

Khi role thực sự thay đổi, **mọi phiên của tài khoản đích bị thu hồi**. Token cũ không dùng lại được; người dùng đăng nhập mới để nhận role/permissions mới. Không thu hồi phiên của admin đang thao tác trên tài khoản khác.

## FE, mock và generate

- Dùng Button icon edit với title/aria-label, Selectbox chung có label và ba option. Không đổi role ngay khi chọn; phải nhấn xác nhận. Nút đổi role của chính mình disabled; BE vẫn kiểm tra độc lập.
- Dialog dùng chung với status tại `user-access-dialog.tsx`: focus ban đầu Huỷ, Escape/khôi phục focus, abort khi unmount, chặn submit lặp/đóng lúc pending, không gửi khi chưa đổi lựa chọn. 409/404 yêu cầu tải lại, không gửi lại version cũ.
- Sau thành công refresh bảng, summary và hồ sơ đang mở, giữ query/phân trang. Không optimistic update. Manager/thiếu quyền ghi role không thấy nút đổi role.
- Repository/client gửi PATCH chỉ `{role, version}`; mock DEV hỗ trợ version, no-op, self/last guard và workspace riêng, không thay fixture gốc. Mock không mô phỏng toàn bộ session server.
- Các lần generate sau giữ nguyên mã `manage`, không tạo role manager, không thêm UI sửa permission/CRUD tài khoản/reset password từ tính năng này.

## Migration và chạy local

Migration `20261102133943_AccountRoleManagement` chỉ seed permission `admin:user:role:write` và mapping admin; không đổi dữ liệu role của tài khoản hiện có. Tổng 6 migration. Áp dụng một lần với cấu hình database local hiện có (không commit credential):

```powershell
# terminal trong BE
dotnet ef database update --project src/AnimeWeb.Api --startup-project src/AnimeWeb.Api
```

Migration đã áp dụng thành công vào database dev local ngày 2026-11-02, không đổi role/status tài khoản hiện có. Sau migration, chạy BE/FE như hiện tại và đăng nhập lại admin để FE nhận permission mới. Không tự seed tài khoản hoặc reset database. Bằng chứng kiểm thử được bổ sung tại verification BE/FE; các lệnh trên là hướng dẫn, không tự khẳng định đã apply vào database dev.
