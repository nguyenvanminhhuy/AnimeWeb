# Role và permission

Áp dụng cho mọi màn hình công khai, cá nhân và quản trị; là nguồn quy định role/permission khi generate FE.

Cập nhật 2026-10-31 theo yêu cầu bổ sung ba role `user / manage / admin`. Đây là quy định cho thiết kế/generate; source hiện vẫn dùng member demo và hai phiên adminPreview theo permission, chưa gán ba role thật hoặc có middleware/cơ sở dữ liệu phân quyền BE.

## Yêu cầu đã xác nhận

- Không đăng nhập vẫn xem phim, tìm kiếm, xem danh mục qua `/api/v1/common/...`.
- Đăng nhập mới được dùng thư viện và đăng bình luận.
- Thành viên vẫn dùng API `/common` để xem phim; không tạo một bản API xem phim riêng chỉ vì đã đăng nhập.

## Ba role chuẩn

Role là nhóm quyền; permission là quyền thực hiện một hành động. Backend kiểm tra permission thay vì chỉ kiểm tra tên role trong từng controller. Khi một hành động có hậu tố `own`, phải kiểm tra thêm tài nguyên thuộc người đang đăng nhập.

Giữ nguyên mã role `user`, `manage`, `admin` theo yêu cầu. Các lần generate dùng tên thống nhất này, không tạo thêm role tương đương chỉ vì khác cách gọi.

| Role code | Tên hiển thị | Phạm vi |
| --- | --- | --- |
| `user` | Thành viên | Xem nội dung công khai; hồ sơ, thư viện, tiến độ và bình luận của chính mình. Không vào quản trị. Đây là cách gọi chuẩn cho member trong tài liệu/source cũ. |
| `manage` | Quản lý chỉ đọc | Có quyền cá nhân của user và đọc Dashboard, danh mục phim, thể loại, mùa/tập, nguồn/phụ đề, bình luận và danh sách người dùng trong quản trị. Không thêm/sửa/xoá hoặc kiểm duyệt. |
| `admin` | Quản trị viên | Có quyền của manage, thêm/sửa/xoá tài nguyên nội dung trong phạm vi được cấp, kiểm duyệt ẩn/hiện lại bình luận. Không mặc định có mọi permission hoặc bỏ qua ràng buộc dữ liệu. |

Guest là ngữ cảnh chưa đăng nhập, không phải role thứ tư lưu trong UserRole. Nội dung công khai đã published có thể đọc như khách; không yêu cầu role để xem phim/tìm kiếm. Khi triển khai đăng ký thật, mặc định tài khoản mới là user; không nhận role hoặc permission tự khai báo trong form đăng ký.

Việc kế thừa ở trên mô tả tập quyền cần map trong RolePermission khi triển khai. Không coi thứ tự/tên role là bằng chứng có quyền; guard và API vẫn kiểm tra permission cụ thể. Với hành động own, cả manage/admin cũng chỉ được sửa dữ liệu cá nhân thuộc chính tài khoản của họ.

## Ma trận role và permission

| Permission | user | manage | admin | Phạm vi |
| --- | --- | --- | --- | --- |
| `catalog:read` | Có | Có | Có | Danh mục anime/mùa/tập đã công khai; guest cũng được đọc |
| `playback:read` | Có | Có | Có | Nguồn phát công khai; guest cũng được đọc |
| `comment:read` | Có | Có | Có | Bình luận visible công khai; guest cũng được đọc theo mock/đề xuất hiện tại |
| `library:read:own` | Có | Có | Có | Thư viện của chính mình |
| `library:write:own` | Có | Có | Có | Thêm/cập nhật/xoá mục thư viện của mình |
| `progress:read:own` | Có | Có | Có | Tiến độ của chính mình |
| `progress:write:own` | Có | Có | Có | Ghi tiến độ của chính mình |
| `comment:create` | Có | Có | Có | Tác giả lấy từ phiên, không chọn userId khác |
| `comment:update:own` | Có | Có | Có | Sửa bình luận của mình còn visible |
| `comment:delete:own` | Có | Có | Có | Xoá mềm bình luận của mình còn cho phép xoá |
| `admin:dashboard:read` | Không | Có | Có | Đọc Dashboard quản trị |
| `admin:anime:read` | Không | Có | Có | Đọc danh mục phim quản trị |
| `admin:anime:write` | Không | Không | Có | Thêm/sửa/xoá metadata phim theo ràng buộc |
| `admin:genre:read` | Không | Có | Có | Đọc thể loại quản trị |
| `admin:genre:write` | Không | Không | Có | Thêm/sửa/xoá thể loại chưa bị ràng buộc |
| `admin:episode:read` | Không | Có | Có | Đọc mùa/phần và tập quản trị |
| `admin:episode:write` | Không | Không | Có | Thêm/sửa/xoá mùa/tập theo trạng thái và quan hệ |
| `admin:playback:read` | Không | Có | Có | Đọc cấu hình nguồn phát/phụ đề quản trị |
| `admin:playback:write` | Không | Không | Có | Thêm/sửa/xoá nguồn/phụ đề, bật/tắt và chọn mặc định |
| `admin:comment:read` | Không | Có | Có | Xem bình luận quản trị, gồm hidden; body deleted bị lược bỏ |
| `admin:comment:moderate` | Không | Không | Có | Chỉ visible ↔ hidden, có lý do và xác nhận |
| `admin:user:read` | Không | Có | Có | Danh sách/hồ sơ người dùng theo DTO tối thiểu |

