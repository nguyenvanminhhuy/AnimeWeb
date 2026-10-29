# Quy tắc style FE

Áp dụng khi sinh mới hoặc cập nhật UI của từng màn hình.

Cập nhật 2026-10-24: đã cài Tailwind CSS 4.3.3 và Bootstrap 5.3.8 bằng pnpm. Nền FE là React + TypeScript + Vite; đã triển khai [Trang chủ](../home-screen.md) với nội dung mock.

## Ưu tiên khi viết giao diện

1. Tái sử dụng component và class đã có.
2. Ưu tiên utility Tailwind trực tiếp trong JSX cho flex/grid, căn chỉnh, khoảng cách, kích thước và responsive. Dùng `tw:text-body` khi cần đặt rõ font 14px theo token; ưu tiên kế thừa nếu đã đúng.
3. CSS common trong `FE/src/styles/common/` dành cho token, thiết kế/trạng thái của component tái sử dụng và các quy tắc cần dùng chung. Bootstrap tiếp tục cung cấp reset và nền btn/form-select/spinner hiện có.
4. CSS riêng chỉ giữ thiết kế đặc thù, gradient, pseudo-element, animation hoặc override theo ngữ cảnh chưa phù hợp với utility. Trước khi tạo class mới, kiểm tra component/utility có sẵn; không tạo selector chỉ để bọc display:flex, gap, padding hoặc grid đơn giản.
5. Chỉ khi thật cần mới thêm `<style>...</style>` ở cuối JSX của component. React không tự scope thẻ này: dùng selector có namespace riêng, nội dung CSS tĩnh và ghi ngắn gọn lý do. Không dùng `<style />` rỗng hoặc cú pháp `<style scoped>` không được hỗ trợ để giả lập phạm vi.

Không thêm block style theo thói quen ở mọi màn hình. Tránh inline `style={{ ... }}` cho giá trị cố định nếu đã có utility; giá trị động thực sự có thể dùng CSS variable/inline phù hợp.

Khi chuyển CSS sang Tailwind, xóa declaration/rule đã được thay thế, kiểm tra selector con và state trước khi xóa; utility ở layer utilities có thể thắng selector CSS page ở layer components. Giữ class aw-* còn dùng cho style, test hoặc hook DOM hiện có. Khi cần tái sử dụng nhóm layout nhiều nơi, ưu tiên component chung thay vì tạo thêm lớp CSS cho từng màn hình.

## Responsive và typography với Tailwind

`tw:text-body` được cấu hình bằng @theme inline để dùng `--aw-font-size-base`; utility chỉ đặt font-size, không tự đổi line-height. Giữ token mặc định 0.875rem/14px. Class Tailwind phải là chuỗi đầy đủ trong source.

Các variant dưới đây giữ nguyên breakpoint inclusive của giao diện đã có; được đăng ký ở styles/index.css theo thứ tự từ rộng đến hẹp:

| Variant | Điều kiện |
| --- | --- |
| `tw:max-desktop:` | width ≤ 1100px |
| `tw:max-tablet:` | width ≤ 1000px |
| `tw:max-mobile:` | width ≤ 767px |
| `tw:max-phone:` | width ≤ 600px |

Ví dụ grid giữ thiết kế hiện tại: `tw:grid tw:grid-cols-6 tw:gap-5 tw:max-tablet:grid-cols-3 tw:max-phone:grid-cols-2`. Với layout mới có thể dùng breakpoint chuẩn như tw:md: nếu phù hợp thiết kế; khi refactor giữ nguyên ngưỡng cũ thay vì đổi breakpoint để tiện viết class. Kiểm tra cả điểm biên 600/767/1000/1100px.

Sau refactor, kiểm tra loading/empty/error, guest/member, các size common, focus và responsive. So sánh kích thước/style trước–sau khi đổi nhiều selector; số dòng CSS giảm không tự đảm bảo giao diện đúng hoặc bundle build nhỏ hơn.

## Component dùng chung

Nút hành động và CTA dùng [Button](common/button.md). Component tự quản lý class/variant; CSS nút tập trung tại `src/styles/common/button.css`, không viết lại class `btn aw-btn-*` ở mỗi page. Các tài liệu component dùng chung nằm tại [common/](common/readme.md).

Control nhập/chọn dùng [Input](common/input.md), [Combobox](common/combobox.md), [Selectbox](common/selectbox.md); style nền đăng ký tại `src/styles/common/form-controls.css` trước layout/page. Input có variant unstyled cho field shell đặc thù; không lặp lại toàn bộ style mặc định trong màn hình mới.

Theo yêu cầu giao diện, Input/Combobox/Selectbox khi focus giữ viền mặc định và viền lỗi, không thêm màu viền focus, outline/ring hoặc box-shadow (kể cả variant unstyled). Không thêm lại hiệu ứng này trong CSS page hoặc field shell focus-within. Quy tắc chỉ áp dụng ba control này; Button, Link và textarea giữ cách hiển thị focus hiện có.

Button và control dùng chung có [size sm/md/lg](common/sizes.md), giữ font 14px. `styles/common/control-sizes.css` đăng ký ở layer overrides để size có hiệu lực sau CSS page, chỉ điều khiển min-height/padding dọc/font/line-height của các control được gắn size. Unstyled không chọn size giữ kiểu feature; không thêm important để điều chỉnh kích thước.

Icon chức năng dùng [Icon/Font Awesome Free](common/icon.md): SVG inline, registry import từng icon, size đồ họa 16/18/24px. Core CSS đi qua styles/index.css một lần ở layer components; tắt autoAddCss để tránh runtime CSS vượt thứ tự layer. Không dùng CDN/Kit/icon font. Giữ màu kế thừa và nhãn truy cập ở phần tử tương tác.

## Font chữ

- Cỡ chữ mặc định là **14px** tại thiết lập trình duyệt thông thường. Giữ `html { font-size: 100%; }`, dùng token `--aw-font-size-base: 0.875rem` cho body, nội dung, navigation, Button, label, input, select và textarea. Dùng rem để tôn trọng thiết lập cỡ chữ/zoom của người dùng.
- Chữ người dùng cần đọc, gồm mô tả, metadata, badge, thông báo và lỗi form, dùng tối thiểu `0.875rem` (mặc định 14px). Không đặt lại 8–13px ở page/component hoặc breakpoint mobile.
- Tiêu đề có thể lớn hơn 14px theo phân cấp; icon và hình trang trí có kích thước riêng. Không thu nhỏ chữ để ép nội dung vào bố cục: cho xuống dòng, tăng khoảng trống hoặc điều chỉnh grid phù hợp.
- Ưu tiên kế thừa font; khi cần khai báo rõ, dùng token chung thay vì lặp font-size cố định. Nội dung nhiều dòng dùng line-height khoảng 1.5–1.8. Kiểm tra 375/768/1440px, label/control và chữ tiếng Việt không bị cắt hoặc tràn ngang.

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
