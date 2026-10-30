# AnimeWeb backend

BE C#/.NET 10, ASP.NET Core Controller, EF Core và PostgreSQL. Đã có nền vận hành, Anime và Mùa/tập: API đọc, migration và seed demo explicit. Chưa có auth, library, comments, playback hoặc progress.

## Yêu cầu

- .NET SDK 10.0.403 (global.json cho phép patch cùng feature band).
- Docker Desktop chạy Linux engine, Docker Compose.
- PostgreSQL image pin `postgres:18.6-bookworm`; dev dùng port 54329, test dùng 54330, chỉ bind 127.0.0.1.
- NuGet restore cần mạng lần đầu. BE không dùng pnpm hoặc workspace SRC.

Mọi lệnh dưới chạy từ folder `BE` của repo `New folder/AnimeWeb` trên branch Be-Dev.

## Restore và chạy local

```powershell
dotnet restore AnimeWeb.slnx --locked-mode
dotnet tool restore
$env:ANIMEWEB_DB_PASSWORD = Read-Host 'Mat khau PostgreSQL local'
.\scripts\start-local.ps1 -InitializeCatalog
```

Script tạo/khởi động đúng Compose project `animeweb-be`, dựng connection string có escape ký tự đặc biệt và chạy API tại **http://localhost:5200**. Mật khẩu chỉ truyền qua environment, không ghi file. Dùng lại cùng mật khẩu nếu volume dev đã tồn tại; đổi biến môi trường không đổi mật khẩu của database đã khởi tạo. Cờ -InitializeCatalog là yêu cầu explicit để apply migration vào database dev do script cấu hình và seed khi catalog rỗng; bỏ cờ này khi chỉ muốn khởi động, không migrate/seed. Script không xóa dữ liệu hoặc ghi đè catalog có sẵn. Ctrl+C dừng API; database dev được giữ.

- GET `/api/v1/health`: 200, `{ "data": { "status": "ok" } }`, không truy cập database.
- GET `/api/v1/health/ready`: 200 khi kết nối PostgreSQL được; 503 dạng error khi không kết nối được. Chưa kiểm tra schema nghiệp vụ.
- GET `/openapi/v1.json`: chỉ Development. Không cài Swagger UI.

## API Anime

- GET `/api/v1/common/anime?q=star&genre=adventure&year=2026&status=airing&format=tv&sort=newest&page=1&pageSize=20`.
- GET `/api/v1/common/anime/hanh-trinh-anh-sao`.
- GET `/api/v1/common/genres`.

Không cần đăng nhập. Chỉ anime published được trả; draft và slug không tồn tại cùng trả 404 ANIME_NOT_FOUND. Chi tiết quy tắc filter/sort/trang vượt cuối xem [API contract](../DOC/api-contract.md). Tìm không phân biệt hoa thường, chưa bỏ dấu tiếng Việt.

Seed catalog gồm 6 anime published, 1 draft, 3 thể loại công khai và 1 thể loại chỉ thuộc draft. Seed mùa/tập thêm 5 mùa, 8 tập: có tập đặc biệt, draft, mùa rỗng và metadata dưới anime ẩn để kiểm tra quyền đọc. Tên phim/nội dung là hư cấu; đường dẫn ảnh minh họa chưa có asset hoặc nguồn video thật. Seed không chạy khi start API thông thường; không chèn demo qua migration.

## API Mùa và tập

- GET `/api/v1/common/anime/anime_demo_001/seasons`: danh sách mùa theo anime ID, không phải slug.
- GET `/api/v1/common/seasons/season_demo_main/episodes?page=1&pageSize=2`: tập published theo sortOrder/id, phân trang như catalog.
- GET `/api/v1/common/episodes/episode_demo_main_special`: chi tiết, gồm animeId/animeSlug/seasonId.

Anime cha phải published; draft/không tồn tại trả 404 tương ứng ANIME_NOT_FOUND, SEASON_NOT_FOUND hoặc EPISODE_NOT_FOUND. Mùa hợp lệ chưa có tập trả 200/mảng rỗng. durationSeconds có thể null khi chưa biết; publishedAt UTC bắt buộc cho tập published. hasPlayback=false ở bước metadata, không có URL/video phát. Seed mẫu movie có một mùa/một tập; FE chưa nối API.

Nếu đã chạy catalog từ trước, gọi lại start-local.ps1 -InitializeCatalog để chủ động apply InitialEpisodes và bổ sung demo mùa/tập. Seeder mùa/tập chỉ thêm khi hai bảng đang rỗng và có đúng các ID/slug demo cần thiết; không sửa dữ liệu đã có. Nếu dùng catalog tự quản lý, seed không tự gán mùa/tập demo vào anime khác.

Cấu hình `ConnectionStrings:AnimeWeb` bắt buộc; thiếu/sai làm host dừng ngay. Các origin CORS local mặc định là http://localhost:5173 và http://127.0.0.1:5173, có thể override bằng `Cors__AllowedOrigins__0`. Hiện chưa bật credentials hoặc auth scheme. JSON camelCase, enum snake_case string, lỗi theo [contract](../DOC/api-contract.md).

Dừng database dev khi không dùng:

```powershell
docker compose -f compose.yaml stop
```

## Format, build và test

```powershell
dotnet format AnimeWeb.slnx
dotnet format AnimeWeb.slnx --verify-no-changes --no-restore
dotnet build AnimeWeb.slnx --no-restore
dotnet test AnimeWeb.slnx --no-build --no-restore
.\scripts\test-database.ps1
```

Test thường không cần Docker: ca PostgreSQL được ghi rõ skipped khi chưa cấp fixture. Script test khởi động PostgreSQL riêng với database `animeweb_test`, fixture password công khai chỉ dành cho test, port 54330 và tmpfs; chạy test migration/readiness rồi dừng container test. Không thao tác database dev hoặc container khác. Không dùng mật khẩu test cho triển khai thật. Docker Engine phải chạy trước khi gọi script.

## Migration

Local tool dotnet-ef đã pin. InitialInfrastructure là baseline; InitialCatalog tạo Anime/Genres/AnimeGenres; InitialEpisodes tạo Seasons/Episodes với FK restrict, index sort và check metadata. Không chèn dữ liệu demo qua migration.

Khi cần tạo/apply migration, cấp `ConnectionStrings__AnimeWeb` cho database local/test đích đã xác định, rồi dùng:

```powershell
dotnet ef migrations list --project src/AnimeWeb.Api --startup-project src/AnimeWeb.Api
dotnet ef database update --project src/AnimeWeb.Api --startup-project src/AnimeWeb.Api
```

Sau khi apply migration, có thể seed explicit với Development và connection string local/test đã xác định:

```powershell
$env:ASPNETCORE_ENVIRONMENT = 'Development'
dotnet run --project src/AnimeWeb.Api --no-launch-profile -- --seed-demo
```

Lệnh seed không chạy HTTP server, từ chối môi trường khác Development, không thay catalog đã có dữ liệu. Không seed tài khoản/mật khẩu.

Không apply migration bằng connection string của môi trường chưa xác minh. Không dùng EnsureCreated thay migration. Xem [workflow generate](../DOC/docs-BE/prompts/module-generation.md) để thêm từng module; auth/progress còn cần đặc tả riêng.
