# Kiến trúc source đề xuất

Tài liệu quy định kiến trúc khi triển khai màn hình. Xem [readme.md](readme.md) cho toàn bộ quy tắc sinh màn hình.

## Nguyên tắc

FE phụ trách hiển thị và tương tác. BE phụ trách dữ liệu dùng chung, xác thực và kiểm tra quyền. Video có thể nằm ở dịch vụ lưu trữ/CDN; API cung cấp thông tin phát, không mặc định truyền toàn bộ video qua BE.

FE hiện có nền React + TypeScript + Vite, Tailwind CSS và Bootstrap 5, được thiết lập ngày 2026-10-24. Đã triển khai [Trang chủ](../home-screen.md), [Khám phá](../explore-screen.md), React Router quản lý tập trung tại FE/src/routes (xem routes.md) và phiên guest/member demo; Thư viện đã triển khai (xem [library-screen.md](../library-screen.md)); [Chi tiết anime](../anime-detail-screen.md) đã triển khai với mùa/tập và bình luận demo; Xem còn là thông báo tối thiểu. Công nghệ BE và database **chưa chọn**. Cây BE bên dưới mô tả trách nhiệm, không buộc dùng framework cụ thể.

## Cấu trúc dự kiến

```text
Anime-Web/
├── package.json                 # Điều phối lệnh FE/BE, tạo khi triển khai
├── FE/
│   ├── package.json
│   ├── public/images/
│   ├── index.html
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx
│       ├── app/                 # App, providers, cấu hình
│       ├── routes/              # React Router, patterns và URL builders
│       ├── layouts/             # MainLayout
│       ├── pages/               # Ghép component thành màn hình
│       ├── features/
│       │   ├── anime/           # Card, grid, bộ lọc, hooks, types
│       │   ├── episode/         # Mùa, danh sách tập
│       │   ├── player/          # Trình phát, chuyển tập, tiến độ
│       │   ├── library/         # Yêu thích, lịch sử
│       │   ├── comments/        # Bình luận demo, hook, ownership và local adapter
│       │   └── auth/            # Phiên guest/member, quyền và đăng nhập
│       ├── components/
│       │   ├── ui/             # Button, Input, Dialog, Skeleton
│       │   ├── common/         # Pagination, EmptyState, ErrorState
│       │   └── navigation/     # Header, Footer, điều hướng mobile
│       ├── data/
│       │   ├── contracts/       # Interface truy cập dữ liệu
│       │   ├── mock/            # Fixture và triển khai bằng mock
│       │   ├── local/           # Thư viện, tiến độ trong localStorage
│       │   ├── api/             # HTTP client, DTO, mapper
│       │   └── repositories.ts  # Chọn adapter theo cấu hình
│       ├── lib/                 # Tiện ích nhỏ dùng chung
│       └── styles/              # Entry, tokens, global CSS và common/
├── BE/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── anime/
│   │   │   ├── episode/
│   │   │   ├── playback/
│   │   │   ├── auth/
│   │   │   ├── authorization/   # Role, permission, policy ownership
│   │   │   ├── comments/
│   │   │   ├── library/
│   │   │   └── progress/
│   │   ├── shared/              # Lỗi, validation, middleware
│   │   └── config/              # Đọc và kiểm tra cấu hình
│   ├── database/                # Schema, migration, seed giả lập
│   └── tests/                   # Kiểm thử BE bằng dữ liệu kiểm soát
└── DOC/
```

Không tạo sẵn mọi thư mục rỗng; bổ sung khi chức năng thực sự được triển khai. Không đặt thông tin bí mật trong source hoặc tài liệu.

## Luồng dữ liệu FE

```text
Page → Hook → Repository interface → Mock adapter
                                  → Local adapter
                                  → API adapter → BE
```

Ví dụ `AnimeRepository` có `list(filters)` và `getBySlug(slug)`. Mock và API trả cùng kiểu entity FE. `anime.mapper.ts` chuyển DTO từ BE sang entity; không để component phụ thuộc tên trường của nhà cung cấp.

Quy ước phụ thuộc: page dùng feature; feature dùng contract và UI dùng chung; adapter triển khai contract. Chỉ `data/repositories.ts` chọn adapter, tránh import ngược gây vòng phụ thuộc.

Đổi nguồn dữ liệu vẫn cần xác nhận API contract, xác thực, lỗi và định dạng playback; không coi đây là thao tác đổi URL duy nhất.

## Luồng xử lý BE

```text
HTTP route → Kiểm tra dữ liệu / xác thực → Service → Repository → Database
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

BE kiểm tra phiên, trạng thái tài khoản, permission, ownership và trạng thái tài nguyên. FE dùng trạng thái quyền để dựng giao diện và bảo vệ route thư viện, đồng thời xử lý 401/403 từ BE. Khi đăng xuất hoặc đổi tài khoản, xóa cache dữ liệu cá nhân của phiên trước. Chưa tạo source auth/comments/authorization ở bước cập nhật tài liệu này.

## Tích hợp pnpm workspace hiện có

`SRC` nhận package con trực tiếp bằng `*` và đã thêm `Anime-Web/FE`. Đã có package điều phối tại `Anime-Web/package.json`; chưa có package BE.

Nếu FE và BE là hai package JavaScript riêng, cần bổ sung chính xác `Anime-Web/FE` và `Anime-Web/BE` vào `SRC/pnpm-workspace.yaml`; chỉ thêm package điều phối chưa đủ nhận hai package lồng nhau. Nếu BE dùng công nghệ khác thì không ép BE thành package JavaScript.

Giữ `packageManager: pnpm@11.10.0`, một `pnpm-lock.yaml` tại `SRC`, không tạo workspace hoặc lockfile riêng trong Anime-Web. Cài từ SRC bằng `pnpm install`, kiểm tra bằng `pnpm install --frozen-lockfile`. Xem styling.md cho thứ tự import/layer và cách dùng style common.
