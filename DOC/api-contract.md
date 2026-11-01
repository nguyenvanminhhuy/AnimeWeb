# API contract v0.3

Tra cứu chi tiết từng feature, field và path/query/body/response đang có tại [feature-reference.md](docs-BE/feature-reference.md), được đối chiếu theo source. Tài liệu này tiếp tục là nguồn quyết định contract; không tạo hợp đồng HTTP thứ hai.

## Quyết định cho lượt triển khai toàn bộ BE (2026-11-01)

Người dùng yêu cầu triển khai các feature BE còn thiếu và **đã xác nhận dùng toàn bộ bộ mặc định bên dưới**. Phạm vi là BE và tài liệu, chưa nối FE hoặc cung cấp video thật:

- Auth: bearer token opaque ngẫu nhiên, lưu SHA-256 của token trong DB, thời hạn tuyệt đối 7 ngày, không refresh. PasswordHasher của ASP.NET Core; logout thu hồi phiên hiện tại, đổi mật khẩu thu hồi mọi phiên. Đăng ký user; quyền đọc lại từ DB mỗi request, blocked bị từ chối chức năng cá nhân/admin. Không tạo tài khoản admin mặc định.
- Nội dung: anime tạo mặc định draft, admin có thể ghi publicationStatus riêng; tập published lần đầu được server gán publishedAt UTC, giữ ngày khi ẩn/xuất bản lại. Chặn xóa bản ghi còn tham chiếu; tập published phải chuyển draft trước xóa. Movie giữ một mùa/một tập trong API quản trị.
- Cá nhân: comments hiện ngay, body plain text trim 1–2000; moderation reason 3–300, hide/restore có audit. Library/progress summary trước q, watching lấy progress mới nhất mỗi anime; progress ghi với version optimistic concurrency (bản mới version=0), sai version trả 409, cho xem lại bằng completed=false; duration null không áp giới hạn trên.
- Playback: metadata nguồn trực tiếp mp4/hls, subtitle vtt/srt; không tải/chuyển mã hoặc gọi provider thật. VTT có thể dùng native player; HLS/SRT đòi hỏi adapter FE thích hợp, API không hứa phát được trên mọi trình duyệt. URL absolute HTTP(S), HTTPS khi Production; local HTTP chỉ Development/test. Nguồn enabled và nội dung public mới trả public, expiresAt nullable; credentials provider không là DTO.
- Home: featured là anime public mới nhất theo releaseYear/id, updated theo ngày tập published gần nhất, recommended theo số thể loại chung nếu có genre hoặc releaseYear/id khi không có; related theo số genre chung rồi releaseYear/id. Dashboard aggregate DB; recent 6 theo ngày tập published gần nhất. Ranking dùng cùng dữ liệu cho Home/Dashboard, không fixture.
- View: bắt đầu phiên xem server; chỉ tính sau ít nhất 30 giây theo đồng hồ server và vị trí phát tăng ít nhất 30 giây; chống trùng mỗi anime/người dùng hoặc viewer cookie ngẫu nhiên trong mỗi khung 30 phút. Không coi GET playback là view; không nhận tổng viewCount client. Đây là số liệu vận hành cơ bản, không chứng minh chống gian lận tuyệt đối.
- Admin list/detail/options theo handoff; Users chỉ đọc, không cấp role/khóa/xóa/reset mật khẩu. Mutations dùng version và 409 khi ghi cũ; server kiểm tra permission, own, FK/unique và transaction. Không tự upload/avatar/forgot-password hoặc CRUD user.

Chi tiết endpoint mới (prefix `/api/v1`):

