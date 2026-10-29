# Trang chủ

Đã triển khai ngày 2026-10-24, dùng mặc định của prompt screen-generation: tiếng Việt, nền xanh đen, màu nhấn tím và tên trung tính Anime Web. Đây là lựa chọn triển khai tạm thời, chưa phải quyết định thương hiệu đã xác nhận.

## Chạy và mở

Tại SRC: `pnpm --filter anime-web-fe run dev`. Hoặc tại Anime-Web/FE: `pnpm dev`. Mở URL Vite in trong terminal, route `/`.

Trong phiên triển khai đã xác nhận server `http://127.0.0.1:4174/` bằng lệnh tại SRC: `pnpm --filter anime-web-fe run dev --port 4174 --strictPort`.

## Phạm vi

- Banner chuyển thủ công giữa ba anime; nút chi tiết, yêu thích và thể loại.
- Sáu anime mới cập nhật, bốn đề xuất biên tập; bộ lọc đề xuất lưu trong query `/?genre=...` và giữ khi reload.
- Guest không thấy lịch sử; yêu thích và thư viện dẫn đến đăng nhập demo. Không tự thực hiện yêu thích sau đăng nhập.
- Hai tài khoản demo: có lịch sử mẫu và tài khoản mới chưa có lịch sử. Thành viên có thể bật/tắt yêu thích; dữ liệu tách theo tài khoản và lưu localStorage schema v1. Đăng xuất xóa dữ liệu cá nhân khỏi state hiện tại.
- Lịch sử mẫu dẫn tới `/watch/episode-01-03` hoặc `/watch/episode-02-02`. Đây là fixture, chưa phải tiến độ video thật.
- Màn hình [Khám phá](explore-screen.md) tại `/anime` đã triển khai ngày 2026-10-28; tìm kiếm và liên kết thể loại từ banner hoạt động với danh mục chung. [Thư viện](library-screen.md) tại `/library` đã triển khai; [Chi tiết anime](anime-detail-screen.md) tại `/anime/:slug` đã triển khai; `/watch/:episodeId` vẫn là thông báo chưa có video demo, có đường về Trang chủ. `/login` mô phỏng phiên; returnTo chỉ cho URL nội bộ.
- Tiêu đề anime hư cấu, artwork SVG vẽ cục bộ, không có điểm/lượt xem giả hoặc asset ngoài. Mô hình mùa/phần vẫn là đề xuất trong entities.md; Trang chủ chưa cần triển khai mùa.

## Source

Page ghép khối tại `FE/src/pages/HomePage.tsx`; component AnimeCard, FeaturedBanner, ContinueWatching và hook nằm trong feature anime. Hook gọi contract qua `data/repositories.ts`, sử dụng mock adapter và fixture dùng chung. SessionProvider dùng adapter local, JSX không truy cập localStorage.

App dùng React Router, cấu hình tại FE/src/routes/router.tsx và URL builders tại paths.ts; Link/NavLink/Form và useSearchParams quản lý navigation/query. Vite hỗ trợ direct route/reload; hosting về sau cần fallback về index.html. Xem [quy tắc route](rules/routes.md).

CSS nhập một lần qua styles/index.css; khai báo thứ tự layer trước khi nạp CSS trang. Common chứa layout, nút, trạng thái, header/footer và catalog.css cho thẻ anime/skeleton dùng chung với Khám phá; CSS riêng Trang chủ ở pages/HomePage.css. Giữ Bootstrap, Tailwind prefix tw: và tắt Preflight.

Layout/spacing/responsive đã chuyển sang utility Tailwind trong TSX, gồm Header/Footer, banner, grid và khối tiếp tục xem. CSS còn lại giữ giao diện, gradient, state và pseudo-element; quy tắc generate mới ưu tiên utility theo rules/styling.md.

## Kiểm tra

Tại SRC: `pnpm --filter anime-web-fe run build` (bao gồm typecheck); `pnpm install --frozen-lockfile`.

Dev hỗ trợ `/?mock=loading`, `/?mock=empty`, `/?mock=error` để kiểm tra trạng thái mà không thêm bảng debug. Thử lại phục hồi danh mục mẫu. Các query mock bị bỏ qua trong production.

Kiểm thử browser tái sử dụng Chromium/@playwright/test đã có trong package react-snapshot-effect-ref-lab, không cài thêm dependency cho FE. Khi dev server chạy tại cổng 4174, tại SRC chạy PowerShell:

```powershell
@'
import { chromium } from '@playwright/test';
import { verifyHome } from '../Anime-Web/FE/tests/home.browser.mjs';
const browser = await chromium.launch({ headless: true });
try { await verifyHome(browser, 'http://127.0.0.1:4174'); }
finally { await browser.close(); }
'@ | pnpm --filter react-snapshot-effect-ref-lab exec node --input-type=module -
```

Ảnh kiểm tra tại FE/test-results/home-375.png, home-768.png, home-1440.png (được gitignore). Script chặn mọi request ngoài origin local. Chưa có video, playback hoặc API/xác thực thực tế để kiểm chứng.