Các mã là hợp đồng quyền của FE/mock hiện có và quy ước map role khi generate. Khi nối BE, map theo contract/policy được duyệt; không suy ra các API hoặc permission quản trị đã triển khai trên server.

### Giới hạn của admin

- Quản lý người dùng hiện chỉ đọc cho cả manage/admin. Chưa cấp quyền tạo/xoá tài khoản, khoá/mở khoá, đổi role/permission hoặc reset mật khẩu người khác.
- Kiểm duyệt không cho sửa nội dung/tác giả bình luận người khác, xoá cứng hoặc khôi phục deleted. Quyền sửa bình luận own không thay cho quyền kiểm duyệt và ngược lại.
- Không tự xoá dây chuyền tài nguyên còn được tham chiếu. Ví dụ: mùa còn tập, tập còn nguồn, nguồn còn phụ đề, thể loại còn phim hoặc tập đã công bố có thể bị chặn xoá theo repository/contract.
- Không truy cập password/hash/token hoặc dữ liệu cá nhân ngoài phạm vi được cấp. [Đổi mật khẩu](../change-password-screen.md) chỉ dành cho chính tài khoản đang đăng nhập; FE hiện chỉ kiểm tra biểu mẫu, chưa xác minh/thay mật khẩu thật.
- Không dùng wildcard admin:* hoặc điều kiện role=admin để mặc nhiên bỏ permission/ownership/trạng thái. Quyền chưa có trong ma trận mặc định chưa được cấp.

### Đối chiếu với source hiện tại

| Quy định role | Chế độ FE đang mô phỏng |
| --- | --- |
| `user` | Hồ sơ member demo với quyền thư viện/tiến độ/bình luận own |
| `manage` | Dùng phiên quản trị mẫu: tập permission đọc quản trị |
| `admin` | Dùng phiên quản trị có quyền chỉnh sửa: quyền đọc + ghi nội dung + kiểm duyệt |

Hai adminPreview chỉ mô phỏng quyền quản trị, tách khỏi user member và không tự có hồ sơ/thư viện cá nhân; chỉ bật chủ động trong dev, reset khi reload/đổi phiên, production mặc định từ chối quản trị. Bảng này không có nghĩa source đã gán role manage/admin, đã kế thừa quyền cá nhân hoặc đã có RBAC thật. Nhiệm vụ cập nhật tài liệu không tự thay code phiên/permission, seed role hoặc tạo giao diện gán quyền.

Khi triển khai trạng thái tài khoản thật, tài khoản bị khóa không được thực hiện chức năng cá nhân hoặc quản trị dù vẫn được gán user/manage/admin trong database. Nội dung công khai vẫn truy cập được như khách. Chính sách khóa từng chức năng (ví dụ chỉ khóa bình luận) cần thêm yêu cầu nếu muốn hỗ trợ.

## Luồng kiểm tra tại BE

```text
Request đến route cá nhân
→ Xác thực phiên
→ Kiểm tra trạng thái tài khoản
→ Kiểm tra permission của endpoint
→ Kiểm tra ownership và trạng thái tài nguyên
→ Thực hiện hành động
```

Route `/common` không buộc xác thực, nhưng vẫn kiểm tra trạng thái công khai của tài nguyên, validation và giới hạn request khi triển khai. Không trả draft, khóa nhà cung cấp hoặc dữ liệu cá nhân chỉ vì endpoint có tên common.

