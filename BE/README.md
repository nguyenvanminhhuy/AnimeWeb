# AnimeWeb backend

[Load test/tiến độ nhiều thiết bị/giám sát](../DOC/docs-BE/load-progress-operations.md): test Kestrel loopback5/20/50 user, report .local/load-tests; admin/manage xem /admin/operations. Lỗi progress409 có lựa chọn remote/local ở player. Không migration cho phần này.

Cấu hình [nhiều user cùng xem phim](../DOC/docs-BE/concurrent-viewers.md): rate limit theo user/loại request, proxy tin cậy, cache DTO công khai, dọn view session và Playback:PublicMediaBaseUrl. Mẫu cấu hình không bí mật tại config/traffic.example.json (tham khảo, không tự nạp). Không cần migration cho lượt này; dev video mẫu dùng path theo origin FE thay cho localhost cố định.

Ảnh đại diện: đã có [PUT/DELETE me/avatar và GET common/avatars](../DOC/docs-BE/account-avatar.md). Migration AccountAvatar thêm bảng lưu ảnh và quyền own cho cả ba role; apply migration bằng cấu hình local hiện có rồi restart BE/đăng nhập lại. Không cần thêm thư mục upload hoặc dịch vụ lưu ảnh ngoài.

Admin có [đổi vai trò user/manage/admin](../DOC/docs-BE/account-role-management.md) trên `/admin/users`, permission `admin:user:role:write`; migration AccountRoleManagement đã bổ sung quyền. Khởi động lại BE và đăng nhập lại admin để dùng code/quyền mới.

Cập nhật 2026-11-02: [Khoá/mở khoá tài khoản](../DOC/docs-BE/account-status-management.md) đã triển khai BE và FE. Admin dùng PATCH `/api/v1/admin/users/{id}/status` với status/version; manage chỉ đọc. Khoá thu hồi phiên, mở khoá yêu cầu đăng nhập lại. Migration AccountStatusManagement đã thêm Version và quyền mới.

BE C#/.NET 10, ASP.NET Core Controller, EF Core và PostgreSQL. Đã có nền, Anime/Mùa/tập, Auth/RBAC, thư viện/tiến độ/bình luận, Playback metadata, Home/related/ranking và API quản trị theo [hiện trạng](../DOC/docs-BE/current-status.md). FE mặc định nối HTTP qua Vite /api proxy; không có video thật trong seed.

## Yêu cầu

- .NET SDK 10.0.403 (global.json cho phép patch cùng feature band).
- Chạy không Docker: PostgreSQL 18 cài trực tiếp trên Windows, port mặc định 5432; dùng setup.ps1/start.ps1 theo phần bên dưới.
- Chạy bằng Docker (tuỳ chọn): Docker Desktop Linux engine/Compose, image `postgres:18.6-bookworm`; dev port 54329, test port 54330, chỉ bind 127.0.0.1.
- NuGet restore cần mạng lần đầu. BE không dùng pnpm hoặc workspace SRC.

Mọi lệnh dưới chạy từ folder `Anime-Web/BE`. Hướng dẫn cả hai phía nằm tại [SETUP.md](../SETUP.md).

## Chạy hằng ngày với Docker Desktop

Mở Docker Desktop và đợi engine sẵn sàng, sau đó tại BE chạy:

```powershell
dotnet run
```

Project `AnimeWeb.Local.csproj` là launcher Windows, gọi `scripts/start-local.ps1` để bật PostgreSQL rồi chạy project API tại http://localhost:5200. Không cần nhập lại mật khẩu đã lưu cục bộ, không hardcode mật khẩu vào source. Launcher không thuộc runtime triển khai API; production/Linux vẫn chạy project `src/AnimeWeb.Api` trực tiếp với cấu hình được cấp từ môi trường.