| Feature | Endpoint được triển khai |
| --- | --- |
| Auth | POST /auth/register, /auth/login, /auth/logout; GET /me; POST /me/change-password |
| Library | GET /me/library (status/isFavorite/q/sort/page/pageSize), /me/library/summary; PUT/DELETE /me/library/:animeId |
| Progress | GET /me/progress (animeId/completed/collection=history hoặc watching/q/sort/page/pageSize); PUT /me/progress/:episodeId |
| Comments | GET /common/anime/:animeId/comments; POST /me/anime/:animeId/comments; PATCH/DELETE /me/comments/:commentId |
| Playback | GET /common/episodes/:episodeId/playback; POST /common/episodes/:episodeId/view-sessions; POST /common/view-sessions/:id/confirm |
| Catalog aggregates | GET /common/home, /common/catalog/options, /common/anime/:animeId/related, /common/rankings/anime?metric=views&limit=10 |
| Admin anime | GET/POST /admin/anime, GET/PATCH/DELETE /admin/anime/:id; GET /admin/anime/options |
| Admin genres | GET/POST /admin/genres, GET/PATCH/DELETE /admin/genres/:id; GET /admin/genres/options |
| Admin episodes | GET/POST /admin/seasons, GET/PATCH/DELETE /admin/seasons/:id; GET/POST /admin/episodes, GET/PATCH/DELETE /admin/episodes/:id |
| Admin playback | GET/POST /admin/playback-sources, GET/PATCH/DELETE /admin/playback-sources/:id; GET /admin/playback-sources/:id/subtitles; POST /admin/subtitles, GET/PATCH/DELETE /admin/subtitles/:id |
| Admin other | GET /admin/users, /admin/users/:id, /admin/comments, /admin/comments/:id, /admin/dashboard; POST /admin/comments/:id/moderations |

Request mutations admin nhận đủ form, PATCH là cập nhật đủ các trường được phép trong DTO (không JSON Patch). DTO create nhận version=0; update/moderation/progress nhận version đã đọc (>=1 cho bản ghi có sẵn), DELETE dùng query version. Response admin/progress/comment/library có version; optimistic concurrency sai trả 409 CONFLICT. PUT library nhận đủ status/isFavorite/version, DELETE library cũng kiểm tra version. Các ràng buộc FK/unique/đang được dùng trả 409; validation 400 fields; tài nguyên ẩn/không thuộc owner trả 404. Object `{data}`, list `{data,meta}` với summary/options khi có; create 201, update 200, delete/logout/change-password 204.

Auth request theo handoff; response login/register `{data:{accessToken,tokenType:"Bearer",expiresAt,profile:{id,displayName,email,roles,permissions}}}`, me trả profile. Không trả hash/token của phiên khác. Me summary gồm favoriteAnimeCount/inProgressEpisodeCount/completedEpisodeCount/historyEpisodeCount và preview tối đa 6 dòng watching. Library row có status/isFavorite/updatedAt/version/anime/progress mới nhất; progress row có episodeId/animeId/episodeNumber/positionSeconds/durationSeconds/completed/updatedAt/version/anime. Counts toàn collection trước q, chỉ nội dung public còn truy cập được. Q tối đa 200, sort recent/title, pageSize mặc định 20 (FE có thể gửi 8); collection mặc định history.

Comment body plain text 1–2000 sau trim; response có author summary/status/version/time, public không email. Update own chỉ visible, delete own visible/hidden thành deleted và xóa body; moderation chỉ visible↔hidden, body `{action,reason,version}`. Admin list q/animeId/status/sort newest|oldest|updated/page/pageSize, summary total/visible/hidden/deleted toàn scope trước q/status. Không restore deleted.

Admin query theo mục 7 handoff (bỏ filter rỗng): anime dùng CatalogQuery cộng publicationStatus; genres q/usage/sort; episodes q/animeId/seasonId/status/sort; sources q/cha/enabled/sort; users q/status/sort. Options trả id/slug/name hoặc id/title, đủ scope với lookup anime có q/page/pageSize. Admin anime input có subtitle, alternativeTitles, genreIds, publicationStatus; các trường khác theo handoff. Season/Episode input theo handoff, thêm version và thumbnailUrl tùy chọn; publishedAt do server quản lý. Source/track input theo handoff thêm version; expiresAt source tùy chọn. Đổi track default là transaction khóa source, tối đa một default; cho phép chưa có default.

View session start nhận positionSeconds không âm, trả id/startedAt; confirm nhận positionSeconds, chỉ cùng viewer và trong 10 phút. Viewer là userId hoặc cookie HttpOnly SameSite=Lax ngẫu nhiên (Secure ở Production), DB chỉ giữ hash viewer. Chỉ nguồn enabled mới bắt đầu; xác nhận đủ 30 giây server và delta vị trí, idempotent. Unique anime/viewer/bucket30phút; ranking tổng số view events đã xác nhận, mọi phim public kể cả 0 view, sort viewCount giảm rồi id. Hạn chế request global 120/phút/IP, auth 10/phút/IP, trả 429; các giới hạn không là chống gian lận hoàn chỉnh.

