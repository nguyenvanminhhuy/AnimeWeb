# AnimeWeb backend

Nền C#/.NET 10, ASP.NET Core Controller, EF Core và PostgreSQL. Chỉ có endpoint vận hành; chưa có API anime, auth, library, comments, playback hoặc progress. Source chia feature; chưa tạo domain model/seed trước khi chốt nghiệp vụ.

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
.\scripts\start-local.ps1
```

Script tạo/khởi động đúng Compose project `animeweb-be`, dựng connection string có escape ký tự đặc biệt và chạy API tại **http://localhost:5200**. Mật khẩu chỉ truyền qua environment, không ghi file. Dùng lại cùng mật khẩu nếu volume dev đã tồn tại; đổi biến môi trường không đổi mật khẩu của database đã khởi tạo. Script không tự apply migration hoặc xóa dữ liệu. Ctrl+C dừng API; database dev được giữ để tiếp tục làm việc.

- GET `/api/v1/health`: 200, `{ "data": { "status": "ok" } }`, không truy cập database.
- GET `/api/v1/health/ready`: 200 khi kết nối PostgreSQL được; 503 dạng error khi không kết nối được. Chưa kiểm tra schema nghiệp vụ.
- GET `/openapi/v1.json`: chỉ Development. Không cài Swagger UI.

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

Local tool dotnet-ef đã pin, migration khởi đầu `InitialInfrastructure` không có bảng nghiệp vụ; khi apply chỉ chuẩn bị lịch sử migration. Không tự seed tài khoản hoặc nội dung giả vào dev. Module catalog đầu tiên sẽ bổ sung model/configuration/migration/seed có ý nghĩa.

Khi cần tạo/apply migration, cấp `ConnectionStrings__AnimeWeb` cho database local/test đích đã xác định, rồi dùng:

```powershell
dotnet ef migrations list --project src/AnimeWeb.Api --startup-project src/AnimeWeb.Api
dotnet ef database update --project src/AnimeWeb.Api --startup-project src/AnimeWeb.Api
```

Không apply migration bằng connection string của môi trường chưa xác minh. Không dùng EnsureCreated thay migration. Xem [workflow generate](../DOC/docs-BE/prompts/module-generation.md) để thêm từng module; các quyết định auth/publication/progress chưa chốt không được giả làm tính năng đã hoàn thành.
