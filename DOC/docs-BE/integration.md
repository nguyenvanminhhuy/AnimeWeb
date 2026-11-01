# Tích hợp backend với FE

**Cập nhật 2026-11-01:** BE đã triển khai các API trong handoff theo contract v0.3, xem [hiện trạng](current-status.md). FE vẫn mock/local, chưa có HTTP adapter. Các lựa chọn từng ghi còn mở ở bản đồng bộ trước đã được chốt tại contract; thực hiện mapping/refactor FE trong nhiệm vụ tích hợp riêng, không generate lại BE.

Đã đối chiếu interface trong `FE/src/lib/api/contracts`, entity chia sẻ tại `FE/src/types` và `FE/src/lib/api/repositories.ts`. FE chọn mock anime, local demo auth và local comments; chưa có HTTP adapter hoạt động. Thư viện/tiến độ dùng `FE/src/lib/storage/demo-account.ts`, phiên dùng chung ở stores/session.tsx. Các đường dẫn này được cập nhật theo cấu trúc Bulletproof React ngày 2026-10-29.

Đồng bộ 2026-11-01 theo [fe-backend-handoff.md](../fe-backend-handoff.md), nguồn mapping hàm/query/view model FE. [API contract](../api-contract.md) là nguồn HTTP được duyệt; các endpoint mới trong handoff còn đề xuất. Đã có sáu API đọc Anime/Mùa/tập, chưa có HTTP adapter FE; cập nhật tài liệu không xác nhận tích hợp đã chạy.

## Khoảng cách cần xử lý

| Luồng FE | Hiện tại | Khi nối BE |
| --- | --- | --- |
| Trang chủ | getHome mock trả featured/updated/recommended/topViewed | Đã có common/home; mapper theo HomeDto/tiêu chí trong contract |
| Khám phá | list(query, mockState) | Map query vào common/anime; mockState chỉ cho demo/test |
| Chi tiết | getBySlug trả seasons/episodes/related cùng AnimeDetail | Ghép API mùa/tập hoặc duyệt DTO tổng hợp; related chưa có hợp đồng riêng |
| Thư viện | Tab, tìm, phân trang local; getByIds lấy danh mục | Dùng summary library/progress; chưa có bulk getByIds; chốt tìm kiếm/sort |
| Auth | Profile demo, repository không nhận mật khẩu | Thiết kế luồng xác thực thật; không dùng nguyên contract demo để gửi mật khẩu |
| Comments | Local nhận CommentActor từ FE; list chưa phân trang | Server lấy user từ phiên; bỏ actor client, cập nhật hook/UI cho phân trang |
| Player/progress | Watch UI/native video đã có, nguồn mock còn trống, tiến độ local | Nối playback/đồng bộ theo contract; không coi dữ liệu demo là lịch sử thật |
| Quản trị nội dung | Mock CRUD độc lập catalog public; Episode/Playback dùng getCatalog tải toàn workspace | List/meta/options/detail và mutation server, đồng bộ publication/public sau ghi |
| Users/moderation | Users chỉ đọc, comments có hide/restore; dữ liệu mock/local | Detail theo ID ngoài page, summary toàn collection, policy read/moderate và audit server |
| Dashboard/Top 10 | Metrics và viewCount fixture, ranking dùng chung Home | Aggregate DB/nguồn view đã định nghĩa; giữ cùng ranking, không bịa số vận hành |

DTO genres đã triển khai là object id/slug/name, còn Anime FE dùng string[]. FE có subtitle và episodeLabel phục vụ hiển thị. Mapper quy định cách chuyển/derive khi đủ dữ liệu, không bịa số tập hoặc ép BE trả tên trường trình bày. API bannerUrl nullable cần fallback; format BE tv/movie/ova/ona/special khác FE tv/movie, cần mở rộng type/UI hoặc quyết định mapping rõ. Format, hasPlayback, related và danh sách tập cần rà soát cùng [api.md](api.md).

## Hợp đồng HTTP và adapter

