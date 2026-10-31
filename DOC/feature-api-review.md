# Review toàn bộ feature và API cần thiết cho Anime Web

**Để code BE theo nhu cầu FE, đọc [fe-backend-handoff.md](fe-backend-handoff.md): mapping từng lời gọi repository/storage, input/output, query và HTTP thay thế.** Tài liệu này giữ phần review tổng quan.

Ngày rà soát: **2026-11-01**. Baseline: nhánh **Fe-Dev**, commit **6a2d210** và source đang có trong workspace. Review tĩnh router, feature, repository, storage, BE controller/DTO và tài liệu; không chạy lại ứng dụng, API hoặc kiểm thử trong lượt review này.

## 1. Kết luận

**FE đã có giao diện công khai, cá nhân và quản trị nhưng chưa tích hợp backend. BE mới triển khai ba API nghiệp vụ đọc danh mục anime.** Chạy bản demo FE được; vận hành trang với dữ liệu thật cần hoàn thiện API, media, xác thực và HTTP adapter.

- [repositories.ts](../FE/src/lib/api/repositories.ts) vẫn chọn mock/local cho mọi nhóm chức năng. Yêu thích/tiến độ ở [demo-account.ts](../FE/src/lib/storage/demo-account.ts), comments cũng dùng kho local.
- BE có list anime, detail theo slug và genres; có PostgreSQL/EF Core, migration, health/readiness và OpenAPI Development. Chưa có authentication/authorization, mùa/tập, dữ liệu cá nhân, playback, analytics hoặc API quản trị.
- Player đã có giao diện/native video nhưng [mock playback](../FE/src/lib/api/mock/mock-playback-repository.ts) trả sources rỗng. Nguồn/phụ đề admin chỉ là cấu hình mẫu, chưa nối vào player.
- Login/register không xác thực mật khẩu; đổi mật khẩu chỉ preview. AdminPreview chỉ bật chủ động trong dev, tách member, mất khi reload; không phải RBAC thật.
- Top 10 Dashboard/Trang chủ dùng chung component và lượt xem fixture; không phải analytics thực tế. CRUD admin mock không cập nhật danh mục công khai.

Tài liệu này là inventory và kế hoạch tích hợp, **không thay [api-contract.md](api-contract.md)** hoặc tự chốt các endpoint/chính sách đang đề xuất.

| Nhãn API trong review | Ý nghĩa |
| --- | --- |
| Đã có | Tìm thấy triển khai trong BE; FE vẫn chưa nối |
| Nháp | Có mô tả trong API contract, chưa triển khai BE |
| Đề xuất | Cần để phục vụ UI; URL/payload cần được chốt vào contract trước khi code |

## 2. Review toàn bộ feature hiện có

Nguồn route: [app/router.tsx](../FE/src/app/router.tsx), [config/paths.ts](../FE/src/config/paths.ts). Mỗi hàng dưới mô tả UI/source hiện có, không đồng nghĩa có backend thật.

### Công khai và cá nhân