Lần đầu clone hoặc cần chủ động cập nhật schema và catalog mẫu: `dotnet run -- -InitializeCatalog`. Chạy hằng ngày không migrate/seed/reset database. Ctrl+C dừng API; container database vẫn chạy, dừng riêng bằng `docker compose stop` nếu cần. Launcher không tự mở ứng dụng Docker Desktop.

Terminal khác tại `Anime-Web/FE` chạy `pnpm run dev`, mở http://127.0.0.1:5173. Dependencies FE cài một lần bằng `pnpm install --frozen-lockfile` tại SRC.

## Chạy không Docker Desktop trên Windows

Cài PostgreSQL Windows một lần, bật service và nhớ mật khẩu user postgres. Từ BE chạy:

```powershell
.\setup.ps1 -SeedDemo
.\start.ps1
```

Setup tạo database nếu thiếu, restore và apply migration vào PostgreSQL local; seed chỉ chạy khi có -SeedDemo. Start chỉ chạy API, không tự migrate/seed. Mật khẩu nhập ẩn, không lưu file. Cấu hình không bí mật nằm tại .local/native-settings.json (gitignore). Có thể đổi -DbPort/-DbName/-DbUser/-PgBin khi setup; -Check chỉ kiểm tra dependency, không kết nối DB. Chi tiết DBeaver/FE ở SETUP.md. Native DB không tự nhập dữ liệu từ Docker volume cũ.

## Restore và chạy local bằng Docker (tuỳ chọn)

Trên Windows có thể chạy ngay `.\scripts\start-local.ps1 -InitializeCatalog`. Khi chưa có volume dev và chưa cấp ANIMEWEB_DB_PASSWORD, script tự tạo mật khẩu ngẫu nhiên, lưu bằng Windows DPAPI tại .local/docker-password.dpapi (gitignore). Những lần sau dùng lại cùng Windows account. Xem mật khẩu để kết nối DBeaver bằng `.\scripts\show-database-password.ps1` trong terminal cá nhân. Nếu volume đã tồn tại mà chưa có file mật khẩu, script yêu cầu mật khẩu hiện tại, không reset dữ liệu. Các lệnh bên dưới vẫn cho phép tự cấp mật khẩu qua environment.

```powershell
dotnet restore AnimeWeb.slnx --locked-mode
dotnet tool restore
$env:ANIMEWEB_DB_PASSWORD = Read-Host 'Mat khau PostgreSQL local'
.\scripts\start-local.ps1 -InitializeCatalog
```

Script tạo/khởi động đúng Compose project `animeweb-be`, dựng connection string có escape ký tự đặc biệt và chạy API tại **http://localhost:5200**. Connection string được truyền qua environment; mật khẩu tự tạo chỉ lưu mã hóa DPAPI trong .local, không ghi plaintext vào source. Dùng lại cùng mật khẩu nếu volume dev đã tồn tại; đổi biến môi trường không đổi mật khẩu của database đã khởi tạo. Cờ -InitializeCatalog là yêu cầu explicit để apply migration vào database dev do script cấu hình và seed khi catalog rỗng; bỏ cờ này khi chỉ muốn khởi động, không migrate/seed. Script không xóa dữ liệu hoặc ghi đè catalog có sẵn. Ctrl+C dừng API; database dev được giữ.

- GET `/api/v1/health`: 200, `{ "data": { "status": "ok" } }`, không truy cập database.
- GET `/api/v1/health/ready`: 200 khi kết nối PostgreSQL được; 503 dạng error khi không kết nối được. Chưa kiểm tra schema nghiệp vụ.
- GET `/openapi/v1.json`: chỉ Development. Không cài Swagger UI.

## API Anime

Để bổ sung anime thật vào database local thay vì chỉ catalog hư cấu, xem [nhập dữ liệu công khai](../DOC/docs-BE/public-catalog.md). Script `scripts/import-public-catalog.ps1` nhập metadata từ snapshot có checksum, giữ dữ liệu cũ và có thể chạy lại; không thêm video/phụ đề.

