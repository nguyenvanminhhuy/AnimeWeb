# API contract sơ bộ

**v0.2: đã triển khai nền ASP.NET Core và ba API đọc Anime** (list/detail/genres) ngày 2026-10-30. API mùa/tập, auth, library, progress, comments và playback còn là bản nháp chưa triển khai. Chi tiết xác thực và lựa chọn được đánh dấu đề xuất cần chốt trước module tương ứng.

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
- Lỗi trả `error.code`, `error.message`, tùy chọn `error.fields` và `error.requestId`.
- Giới hạn pageSize đề xuất 1–50, mặc định 20; dữ liệu sai trả 400.
- `/common` không yêu cầu đăng nhập, dùng chung cho khách và tài khoản đã đăng nhập; chỉ trả nội dung published/công khai.
- `/me` yêu cầu đăng nhập, permission tương ứng và kiểm tra quyền sở hữu; lấy userId từ phiên xác thực, không nhận userId do FE chỉ định.
- Tên prefix không tự tạo quyền truy cập. BE áp dụng middleware/guard cho từng endpoint; xem [rules/roles-permissions.md](docs-FE/rules/roles-permissions.md).
- Cách đăng nhập/cookie/token chưa chốt; chưa đưa endpoint auth vào hợp đồng này.

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

### Ví dụ thông tin phát

```json
{
  "data": {
    "episodeId": "episode_demo_001",
    "isDemo": true,
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

Đề xuất `GET /me` trả thông tin tối thiểu cho FE dựng giao diện:

```json
{
  "data": {
    "id": "user_demo_001",
    "displayName": "Người xem demo",
    "roles": ["member"],
    "permissions": [
      "catalog:read", "playback:read", "comment:read",
      "library:read:own", "library:write:own",
      "progress:read:own", "progress:write:own",
      "comment:create", "comment:update:own", "comment:delete:own"
    ]
  }
}
```

Endpoint này yêu cầu phiên hợp lệ và tài khoản hoạt động. FE dùng permissions để hiển thị chức năng; BE vẫn kiểm tra quyền lại cho mọi request. Các permission thao tác tài nguyên `own` còn phụ thuộc chủ sở hữu và trạng thái tài nguyên.

## Bình luận anime

Đăng bình luận yêu cầu đăng nhập theo yêu cầu người dùng. Đọc bình luận công khai, sửa/xóa bình luận của mình là đề xuất bổ sung, có thể điều chỉnh khi duyệt.

| Method | Path | Quyền / hành vi |
| --- | --- | --- |
| GET | /common/anime/:animeId/comments | comment:read; đọc bình luận visible, phân trang |
| POST | /me/anime/:animeId/comments | comment:create; tạo bình luận, trả 201 |
| PATCH | /me/comments/:commentId | comment:update:own; cập nhật bình luận của mình, trả 200 |
| DELETE | /me/comments/:commentId | comment:delete:own; xóa mềm của mình, trả 204 |

POST/PATCH nhận `body` là plain text, đề xuất 1–2000 ký tự sau khi trim; không nhận authorId, status, roles hoặc permissions. Chưa hỗ trợ trả lời lồng nhau, ảnh, HTML và reaction. Quy tắc duyệt trước hay hiện ngay còn mở; mock tạm dùng visible và ghi rõ đây là lựa chọn đề xuất.

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