| Màn/route | Đã có ở FE | Nguồn dữ liệu hiện tại | Cần bổ sung |
| --- | --- | --- | --- |
| Trang chủ `/` | Banner, mới cập nhật, đề xuất/lọc thể loại, tiếp tục xem, Top 10 | getHome mock, ranking fixture, progress local | Home aggregate/tiêu chí chọn, ranking thật, summary tiến độ |
| Khám phá `/anime` | Search debounce/IME, lọc genre/year/status/format, sort, Pagination/query URL | AnimeRepository.list mock | HTTP adapter cho list đã có; options từ toàn danh mục |
| Chi tiết `/anime/:slug` | Metadata, mùa/tập công bố, yêu thích, related, bình luận | getBySlug mock tổng hợp + comments/account local | Ghép metadata/mùa/tập/related, comments phân trang, trạng thái yêu thích |
| Xem phim `/watch/:episodeId` | Playlist, tập trước/sau theo thứ tự, native video/subtitle, resume/progress | PlaybackRepository.getEpisode, sources=[] | Episode/playback API, media sử dụng được, đồng bộ tiến độ |
| Đăng nhập `/login` | Form/validation/returnTo, chọn hồ sơ demo, mở adminPreview ở dev | LocalDemoAuthRepository | Mật khẩu/phiên thật, me/quyền server, logout/hết hạn phiên |
| Đăng ký `/register` | Form/validation và hồ sơ demo | Registry local; repository không nhận password | Tài khoản DB, unique email, hash ở BE, mặc định role user |
| Thư viện `/library` | Tab/yêu thích/lịch sử/hoàn thành, tìm/sort/phân trang; bỏ yêu thích giữ history | Account local + getByIds mock | Library/progress APIs kèm summary và tìm/sort/phân trang server |
| Hồ sơ `/profile` | Avatar chữ cái, tên/email chỉ đọc, thống kê, tiếp tục xem, link thư viện/đổi mật khẩu | Profile/account local | GET me và summary; chưa cần API sửa hồ sơ vì UI chỉ đọc |
| Đổi mật khẩu `/profile/change-password` | Ba field, validation, hiện/ẩn, pending/cancel/error, preview-only | previewPasswordChange | Xác minh mật khẩu hiện tại, thay credential thật và chính sách thu hồi phiên |
| Header/avatar/navigation | Search dẫn Explore, menu phiên, login/logout, link profile/admin | SessionProvider/React Router | Đồng bộ phiên/quyền server; không cần API navigation riêng |
| Route fallback công khai/admin | Thông báo 404 và đường quay lại | React Router | Xử lý 404 tài nguyên từ API; không cần endpoint riêng |

### Quản trị

| Màn/route | Đã có ở FE | Backend cần thiết | Ràng buộc cần giữ |
| --- | --- | --- | --- |
| Dashboard `/admin` | Metric, phân bố trạng thái, sức khoẻ nội dung, phim gần đây, Top 10 chung Home | Overview tổng hợp + ranking public chung | Không CRUD riêng hoặc số vận hành bịa |
| Anime `/admin/anime` | Search/filter/sort/paging, thêm/sửa/xoá | Anime admin CRUD/list/detail/options | Slug unique, ID khác slug, publication và quan hệ server kiểm tra |
| Form `/admin/anime/new`, `/admin/anime/:animeId/edit` | Metadata/genre/ảnh, validation, cancel/returnTo | Detail theo ID, POST/PATCH | URL ảnh chưa phải upload; không tạo link public cho nội dung chưa công khai |
| Thể loại `/admin/genres` | CRUD inline, tìm/usage/sort/paging, trùng slug/tên | Genre CRUD/options/usage count | Chặn xoá khi còn phim sử dụng |
| Mùa/tập `/admin/episodes` | Chọn phim/mùa/status, CRUD mùa inline, list tập | Seasons/episodes CRUD + lookup | Cha/con hợp lệ; không tự cascade mùa còn tập hoặc tập bị ràng buộc |
| Form `/admin/episodes/new`, `/admin/episodes/:episodeId/edit` | Số tập/thứ tự/thời lượng/status, validation | Episode detail/create/update | Published không có nghĩa có nguồn; không cộng số vào ID để chuyển tập |
| Nguồn/phụ đề `/admin/playback` | Chọn phim→mùa→tập, CRUD nguồn/track, bật/tắt, mặc định | Source/subtitle APIs | Nguồn còn track/tập còn nguồn bị chặn xoá; một track mặc định mỗi nguồn |
| Người dùng `/admin/users` | List/search/status/sort/paging, summary và panel hồ sơ | User list/detail chỉ đọc | Cả manage/admin chưa có khoá/xoá/cấp role/reset mật khẩu người khác |
| Bình luận `/admin/comments` | Filter/sort/paging, panel, ẩn/hiện lại có lý do | Comment list/detail/moderation | Chỉ visible↔hidden; không sửa body/tác giả, xoá cứng hoặc phục hồi deleted |

Sáu list admin có Pagination trên/dưới, nút trang ở giữa, pageSize chỉ trên bên phải. Dùng chung meta/query. Dashboard và Top 10 không có phân trang riêng; các danh sách con chưa phân trang không cần thêm API chỉ để có Pagination.

Các common Button/Input/Combobox/Selectbox/Icon/Pagination/Avatar/Artwork/ContentState/TopViewedAnime và layout là UI, không cần API CRUD riêng. Xem [common rules](docs-FE/rules/common/readme.md).

