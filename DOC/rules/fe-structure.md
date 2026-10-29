# Cấu trúc FE hiện tại

Tài liệu quy định vị trí đặt source khi triển khai màn hình.

Đã thiết lập nền React + TypeScript + Vite, Tailwind CSS và Bootstrap 5 ngày 2026-10-24. Đã triển khai [Trang chủ](../home-screen.md), [Khám phá](../explore-screen.md) và [Thư viện](../library-screen.md), React Router quản lý tập trung tại FE/src/routes (xem routes.md) và các trang thông báo đích tối thiểu. Có package.json và scripts dev/build/typecheck. File `.gitkeep` giữ các thư mục chưa có source trong Git.

```text
FE/
├── public/
│   └── images/
└── src/
    ├── app/                     # App, providers, config
    ├── routes/                  # React Router, patterns, URL builders; xem routes.md
    ├── layouts/                 # Bố cục trang
    ├── pages/                   # Các màn hình
    ├── features/
    │   ├── anime/
    │   │   ├── components/
    │   │   └── hooks/
    │   ├── episode/
    │   │   ├── components/
    │   │   └── hooks/
    │   ├── player/
    │   │   ├── components/
    │   │   └── hooks/
    │   └── library/
    │       ├── components/
    │       └── hooks/
    ├── components/
    │   ├── common/              # Component ghép dùng chung giữa các trang
    │   ├── navigation/          # Header, Footer, điều hướng mobile
    │   └── ui/                  # Thành phần giao diện cơ bản
    ├── data/
    │   ├── contracts/           # Interface truy cập dữ liệu
    │   ├── mock/
    │   │   └── fixtures/        # Dữ liệu mẫu
    │   ├── local/               # Lưu trữ trên trình duyệt
    │   └── api/                 # Dành cho HTTP client và adapter BE
    ├── lib/                     # Tiện ích dùng chung
    └── styles/
        ├── index.css            # Entry CSS chung
        ├── tokens.css           # Biến thiết kế
        ├── global.css           # CSS nền
        └── common/              # CSS tái sử dụng, tách với component common
```

Entity types đặt trong feature tương ứng, ví dụ `features/anime/anime.types.ts`; catalogQuery.ts định nghĩa query và các lựa chọn lọc. Feature auth có SessionProvider, Login/Register, form/hook và repository hồ sơ demo cục bộ; xem [auth-screens.md](../auth-screens.md). Feature comments đã có danh sách/form/hook và local adapter cho [Chi tiết anime](../anime-detail-screen.md); chưa có bình luận trên BE hoặc xác thực thật. Tài liệu dự án và prompt đặt trong DOC, không rải vào FE.

## Chọn nơi đặt component

| Vị trí | Trách nhiệm | Ví dụ dự kiến |
| --- | --- | --- |
| components/ui/ | Thành phần giao diện cơ bản, không biết nghiệp vụ anime | Button, Input, Dialog, Skeleton |
| components/common/ | Component ghép tái sử dụng giữa nhiều trang/tính năng, nhận dữ liệu qua props | SearchField, Pagination, EmptyState, ErrorState, ImageWithFallback |
| components/navigation/ | Điều hướng dùng chung của ứng dụng | Header, Footer, MobileNavigation |
| features/<feature>/components/ | Component gắn với nghiệp vụ của feature | AnimeCard, EpisodeList, VideoPlayer |

`common/` có thể dùng `ui/`, nhưng `ui/` không import ngược `common/`. Component common không import từ pages hoặc feature cụ thể, không gọi API trực tiếp; nhận dữ liệu và callback qua props. Component thuộc anime vẫn ở feature anime dù được nhiều trang sử dụng.

Khi thêm component thực tế, có thể đặt mỗi component trong thư mục riêng, ví dụ `common/Pagination/Pagination.tsx` và stylesheet đi kèm. Chưa tạo sẵn các component ví dụ hoặc file export rỗng.

## Quy tắc pnpm

- Dùng pnpm@11.10.0 và store dùng chung mặc định; không tạo store riêng cho FE.
- Đã có package điều phối tại Anime-Web; package Anime-Web/FE được nhận diện trong workspace SRC.
- Chỉ dùng một lockfile tại SRC; không tạo lockfile hoặc pnpm-workspace.yaml trong FE.
- Cài từ SRC bằng `pnpm install`; kiểm tra tái lập bằng `pnpm install --frozen-lockfile` sau khi thiết lập dependencies.
- Tại FE dùng `pnpm dev`, `pnpm build`, `pnpm typecheck`; xem [styling.md](styling.md) để viết style và kết hợp hai thư viện.

pnpm dùng store để chia sẻ nội dung package và giảm việc sao chép trùng lặp khi hệ thống hỗ trợ. Sau khi cài, dự án vẫn có node_modules và vẫn sử dụng dung lượng; không cam kết dung lượng bằng 0.
