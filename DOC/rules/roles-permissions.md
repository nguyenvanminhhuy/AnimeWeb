# Role và permission

Áp dụng cho mọi màn hình có nội dung công khai hoặc thao tác cá nhân.

Cập nhật 2026-10-24. Tài liệu thiết kế, chưa có middleware hoặc cơ sở dữ liệu phân quyền.

## Yêu cầu đã xác nhận

- Không đăng nhập vẫn xem phim, tìm kiếm, xem danh mục qua `/api/v1/common/...`.
- Đăng nhập mới được dùng thư viện và đăng bình luận.
- Thành viên vẫn dùng API `/common` để xem phim; không tạo một bản API xem phim riêng chỉ vì đã đăng nhập.

## Mô hình đề xuất

Role là nhóm quyền; permission là quyền thực hiện một hành động. Backend kiểm tra permission thay vì chỉ kiểm tra tên role trong từng controller. Khi một hành động có hậu tố `own`, phải kiểm tra thêm tài nguyên thuộc người đang đăng nhập.

- **guest**: ngữ cảnh chưa đăng nhập; không phải role lưu trong UserRole.
- **member**: vai trò mặc định cho tài khoản hoạt động; dùng chức năng cá nhân.
- **moderator/admin**: dự kiến mở rộng sau, chưa cấp quyền hoặc định nghĩa endpoint trong giai đoạn này. Không mặc định admin bỏ qua mọi kiểm tra ownership.

## Ma trận quyền đề xuất

| Permission | Khách | Member hoạt động | Phạm vi |
| --- | --- | --- | --- |
| catalog:read | Có | Có | Anime, thể loại, mùa, tập công khai |
| playback:read | Có | Có | Nguồn phát của tập công khai |
| comment:read | Có, đề xuất | Có | Bình luận visible |
| library:read:own | Không | Có | Thư viện của chính mình |
| library:write:own | Không | Có | Thêm/cập nhật/xóa mục thư viện |
| progress:read:own | Không | Có | Tiến độ của chính mình |
| progress:write:own | Không | Có | Ghi tiến độ của chính mình |
| comment:create | Không | Có | Bình luận với tác giả là user hiện tại |
| comment:update:own | Không | Có, đề xuất | Bình luận của mình còn cho phép sửa |
| comment:delete:own | Không | Có, đề xuất | Bình luận của mình |

Tài khoản bị khóa không được thực hiện chức năng cá nhân dù vẫn giữ role member trong database. Nội dung công khai vẫn truy cập được như khách. Chính sách khóa từng chức năng (ví dụ chỉ khóa bình luận) cần thêm yêu cầu nếu muốn hỗ trợ.

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

## Tình huống cần kiểm thử khi triển khai

1. Khách gọi danh mục/tìm kiếm/playback công khai thành công; nội dung draft trả 404.
2. Khách gọi `/me`, thư viện hoặc POST bình luận nhận 401.
3. Thành viên có quyền thao tác thư viện/tiến độ của mình; không chỉ định được userId khác.
4. Thành viên thiếu permission hoặc bị khóa nhận 403 cho thao tác cá nhân.
5. Thành viên không sửa/xóa được bình luận người khác, kể cả đoán đúng ID.
6. Guest/member đọc cùng danh sách bình luận visible; không thấy hidden/deleted.
7. Đăng xuất hoặc đổi tài khoản không để lộ dữ liệu cá nhân trong cache.

Các mục trên là kế hoạch kiểm thử, chưa phải kết quả đã chạy.
