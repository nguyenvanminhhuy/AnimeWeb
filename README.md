# Anime Web

React/Vite FE, ASP.NET Core BE và PostgreSQL. FE mặc định gọi API thật qua proxy cùng origin. Hướng dẫn chạy đầy đủ: [SETUP.md](SETUP.md).

## Chạy trên Windows với Docker Desktop

Mở Docker Desktop, rồi chạy trong terminal tại `Anime-Web/BE`:

```powershell
dotnet run
```

Lệnh này tự bật PostgreSQL dev và chạy API, không tự migrate/seed. Khi clone lần đầu hoặc cần cập nhật schema/dữ liệu mẫu, chủ động chạy `dotnet run -- -InitializeCatalog`. Nếu chưa cấp ANIMEWEB_DB_PASSWORD và chưa có dev volume, script tạo mật khẩu ngẫu nhiên, lưu bằng Windows DPAPI tại BE/.local (gitignore), dùng lại trên cùng Windows account. Không tự đổi mật khẩu volume đã có.

Terminal FE riêng tại `Anime-Web/FE`:

```powershell
pnpm run dev
```

FE: http://127.0.0.1:5173. BE: http://localhost:5200. FE gửi /api/v1/... qua Vite tới BE. Build static khi triển khai cần reverse proxy /api tới BE; Vite proxy chỉ phục vụ dev/preview.

Nếu mới clone, chạy `pnpm install --frozen-lockfile` tại SRC một lần trước khi chạy FE. Ctrl+C trong mỗi terminal dừng FE/BE; database vẫn giữ dữ liệu. Dừng PostgreSQL bằng `docker compose stop` tại BE khi không dùng.

## File cấu hình cần biết

| Trách nhiệm | File |
| --- | --- |
| Chạy BE/PostgreSQL Docker | BE/AnimeWeb.Local.csproj, BE/scripts/LocalLauncher.cs, BE/scripts/start-local.ps1, BE/compose.yaml |
| Địa chỉ BE | BE/src/AnimeWeb.Api/Properties/launchSettings.json |
| Proxy FE sang BE | FE/vite.config.ts |
| Mặc định API thật/chế độ mock | FE/src/config/api.ts, FE/src/lib/api/repositories.ts |
| HTTP và token | FE/src/lib/api/backend/transport.ts, credentials.ts |
| DTO/mapping API | FE/src/lib/api/backend/types.ts, mappers.ts, repositories.ts |
| PostgreSQL trực tiếp không Docker | BE/setup.ps1, BE/start.ps1 (phương án khác) |

## DBeaver

Host 127.0.0.1, port **54329**, database/user **animeweb_dev**. Nếu dùng mật khẩu tự tạo, xem trong terminal cá nhân:

```powershell
.\Anime-Web\BE\scripts\show-database-password.ps1
```

Mật khẩu này không được commit. Nếu tự cấp ANIMEWEB_DB_PASSWORD thì dùng giá trị đã cấp. Database Docker độc lập database Windows native port 5432.

## Tài khoản và dữ liệu

Đăng ký/đăng nhập dùng BE, token lưu trong sessionStorage theo tab; reload khôi phục profile qua /auth/me, 401 xoá phiên. Không nhập dữ liệu demo localStorage vào BE. Đăng ký luôn role user; admin đầu tiên tạo chủ động bằng CLI trong [BE README](BE/README.md#admin-đầu-tiên-và-xác-thực).

Seed là catalog hư cấu, chưa có nguồn phim thật. Có dữ liệu database không đồng nghĩa player phát được video. API/DTO tại [tham chiếu BE](DOC/docs-BE/feature-reference.md), kết nối FE tại [backend-compatibility.md](DOC/docs-FE/backend-compatibility.md).

Mock chỉ bật chủ động trong dev bằng biến môi trường của terminal FE (không cần file .env):

```powershell
$env:VITE_API_MODE = 'mock'
pnpm --filter anime-web-fe run dev
```

Xoá biến bằng Remove-Item Env:VITE_API_MODE rồi khởi động lại FE để dùng BE. Không chạy dev server thứ hai trên cùng port; cache Vite được tách theo backend/mock.
