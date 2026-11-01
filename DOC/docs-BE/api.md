# API backend và hợp đồng FE/BE

[api-contract.md](../api-contract.md) v0.3 chứa endpoint/payload/quyết định đã duyệt. Auth/Library/Progress/Comments/Playback, Home/related/ranking và admin đã được triển khai cùng các API cũ; xem [hiện trạng](current-status.md). Tài liệu này không tạo hợp đồng thứ hai.

Đồng bộ theo [handoff FE](../fe-backend-handoff.md) và bộ mặc định người dùng duyệt 2026-11-01: các feature BE đã có DTO rõ kiểu để OpenAPI mô tả response, gồm lỗi validation/auth/concurrency. Thay đổi tiếp theo vẫn cần cập nhật contract trước code, không sao chép mock thành API thật.

## Quy ước

- Prefix `/api/v1`, JSON camelCase, ID string, thời gian UTC ISO 8601.
- Đối tượng trả `{ data }`; danh sách phân trang trả `{ data, meta }`, page từ 1. Genre/season trả mảng data theo contract.
- PageSize đề xuất mặc định 20, giới hạn 1–50. Validate params/query/body ở server.
- Lỗi dùng `error.code`, `error.message`, tùy chọn `fields` và `requestId`; key fields theo tên HTTP/JSON camelCase để map vào form/query. OpenAPI dùng tên query camelCase và schema lỗi 400 đúng envelope. DELETE thành công trả 204 không có body.
- Common chỉ trả nội dung công khai; me yêu cầu phiên/quyền theo [auth-permissions.md](auth-permissions.md).

## Nhóm endpoint

| Nhóm | Phạm vi | Điểm kiểm soát |
| --- | --- | --- |
| Danh mục common | Anime, genre, tìm/lọc, mùa và tập | Publication của tài nguyên và cha, query hợp lệ, thứ tự ổn định |
| Playback common | Chi tiết và nguồn của tập | 404 không tồn tại; 200 sources rỗng khi chưa có nguồn; 503 provider lỗi |
| Me/library/progress | Hồ sơ, thư viện, tiến độ | userId từ phiên, permission own, không lộ dữ liệu tài khoản khác |
| Comments common/me | Đọc và ghi bình luận | Chỉ đọc visible; ghi plain text; sửa/xóa theo tác giả |
| Auth | Register/login/logout/me/change-password | Phiên thật, role mới user, quyền/blocked/thu hồi; cơ chế phiên còn mở |
| Home/related/ranking | Tổng hợp nhóm nội dung, liên quan và Top 10 | Tiêu chí riêng, published, cùng nguồn view Home/Dashboard; không tự ghi view khi GET |
| Admin nội dung | Anime/genres/mùa/tập/nguồn/phụ đề | Permission read/write cụ thể, publication, quan hệ, list/detail/options và concurrency |
| Admin users/comments/dashboard | Users chỉ đọc, kiểm duyệt và aggregate | Permission read/moderate, audit server, summary đúng scope; không quản trị tài khoản ngoài phạm vi |

Đường dẫn cụ thể giữ đúng contract. GET thư viện/tiến độ cần summary anime/tập để tránh FE gọi thêm từng item.

## Checklist cho tích hợp và thay đổi tiếp theo

Các lựa chọn phiên, version, publication, ngày công bố, comments và view ở checklist trước đây đã được người dùng duyệt và code trong v0.3. Khi đọc từng mục bên dưới, lấy quyết định v0.3 làm chuẩn, không hỏi lại hoặc coi feature chưa có. Phần cần thực hiện tiếp là tích hợp FE, xác minh media/hạ tầng và thay đổi ngoài contract.

1. Auth: endpoint đăng ký/đăng nhập/đăng xuất, cơ chế phiên, hết hạn/thu hồi và DTO lỗi; chưa có trong v0.2.
2. Danh mục: đã chốt/triển khai publication, sort mặc định, page vượt cuối, tìm kiếm và filter kết hợp theo mục Anime trong contract; khi nối FE cần xử lý khác biệt normalizeSearch và clamp page. Không thêm sort rating/popular khi chưa có nguồn.
3. DTO: FE hiện hỗ trợ format tv/movie; BE đã hỗ trợ thêm ova/ona/special. Genres objects/string[], banner nullable, durationSeconds nullable, subtitle/episodeLabel cần mapper/type/UI phù hợp. Không tự đổi contract đọc để khớp fixture.
4. Tiến độ: hoàn thành, xem lại, xung đột nhiều thiết bị và thời lượng chưa biết. Không tự lấy timestamp client làm chuẩn.
5. Bình luận: chốt duyệt trước hay hiện ngay và giới hạn đề xuất 1–2000 ký tự sau trim; không cho sửa hidden/deleted để tự hiện lại. Admin hide/restore có reason UI 3–300 làm baseline, không restore deleted.
6. Playback: định dạng, URL hết hạn, phụ đề, timeout và lấy lại nguồn; không hứa có nguồn phim thật.
7. Library/progress: q/sort, summary/preview, counts trước q; history theo tập, watching theo progress gần nhất mỗi anime. Query collection/summary endpoint còn đề xuất, không tự coi đã có.
8. Admin: workflow publication anime và publishedAt tập; input genreIds/options, detail theo ID cho direct edit, chặn xóa quan hệ và version/concurrency/409 khi được chốt. Không giữ getCatalog bằng tải toàn DB.
9. Home/related/options/ranking: chọn aggregate hoặc endpoint riêng; định nghĩa mới cập nhật/view/tổng hợp và metric Dashboard, không trộn ngày sửa anime với ngày công bố tập.

## Yêu cầu tương thích từ handoff

Adapter unwrap object, giữ list meta và map fields lỗi; mutation trả data có thể được adapter bỏ nếu interface FE trả void. Summary/options là yêu cầu dữ liệu, không bắt buộc envelope mới trước khi được duyệt. Public comments map commentPage → page; nguồn map enabled yes/no → boolean; bỏ filter rỗng. Không gửi actor/AdminPreviewSession/mock/AbortSignal vào payload; actor server, Signal để hủy request.

API mới cần hỗ trợ query và pageSize FE tại mục 7 handoff theo phạm vi đã chốt. List phải có thứ tự ổn định/tie-breaker, metadata toàn collection đúng scope, detail theo ID cho panel/edit ngoài page. HTTP 401/403 không redirect login; 404 không có/không public hoặc own theo contract; 409 chỉ khi đã đặc tả; 204 không JSON. FE không fallback mock khi API lỗi.

Ghi lựa chọn được xác nhận vào [decisions.md](../decisions.md), cập nhật contract và mapper FE cùng thay đổi. Nền ASP.NET Core đã có OpenAPI tại `/openapi/v1.json` trong Development. Validation/exception/404/405/503 dùng envelope error; các lỗi auth 401/403 sẽ được nối khi triển khai authentication/authorization. Không mặc định trả ProblemDetails khác contract.
