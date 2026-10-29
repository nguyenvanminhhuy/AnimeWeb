# Chi tiết anime

Triển khai ngày 2026-10-29 theo screen-generation và rule route, tại `/anime/:slug`. Giữ catalog 24 anime, artwork cục bộ, React Router và phiên demo hiện có. Không có BE/player/nguồn phim thật.

## Chạy và mở

Tại SRC: `pnpm --filter anime-web-fe run dev --port 4174 --strictPort`. Server đã được kiểm tra tại `http://127.0.0.1:4174/`.

- `/anime/hanh-trinh-anh-sao`: banner/poster, 8 tập mùa chính và 2 ngoại truyện, hai bình luận fixture visible.
- `/anime/hanh-trinh-anh-sao?season=season-01-side`: chọn ngoại truyện; tập dùng ID `episode-01-side-a` và `episode-01-side-z`.
- `/anime/mua-he-o-dao-xanh`: điện ảnh, một phần/một tập metadata.
- `/anime/loi-hua-cua-gio`: sắp ra mắt, chưa có phần/tập công bố.
- `/anime/not-a-real-anime`: thông báo không tìm thấy, có đường về Khám phá.

## Danh mục, mùa và tập

AnimeDetailPage gọi useAnimeDetail → AnimeRepository.getBySlug → mock fixture chung. Đọc slug bằng useParams, bỏ kết quả cũ khi đổi slug/query mock. Banner/poster có fallback; nội dung, thể loại, trạng thái/năm/định dạng và anime liên quan lấy từ cùng catalog Home/Explore/Library. Không thêm rating/lượt xem giả.

Mặc định tạm thời vẫn là một anime có nhiều phần; phim điện ảnh một phần/một tập. Đây là fixture FE theo entities.md, chưa phải mô hình nghiệp vụ được chốt. Season/Episode có ID và sortOrder; UI không cộng số vào ID để chuyển tập. Các ID tiến độ `episode-01-03`, `episode-02-02` giữ nguyên. Draft không được trả qua repository danh mục; ngoại truyện minh họa ID không liên tiếp.

Chọn mùa lưu trong query season, hỗ trợ reload/Back/Forward, giá trị sai về phần đầu bằng router replace. Đếm tập là tổng metadata published của các phần, không phải số video phát được. Card tập mở route Watch thông báo tối thiểu, được ghi rõ là thông tin tập, chưa có video.

Không có asset video hoặc nguồn phát, nên toàn bộ fixture hasPlayback=false. Trang hiện “Chưa có video demo”, primary action dẫn xuống danh sách tập; không có nút Xem ngay/Xem tiếp gây hiểu nhầm. Code đã có nhánh chọn tập khả dụng đầu tiên hoặc tập có tiến độ khi sau này có dữ liệu phát thực sự. Chưa kiểm chứng playback hoặc tạo player đầy đủ trong nhiệm vụ này.

## Yêu thích và tiến độ

Guest đọc mọi thông tin công khai; yêu thích/bình luận dẫn Login với returnTo giữ route/query. Member bật/tắt yêu thích chung với Home/Library. Tiến độ mẫu gần nhất của anime được hiển thị nếu tham chiếu episode published hợp lệ; không tự ghi tiến độ khi chỉ xem chi tiết. Không tự thực hiện yêu thích hoặc gửi bình luận sau đăng nhập.

## Bình luận demo