## 3. API đã triển khai trong BE

| Method/path đầy đủ | Khả năng thực tế |
| --- | --- |
| GET `/api/v1/health` | Liveness, không kiểm tra DB |
| GET `/api/v1/health/ready` | Kiểm tra kết nối PostgreSQL, chưa xác nhận schema nghiệp vụ |
| GET `/openapi/v1.json` | Chỉ Development; không có Swagger UI |
| GET `/api/v1/common/anime` | Published; q/genre/status/year/format/sort/page/pageSize |
| GET `/api/v1/common/anime/:slug` | Metadata; draft/không tồn tại cùng 404, chưa có seasons/episodes/related |
| GET `/api/v1/common/genres` | Chỉ genres có anime published |

Bằng chứng: [AnimeController](../BE/src/AnimeWeb.Api/Features/Anime/AnimeController.cs), [GenresController](../BE/src/AnimeWeb.Api/Features/Anime/GenresController.cs), [HealthController](../BE/src/AnimeWeb.Api/Features/Health/HealthController.cs), [AnimeService](../BE/src/AnimeWeb.Api/Features/Anime/AnimeService.cs), [DTO](../BE/src/AnimeWeb.Api/Features/Anime/Dtos/AnimeDtos.cs), [Program](../BE/src/AnimeWeb.Api/Program.cs).

Query sai 400; list trả `{data,meta}`; object trả `{data}`. Page vượt cuối giữ page yêu cầu và trả rỗng. `sort=newest` là năm phát hành mới nhất, **không phải** tập vừa cập nhật hoặc nhiều lượt xem. FE chưa tích hợp các endpoint này.

## 4. API công khai cần cho trang

Các path từ đây có prefix **`/api/v1`**. Tham số ID và slug phải phân biệt; bảng đề xuất không có nghĩa endpoint đã tồn tại.

| Method/path | Trạng thái | Phục vụ/dữ liệu cần trả |
| --- | --- | --- |
| GET `/common/anime` | Đã có | Explore; summary và meta, adapter query/DTO |
| GET `/common/anime/:slug` | Đã có | Metadata detail, genre objects, banner nullable |
| GET `/common/genres` | Đã có | Filter public; không thay danh sách admin đầy đủ |
| GET `/common/home` | Đề xuất | featured/updated/recommended/topViewed; chốt tiêu chí biên tập và mới cập nhật |
| GET `/common/rankings/anime?metric=views&limit=10` | Đề xuất | Anime summary + viewCount dùng chung Home/Dashboard, sort giảm dần rồi ID, chỉ public |
| GET `/common/anime/:animeId/seasons` | Nháp | Season id/animeId/number/title/sortOrder; kiểm tra cha công khai |
| GET `/common/seasons/:seasonId/episodes` | Nháp | Tập published phân trang theo sortOrder; không bỏ sót trang khi dựng playlist |
| GET `/common/episodes/:episodeId` | Nháp | Chi tiết tập, thời lượng, tham chiếu anime/mùa |
| GET `/common/episodes/:episodeId/playback` | Nháp | Sources/subtitles/expiresAt, previousEpisodeId/nextEpisodeId |
| GET `/common/anime/:animeId/related` | Đề xuất | Phim liên quan; có thể gộp field trong detail thay endpoint riêng |
| GET `/common/catalog/options` | Đề xuất nếu cần | Years/format/filter options toàn danh mục; có thể gộp vào metadata list/Home |
| GET `/common/anime/:animeId/comments` | Nháp | Chỉ visible, paging và author summary tối thiểu, không email |

Không cần tạo cả endpoint riêng và field tổng hợp trùng nhau cho Home/related/options. Home có thể tổng hợp ranking tại BE; Dashboard đọc cùng nguồn ranking, không có thuật toán/nguồn đếm riêng.

### Playback và ghi nhận lượt xem

Episode không tồn tại: 404. Có tập chưa có nguồn: 200 sources rỗng. Provider lỗi: 503. URL hết hạn cần lấy lại playback; không coi enabled=true trong admin là video chắc chắn phát được.

