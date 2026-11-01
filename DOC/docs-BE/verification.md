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

## 2026-10-30 — Feature Mùa và tập

- Thực thi module-generation.md trong repo New folder/AnimeWeb, dùng nền/Anime hiện có, không sửa FE hoặc ghi sang SRC/Anime-Web. Theo yêu cầu người dùng, không lặp kiểm tra branch/Git status.
- Người dùng xác nhận mô hình anime nhiều mùa, movie một mùa/một tập, chỉ đọc mùa thuộc anime published và tập published. Bổ sung contract về sortOrder/id, pagination, null duration, UTC publishedAt, ID/validation, lỗi 404 và hasPlayback=false trong feature metadata.
- Thêm Season/Episode, EF configurations và InitialEpisodes; FK restrict từ Anime tới Season tới Episode, check number/sortOrder/status/duration và publishedAt bắt buộc cho published. Không sửa SQL migration cũ hoặc chèn demo qua migration.
- Có GET common/anime/:id/seasons, common/seasons/:id/episodes và common/episodes/:id. DTO detail kèm animeId/animeSlug/seasonId, không trả navigation/entity hoặc URL nguồn phát. Dùng chung PageQuery với Anime; kiểm tra hồi quy Anime vẫn đạt.
- Seed Development explicit bổ sung 5 mùa/8 tập khi hai bảng còn rỗng và tìm thấy đúng demo parents. Có nhiều mùa, tập đặc biệt số 1.5/ID không liên tiếp, hai tập cùng sortOrder, mùa trống, draft và tập published dưới anime draft. Gọi lại không thay đổi dữ liệu đã có. Không seed vào database dev trong lượt kiểm tra.
- `dotnet ef migrations add InitialEpisodes --project src/AnimeWeb.Api --startup-project src/AnimeWeb.Api --output-dir Infrastructure/Persistence/Migrations`: PASS với connection string fixture. Đã review migration chỉ tạo Seasons/Episodes và index/constraint.
- Lượt PostgreSQL đầu không kết nối được vì Docker Engine đang tắt; đã khởi động Docker Desktop và đợi đúng Compose test container healthy rồi chạy lại. 43 test không cần PostgreSQL chạy đạt độc lập. Fixture chỉ dọn schema khi schema đã tạo thành công để tránh lỗi cleanup phụ khi database không khả dụng.
- Sau khi Docker sẵn sàng, phát hiện một assertion test đòi foreign_key_violation (23503) khi xóa parent bị RESTRICT; PostgreSQL 18 trả restrict_violation (23001). Đã đối chiếu tài liệu PostgreSQL và sửa assertion, không thay constraint.
- `dotnet test AnimeWeb.slnx` với ANIMEWEB_TEST_DATABASE fixture: PASS 65/65, skipped 0. Gồm 43 test nền/validation và 22 PostgreSQL cases; kiểm tra season/episode API, private ancestors, empty resources, pagination lớn, thứ tự, UTC, null duration, movie convention, DB constraints và regression Anime.
- Catalog fixture nâng từ InitialCatalog đã chứa 7 anime lên InitialEpisodes và xác nhận số anime giữ nguyên. Migration test từ database rỗng xác nhận đủ ba migration và apply lại idempotent. Episode seed chạy hai lần, giữ đúng 5 mùa/8 tập.
- `dotnet format AnimeWeb.slnx --no-restore`, `dotnet format AnimeWeb.slnx --verify-no-changes --no-restore`: PASS. `dotnet build AnimeWeb.slnx --no-restore`: PASS, 0 warning/0 error. `dotnet restore AnimeWeb.slnx --locked-mode`: PASS.
- `dotnet ef migrations has-pending-model-changes --project src/AnimeWeb.Api --startup-project src/AnimeWeb.Api --no-build`: PASS, model khớp migration.
- `scripts/test-database.ps1`: PASS 22 PostgreSQL cases; script dừng đúng test container sau kiểm tra, không chạm volume/dev hoặc container khác.
- CLI Development --seed-demo hai lần trên fixture: lần đầu chèn catalog và mùa/tập; lần sau báo có dữ liệu và không thay đổi. Kestrel smoke trên 127.0.0.1:5209 xác nhận seasonCount=3, main episodeTotal=4, pageSize=2 trả 2 item, special number=1.50, hasPlayback=false; truy cập tập dưới anime hidden trả 404. Đã dừng smoke host sau kiểm tra.

