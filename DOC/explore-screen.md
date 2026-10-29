# Khám phá

Triển khai ngày 2026-10-28 tại `/anime`, dùng React + TypeScript + Vite, React Router, giao diện tối/tím và artwork cục bộ của Trang chủ. Giao diện là mặc định từ prompt screen-generation, chưa phải quyết định thương hiệu mới. Xem [quy tắc route](rules/routes.md).

## Chạy

Tại SRC:

```powershell
pnpm --filter anime-web-fe run dev --port 4174 --strictPort
```

Đã xác nhận URL `http://127.0.0.1:4174/anime`. Hoặc tại Anime-Web/FE chạy `pnpm dev` và mở `/anime` trên URL Vite in trong terminal.

Ví dụ:

- `/anime?q=hanh+trinh+anh+sao`: tìm không dấu, trả Hành trình ánh sao.
- `/anime?genre=adventure&year=2025&status=completed&format=movie`: lọc kết hợp.
- `/anime?sort=title&page=2&pageSize=12`: tên A–Z và trang thứ hai.

## Hành vi

- 24 anime hư cấu dùng cùng fixture, ID và slug với Trang chủ; tái sử dụng 6 artwork minh họa cục bộ. Giữ nguyên tám item ban đầu và các khối Trang chủ.
- Tìm theo tên tiếng Việt hoặc tên tiếng Anh; không phân biệt hoa/thường và dấu. Từ khóa trim và giới hạn 100 ký tự, chỉ tìm sau khi submit/Enter.
- Lọc kết hợp thể loại, năm 2023–2026, trạng thái và định dạng TV/điện ảnh. Chọn một bộ lọc tự submit, đưa về trang 1; có thể bỏ riêng điều kiện hoặc xóa tất cả. Bộ lọc thu gọn mặc định khi mở trên mobile, dùng được bằng bàn phím.
- Thể loại dùng slug theo API contract. Các link banner Trang chủ cũ dùng tên tiếng Việt được chấp nhận và chuẩn hóa sang slug tại Khám phá.
- Sắp xếp theo năm phát hành mới nhất (giảm dần, ID ổn định khi cùng năm) hoặc tên A–Z theo locale vi. Không dùng rating/lượt xem giả. Chưa có trường thời điểm cập nhật để sắp xếp theo lần cập nhật.
- Mặc định 12 anime/trang, có thể chọn 24. Đây là lựa chọn UI, API contract còn là đề xuất. Khi đổi số item hoặc sort, về trang 1. Trang vượt giới hạn chuyển về trang cuối; page âm/thập phân/không an toàn về 1; bộ lọc sai và sort/pageSize không hỗ trợ trở về mặc định.
- Query URL là nguồn trạng thái. Dùng Form GET/Link của React Router; reload, chia sẻ link và Back/Forward hoạt động. URL chuẩn hóa bằng navigate replace sau khi có kết quả. Hook phản ứng theo query, bỏ qua kết quả cũ và giữ kết quả khi chỉ chuẩn hóa page. Chưa có API thực tế.
- Guest và member xem cùng danh mục công khai, không yêu cầu đăng nhập. Nút đăng nhập trên header giữ returnTo của trang/query hiện tại. Card dẫn tới [Chi tiết anime](anime-detail-screen.md) tại `/anime/:slug`, dùng cùng ID/slug và danh mục.
- Loading skeleton, empty hướng dẫn bỏ lọc, error/thử lại và ảnh fallback. Không thêm bảng debug. Dev hỗ trợ `/anime?mock=loading`, `mock=empty`, `mock=error`; retry bỏ mock và tải lại cùng bộ lọc. Production bỏ qua mock.

## Source

ExplorePage ghép ExploreFilters, AnimeCard, Pagination và ContentState. `useExploreCatalog` gọi `AnimeRepository.list` qua repositories.ts; mock adapter lọc/sort/phân trang. Types và parse/serialize query thuộc feature anime; Pagination không phụ thuộc feature. JSX không gọi fetch/localStorage.

CSS riêng ở FE/src/pages/ExplorePage.css, đăng ký qua styles/index.css. CSS thẻ anime/skeleton được chuyển từ HomePage.css sang styles/common/catalog.css và Pagination dùng common/pagination.css. Không thêm dependency, API, BE hoặc màn hình khác.

Layout/spacing/responsive của heading, filter, toolbar và grid dùng Tailwind trực tiếp trong TSX. CSS giữ thiết kế, state và selector theo ngữ cảnh; dùng tw:text-body và các variant breakpoint tại rules/styling.md khi chỉnh sửa tiếp.

## Kiểm tra tái lập

Tại SRC: `pnpm install --frozen-lockfile`, `pnpm --filter anime-web-fe run build` (gồm typecheck).

Khi dev server ở cổng 4174, chạy tại SRC bằng PowerShell, tái sử dụng @playwright/test và Chromium đã có trong workspace:

```powershell
@'
import { chromium } from '@playwright/test';
import { verifyExplore } from '../Anime-Web/FE/tests/explore.browser.mjs';
import { verifyHome } from '../Anime-Web/FE/tests/home.browser.mjs';
const browser = await chromium.launch({ headless: true });
try {
  await verifyExplore(browser, 'http://127.0.0.1:4174');
  await verifyHome(browser, 'http://127.0.0.1:4174');
} finally { await browser.close(); }
'@ | pnpm --filter react-snapshot-effect-ref-lab exec node --input-type=module -
```

Script chặn request ngoài origin; kiểm tra 375/768/1440px, tìm/lọc/sort/phân trang, điều hướng/reload, query lỗi, guest/member, ảnh hỏng và trạng thái mock. Ảnh nằm tại FE/test-results/explore-375.png, explore-768.png, explore-1440.png (gitignore). Kết quả thực tế được ghi thêm trong verification.md; chưa kiểm thử trình duyệt khác hoặc playback.