**v0.3 — 2026-11-01:** các endpoint trong bảng phía trên đã có code BE. Nền/Anime/Mùa/tập v0.2 được giữ tương thích, hasPlayback nay tính từ nguồn enabled chưa hết hạn. Xem [hiện trạng](docs-BE/current-status.md) và [bằng chứng](docs-BE/verification.md). Các mục chi tiết đọc bên dưới vẫn áp dụng, bộ quyết định v0.3 thay các lựa chọn nháp cũ.

Đồng bộ tài liệu ngày 2026-11-01: giữ contract API đọc hiện có; chuẩn hóa role `user/manage/admin` và quy trình duyệt từng feature từ [handoff FE](fe-backend-handoff.md). Không triển khai code hoặc chạy lại kiểm thử trong lượt đồng bộ này.

## Quy trình đặc tả trước khi generate từng feature

1. Chọn đúng một feature/phạm vi; đối chiếu source BE để xác định endpoint đã có, cần mở rộng hoặc chưa có. Review FE không thay hiện trạng source BE.
2. Lấy flow/input/output/query liên quan từ [fe-backend-handoff.md](fe-backend-handoff.md); ghi ngay tại mục feature trong tài liệu này: method/path, DTO request/response và nullable, validation/default/sort/pagination, lỗi, permission/ownership/publication, quan hệ và tiêu chí nghiệm thu. Không sao chép tham số mock/session/actor thành payload server.
3. Ghi rõ từng quyết định: đã xác nhận (kèm nguồn), đề xuất hoặc còn mở. Chốt lựa chọn nghiệp vụ có ảnh hưởng trước khi generate phần code phụ thuộc; không coi đề xuất trong handoff là đã duyệt. Không hỏi lại quyết định đã được người dùng xác nhận; lựa chọn kỹ thuật thông thường xử lý trong stack đã chốt.
4. Chỉ sau khi contract của phạm vi đó đủ rõ mới chạy [module-generation.md](docs-BE/prompts/module-generation.md). Các feature khác giữ trạng thái nháp; không generate toàn bộ danh sách dưới đây. FE adapter/hook chỉ sửa khi nhiệm vụ có yêu cầu tích hợp.

| Feature | Hiện trạng v0.3 | Phần tích hợp/triển khai vận hành tiếp theo |
| --- | --- | --- |
| Anime, Mùa/tập public | Sáu endpoint đọc đã có; quy tắc chi tiết bên dưới | Mapping DTO FE, duration nullable và cách tải playlist đủ trang khi tích hợp; không generate lại module |
| Auth và me | Đã có bearer/session/hash, user/manage/admin, logout/change-password/blocked và permission runtime | Nối phiên FE/bootstrap admin explicit/HTTPS và vận hành |
| Playback | Đã có nguồn direct/subtitle/expiry và trước/sau; hasPlayback theo cấu hình enabled chưa hết hạn | Media thật, player HLS/SRT, MIME/range/CORS nơi phân phối |
| Library/progress | Đã có own, summary/query/page/version, watching theo latest progress | Refactor FE repository/hooks/cache và gửi version đúng |
| Comments | Đã có visible own, moderation/audit/deleted, paging và version | Refactor commentPage/meta/author DTO ở FE |
| Admin nội dung | Đã có CRUD và read/write policies, publication, publishedAt, lookup/detail và version | Form FE gửi genreIds/publication/version, invalidation public/admin |
| Home/related/ranking | Đã có aggregate theo tiêu chí và view session/confirm/bucket | FE nối endpoint, giữ viewer cookie cho guest và đo/giám sát thực tế |

Bảng này tách hiện trạng BE khỏi phần FE/media/vận hành chưa được thực hiện; không tự thêm upload/CDN hoặc tích hợp FE từ nhiệm vụ BE.

## Role và permission chuẩn

Nguồn ma trận: [roles-permissions.md](docs-FE/rules/roles-permissions.md); áp dụng server theo [auth-permissions.md](docs-BE/auth-permissions.md). Role là nhóm permission, không là điều kiện bỏ qua quyền hoặc ownership.

