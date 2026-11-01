# FE tương thích BE v0.3

Cập nhật 2026-11-01. FE đã chuẩn bị DTO, adapter và luồng giao diện theo [API BE đã triển khai](../docs-BE/feature-reference.md) và [contract v0.3](../api-contract.md). **Ứng dụng vẫn chọn repository mock, chưa kết nối BE.** Không có base URL, fetch transport hoặc cấu hình môi trường API mới trong lượt này.

## Ranh giới dữ liệu

| File trong FE/src | Trách nhiệm |
| --- | --- |
| `lib/api/backend/types.ts` | DTO request/response BE, envelope, pagination, version và enum |
| `lib/api/backend/client.ts` | Method/path/query/body theo API; nhận transport được inject, không tự gửi HTTP |
| `lib/api/backend/error.ts` | Lỗi có status/code/message/fields/requestId và kiểm tra version mock |
| `lib/api/backend/mappers.ts` | Chuyển DTO thành view model, map genre ID, ghép anime detail/playlist/playback |
| `lib/api/backend/repositories.ts` | Factory adapter cho toàn bộ repository hiện được màn hình sử dụng |
| `lib/api/contracts/` | Interface dùng chung giữa mock và adapter BE |
| `lib/api/repositories.ts` | Điểm chọn adapter; hiện giữ mock/local |

Không serialize actor, permissions, session, mock state, signal, view model hoặc query dành riêng cho UI. Body gửi các field cho phép; PATCH quản trị giữ đủ form và version. `genreIds` được map từ options BE, không gửi tên thể loại. `commentPage` trên URL được đổi thành `page` trong request. ID/path được encode, query bỏ giá trị rỗng, DELETE gửi version qua query, response 204 không cần body.

Client nhận callback lấy bearer token và callback xử lý 401 của request đã có token. Khi tích hợp thật, inject transport cùng kho credential và nối callback này với việc xoá phiên/cache. Factory hiện chỉ được dùng với transport giả trong kiểm thử; chưa được khởi tạo bởi ứng dụng.

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
| Admin Comments/Users/Dashboard | Summary toàn danh sách, panel detail độc lập pagination; hide/restore versioned; User chỉ đọc; Dashboard map cùng RankingDto với Home |

Lỗi field được đưa về form; lỗi xung đột không tự ghi đè hoặc tự tăng version ở client. Người dùng tải lại dữ liệu trước khi lưu tiếp. Mock cũng kiểm tra version cho các mutation đã chuyển đổi để phát hiện cách gọi sai ngay khi chưa kết nối BE.

## Phiên và dữ liệu cá nhân

Role server là `user/manage/admin`; UI quản trị dựng theo permissions trong profile. Phiên quản trị giả vẫn chỉ bật chủ động ở dev. Việc ẩn nút/guard FE không thay thế authorization BE.

Mock nhận payload auth tương thích nhưng không lưu, băm hoặc xác thực password; không biến dữ liệu localStorage thành bằng chứng đăng nhập server. Token mock chỉ dùng cho mô phỏng. Credential có expiresAt lỗi hoặc đã qua bị xoá khi restore trước khi gọi transport. Thư viện/tiến độ local cũ được chuẩn hoá version khi đọc; không tự nhập dữ liệu demo vào BE. Adapter cá nhân dùng summary và metadata đi kèm dòng dữ liệu, không gọi endpoint `by-ids` không tồn tại.

## Player

MP4 dùng native video. HLS ưu tiên hỗ trợ native, còn lại tải động `hls.js` và huỷ instance khi đổi nguồn. Track SRT được đổi thành WebVTT trong bộ nhớ, có abort và thu hồi object URL; VTT dùng trực tiếp. Nguồn hết hạn hoặc có thời điểm hết hạn không hợp lệ có nút tải lại metadata. Lịch hết hạn dùng deadline tuyệt đối, kiểm tra lại sau giới hạn timer của trình duyệt; không làm hết hạn sớm khi expiresAt cách hiện tại hơn khoảng 24,8 ngày. Việc ghi tiến độ gửi số giây nguyên, completed và version; hàng đợi cá nhân đọc version mới trước mỗi lần ghi để Pause/Kết thúc liên tiếp không tự xung đột; view session chỉ bắt đầu khi phát và xác nhận sau thời gian tối thiểu, không tăng view từ GET trang.

URL media/phụ đề chỉ được tải khi player có nguồn đã cấu hình. Mặc định fixture không có nguồn phim thật. Kiểm thử sự kiện media/transport giả không xác nhận khả năng phát video thực tế, CORS, MIME, byte range hoặc CDN. Cookie guest cho view session đã có cờ credentials trong request abstraction; khi nối HTTP cần proxy cùng origin hoặc cấu hình credentials/CORS phù hợp.

## Bước tích hợp sau

1. Triển khai transport HTTP đọc status/body, hỗ trợ AbortSignal và credentials; không thay DTO bằng view model.
2. Chọn chính sách lưu credential, inject token/store/callback 401, đổi adapter tại điểm chọn tập trung.
3. Kiểm thử tích hợp với BE local được cho phép: auth/expiry, 400/401/403/404/409, version, pagination và CRUD.
4. Kiểm chứng playback bằng nguồn hợp lệ; xác nhận CORS/cookie và view dedup trên server.

Kết quả kiểm tra offline/build được bổ sung trong [verification.md](verification.md). Chưa thực hiện các bước kết nối trên.