- Object HTTP `{data:T}` được unwrap thành T; list giữ `{data,meta}`. Metadata bổ sung/options/summary có thể do adapter ghép endpoint đã chốt, không bắt mọi API giống interface mock.
- Không serialize state/mock/fail/shouldFail/AdminPreviewSession/CommentActor hoặc AbortSignal vào query/body. Signal dùng hủy request; actor/permission từ phiên server. Request dùng ID thật, không ghép anime-01 của FE với anime_demo_* của BE hoặc suy animeId từ chuỗi episodeId.
- Xử lý 400/401/403/404/409 khi đã đặc tả, 429/503; map error.fields về key form, requestId cho tra cứu. DELETE 204 không parse JSON. GET lỗi phải hiện lỗi/retry, không fallback mock tự động; không retry mutation mù.
- Cache/refetch đúng module và tài khoản; logout/đổi user hủy request và xóa cache cá nhân. Mutation admin cần invalidation cả dữ liệu public/lookup/summary liên quan, không chỉ page admin.
- CORS API theo origin FE thực tế; cookie credentials/CSRF hoặc bearer storage chốt cùng Auth. CORS media, MIME và range requests là cấu hình riêng, API CORS không làm video phát được.

## Query, phân trang và dữ liệu tổng hợp

Giá trị chi tiết lấy mục 7 handoff, không sao chép thành một hợp đồng HTTP khác. Explore/admin anime dùng q/genre slug/year/status/format/sort/page/pageSize (12/24); year FE string đổi number, filter rỗng omit. Admin genres size 5/10/20, users/episodes 10/20/50, sources/comments 5/10/20; library 8, public comments 5. Chốt support của endpoint mới trong contract, không tự áp các query admin cho public API đã có.

Panel commentId/userId/sourceId dùng detail theo ID, không là list filter tự động. returnTo/mock/comments demo không gửi API. enabled yes/no map boolean khi contract cho phép. Đổi filter/sort/pageSize về page 1; giữ query khi đổi trang. API catalog chưa tìm bỏ dấu, sort collation C và trang vượt cuối trả rỗng; mock tìm bỏ dấu/clamp page, adapter/UI phải xử lý có chủ đích.

Không phân trang lại một page API. Comments đổi commentPage → page và dùng meta server. Các getCatalog quản trị cần refactor hook sang list + lookup + detail, không tải cả DB; direct edit/panel phải tìm được ID ngoài page hiện tại. Playlist phải tải đủ trang cần thiết hoặc thiết kế lazy/paging, không coi 20 tập đầu là toàn bộ.

Options/years/summary đại diện collection theo scope đã chốt, không suy từ page đang hiển thị. Admin genre options gồm chưa dùng, khác public chỉ genres có anime published. Anime form đang gửi tên genres; map bằng options chứa ID, không coi slug/name là khóa DB. Publication chưa có trong form anime; form tập chưa có publishedAt, cần chốt workflow trước module ghi.

## Phiên, thư viện và tiến độ

AuthRepository login/register hiện không nhận password, không thể nối thật chỉ bằng thay URL. Thêm input password, GET me bất đồng bộ/bootstrap loading và dùng id/displayName/email/roles/permissions từ server. Chuyển type DemoUser/member/adminPreview về mô hình phiên thật theo user/manage/admin; không dùng lựa chọn hồ sơ hoặc localStorage để xác thực/nâng quyền. Profile hiện chỉ đọc; đổi mật khẩu cần currentPassword/newPassword và thu hồi phiên theo chính sách chốt.

Library/progress cần repository riêng thay lưu trực tiếp trong SessionProvider. Favorites một item mỗi anime; history một item mỗi episode; watching lấy progress gần nhất mỗi anime rồi mới xét completed. Counts trước q trên toàn collection, không đếm page; inProgressEpisodeCount trên Profile khác số anime watching. Summary/preview dùng dữ liệu server, ưu tiên trả anime/tập summary để tránh N request getByIds. PUT favorite giữ status, tắt isFavorite không xóa history; không tự nhập demo vào tài khoản thật.