| Ngữ cảnh/role | Public | Cá nhân own | Đọc admin | Ghi nội dung/kiểm duyệt |
| --- | --- | --- | --- | --- |
| Guest (không phải role DB) | Có | Không | Không | Không |
| user | Có | Có, theo permission | Không | Không |
| manage | Có | Có, theo permission | Theo permission | Không |
| admin | Có | Có, theo permission | Theo permission | Theo permission và ràng buộc |

Tài khoản mới mặc định user; request đăng ký không nhận roles/permissions. Users chỉ đọc cho manage/admin; không cấp khóa/xóa/cấp role/reset mật khẩu người khác. Không wildcard admin bypass ownership hoặc phục hồi comment deleted. Blocked bị từ chối thao tác cá nhân/quản trị nhưng vẫn đọc public như khách. Auth/policy và các endpoint quản trị trong bảng v0.3 đã triển khai; thay đổi phạm vi cần cập nhật contract trước code.

## Endpoint nền BE

| Method | Path đầy đủ | Hành vi |
| --- | --- | --- |
| GET | /api/v1/health | Liveness, không kết nối database; 200 với `{"data":{"status":"ok"}}` |
| GET | /api/v1/health/ready | Kiểm tra kết nối PostgreSQL; 200 với `{"data":{"status":"ready"}}`, hoặc 503 theo envelope error khi không kết nối được |
| GET | /openapi/v1.json | Tài liệu máy đọc được, chỉ bật trong Development |

Health là endpoint vận hành công khai, không chứa thông tin cấu hình/phiên bản/credentials. Readiness chỉ chứng minh kết nối được database, chưa xác nhận migration/schema nghiệp vụ. Cấu hình bắt buộc sai hoặc thiếu làm host thất bại khi startup. Route không tồn tại, HTTP method sai, validation và exception dùng cùng envelope error; requestId do server cấp. Chưa có authentication scheme hoặc route cá nhân hoạt động trong bước nền.

## Quy ước chung

- Prefix: `/api/v1`; JSON dùng camelCase, ID là string.
- Thời gian ISO 8601 UTC; phân trang bắt đầu từ 1.
- Danh sách trả `data` và `meta`; đối tượng đơn trả `data`.
- Lỗi trả `error.code`, `error.message`, tùy chọn `error.fields` và `error.requestId`. Key trong fields dùng tên HTTP/JSON camelCase để FE map vào form/query, ví dụ `pageSize`, `year`, `slug`, `animeId`; không dùng tên property C# như `PageSize`. OpenAPI mô tả tên query đúng contract và response 400 theo envelope lỗi này.
- Giới hạn pageSize đề xuất 1–50, mặc định 20; dữ liệu sai trả 400.
- `/common` không yêu cầu đăng nhập, dùng chung cho khách và tài khoản đã đăng nhập; chỉ trả nội dung published/công khai.
- `/me` yêu cầu đăng nhập, permission tương ứng và kiểm tra quyền sở hữu; lấy userId từ phiên xác thực, không nhận userId do FE chỉ định.
- Tên prefix không tự tạo quyền truy cập. BE áp dụng middleware/guard cho từng endpoint; xem [rules/roles-permissions.md](docs-FE/rules/roles-permissions.md).
- Đã chọn bearer opaque theo mục quyết định v0.3; không dùng phiên demo FE.

## Danh mục và playback

| Method | Path | Nội dung |
| --- | --- | --- |
| GET | /common/anime | Tìm, lọc và phân trang anime; catalog:read |
| GET | /common/anime/:slug | Chi tiết; không có trả 404; catalog:read |
| GET | /common/genres | Danh sách thể loại; catalog:read |
| GET | /common/anime/:id/seasons | Danh sách mùa theo sortOrder; catalog:read |
| GET | /common/seasons/:id/episodes | Tập published, phân trang theo sortOrder; catalog:read |
| GET | /common/episodes/:id | Chi tiết tập và tham chiếu anime/mùa; catalog:read |
| GET | /common/episodes/:id/playback | Nguồn phát, phụ đề, tập trước/sau; playback:read |

Các path trong bảng là tương đối với `/api/v1`. Hai permission đọc công khai ở trên được cho phép cho khách; không yêu cầu tạo tài khoản để xem phim.