Player FE hiện khai báo native MP4/WebM; admin cấu hình MP4/HLS và VTT/SRT. Cần chốt hỗ trợ HLS đa trình duyệt và chuyển SRT sang VTT trước khi nối. Chưa có HLS engine/transcoding/upload pipeline. API JSON không tạo video: cần media hợp lệ, MIME, range requests, HTTPS và CORS media riêng.

Ranking thật cần định nghĩa một lượt xem: bắt đầu phát hay đạt thời lượng, theo tập/phim, guest/session, chống trùng, thời điểm tổng hợp. Có thể **đề xuất** POST `/common/episodes/:episodeId/view-events` hoặc lấy số liệu hạ tầng media. Chưa chốt cách nào; không tin tổng viewCount do client gửi, không mặc định GET playback/nhấn link là một lượt. Không thêm kỳ ngày/tuần/tháng khi chưa định nghĩa.

## 5. Auth và dữ liệu cá nhân

| Method/path | Trạng thái | Payload/kết quả và lưu ý |
| --- | --- | --- |
| POST `/auth/register` | Đề xuất | displayName/email/password; unique email, BE hash, role mặc định user; không nhận quyền tự khai |
| POST `/auth/login` | Đề xuất | email/password; tạo phiên thật theo cơ chế được chốt |
| POST `/auth/logout` | Đề xuất | Thu hồi phiên server, clear cache FE; không chỉ xoá localStorage |
| GET `/me` | Nháp | id/displayName/roles/permissions; bổ sung email cho Profile theo DTO được duyệt |
| POST `/me/change-password` | Đề xuất | currentPassword/newPassword; confirm ở FE; server xác minh và đổi thật, chốt thu hồi phiên |
| GET `/me/library` | Nháp | status/isFavorite/page/pageSize + summary anime; bổ sung q/sort phù hợp UI |
| PUT `/me/library/:animeId` | Nháp | Đủ status/isFavorite; unique user/anime, upsert |
| DELETE `/me/library/:animeId` | Nháp | 204, bỏ mục thư viện nhưng giữ progress/history; phân biệt với chỉ tắt isFavorite |
| GET `/me/progress` | Nháp | animeId/completed/page/pageSize + summary tập/anime; q/sort cần chốt |
| PUT `/me/progress/:episodeId` | Nháp | positionSeconds/completed; updatedAt server cấp; tránh request cũ ghi đè |
| GET `/me/library/summary` | Đề xuất nếu cần | Tổng cho Profile; có thể gộp GET me/meta, không lấy số item một trang làm tổng |
| POST `/me/anime/:animeId/comments` | Nháp | body plain text; author từ phiên, dự kiến 201 |
| PATCH `/me/comments/:commentId` | Nháp | body; kiểm tra own và trạng thái cho phép |
| DELETE `/me/comments/:commentId` | Nháp | Xoá mềm own, 204; không phục hồi deleted bằng update |

Cookie/session hay bearer token chưa chốt; refresh endpoint chỉ cần nếu cơ chế chọn yêu cầu. Với cookie thiết kế credentials/CORS/CSRF tương ứng. AuthRepository demo không nhận password, cần contract/adapter auth thật hoặc refactor rõ trước khi nối; không dùng registry demo để xác thực.

Library/progress cần abstraction repository thay lưu local trực tiếp trong [SessionProvider](../FE/src/stores/session.tsx). Chốt hoàn thành/xem lại/đa thiết bị/thời lượng chưa biết; không tự nhập dữ liệu demo sang tài khoản thật. Comments cần chốt duyệt trước hay hiện ngay, giới hạn 1–2000 sau trim trong contract vẫn là đề xuất. Server không nhận actor/userId/quyền từ FE để quyết định ownership.

Không thêm API sửa hồ sơ/upload avatar/quên mật khẩu/xoá lịch sử chỉ để đủ bộ: UI hiện chưa có các chức năng đó. Nếu sản phẩm cần thì bổ sung phạm vi riêng.

## 6. API quản trị đề xuất

**Toàn bộ endpoint trong mục này chưa có BE và chưa chốt contract.** Định nghĩa DTO/query/status/publication/error trước khi code. Create có thể 201 + data, update 200 + data, delete 204; cần chốt concurrency và lỗi ràng buộc theo module.

