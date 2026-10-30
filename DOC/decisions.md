# Quyết định và câu hỏi còn mở

## Đã thống nhất theo trao đổi

| Nội dung | Trạng thái |
| --- | --- |
| Mục tiêu là web xem anime hoạt động thực tế | Đã xác nhận |
| Chưa có nguồn phim/API | Đã xác nhận |
| Làm giao diện trước, nối BE sau | Đã xác nhận |
| Source chung trong Anime-Web, tách FE/BE/DOC | Đã tạo thư mục |
| Thảo luận và đọc tài liệu trước khi code màn hình | Đang áp dụng; đã cho phép thiết lập thư viện FE |
| Dùng pnpm và lockfile chung tại SRC | Theo AGENTS.md |
| Tổ chức source FE theo Bulletproof React | Yêu cầu 2026-10-29; app/routes, app/router.tsx, config/paths.ts, feature độc lập và shared; xem DOC/docs-FE/rules/fe-structure.md |
| Dùng React Router, quản lý tập trung tại FE/src/routes và có rule cho lần generate sau | Xác nhận 2026-10-28; DOC/docs-FE/rules/routes.md |
| Khách tìm kiếm, xem phim qua API /common | Xác nhận 2026-10-24 |
| Thư viện và đăng bình luận yêu cầu đăng nhập | Xác nhận 2026-10-24 |
| API phải có thiết kế role và permission | Xác nhận 2026-10-24; mô hình chi tiết còn là đề xuất |
| Cài Tailwind và Bootstrap 5 bằng pnpm | Yêu cầu 2026-10-24; đã tích hợp trên nền React + TypeScript + Vite |
| Ưu tiên class; style riêng chỉ khi cần; có style common | Yêu cầu 2026-10-24; quy ước chi tiết tại rules/styling.md |
| Tập trung quy định generate màn hình trong DOC/docs-FE/rules | Yêu cầu 2026-10-24; prompt thực thi giữ trong DOC/docs-FE/prompts |

## Tổ chức tài liệu ngày 2026-10-29

Theo yêu cầu người dùng: tài liệu FE chuyển vào `DOC/docs-FE`, bổ sung tài liệu BE tại `DOC/docs-BE`. `DOC/readme.md` là mục lục chung; API/entity, roadmap và quyết định dùng chung giữ tại `DOC`. Lịch sử kiểm chứng FE được giữ nguyên nội dung. Chưa lựa chọn framework/database hoặc triển khai BE.

## Quyết định BE ngày 2026-10-30

Người dùng chọn C# và đồng ý phương án được đề xuất: ASP.NET Core Web API dùng Controller, PostgreSQL, Entity Framework Core; một backend chia theo feature. Dùng .NET SDK/NuGet cho BE; pnpm và lockfile chung tại SRC giữ cho FE/công cụ JavaScript. Chưa yêu cầu triển khai code trong lượt viết tài liệu này.

Baseline kỹ thuật triển khai theo quyền lựa chọn đã giao: .NET 10 LTS, EF Core 10 với Npgsql tương thích, xUnit và dotnet format. Pin patch/SDK cụ thể khi setup; không coi đây là phiên bản đã cài. Cơ chế phiên và các nghiệp vụ còn mở vẫn cần đặc tả riêng. Chi tiết tại [setup BE](docs-BE/setup.md) và [kiến trúc BE](docs-BE/architecture.md).

## Quy tắc Anime xác nhận ngày 2026-10-30

Người dùng xác nhận dùng các mặc định khi generate feature Anime: chỉ công khai anime published; tìm không phân biệt hoa/thường theo title và alternativeTitles; mặc định mới nhất trước; trang vượt cuối trả danh sách rỗng. publicationStatus được tách khỏi status phát hành, mặc định draft. Các chi tiết kỹ thuật (newest theo releaseYear, khóa phụ id, giới hạn query, collation, lọc genres) được ghi tại [API contract](api-contract.md); không suy diễn thành quyết định cho module chưa triển khai.

## Quy tắc Mùa và tập xác nhận ngày 2026-10-30

Người dùng xác nhận mỗi anime có nhiều mùa; phim điện ảnh dùng một mùa/một tập; chỉ trả mùa thuộc anime published và tập published. Thứ tự đọc dùng sortOrder rồi id; không suy ra từ số tập. Các chi tiết DTO/validation/duration/timestamp và hasPlayback được ghi tại [API contract](api-contract.md). Đây là feature metadata, chưa triển khai nguồn phát.

## Các đề xuất nghiệp vụ còn mở

| Vấn đề | Đề xuất ban đầu | Ảnh hưởng |
| --- | --- | --- |
| Giao diện | Nền tối; màu nhấn chờ chọn | Tokens, thiết kế màn hình |
| Thời điểm có đăng nhập thật | FE mô phỏng guest/member trước; BE xác thực thật sau | Thư viện và gửi bình luận chỉ mở cho trạng thái member |
| Phân quyền chi tiết | RBAC với UserRole/RolePermission, quyền own kiểm tra ownership | Chi tiết role moderator/admin và cách xác thực chưa chốt |
| Bình luận | Guest đọc; member tạo và sửa/xóa của mình | Đọc công khai, sửa/xóa và chính sách duyệt là đề xuất |
| Trang quản trị | Bổ sung khi triển khai BE | Phạm vi và thời gian |
| Xác thực BE và hạ tầng | Stack C#/ASP.NET Core/PostgreSQL/EF Core đã chốt; cookie/token và hosting chưa chọn | Vòng đời phiên, triển khai và vận hành |
| Thương hiệu | Chưa chọn tên/logo chính thức | Không mặc định dùng tên Kaze từ bản nháp cũ |
| Phát hành | Chưa chọn hosting và audience | Chỉ bàn sau khi có bản chạy và yêu cầu triển khai |

## Cách cập nhật

Khi có lựa chọn được xác nhận, ghi ngày, quyết định, lý do và tài liệu chịu ảnh hưởng. Không ghi một gợi ý của trợ lý thành quyết định của người dùng.

Các tài liệu hiện tại là bản đề xuất tổng thể, chưa phải ước lượng chi phí hoặc cam kết thời hạn.