### Ví dụ tìm kiếm

```http
GET /api/v1/common/anime?q=hanh%20trinh&genre=adventure&status=airing&year=2026&format=tv&sort=newest&page=1&pageSize=20
```

`genre` dùng slug; `sort` dự kiến có `newest`, `title`. Chỉ thêm `rating` hoặc `popular` khi có nguồn điểm/lượt xem và cách tính rõ ràng. Mock phải áp dụng các tham số có cùng ý nghĩa với API sau này.

### Mặc định triển khai feature Anime (2026-10-30)

Người dùng đã xác nhận các mặc định: chỉ đọc published, tìm tên/tên khác không phân biệt hoa thường, mới nhất trước và trang vượt cuối trả rỗng. Chi tiết kỹ thuật dưới đây áp dụng cho feature Anime; các quy tắc tích hợp khác vẫn cần đối chiếu khi nối FE:

- API danh sách, chi tiết và genres chỉ trả nội dung liên quan anime có publicationStatus=published. Trạng thái phát hành status (upcoming/airing/completed) độc lập publicationStatus (draft/published). Publication không được trả qua DTO công khai.
- q được trim, tối đa 200 ký tự; tìm chuỗi con không phân biệt hoa/thường trong title hoặc alternativeTitles. Dấu %, _ và ~ được xử lý như ký tự thường, không phải wildcard. Chưa bỏ dấu tiếng Việt như normalizeSearch ở mock FE.
- Các filter kết hợp bằng AND; genre dùng slug tối đa 100 ký tự, slug hợp lệ nhưng không tồn tại trả danh sách rỗng. status nhận upcoming/airing/completed; format nhận tv/movie/ova/ona/special; year là số 1–9999.
- sort mặc định newest: releaseYear giảm dần rồi id tăng dần, khớp ý nghĩa “Năm phát hành mới nhất” trên FE. title: tên viết thường theo collation C của PostgreSQL rồi id tăng dần; không cam kết sắp xếp từ điển tiếng Việt.
- page mặc định 1, pageSize mặc định 20 (1–50). Trang vượt cuối giữ nguyên page đã yêu cầu và trả data rỗng; totalPages=0 khi không có kết quả. Khác mock FE hiện tự đưa page về trang cuối; xử lý qua adapter khi tích hợp, chưa sửa FE trong lượt này.
- Query sai định dạng/enum/giới hạn trả 400 VALIDATION_ERROR với fields. Slug chi tiết chỉ gồm chữ thường ASCII, số, dấu nối, tối đa 200 ký tự; slug sai định dạng trả 400, slug hợp lệ không tồn tại hoặc draft trả cùng 404 ANIME_NOT_FOUND.
- Genres chỉ gồm thể loại có ít nhất một anime published, sắp slug tăng dần. Genre trong DTO anime cũng sắp theo slug; chi tiết bổ sung synopsis, alternativeTitles và bannerUrl (có thể null), chưa bao gồm mùa/tập/related.
- Không có API ghi/quản trị trong feature này. Seed demo là thao tác explicit trên môi trường Development; migration không tự chèn dữ liệu demo.

```json
{
  "data": [
    {
      "id": "anime_demo_001",
      "slug": "hanh-trinh-anh-sao",
      "title": "Hành trình ánh sao",
      "posterUrl": "/images/demo-poster.webp",
      "status": "airing",
      "format": "tv",
      "releaseYear": 2026,
      "genres": [{ "id": "genre_adventure", "slug": "adventure", "name": "Phiêu lưu" }]
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 1, "totalPages": 1 }
}
```

Ảnh trong ví dụ chỉ là đường dẫn minh họa, chưa có file. Chi tiết anime bổ sung synopsis, alternativeTitles và bannerUrl. Season có id, animeId, number, title, sortOrder; Episode có các trường như entities.md. Các danh sách Season/Genre trả `data` là mảng; danh sách Episode dùng `meta` phân trang như anime.

### Quy tắc Mùa và tập (2026-10-30)

Người dùng đã xác nhận: mỗi anime có nhiều mùa, phim điện ảnh một mùa/một tập; chỉ đọc mùa thuộc anime published và tập published. Phần dưới là chi tiết triển khai:

