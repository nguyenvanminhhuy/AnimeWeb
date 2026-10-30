# API backend và hợp đồng FE/BE

[api-contract.md](../api-contract.md) chứa đầy đủ endpoint, payload và ví dụ. Đây là **bản nháp v0.2**, chưa có server hoạt động. Tài liệu này bổ sung hướng triển khai, không tạo hợp đồng thứ hai.

## Quy ước

- Prefix `/api/v1`, JSON camelCase, ID string, thời gian UTC ISO 8601.
- Đối tượng trả `{ data }`; danh sách phân trang trả `{ data, meta }`, page từ 1. Genre/season trả mảng data theo contract.
- PageSize đề xuất mặc định 20, giới hạn 1–50. Validate params/query/body ở server.
- Lỗi dùng `error.code`, `error.message`, tùy chọn `fields` và `requestId`; DELETE thành công trả 204 không có body.
- Common chỉ trả nội dung công khai; me yêu cầu phiên/quyền theo [auth-permissions.md](auth-permissions.md).

## Nhóm endpoint

| Nhóm | Phạm vi | Điểm kiểm soát |
| --- | --- | --- |
| Danh mục common | Anime, genre, tìm/lọc, mùa và tập | Publication của tài nguyên và cha, query hợp lệ, thứ tự ổn định |
| Playback common | Chi tiết và nguồn của tập | 404 không tồn tại; 200 sources rỗng khi chưa có nguồn; 503 provider lỗi |
| Me/library/progress | Hồ sơ, thư viện, tiến độ | userId từ phiên, permission own, không lộ dữ liệu tài khoản khác |
| Comments common/me | Đọc và ghi bình luận | Chỉ đọc visible; ghi plain text; sửa/xóa theo tác giả |

Đường dẫn cụ thể giữ đúng contract. GET thư viện/tiến độ cần summary anime/tập để tránh FE gọi thêm từng item.

## Phần phải hoàn thiện trước khi code

1. Auth: endpoint đăng ký/đăng nhập/đăng xuất, cơ chế phiên, hết hạn/thu hồi và DTO lỗi; chưa có trong v0.2.
2. Danh mục: publication anime, sort mặc định, page vượt cuối, ngữ nghĩa tìm kiếm và filter kết hợp. Không thêm sort rating/popular khi chưa có nguồn.
3. DTO: FE hiện hỗ trợ format tv/movie; API đề xuất thêm ova/ona/special. Chốt mapper trước khi mở rộng dữ liệu.
4. Tiến độ: hoàn thành, xem lại, xung đột nhiều thiết bị và thời lượng chưa biết. Không tự lấy timestamp client làm chuẩn.
5. Bình luận: duyệt trước hay hiện ngay, sửa nội dung hidden/deleted; giới hạn đề xuất 1–2000 ký tự sau trim.
6. Playback: định dạng, URL hết hạn, phụ đề, timeout và lấy lại nguồn; không hứa có nguồn phim thật.

Ghi lựa chọn được xác nhận vào [decisions.md](../decisions.md), cập nhật contract và mapper FE cùng thay đổi. Khi triển khai ASP.NET Core Controller, đăng ký tài liệu OpenAPI phù hợp stack đã chốt; hiện chưa có schema máy đọc được hoặc endpoint hoạt động. Lỗi ApiController, authorization và exception phải cùng envelope error trong contract, không mặc định trả ProblemDetails khác cấu trúc.
