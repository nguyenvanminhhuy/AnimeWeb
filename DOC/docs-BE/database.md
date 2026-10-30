# Dữ liệu và lưu trữ BE

Mô hình chuẩn nằm tại [entities.md](../entities.md), gồm sơ đồ quan hệ và enum đề xuất. PostgreSQL 18.6-bookworm, EF Core 10.0.14 và Npgsql provider 10.0.3 đã cấu hình. Có DbContext và migration InitialInfrastructure không chứa bảng nghiệp vụ; schema/seed domain chưa triển khai. Baseline đã kiểm tra trên database PostgreSQL test riêng, xem [verification](verification.md).

| Nhóm | Entity | Ràng buộc chính |
| --- | --- | --- |
| Danh mục | Anime, Genre, AnimeGenre | Slug anime/genre duy nhất; cặp animeId/genreId không trùng |
| Mùa/tập | Season, Episode | Khóa ngoại hợp lệ; sắp theo sortOrder, thêm ID làm khóa phụ khi phân trang |
| Nguồn phát | PlaybackSource, SubtitleTrack | Đúng tập/nguồn; chỉ trả nguồn enabled của nội dung công khai |
| Tài khoản/quyền | User, Role, Permission, UserRole, RolePermission | Code role/permission duy nhất; cặp liên kết không trùng |
| Thư viện | LibraryEntry | Duy nhất userId/animeId; yêu thích độc lập trạng thái xem |
| Tiến độ | WatchProgress | Duy nhất userId/episodeId; positionSeconds không âm |
| Bình luận | Comment | Tác giả lấy từ phiên; visible/hidden/deleted; xóa mềm |

Anime.status là trạng thái phát hành `upcoming/airing/completed`, không phải trạng thái công khai. Cần bổ sung cách lưu publication/visibility của anime vào mô hình và contract trước khi triển khai; episode đã có `draft/published`. Không dùng trạng thái phát hành để suy ra quyền đọc.

ID là string ổn định; thời gian trả UTC ISO 8601. Không suy luận tập trước/sau bằng cộng số tập; dùng thứ tự mùa/tập và chỉ lấy tập công khai. Mô hình một anime nhiều mùa và movie một mùa/một tập vẫn cần duyệt.

## Ghi và truy vấn

Upsert thư viện/tiến độ dựa trên khóa duy nhất từng user. Transaction bảo vệ thao tác nhiều bản ghi; không chỉ kiểm tra trùng ở ứng dụng. Chưa xóa cứng anime/tập có lịch sử khi chưa có chính sách lưu trữ.

Index đề xuất theo truy vấn: anime slug; genre/anime; season theo animeId/sortOrder; episode theo seasonId/status/sortOrder; library và progress theo userId/updatedAt; comment theo animeId/status/createdAt. Chốt index sau khi xem kế hoạch truy vấn PostgreSQL; chưa có số đo hiệu năng.

## Quy ước EF Core/Npgsql

DbContext scoped, mapping bằng IEntityTypeConfiguration và Fluent API; migration ở `src/AnimeWeb.Api/Infrastructure/Persistence/Migrations`. Không dùng EnsureCreated thay migration trong luồng vận hành. Query đọc dùng projection DTO/AsNoTracking khi phù hợp; phân trang ở database, không ToList trước rồi mới lọc. Async và CancellationToken xuyên tới SaveChangesAsync/query.

Thời gian dùng DateTimeOffset UTC hoặc DateTime UTC nhất quán với Npgsql/timestamptz. DTO ID vẫn là string; kiểu lưu trữ phải được chốt trong model, không tự đổi wire contract sang số. Unique/foreign key và kiểm tra tiến độ được map tại database; bắt lỗi constraint để trả lỗi theo contract, không lộ SQL/connection string.

Lệnh thiết kế, chỉ chạy từ `BE` sau khi solution và local tool được tạo:

```powershell
dotnet tool restore
dotnet ef migrations add InitialCatalog --project src/AnimeWeb.Api --startup-project src/AnimeWeb.Api --output-dir Infrastructure/Persistence/Migrations
```

Tên migration phản ánh thay đổi thực tế. Việc apply migration chỉ thực hiện với database local/test đã xác định; không chạy update/drop/reset vào môi trường chưa được xác minh. Xem [provider Npgsql](https://www.npgsql.org/efcore/) và [EF Core migrations](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/).

## Migration và seed

Migration có phiên bản, review cùng model/API. Kiểm tra trên database rỗng và database có fixture phiên bản trước; xác định cách khôi phục khi lỗi trước khi dùng dữ liệu thật.

Seed dùng dữ liệu giả, ID ổn định, ít nhất hai member để kiểm tra ownership. Có anime chưa công khai, tập draft, tập thiếu nguồn, comment hidden/deleted và user blocked. Guest không phải dòng UserRole. Không đưa credentials hoặc hash mật khẩu thật vào fixture/tài liệu.