- GET common/anime/:id/seasons dùng anime ID (không dùng slug); anime không tồn tại/draft trả 404 ANIME_NOT_FOUND. Anime published chưa có mùa trả 200 với data=[].
- Season không có trạng thái publication riêng trong phạm vi này; quyền đọc theo anime cha. Sort theo sortOrder tăng dần rồi id tăng dần. Danh sách mùa không phân trang như contract hiện tại.
- GET common/seasons/:id/episodes trả 404 SEASON_NOT_FOUND khi mùa không có hoặc anime cha không public. Mùa hợp lệ chưa có tập public trả data=[] và meta. Chỉ tập status=published được tính vào total; sort sortOrder/id tăng dần. page/pageSize mặc định 1/20, giới hạn pageSize 1–50, trang vượt cuối giữ nguyên page và trả rỗng như Anime.
- GET common/episodes/:id chỉ trả tập published thuộc anime published; các trường hợp không có/draft/cha bị ẩn cùng trả 404 EPISODE_NOT_FOUND. DTO detail thêm animeId và animeSlug cùng seasonId để FE liên kết; không trả entity/navigation EF hoặc URL phát.
- ID là chuỗi opaque tối đa 100 ký tự; input quá dài và query pagination sai trả 400 VALIDATION_ERROR. Season.number là số nguyên không âm (0 dành cho phần đặc biệt); Episode.number cho phép số thập phân tối đa hai chữ số sau dấu chấm. Không suy ra thứ tự từ number hoặc ID.
- durationSeconds có thể null khi chưa biết, giá trị đã biết không âm. publishedAt UTC bắt buộc khi published; draft có thể null. thumbnailUrl là string, rỗng khi chưa có ảnh. DTO public giữ status=published và sortOrder; hasPlayback tính từ nguồn enabled chưa hết hạn, không chứng minh phát thành công.
- v0.3 đã có PlaybackSource/SubtitleTrack; hasPlayback là projection server, không nhận từ FE hoặc lưu thành cột tự gán.
- Migration không tự seed. Lệnh Development --seed-demo có thể bổ sung demo mùa/tập khi hai bảng đang rỗng và catalog chứa đúng các ID/slug demo cần thiết; không sửa mùa/tập hoặc catalog đã có.

### Ví dụ thông tin phát (Playback v0.3)

```json
{
  "data": {
    "episodeId": "episode_demo_001",
    "sources": [
      {
        "id": "source_demo_001",
        "type": "mp4",
        "label": "Video demo",
        "language": "en",
        "url": "https://media.example.com/demo.mp4",
        "expiresAt": null,
        "subtitles": []
      }
    ],
    "previousEpisodeId": null,
    "nextEpisodeId": "episode_demo_002"
  }
}
```

`example.com` chỉ minh họa, không phải nguồn phát sử dụng được. Mỗi subtitle nếu có gồm id, language, label, format, url, isDefault. URL nguồn có thể hết hạn; FE lấy lại playback khi cần. Episode tồn tại nhưng chưa có nguồn trả 200 với sources rỗng; lỗi nhà cung cấp trả 503. Phân biệt hai trường hợp trên với 404 của tập không tồn tại.

## Thư viện và tiến độ

| Method | Path | Nội dung |
| --- | --- | --- |
| GET | /me/library | library:read:own; lọc theo status/isFavorite, phân trang |
| PUT | /me/library/:animeId | library:write:own; tạo/thay thế trạng thái và yêu thích |
| DELETE | /me/library/:animeId | library:write:own; bỏ khỏi thư viện, giữ lịch sử, trả 204 |
| GET | /me/progress | progress:read:own; lọc animeId/completed, phân trang |
| PUT | /me/progress/:episodeId | progress:write:own; lưu tiến độ một tập |

PUT thư viện nhận đủ `status` và `isFavorite`, trả 200 với `data` là LibraryEntry. PUT tiến độ nhận `positionSeconds` và `completed`, trả 200 với WatchProgress; updatedAt do server cấp. GET thư viện và tiến độ kèm tóm tắt anime/tập để FE dựng danh sách mà không gọi từng item riêng.

```json
{
  "positionSeconds": 325,
  "completed": false
}
```

