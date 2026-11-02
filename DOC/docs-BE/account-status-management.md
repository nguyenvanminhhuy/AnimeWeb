# Khoá và mở khoá tài khoản

Đã triển khai BE và FE ngày 2026-11-02. Route quản trị `/admin/users`; API đổi role riêng xem [quản lý vai trò](account-role-management.md); không tạo/xoá tài khoản hoặc reset mật khẩu người khác.

## API và quyền

`PATCH /api/v1/admin/users/{id}/status`

```json
{ "status": "blocked", "version": 1 }
```

Status chỉ nhận `active` hoặc `blocked`, version là số nguyên >=1 lấy từ AdminUserDto mới nhất. Body không nhận actorId, roles, permissions, password hoặc field khác. Actor lấy từ phiên đăng nhập. Thành công 200 theo envelope `{data: AdminUserDto}`, gồm id/displayName/email/status/createdAt/roles/version. GET list/detail Users cũng trả version.

| Quyền | user | manage | admin |
| --- | --- | --- | --- |
| `admin:user:read` | Không | Có | Có |
| `admin:user:status:write` | Không | Không | Có |

Endpoint yêu cầu cả quyền đọc và quyền đổi trạng thái, account active. Không dựa vào tên role hay trạng thái button FE để xác thực. Chính sách chỉ thêm permission mới vào admin; không nâng quyền manage.

| HTTP / code | Trường hợp |
| --- | --- |
| 400 VALIDATION_ERROR | Status sai/thiếu, version thiếu/không hợp lệ hoặc field ngoài contract |
| 401 UNAUTHORIZED | Không có phiên hoặc phiên đã thu hồi/hết hạn |
| 403 FORBIDDEN | Thiếu quyền hoặc actor không còn active/có quyền khi tới lượt xử lý |
| 404 NOT_FOUND | Tài khoản đích không tồn tại |
| 409 CONFLICT | Version đã cũ |
| 409 SELF_BLOCK_NOT_ALLOWED | Admin tự khoá mình |
| 409 LAST_ACTIVE_ADMIN | Thao tác sẽ khoá admin active cuối cùng |

## Transaction và phiên đăng nhập

Trong transaction, service giữ advisory lock dùng chung với bootstrap admin (`animeweb-bootstrap-admin`), kiểm tra lại actor active/quyền sau khi chờ lock, rồi giữ lock tài khoản đích dùng chung với login/đổi mật khẩu. Kiểm tra version và admin cuối cùng dưới lock, không kiểm tra rời rạc ở FE rồi mới ghi. Hai admin khoá lẫn nhau không thể làm cả hai cùng bị khoá; chỉ tối đa một thao tác thành công. Hai thao tác cùng version trên một tài khoản có tối đa một thay đổi, thao tác còn lại 409.

Khoá đổi Status sang blocked và thu hồi mọi LoginSession chưa bị revoke của đích trong cùng transaction. Request dùng token cũ sau commit nhận 401; đăng nhập mới trong lúc blocked nhận 403. Public API vẫn đọc như guest. Request đã qua kiểm tra quyền trước thời điểm khoá có thể đang xử lý; không có cơ chế huỷ tác vụ đang chạy.

Mở khoá chỉ đổi sang active, không khôi phục session đã revoke, không đổi password/role và không xoá dữ liệu cá nhân. Người dùng cần đăng nhập lại. Cùng trạng thái/cùng version là no-op, không tăng version; yêu cầu blocked vẫn thu hồi các phiên còn sót. Account kế thừa VersionedEntity, tăng version khi trạng thái/password hash thay đổi; phiên bản không khớp yêu cầu người gọi tải lại.

## Migration và chạy local

Migration `20261102103129_AccountStatusManagement` thêm Accounts.Version bigint NOT NULL DEFAULT 1 và seed AccessPermission/RolePermissions mới cho admin. Không thay mật khẩu, xoá dữ liệu hoặc reset trạng thái tài khoản có sẵn. Tổng hiện có 5 migration.

Máy hiện tại đã apply migration. Máy clone hoặc database cũ dùng luồng cấu hình database sẵn có, chủ động chạy `dotnet run -- -InitializeCatalog` tại BE để apply migration; script có thể bổ sung catalog demo khi rỗng. Nếu chỉ muốn migrate, cấp connection string local trong terminal rồi dùng:

```powershell
dotnet ef database update --project src/AnimeWeb.Api --startup-project src/AnimeWeb.Api
```

Khởi động lại BE sau build; tải lại FE hoặc đăng nhập lại admin để profile nhận permission mới. Không lưu connection string/mật khẩu vào tài liệu hoặc Git.

## FE

Màn Quản lý người dùng có icon xem hồ sơ/khoá/mở khoá cùng hàng. Manager chỉ thấy xem hồ sơ; admin có thêm thao tác trạng thái. Nút tự khoá bị vô hiệu và BE vẫn chặn request giả mạo. Role hiển thị theo user/manage/admin thật, không cố định “Thành viên”.

Hộp xác nhận có tên/email đích, mô tả thu hồi phiên, focus/trap native dialog, chặn gửi trùng và đóng khi pending. Không đổi UI lạc quan trước server response. Thành công tải lại summary/list và hồ sơ đang mở, giữ tìm kiếm/lọc/sort/pageSize; trang hết records được chuẩn hoá theo hook có sẵn. Lỗi 409/404 hướng dẫn tải lại dữ liệu trước khi thử lại; mạng/403 không ghi trạng thái giả vào bảng.

Mock chỉ bật explicit trong dev, workspace riêng theo phiên, version check/permission; không đụng tài khoản đăng nhập thật. Quy tắc thu hồi phiên/admin cuối cùng được thực thi ở BE thật, không suy từ mock.

Kiểm chứng gồm fixture PostgreSQL riêng cho role/validation/no-op/version/block-login/old-token/unblock/concurrency và live browser FE. Kết quả thực chạy chỉ ghi tại [verification BE](verification.md) và [verification FE](../docs-FE/verification.md).
