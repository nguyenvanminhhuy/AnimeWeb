# Bằng chứng kiểm chứng BE

## 2026-10-30 — Thiết lập nền C#/ASP.NET Core

- Repo root được kiểm tra trước khi sửa: `C:/Users/huyca/OneDrive/Máy tính/HardCore October/New folder/AnimeWeb`; branch Be-Dev, working tree ban đầu sạch (ahead origin/Be-Dev 2 commit). Mọi file source/tài liệu sửa trong repo này; không ghi sang SRC/Anime-Web, không sửa FE.
- Tạo `BE/AnimeWeb.slnx`, API Controller, xUnit test project, DbContext, cấu hình có validate startup, lỗi JSON chung, CORS theo origin, health/readiness và OpenAPI Development.
- SDK 10.0.403; ASP.NET OpenAPI/Mvc.Testing, EF Core/Design/Relational và dotnet-ef 10.0.14; Npgsql provider 10.0.3. Pin SDK/tool/package; NuGet lockfile theo project. Không thêm package pnpm cho BE.
- Docker Engine ban đầu chưa chạy; khởi động bằng `docker desktop start`. Pull `postgres:18.6-bookworm`, tạo Compose project test riêng `animeweb-be-tests`, database/user animeweb_test, loopback port 54330, tmpfs. Không thao tác container hoặc dữ liệu của dự án khác.
- `dotnet ef migrations add InitialInfrastructure --project src/AnimeWeb.Api --startup-project src/AnimeWeb.Api --output-dir Infrastructure/Persistence/Migrations`: PASS với cấu hình fixture. Migration baseline không có bảng nghiệp vụ; chưa có domain seed. Không chạy migration database dev/production.
- Lượt kiểm tra đầu phát hiện xung đột EF runtime/Relational giữa project và test; đã thêm direct reference cùng phiên bản 10.0.14. Một test validation trả 500 do đặt Required trên property record thay vì constructor parameter; đã sửa test DTO và chạy lại.
- Chạy từ BE: `dotnet format AnimeWeb.slnx --no-restore`, `dotnet format AnimeWeb.slnx --verify-no-changes --no-restore`: PASS.
- `dotnet build AnimeWeb.slnx --no-restore`: PASS, 0 warning, 0 error.
- `dotnet restore AnimeWeb.slnx --locked-mode`, `dotnet tool restore`: PASS.
- `dotnet test AnimeWeb.slnx` với biến ANIMEWEB_TEST_DATABASE trỏ đúng fixture PostgreSQL: PASS 21/21, không skip. Gồm health không phụ thuộc DB, readiness mất DB 503, lỗi 404/405/validation/malformed JSON/exception không lộ chi tiết, CORS, OpenAPI, cấu hình bắt buộc và migration/readiness PostgreSQL.
- Kiểm tra cuối không cấp fixture: `dotnet test AnimeWeb.slnx --no-build --no-restore`: PASS 20, skipped 1 PostgreSQL case có lý do rõ. `scripts/test-database.ps1`: PASS 1 PostgreSQL case; kiểm tra migration apply, idempotent, không còn pending và readiness 200; script dừng container test sau kiểm tra.
- Chạy Kestrel bằng `dotnet run --project src/AnimeWeb.Api/AnimeWeb.Api.csproj --no-build --no-restore --no-launch-profile -- --urls http://127.0.0.1:5207` với cấu hình PostgreSQL fixture và Development. Invoke-RestMethod xác nhận health=ok, readiness=ready, OpenAPI=3.1.1. Đã dừng host sau smoke test.
- Script start-local.ps1 đã kiểm tra cú pháp PowerShell; chưa chạy database dev vì mật khẩu local do người dùng tự cấp. Compose dev và test tách file/project/port; script không tự apply migration hoặc xóa volume dev.

Giới hạn: chưa có endpoint nghiệp vụ, authentication scheme, entity/schema/seed domain hoặc provider phim thật. Readiness hiện chỉ kiểm tra kết nối PostgreSQL, không chứng minh schema nghiệp vụ sẵn sàng. Kiểm tra không đọc .env/credentials và không gọi API/model thật; chỉ restore package, pull image và dùng fixture/local host.

## 2026-10-30 — Feature Anime

