# Thiết lập nền BE bằng C#

Ngày 2026-10-30, người dùng chọn phương án **C# + ASP.NET Core Web API dùng Controller, PostgreSQL và Entity Framework Core**, một backend tổ chức theo feature. Chỉ cập nhật tài liệu trong lượt này; `BE/` chưa có code. Không hỏi lại việc chọn C#/database/ORM khi thực thi generate.

## Baseline triển khai

| Thành phần | Quy ước |
| --- | --- |
| Runtime | .NET 10 LTS, target `net10.0`; C# theo SDK |
| HTTP | ASP.NET Core Web API, ControllerBase + ApiController |
| Dữ liệu | PostgreSQL, EF Core 10, provider Npgsql.EntityFrameworkCore.PostgreSQL tương thích EF Core 10 |
| Kiểm thử | xUnit; Microsoft.AspNetCore.Mvc.Testing cho HTTP integration |
| Dependency | NuGet qua dotnet CLI; dotnet-ef là local tool |
| Format | dotnet format và .editorconfig |
| Kiến trúc | Một API project chia Features, test project riêng |

.NET 10 là bản LTS theo [chính sách Microsoft](https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core). Dùng patch ổn định tương thích tại thời điểm setup, ghi chính xác SDK vào `BE/global.json`, version NuGet trong csproj và tool manifest; không dùng preview hoặc tự nâng major. Chọn PostgreSQL major còn hỗ trợ, tương thích provider, rồi ghi version/image tag cụ thể lúc setup; không dùng tag latest cho môi trường tái lập.

## Cấu trúc và công cụ

Theo [architecture.md](architecture.md), solution dự kiến `AnimeWeb.slnx`, API tại `src/AnimeWeb.Api`, test tại `tests/AnimeWeb.Api.Tests`. Đường dẫn bên dưới là đích thiết kế, **chưa có file để chạy**. Nếu repo đã có tên khác khi thực thi, dùng tên thực tế và cập nhật lệnh.

Chạy từ `Anime-Web/BE` sau khi solution đã được tạo:

```powershell
dotnet --info
dotnet restore AnimeWeb.slnx
dotnet tool restore
dotnet format AnimeWeb.slnx
dotnet format AnimeWeb.slnx --verify-no-changes --no-restore
dotnet build AnimeWeb.slnx --no-restore
dotnet test AnimeWeb.slnx --no-build --no-restore
dotnet run --project src/AnimeWeb.Api/AnimeWeb.Api.csproj
```

Khởi tạo API bằng template có `--use-controllers --framework net10.0`; không để template mặc định tạo Minimal API thay cho cấu trúc đã chọn. Đăng ký AddControllers/MapControllers, DI, DbContext và pipeline lỗi. Đăng ký local tool dotnet-ef tương thích EF Core, có Microsoft.EntityFrameworkCore.Design trong API để chạy migration.

BE dùng .NET SDK/NuGet, không tạo package.json hoặc đưa BE vào pnpm workspace. pnpm@11.10.0 và lockfile chung tại SRC tiếp tục áp dụng cho FE/công cụ JavaScript. Đây là phương án đã được người dùng chấp thuận cho BE C#.

## Cấu hình local

Thiết kế tên cấu hình: `ConnectionStrings:AnimeWeb`, danh sách origin FE được phép trong `Cors:AllowedOrigins`, port qua cấu hình host ASP.NET Core. Dùng placeholder trong tài liệu; không đọc `.env`, appsettings có bí mật, user-secrets hoặc credentials khi kiểm tra. Không commit mật khẩu/connection string thật.

Test host cung cấp cấu hình giả, database PostgreSQL test riêng và fake provider. Cấu hình bắt buộc thiếu phải thất bại rõ ràng khi khởi động, không log giá trị bí mật. Không tự chạy migration/reset dữ liệu thật khi ứng dụng start. CORS cấu hình theo origin FE thực tế, không mặc định wildcard kèm credentials.

## Đầu ra khi được yêu cầu triển khai nền

1. Solution/API/test project tối thiểu, Nullable enabled, cấu hình và xử lý lỗi theo contract.
2. Controller và route được đăng ký; nếu thêm health endpoint phải đặc tả path/DTO trong API trước.
3. DbContext, migration/seed theo đúng phạm vi, local tool manifest, cấu hình test và hướng dẫn chạy không chứa bí mật.
4. Format/build và smoke/integration test chạy thật; ghi lệnh, kết quả và giới hạn vào verification BE.

Cơ chế auth cookie/token, endpoint auth, publication anime và xung đột progress vẫn cần đặc tả khi tới module liên quan. Không chặn phần nền độc lập vì các lựa chọn nghiệp vụ chưa ảnh hưởng nó.
