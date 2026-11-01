# Dữ liệu và lưu trữ BE

**Cập nhật 2026-11-01:** CompleteBackendFeatures đã bổ sung schema các nhóm bên dưới, seed cấu hình role/permission và concurrency version; không seed tài khoản/media. Ba migration cũ giữ nguyên. Xem [hiện trạng](current-status.md) về tên bảng, ràng buộc xóa và nâng cấp dữ liệu. Các đoạn mô tả thiết kế cho module tiếp theo được thay bằng quyết định v0.3 khi đã có lựa chọn tương ứng.

Mô hình chuẩn tại [entities.md](../entities.md). PostgreSQL 18.6-bookworm, EF Core 10.0.14 và Npgsql provider 10.0.3 đã cấu hình. InitialInfrastructure là baseline; InitialCatalog tạo Anime/Genres/AnimeGenres, khóa duy nhất, check và foreign key. Seed demo chạy explicit, không nằm trong migration. Đã kiểm tra database PostgreSQL riêng, xem [verification](verification.md).

| Nhóm | Entity | Ràng buộc chính |
| --- | --- | --- |
| Danh mục | Anime, Genre, AnimeGenre | Slug anime/genre duy nhất; cặp animeId/genreId không trùng |
| Mùa/tập | Season, Episode | Khóa ngoại hợp lệ; sắp theo sortOrder, thêm ID làm khóa phụ khi phân trang |
| Nguồn phát | PlaybackSource, SubtitleTrack | Đúng tập/nguồn; chỉ trả nguồn enabled của nội dung công khai |
| Tài khoản/quyền | User, Role, Permission, UserRole, RolePermission | Code role/permission duy nhất; cặp liên kết không trùng |
| Thư viện | LibraryEntry | Duy nhất userId/animeId; yêu thích độc lập trạng thái xem |
| Tiến độ | WatchProgress | Duy nhất userId/episodeId; positionSeconds không âm |
| Bình luận | Comment | Tác giả lấy từ phiên; visible/hidden/deleted; xóa mềm |

Chỉ nhóm danh mục và mùa/tập đã có schema/migration. Các nhóm khác là thiết kế cho module tiếp theo, không phải bảng đã tồn tại. Đồng bộ theo [handoff](../fe-backend-handoff.md) ngày 2026-11-01: có thể cần moderation audit và dữ liệu view/aggregate nếu chọn tự thống kê; tên bảng/constraint/index cụ thể chốt cùng feature, không tự tạo migration toàn bộ.

Anime.status là trạng thái phát hành upcoming/airing/completed; publicationStatus là draft/published, mặc định draft. Season đọc theo anime cha; Episode mặc định draft và chỉ published dưới anime public được trả qua common. InitialEpisodes thêm Seasons/Episodes với FK restrict, check number/sortOrder/duration/status và publishedAt bắt buộc khi published. Migration không chèn demo.

ID là string ổn định; thời gian trả UTC ISO 8601. Không suy luận tập trước/sau bằng cộng số tập; dùng sortOrder/id và chỉ lấy tập công khai. Mô hình một anime nhiều mùa, movie một mùa/một tập đã được người dùng xác nhận. number của episode có thể là số thập phân cho tập đặc biệt, không là khóa định danh hoặc thứ tự chính.

## Ghi và truy vấn

Upsert thư viện/tiến độ dựa trên khóa duy nhất từng user. Transaction bảo vệ thao tác nhiều bản ghi; không chỉ kiểm tra trùng ở ứng dụng. Chưa xóa cứng anime/tập có lịch sử khi chưa có chính sách lưu trữ.

## Yêu cầu dữ liệu từ handoff cho module chưa có