- Chạy prompt module-generation.md cho Anime trong repo `New folder/AnimeWeb`; dùng nền BE có sẵn. Theo yêu cầu mới, không lặp kiểm tra branch/Git status. Không sửa FE hoặc ghi sang SRC/Anime-Web.
- Người dùng xác nhận: chỉ public anime published, tìm title/alternativeTitles không phân biệt hoa/thường, mới nhất trước và trang vượt cuối rỗng. Contract ghi rõ newest theo releaseYear, ID làm khóa phụ, giới hạn/filter, sort title collation C và khác biệt với mock FE (bỏ dấu/clamp page).
- Thêm Anime/Genre/AnimeGenre, EF configuration, index, unique/check/foreign key, migration InitialCatalog; ba GET common/anime, common/anime/:slug và common/genres. Projection DTO không lộ publicationStatus/navigation; draft/không có cùng 404 ANIME_NOT_FOUND.
- Seed demo explicit Development: 6 anime published + 1 draft, 3 genres public + 1 draft-only. Migration không tự seed; catalog đã có dữ liệu không bị ghi đè. start-local.ps1 thêm cờ -InitializeCatalog để người dùng chủ động apply migration/seed trên database dev do script cấu hình; lượt kiểm tra không chạy cờ này với dev.
- `dotnet ef migrations add InitialCatalog --project src/AnimeWeb.Api --startup-project src/AnimeWeb.Api --output-dir Infrastructure/Persistence/Migrations`: PASS với cấu hình fixture. Migration đã review, không chèn demo hoặc thay bảng nền.
- `dotnet format AnimeWeb.slnx --no-restore` và `dotnet format AnimeWeb.slnx --verify-no-changes --no-restore`: PASS.
- `dotnet build AnimeWeb.slnx --no-restore`: PASS, 0 warning, 0 error. `dotnet restore AnimeWeb.slnx --locked-mode`: PASS.
- Lượt unit test đầu phát hiện test tạo ValidationContext khác instance DTO, đã sửa và chạy lại. Không phải lỗi validation runtime.
- `dotnet test AnimeWeb.slnx --no-build --no-restore` với ANIMEWEB_TEST_DATABASE trỏ đúng fixture loopback PostgreSQL: PASS 46/46, skipped 0. Gồm 34 test nền/validation và 12 PostgreSQL cases.
- PostgreSQL cases xác nhận upgrade từ InitialInfrastructure, seed không trùng, SQL filter/search tên khác, literal LIKE %, _ và ~, pagination/số trang rất lớn, sort ổn định, detail, draft/404, genre draft-only, unique slug anime/genre, unique cặp AnimeGenre, foreign key và year check. Fixture catalog dùng schema GUID riêng, kiểm tra prefix trước khi dọn; không chạm database dev.
- `scripts/test-database.ps1`: PASS 12/12 PostgreSQL cases; script dừng đúng container test sau kiểm tra.
- `dotnet ef migrations has-pending-model-changes --project src/AnimeWeb.Api --startup-project src/AnimeWeb.Api --no-build`: PASS (không có thay đổi model chưa migration) sau khi cấp connection string fixture. Lượt gọi thiếu cấu hình trước đó bị validator từ chối như thiết kế.
- Gọi CLI --seed-demo hai lần trên database test: lần đầu chèn catalog, lần sau báo có dữ liệu và không thay đổi. Chạy Kestrel trên 127.0.0.1:5208 với fixture; Invoke-RestMethod xác nhận filter kết hợp total=1, detail id=anime_demo_001, genres=3, page=99 trả mảng rỗng và giữ page=99. Đã dừng host sau smoke.
- Kiểm tra cú pháp PowerShell start-local.ps1 sau khi thêm tham số: PASS. Không cần formatter/build FE vì không sửa code FE.

Giới hạn hiện tại: FE chưa nối API; chưa có CRUD quản trị, mùa/tập, auth, library, comments, progress hoặc playback. Tìm kiếm chưa bỏ dấu và sắp title chưa phải từ điển tiếng Việt. Seed chỉ là nội dung hư cấu/ảnh minh họa, chưa có video thật. Chưa apply migration vào database dev hoặc dữ liệu thật trong lượt này.