| Nhóm | Method/path đề xuất | Input/output cần cho UI |
| --- | --- | --- |
| Dashboard | GET `/admin/dashboard` | Totals/statuses/content health/recentAnime; ranking lấy nguồn chung |
| Anime | GET `/admin/anime`, GET `/admin/anime/:animeId` | q/genre/year/status/format/sort/page/pageSize, meta/options, episode count/publication |
| Anime | POST `/admin/anime`, PATCH/DELETE `/admin/anime/:animeId` | Metadata title/slug/synopsis/year/status/format/genres/ảnh; unique slug, quan hệ hợp lệ |
| Genres | GET `/admin/genres`, GET `/admin/genres/options` | q/usage/sort/page/pageSize; ID/slug/name/usage count; options đủ để gán phim |
| Genres | POST `/admin/genres`, PATCH/DELETE `/admin/genres/:genreId` | name/slug, unique, chặn xoá đang dùng |
| Lookup phim | GET `/admin/anime/options` | ID/title cần chọn cha, tìm kiếm/giới hạn phù hợp |
| Seasons | GET `/admin/seasons?animeId=...`, POST `/admin/seasons`, PATCH/DELETE `/admin/seasons/:seasonId` | animeId/number/title/sortOrder, quan hệ và chặn xoá mùa còn tập |
| Episodes | GET `/admin/episodes`, GET `/admin/episodes/:episodeId` | q/animeId/seasonId/status/sort/page/pageSize, meta |
| Episodes | POST `/admin/episodes`, PATCH/DELETE `/admin/episodes/:episodeId` | animeId/seasonId/number/title/sortOrder/durationSeconds/status |
| Sources | GET/POST `/admin/playback-sources`, PATCH/DELETE `/admin/playback-sources/:sourceId` | episodeId/providerKey/label/language/type/url/enabled; list q/enabled/sort/page/pageSize |
| Subtitles | GET `/admin/playback-sources/:sourceId/subtitles`, POST `/admin/subtitles`, PATCH/DELETE `/admin/subtitles/:subtitleId` | playbackSourceId/label/language/format/url/isDefault; chuyển mặc định trong transaction |
| Users | GET `/admin/users`, GET `/admin/users/:userId` | q/status/sort/page/pageSize, summary và hồ sơ tối thiểu; chỉ đọc |
| Comments | GET `/admin/comments`, GET `/admin/comments/:commentId` | q/animeId/status/sort/page/pageSize, summary/author/thời gian/moderation; bỏ body deleted |
| Moderation | POST `/admin/comments/:commentId/moderations` | action hide/restore + reason; actor/time server cấp, audit phù hợp |

Các getCatalog mock Episode/Playback/Comments tải cả workspace rồi lọc tại FE. Khi dùng dữ liệu thật cần list phân trang + lookup/detail, sửa hook tương ứng; không tải cả DB xuống browser để giữ nguyên interface mock. Không lộ khoá provider bí mật qua DTO nguồn phát.

### Role và permission

Nguồn chính: [roles-permissions.md](docs-FE/rules/roles-permissions.md).

| Role/ngữ cảnh | Public | Cá nhân own | Đọc admin | Ghi nội dung/kiểm duyệt |
| --- | --- | --- | --- | --- |
| Guest (không phải role DB) | Có | Không | Không | Không |
| user | Có | Có | Không | Không |
| manage | Có | Có | Theo permission | Không |
| admin | Có | Có | Theo permission | Theo permission và ràng buộc |

Permission hiện có: admin:dashboard:read, admin:anime:read/write, admin:genre:read/write, admin:episode:read/write, admin:playback:read/write, admin:comment:read/moderate, admin:user:read. **Users vẫn chỉ đọc cho cả manage/admin**; không tự thêm cấp role/khoá/xoá/reset mật khẩu người khác. Admin không bỏ ownership hoặc khôi phục comment deleted.

FE runtime vẫn member/adminPreview; AdminUser.roles và ví dụ GET me còn member. Khi triển khai phải đồng bộ DB/DTO/session/guard về user/manage/admin, không chỉ đổi nhãn UI. BE Program chưa có authentication/authorization pipeline bảo vệ các API cá nhân/quản trị.