- CommentsPanel/useComments gọi CommentRepository. LocalCommentRepository kết hợp fixture và bình luận trên chính trình duyệt này, chỉ trả status visible; hidden/deleted không xuất hiện cho guest hoặc member.
- Member có permission comment:create/update:own/delete:own mặc định của demo. Nội dung trim 1–2000 ký tự, hiển thị plain text qua React, không render HTML. Chỉ tác giả thấy thao tác sửa/xóa; adapter cũng kiểm tra permission/ownership/status, không nhận userId từ input form.
- Mỗi tài khoản có bucket `aw:comments:v1:<userId>` chứa `{version: 1, comments: [...]}`. Bình luận visible là nội dung công khai cục bộ nên các tài khoản/guest trên cùng trình duyệt có thể đọc; bucket tách theo tác giả để ghi/sửa/xóa đúng owner. Không đồng bộ sang trình duyệt khác hoặc server.
- Xóa là soft delete, có xác nhận inline/Hủy; không có dialog cần focus trap. Sửa chỉ áp dụng bản ghi visible, không khôi phục hidden/deleted. Fixture người khác không thể sửa/xóa.
- Phân trang 5 bình luận, query commentPage giữ season và các query khác; gửi mới về trang đầu, xóa/giá trị trang sai tự clamp. DateTime hiển thị vi-VN, Asia/Ho_Chi_Minh; bài mới có timestamp của thao tác cục bộ, fixture có nhãn Mẫu.
- Lưu trữ lỗi hiển thị thất bại, giữ nội dung để thử lại và không giả vờ ghi thành công. JSON/schema lỗi không bị ghi đè. Logout/đổi tài khoản/đổi anime xóa draft/edit state, hủy request và write đang chờ; không tự gửi lại draft sau Login.
- Đây là kiểm tra quyền FE trong bản mô phỏng, không phải bảo mật xác thực/ownership BE. Không cấp admin/moderator hoặc tạo API bình luận thật.

## Source và trạng thái

- Page: FE/src/pages/AnimeDetailPage.tsx; CSS: AnimeDetailPage.css, nạp qua styles/index.css.
- Layout/spacing/responsive trong Detail, SeasonEpisodes và CommentsPanel dùng utility Tailwind trong TSX; CSS giữ thiết kế, trạng thái và selector theo ngữ cảnh. Theo rule styling cho breakpoint và font 14px.
- Feature anime: useAnimeDetail và AnimeDetail type; feature episode: SeasonEpisodes và Season/Episode types; feature comments: component/hook/types; data layer: contract, mock details/comments fixtures và local comment adapter.
- Tái sử dụng AnimeCard, Artwork, ContentState, Pagination, SessionProvider/MainLayout/Header và URL builders hiện có. Route cũ đã thay placeholder; DestinationPage chỉ còn Watch/Not found.
- Dev: `?mock=loading|error|empty` cho chi tiết; `?comments=loading|error|empty|forbidden` cho bình luận. Mock empty của detail giữ thông tin anime nhưng không có tập/đề xuất; forbidden mô phỏng member không có quyền viết. Retry bỏ mock lỗi; production bỏ qua các query mock.
- Không thêm dependency, ảnh AI, API key hoặc request asset ngoài.

## Kiểm tra tái lập

Tại SRC chạy `pnpm --filter anime-web-fe run format`, `pnpm --filter anime-web-fe run build` (gồm format:check/typecheck) và `pnpm install --frozen-lockfile`.

Với dev server cổng 4174, dùng Chromium/@playwright/test đã có trong workspace:

```powershell
@'
import { chromium } from '@playwright/test';
import { verifyDetail } from '../Anime-Web/FE/tests/detail.browser.mjs';
const browser = await chromium.launch({ headless: true });
try { await verifyDetail(browser, 'http://127.0.0.1:4174'); }
finally { await browser.close(); }
'@ | pnpm --filter react-snapshot-effect-ref-lab exec node --input-type=module -
```

Test dùng context riêng và chỉ dữ liệu giả. Chặn request ngoài origin; kiểm tra 375/768/1440px, season/ID/query, favorite/progress, CRUD/ownership và phân trang bình luận, nội dung HTML chỉ là text, trạng thái mock/not-found, lưu trữ lỗi, hủy thao tác khi logout và fallback. Ảnh tại FE/test-results/detail-375.png, detail-768.png, detail-1440.png (gitignore). Bằng chứng thực tế ghi thêm vào verification.md; chưa có playback hoặc BE để kiểm tra.
