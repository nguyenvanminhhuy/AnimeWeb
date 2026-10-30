# Kiến trúc source

Cấu trúc FE áp dụng [Bulletproof React](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md) từ 2026-10-29. Xem [cây source và ranh giới](fe-structure.md), [route](routes.md) và [mục lục rules](readme.md). Đây là tổ chức source; API/entity và lựa chọn BE vẫn theo tài liệu chung của dự án.

## FE

app/app.tsx ghép AppProvider và RouterProvider; app/router.tsx đăng ký route, app/routes ghép feature thành màn hình. config/paths.ts giữ pattern, URL builders và safeReturnTo. URL công khai và hành vi các màn hình đã triển khai giữ nguyên.

Chiều import: app dùng features và shared; features dùng chính feature và shared; shared không dùng app/features. Ghép nhiều feature tại app thay vì import chéo. Kiểu entity dùng nhiều nơi ở types; hàm thuần dùng chung ở utils; state phiên dùng chung ở stores/session.tsx.

Repository chung được gom ở lib/api để các feature dùng cùng contracts/adapters; lib/api/repositories.ts chọn adapter. Không đọc fetch/storage rải rác trong JSX. Adapter localStorage có schema và xử lý lỗi nằm ở lib/storage. testing/mocks/fixtures hiện được dùng cho chế độ demo, kể cả bản production chưa có API.

```text
app/routes → feature hook → lib/api contract + selected adapter
shared components/config/lib/stores/types/utils/testing → không phụ thuộc feature/app
```

Tách phần dùng chung chỉ khi có trách nhiệm rõ. Không thêm dependency hoặc folder rỗng chỉ để giống ví dụ. Không tạo barrel export toàn feature. Script check:architecture chạy trong build để kiểm tra đường dẫn/casing, các chiều import và cycle.

FE giữ React + TypeScript + Vite, React Router, Tailwind/Bootstrap và native video. Trang chủ, Khám phá, Chi tiết, Library, Auth và Watch đã có UI; Watch chưa có asset video để kiểm chứng playback thực tế. Thông tin auth demo/permission vẫn là mô phỏng cục bộ.

## Luồng xử lý BE

```text
ASP.NET Core Controller → Validation / authorization → Feature service → EF Core DbContext → PostgreSQL
```

Module playback lấy nguồn từ nhà cung cấp hoặc kho nội dung đã cấu hình, trả URL truy cập phù hợp. Quyền quản trị do BE kiểm tra; ẩn nút ở FE không đủ để bảo vệ thao tác.

## State và lưu trữ

| Loại dữ liệu | Vị trí đề xuất |
| --- | --- |
| Từ khóa, bộ lọc, trang hiện tại | URL query |
| Modal đang mở, chế độ rạp | State giao diện |
| Danh mục và chi tiết anime | Lớp lấy dữ liệu/cache FE |
| Yêu thích, tiến độ khi chưa có BE | localStorage có phiên bản schema |
| Dữ liệu tài khoản sau tích hợp | BE là nguồn chính; cache FE phục vụ hiển thị |

localStorage cần xử lý dữ liệu lỗi, hết dung lượng và thay đổi schema. Dữ liệu cá nhân mock tách theo tài khoản; guest không được dùng thư viện hoặc gửi bình luận. Nếu bổ sung tiến độ cục bộ cho khách sau này, phải chốt quy tắc nhập vào tài khoản, không tự ghi đè dữ liệu máy chủ.

## Phân quyền API — cập nhật 2026-10-24

Danh mục, tìm kiếm và playback dùng `/api/v1/common/...`, không cần đăng nhập. Thư viện, tiến độ cá nhân và ghi bình luận dùng `/api/v1/me/...`, cần xác thực và permission. Route đọc bình luận công khai là đề xuất trong API contract. Xem [roles-permissions.md](roles-permissions.md).

BE kiểm tra phiên, trạng thái tài khoản, permission, ownership và trạng thái tài nguyên. FE dùng trạng thái quyền để dựng giao diện và bảo vệ route thư viện, đồng thời xử lý 401/403 từ BE. Khi đăng xuất hoặc đổi tài khoản, xóa cache dữ liệu cá nhân của phiên trước. FE đã có auth/comments demo; BE authorization chưa triển khai.

## Tích hợp pnpm workspace hiện có

`SRC` nhận package con trực tiếp bằng `*` và đã thêm `Anime-Web/FE`. Đã có package điều phối tại `Anime-Web/package.json`; chưa có package BE.

BE đã chọn C#/ASP.NET Core, dùng .NET SDK/NuGet; không thêm `Anime-Web/BE` vào pnpm workspace hoặc tạo package.json cho BE. FE tiếp tục là package pnpm trong workspace SRC.

Giữ `packageManager: pnpm@11.10.0`, một `pnpm-lock.yaml` tại `SRC`, không tạo workspace hoặc lockfile riêng trong Anime-Web. Cài từ SRC bằng `pnpm install`, kiểm tra bằng `pnpm install --frozen-lockfile`. Xem styling.md cho thứ tự import/layer và cách dùng style common.

## Tài liệu backend

Thiết kế BE chi tiết tập trung tại [docs-BE/readme.md](../../docs-BE/readme.md), cấu trúc C# tại [architecture.md](../../docs-BE/architecture.md). Stack đã chốt, chưa có code backend.