Giới hạn: feature này cung cấp metadata, chưa có Playback/provider/video, CRUD quản trị, auth hoặc tích hợp FE. Thời lượng chưa biết trả null, cần mapper khi FE tích hợp. Movie một mùa/một tập hiện là quy ước mô hình/seed; chưa có API ghi để thực thi workflow quản trị. Không apply migration hoặc seed lên dữ liệu thật/dev trong lượt kiểm tra.

## 2026-11-01 — Đối chiếu feature đã có với tài liệu BE/handoff

- Thực hiện trong repo `New folder/AnimeWeb`, chỉ sửa BE và tài liệu liên quan; không ghi sang SRC/Anime-Web, không sửa FE, không lặp kiểm tra branch/status theo yêu cầu trước đó. Đọc controller/service/DTO/configuration/migration/seed và test của nền, Anime, Mùa/tập; đối chiếu API contract, modules, rules, integration, quyền và handoff FE đã đồng bộ.

| Phạm vi đã có | Kết quả đối chiếu và hồi quy |
| --- | --- |
| Nền API | Giữ health không phụ thuộc DB, readiness chỉ kết nối, OpenAPI Development, CORS origin cụ thể, error envelope và cancellation; sửa key validation camelCase và metadata OpenAPI |
| Anime/Genres | Giữ sáu anime public trong fixture, title/alternativeTitles ILike/literal wildcard, filter AND, newest releaseYear và title collation C, pagination/large page, 404 draft/missing và genres public; không đổi contract sang mock FE |
| Mùa/tập | Giữ public theo cha/con, sortOrder/id, page/meta, tập đặc biệt, duration null, UTC publishedAt, animeId/animeSlug và hasPlayback=false; không trả URL video/navigation |
| Database/seed | Hồi quy migration từ rỗng/phiên bản trước, unique/check/FK restrict, seed explicit/idempotent; model khớp ba migration hiện có, không tạo migration mới |
| Quyền/tích hợp còn thiếu | Các API đã có là public AllowAnonymous; chưa có Auth/RBAC, me/admin hoặc HTTP adapter FE. user/manage/admin là quy định cho module tiếp theo, không cài fake auth hoặc tạo toàn bộ module đề xuất trong lượt rà soát |

- Phát hiện có kiểm chứng: error.fields còn tên CLR (`Name`, `PageSize`...) thay vì key FE camelCase; OpenAPI query còn PascalCase và thiếu response 400 của anime detail/season list/episode detail. Bổ sung assertion HTTP/schema trước sửa: nhóm 35 test có 21 fail, 14 pass, xác nhận lệch thực tế.
- Sửa đăng ký metadata validation theo System.Text.Json và DictionaryKeyPolicy camelCase (bao gồm lỗi record constructor); gắn tên FromQuery rõ q/genre/status/year/format/sort/page/pageSize. Bổ sung ProducesResponseType<ApiErrorResponse>(400) cho ba action thiếu. Không thay DTO dữ liệu thành view model FE, không thêm Home/Playback/admin/auth hoặc thay model dữ liệu.
- Tăng kiểm tra query/ID error.fields, slug sai bị từ chối trước DB, query names và schema 400 trong OpenAPI. Một lượt sửa đầu vẫn còn key record constructor Name; sau bổ sung dictionary naming policy, nhóm không PostgreSQL đạt 49/49. Sau thêm hai case slug, kết quả toàn bộ bên dưới là kết quả cuối.
- Docker Engine ban đầu chưa chạy; khởi động Docker Desktop rồi chỉ dùng Compose project `animeweb-be-tests`, loopback 54330, database/user animeweb_test với credential fixture công khai và tmpfs. Test schema GUID riêng, không dùng database dev hoặc dữ liệu thật.
- Chạy từ BE: `dotnet restore AnimeWeb.slnx --locked-mode`, `dotnet tool restore`: PASS; giữ nguyên version và lockfile.
- `dotnet format AnimeWeb.slnx --no-restore`, `dotnet format AnimeWeb.slnx --verify-no-changes --no-restore`: PASS.
- `dotnet build AnimeWeb.slnx --no-restore`: PASS, 0 warning/0 error.
- `dotnet ef migrations has-pending-model-changes --project src/AnimeWeb.Api --startup-project src/AnimeWeb.Api --no-build` với cấu hình fixture: PASS, không có thay đổi model chưa migration.
- `dotnet test AnimeWeb.slnx --no-build --no-restore --verbosity quiet` với ANIMEWEB_TEST_DATABASE trỏ fixture: PASS **73/73**, skipped 0 (51 test nền/validation/OpenAPI và 22 PostgreSQL cases). Sau test đã dừng đúng container test và khôi phục biến môi trường của tiến trình lệnh.

