# Thư viện

Triển khai ngày 2026-10-28 tại `/library`, theo prompt screen-generation và rules/routes.md. Giữ giao diện tối/tím, React Router và dữ liệu/asset dùng chung hiện có.

## Chạy và mở

Tại SRC: `pnpm --filter anime-web-fe run dev --port 4174 --strictPort`. Đã xác nhận server ở `http://127.0.0.1:4174/` trong phiên kiểm tra. Hoặc tại Anime-Web/FE chạy `pnpm dev` rồi mở URL Vite in trong terminal.

- `/library`: mặc định Yêu thích.
- `/library?tab=watching`: Đang xem.
- `/library?tab=history`: Lịch sử.

Guest chỉ thấy lời mời đăng nhập, không thấy số lượng hoặc dữ liệu riêng. Chọn đăng nhập demo, dùng tài khoản có lịch sử mẫu, rồi tiếp tục về trang đã yêu cầu để xem hai tiến độ mẫu. Tài khoản mới có cả ba mục trống. Không tự tạo yêu thích cho tài khoản có lịch sử; có thể thêm từ Trang chủ hoặc từ các thẻ trong Thư viện.

## Hành vi

- Yêu thích lấy cùng danh sách favorites với banner Trang chủ; thêm/bỏ cập nhật chung trong phiên và lưu lại khi localStorage khả dụng. Bỏ yêu thích không xóa tiến độ hoặc lịch sử.
- Đang xem dùng bản ghi tiến độ mới nhất của mỗi anime và chỉ hiện bản ghi chưa hoàn thành. Lịch sử hiện từng episode, gồm cả tập đã hoàn thành. Hai mục này không dùng danh sách yêu thích làm nguồn dữ liệu.
- Mặc định tạm thời: chưa có LibraryEntry.status riêng trong local adapter nên Đang xem được suy ra từ tiến độ, chưa triển khai chỉnh trạng thái plan_to_watch/on_hold/dropped. Đây là lựa chọn FE demo, không sửa quyết định mô hình entity/API.
- Progress cũ schema v1 vẫn đọc được. Thêm hai trường tùy chọn completed/updatedAt; chấp nhận positionSeconds bằng durationSeconds cho tập đã xem hết. Không ghi timestamp giả vào dữ liệu có sẵn. Khi không có updatedAt, giữ thứ tự fixture/adapter; có thời gian thì hiển thị theo Asia/Ho_Chi_Minh, có nhãn tiến độ mẫu.
- Xem tiếp/Xem lại dùng episodeId trong bản ghi. Trang `/watch/:episodeId` vẫn là thông báo chưa có video demo; chưa có playback thật hoặc việc ghi tiến độ từ player.
- Tab, tìm kiếm tên có/không dấu, sort thứ tự lưu/tên A–Z và phân trang lưu trên URL. Mỗi trang 8 item; đổi tab/tìm/sort về trang 1. Xóa hết item ở trang cuối tự về trang hợp lệ. Reload, direct URL và Back/Forward giữ trạng thái; query không hợp lệ được chuẩn hóa bằng router replace.
- Tóm tắt số lượng là dữ liệu tài khoản demo, không phải chỉ số vận hành. Danh mục lấy qua AnimeRepository.getByIds và fixture chung; ID không có trong danh mục được bỏ qua.
- Thành viên demo được cấp các permission own cho library/progress trong SessionProvider. Trang kiểm tra quyền đọc trước khi lấy dữ liệu; chỉ hiện nút yêu thích khi có quyền ghi. Chưa phải phân quyền/xác thực BE.
- Dữ liệu tách theo hai tài khoản mẫu và từng hồ sơ [đăng ký demo](auth-screens.md); đăng xuất ẩn ngay dữ liệu và bỏ cache riêng của trang, yêu cầu đang chạy bị bỏ qua. URL không thể chọn userId khác. Lỗi storage có thông báo và thay đổi chỉ còn trong phiên; JSON sai/schema không hỗ trợ quay về fixture an toàn của chính tài khoản.

## Source

- `FE/src/pages/LibraryPage.tsx`: ghép header/tóm tắt/collections, guard guest/quyền, controls và các trạng thái.
- `FE/src/features/library/`: useLibrary, LibraryCard, query parser/builder và types.
- Tái sử dụng AnimeCard, Artwork fallback, Pagination, ContentState, MainLayout/Header và SessionProvider. Hook → repository interface → mock adapter; localStorage vẫn chỉ truy cập trong data/local.
- Route `/library` tại routes/router.tsx đã thay placeholder bằng LibraryPage; không thêm router hoặc route trùng. CSS riêng đăng ký tại styles/index.css, không import lại Bootstrap/Tailwind.

## Kiểm tra

Dev hỗ trợ `/library?mock=loading`, `mock=empty`, `mock=error`, `mock=forbidden`; không có bảng debug trên UI. Guest vẫn bị guard trước các mock state. Thử lại bỏ mock lỗi và giữ tab/tìm kiếm. Production bỏ qua các mock này.

Tại SRC: `pnpm --filter anime-web-fe run format`, `pnpm --filter anime-web-fe run build` (gồm format:check/typecheck), `pnpm install --frozen-lockfile`.

Khi dev server chạy ở cổng 4174, chạy PowerShell tại SRC, dùng Chromium/@playwright/test đã có trong workspace:

```powershell
@'
import { chromium } from '@playwright/test';
import { verifyLibrary } from '../Anime-Web/FE/tests/library.browser.mjs';
const browser = await chromium.launch({ headless: true });
try { await verifyLibrary(browser, 'http://127.0.0.1:4174'); }
finally { await browser.close(); }
'@ | pnpm --filter react-snapshot-effect-ref-lab exec node --input-type=module -
```

Script dùng browser context riêng, không sửa tài khoản trên trình duyệt người dùng; fixture nhiều trang được tạo trong test. Ảnh kiểm tra tại FE/test-results/library-375.png, library-768.png và library-1440.png (gitignore). Các test hồi quy khác xem [routes.md](rules/routes.md). Kết quả thực tế ghi thêm ở verification.md; chưa kiểm tra browser khác hoặc API/player thật.
