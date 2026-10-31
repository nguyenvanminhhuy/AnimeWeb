# Quản lý người dùng

Đã triển khai FE tại `/admin/users` ngày 2026-10-30 theo screen-generation. Màn hình chỉ đọc: danh sách, tìm/lọc/sort/phân trang và hồ sơ cơ bản. Theo rule quản trị hiện tại, chưa có chính sách/quyền thay trạng thái, xoá tài khoản, cấp role hoặc reset mật khẩu; không hiển thị các hành động này.

## Mở màn hình và quyền

Từ SRC chạy `pnpm --filter anime-web-fe run dev --port 4174`, mở `http://127.0.0.1:4174/admin/users`.

Chọn **Đăng nhập → Dùng phiên quản trị mẫu → Tiếp tục về trang đã yêu cầu**, hoặc chọn **Quản lý người dùng** ở sidebar sau khi mở preview. Cả lựa chọn chỉ đọc và có quyền chỉnh sửa Anime/Thể loại đều có `admin:user:read`; không thêm permission ghi User.

Guest/member bị guard và giữ returnTo nội bộ. Permission đọc được kiểm tra tại route/hook/repository, không suy ra từ tên role hoặc email. Preview chỉ bật chủ động trong dev, không lưu sau reload; production từ chối khi chưa có auth/quyền BE đáng tin cậy.

## Dữ liệu và phạm vi hiển thị

- Fixture riêng gồm 24 người dùng hư cấu: 18 active, 6 blocked, tất cả là member. ID `admin-user-001` đến `admin-user-024`, email miền `.test`, ngày tạo mẫu trong tháng 10/2026. Trạng thái là metadata hiển thị, không khoá hồ sơ đăng nhập thật hoặc demo.
- Các bản ghi này độc lập với viewer/newcomer và registry đăng ký cục bộ. Không đọc/ghi danh sách tài khoản từ localStorage; không đọc mật khẩu, token, phiên thiết bị hoặc thư viện/lịch sử người khác.
- DTO chỉ có id, displayName, email, status, roles và createdAt. Mọi response là bản sao; caller không thể sửa fixture bằng cách đổi object nhận được. Repository chỉ có list/getById, không có mutation.
- Ba thẻ thống kê tính trên toàn bộ fixture (hoặc fixture empty khi thử trạng thái), không theo bộ lọc hiện tại; số kết quả nằm riêng trên danh sách. Không trình bày đây là số liệu vận hành BE.

## Danh sách và hồ sơ

- Input tìm tên/email/ID, không phân biệt dấu/hoa thường, debounce 350ms và Enter tìm ngay. Composition tiếng Việt không gửi giữa chừng; timer huỷ khi điều hướng/unmount. Không có nút tìm kiếm hoặc chip từ khóa.
- Selectbox trạng thái tất cả/active/blocked, sort newest/oldest/name và pageSize 10/20/50. Query q/status/sort/page/pageSize nằm trên URL; thay điều kiện về trang 1. Pagination giữ query, giá trị sai được chuẩn hoá và trang vượt cuối clamp bằng replace theo mock FE hiện có.
- Bảng semantic có Avatar chữ viết tắt, tên/email/ID, trạng thái, vai trò Thành viên, ngày tạo và Link Xem hồ sơ. Ngày hiển thị vi-VN, múi giờ Asia/Ho_Chi_Minh. Không có avatar từ URL ngoài.
- Xem hồ sơ thêm `userId` vào cùng URL, giữ bộ lọc/trang. Hồ sơ nằm cột phải trên desktop và dưới bảng ở ≤1000px; có tên/email, Avatar lớn, trạng thái, ID/vai trò/ngày tạo. Không phải modal và không trap focus.
- Mở/chuyển hồ sơ focus tiêu đề panel; đóng trả focus link mở nếu còn trên trang, nếu không thì focus tiêu đề danh sách. Link đóng bỏ userId; Back/Forward khôi phục panel. Phân trang giữ userId; thay tìm/lọc/sort/pageSize đóng panel theo chính sách thay điều kiện của màn hình. Direct URL với userId vẫn tải đúng hồ sơ sau khi mở lại phiên mẫu.
- Có loading/error/retry/not found riêng cho hồ sơ, không render dữ liệu ID trước như của ID mới. Huỷ request khi đổi ID/phiên hoặc rời trang. Làm mới tải lại danh sách; hồ sơ có nút thử lại riêng khi lỗi.
- Responsive 375/768/1440, bảng chỉ cuộn trong vùng có nhãn/focus bàn phím. Tailwind/font 14px, common Button/Input/Selectbox/Icon/Avatar/Pagination/ContentState; không CSS hoặc dependency mới.

## Source và mock states

Route `FE/src/app/routes/admin/users.tsx` ghép feature `features/admin-users/{components,hooks,utils}`; paths/router tập trung. Contract `lib/api/contracts/admin-user-repository.ts`, adapter `lib/api/mock/mock-admin-user-repository.ts`, fixture `testing/mocks/fixtures/admin-users.ts`; chọn adapter trong repositories.ts. Không import chéo feature hoặc thay đổi model phiên member.

Chỉ dev hỗ trợ `mock=loading|empty|error|forbidden` cho danh sách và `detail-loading|detail-empty|detail-error` cho hồ sơ. Retry bỏ mock lỗi, giữ query và userId. Mỗi response gắn key theo phiên/query/ID/lần thử, dùng AbortSignal để bỏ tác vụ cũ. Không có query nào cấp quyền hoặc ghi dữ liệu.

`tests/admin-users.browser.mjs` export verifyAdminUsers/verifyAdminUsersProduction; `tests/admin-users-repository.browser.mjs` kiểm tra quyền adapter, role giả, DTO, clone, not found và abort. Kiểm chứng thực tế nối thêm tại [verification.md](verification.md).

Xem [quy tắc quản trị](rules/admin-screens.md), [route](rules/routes.md), [common](rules/common/readme.md) và [quyền](rules/roles-permissions.md). Đây là UI mock, chưa tích hợp API/auth quản trị hoặc quản lý tài khoản thật.

## Cập nhật phân trang — 2026-10-31

Danh sách records dùng [Pagination chung](rules/common/pagination.md) ở cả trên và dưới; hai thanh đồng bộ trang và URL, vẫn hiện khi có một trang. Ô chọn số bản ghi mỗi trang nằm bên phải thanh trên, chỉ có một ô và không còn ở bộ lọc/tiêu đề/thanh dưới. Đổi số lượng về trang 1, giữ bộ lọc; Form GET giữ pageSize bằng hidden Input. Khi không có records, giữ ô số lượng phía trên và ẩn thanh dưới. Không áp dụng ô số lượng cho màn công khai.
