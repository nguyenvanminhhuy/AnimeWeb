# Lỗi quản trị và xoá anime

Thêm 2026-11-03: ANIME_ARCHIVED (409) yêu cầu khôi phục phim về draft trước sửa/xoá; ANIME_NOT_ARCHIVED (409) từ chối khôi phục phim chưa lưu trữ. Dùng [lưu trữ](archive-search-audit.md) khi phim còn dữ liệu liên quan, không xoá dây chuyền. Các lỗi version/FK/xoá bên dưới giữ nguyên.

Cập nhật 2026-11-03: giữ nguyên ràng buộc xoá, bổ sung lỗi rõ nghĩa và hướng xử lý FE. Không thêm xoá dây chuyền, xoá mềm hoặc tự chuyển trạng thái để vượt điều kiện.

## DELETE /api/v1/admin/anime/{id}?version=...

Yêu cầu active và admin:anime:write; version nguyên >=1. Thứ tự: transaction → advisory lock theo anime ID (chung với Save) → đọc bản ghi → kiểm tra version → trạng thái → dữ liệu tham chiếu → xoá liên kết thể loại và phim → commit. DB vẫn là lớp bảo vệ cuối cùng khi tham chiếu xuất hiện đồng thời.

| HTTP / code | Nguyên nhân | FE |
| --- | --- | --- |
| 204 | Bản nháp không còn tham chiếu | Đóng dialog, refresh danh sách, thông báo thành công |
| 400 | Query/body không hợp lệ | Hướng dẫn kiểm tra dữ liệu; form giữ field errors |
| 401 | Chưa đăng nhập/phiên hết hạn | Cơ chế session hiện có xử lý đăng nhập lại |
| 403 | Không có quyền ghi | Báo thiếu quyền, chặn xác nhận xoá tiếp |
| 404 | Phim không còn tồn tại | Tải lại danh sách, không gửi lại cùng snapshot |
| 409 STALE_VERSION | Version gửi lên đã cũ | Chỉ có nút Tải lại danh sách; đóng dialog, refresh giữ query, xác nhận lại trên snapshot mới |
| 409 ANIME_PUBLISHED | Phim đang công bố | Chặn xoá, hướng dẫn về bản nháp, liên kết Chỉnh sửa phim giữ returnTo |
| 409 ANIME_IN_USE | Còn mùa/phần (bao gồm tập), thư viện, bình luận hoặc ViewEvent | Chặn xoá; giữ toàn bộ dữ liệu liên quan, không tự xoá lịch sử/thư viện |
| 5xx/network | Lỗi xử lý/kết nối tạm thời | Báo lỗi, cho thử lại bằng thao tác của người dùng |

Khi đã biết phim published hoặc có tập công khai từ row, dialog chặn xác nhận ngay. Số tập công khai bằng 0 **không chứng minh** không còn dữ liệu tham chiếu; BE luôn kiểm tra độc lập. FK violation được ánh xạ ANIME_IN_USE; concurrency lúc ghi thành STALE_VERSION. Hai request xoá cùng bản ghi được serialize; một thành công, request sau nhận 404.

Các mutation khác vẫn có thể dùng 409 CONFLICT chung cho version/constraint. Không diễn giải mọi 409 là phiên bản cũ. FE dùng adminApiErrorMessage cho anime, thể loại, mùa/tập, nguồn/phụ đề và kiểm duyệt: 400/401/403/404/409/429/network/5xx có nội dung tiếng Việt, các form giữ lỗi từng field. Không tự retry mutation hoặc bỏ version khi server từ chối.

## Nội dung và generate

Trong backend mode không hiển thị lời hứa “chỉ lưu phiên mẫu”, “reload sẽ reset” hoặc “dữ liệu công khai không thay đổi” cho thao tác thật. Copy xác nhận/success dùng ngôn ngữ trung tính, cảnh báo hậu quả đúng nghiệp vụ. Chỉ giữ banner dữ liệu hư cấu trong mock DEV rõ ràng. Bảng thao tác tiếp tục dùng Button/Icon chung, dialog quản lý focus/abort/pending và kiểm tra quyền.

Không có migration cho thay đổi này. Restart BE để nạp các mã lỗi mới; mock remove dùng cùng mã STALE_VERSION/ANIME_PUBLISHED/ANIME_IN_USE, nhưng không được coi mock là bằng chứng ràng buộc server. Kiểm thử tại verification BE/FE.