Giới hạn: chưa kiểm thử tích hợp FE/player/media thật vì chưa có adapter/Playback. Duration nullable, format mở rộng, options/summary/aggregate và các workflow admin còn tuân theo phạm vi/quyết định trong handoff/contract; không tự thêm endpoint đề xuất. Không chạy migration hoặc seed vào dev/production, không đọc .env/credentials hoặc gọi provider/API/model thật. Bằng chứng lượt này là WebApplicationFactory/PostgreSQL test, không phải smoke Kestrel hoặc deployment mới.

## 2026-11-01 — Triển khai các feature BE còn thiếu

- Repo duy nhất `New folder/AnimeWeb`; giữ các thay đổi rà soát trước đó, không sửa FE, không ghi sang SRC/Anime-Web. Người dùng yêu cầu code toàn bộ feature BE còn thiếu và xác nhận “Dùng bộ mặc định đề xuất” trước code phụ thuộc. Quyết định/endpoint/DTO v0.3 được ghi tại API contract; current-status.md tách hiện trạng BE khỏi FE/media/vận hành chưa làm.
- Auth thật: Account/PasswordHasher, bearer opaque 32-byte random, DB chỉ token hash, hết hạn 7 ngày, logout/revoke-all khi đổi mật khẩu. Login/change-password khóa account trong transaction; session, blocked và permission hiệu lực đọc từ DB mỗi request. RBAC user/manage/admin không wildcard; register không nhận quyền client. Rate limit IP global/auth, lỗi JSON 401/403/429; test không cài fake auth ở runtime.
- Library/progress own, q/sort/page/summary, latest-progress watching và đơn vị anime/episode; optimistic version/409, duration null, bỏ favorite/library giữ progress. Comments public visible/page, own/update/delete, deleted body null, moderation reason/audit/version, không restore deleted.
- CRUD admin Anime/Genre/Season/Episode/Source/Subtitle, lookup/detail/options, publication riêng release status, publishedAt server gán lần đầu và giữ khi tái xuất bản. Movie một mùa/một tập được kiểm tra dưới khóa anime; single default subtitle qua khóa source/transaction + partial unique index. FK restrict, unique names/slugs, version và rollback khi tài nguyên vẫn được tham chiếu. Xóa anime draft chỉ dọn liên kết genre, không xóa genre/nội dung con.
- Playback direct provider interface/fake, nguồn enabled chưa hết hạn, hasPlayback và trước/sau xuyên mùa; không proxy/fetch media. Home/related/options/Dashboard projections và ranking chung từ ViewEvents; view start/confirm theo server time và delta position, owner viewer, expiry 10 phút và unique bucket30phút/idempotent. Users chỉ list/detail/summary, không mutation tài khoản.
- CLI bootstrap admin explicit, không tài khoản/mật khẩu mặc định, không tự chạy lúc startup. Test service bootstrap trên schema riêng xác nhận tạo lần đầu/no-op lần sau và không nâng quyền user đăng ký. Lượt này không gọi bootstrap CLI với cấu hình người dùng.
- Migration `20261101081745_CompleteBackendFeatures` bổ sung schema/RBAC seed cấu hình/version/subtitle, giữ Synopsis kiểu text. Khi điều chỉnh migration nháp, thao tác EF remove đã dùng trạng thái assembly/snapshot chưa đồng bộ và ảnh hưởng file migration cũ trong working tree; đã khôi phục nguyên bản từ HEAD và hiệu chỉnh migration nháp, không apply bước điều chỉnh lên database. Kiểm tra cuối: cả sáu file source/designer của ba migration cũ khớp HEAD từng byte, model khớp snapshot, test nâng cấp dữ liệu đạt.
- Fixture catalog kiểm tra baseline → InitialCatalog, chèn bản ghi theo schema cũ, nâng lên đủ bốn migration, xác nhận synopsis/version/subtitle được bảo toàn rồi seed demo trên schema GUID riêng. Test từ database rỗng kiểm tra bốn migration/idempotent. Không đổi lockfile hoặc thêm dependency/NuGet mới.
- Trong các lượt test phát hiện một query order sau DTO projection không dịch được sang SQL, đã chuyển order trước projection; analyzer xUnit yêu cầu Assert.Single predicate đã sửa. Thêm DTO trả về rõ kiểu và convention lỗi làm lộ thiếu response 200 trong OpenAPI; bổ sung suy kiểu success và kiểm tra schema cho endpoint private. Những lỗi này được sửa trước kết quả cuối bên dưới.
- `dotnet restore AnimeWeb.slnx --locked-mode`, `dotnet tool restore`: PASS.
- `dotnet format AnimeWeb.slnx --no-restore`, `dotnet format AnimeWeb.slnx --verify-no-changes --no-restore`: PASS sau thay đổi cuối.
- `dotnet build AnimeWeb.slnx --no-restore --verbosity quiet`: PASS, 0 warning/0 error.
- `dotnet ef migrations has-pending-model-changes --project src/AnimeWeb.Api --startup-project src/AnimeWeb.Api --no-build`: PASS, model không còn thay đổi chưa migration.
- `dotnet test AnimeWeb.slnx --no-build --no-restore --verbosity quiet` với fixture PostgreSQL: PASS **104/104**, skipped 0 (72 không PostgreSQL, 32 PostgreSQL). Gồm hồi quy 73 test cũ và 31 case mới; schema/role policy/status errors, credential hash/email/unknown fields, revoke/logout/expiry/blocked, guest/user/manage/admin/live role change, ownership/version/latest/counts, comments/moderation, admin publication/relations/movie, default-track/concurrent writes, provider fake 503, view early/dedup/owner, Home/Dashboard ranking, bootstrap và expired sources.
- Kiểm tra UTF-8/đường dẫn liên kết nội bộ và diff whitespace: PASS; giữ line ending cũ của API contract/entities và giữ nguyên lịch sử verification. PostgreSQL dùng đúng project animeweb-be-tests, loopback 54330, fixture credential công khai/tmpfs; đã dừng container test và khôi phục biến môi trường của tiến trình lệnh sau test.

Giới hạn: chưa deploy hoặc apply migration/seed/bootstrap vào dev/production; chưa sửa/tích hợp FE, chưa phát media thật. Direct provider trả metadata; HLS/SRT, MIME/range/CORS media cần player/hạ tầng tương ứng. Limiter hiện trong một tiến trình, view stats có thể bị client giả lập/đổi viewer và không là hệ chống gian lận; chưa có job dọn session/view session định kỳ. Kiểm chứng là HTTP WebApplicationFactory + PostgreSQL/fake provider, không phải Kestrel/media production hoặc pentest. Không đọc .env/credentials, không gọi provider/API/model thật.