- 401: chưa đăng nhập, phiên hết hạn hoặc không hợp lệ.
- 403: đã xác thực nhưng không có quyền hoặc tài khoản bị khóa.
- 404: tài nguyên không tồn tại/không công khai; tài nguyên cá nhân không thuộc người dùng theo chính sách contract.
- 429: vượt giới hạn request; hạn mức cụ thể chưa chốt.

Không lấy role/permission từ request body, localStorage hoặc tùy ý tin vào dữ liệu FE gửi. Hình thức phiên/cookie/token chưa chọn; nếu dùng token phải có quy tắc cập nhật/thu hồi khi quyền hoặc trạng thái tài khoản thay đổi.

## Áp dụng cho FE

- Khách xem danh mục và player bình thường; nút thư viện hoặc gửi bình luận hiển thị yêu cầu đăng nhập.
- Khi được yêu cầu đăng nhập từ một trang phim, lưu đường dẫn nội bộ để quay về đúng trang sau đăng nhập; không tự gửi bình luận chưa xác nhận.
- Route thư viện được bảo vệ ở FE và BE. Ẩn nút chỉ phục vụ trải nghiệm, không thay kiểm tra quyền tại BE.
- Khi đăng xuất/đổi tài khoản: xóa cache thư viện, tiến độ và dữ liệu cá nhân của phiên trước; cache danh mục công khai có thể giữ.
- Khi chưa có BE: dùng phiên mock để xem thử hai trạng thái khách/thành viên; phải ghi rõ demo, không xem đây là đăng nhập thật.
- Màn công khai/cá nhân/quản trị dùng ma trận ba role trên. Menu, guard route trực tiếp và hành động kiểm tra permission tương ứng; manage chỉ đọc, không render form ghi/kiểm duyệt và adapter phải từ chối mutation.
- Không dùng prefix URL, email, lựa chọn đăng ký hoặc localStorage để nâng user thành manage/admin. Dữ liệu phiên/role/quyền thật phải đến từ nguồn BE đã xác thực; không tự dựng UI cấp role khi generate màn hình khác.

## Tình huống cần kiểm thử khi triển khai

1. Khách gọi danh mục/tìm kiếm/playback công khai thành công; nội dung draft trả 404.
2. Khách gọi `/me`, thư viện hoặc POST bình luận nhận 401.
3. Thành viên có quyền thao tác thư viện/tiến độ của mình; không chỉ định được userId khác.
4. Thành viên thiếu permission hoặc bị khóa nhận 403 cho thao tác cá nhân.
5. Thành viên không sửa/xóa được bình luận người khác, kể cả đoán đúng ID.
6. Guest/member đọc cùng danh sách bình luận visible; không thấy hidden/deleted.
7. Đăng xuất hoặc đổi tài khoản không để lộ dữ liệu cá nhân trong cache.
8. User không vào quản trị; manage mở được các danh sách/chi tiết nhưng không ghi hoặc kiểm duyệt, kể cả gọi trực tiếp adapter/API.
9. Admin có đúng tập quyền ghi được liệt kê, vẫn bị chặn xoá tài nguyên tham chiếu/khôi phục deleted hoặc thao tác tài khoản ngoài phạm vi.
10. Cùng role nhưng thiếu permission, phiên không hợp lệ hoặc tài khoản bị khoá vẫn bị từ chối; sau khi triển khai kế thừa, own luôn kiểm tra đúng chủ sở hữu cho cả ba role.

Các mục trên là kế hoạch kiểm thử, chưa phải kết quả đã chạy.

## Generate giao diện quản trị — 2026-10-30

[Bình luận quản trị](../admin-comments-screen.md) dùng admin:comment:read/moderate trong FE mock; tách khỏi comment:update:own/delete:own của thành viên. Chỉ visible ↔ hidden có xác nhận/lý do, deleted không thể khôi phục và body bị lược bỏ. Không sửa tác giả/nội dung, không cấp quyền server hoặc coi mock là API kiểm duyệt thật.

Khi được gọi Dashboard/trang quản lý, áp dụng [admin-screens.md](admin-screens.md). Tài liệu này bổ sung quy ước layout/route, ma trận permission mẫu và phiên quản trị mock riêng cho dev/test, không mở quyền quản trị cho member hoặc xác nhận API/role thật. Các mã admin:* ở đó là đề xuất cho FE mock, chưa thay ma trận quyền BE đã chốt. Guard quyền đọc/ghi và trạng thái thiếu quyền phải được kiểm tra cả khi mở URL trực tiếp; sau khi có auth BE, lấy quyền từ nguồn server được duyệt.
