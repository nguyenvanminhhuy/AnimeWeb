# Tham chiếu feature, dữ liệu và API BE

Bổ sung 2026-11-03: PATCH admin/anime/{id}/archive và GET admin/audit-logs, [field/query/quyền/lỗi](archive-search-audit.md). AnimeCardDto có available, PublicationStatus thêm archived, tìm common/admin không dấu. Inventory 74 thao tác bên dưới là mốc đối chiếu trước phần bổ sung này.

Lỗi DELETE anime cập nhật 2026-11-03: [STALE_VERSION / ANIME_PUBLISHED / ANIME_IN_USE](admin-mutation-errors.md), thay cho CONFLICT chung ở thao tác này. Các constraint và quyền xoá giữ nguyên; không thêm cascade hoặc migration.

Ngày đối chiếu source: **2026-11-02**. Repo: `Anime-Web`. Phạm vi: **74 thao tác HTTP** hiện có, gồm health và OpenAPI; không bao gồm API chỉ được đề xuất. “Biến” trong tài liệu này là field dữ liệu, DTO, tham số và cấu hình của feature, không phải biến cục bộ trong từng hàm C#.

Tài liệu được dẫn xuất từ Controller/DTO/Service tại [Features](../../BE/src/AnimeWeb.Api/Features), [Shared](../../BE/src/AnimeWeb.Api/Shared) và [persistence](../../BE/src/AnimeWeb.Api/Infrastructure/Persistence). [API contract](../api-contract.md) giữ quyết định nghiệp vụ; tài liệu này giải thích chi tiết triển khai và không tạo một contract độc lập. Nếu code/contract đổi, cập nhật bảng tương ứng ở đây. JSON OpenAPI tại `/openapi/v1.json` chỉ bật trong Development.

## Mục lục