Player chỉ ghi progress khi đã phát/duration hợp lệ, khoảng mỗi 10 giây và force pause/ended/hidden/unmount; ended gửi completed=true. Khi duration null phải thể hiện chưa biết, không ép 0 như thời lượng đã xác định. Server xử lý request cũ/đa thiết bị/xem lại theo quyết định của feature; không lấy timestamp client làm chuẩn.

## Player, Home và quản trị

WatchDetail ghép metadata anime, mùa/tập và Playback; DTO tập detail đã có animeId/animeSlug/seasonId. Player native nhận MIME MP4/WebM, admin cấu hình mp4/hls và vtt/srt: chốt HLS/chuyển phụ đề hoặc giới hạn format trước nối. Thêm expiresAt/reload nguồn vào model; phân biệt tập không có 404, chưa có nguồn 200 sources=[], provider lỗi 503. Published/hasPlayback/nguồn enabled không đồng nghĩa phát thành công.

HomeCatalog cần bốn nhóm featured/updated/recommended/topViewed; related và options có thể aggregate hoặc endpoint riêng. Không dùng sort releaseYear để giả lập cập nhật tập mới nhất. Ranking cùng nguồn Home/Dashboard, không tự POST view-event khi chưa chốt định nghĩa view. Dashboard dùng recentAnime theo ngày tập công bố, không ngày sửa metadata. Users chỉ đọc; moderation hide/restore có reason và audit, deleted không body/không restore. Không thêm upload/avatar, quên mật khẩu, CRUD user/cấp role vì muốn đủ bộ endpoint.

Cập nhật feature Anime 2026-10-30: API list/detail/genres đã có, FE vẫn dùng mock. API tìm không phân biệt hoa thường nhưng chưa bỏ dấu; page vượt cuối giữ nguyên page và data rỗng, khác mock tự clamp page. DTO detail chưa có seasons/episodes/related; không tự coi màn hình chi tiết FE đã tích hợp chỉ vì có endpoint theo slug. Xem quy tắc chính xác trong API contract trước khi viết mapper.

## Trình tự đề xuất

Cập nhật Mùa và tập 2026-10-30: đã có API danh sách mùa, danh sách tập phân trang và chi tiết tập với animeId/animeSlug. Adapter FE cần tải hết các trang cần thiết khi ghép AnimeDetail; không tự coi một page là toàn bộ tập. durationSeconds nullable khi chưa biết trong BE, khác number bắt buộc ở type FE hiện tại; cần mapper/hiển thị thời lượng chưa biết khi tích hợp. hasPlayback hiện false, chưa có nguồn phát. Chưa sửa source FE trong lượt generate BE.

1. Chốt phần thiếu trong contract; giữ mock/local adapter để phát triển độc lập.
2. Khi triển khai, tạo HTTP client/DTO/mapper ở `FE/src/lib/api`; gom lỗi, 204, timeout và AbortSignal. Component không gọi fetch trực tiếp.
3. Nối common trước; sau đó nối phiên thật và cache theo tài khoản.
4. Tách interface library/progress nếu chưa có; nối me theo user đã xác thực.
5. Nối comments, playback và tiến độ; kiểm tra nguồn trống/hết hạn/lỗi provider.

Không tự nhập dữ liệu demo vào tài khoản thật. Nếu cần, thiết kế xác nhận và quy tắc hợp nhất riêng. Kiểm tra bằng server/database cục bộ và fake provider; không gọi dịch vụ thật.

## Tích hợp ASP.NET Core

FE vẫn dùng HTTP/JSON, không phụ thuộc ngôn ngữ C#. Controller trả camelCase, enum string và envelope đúng contract; mapper FE không nhận entity EF hoặc navigation properties. Cấu hình CORS theo origin FE thực tế. Cookie credentials/CSRF hay bearer token chỉ được nối sau khi cơ chế phiên đã chốt; không suy ra từ local demo auth.

Request FE hủy qua AbortSignal tương ứng request cancellation phía API; service/EF nhận CancellationToken. Giữ xử lý 401/403/404/503 và DELETE 204 nhất quán. Nguồn video/subtitle do provider trả cần cấu hình truy cập riêng; CORS API không tự giải quyết CORS media.