FE lưu theo chu kỳ có giới hạn và khi pause/chuyển tập, không gửi mỗi frame. Phải chốt thêm xung đột nhiều thiết bị, trường hợp xem lại và nhập dữ liệu khách trước khi triển khai đồng bộ. Chưa có API xóa lịch sử trong phạm vi này.

Khách không gọi được các API này và không được mở trang thư viện như thành viên. Mock FE cần mô phỏng trạng thái đăng nhập và quyền; dữ liệu localStorage chỉ phục vụ demo, không phải bằng chứng xác thực BE. Sau đăng nhập, quyền được xác định từ tài khoản trên BE.

## Hồ sơ và quyền hiện tại

`GET /me` đã triển khai, trả id/displayName/email/roles/permissions cho FE dựng giao diện:

```json
{
  "data": {
    "id": "user_demo_001",
    "displayName": "Người xem demo",
    "email": "viewer@example.invalid",
    "roles": ["user"],
    "permissions": [
      "catalog:read", "playback:read", "comment:read",
      "library:read:own", "library:write:own",
      "progress:read:own", "progress:write:own",
      "comment:create", "comment:update:own", "comment:delete:own"
    ]
  }
}
```

Endpoint yêu cầu phiên hợp lệ/tài khoản active; FE hiển thị theo permissions, BE kiểm tra lại mọi request cùng own/trạng thái. Source FE demo chưa chuyển đổi. DTO me đã có email phục vụ Profile, không có passwordHash/token phiên khác; dữ liệu trong ví dụ chỉ minh họa.

## Bình luận anime

Đăng bình luận yêu cầu đăng nhập theo yêu cầu người dùng. Đọc bình luận công khai, sửa/xóa bình luận của mình là đề xuất bổ sung, có thể điều chỉnh khi duyệt.

| Method | Path | Quyền / hành vi |
| --- | --- | --- |
| GET | /common/anime/:animeId/comments | comment:read; đọc bình luận visible, phân trang |
| POST | /me/anime/:animeId/comments | comment:create; tạo bình luận, trả 201 |
| PATCH | /me/comments/:commentId | comment:update:own; cập nhật bình luận của mình, trả 200 |
| DELETE | /me/comments/:commentId | comment:delete:own; xóa mềm của mình, trả 204 |

POST/PATCH nhận `body` plain text 1–2000 sau trim và version; không nhận authorId/status/roles/permissions. Hiện ngay (visible); own update chỉ visible, own delete visible/hidden thành deleted và xóa body. Chưa hỗ trợ reply lồng, ảnh, HTML và reaction.

```json
{
  "data": {
    "id": "comment_demo_001",
    "animeId": "anime_demo_001",
    "author": { "id": "user_demo_001", "displayName": "Người xem demo", "avatarUrl": null },
    "body": "Mình thích hành trình của các nhân vật.",
    "status": "visible",
    "createdAt": "2026-10-24T03:00:00Z",
    "updatedAt": "2026-10-24T03:00:00Z"
  }
}
```

Không trả email, thông tin phiên hoặc quyền nội bộ của tác giả trong API bình luận công khai. POST chỉ nhận anime có thể truy cập công khai. Sửa/xóa phải kiểm tra tác giả bằng userId từ phiên; đề xuất trả 404 khi ID không thuộc người dùng, không tự cấp quyền thao tác bình luận của người khác. Bình luận hidden/deleted không được sửa để tự xuất hiện lại. Endpoint kiểm duyệt riêng chưa thuộc contract này.

## Ví dụ lỗi

```json
{
  "error": {
    "code": "ANIME_NOT_FOUND",
    "message": "Không tìm thấy anime.",
    "requestId": "request_demo_001"
  }
}
```

Mã HTTP dự kiến: 400 dữ liệu sai; 401 chưa đăng nhập; 403 không đủ quyền; 404 không tồn tại; 429 quá nhiều yêu cầu; 500 lỗi nội bộ; 503 dịch vụ phát tạm thời không khả dụng. Không gửi stack trace hoặc thông tin bí mật cho FE.

Thiếu phiên hoặc phiên không hợp lệ trả 401; có phiên hợp lệ nhưng thiếu permission/tài khoản bị khóa trả 403. Riêng tài nguyên cá nhân không thuộc người dùng áp dụng 404 như quy tắc trên. API quản trị, xác thực đăng nhập và lịch phát sóng sẽ được đặc tả riêng.
