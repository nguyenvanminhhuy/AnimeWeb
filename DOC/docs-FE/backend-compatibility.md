# FE tương thích BE v0.3

Cập nhật 2026-11-01. FE đã chuẩn bị DTO, adapter và luồng giao diện theo [API BE đã triển khai](../docs-BE/feature-reference.md) và [contract v0.3](../api-contract.md). **Ứng dụng mặc định dùng HTTP BE qua proxy `/api` của Vite tới `http://127.0.0.1:5200`.** Mock chỉ bật chủ động trong dev bằng biến terminal `VITE_API_MODE=mock`. Không đọc file .env; setup tại [README](../../README.md).

## Ranh giới dữ liệu

| File trong FE/src | Trách nhiệm |
| --- | --- |
| `lib/api/backend/types.ts` | DTO request/response BE, envelope, pagination, version và enum |
| `lib/api/backend/client.ts` | Method/path/query/body theo API; nhận transport được inject, nhận HTTP transport tại điểm chọn adapter |
| `lib/api/backend/error.ts` | Lỗi có status/code/message/fields/requestId và kiểm tra version mock |
| `lib/api/backend/mappers.ts` | Chuyển DTO thành view model, map genre ID, ghép anime detail/playlist/playback |
| `lib/api/backend/repositories.ts` | Factory adapter cho toàn bộ repository hiện được màn hình sử dụng |
| `lib/api/contracts/` | Interface dùng chung giữa mock và adapter BE |
| `lib/api/repositories.ts` | Điểm chọn adapter; backend mặc định, mock opt-in trong dev |

Không serialize actor, permissions, session, mock state, signal, view model hoặc query dành riêng cho UI. Body gửi các field cho phép; PATCH quản trị giữ đủ form và version. `genreIds` được map từ options BE, không gửi tên thể loại. `commentPage` trên URL được đổi thành `page` trong request. ID/path được encode, query bỏ giá trị rỗng, DELETE gửi version qua query, response 204 không cần body.

Client nhận callback lấy bearer token và callback xử lý 401 của request đã có token. Khi tích hợp thật, inject transport cùng kho credential và nối callback này với việc xoá phiên/cache. Ứng dụng đã khởi tạo factory với httpTransport. Token/expiry lưu sessionStorage theo tab; profile/roles/permissions khôi phục bằng /auth/me. 401 xoá credential và state/cache cá nhân; phản hồi 401 cũ không xoá phiên mới nếu token đã đổi.

## Những luồng đã chuẩn bị

| Nhóm | Hành vi FE |
| --- | --- |
| Catalog/Home/Ranking | Map genre object, banner nullable; đủ tv/movie/ova/ona/special; Home chuyển nhãn bộ lọc thành genre slug; không bịa số tập nếu DTO không có |
| Anime detail/Watch | Ghép detail, seasons, các trang episodes và related; playback map mp4/hls, phụ đề vtt/srt, expiry và tập trước/sau |
| Login/Register | Payload có password theo BE; nhận token/expiry/profile/roles/permissions; restore bất đồng bộ, hết hạn và logout xoá state phiên |
| Change password | Có currentPassword/newPassword; adapter BE chuẩn bị xử lý 204 và yêu cầu đăng nhập lại; chế độ mock vẫn chỉ kiểm tra form |
| Library/Progress/Profile | Repository cá nhân riêng; list trả page/meta/count toàn collection; Profile dùng summary, phân biệt số tập đang xem với số anime đang xem; Tiếp tục xem trên Home lấy collection cá nhân thay vì tìm trong các nhóm Home |
| Comments | List phân trang server; tác giả nested được map; update/delete giữ version; deleted body null được giữ trong quản trị |
| Admin Anime/Genres | Create version 0, update/delete version đã đọc; publicationStatus và alternativeTitles giữ qua form; danh sách và detail tách biệt |
| Admin Seasons/Episodes | List theo page/meta; form nhận context hoặc detail ngoài trang; episode number hỗ trợ số lẻ/0, duration nullable, thumbnail và version |
| Admin Sources/Subtitles | Provider direct, URL HTTP(S) tuyệt đối, expiresAt nullable; mp4/hls, vtt/srt; refetch sau thay default vì version track cũ cũng đổi |
| Admin Comments/Users/Dashboard | Summary toàn danh sách, panel detail độc lập pagination; hide/restore versioned; User có đọc và admin khoá/mở khoá; Dashboard map cùng RankingDto với Home |

