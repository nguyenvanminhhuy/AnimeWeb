# Hiện trạng BE — 2026-11-01

Đã triển khai các feature BE trong [handoff FE](../fe-backend-handoff.md) theo bộ mặc định được người dùng xác nhận tại [API contract v0.3](../api-contract.md). Tài liệu này là bản đồ triển khai, không thay contract. Kết quả chạy thật được thêm tại [verification](verification.md).

| Feature | Triển khai |
| --- | --- |
| Nền/Anime/Mùa/tập | Giữ các API đọc cũ; DTO không trả EF entity, draft/cha hidden không lộ; hasPlayback tính từ nguồn enabled chưa hết hạn |
| Auth/quyền | Đăng ký user, login, logout, me/email/roles/permissions, đổi mật khẩu; bearer opaque 7 ngày, DB chỉ lưu hash; thu hồi phiên và quyền/blocked kiểm tra từ DB mỗi request |
| Library/progress | Own server-side, version/409, q/sort/page, counts trước q, summary/preview; history theo tập, watching theo progress mới nhất mỗi anime; bỏ favorite/library giữ lịch sử |
| Comments | Public visible phân trang; create/update/delete own; ẩn/hiện lại có audit/reason/version; deleted body null, không phục hồi |
| Playback | Direct provider qua interface, nguồn mp4/hls và track vtt/srt; enabled/expiry, playlist trước/sau xuyên mùa; provider timeout/lỗi 503, nguồn trống 200 |
| Home/related/options | Nhóm nội dung theo tiêu chí trong contract, public genres/formats/years và related theo genres; không lấy options từ một page |
| Ranking/view | View session server, xác nhận sau 30 giây và vị trí tăng 30 giây; unique anime/viewer/bucket30phút; cùng ranking DB cho Home/Dashboard |
| Admin catalog | Anime/genre CRUD, publication riêng status, options/usage/year; version, unique/relations; không cascade xóa nội dung liên quan |
| Admin episodes | Season/episode list/detail/CRUD; validate cha, movie một mùa/một tập, server gán publishedAt lần đầu và giữ khi tái xuất bản |
| Admin media | Source/track CRUD, default track tối đa một/source trong transaction; chặn xóa source còn track; provider hiện chỉ direct |
| Admin Users/Dashboard | Users list/detail/summary và admin PATCH trạng thái theo version; Dashboard aggregate counts/status/recent/ranking; có PATCH role theo version; không xoá hoặc reset mật khẩu người khác |

## Dữ liệu và thao tác vận hành

Migration mới `20261101081745_CompleteBackendFeatures` bổ sung Accounts/LoginSessions/RBAC, LibraryEntries/WatchProgress, Comments/audit, PlaybackSources/SubtitleTracks/ViewSessions/ViewEvents; thêm version và subtitle, normalized genre name unique. Giữ nguyên ba migration cũ và không thu hẹp cột Synopsis đang có. Role/permission là seed cấu hình cố định, không là seed tài khoản/mật khẩu. Nếu dữ liệu cũ có tên genre trùng không phân biệt hoa/thường, cần xử lý trước khi apply unique index; migration không tự xóa/đổi tên dữ liệu.

Anime draft không còn tài nguyên tham chiếu có thể xóa cùng các liên kết AnimeGenre của nó trong một transaction; không xóa Genre. Nếu còn mùa/library/comments/view events, FK chặn và transaction rollback. Episode published phải chuyển draft trước xóa; FK vẫn chặn nếu còn nguồn/progress/view session. Bản ghi đã được tham chiếu có thể giữ draft thay xóa.

Admin đầu tiên chỉ tạo bằng CLI explicit `--bootstrap-admin` sau migration, với cấu hình Bootstrap__Email/Bootstrap__DisplayName/Bootstrap__Password do người vận hành cấp. Không chạy bootstrap khi ứng dụng start bình thường, không có mật khẩu mặc định, không nâng quyền tài khoản đăng ký và đã có API đổi role cho admin. Xem [BE README](../../BE/README.md).

## Tích hợp và giới hạn thực tế

- Chưa sửa/nối FE: repository/session/mock, mapper, form publication/version và player HLS/SRT cần nhiệm vụ tích hợp riêng. DTO admin comments có `{comment,lastModeration}`; library/progress rows phẳng, me summary ở `/me/library/summary`; adapter unwrap/map theo OpenAPI.
- Direct provider chỉ trả metadata URL do admin cấu hình, không fetch/proxy/transcode/upload media. Không có video thật được seed. HLS/SRT cần player/converter thích hợp; CORS/MIME/range do nơi phân phối media, không được chứng minh chỉ bằng API test.
- Counts `episodesWithoutVideo` là tập published thiếu cấu hình nguồn enabled chưa hết hạn, không chứng minh chất lượng phát. Dashboard counts gồm nội dung draft trong phạm vi admin; ranking/related/Home chỉ public.
- Rate limit mặc định global 120/phút/IP, auth 10/phút/IP, có thể cấu hình RateLimits__Global/RateLimits__Auth. Đang dùng limiter trong một tiến trình; chạy nhiều instance cần hạ tầng chia sẻ/edge phù hợp.
- View là thống kê vận hành cơ bản: client có thể giả lập playback hoặc tạo viewer mới; không tuyên bố chống gian lận tuyệt đối. View sessions và login sessions hết hạn chưa có job dọn định kỳ; không tự xóa dữ liệu vận hành trong lượt này.
- Chưa deploy, chưa apply migration/seed/bootstrap vào DB dev/production hoặc đọc credentials của người dùng. Tests dùng PostgreSQL riêng, fake provider và clock kiểm soát được.
