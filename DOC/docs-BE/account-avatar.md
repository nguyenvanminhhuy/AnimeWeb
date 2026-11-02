# Ảnh đại diện tài khoản

Đã thêm BE/FE ngày 2026-11-02 theo yêu cầu người dùng. User/manage/admin đổi hoặc xoá **ảnh của chính mình** tại Trang cá nhân. Không có API sửa avatar người khác hoặc upload file/video chung.

## Hợp đồng API

| Method | Endpoint | Input | Response / quyền |
| --- | --- | --- | --- |
| PUT | `/api/v1/me/avatar?version=1` | Raw PNG bytes, Content-Type image/png; version nguyên >=1 bắt buộc | 200 `{data: ProfileDto}`; active + `profile:avatar:write:own` |
| DELETE | `/api/v1/me/avatar?version=2` | Không body; version bắt buộc | 200 `{data: ProfileDto}`; cùng quyền own |
| GET | `/api/v1/common/avatars/{userId}/{key}` | URL do server trả | 200 image/png hoặc 404; public, không trả email/role |

ProfileDto (GET /me và profile trong register/login) thêm `avatarUrl: string|null`, `version: long`. Các field cũ giữ nguyên. AdminUserDto thêm avatarUrl; CommentDto.author.avatarUrl lấy từ avatar hiện tại của tác giả, không sao chép bytes vào từng bình luận.

FE chọn PNG/JPG/WebP <=5 MiB, từ chối kích thước quá 8192px, cắt vuông giữa ảnh và thu nhỏ tối đa 512px, canvas xuất PNG mới để bỏ metadata. Preview trước, chỉ upload khi nhấn Lưu ảnh. PUT nhận PNG đã xử lý, không dùng multipart/base64 JSON hoặc đường dẫn file từ client.

BE kiểm tra độc lập: body <=2 MiB, PNG signature, chunk length/CRC, RGB/RGBA 8-bit không interlace, kích thước 1–512px mỗi chiều, IHDR/IDAT/IEND, decompression giới hạn theo kích thước và filter từng dòng. Từ chối SVG/GIF/JPEG trực tiếp và PNG hỏng; JPEG/WebP đi qua chuyển đổi FE trước. Không thêm thư viện ảnh/native dependency hoặc dịch vụ ngoài.

| Lỗi | Ý nghĩa |
| --- | --- |
| 400 VALIDATION_ERROR | Version thiếu/sai, PNG rỗng/hỏng/kích thước không hợp lệ |
| 401 | Chưa đăng nhập, token thu hồi/hết hạn |
| 403 | Không active hoặc thiếu quyền own |
| 404 | Avatar đã thay/xoá, key/id không tồn tại |
| 409 CONFLICT | Account.Version đã đổi; tải lại profile rồi xác nhận lại |
| 413 | Body vượt 2 MiB; AVATAR_TOO_LARGE khi controller/service phát hiện, envelope chuẩn khi server chặn |
| 415 UNSUPPORTED_MEDIA_TYPE | Content-Type không phải image/png |

## Lưu trữ và đồng thời

Migration AccountAvatar thêm Accounts.AvatarKey nullable và AccountAvatars (UserId PK/FK, Content bytea), seed `profile:avatar:write:own` cho cả ba role. Không thêm bytes vào Accounts để xác thực không tải toàn bộ ảnh. Mỗi user có một bản ảnh; thay/xoá loại bỏ bản cũ, không tạo file rác trên ổ đĩa. Backup database gồm avatar; không dùng kho này cho media/video.

PUT/DELETE dùng account advisory transaction lock giống login/password/status/role, kiểm tra lại active/permission sau khi chờ, dùng chung Account.Version chống ghi cũ. PUT đổi key ngẫu nhiên và tăng version; DELETE có ảnh tăng version, DELETE khi đã không có ảnh là no-op. Không đổi password/role/status hoặc thu hồi phiên chỉ vì đổi avatar.

URL chứa key mới mỗi lần thay. GET chỉ trả key hiện tại, PNG với X-Content-Type-Options nosniff, Cache-Control no-cache; URL cũ trả 404 sau thay/xoá. Avatar là ảnh công khai dùng cho Header, hồ sơ, quản trị người dùng và bình luận.

## FE và mock

- Avatar chung thêm src, object-cover trong khung tròn sm/md/lg; tải lỗi quay về chữ viết tắt, thử lại khi src đổi. Giữ aria-hidden vì tên đã ở nơi gọi.
- AvatarEditor dùng Input/Button chung: chọn file, preview, Lưu ảnh thủ công và xác nhận xoá. Huỷ chọn giải phóng blob URL; unmount/đổi tài khoản abort và chặn submit trùng.
- Session nhận profile/avatar từ response và cập nhật credentials trong bộ nhớ; reload GET /me để lấy ảnh bền vững. Không lưu ảnh/base64/permission vào localStorage. 409 tải lại profile/version trước khi người dùng nhấn Lưu lại, không tự retry mutation.
- Header và hero cập nhật ngay; admin list/detail và bình luận lấy avatar theo DTO khi tải. Mock DEV không giả lập upload thành công: editor chỉ hiện ở phiên backend có quyền, repository mock từ chối upload.

## Chạy và kiểm chứng

Áp dụng migration bằng cấu hình local hiện có, không reset database:

```powershell
# trong BE
dotnet ef database update --project src/AnimeWeb.Api --startup-project src/AnimeWeb.Api
```

Migration 20261102155535_AccountAvatar đã áp dụng vào database dev local ngày 2026-11-02, tổng 7 migration. Không thay avatar/role/password tài khoản hiện có. Khởi động lại BE và đăng nhập lại để nhận permission mới. Bằng chứng tại verification BE/FE. Test dùng PostgreSQL riêng và fake HTTP, không thử upload vào tài khoản thật.

### Khi PUT avatar trả 404 sau cập nhật

Nếu response Server là Kestrel nhưng PUT `/api/v1/me/avatar` trả 404, kiểm tra BE có được restart sau khi thêm controller không; chỉ cập nhật FE hoặc database không nạp API mới vào tiến trình cũ. Trường hợp hồ sơ do BE cũ trả thiếu version, FE tải lại GET /me trước khi upload. Nếu server vẫn không trả version hợp lệ, hiển thị hướng dẫn restart BE và không gửi PUT thiếu version. Không gán version=1 mặc định để vượt qua kiểm tra concurrency. Client cũng chặn version rỗng/0/không nguyên trước transport.