Để có một phim xem được ngay trong local, xem [Big Buck Bunny và setup nguồn phát](../DOC/docs-BE/open-movie.md); chạy `scripts/setup-open-movie.ps1` trong PowerShell. Đây là phim riêng có giấy phép mở, không phải nguồn video của các anime đã nhập.

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

Cấu hình `ConnectionStrings:AnimeWeb` bắt buộc; thiếu/sai làm host dừng ngay. Các origin CORS local mặc định là http://localhost:5173 và http://127.0.0.1:5173, có thể override bằng `Cors__AllowedOrigins__0`. Dùng bearer token, không bật CORS credentials. JSON camelCase, enum snake_case string, lỗi theo [contract](../DOC/api-contract.md).

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

Local tool dotnet-ef đã pin. InitialInfrastructure là baseline; InitialCatalog tạo catalog; InitialEpisodes tạo mùa/tập. CompleteBackendFeatures bổ sung auth/quyền, dữ liệu cá nhân, comments/audit, nguồn/subtitle/view, version và subtitle anime; seed role/permission cấu hình, không seed tài khoản/mật khẩu hoặc dữ liệu demo. Trước apply, xử lý genre name trùng không phân biệt hoa/thường nếu DB cũ có để unique index được tạo.

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

Không apply migration bằng connection string của môi trường chưa xác minh. Không dùng EnsureCreated thay migration. Xem [workflow generate](../DOC/docs-BE/prompts/module-generation.md) trước thay đổi contract/code.

## Admin đầu tiên và xác thực

Sau migration, người vận hành tự cấp cấu hình Bootstrap__Email, Bootstrap__DisplayName và Bootstrap__Password bằng cơ chế bí mật phù hợp. Không ghi mật khẩu vào file source hoặc đối số command line. Khi đã cấp ConnectionStrings__AnimeWeb và các biến Bootstrap, chạy explicit từ BE:

```powershell
dotnet run --project src/AnimeWeb.Api --no-launch-profile -- --bootstrap-admin
```

CLI tạo admin đầu tiên nếu chưa có, không tạo lại khi đã tồn tại và không chạy HTTP server; không tự apply migration. Xóa cấu hình bootstrap khỏi phiên/môi trường sau sử dụng. Không có admin/password mặc định; đăng ký HTTP luôn role user. Users API có đọc và PATCH trạng thái theo quyền admin:user:status:write, đổi vai trò qua PATCH role theo admin:user:role:write.

POST `/api/v1/auth/login` body `{email,password}` trả `{data:{accessToken,tokenType,expiresAt,profile}}`. Gửi `Authorization: Bearer <accessToken>` cho `/me` và `/admin`. Token tuyệt đối 7 ngày, không refresh; logout thu hồi phiên hiện tại, đổi mật khẩu thu hồi mọi phiên. Role/permission và blocked đọc lại từ DB mỗi request; production dùng HTTPS.

## Version, nguồn và thống kê

Create/upsert mới gửi version=0; update/progress/comment/moderation gửi version từ response trước. PATCH admin gửi đủ form và version; DELETE dùng `?version=...`; stale trả 409. List server có meta/summary/options theo contract; không tải toàn DB để mô phỏng getCatalog FE.

Source hiện chỉ providerKey=direct; admin cấu hình URL HTTP(S), HTTPS ngoài Development. API không tải/proxy/chuyển mã video hoặc SRT. Nguồn enabled hết hạn bị loại khỏi Playback/hasPlayback. FE cần mapper/player riêng cho HLS/SRT.

POST `/common/episodes/:id/view-sessions` với positionSeconds khi bắt đầu phát; sau ít nhất 30 giây và vị trí tăng 30 giây, POST `/common/view-sessions/:id/confirm`. View được chống trùng theo anime/viewer/bucket30phút, dùng chung Home/Dashboard; GET playback không tăng view. Guest giữ cookie viewer; dữ liệu này không phải hệ chống gian lận hoàn chỉnh. Các path có prefix `/api/v1`.
