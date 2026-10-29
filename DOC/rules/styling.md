# Quy tắc style FE

Áp dụng khi sinh mới hoặc cập nhật UI của từng màn hình.

Cập nhật 2026-10-24: đã cài Tailwind CSS 4.3.3 và Bootstrap 5.3.8 bằng pnpm. Nền FE là React + TypeScript + Vite; đã triển khai [Trang chủ](../home-screen.md) với nội dung mock.

## Ưu tiên khi viết giao diện

1. Tái sử dụng component và class đã có.
2. Dùng class Bootstrap cho cấu trúc/thành phần phù hợp và utility Tailwind cho tùy chỉnh.
3. CSS cần dùng ở nhiều nơi đặt trong `FE/src/styles/common/`.
4. CSS riêng của component dùng file CSS/CSS Module khi class có sẵn không đáp ứng được.
5. Chỉ khi thật cần mới thêm `<style>...</style>` ở cuối JSX của component. React không tự scope thẻ này: dùng selector có namespace riêng, nội dung CSS tĩnh và ghi ngắn gọn lý do. Không dùng `<style />` rỗng hoặc cú pháp `<style scoped>` không được hỗ trợ để giả lập phạm vi.

Không thêm block style theo thói quen ở mọi màn hình. Tránh inline `style={{ ... }}` cho giá trị cố định nếu đã có utility; giá trị động thực sự có thể dùng CSS variable/inline phù hợp.

## Kết hợp hai thư viện

- Tailwind có prefix `tw:`: `tw:flex`, `tw:gap-3`, `tw:md:p-8`. Bootstrap dùng class gốc: `container`, `row`, `card`, `btn`.
- Không bật Tailwind Preflight vì Bootstrap Reboot đã cung cấp reset. Không import lại toàn bộ `tailwindcss` ở page.
- Tất cả style nền đi qua `src/styles/index.css`, import một lần tại main.tsx. CSS trang cũng đăng ký ở entry này sau khai báo thứ tự layer; không để import component thiết lập layer components trước theme/bootstrap.
- Trong workspace SRC, `src/styles/index.css` của Anime-Web được gán language mode Tailwind CSS qua files.associations để VS Code hiểu prefix()/source() trong @import. Extension bradlc.vscode-tailwindcss được khuyến nghị; Prettier vẫn xử lý file này qua documentSelectors và defaultFormatter của language tailwindcss. Không tắt css.validate toàn workspace để che lỗi parser, không bỏ prefix/source đang dùng chỉ vì chẩn đoán của CSS mode mặc định. Sau khi đổi settings, mở lại file hoặc Reload Window nếu mode chưa cập nhật.
- Thứ tự cascade layer: theme → bootstrap → base → components → utilities → overrides. File common nằm ở components; utility Tailwind có thể ghi đè declaration thường của common/Bootstrap.
- Bootstrap có utility dùng `!important` (ví dụ `p-4`). Không trộn utility Bootstrap và Tailwind để điều khiển cùng thuộc tính trên một phần tử, ví dụ tránh `p-4 tw:md:p-8`; dùng `tw:p-6 tw:md:p-8` hoặc chỉ spacing Bootstrap. Không giải quyết bằng cách thêm `!important` hàng loạt.
- Breakpoint hai thư viện không hoàn toàn giống nhau; chọn một hệ cho mỗi nhóm responsive và kiểm tra ở kích thước thực.
- Chưa import JavaScript Bootstrap toàn cục: CSS đã dùng được; modal/dropdown tương tác phải được triển khai qua React hoặc import đúng plugin khi cần. Không đồng thời giao việc điều khiển cùng DOM cho React và Bootstrap plugin.
- Tailwind class phải hiện diện đầy đủ trong source; dùng bảng ánh xạ class cho biến thể, tránh ghép tên class động như `tw:bg-${color}-500`.

## Thư mục style

```text
src/styles/
├── index.css              # Entry CSS và thứ tự layer/import
├── tokens.css             # Biến thiết kế --aw-*
├── global.css             # Quy tắc nền tối thiểu
└── common/
    ├── index.css          # Đăng ký CSS dùng chung
    └── surfaces.css       # Ví dụ .aw-surface
```

Khi thêm nhóm common khác, tạo file tên theo trách nhiệm và import tại common/index.css. Dùng prefix `aw-` cho class dự án; không sửa node_modules, không chép cả thư viện vào source, không dùng CDN.

Vite tắt tối ưu riêng của plugin Tailwind để Vite tối ưu một lần sau bước PostCSS. Bước PostCSS loại bỏ `@charset` của CSS nhập vào để không còn nằm sai chỗ bên trong cascade layer; tài liệu HTML dùng UTF-8.

## Format code tự động

Cập nhật 2026-10-28: FE dùng Prettier 3.9.10 được pin trong devDependencies, cấu hình tại `FE/.prettierrc.json`: indent 2 spaces, single quote, semicolon, trailing comma, printWidth 100 và LF. Không thêm plugin đổi thứ tự class Tailwind.

Workspace SRC có `editor.formatOnSave: true` và chọn `esbenp.prettier-vscode` cho JS/TS/JSX/TSX/JSON/JSONC/CSS/HTML trong `.vscode/settings.json`. Extension đã có trên máy tại thời điểm cấu hình. Settings này áp dụng khi mở workspace SRC; cấu hình Prettier riêng nằm trong FE. Định dạng khi Save của VS Code không chạy cho file được công cụ ghi trực tiếp xuống ổ đĩa.

Sau khi generate/sửa code FE, chạy tại SRC:

```powershell
pnpm --filter anime-web-fe run format
pnpm --filter anime-web-fe run format:check
```

Hoặc tại Anime-Web/FE chạy `pnpm format` / `pnpm format:check`; tại Anime-Web cũng có hai script điều phối tương ứng. `format` sửa file, `format:check` chỉ kiểm tra. Script `build` chạy format:check trước typecheck/Vite, vì vậy code chưa đúng định dạng sẽ khiến build dừng và cần chạy format.

Quy tắc trong `Anime-Web/AGENTS.md` yêu cầu chạy format trước khi bàn giao code được tạo/sửa. Chưa thiết lập watcher định dạng mọi thay đổi file ngoài editor. `FE/.prettierignore` loại trừ node_modules, dist, test-results, coverage, artwork SVG cục bộ và file môi trường; lệnh chỉ chạy trong FE, không ghi lại lịch sử DOC/verification.md.

Tham chiếu: [cài và chạy Prettier](https://prettier.io/docs/install), [extension VS Code](https://github.com/prettier/prettier-vscode).

## Chạy ứng dụng

Tại `SRC/Anime-Web/FE`:

```powershell
pnpm dev
pnpm build
pnpm typecheck
```

Hoặc tại SRC: `pnpm --filter anime-web-fe run dev`. Cài dependencies từ SRC bằng `pnpm install`, dùng một lockfile chung. App dùng React Router, Link/NavLink/Form và các hook router; xem [routes.md](routes.md); chưa có chức năng phát phim thật.