## 7. Phát hiện và khoảng cách tích hợp

| Ưu tiên | Điểm cần xử lý | Hướng thực hiện |
| --- | --- | --- |
| P0 | Chưa có HTTP adapter cho bất kỳ module FE nào | HTTP client/DTO mapper, chọn adapter tập trung; không fetch từ component |
| P0 | Auth/quyền/mật khẩu chỉ mô phỏng | Chốt cơ chế phiên, triển khai server auth/RBAC; không tin role/actor/localStorage client |
| P0 | Chưa có nguồn phát dùng được | Episode/playback + media thật/local hợp lệ; nguồn rỗng/hết hạn/provider lỗi tách riêng |
| P0 | Admin writes/local data không bền vững và không phản ánh public | DB/mutation APIs + publication + invalidation/refetch; không làm lộ draft |
| P1 | ID FE anime-01 khác seed BE anime_demo_... | Dùng ID server; không ghép seed/progress/comment khác nguồn |
| P1 | BE detail thiếu seasons/episodes/related, FE cần aggregate | Ghép/caching requests hoặc duyệt aggregate; playlist phải lấy đủ trang |
| P1 | Genres object vs string[], format BE thêm ova/ona/special, banner nullable | Mapper và mở rộng UI/validation; fallback ảnh; derive subtitle/episodeLabel từ dữ liệu đủ |
| P1 | FE bỏ dấu/sort vi, BE ILike chưa bỏ dấu/collation C | Chốt trải nghiệm, đồng bộ test và nhãn; không cam kết tìm bỏ dấu đã có |
| P1 | Mock clamp page, BE vượt cuối trả rỗng | Chọn hành vi adapter/UI theo meta, tránh vòng refetch và sai Back/Forward |
| P1 | Options từ fixture/một page không đại diện toàn DB | Metadata/options toàn danh mục, tách admin/public genres |
| P1 | Comments FE trả mảng, contract có paging; library chủ yếu favorites/progress | Refactor repository/hook; map tab/status/isFavorite, summary đầy đủ |
| P1 | Native MP4/WebM khác cấu hình HLS/SRT admin | Chốt định dạng/hạ tầng phát, chuyển subtitle, mapper MIME/expiresAt |
| P1 | Cập nhật đồng thời/ràng buộc chỉ ở mock | DB unique/FK/check + transactions, chốt version/concurrency và 409 khi phù hợp |
| P1 | Ranking chỉ số liệu fixture | Định nghĩa view/event/aggregate, dùng cùng nguồn hai màn, giữ nhãn mẫu đến khi nối thật |
| P2 | Build gần nhất có main bundle trên 500 kB | Đo lại sau tích hợp, cân nhắc lazy/chunk; không coi warning là lỗi tính năng |
| P2 | Một số docs BE còn đường dẫn repo/branch cũ; integration chưa ghi đủ admin/topViewed | Đối chiếu workspace và cập nhật cùng module tích hợp |

P0 là điều kiện để các luồng tương ứng hoạt động thật; P1 cần giải quyết khi nối module; P2 cải thiện và làm rõ tài liệu. Đây không phải kết quả pentest hoặc kiểm thử hiệu năng.

## 8. Quy ước và dữ liệu cần có

- Theo [contract](api-contract.md): camelCase, ID string, UTC ISO 8601; object `{data}`, list `{data,meta:{page,pageSize,total,totalPages}}`; lỗi `error.code/message/fields/requestId`; DELETE 204 không parse JSON.
- Không gửi mockState/fail/adminPreview/actor/quyền client vào API thật. PageSize/list meta lấy server; đổi filter/sort/pageSize về trang 1, giữ điều kiện khi đổi trang. Các mức pageSize admin hiện có không vượt 50.
- HTTP layer gom base URL, AbortSignal/timeout và xử lý 401/403/404/409/429/503. Huỷ/clear cache theo tài khoản khi logout/đổi user; không retry mutation mù gây tạo trùng.
- CORS API theo origin FE thực tế (4174 nếu chạy port đó; BE README mặc định 5173), media CORS riêng. Cookie credentials/CSRF hoặc bearer storage chỉ cấu hình sau khi chốt auth.
- Ngoài Anime/Genres/AnimeGenres đã có, cần mô hình seasons/episodes; user/credential/session/role-permission; library/progress; comments/moderation audit; sources/subtitles; view events/aggregates nếu tự thống kê. Tên bảng/schema cụ thể thiết kế theo module.
- Publication draft/published khác status airing/completed/upcoming. Public list/detail/related/ranking/episodes/playback đều phải kiểm tra trạng thái công khai của tài nguyên và cha.