- UserRole dùng mã user/manage/admin, RolePermission theo ma trận; guest không lưu role. Đăng ký mặc định user. Chính sách cập nhật quyền/blocked/thu hồi phiên phải có hiệu lực server, không chỉ đổi claim ở FE. Không bổ sung CRUD tài khoản khi Users chỉ có yêu cầu đọc.
- Library lưu status/isFavorite độc lập; tắt favorite không xóa status/progress. History là progress theo tập, watching chọn progress mới nhất mỗi anime rồi kiểm tra completed. Summary trước q/không theo page, phân biệt số tập với số anime; các truy vấn cần tie-breaker ổn định và policy request cũ/đa thiết bị được chốt.
- Genre liên kết bằng ID, không tên/slug do form chọn. Public genre chỉ có phim published; admin options gồm chưa dùng, animeCount/years/options không suy từ page. DTO subtitle/episodeLabel không buộc thêm cột trình bày; chốt derive hay lưu theo nhu cầu.
- Ghi tập phải kiểm tra animeId khớp seasonId, duration nullable/không âm, publishedAt có khi published. Chốt ai gán ngày/khi xuất bản lại; không đồng nhất publication anime với release status. Quy tắc chặn xóa anime/mùa/tập và tài nguyên tham chiếu cần đặc tả, không cascade tự động.
- Nguồn/phụ đề tham chiếu episode/source; default track cần transaction/constraint phù hợp, quy tắc không có default cần chốt. Chặn xóa source còn track theo handoff; enabled không là chứng nhận media phát được. Không lưu credential provider hoặc signed URL tạm làm dữ liệu định danh; sort created cần thiết kế field/order thực tế.
- Moderation audit ghi action hide/restore, reason, moderatorId/time server. Không sửa author/body qua moderation; deleted không trả body và không restore. lastModeration là DTO projection, không bắt buộc thiết kế bảng giống view model.
- Dashboard dùng aggregate toàn scope; recentAnime theo ngày tập công bố gần nhất, không updatedAt anime. Ranking dùng chung Home/Dashboard, chỉ public. Định nghĩa view/chống trùng/nguồn số liệu/tổng hợp còn mở, không tự cộng khi đọc playback hoặc lấy viewCount client làm tổng tin cậy.

Index đề xuất theo truy vấn: anime slug; genre/anime; season theo animeId/sortOrder; episode theo seasonId/status/sortOrder; library và progress theo userId/updatedAt; comment theo animeId/status/createdAt. Chốt index sau khi xem kế hoạch truy vấn PostgreSQL; chưa có số đo hiệu năng.

## Quy ước EF Core/Npgsql

DbContext scoped, mapping bằng IEntityTypeConfiguration và Fluent API; migration ở `src/AnimeWeb.Api/Infrastructure/Persistence/Migrations`. Không dùng EnsureCreated thay migration trong luồng vận hành. Query đọc dùng projection DTO/AsNoTracking khi phù hợp; phân trang ở database, không ToList trước rồi mới lọc. Async và CancellationToken xuyên tới SaveChangesAsync/query.

Thời gian dùng DateTimeOffset UTC hoặc DateTime UTC nhất quán với Npgsql/timestamptz. DTO ID vẫn là string; kiểu lưu trữ phải được chốt trong model, không tự đổi wire contract sang số. Unique/foreign key và kiểm tra tiến độ được map tại database; bắt lỗi constraint để trả lỗi theo contract, không lộ SQL/connection string.

Ví dụ lệnh thêm migration mới, chỉ chạy từ `BE` khi có thay đổi model đã duyệt. InitialCatalog/InitialEpisodes đã tồn tại, không tạo lại:

```powershell
dotnet tool restore
dotnet ef migrations add DescribeApprovedChange --project src/AnimeWeb.Api --startup-project src/AnimeWeb.Api --output-dir Infrastructure/Persistence/Migrations
```

Tên migration phản ánh thay đổi thực tế. Việc apply migration chỉ thực hiện với database local/test đã xác định; không chạy update/drop/reset vào môi trường chưa được xác minh. Xem [provider Npgsql](https://www.npgsql.org/efcore/) và [EF Core migrations](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/).

## Migration và seed

Migration có phiên bản, review cùng model/API. Kiểm tra trên database rỗng và database có fixture phiên bản trước; xác định cách khôi phục khi lỗi trước khi dùng dữ liệu thật.

Seed demo hiện có chỉ catalog/mùa/tập, không có tài khoản hoặc comments/playback. Khi triển khai module tương ứng, fixture giả cần ít nhất hai user để kiểm tra ownership, manage/admin theo ma trận, user blocked, comment hidden/deleted và nguồn/track phù hợp; không ghi những fixture dự kiến này thành seed đã chạy. Guest không phải dòng UserRole. Không đưa credentials hoặc hash mật khẩu thật vào fixture/tài liệu.