- [Quy ước và kiểu dùng chung](#quy-ước-và-kiểu-dùng-chung)
- [Xác thực và phân quyền](#xác-thực-và-phân-quyền)
- [Health và OpenAPI](#health-và-openapi)
- [Anime, thể loại và dữ liệu tổng hợp](#anime-thể-loại-và-dữ-liệu-tổng-hợp)
- [Mùa và tập công khai](#mùa-và-tập-công-khai)
- [Thư viện và tiến độ](#thư-viện-và-tiến-độ)
- [Bình luận và kiểm duyệt](#bình-luận-và-kiểm-duyệt)
- [Playback, phụ đề và lượt xem](#playback-phụ-đề-và-lượt-xem)
- [Quản trị anime và thể loại](#quản-trị-anime-và-thể-loại)
- [Quản trị mùa và tập](#quản-trị-mùa-và-tập)
- [Quản trị nguồn phát và phụ đề](#quản-trị-nguồn-phát-và-phụ-đề)
- [Users và Dashboard](#users-và-dashboard)
- [Entity lưu trữ và field nội bộ](#entity-lưu-trữ-và-field-nội-bộ)
- [Lỗi, cấu hình và ví dụ](#lỗi-cấu-hình-và-ví-dụ)

## Quy ước và kiểu dùng chung

Mọi URL nghiệp vụ có prefix `/api/v1`. Các bảng ghi **đầy đủ path**. JSON camelCase; ID là string opaque, không suy quan hệ hoặc thứ tự từ ID. Timestamp là string ISO 8601 UTC. Request có body dùng `Content-Type: application/json`; không gửi field ngoài DTO vì server từ chối JSON member không được nhận.

| Ký hiệu | Ý nghĩa |
| --- | --- |
| `string?`, `int?`, `time?`, `T?` | Có thể null |
| `int` | Số nguyên 32-bit; miền không âm tối đa 2.147.483.647 nếu ghi `>=0` |
| `long` | Số nguyên 64-bit; version giữ nguyên giá trị server, không tự tăng ở client |
| `decimal` | JSON number, ví dụ số tập `1.5`; không phải ID |
| `time` | Timestamp ISO 8601 UTC |
| `Obj<T>` | `{ "data": T }` |
| `Page<T>` | `{ "data": T[], "meta": PageMeta }` |
| `SummaryPage<T,S>` | `{ "data": T[], "meta": PageMeta, "summary": S }` |
| `204` | Không có body; không gọi `response.json()` |
| `Session` | Bearer hợp lệ, tài khoản active; không yêu cầu một permission riêng ngoài `[Authorize]` |
| `Public` | Không bắt buộc đăng nhập, vẫn lọc nội dung công khai |

### Pagination, ID và version

| Param/field | Vị trí/kiểu | Bắt buộc/mặc định | Ràng buộc và hành vi |
| --- | --- | --- | --- |
| `page` | Query, int | Không; 1 | 1–2.147.483.647 |
| `pageSize` | Query, int | Không; 20 | 1–50, kể cả library/comments/admin; FE có thể gửi 8 hoặc 5 |
| `PageMeta.page` | Response, int | Server | Trang yêu cầu được giữ nguyên |
| `PageMeta.pageSize` | Response, int | Server | Kích thước trang đang dùng |
| `PageMeta.total` | Response, int | Server | Số dòng sau filter/search, trước phân trang |
| `PageMeta.totalPages` | Response, int | Server | `ceil(total/pageSize)`; 0 khi total=0 |
| `{id}`, `{animeId}`, `{seasonId}`, `{episodeId}` | Path, string | Có khi xuất hiện trong URL | Tối đa 100 ký tự; ID không hợp lệ/quá dài trả 400, tài nguyên thiếu/ẩn trả 404 tùy endpoint |
| `{slug}` | Path, string | Có | Tối đa 200; `^[a-z0-9]+(-[a-z0-9]+)*$` |
| `version` trong body | long | Mặc định 0 trong DTO | Create/upsert chưa có: 0; update bản ghi có sẵn: version đã đọc; stale/thiếu version khi update thường trả 409 |
| `version` khi DELETE | Query, long | Có | >=1; thiếu/sai kiểu trả 400; stale trả 409 |

Trang vượt cuối trả `data=[]` và giữ page, không tự clamp. PATCH admin là **gửi đủ form được phép**, không phải JSON Patch hoặc cập nhật vài field: trường bỏ qua có thể nhận mặc định và ghi đè dữ liệu cũ. Field mặc định không có nghĩa được nhận null. Scalar bool/int không có `[Required]` có thể nhận mặc định khi bỏ qua; FE nên gửi rõ để tránh thay đổi ngoài ý muốn.

Query rỗng nên omit. Không gửi `mock`, `state`, `fail`, `actor`, `userId` của người khác, role/permission hoặc `AbortSignal` làm payload. Các API dùng chung `AdminQuery`/`PersonalQuery` có thể bind/validate thêm field nhưng service bỏ qua field không được liệt kê trong bảng query của endpoint; không dựa vào field bị bỏ qua để lọc dữ liệu.

### Enum

| Field | Giá trị |
| --- | --- |
| Anime `status` | `upcoming`, `airing`, `completed` |
| Anime `format` | `tv`, `movie`, `ova`, `ona`, `special` |
| Anime `publicationStatus` | `draft`, `published`; độc lập release status |
| Episode `status` | `draft`, `published` |
| Library `status` | `plan_to_watch`, `watching`, `completed`, `on_hold`, `dropped` |
| Comment `status` | `visible`, `hidden`, `deleted` |
| Moderation `action` | `hide`, `restore` |
| Account `status` | `active`, `blocked` |
| Role | `user`, `manage`, `admin`; guest không là role DB |
| Source `providerKey` | Hiện chỉ `direct` |
| Source `type` | `mp4`, `hls` |
| Subtitle `format` | `vtt`, `srt` |

## Xác thực và phân quyền

### API

| Method | Path | Quyền | Input | Thành công |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | Public | `RegisterInput` | 201 `Obj<LoginDto>` |
| POST | `/api/v1/auth/login` | Public | `LoginInput` | 200 `Obj<LoginDto>` |
| POST | `/api/v1/auth/logout` | Session | Không body/query | 204 |
| GET | `/api/v1/me` | Session | Không query | 200 `Obj<ProfileDto>` |
| POST | `/api/v1/me/change-password` | Session | `PasswordInput` | 204 |
| PUT | `/api/v1/me/avatar` | `profile:avatar:write:own` | Query version >=1, body PNG <=2 MiB/512px | 200 `Obj<ProfileDto>`; [validation/ownership](account-avatar.md) |
| DELETE | `/api/v1/me/avatar` | `profile:avatar:write:own` | Query version >=1 | 200 `Obj<ProfileDto>` |
| GET | `/api/v1/common/avatars/{id}/{key}` | Public | URL do BE trả | PNG image/png, nosniff; 404 khi ảnh cũ/không tồn tại |

### Request fields

| DTO | Field | Kiểu | Bắt buộc/mặc định | Quy tắc |
| --- | --- | --- | --- | --- |
| LoginInput, RegisterInput | `email` | string | Có | Email hợp lệ, <=254; server lưu bản trim và normalizedEmail uppercase; unique không phân biệt hoa/thường |
| LoginInput, RegisterInput | `password` | string | Có | 8–128; đăng ký từ chối toàn whitespace; không trim/lowercase password |
| RegisterInput | `displayName` | string | Có | 2–40 sau trim; validation độ dài DTO cũng áp dụng trước service |
| PasswordInput | `currentPassword` | string | Có | 8–128; phải khớp password hiện tại, sai trả 400 field currentPassword |
| PasswordInput | `newPassword` | string | Có | 8–128, không toàn whitespace, khác currentPassword |

Không nhận confirmation/roles/permissions/userId trong đăng ký. Confirmation chỉ kiểm tra ở FE. Đăng ký luôn role user. Có đổi/xoá avatar own; chưa có refresh token, sửa tên/email hoặc quên mật khẩu.

### Response fields và vòng đời phiên

| DTO | Field | Kiểu | Ý nghĩa |
| --- | --- | --- | --- |
| ProfileDto | `id` | string | User ID server |
| ProfileDto | `displayName`, `email` | string | Dữ liệu riêng của tài khoản đang đăng nhập |
| ProfileDto | `roles` | string[] | Role đang được gán, sắp code |
| ProfileDto | `permissions` | string[] | Tập quyền distinct từ DB, sắp code |
| ProfileDto | `avatarUrl`, `version` | string/null, int64 >=1 | URL ảnh công khai hiện tại, version chung account cho mutation avatar |
| LoginDto | `accessToken` | string | Token opaque ngẫu nhiên, hiện 64 ký tự hex; chỉ trả khi register/login |
| LoginDto | `tokenType` | string | `Bearer` |
| LoginDto | `expiresAt` | time | Hết hạn tuyệt đối 7 ngày |
| LoginDto | `profile` | ProfileDto | Hồ sơ/quyền hiện tại |

Header API riêng tư: `Authorization: Bearer <accessToken>`. DB chỉ lưu SHA-256 của token. Logout thu hồi phiên hiện tại; đổi password thu hồi mọi phiên và yêu cầu login lại. Tài khoản blocked hoặc thiếu permission trả 403; phiên thiếu/sai/hết hạn/thu hồi trả 401. Sai email/password login trả 401 chung; duplicate email khi register trả 409. Role/permission/blocked đọc lại từ DB mỗi request, không tin dữ liệu quyền ở FE.

### Ma trận quyền

| Permission | user | manage | admin |
| --- | --- | --- | --- |
| `catalog:read`, `playback:read`, `comment:read` | Có; guest cũng đọc public | Có | Có |
| `library:read:own`, `library:write:own` | Có | Có | Có |
| `progress:read:own`, `progress:write:own` | Có | Có | Có |
| `comment:create`, `comment:update:own`, `comment:delete:own` | Có | Có | Có |
| `admin:dashboard:read`, `admin:user:read` | Không | Có | Có |
| `admin:anime:read`, `admin:genre:read`, `admin:episode:read`, `admin:playback:read`, `admin:comment:read` | Không | Có | Có |
| `admin:anime:write`, `admin:genre:write`, `admin:episode:write`, `admin:playback:write`, `admin:comment:moderate`, `admin:user:status:write`, `admin:user:role:write` | Không | Không | Có |

Đây là mapping mặc định được seed; API kiểm tra permission thực tế. Admin không bypass ownership/constraint. Users có đọc và admin khoá/mở khoá/đổi role; không xóa/reset password người khác. Admin đầu tiên tạo qua CLI explicit, xem [BE README](../../BE/README.md#admin-đầu-tiên-và-xác-thực).

## Health và OpenAPI

| Method | Path | Quyền | Params | Thành công |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/health` | Public | Không | 200 `Obj<HealthStatus>` với status=`ok` |
| GET | `/api/v1/health/ready` | Public | Không | 200 `Obj<HealthStatus>` với status=`ready`; mất DB trả 503 |
| GET | `/openapi/v1.json` | Public, chỉ Development | Không | JSON OpenAPI, không có envelope `{data}` |

`HealthStatus={status:string}`. Liveness không kiểm tra DB; readiness chỉ chứng minh kết nối được DB, không chứng minh schema/migration đã đầy đủ. OpenAPI không có Swagger UI và không bật ngoài Development.

## Anime, thể loại và dữ liệu tổng hợp

### API

| Method | Path | Quyền | Params | Thành công |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/common/anime` | Public | `AnimeQuery` | 200 `Page<AnimeSummaryDto>` |
| GET | `/api/v1/common/anime/{slug}` | Public | Path slug | 200 `Obj<AnimeDetailDto>` |
| GET | `/api/v1/common/genres` | Public | Không query | 200 `Obj<GenreDto[]>` |
| GET | `/api/v1/common/home` | Public | Query `genre?:string`, <=100 | 200 `Obj<HomeDto>` |
| GET | `/api/v1/common/catalog/options` | Public | Không query | 200 `Obj<CatalogOptionsDto>` |
| GET | `/api/v1/common/anime/{animeId}/related` | Public | Path animeId | 200 `Obj<AnimeCardDto[]>` |
| GET | `/api/v1/common/rankings/anime` | Public | Query `metric=views`; `limit` int 1–50, mặc định 10 | 200 `Obj<RankingDto[]>` |

### AnimeQuery

| Query param | Kiểu | Mặc định | Quy tắc |
| --- | --- | --- | --- |
| `q` | string? | Không lọc | <=200; trim, substring title/alternativeTitles, không phân biệt hoa/thường; không bỏ dấu; `%`, `_`, `~` là literal |
| `genre` | string? | Không lọc | Genre **slug**, <=100, cùng regex slug; slug hợp lệ nhưng không có trả danh sách rỗng |
| `status` | string? | Không lọc | Enum release status |
| `format` | string? | Không lọc | Enum format |
| `year` | int? | Không lọc | 1–9999 |
| `sort` | string | `newest` | `newest`: nguồn enabled/chưa hết hạn trên tập published trước, rồi releaseYear giảm/id tăng; `title`: lowercase theo PostgreSQL collation C/id tăng. Ưu tiên trước phân trang |
| `page`, `pageSize` | int | 1, 20 | Pagination chung |

Các filter AND. Public chỉ anime publicationStatus=published; detail draft và missing cùng 404 ANIME_NOT_FOUND. Genres chỉ gồm thể loại có ít nhất một anime public, sort slug. Search không bao gồm subtitle trong API public cũ; admin/library có hành vi riêng ở phần tương ứng.

### Response fields của danh mục

| DTO/field | Kiểu | Ý nghĩa |
| --- | --- | --- |
| GenreDto.`id`, `slug`, `name` | string | ID liên kết, slug lọc, tên hiển thị |
| AnimeSummaryDto.`id`, `slug`, `title`, `posterUrl` | string | Metadata cơ bản |
| AnimeSummaryDto.`status`, `format` | string enum | Trạng thái phát hành, loại phim |
| AnimeSummaryDto.`releaseYear` | int | Năm phát hành |
| AnimeSummaryDto.`genres` | GenreDto[] | Genre objects, không phải string[]; sort slug |
| AnimeDetailDto | AnimeSummaryDto + các field dưới | Không có publicationStatus/version, không aggregate mùa/tập/related |
| AnimeDetailDto.`synopsis` | string | Mô tả |
| AnimeDetailDto.`alternativeTitles` | string[] | Tên khác |
| AnimeDetailDto.`bannerUrl` | string? | Ảnh banner, có thể null |
| AnimeCardDto | Metadata Summary + `subtitle`, `synopsis`, `bannerUrl` | Dùng Home/related/ranking/library/admin; không phải AnimeDetailDto |
| AnimeCardDto.`subtitle`, `synopsis` | string | Dữ liệu trình bày đã lưu |
| AnimeCardDto.`bannerUrl` | string? | Có thể null |
| HomeDto.`featured`, `updated`, `recommended` | AnimeCardDto[] | Từng nhóm nội dung bên dưới |
| HomeDto.`topViewed` | RankingDto[] | Cùng service ranking với Dashboard |
| CatalogOptionsDto.`years` | int[] | Distinct năm toàn danh mục public, giảm dần |
| CatalogOptionsDto.`formats` | string[] | Distinct format đang có trong danh mục public, tăng dần |
| RankingDto.`anime` | AnimeCardDto | Chỉ anime public |
| RankingDto.`viewCount` | long | Số ViewEvents đã xác nhận, không phải lượt GET hoặc số người duy nhất |

Featured tối đa 6 theo releaseYear giảm/id tăng. Updated tối đa 12 anime có tập published, theo publishedAt mới nhất/id. Recommended tối đa 12 theo releaseYear/id, nếu có genre thì lọc genre slug đó; chưa có personalization hoặc score đề xuất. Related tối đa 12 phim khác cùng ít nhất một genre, sort số genre chung giảm, releaseYear giảm rồi id. Ranking sort viewCount giảm/id tăng; phim public chưa có view vẫn có thể xuất hiện với 0. Thiếu/ẩn anime khi lấy related trả 404 NOT_FOUND.

`subtitle` không nằm trong DTO list/detail public cũ, nhưng có trong AnimeCardDto; `episodeLabel` không có trong DTO BE. FE phải map/derive từ dữ liệu thật, không bịa số tập.

## Mùa và tập công khai

| Method | Path | Quyền | Params | Thành công |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/common/anime/{animeId}/seasons` | Public | Path animeId | 200 `Obj<SeasonDto[]>`, không phân trang |
| GET | `/api/v1/common/seasons/{seasonId}/episodes` | Public | Path seasonId; page/pageSize | 200 `Page<EpisodeDto>` |
| GET | `/api/v1/common/episodes/{episodeId}` | Public | Path episodeId | 200 `Obj<EpisodeDetailDto>` |

| DTO/field | Kiểu | Ý nghĩa |
| --- | --- | --- |
| SeasonDto.`id`, `animeId`, `title` | string | ID mùa, anime cha, tên mùa |
| SeasonDto.`number`, `sortOrder` | int >=0 | Number 0 cho phần đặc biệt; sortOrder điều khiển thứ tự |
| EpisodeDto.`id`, `seasonId`, `title`, `thumbnailUrl` | string | Metadata tập; thumbnailUrl có thể rỗng |
| EpisodeDto.`number` | decimal | Số tập, có thể 1.5; không phải khóa sắp xếp |
| EpisodeDto.`sortOrder` | int >=0 | Thứ tự trong mùa |
| EpisodeDto.`durationSeconds` | int? | Thời lượng giây, null là chưa biết, không ép thành 0 |
| EpisodeDto.`publishedAt` | time | Luôn có ở DTO public |
| EpisodeDto.`status` | string | Luôn `published` ở common |
| EpisodeDto.`hasPlayback` | bool | Có nguồn enabled chưa hết hạn; không chứng minh video phát thành công |
| EpisodeDetailDto | EpisodeDto + `animeId`, `animeSlug` string | Tham chiếu đủ dựng Watch; không có nguồn phát/nav entity |

Mùa chỉ đọc khi anime cha published; không có publication riêng ở Season. Tập cần cả episode published và anime cha published. Season list sort sortOrder/id, episode list sort sortOrder/id. Resource hợp lệ chưa có mùa/tập trả 200 rỗng. Hidden/missing trả ANIME_NOT_FOUND cho list mùa, SEASON_NOT_FOUND cho list tập, EPISODE_NOT_FOUND cho detail tập. Playlist toàn anime phải xử lý đủ page/mùa; không suy tập trước/sau bằng number hoặc ID.

## Thư viện và tiến độ

### API

| Method | Path | Quyền | Params/input | Thành công |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/me/library` | `library:read:own` | Library query dưới đây | 200 `SummaryPage<LibraryRow,CollectionSummary>` |
| GET | `/api/v1/me/library/summary` | `library:read:own` | Không query | 200 `Obj<PersonalSummary>` |
| PUT | `/api/v1/me/library/{animeId}` | `library:write:own` | Path animeId; LibraryInput | 200 `Obj<LibraryDto>` |
| DELETE | `/api/v1/me/library/{animeId}` | `library:write:own` | Path animeId; query version | 204 |
| GET | `/api/v1/me/progress` | `progress:read:own` | Progress query dưới đây | 200 `SummaryPage<ProgressRow,CollectionSummary>` |
| PUT | `/api/v1/me/progress/{episodeId}` | `progress:write:own` | Path episodeId; ProgressInput | 200 `Obj<ProgressDto>` |

### Query và body

| API/DTO | Param/field | Kiểu | Mặc định/ràng buộc |
| --- | --- | --- | --- |
| GET library | `status` | string? | Enum Library; không gửi thì không lọc |
| GET library | `isFavorite` | bool? | true/false, không phải yes/no; bỏ qua nếu không lọc |
| GET library, GET progress | `q` | string? | <=200, trim/lowercase substring theo title/subtitle của anime |
| GET library, GET progress | `sort` | string | `recent` hoặc `title`, mặc định recent |
| GET library, GET progress | `page`, `pageSize` | int | Pagination chung, không mặc định size=8 ở BE |
| GET progress | `animeId` | string? | <=100, lọc anime |
| GET progress | `completed` | bool? | Lọc hoàn thành sau khi chọn collection |
| GET progress | `collection` | string | `history` mặc định hoặc `watching` |
| LibraryInput | `status` | string | Bắt buộc hợp lệ, enum Library |
| LibraryInput | `isFavorite` | bool | Mặc định false nếu bỏ qua; nên gửi rõ |
| LibraryInput, ProgressInput | `version` | long | Mới=0; bản ghi có sẵn gửi version hiện tại |
| ProgressInput | `positionSeconds` | int | >=0, mặc định 0; không vượt durationSeconds nếu đã biết |
| ProgressInput | `completed` | bool | Mặc định false; có thể false khi xem lại |

Library chỉ dùng status/isFavorite/q/sort/page/pageSize; progress chỉ dùng animeId/completed/collection/q/sort/page/pageSize. Owner lấy từ session. PUT yêu cầu anime/tập đang public; duration null không áp giới hạn trên vị trí. Bản ghi cùng user/anime hoặc user/episode unique; tạo đồng thời hoặc version cũ trả 409.

### Response fields

| DTO/field | Kiểu | Ý nghĩa |
| --- | --- | --- |
| LibraryDto.`animeId`, `status` | string | Anime và trạng thái của entry |
| LibraryDto.`isFavorite` | bool | Yêu thích độc lập status |
| LibraryDto.`updatedAt`, `version` | time, long | Server cấp |
| LibraryRow | LibraryDto + `anime`, `progress` | Các field entry nằm phẳng ở row, không lồng trong entry |
| LibraryRow.`anime` | AnimeCardDto | Anime summary để tránh gọi từng ID |
| LibraryRow.`progress` | ProgressDto? | Tập xem mới nhất của anime, có thể đã completed; null nếu chưa có |
| ProgressDto.`episodeId`, `animeId` | string | Liên kết tập/phim |
| ProgressDto.`episodeNumber` | decimal | Số tập từ server |
| ProgressDto.`positionSeconds` | int | Vị trí đã lưu |
| ProgressDto.`durationSeconds` | int? | Thời lượng server, null nếu chưa biết |
| ProgressDto.`completed` | bool | Trạng thái đã lưu |
| ProgressDto.`updatedAt`, `version` | time, long | Server cấp |
| ProgressRow | ProgressDto + `anime:AnimeCardDto` | Field progress phẳng, không lồng trong progress |
| CollectionSummary.`total` | int | Toàn collection sau filter collection/status/favorite/anime/completed, trước q và pagination |
| PersonalSummary.`favoriteAnimeCount` | int | Số anime favorite public |
| PersonalSummary.`inProgressEpisodeCount` | int | Số tập public có progress chưa hoàn thành |
| PersonalSummary.`completedEpisodeCount` | int | Số tập public đã hoàn thành |
| PersonalSummary.`historyEpisodeCount` | int | Tổng tập public có progress |
| PersonalSummary.`preview` | ProgressRow[] | Tối đa 6 dòng watching mới nhất |

History một dòng/tập. Watching chọn progress mới nhất mỗi anime theo updatedAt giảm, episodeId tăng khi bằng nhau, **sau đó** chỉ giữ dòng chưa completed. Sort recent theo updatedAt giảm rồi animeId/episodeId; title theo lowercase title rồi ID. Số anime watching khác số tập inProgress. List/summary chỉ tính nội dung còn public. Bỏ yêu thích gửi PUT giữ status, isFavorite=false; DELETE bỏ entry library nhưng không xóa progress/history. Server không nhập demo localStorage tự động.

## Bình luận và kiểm duyệt

### API

| Method | Path | Quyền | Params/input | Thành công |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/common/anime/{animeId}/comments` | Public | Path animeId; page/pageSize | 200 `Page<CommentDto>` |
| POST | `/api/v1/me/anime/{animeId}/comments` | `comment:create` | Path animeId; CommentInput | 201 `Obj<CommentDto>` |
| PATCH | `/api/v1/me/comments/{id}` | `comment:update:own` | Path id; CommentInput | 200 `Obj<CommentDto>` |
| DELETE | `/api/v1/me/comments/{id}` | `comment:delete:own` | Path id; query version | 204 |
| GET | `/api/v1/admin/comments` | `admin:comment:read` | Admin comments query | 200 `SummaryPage<AdminCommentDto,CommentSummary>` |
| GET | `/api/v1/admin/comments/{id}` | `admin:comment:read` | Path id | 200 `Obj<AdminCommentDto>` |
| POST | `/api/v1/admin/comments/{id}/moderations` | `admin:comment:moderate` | Path id; ModerationInput | 200 `Obj<AdminCommentDto>` |

| API/DTO | Param/field | Kiểu | Ràng buộc/mặc định |
| --- | --- | --- | --- |
| CommentInput | `body` | string | Có, plain text 1–2000 sau trim; DTO cũng kiểm tra độ dài trước trim |
| CommentInput | `version` | long | Create=0; PATCH gửi version đã đọc |
| ModerationInput | `action` | string | Có, hide/restore |
| ModerationInput | `reason` | string | Có, 3–300 sau trim; DTO cũng kiểm tra trước trim |
| ModerationInput | `version` | long | Version hiện tại của comment |
| Admin comments | `animeId` | string? | <=100, scope theo anime |
| Admin comments | `q` | string? | <=200; body/authorName/userId/id, không tìm body deleted |
| Admin comments | `status` | string? | visible/hidden/deleted |
| Admin comments | `sort` | string | newest mặc định, oldest, updated; luôn thêm id tăng |
| Admin comments | `page`, `pageSize` | int | Pagination chung |

Public chỉ visible của anime published, sort createdAt giảm/id tăng. FE `commentPage` phải map thành query `page`; không có param commentPage ở BE. Tác giả từ session; own khác user trả 404. Create/update yêu cầu anime public; own delete có thể xóa visible/hidden của chính mình kể cả anime đã ẩn. Sửa hidden/deleted trả 409. Delete chuyển deleted, body=null. Moderation chỉ visible→hidden hoặc hidden→visible, không sửa author/body và không restore deleted.

| DTO/field | Kiểu | Ý nghĩa |
| --- | --- | --- |
| AuthorDto.`id`, `displayName` | string | User ID và tên công khai |
| AuthorDto.`avatarUrl` | string? | Hiện null |
| CommentDto.`id`, `animeId` | string | Comment và anime |
| CommentDto.`author` | AuthorDto | Không chứa email |
| CommentDto.`body` | string? | Public visible có body; deleted trả null ở admin |
| CommentDto.`status` | string enum | Trạng thái comment |
| CommentDto.`createdAt`, `updatedAt`, `version` | time, time, long | Server cấp |
| AdminCommentDto.`comment` | CommentDto | **Lồng object comment**, không trải phẳng |
| AdminCommentDto.`lastModeration` | ModerationDto? | Audit mới nhất, null nếu chưa từng kiểm duyệt |
| ModerationDto.`action`, `reason`, `moderatorName`, `moderatedAt` | string, string, string, time | Actor/time do server gán |
| CommentSummary.`total`, `visible`, `hidden`, `deleted` | int | Scope animeId nếu có; tính trước q/status/page |

## Playback, phụ đề và lượt xem

| Method | Path | Quyền | Params/input | Thành công |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/common/episodes/{episodeId}/playback` | Public | Path episodeId | 200 `Obj<PlaybackDto>` |
| POST | `/api/v1/common/episodes/{episodeId}/view-sessions` | Public | Path episodeId; ViewInput | 201 `Obj<ViewStartDto>` |
| POST | `/api/v1/common/view-sessions/{id}/confirm` | Public, cùng viewer | Path id của view session; ViewInput | 200 `Obj<ViewConfirmDto>` |

| DTO/field | Kiểu | Ràng buộc/ý nghĩa |
| --- | --- | --- |
| ViewInput.`positionSeconds` | int | >=0, mặc định 0; không vượt thời lượng nếu đã biết |
| PlaybackDto.`episodeId` | string | Tập đang xem |
| PlaybackDto.`sources` | SourceDto[] | Nguồn enabled, chưa hết hạn; sort createdAt/id tăng |
| PlaybackDto.`previousEpisodeId`, `nextEpisodeId` | string? | Null tại đầu/cuối; chỉ tập published thuộc anime public |
| SourceDto.`id`, `type`, `label`, `language`, `url` | string | type mp4/hls, không phải MIME của player FE |
| SourceDto.`expiresAt` | time? | Null nếu không đặt hạn |
| SourceDto.`subtitles` | SubtitleDto[] | Sort default trước rồi id |
| SubtitleDto.`id`, `language`, `label`, `format`, `url` | string | format vtt/srt |
| SubtitleDto.`isDefault` | bool | Tối đa một default mỗi source |
| ViewStartDto.`id`, `startedAt` | string, time | Session xem server, không phải access token |
| ViewConfirmDto.`counted` | bool | true nếu thêm view mới; false nếu trùng anime/viewer/bucket |

Playback thiếu/ẩn tập trả 404 NOT_FOUND; có tập chưa có nguồn trả 200 sources rỗng; provider lỗi HTTP/timeout trả 503 và không lộ provider exception. Direct provider không tải video. Trước/sau sắp theo season.sortOrder, season.id, episode.sortOrder, episode.id xuyên mùa, không theo số tập.

Start view yêu cầu nội dung public và có nguồn enabled chưa hết hạn, không có nguồn trả 409. Viewer là userId khi phiên active, hoặc cookie guest ngẫu nhiên `animeweb-viewer` HttpOnly/SameSite=Lax (Secure ngoài Development). Client guest phải giữ cookie để confirm cùng viewer. DB chỉ giữ viewer hash. Confirm yêu cầu ít nhất 30 giây theo server **và** delta position >=30, session không quá 10 phút; quá sớm trả 400, quá hạn 409, sai viewer 404. Unique anime/viewer/khung30phút dựa startedAt; confirm lại không đếm trùng. GET playback không tăng view. Đây là thống kê cơ bản, không chứng minh chống client giả lập hoặc đổi viewer.

## Quản trị anime và thể loại

### API

| Method | Path | Quyền | Params/input | Thành công |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/admin/anime` | `admin:anime:read` | Admin anime query | 200 AdminAnimeResult |
| GET | `/api/v1/admin/anime/options` | `admin:anime:read` | q/page/pageSize | 200 `Page<AnimeOptionDto>` |
| GET | `/api/v1/admin/anime/{id}` | `admin:anime:read` | Path id | 200 `Obj<AdminAnimeDto>` |
| POST | `/api/v1/admin/anime` | `admin:anime:write` | AdminAnimeInput | 201 `Obj<AdminAnimeDto>` |
| PATCH | `/api/v1/admin/anime/{id}` | `admin:anime:write` | Path id; AdminAnimeInput đủ form | 200 `Obj<AdminAnimeDto>` |
| DELETE | `/api/v1/admin/anime/{id}` | `admin:anime:write` | Path id; query version | 204 |
| GET | `/api/v1/admin/genres` | `admin:genre:read` | Admin genre query | 200 `Page<AdminGenreDto>` |
| GET | `/api/v1/admin/genres/options` | `admin:genre:read` | Không query | 200 `Obj<AdminGenreDto[]>` |
| GET | `/api/v1/admin/genres/{id}` | `admin:genre:read` | Path id | 200 `Obj<AdminGenreDto>` |
| POST | `/api/v1/admin/genres` | `admin:genre:write` | GenreInput | 201 `Obj<AdminGenreDto>` |
| PATCH | `/api/v1/admin/genres/{id}` | `admin:genre:write` | Path id; GenreInput đủ form | 200 `Obj<AdminGenreDto>` |
| DELETE | `/api/v1/admin/genres/{id}` | `admin:genre:write` | Path id; query version | 204 |

### Query

| API | Param | Kiểu | Hành vi/mặc định |
| --- | --- | --- | --- |
| Admin anime | `q` | string? <=200 | Trim/lowercase substring title/subtitle/alternativeTitles; không bỏ dấu |
| Admin anime | `genre` | string? <=100 | Genre slug; không phải genreId |
| Admin anime | `status`, `format`, `publicationStatus` | string? | Enum tương ứng; bỏ qua khi không lọc |
| Admin anime | `year` | int? | 1–9999 |
| Admin anime | `sort` | string | newest mặc định: releaseYear giảm/id; title: lowercase title/id |
| Admin anime | `page`, `pageSize` | int | Pagination chung |
| Anime options | `q` | string? <=200 | Chỉ tìm title; không xử lý các filter khác của AdminQuery |
| Anime options | `page`, `pageSize` | int | Sort title rồi id; có paging |
| Admin genres | `q` | string? <=200 | Name lowercase hoặc slug |
| Admin genres | `usage` | string? | used: có anime bất kỳ; unused: chưa được dùng |
| Admin genres | `sort` | string | name mặc định hoặc name-desc, lowercase name rồi id tăng |
| Admin genres | `page`, `pageSize` | int | Pagination chung |

### AdminAnimeInput và GenreInput

| DTO/field | Kiểu | Bắt buộc/mặc định | Ràng buộc |
| --- | --- | --- | --- |
| AdminAnimeInput.`title` | string | Có | 1–300 sau trim, không whitespace |
| AdminAnimeInput.`slug` | string | Có | <=200, regex slug, unique |
| AdminAnimeInput.`subtitle` | string | `""` | <=300, server trim |
| AdminAnimeInput.`alternativeTitles` | string[] | [] | Tối đa 20; mỗi tên không whitespace, <=300; trim/distinct |
| AdminAnimeInput.`synopsis` | string | `""` | <=10.000 ở DTO |
| AdminAnimeInput.`releaseYear` | int | Cần gửi | 1–9999; bỏ qua mặc định 0 bị reject |
| AdminAnimeInput.`status` | string | upcoming | Enum release status |
| AdminAnimeInput.`format` | string | tv | Enum format |
| AdminAnimeInput.`publicationStatus` | string | draft | Enum publication; không suy từ airing/completed |
| AdminAnimeInput.`genreIds` | string[] | [] | Tối đa 50, không trùng, từng ID tồn tại/không rỗng/<=100 |
| AdminAnimeInput.`posterUrl` | string | Có | Không rỗng, <=2048; hiện chỉ kiểm tra độ dài/Required, không kiểm tra URL hay tải ảnh |
| AdminAnimeInput.`bannerUrl` | string? | null | <=2048, không kiểm tra media tồn tại |
| AdminAnimeInput.`version` | long | 0 khi tạo | PATCH gửi version hiện tại |
| GenreInput.`name` | string | Có | 1–100 sau trim; unique normalized upper/btrim không phân biệt hoa/thường |
| GenreInput.`slug` | string | Có | <=100, regex slug, unique |
| GenreInput.`version` | long | 0 khi tạo | PATCH gửi version hiện tại |

### Response và ràng buộc

| DTO/field | Kiểu | Ý nghĩa |
| --- | --- | --- |
| AdminAnimeDto.`anime` | AnimeCardDto | Metadata, gồm subtitle/synopsis/genres objects |
| AdminAnimeDto.`alternativeTitles` | string[] | Tên khác, nằm ngoài anime |
| AdminAnimeDto.`publicationStatus` | string | draft/published |
| AdminAnimeDto.`publicSlug` | string? | Slug nếu published; null nếu draft |
| AdminAnimeDto.`publishedEpisodes` | int | Số tập status published, kể cả khi anime draft ở admin |
| AdminAnimeDto.`version` | long | Version ở ngoài anime; dùng cho PATCH/DELETE |
| AdminAnimeResult | `{data:AdminAnimeDto[],meta,genreOptions,years}` | Không bọc thêm `{data:...}` quanh cả result |
| AdminAnimeResult.`genreOptions` | AdminGenreDto[] | Toàn genres, gồm chưa dùng, sort name/id |
| AdminAnimeResult.`years` | int[] | Năm toàn anime admin trước filter/page, distinct giảm |
| AnimeOptionDto.`id`, `title`, `status`, `publicationStatus` | string | Các field chọn cha |
| AnimeOptionDto.`publicSlug` | string? | null khi draft |
| AdminGenreDto.`id`, `name`, `slug` | string | Metadata thể loại |
| AdminGenreDto.`animeCount` | int | Anime bất kỳ đang dùng, không chỉ public |
| AdminGenreDto.`version` | long | Version để sửa/xóa |

Admin genres options không dùng common/genres thay thế vì public không có unused/draft-only genres. Không gửi tên/slug trong genreIds. Chuyển anime thành movie bị chặn nếu đã có >1 mùa hoặc >1 tập. Xóa anime phải draft; server dọn liên kết AnimeGenre trong transaction nhưng không xóa Genre. Còn mùa/library/comments/views sẽ bị FK chặn 409 và rollback. Xóa genre còn anime sử dụng trả 409. Không xóa dây chuyền nội dung con.

## Quản trị mùa và tập

| Method | Path | Quyền | Params/input | Thành công |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/admin/seasons` | `admin:episode:read` | Query animeId bắt buộc, page/pageSize | 200 `Page<AdminSeasonDto>` |
| GET | `/api/v1/admin/seasons/{id}` | `admin:episode:read` | Path id | 200 `Obj<AdminSeasonDto>` |
| POST | `/api/v1/admin/seasons` | `admin:episode:write` | SeasonInput | 201 `Obj<AdminSeasonDto>` |
| PATCH | `/api/v1/admin/seasons/{id}` | `admin:episode:write` | Path id; SeasonInput đủ form | 200 `Obj<AdminSeasonDto>` |
| DELETE | `/api/v1/admin/seasons/{id}` | `admin:episode:write` | Path id; query version | 204 |
| GET | `/api/v1/admin/episodes` | `admin:episode:read` | Admin episode query | 200 `Page<AdminEpisodeDto>` |
| GET | `/api/v1/admin/episodes/{id}` | `admin:episode:read` | Path id | 200 `Obj<AdminEpisodeDto>` |
| POST | `/api/v1/admin/episodes` | `admin:episode:write` | EpisodeInput | 201 `Obj<AdminEpisodeDto>` |
| PATCH | `/api/v1/admin/episodes/{id}` | `admin:episode:write` | Path id; EpisodeInput đủ form | 200 `Obj<AdminEpisodeDto>` |
| DELETE | `/api/v1/admin/episodes/{id}` | `admin:episode:write` | Path id; query version | 204 |

| API/DTO | Param/field | Kiểu | Mặc định/ràng buộc |
| --- | --- | --- | --- |
| GET admin seasons | `animeId` | string | Bắt buộc ở service, <=100; missing 400, anime không có 404 |
| GET admin seasons | `page`, `pageSize` | int | Pagination chung; sort sortOrder/id; không xử lý q/sort/seasonId |
| GET admin episodes | `q` | string? <=200 | Title substring không phân biệt hoa/thường hoặc number chính xác nếu parse được decimal invariant |
| GET admin episodes | `animeId`, `seasonId` | string? <=100 | Lọc cha; kết hợp AND |
| GET admin episodes | `status` | string? | draft/published |
| GET admin episodes | `sort` | string | order mặc định hoặc title; order=season.sortOrder/seasonId/episode.sortOrder/id; title=lowercase title/id |
| GET admin episodes | `page`, `pageSize` | int | Pagination chung |
| SeasonInput, EpisodeInput | `animeId` | string | Có, <=100 |
| SeasonInput | `number`, `sortOrder` | int | >=0, mặc định 0 |
| SeasonInput, EpisodeInput | `title` | string | Có, 1–300 sau trim |
| SeasonInput, EpisodeInput | `version` | long | Mới=0; PATCH gửi version hiện tại |
| EpisodeInput | `seasonId` | string | Có, <=100, phải thuộc animeId |
| EpisodeInput | `number` | decimal | 0–999999.99, <=2 chữ số thập phân, mặc định 0 |
| EpisodeInput | `sortOrder` | int | >=0, mặc định 0 |
| EpisodeInput | `durationSeconds` | int? | null mặc định hoặc >=0 |
| EpisodeInput | `status` | string | draft mặc định hoặc published |
| EpisodeInput | `thumbnailUrl` | string | `""` mặc định, <=2048; chỉ kiểm tra độ dài |

AdminSeasonDto = SeasonDto + version. AdminEpisodeDto có `id,animeId,seasonId,number,title,sortOrder,durationSeconds,thumbnailUrl,status,publishedAt,hasPlayback,version`, kiểu như public nhưng publishedAt nullable cho draft chưa từng công bố. Không có animeSlug ở AdminEpisodeDto.

Không gửi publishedAt: server gán lần đầu status published, giữ khi chuyển draft/rồi published lại. Season không chuyển sang anime khác; Episode không chuyển anime nhưng có thể chuyển mùa trong cùng anime. Movie tối đa một mùa/một tập được kiểm tra dưới khóa anime. Xóa mùa còn tập hoặc tập còn source/progress/view session trả 409; tập published cần chuyển draft trước xóa. Admin xem được draft; không suy publicSlug/link public từ trạng thái tập.

## Quản trị nguồn phát và phụ đề

| Method | Path | Quyền | Params/input | Thành công |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/admin/playback-sources` | `admin:playback:read` | Admin source query | 200 `Page<AdminSourceDto>` |
| GET | `/api/v1/admin/playback-sources/{id}` | `admin:playback:read` | Path id | 200 `Obj<AdminSourceDto>` |
| POST | `/api/v1/admin/playback-sources` | `admin:playback:write` | SourceInput | 201 `Obj<AdminSourceDto>` |
| PATCH | `/api/v1/admin/playback-sources/{id}` | `admin:playback:write` | Path id; SourceInput đủ form | 200 `Obj<AdminSourceDto>` |
| DELETE | `/api/v1/admin/playback-sources/{id}` | `admin:playback:write` | Path id; query version | 204 |
| GET | `/api/v1/admin/playback-sources/{id}/subtitles` | `admin:playback:read` | Path id source | 200 `Obj<AdminSubtitleDto[]>`, không phân trang |
| GET | `/api/v1/admin/subtitles/{id}` | `admin:playback:read` | Path id track | 200 `Obj<AdminSubtitleDto>` |
| POST | `/api/v1/admin/subtitles` | `admin:playback:write` | SubtitleInput | 201 `Obj<AdminSubtitleDto>` |
| PATCH | `/api/v1/admin/subtitles/{id}` | `admin:playback:write` | Path id; SubtitleInput đủ form | 200 `Obj<AdminSubtitleDto>` |
| DELETE | `/api/v1/admin/subtitles/{id}` | `admin:playback:write` | Path id; query version | 204 |

| API/DTO | Param/field | Kiểu | Mặc định/ràng buộc |
| --- | --- | --- | --- |
| Source list | `animeId`, `seasonId`, `episodeId` | string? <=100 | Lọc theo cha, AND; không kiểm tra parent pair như mutation |
| Source list | `q` | string? <=200 | Substring label/providerKey/language, trim/lowercase |
| Source list | `enabled` | bool? | true/false, không yes/no |
| Source list | `sort` | string | created mặc định: createdAt tăng/id tăng; label: lowercase label/id |
| Source list | `page`, `pageSize` | int | Pagination chung |
| SourceInput | `episodeId` | string | Có, <=100, tồn tại; không đổi episode của source đã có |
| SourceInput | `providerKey` | string | direct mặc định, chỉ direct được nhận |
| SourceInput | `type` | string | mp4 mặc định hoặc hls |
| SourceInput, SubtitleInput | `label` | string | Có, 1–100 sau trim |
| SourceInput, SubtitleInput | `language` | string | Có, 1–30 sau trim; chưa áp danh sách mã ngôn ngữ cố định |
| SourceInput, SubtitleInput | `url` | string | Có, <=2048, absolute HTTP(S), không user-info; ngoài Development bắt buộc HTTPS |
| SourceInput | `enabled` | bool | false mặc định |
| SourceInput | `expiresAt` | time? | null mặc định; convert UTC; có thể lưu hạn đã qua nhưng không public |
| SourceInput, SubtitleInput | `version` | long | Create=0; PATCH gửi version đã đọc |
| SubtitleInput | `playbackSourceId` | string | Có, <=100, tồn tại; không đổi source của track đã có |
| SubtitleInput | `format` | string | vtt mặc định hoặc srt |
| SubtitleInput | `isDefault` | bool | false mặc định |

AdminSourceDto có `id,episodeId,providerKey,label,language,type,url,enabled,createdAt,expiresAt,version`; kiểu tương ứng input, createdAt server cấp. AdminSubtitleDto có `id,playbackSourceId,label,language,format,url,isDefault,version`. Track list sort isDefault giảm/id tăng. Có thể không có default; tối đa một default/source. Đặt một track default tự bỏ default track cũ trong transaction, **version track cũ cũng tăng**: refetch trước lần sửa tiếp theo. Xóa source còn track trả 409. Bật/tắt/default dùng PATCH đủ form, không có endpoint toggle/default riêng.

Nguồn mp4/hls và subtitle vtt/srt là metadata, không là bằng chứng player native hỗ trợ. Server không fetch/proxy/transcode SRT/HLS hoặc xác minh URL phát được. Không trả credential provider; hiện không có provider ngoài direct được cấu hình.

## Users và Dashboard

| Method | Path | Quyền | Params | Thành công |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/admin/users` | `admin:user:read` | q/status/sort/page/pageSize | 200 `SummaryPage<AdminUserDto,UserSummary>` |
| GET | `/api/v1/admin/users/{id}` | `admin:user:read` | Path id | 200 `Obj<AdminUserDto>` |
| PATCH | `/api/v1/admin/users/{id}/status` | `admin:user:read` + `admin:user:status:write` | Path id, body status + version >=1 | 200 `Obj<AdminUserDto>`; xem [guard/transaction/lỗi](account-status-management.md) |
| PATCH | `/api/v1/admin/users/{id}/role` | `admin:user:read` + `admin:user:role:write` | Path id, body role (user/manage/admin) + version >=1 | 200 `Obj<AdminUserDto>`; [guard/phiên/concurrency](account-role-management.md) |
| GET | `/api/v1/admin/dashboard` | `admin:dashboard:read` | Không query | 200 `Obj<DashboardDto>` |

| API/DTO | Param/field | Kiểu | Mặc định/ý nghĩa |
| --- | --- | --- | --- |
| Users query | `q` | string? <=200 | Trim/lowercase substring displayName/email |
| Users query | `status` | string? | active/blocked |
| Users query | `sort` | string | newest mặc định: createdAt giảm/id; oldest: createdAt tăng/id; name: lowercase displayName/id |
| Users query | `page`, `pageSize` | int | Pagination chung |
| AdminUserDto | `id`, `displayName`, `email`, `status` | string | Thông tin tối thiểu được phép đọc |
| AdminUserDto | `createdAt`, `roles` | time, string[] | Thời điểm tạo, role codes; không có passwordHash/token |
| AdminUserDto | `version`, `avatarUrl` | int64 >=1, string/null | Version chung status/role/avatar/password; URL avatar hiện tại |
| UserSummary | `total`, `active`, `blocked` | int | Toàn bộ user trước q/status/page |
| DashboardDto | `totalAnime` | int | Tất cả anime, gồm draft |
| DashboardDto | `publishedEpisodes` | int | Tập status published, kể cả anime cha draft trong scope admin |
| DashboardDto | `upcomingAnime` | int | Anime status upcoming, gồm draft |
| DashboardDto | `episodesWithoutVideo` | int | Tập published không có source enabled chưa hết hạn; chỉ là thiếu cấu hình nguồn |
| DashboardDto | `totalSeasons`, `totalGenres` | int | Tổng mùa/thể loại |
| DashboardDto | `statuses` | StatusCountDto[] | Ba release statuses, kể cả count=0 |
| StatusCountDto | `status`, `label`, `count` | string, string, int | Label hiện là enum code, FE tự dịch |
| DashboardDto | `recentAnime` | RecentAnimeDto[] | Tối đa 6; có tập published trước, max publishedAt giảm rồi id; không dùng ngày sửa anime |
| RecentAnimeDto | `publicSlug`, `anime`, `episodeCount`, `lastPublishedAt` | string?, AnimeCardDto, int, time? | Count tập published; null slug nếu draft; null ngày khi chưa có tập published |
| DashboardDto | `topViewed` | RankingDto[] | Top 10 public, cùng service với Home |

Users có GET list/detail và PATCH trạng thái; manage chỉ đọc, admin có khoá/mở khoá. Có PATCH role theo admin:user:role:write; không có endpoint admin tạo/xoá/reset password. Metadata/statistics không lấy từ một page hiện tại; public ranking không lộ draft dù Dashboard có số liệu nội dung draft.

## Entity lưu trữ và field nội bộ

Đây là field lưu trữ để hiểu feature; **không serialize hoặc gửi lại nguyên entity**. C# PascalCase được ghi camelCase cho dễ đối chiếu HTTP. Navigation EF không nằm trong bảng và không là field API.

| Entity | Field lưu trữ và kiểu | Khóa/chức năng |
| --- | --- | --- |
| Anime | id/slug/title/subtitle/synopsis/posterUrl/status/format/publicationStatus:string; bannerUrl:string?; alternativeTitles:string[]; releaseYear:int; version:long | id PK; slug unique; publication nội bộ không trả qua DTO public cũ |
| Genre | id/name/slug:string; normalizedName:string computed; version:long | id PK; slug và normalized upper/btrim name unique |
| AnimeGenre | animeId/genreId:string | PK cặp; liên kết many-to-many |
| Season | id/animeId/title:string; number/sortOrder:int; version:long | id PK, anime FK; không publication riêng |
| Episode | id/seasonId/title/thumbnailUrl/status:string; number:decimal(8,2); sortOrder:int; durationSeconds:int?; publishedAt:time?; version:long | id PK; season FK; published cần publishedAt |
| Account | id/displayName/email/normalizedEmail/passwordHash/status:string; createdAt:time | id PK; normalizedEmail unique; passwordHash chỉ server |
| LoginSession | tokenHash/userId:string; expiresAt:time; revokedAt:time? | tokenHash PK, user FK; không lưu raw accessToken |
| AccessRole, AccessPermission | code:string | code PK; bảng cấu hình được seed |
| UserRole | userId/roleCode:string | PK cặp, FK user/role |
| RolePermission | roleCode/permissionCode:string | PK cặp, FK role/permission |
| LibraryEntry | userId/animeId/status:string; isFavorite:bool; updatedAt:time; version:long | PK userId/animeId |
| WatchProgress | userId/episodeId:string; positionSeconds:int; completed:bool; updatedAt:time; version:long | PK userId/episodeId; anime/duration derive từ tập |
| Comment | id/animeId/userId/status:string; body:string?; createdAt/updatedAt:time; deletedAt:time?; version:long | id PK; actor từ session; xóa mềm |
| CommentModeration | id/commentId/moderatorId/action/reason:string; moderatedAt:time | id PK; audit giữ lịch sử; DTO chỉ lastModeration |
| PlaybackSource | id/episodeId/providerKey/label/language/type/url:string; enabled:bool; createdAt:time; expiresAt:time?; version:long | id PK, episode FK |
| SubtitleTrack | id/playbackSourceId/label/language/format/url:string; isDefault:bool; version:long | id PK; unique filtered default/source |
| ViewSession | id/episodeId/viewerHash:string; startPosition:int; startedAt:time | id PK, episode FK; không phải login session |
| ViewEvent | animeId/viewerHash:string; bucket:long; recordedAt:time | PK animeId/viewerHash/bucket; nguồn đếm ranking |

FK liên quan dùng restrict. Entity có version dùng optimistic concurrency; raw trường passwordHash/tokenHash/viewerHash/normalizedEmail không nằm trong API user/public. Không có cột hasPlayback/episodeLabel: đó là dữ liệu derive. Không có bảng video bytes/upload/transcoding. Migration và bootstrap xem [hiện trạng](current-status.md), [database](database.md), [BE README](../../BE/README.md).

## Lỗi, cấu hình và ví dụ

### HTTP/error envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid data.",
    "requestId": "server-request-id",
    "fields": { "pageSize": ["Invalid value."] }
  }
}
```

fields là dictionary tên HTTP/JSON camelCase → string[], có thể không có. Không phụ thuộc text message để phân nhánh nghiệp vụ.

| HTTP | code | Trường hợp |
| --- | --- | --- |
| 400 | VALIDATION_ERROR | Sai path/query/body, field ngoài DTO, version query thiếu, ràng buộc input |
| 401 | UNAUTHORIZED | Thiếu/sai/hết/thu hồi session; sai login; challenge có WWW-Authenticate: Bearer ở API được bảo vệ |
| 403 | FORBIDDEN | Thiếu permission hoặc blocked |
| 404 | NOT_FOUND | Route/resource không có/không được thấy; API feature mới dùng mã chung |
| 404 | ANIME_NOT_FOUND, SEASON_NOT_FOUND, EPISODE_NOT_FOUND | Mã riêng của các API đọc Anime/Mùa/tập cũ theo phạm vi ở trên |
| 405 | METHOD_NOT_ALLOWED | Path có nhưng method không hỗ trợ |
| 409 | CONFLICT | Version cũ, unique/FK/restrict, movie/default workflow hoặc chuyển trạng thái không hợp lệ |
| 415 | UNSUPPORTED_MEDIA_TYPE | Content-Type không hỗ trợ |
| 429 | TOO_MANY_REQUESTS | Rate limit IP |
| 500 | INTERNAL_ERROR | Lỗi chưa xử lý riêng; không trả stack trace |
| 503 | SERVICE_UNAVAILABLE | DB readiness mất kết nối hoặc provider playback lỗi/timeout |

### Cấu hình và CLI liên quan feature

| Key | Mục đích/mặc định | Có phải API param? |
| --- | --- | --- |
| `ConnectionStrings:AnimeWeb` | Connection PostgreSQL bắt buộc, validate startup | Không; không gửi FE |
| `Cors:AllowedOrigins` | Danh sách origin FE cho phép; cấu hình theo môi trường, không credentials cho bearer | Không |
| `RateLimits:Global` | 120 request/phút/IP, trong một tiến trình | Không |
| `RateLimits:Auth` | 10 request/phút/IP cho register/login/logout/change-password | Không |
| `ASPNETCORE_ENVIRONMENT` | Development bật OpenAPI/seed demo, cho phép HTTP media URL; ngoài Development yêu cầu HTTPS media URL | Không |
| `Bootstrap:Email`, `Bootstrap:DisplayName`, `Bootstrap:Password` | CLI admin đầu tiên; displayName mặc định Administrator; không tài khoản/password mặc định | Không; chỉ operator cấp khi explicit --bootstrap-admin |
| `--seed-demo` | CLI chỉ Development, explicit seed catalog/mùa/tập; không tài khoản/media | Không |
| `--bootstrap-admin` | CLI sau migration: tạo admin đầu tiên nếu chưa có, không tự chạy HTTP/migration | Không |

Biến môi trường cho key lồng dùng `__`, ví dụ `Cors__AllowedOrigins__0`, `RateLimits__Auth`. Không đưa cấu hình có bí mật vào tài liệu hoặc request. Chưa có config token lifetime công khai: 7 ngày hiện được code trong AccountService. Xem README về cấp cấu hình local đúng cách.

### Ví dụ request

Tất cả ID/URL và password dưới là placeholder minh họa, không phải tài khoản hoặc media đã cấp.

```http
GET /api/v1/common/anime?q=star&genre=fantasy&status=airing&format=tv&year=2026&sort=newest&page=1&pageSize=12
```

```http
POST /api/v1/auth/login
Content-Type: application/json

{"email":"viewer@example.invalid","password":"replace-with-your-password"}
```

```http
PUT /api/v1/me/library/anime_demo_001
Authorization: Bearer <accessToken>
Content-Type: application/json

{"status":"watching","isFavorite":true,"version":0}
```

```http
PUT /api/v1/me/progress/episode_demo_main_z
Authorization: Bearer <accessToken>
Content-Type: application/json

{"positionSeconds":120,"completed":false,"version":1}
```

```http
POST /api/v1/admin/anime
Authorization: Bearer <accessToken-with-admin:anime:write>
Content-Type: application/json

{
  "title":"Anime minh họa",
  "slug":"anime-minh-hoa",
  "subtitle":"Tên phụ",
  "alternativeTitles":["Example anime"],
  "synopsis":"Mô tả",
  "releaseYear":2026,
  "status":"upcoming",
  "format":"tv",
  "publicationStatus":"draft",
  "genreIds":["genre-id-from-admin-options"],
  "posterUrl":"/images/example.webp",
  "bannerUrl":null,
  "version":0
}
```

```http
PATCH /api/v1/admin/episodes/<episodeId>
Authorization: Bearer <accessToken-with-admin:episode:write>
Content-Type: application/json

{
  "animeId":"<animeId>",
  "seasonId":"<seasonId>",
  "number":1.5,
  "title":"Tập đặc biệt",
  "sortOrder":15,
  "durationSeconds":null,
  "status":"published",
  "thumbnailUrl":"",
  "version":1
}
```

```http
POST /api/v1/admin/comments/<commentId>/moderations
Authorization: Bearer <accessToken-with-admin:comment:moderate>
Content-Type: application/json

{"action":"hide","reason":"Nội dung cần kiểm duyệt","version":1}
```

```http
DELETE /api/v1/admin/genres/<genreId>?version=1
Authorization: Bearer <accessToken-with-admin:genre:write>
```

FE chưa tích hợp HTTP, chưa có media thật trong seed. Việc có API/hasPlayback/URL không chứng minh media, HLS/SRT, CORS/range hoặc player đã vận hành; xem [giới hạn hiện tại](current-status.md#tích-hợp-và-giới-hạn-thực-tế). Tài liệu này được kiểm tra tĩnh theo source; không chạy lại API/test trong lượt viết tài liệu.