## 9. Thứ tự triển khai và điều kiện hoàn tất

| Bước | Công việc | Kết quả cần đạt |
| --- | --- | --- |
| 1 | HTTP client, mapper và ba API danh mục đã có | Explore/detail metadata từ DB; query/DTO/meta/options/ảnh/404 đúng |
| 2 | Mùa/tập/episode/playback và media | Guest phát/chuyển tập; không có nguồn/hết hạn/lỗi provider xử lý rõ |
| 3 | Auth/RBAC/register/login/logout/me/change-password | Credential/phiên/quyền server, hết hạn/blocked/thu hồi phiên |
| 4 | Library/progress/comments | Bền vững, nhiều user/thiết bị tách dữ liệu, own server-side, summary/paging |
| 5 | Admin anime/genres→seasons/episodes→sources/subtitles→comments/users read→dashboard | Mutation DB theo quyền/ràng buộc, public đồng bộ theo publication |
| 6 | Home/related/ranking thật | Tiêu chí biên tập và thống kê rõ, cùng ranking Home/Dashboard |

Home có thể tổng hợp sớm từ catalog; ranking thật phụ thuộc định nghĩa lượt xem. Auth và mùa/tập có thể phát triển độc lập về kế hoạch; bảng không yêu cầu sinh tất cả module trong một nhiệm vụ.

### Checklist nghiệm thu

- [ ] Chọn HTTP adapter thật; mock chỉ dev/test, không che lỗi API bằng dữ liệu giả.
- [ ] Public guest/member chạy đúng, URL/filter/paging/history/reload và season/episode/404 đúng.
- [ ] Auth/đổi mật khẩu/logout thật; user không vào admin, manage chỉ đọc, admin ghi đúng permission.
- [ ] Favorite/history/progress bền vững, tách tài khoản; bỏ yêu thích không mất history; đồng bộ nhiều thiết bị theo chính sách.
- [ ] Comments visible/own/moderation/deleted đúng; plain text, actor/permission server quyết định.
- [ ] CRUD admin bền vững, concurrency/publication/quan hệ đúng; enabled không tự chứng minh phát được; users vẫn chỉ đọc.
- [ ] Ranking cùng nguồn, view semantics/chống trùng/thời điểm tổng hợp rõ; không dùng fixture làm số vận hành.
- [ ] API tests với PostgreSQL test và fake provider/media local; lỗi/quyền/huỷ request có kiểm chứng.
- [ ] FE responsive/keyboard/loading/empty/error/retry/build đạt; kết quả mới nối vào verification.

## 10. Chạy hiện trạng và nguồn đối chiếu

Từ SRC, khi cần cài: `pnpm install --frozen-lockfile`; chạy demo bằng `pnpm --filter anime-web-fe run dev`. FE demo không cần BE. Backend xem [BE/README.md](../BE/README.md); source hiện nằm tại Anime-Web/BE, cần đối chiếu hướng dẫn còn nhắc `New folder/AnimeWeb`. Không tự migration/seed chỉ để review; readiness không thay migration.

Nguồn đối chiếu: [router](../FE/src/app/router.tsx), [repository contracts](../FE/src/lib/api/contracts), [repositories](../FE/src/lib/api/repositories.ts), [types](../FE/src/types), [BE Features](../BE/src/AnimeWeb.Api/Features), [tích hợp BE](docs-BE/integration.md), [API contract](api-contract.md), [roles](docs-FE/rules/roles-permissions.md), [mục lục FE](docs-FE/readme.md). Review xác nhận trạng thái qua source; các API đánh dấu đề xuất/nháp chưa được kiểm chứng hoạt động.
