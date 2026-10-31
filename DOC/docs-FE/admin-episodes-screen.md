# Quản lý mùa/phần và tập phim

Đã triển khai FE mock theo screen-generation ngày 2026-10-31. Mô hình một anime nhiều mùa, mỗi mùa nhiều tập là mặc định FE từ [entities](../entities.md); không chốt thay nghiệp vụ hoặc API BE.

## Mở màn hình

- `/admin/episodes`: chọn phim, quản lý mùa/phần và danh sách tập.
- `/admin/episodes/new`: form thêm tập; hỗ trợ query animeId/seasonId để chọn sẵn.
- `/admin/episodes/:episodeId/edit`: sửa tập theo ID ổn định.
- Ví dụ dữ liệu ban đầu: `/admin/episodes?animeId=anime-01`; có mùa chính và ngoại truyện.

Tại SRC chạy `pnpm --filter anime-web-fe run dev`. Vào route quản trị, chọn Đăng nhập → Dùng phiên quản trị mẫu (chỉ đọc) hoặc Dùng phiên quản trị có quyền chỉnh sửa → Tiếp tục về trang đã yêu cầu. Menu “Mùa/phần và tập phim” nằm trong AdminLayout. Phiên chỉ bật chủ động ở dev, tải lại/đổi phiên sẽ reset dữ liệu; member không tự thành admin, production từ chối.

## Hành vi

Chọn phim để xem mùa/phần, thêm hoặc sửa bằng form inline: tiêu đề, số mùa và thứ tự. Form tập ở route riêng: phim, mùa, số tập, tiêu đề, thứ tự, thời lượng giây, draft/published. Tạo tập mặc định nháp, thời lượng 1440 giây (có thể sửa). Công bố cần checkbox xác nhận rõ hậu quả; không tạo nguồn video và không sửa trang xem phim công khai.

Tìm tiêu đề/số tập không phân biệt hoa thường và dấu, debounce 350ms, chờ kết thúc IME. Không tạo chip từ khoá. URL giữ q/animeId/seasonId/status/sort/page/pageSize; đổi điều kiện về trang 1, phân trang giữ query, Back/Forward đồng bộ control. Kích thước trang 10/20/50; trang vượt cuối đưa về trang cuối bằng replace. Không có kết quả khi ID phim/mùa không hợp lệ, không tự chọn dữ liệu khác.

Bảng HTML có caption/header, cuộn trong region có nhãn trên mobile. Common Button/Input/Selectbox/Pagination được tái sử dụng; Tailwind tw:, font tối thiểu 14px, không thêm CSS riêng. Dialog xoá dùng native modal, focus Huỷ, Escape khi không pending và trả focus khi đóng.

## Quy tắc mock và quan hệ

- Đọc cả mùa và tập cần `admin:episode:read`; ghi thêm `admin:episode:write`. Repository kiểm tra trước/sau delay, không chỉ ẩn nút. Không có quyền User ghi.
- Tiêu đề trim 1–200 ký tự; số/thứ tự là số nguyên 1–100000, thời lượng 1–86400 giây. Số mùa và thứ tự duy nhất trong phim; số tập và thứ tự duy nhất trong mùa. ID giữ nguyên khi sửa.
- Phim phải tồn tại, mùa phải thuộc phim. Không chuyển mùa sang phim khác hoặc tập sang mùa khác khi sửa. Phim sắp ra mắt chỉ lưu tập nháp. Mùa không có trạng thái công bố riêng trong model hiện tại.
- Chỉ xoá tập nháp. Chặn xoá/thu hồi tập đã công bố khi chưa có chính sách lịch sử xem; metadata khác vẫn sửa được. Chặn xoá mùa còn bất kỳ tập nào và phim còn mùa. Không cascade lịch sử, tập hoặc asset.
- PublishedAt UTC được gán khi công bố, nháp mới là null. HasPlayback luôn false với tập mới; không nhập URL video/upload/subtitle.
- Workspace dùng WeakMap theo đối tượng phiên, clone dữ liệu trả về; không localStorage, không HTTP mutation. Seed 24 phim, 22 mùa, 155 tập công bố. Public fixture không bị thay đổi.
- Dashboard tính mùa/tập từ workspace quản trị; chỉ đếm tập published. PublishedEpisodes của Anime cập nhật cùng thao tác tập; không suy luận từ episodeLabel trên poster.
- Request bị huỷ khi unmount/đổi phiên/đăng xuất; kho mock kiểm tra AbortSignal trước commit. Pending khoá submit lặp, lỗi giữ nội dung form, focus lỗi đầu tiên.

## Source và kiểm chứng

Cập nhật: [Nguồn phát và phụ đề](admin-playback-screen.md) tại `/admin/playback` dùng cùng workspace và ID tập. Tập còn nguồn không được xoá, kể cả nháp. Cấu hình nguồn chưa kiểm chứng không thay đổi hasPlayback hoặc fixture công khai.

Route ghép feature tại `FE/src/app/routes/admin/{episodes,episode-form}.tsx`, lazy trong router chung; feature `FE/src/features/admin-episodes/`, DTO `types/admin-episode.ts`, contract `lib/api/contracts/admin-episode-repository.ts`, mock adapter `lib/api/mock/mock-admin-episode-repository.ts`, validation `utils/admin-episode-validation.ts`.

Dev query mock=error/empty mô phỏng danh sách lỗi/trống; mock=save-error trên form hoặc màn mùa, mock=delete-error trên danh sách làm lần ghi đầu thất bại rồi cho thử lại. Không thêm panel debug vào UI chính. Kiểm tra browser/repository tại `FE/tests/admin-episodes.browser.mjs`; kết quả thật nối thêm trong [verification](verification.md). API, xác thực, chính sách công bố/xoá thật và phát video chưa được triển khai trong module FE này.

## Cập nhật phân trang — 2026-10-31

Danh sách records dùng [Pagination chung](rules/common/pagination.md) ở cả trên và dưới; hai thanh đồng bộ trang và URL, vẫn hiện khi có một trang. Ô chọn số bản ghi mỗi trang nằm bên phải thanh trên, chỉ có một ô và không còn ở bộ lọc/tiêu đề/thanh dưới. Đổi số lượng về trang 1, giữ bộ lọc; Form GET giữ pageSize bằng hidden Input. Khi không có records, giữ ô số lượng phía trên và ẩn thanh dưới. Không áp dụng ô số lượng cho màn công khai.