Lỗi field được đưa về form; lỗi xung đột không tự ghi đè hoặc tự tăng version ở client. Người dùng tải lại dữ liệu trước khi lưu tiếp. Mock cũng kiểm tra version cho các mutation đã chuyển đổi để phát hiện cách gọi sai ngay khi chưa kết nối BE.

## Phiên và dữ liệu cá nhân

Role server là `user/manage/admin`; UI quản trị dựng theo permissions trong profile. Phiên quản trị giả vẫn chỉ bật chủ động ở dev. Việc ẩn nút/guard FE không thay thế authorization BE.

Mock nhận payload auth tương thích nhưng không lưu, băm hoặc xác thực password; không biến dữ liệu localStorage thành bằng chứng đăng nhập server. Token mock chỉ dùng cho mô phỏng khi bật mock; các nút tài khoản/phiên quản trị giả bị ẩn trong chế độ HTTP. Credential có expiresAt lỗi hoặc đã qua bị xoá khi restore trước khi gọi transport. Thư viện/tiến độ local cũ được chuẩn hoá version khi đọc; không tự nhập dữ liệu demo vào BE. Adapter cá nhân dùng summary và metadata đi kèm dòng dữ liệu, không gọi endpoint `by-ids` không tồn tại.

## Player

MP4 dùng native video. HLS ưu tiên hỗ trợ native, còn lại tải động `hls.js` và huỷ instance khi đổi nguồn. Track SRT được đổi thành WebVTT trong bộ nhớ, có abort và thu hồi object URL; VTT dùng trực tiếp. Nguồn hết hạn hoặc có thời điểm hết hạn không hợp lệ có nút tải lại metadata. Lịch hết hạn dùng deadline tuyệt đối, kiểm tra lại sau giới hạn timer của trình duyệt; không làm hết hạn sớm khi expiresAt cách hiện tại hơn khoảng 24,8 ngày. Việc ghi tiến độ gửi số giây nguyên, completed và version; hàng đợi cá nhân đọc version mới trước mỗi lần ghi để Pause/Kết thúc liên tiếp không tự xung đột; view session chỉ bắt đầu khi phát và xác nhận sau thời gian tối thiểu, không tăng view từ GET trang.

URL media/phụ đề chỉ được tải khi player có nguồn đã cấu hình. Mặc định fixture không có nguồn phim thật. Kiểm thử sự kiện media/transport giả không xác nhận khả năng phát video thực tế, CORS, MIME, byte range hoặc CDN. Cookie guest cho view session đã có cờ credentials trong request abstraction; khi nối HTTP cần proxy cùng origin hoặc cấu hình credentials/CORS phù hợp.

## Kết nối HTTP đang dùng

- `lib/api/backend/transport.ts` gọi fetch với JSON, AbortSignal, bearer, cookies cùng origin, 204 và lỗi network/response không phải JSON.
- `lib/api/backend/credentials.ts` giữ token/expiry theo tab; không lưu password hoặc permissions vào credential. Khi sessionStorage bị chặn có fallback trong bộ nhớ, reload cần đăng nhập lại.
- `config/api.ts` và `lib/api/repositories.ts` chọn backend mặc định. Demo chỉ dành cho VITE_API_MODE=mock ở dev, không dùng để nâng quyền khi đang nối BE.
- `vite.config.ts` proxy /api cho dev/preview. Bản static production cần reverse proxy tương ứng, không coi Vite proxy là cấu hình hosting production.

## Kiểm chứng và giới hạn

Kết nối local đã được kiểm tra đọc catalog thật, auth/register/login/restore/logout, library, versioned own comments, 401 và user không có quyền admin. Suite `live-backend.browser.mjs` mặc định chỉ đọc; ghi dữ liệu cần opt-in allowWrites, tạo tài khoản kiểm thử riêng. Không có tài khoản admin/password mặc định; bootstrap admin theo BE README. Chưa kiểm chứng video thật/CDN hoặc deploy production.

Kết quả/lệnh thực tế được bổ sung trong [verification.md](verification.md).
