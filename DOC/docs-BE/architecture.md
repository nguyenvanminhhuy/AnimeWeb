# Kiến trúc BE C# theo feature

Stack đã chốt ngày 2026-10-30: ASP.NET Core Web API dùng Controller, PostgreSQL, EF Core. Dùng một ứng dụng BE chia feature; chưa cần microservices, MediatR/CQRS hoặc nhiều project phân lớp. Cây dưới là thiết kế, chỉ tạo thành phần được sử dụng khi triển khai.

```text
BE/
├── AnimeWeb.slnx
├── global.json
├── .editorconfig
├── .config/dotnet-tools.json
├── src/AnimeWeb.Api/
│   ├── AnimeWeb.Api.csproj
│   ├── Program.cs
│   ├── Features/
│   │   ├── Anime/
│   │   │   ├── AnimeController.cs
│   │   │   ├── AnimeService.cs
│   │   │   ├── Anime.cs
│   │   │   └── Dtos/
│   │   ├── Episodes/
│   │   ├── Auth/
│   │   ├── Authorization/
│   │   ├── Library/
│   │   ├── Progress/
│   │   ├── Comments/
│   │   └── Playback/           # Provider interface + adapter
│   ├── Infrastructure/
│   │   └── Persistence/
│   │       ├── AnimeWebDbContext.cs
│   │       ├── Configurations/ # IEntityTypeConfiguration
│   │       ├── Migrations/
│   │       └── Seeding/
│   └── Shared/
│       ├── Configuration/
│       ├── Errors/
│       └── Pagination/
└── tests/AnimeWeb.Api.Tests/
    ├── AnimeWeb.Api.Tests.csproj
    ├── Unit/
    ├── Integration/
    └── Fixtures/
```

## Luồng và phụ thuộc

```text
HTTP → Controller/DTO validation → Authorization policy
     → Feature service → EF Core DbContext/PostgreSQL → Response DTO
                       → Playback provider adapter
```

Controller mỏng: binding, gọi service, trả HTTP. Service giữ nghiệp vụ và kiểm tra ownership gắn với truy vấn/thao tác ghi. DbContext scoped qua DI; service có thể dùng trực tiếp DbContext. Chỉ tách repository chuyên biệt khi có nhu cầu thực tế, không thêm generic repository/UnitOfWork chỉ bọc lại EF Core.

Shared chứa lỗi, cấu hình và kiểu phân trang; không giữ nghiệp vụ riêng của feature. Controller không gọi controller khác. Khi cần tương tác feature, dùng service/interface có trách nhiệm rõ; không tạo vòng phụ thuộc. Không serialize EF entity/navigation ra ngoài; project DTO từ query.

## Convention C# và HTTP

- File/type/namespace PascalCase; tham số/biến camelCase; interface có tiền tố I, method async có hậu tố Async. Không áp dụng kebab-case/alias @ của FE vào C#.
- Dùng async/await, CancellationToken xuyên từ request tới EF/HTTP provider. Không dùng .Result/.Wait() hoặc DbContext singleton.
- ControllerBase có ApiController và route rõ `/api/v1/common/...` hoặc `/api/v1/me/...`; dùng AddControllers/MapControllers. Xem [Microsoft Web API](https://learn.microsoft.com/en-us/aspnet/core/web-api/?view=aspnetcore-10.0).
- JSON camelCase; enum theo chuỗi đã định nghĩa trong API, không mặc định trả số/PascalCase. DTO thời gian UTC và ID string theo contract.
- Tùy biến lỗi validation tự động, lỗi auth và exception để trả cùng envelope `error` của dự án; không để ProblemDetails mặc định làm lệch contract. 204 không có body.
- Policy/authorization handler kiểm tra permission; lấy userId từ phiên/claims đã xác thực và kiểm tra trạng thái tài khoản. Common không bắt buộc đăng nhập nhưng phải lọc publication của cả cha/con.

## Playback và vận hành

Backend cấp thông tin phát, storage/CDN phân phối video. Interface provider và fake trong test; không mặc định proxy video. Không lưu URL phát tạm vào danh mục hoặc lịch sử.

Validate cấu hình khởi động, pipeline exception và request ID; log không chứa token, cookie, mật khẩu hoặc URL ký có bí mật. Dùng HttpClient qua IHttpClientFactory với timeout và CancellationToken cho adapter provider khi triển khai. CORS, health và giới hạn request phải có cấu hình/đặc tả cụ thể trong phạm vi được giao.
