# Setup BE và FE trên Windows

## Docker Desktop (mặc định)

Mở Docker Desktop và đợi engine sẵn sàng. Trong terminal tại `Anime-Web/BE`, chạy hằng ngày:

```powershell
dotnet run
```

Launcher Windows tại BE/AnimeWeb.Local.csproj gọi scripts/start-local.ps1, tự bật PostgreSQL dev rồi chạy API tại localhost:5200. Lệnh thường không migrate/seed. Lần đầu clone hoặc cần cập nhật schema/catalog mẫu, chạy `dotnet run -- -InitializeCatalog` thay lệnh trên. Mật khẩu nhận từ ANIMEWEB_DB_PASSWORD nếu đã cấp; nếu chưa có dev volume, tự tạo mật khẩu ngẫu nhiên và lưu bằng Windows DPAPI trong BE/.local, dùng lại trên cùng Windows account. Volume cũ không bị đổi password/reset. Nếu đã có volume nhưng chưa có mật khẩu lưu, cấp password hiện tại qua environment.

Terminal FE khác tại `Anime-Web/FE`:

```powershell
pnpm run dev
```

FE mặc định gọi BE thật qua proxy /api tại http://127.0.0.1:5173; địa chỉ đích http://127.0.0.1:5200 cấu hình trong FE/vite.config.ts. Chọn adapter tại FE/src/lib/api/repositories.ts. Chi tiết [README.md](README.md).

Nếu mới clone, cài dependencies một lần bằng `pnpm install --frozen-lockfile` từ SRC. Ctrl+C dừng FE/BE trong terminal tương ứng; PostgreSQL vẫn chạy. Tại BE dùng `docker compose stop` để dừng database và giữ dữ liệu. Không cần chạy lại setup mỗi ngày.

DBeaver Docker: host 127.0.0.1, port **54329**, database/user **animeweb_dev**. Xem mật khẩu tự tạo bằng `.\Anime-Web\BE\scripts\show-database-password.ps1` trong terminal cá nhân; không cần đọc file mã hoá hoặc đưa mật khẩu lên Git. Nếu tự cấp environment, dùng mật khẩu bạn đã cấp.

## PostgreSQL cài trực tiếp (tuỳ chọn, không Docker)

BE dùng PostgreSQL cài trực tiếp trên Windows. FE dùng Vite/pnpm. DBeaver kết nối vào PostgreSQL để xem dữ liệu. Các script dưới không gọi Docker, không tự cài phần mềm hệ thống hoặc xoá database.

## Cài một lần

- PostgreSQL 18 cho Windows: [trang tải chính thức](https://www.postgresql.org/download/windows/). Cài server và command line tools, chọn port `5432`, ghi nhớ mật khẩu tài khoản `postgres`. PostgreSQL cần chạy dưới Windows service; có thể kiểm tra tại ứng dụng Services. Nếu chỉ có database trong Docker, cần cài server Windows trước.
- .NET SDK theo `BE/global.json` (10.0.403 hoặc patch tương thích).
- Node.js >=22.13 và pnpm@11.10.0 theo workspace SRC. DBeaver là công cụ quản lý, không thay PostgreSQL server.

## Setup dự án

Mở PowerShell tại `SRC`:

```powershell
.\Anime-Web\BE\setup.ps1 -SeedDemo
.\Anime-Web\FE\setup.ps1
```

BE hỏi mật khẩu bằng ô nhập ẩn. Script kiểm tra SDK/psql, kết nối PostgreSQL local, tạo `animeweb_dev` nếu chưa có, restore NuGet/tool và apply migration. `-SeedDemo` chủ động thêm catalog mẫu theo seeder hiện có; bỏ cờ này nếu không muốn dữ liệu mẫu. Seeder không tạo admin/password hoặc video. Setup có thể chạy lại, không drop/reset database.

FE kiểm tra Node/pnpm, chuyển về SRC rồi chạy `pnpm install --frozen-lockfile`. Không tạo lockfile/store riêng hoặc dùng package manager khác.

BE lưu **host/port/database/username** ở `BE/.local/native-settings.json`, đã gitignore. Không lưu password/connection string. Mỗi lần chạy BE sẽ hỏi lại mật khẩu, hoặc dùng `ANIMEWEB_DB_PASSWORD` nếu bạn đã cấp trong phiên terminal. Không cần tạo file `.env`.

Nếu PostgreSQL dùng port/user khác hoặc không được tìm thấy tự động:

```powershell
.\Anime-Web\BE\setup.ps1 -DbPort 5433 -DbUser postgres -PgBin 'C:\Program Files\PostgreSQL\18\bin' -SeedDemo
```

Username phải là tài khoản PostgreSQL đã có, đủ quyền tạo database (nếu chưa tồn tại) và quản lý schema đích. Script chỉ nhận host loopback; không dùng để migrate database cloud/production.

Chỉ kiểm tra phần mềm, không kết nối/migrate/cài dependencies:

```powershell
.\Anime-Web\BE\setup.ps1 -Check
.\Anime-Web\FE\setup.ps1 -Check
```

## Chạy hằng ngày

Terminal thứ nhất tại SRC:

```powershell
.\Anime-Web\BE\start.ps1
```

BE chạy tại `http://localhost:5200`. Script start không apply migration hoặc seed lại. Khi cập nhật schema, chạy lại setup chủ động. Ctrl+C dừng BE; PostgreSQL Windows service tiếp tục chạy.

Terminal thứ hai tại SRC:

```powershell
.\Anime-Web\FE\start.ps1
```

FE chạy tại `http://127.0.0.1:5173`; script từ chối nếu port đã dùng, không tự đổi cổng. Bạn cũng có thể vào `Anime-Web/FE` rồi chạy `pnpm run dev` như trước. Không chạy hai dev server cùng lúc.

**FE mặc định dùng API BE.** Dùng cả BE và FE để có dữ liệu; mock chỉ bật chủ động bằng VITE_API_MODE=mock trong dev. Xem [trạng thái tích hợp](DOC/docs-FE/backend-compatibility.md).

Nếu Windows chặn script do execution policy, có thể chạy trong một process riêng, ví dụ:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Anime-Web\BE\setup.ps1 -SeedDemo
```

Thay đường dẫn file cho FE/start khi cần. Cách này không thay execution policy của toàn máy.

## DBeaver

Tạo connection PostgreSQL:

| Field | Mặc định native |
| --- | --- |
| Host | 127.0.0.1 |
| Port | 5432 |
| Database | animeweb_dev |
| Username | postgres |
| Password | Mật khẩu tài khoản PostgreSQL Windows |

Nếu setup bằng tham số khác, dùng đúng giá trị đã chọn. Database native này độc lập với volume Docker cũ ở port 54329; script không chuyển dữ liệu từ Docker. Các script Compose cũ vẫn được giữ ở BE/scripts/start-local.ps1 và compose.yaml.

## Kiểm chứng script

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Anime-Web\BE\scripts\test-native-setup.ps1
```

Kiểm thử chạy bản sao script trong thư mục tạm bên trong BE/.local, dùng executable giả cho dotnet/psql/createdb/node/pnpm. Kiểm tra trình tự lệnh, lỗi, mật khẩu không vào file/argv, khôi phục environment và pnpm workspace; không tạo database hoặc gọi API thật.
