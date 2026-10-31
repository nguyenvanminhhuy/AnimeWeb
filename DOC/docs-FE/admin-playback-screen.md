# Quản lý nguồn phát và phụ đề

FE mock triển khai ngày 2026-10-31 theo screen-generation. Route `/admin/playback`, menu “Nguồn phát và phụ đề”. Chọn phim → mùa/phần → tập → liên kết phụ đề của một nguồn. URL `/admin/playback?episodeId=episode-01-01` tự bổ sung phim/mùa đúng quan hệ từ tập; sourceId và ID khác không được suy đoán theo số thứ tự. Mô hình theo [entity đề xuất](../entities.md); chưa chốt contract BE.

## Chạy và quyền

Từ SRC: `pnpm --filter anime-web-fe run dev`. Vào route quản trị, chọn Đăng nhập → Dùng phiên quản trị mẫu (chỉ đọc) hoặc Dùng phiên quản trị có quyền chỉnh sửa → Tiếp tục về trang đã yêu cầu. Mỗi phiên riêng, reload/đổi phiên reset. Guest/member không có quyền quản trị, production từ chối khi chưa có nguồn quyền tin cậy.

`admin:playback:read` đọc cả nguồn/phụ đề và danh mục phim/mùa/tập tối thiểu để chọn. `admin:playback:write` thêm quyền ghi; không dùng quyền playback:read công khai làm quyền quản trị. Adapter kiểm tra lại quyền sau delay, hỗ trợ AbortSignal và huỷ trước commit. Không thêm auth, API hoặc quyền User thật.

## Phạm vi

- Thêm/sửa/xoá nguồn theo tập: nhãn, providerKey, ngôn ngữ, loại MP4/HLS, địa chỉ tài nguyên, enabled. Nguồn mới mặc định tắt; bật/tắt yêu cầu checkbox xác nhận mô tả thay đổi.
- Thêm/sửa/xoá phụ đề theo đúng nguồn: nhãn, ngôn ngữ, WebVTT/SubRip, địa chỉ, isDefault. Chọn mặc định bỏ mặc định các track khác của cùng nguồn trong một commit. Tối đa một mặc định; xoá hoặc bỏ chọn mặc định không tự chọn ngôn ngữ khác.
- Form inline, pending khoá gửi lặp, validation cạnh field/focus lỗi đầu tiên, lỗi giữ nội dung và cho thử lại. Dialog xoá native modal, focus Huỷ, Escape khi không pending, trả focus hoặc focus danh sách sau xoá.
- Tìm nguồn theo nhãn/providerKey/ngôn ngữ, không dấu/hoa thường, debounce 350ms và IME. Query q/animeId/seasonId/episodeId/sourceId/enabled/sort/page/pageSize; Back/Forward đồng bộ control. Danh sách nguồn phân trang 5/10/20, giữ query, đổi lọc về trang 1, chuẩn hoá trang vượt cuối bằng replace. Phụ đề của nguồn được chọn hiển thị cùng trang.
- Không tạo source/track giả sẵn: seed có 24 phim, 22 mùa, 155 tập nhưng nguồn và phụ đề ban đầu rỗng. Có empty/loading/error/retry, ID không hợp lệ không tự mở nội dung khác. Dữ liệu chỉ là bản sao quản trị trong bộ nhớ; không ghi localStorage hay fixture công khai.

## Validation và quan hệ

Nhãn trim 1–100 ký tự; providerKey chữ thường ASCII/số/dấu nối 1–50 ký tự. Ngôn ngữ theo mã locale hợp lệ (vi, ja, en-US), chuẩn hoá bằng Intl. Địa chỉ tối đa 2048 ký tự: HTTPS hoặc đường dẫn nội bộ bắt đầu bằng `/`; không nhận protocol-relative, tài khoản trong URL, fragment, khoảng trắng/backslash/control. Đây là kiểm tra cú pháp FE, không chứng minh tồn tại, định dạng nội dung hoặc quyền truy cập tài nguyên.

Trong một tập, nhãn nguồn không trùng (không dấu/hoa thường), địa chỉ không trùng sau trim. Trong một nguồn, không trùng địa chỉ track hoặc cặp ngôn ngữ/nhãn. ID giữ nguyên khi sửa, không chuyển nguồn sang tập khác hoặc phụ đề sang nguồn khác. Tập/nguồn cha phải tồn tại; kiểm tra tại repository trước commit kể cả hai thao tác đồng thời.

Nguồn còn phụ đề bị chặn xoá; tập còn nguồn bị chặn xoá trong cả repository mùa/tập. Không cascade, không xoá tệp hoặc lịch sử. Xoá track mặc định để nguồn không còn mặc định. Thay đổi chỉ tác động workspace cùng phiên.

## Giới hạn playback

Địa chỉ chỉ là tham chiếu cấu hình chưa kiểm chứng, hiển thị dạng văn bản. Form không fetch/HEAD, dựng video/track/iframe, tải hoặc mở URL. Không cung cấp nguồn phim thật, upload, kiểm tra nhà cung cấp, cấp URL ký số, chuyển SRT sang VTT hoặc parser HLS. MP4/HLS/VTT/SRT ở đây là metadata quản trị, không phải cam kết player đã hỗ trợ tất cả định dạng.

enabled không đồng nghĩa phát được. Lưu cấu hình không đặt hasPlayback=true, không thay publishedAt/status của tập hoặc số video khả dụng trên Dashboard. [Trang xem](watch-screen.md) tiếp tục dùng repository công khai riêng và báo thiếu video. Khi nối BE cần contract cấp URL phát, xác thực/permission, kiểm tra nguồn, CORS, MIME/phụ đề và đồng bộ player riêng theo yêu cầu.

## Source và kiểm chứng

- Route ghép `FE/src/app/routes/admin/playback.tsx`, lazy trong router chung; feature `features/admin-playback/` gồm hook catalog, parser/query, MediaForm, dialog và màn hình.
- DTO `types/admin-playback.ts`, contract `lib/api/contracts/admin-playback-repository.ts`, mock adapter `lib/api/mock/mock-admin-playback-repository.ts`, validation `utils/admin-playback-validation.ts`. Workspace dùng chung với Anime/Mùa/Tập nhưng adapter có quyền riêng, trả clone.
- Dùng common Button/Input/Selectbox/Pagination, Tailwind tw:, font tối thiểu 14px, không CSS hoặc dependency mới. Bảng nguồn cuộn trong region có nhãn, mobile không tràn trang.
- Dev `mock=error|empty` cho trạng thái danh sách; `mock=save-error`/`delete-error` gây lỗi thao tác đầu trong form/dialog rồi cho retry. Không thêm panel debug trên sản phẩm.
- `FE/tests/admin-playback.browser.mjs` kiểm tra UI, repository và production; bằng chứng thực tế nối thêm vào [verification](verification.md). Không gọi API/model hoặc nguồn bên ngoài trong kiểm tra.

## Cập nhật phân trang — 2026-10-31

Danh sách records dùng [Pagination chung](rules/common/pagination.md) ở cả trên và dưới; hai thanh đồng bộ trang và URL, vẫn hiện khi có một trang. Ô chọn số bản ghi mỗi trang nằm bên phải thanh trên, chỉ có một ô và không còn ở bộ lọc/tiêu đề/thanh dưới. Đổi số lượng về trang 1, giữ bộ lọc; Form GET giữ pageSize bằng hidden Input. Khi không có records, giữ ô số lượng phía trên và ẩn thanh dưới. Không áp dụng ô số lượng cho màn công khai.
