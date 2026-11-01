# Kế hoạch kiểm thử BE

Đã có test hồi quy nền/Anime/Mùa/tập và test HTTP/PostgreSQL cho Auth/quyền, ownership, Library/Progress, Comments/moderation, Playback/provider fake, admin, Home/ranking và concurrency. Số test/lệnh/kết quả thật xem [verification.md](verification.md). Các case FE/player/cache/media trong kế hoạch dưới chưa được kiểm thử tích hợp; không coi mọi dòng checklist là đã chạy.

Unit test cho validation, permission và nghiệp vụ đã chốt. Integration test dùng database kiểm thử/migration thật để kiểm tra constraint, transaction và truy vấn theo user. Contract test xác nhận HTTP status, DTO, phân trang và lỗi. Luồng FE/BE dùng server cục bộ, fixture và fake playback provider.

## Công cụ C#

Dùng xUnit và Microsoft.AspNetCore.Mvc.Testing/WebApplicationFactory theo [hướng dẫn Microsoft](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-10.0). Test project tham chiếu API; test host thay provider bên ngoài bằng fake và chỉ cài test authentication handler trong môi trường test.

Test ràng buộc, migration và truy vấn đặc thù phải dùng PostgreSQL riêng, không dùng EF InMemory/SQLite để kết luận tương thích PostgreSQL. Có thể cấp database cục bộ hoặc container test khi môi trường hỗ trợ; không mặc định Docker đã cài. Cô lập dữ liệu giữa test, chỉ reset database test được xác định rõ. Pin version công cụ khi triển khai.

Chạy format/build/test theo [setup.md](setup.md). Test thường ghi rõ PostgreSQL case skipped nếu chưa cấp fixture; chạy `BE/scripts/test-database.ps1` để khởi động PostgreSQL riêng, kiểm tra baseline/readiness rồi dừng container test. Không dùng database dev cho script này.

| Nhóm | Tình huống nghiệm thu |
| --- | --- |
| Common | Guest/user đọc cùng public; không lộ draft, kể cả ID tập thuộc cha bị ẩn |
| Danh mục | Filter kết hợp, query sai, thứ tự ổn định, empty và page vượt cuối theo quy tắc chốt |
| Phiên/quyền | 401 khi thiếu/hết phiên; 403 khi blocked/thiếu quyền; thu hồi/đổi quyền có hiệu lực |
| Ownership | Hai user A/B; A không đọc/ghi dữ liệu B bằng ID, body/query; không gán role từ client |
| Library | Upsert không trùng; DELETE 204; bỏ library giữ progress |
| Progress | Không âm, kiểm tra thời lượng, cập nhật đồng thời/xem lại theo chính sách |
| Comments | Guest không đăng; trim/giới hạn body; không nhận authorId/status; chỉ đọc visible; không phục hồi hidden/deleted qua sửa |
| Playback | 404 không tồn tại, 200 nguồn rỗng, 503 provider lỗi; hết hạn, phụ đề, tập trước/sau |
| Riêng tư | Không lộ email/hash/bí mật/stack trace; logout/đổi tài khoản xóa cache cá nhân FE |
| Database | Migration từ rỗng và phiên bản trước; unique/foreign key; ghi đồng thời không tạo trùng |

## Nghiệm thu bổ sung từ handoff (kế hoạch 2026-11-01)

Nguồn: [fe-backend-handoff.md](../fe-backend-handoff.md). Các case dưới chỉ chạy khi triển khai/tích hợp feature tương ứng; chưa được thực hiện bởi lượt đồng bộ tài liệu.

| Luồng | Case cần có |
| --- | --- |
| Adapter/envelope | Object unwrap đúng, list giữ meta/options/summary; 204 không parse JSON; fields map key form, requestId; GET lỗi không fallback mock; hủy request và không retry mutation mù |
| Query/URL | Filter rỗng omit, year number, genre slug khác genre ID ghi DB; enabled yes/no map khi chốt; không gửi mock/actor/permission; filter đổi về trang 1, Back/Forward giữ query; page vượt cuối rỗng |
| DTO/playlist | Genres object map string[], banner fallback, format mở rộng, duration null không ép 0; đủ tập qua nhiều page/mùa; tập đặc biệt/ID không liên tiếp; direct watch dựng anime từ server ID |
| Auth | Password thật đi qua repository mới; đăng ký không tự cấp role; me email/roles/permissions; bootstrap bất đồng bộ; đổi mật khẩu/thu hồi/hết phiên/blocked theo policy; password không trim/lowercase |
| Role | user không admin, manage đọc nhưng không ghi/moderate, admin chỉ quyền được cấp; cùng role thiếu permission bị từ chối; own vẫn áp dụng manage/admin; Users không có mutation tài khoản |
| Library/summary | Toggle favorite giữ status/history; counts trước q/toàn collection, history theo tập, watching progress gần nhất mỗi anime rồi xét completed; inProgressEpisodeCount khác số anime watching; không N request lấy từng anime |
| Progress | Ghi sau actual play/duration hợp lệ, khoảng 10 giây và force pause/ended/hidden/unmount; ended completed; request cũ/đa thiết bị/xem lại/unknown duration theo policy; logout không làm lộ cache user trước |
| Comments | commentPage → page, không paginate lại API page; refetch đúng trang; public author không email; own/hidden/deleted đúng; moderation reason/actor/time server, không restore deleted và body deleted null |
| Admin list/edit | List phân trang + lookup/detail, edit/panel record ngoài page vẫn mở được; không getCatalog toàn DB; options gồm unused và years toàn scope; summary không lấy từ page |
| Admin ghi | Publication riêng release status; publicSlug null khi không public, publishedAt/republication theo quyết định; animeId/seasonId hợp lệ; unique/FK/chặn xóa/concurrency; mutation invalidation public/admin/lookup |
| Sources/subtitles | Enabled/default qua save theo contract; transaction khi đổi default; chặn source còn track; sort created có order/tie-breaker thực tế; không lộ credential |
| Media | Fake provider/media local kiểm tra MIME/range/CORS/expiry, HLS/subtitle theo định dạng chọn; tách published/enabled/phát được; fake thành công không chứng minh provider thật |
| Home/Dashboard | Nhóm Home theo tiêu chí riêng, newest releaseYear khác mới cập nhật tập; recentAnime theo ngày tập công bố; metrics đúng scope; ranking một nguồn public, không fixture giả số thật |
| View/ranking | Chỉ test sau chốt định nghĩa view/chống trùng/tổng hợp; không cộng chỉ vì GET/link và không tin viewCount client; draft không lộ qua related/ranking |

Kiểm thử HTTP/database thuộc BE; case URL/player/cache/adapter cần nhiệm vụ tích hợp FE riêng. Không tuyên bố tích hợp đạt khi mới có API hoặc fake test. Baseline validation form trong handoff cần server tự validate và contract xác nhận; không coi giới hạn đề xuất là đã duyệt.

## Bằng chứng

Khi triển khai, tạo verification BE ghi ngày, phiên bản code, lệnh thực tế, fixture, kết quả và giới hạn. Không sửa lịch sử [verification FE](../docs-FE/verification.md). Không đọc `.env`/credentials hoặc gọi API/model thật khi kiểm tra.

Nghiệm thu khi contract thống nhất, kiểm tra liên quan đạt và FE xử lý loading/empty/error/unauthorized. Fake provider đạt không chứng minh đã có nguồn phim thật; nguồn được phép sử dụng cần kiểm chứng riêng.
