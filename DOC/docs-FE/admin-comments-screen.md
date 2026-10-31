# Quản lý bình luận

FE mock triển khai ngày 2026-10-31 theo screen-generation. Alias Comment/Comments/Bình luận/Quản lý bình luận/Kiểm duyệt bình luận mở `/admin/comments`. Chi tiết cùng màn hình qua query commentId, ví dụ `/admin/comments?commentId=comment-fixture-01`.

## Mở màn hình

Từ SRC chạy `pnpm --filter anime-web-fe run dev`. Vào route quản trị → Đăng nhập → Dùng phiên quản trị mẫu (chỉ đọc) hoặc Dùng phiên quản trị có quyền chỉnh sửa (có kiểm duyệt) → Tiếp tục về trang đã yêu cầu. Menu Quản lý bình luận chỉ hiện theo quyền đọc. Phiên riêng chỉ bật chủ động trong dev; production từ chối khi chưa có nguồn quyền tin cậy. Reload/đăng xuất/đổi phiên bỏ toàn bộ thay đổi kiểm duyệt mẫu.

## Phạm vi và chính sách FE mock

- Đọc cần `admin:comment:read`, ẩn/hiện lại cần thêm `admin:comment:moderate`. Quyền comment:update:own của member không dùng để kiểm duyệt người khác. Không tạo CRUD nội dung, xoá cứng, sửa tác giả, cấp role hoặc hành động hàng loạt.
- Chỉ visible → hidden (Ẩn) và hidden → visible (Hiện lại). Deleted không được khôi phục hoặc kiểm duyệt. Nội dung deleted bị lược bỏ ngay trong DTO (`body: null`), không dùng nội dung gốc để tìm kiếm hoặc render.
- Trước mỗi thao tác mở dialog mô tả đối tượng/hậu quả, nhập lý do trim 3–300 ký tự, xác nhận hoặc Huỷ. Pending khoá gửi lặp; lỗi giữ lý do và cho thử lại. Focus Huỷ lúc mở, focus input khi lỗi, Escape khi không pending và trả focus khi đóng.
- Chỉ ghi status/updatedAt và lần kiểm duyệt gần nhất (action, reason, moderatorName từ phiên, moderatedAt UTC). Không sửa body/userId/authorName/createdAt. Đây là metadata mẫu trong bộ nhớ, không phải audit log bền vững hoặc contract kiểm duyệt BE đã chốt.
- Adapter kiểm tra quyền trước/sau delay, trạng thái ngay trước commit và AbortSignal. Hai yêu cầu cùng ẩn một bình luận: chỉ một thành công, yêu cầu còn lại nhận lỗi trạng thái đã thay đổi. Đổi phiên/unmount huỷ request đang chờ.

Mặc định lý do bắt buộc và chỉ lưu lần kiểm duyệt gần nhất là lựa chọn FE cho lần generate này. Cần chốt contract nghiệp vụ, auth và audit thật trước khi nối BE theo [quy tắc quản trị](rules/admin-screens.md); không tự bổ sung endpoint kiểm duyệt vào API chung.

## Dữ liệu và giao diện

Fixture 24 bình luận hư cấu: 12 visible, 6 hidden, 6 deleted. Gồm bản sao bốn comment fixture công khai và 20 bình luận bổ sung cho phim seed đã có tập công bố. Kho WeakMap theo đối tượng adminPreview, tách khỏi registry tài khoản và `aw:comments:v1:*`. Không đọc hoặc sửa bình luận cá nhân localStorage; không thay fixture công khai. Ẩn trong quản trị không thay danh sách bình luận trên trang phim công khai của mock hiện tại.

Thống kê theo toàn bộ workspace, bộ lọc theo q/animeId/status/sort/page/pageSize trên URL. Tìm nội dung còn được cung cấp, tên/mã tác giả và ID, không dấu/hoa thường; debounce 350ms/IME, không chip từ khoá. Đổi điều kiện về trang 1 và đóng panel; Back/Forward đồng bộ control. Sắp mới nhất/cũ nhất/cập nhật gần nhất, khoá phụ ID; hiển thị ngày theo Asia/Ho_Chi_Minh. Phân trang 5/10/20 dùng common Pagination, clamp trang vượt cuối bằng replace, giữ filter.

Panel chi tiết mở qua commentId, xem đầy đủ nội dung dạng văn bản, metadata và lần kiểm duyệt gần nhất. Deleted có lời giải thích và không có hành động. Không tạo profile giả cho tác giả fixture; Xem trang phim chỉ liên kết publicSlug seed hợp lệ. Sau kiểm duyệt panel giữ bình luận đã chọn để thấy trạng thái mới, kể cả khi dòng không còn thuộc bộ lọc. Đóng trả focus về dòng mở hoặc tiêu đề danh sách nếu dòng không còn hiển thị.

Desktop bảng và panel hai cột; dưới breakpoint tablet panel xuống dưới. Bảng HTML/caption/header cuộn trong region có nhãn; không làm tràn ngang trang. Dùng common Button/Input/Selectbox/Pagination/Avatar, Tailwind tw:, font tối thiểu 14px, không thêm CSS/dependency. Nội dung/lý do không render HTML.

## Source và kiểm chứng

- `FE/src/app/routes/admin/comments.tsx` ghép feature; router lazy, paths tập trung và guard AdminRoot.
- `features/admin-comments/`: catalog hook, query helpers, màn hình và dialog kiểm duyệt. DTO chia sẻ tại `types/admin-comment.ts`, validation lý do tại `utils/admin-comment-validation.ts`.
- Contract `lib/api/contracts/admin-comment-repository.ts`: getCatalog/moderate. Adapter `lib/api/mock/mock-admin-comment-repository.ts` và fixture `testing/mocks/fixtures/admin-comments.ts` được tải lazy qua repositories.ts, không tăng tải fixture ở lần mở giao diện công khai. Response clone, không lộ tham chiếu workspace.
- Loading/empty/error/retry/thiếu quyền và ID không tồn tại. Dev `mock=error|empty` cho danh sách, `mock=moderation-error` gây lỗi lần kiểm duyệt đầu trong dialog rồi cho retry; không cấp quyền qua query.
- Browser/repository `FE/tests/admin-comments.browser.mjs`; bằng chứng nối thêm vào [verification](verification.md). Chưa có API/auth/kiểm duyệt thật, không gọi API/model hoặc dịch vụ ngoài khi kiểm tra.

## Cập nhật phân trang — 2026-10-31

Danh sách records dùng [Pagination chung](rules/common/pagination.md) ở cả trên và dưới; hai thanh đồng bộ trang và URL, vẫn hiện khi có một trang. Ô chọn số bản ghi mỗi trang nằm bên phải thanh trên, chỉ có một ô và không còn ở bộ lọc/tiêu đề/thanh dưới. Đổi số lượng về trang 1, giữ bộ lọc; Form GET giữ pageSize bằng hidden Input. Khi không có records, giữ ô số lượng phía trên và ẩn thanh dưới. Không áp dụng ô số lượng cho màn công khai.
