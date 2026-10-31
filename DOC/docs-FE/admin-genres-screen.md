# Quản lý thể loại

Đã triển khai FE mock tại `/admin/genres` ngày 2026-10-30. Có danh sách, tìm/lọc/sort/phân trang, thêm/sửa trên form ngắn cùng màn hình và xoá qua xác nhận. Không tạo route form riêng hoặc kết nối API quản trị BE.

## Mở màn hình

Từ SRC chạy `pnpm --filter anime-web-fe run dev --port 4174`, mở `http://127.0.0.1:4174/admin/genres`.

Chọn **Đăng nhập → Dùng phiên quản trị có quyền chỉnh sửa → Tiếp tục về trang đã yêu cầu**. Hoặc vào Dashboard rồi chọn **Quản lý thể loại** ở sidebar. **Dùng phiên quản trị mẫu** vẫn là lựa chọn chỉ đọc; tài khoản member không có quyền admin. Production từ chối khi chưa có auth/quyền thật.

Phiên chỉ đọc có `admin:genre:read`; phiên chỉnh sửa thêm `admin:genre:write`, cùng các quyền anime đã triển khai. Không nhận quyền từ URL/localStorage. Mỗi phiên dùng một workspace bộ nhớ riêng; tải lại, đăng xuất hoặc đổi phiên đặt lại seed. Đây chỉ là mô phỏng FE.

## Danh sách và điều hướng

- Seed năm thể loại từ catalog hiện có, ID ổn định `genre-<slug ban đầu>`. Bảng có tên, slug, số phim đang sử dụng và hành động theo quyền. Đếm từ cùng workspace quản trị Anime, không phải số liệu server.
- Tìm tên/slug không phân biệt dấu và hoa thường sau 350ms, Enter tìm ngay; composition không gửi giữa chừng. Không có nút tìm kiếm/chip từ khóa. Timer huỷ khi điều hướng/unmount, Back/Forward đồng bộ ô nhập; replace chuẩn hoá không xoá nội dung vừa gõ.
- Query `q`, `usage` (tất cả/used/unused), `sort` (name/name-desc), `page`, `pageSize` (5/10/20) trên URL. Đổi điều kiện về trang 1; Pagination giữ điều kiện; giá trị sai chuẩn hoá và trang vượt cuối clamp bằng replace theo mock FE hiện có.
- Link số phim mở `/admin/anime?genre=<slug>` để xem danh sách liên quan. Slug thể loại không tồn tại trả danh sách phim rỗng, không bỏ điều kiện để hiện toàn bộ phim.
- Desktop form ở cột phải, dưới 1000px xếp dưới danh sách; Button Thêm/Sửa đưa focus tới tên. Bảng cuộn ngang trong vùng có nhãn/focus bàn phím, không làm tràn trang ở 375/768/1440. Dùng Tailwind, font 14px và common Button/Input/Selectbox/Icon/Pagination/ContentState; không CSS/dependency mới. Icon `tags` là named import Font Awesome đóng gói cục bộ.

## Thêm, sửa, xoá và liên kết Anime

- Form tên và slug bắt buộc tối đa 100 ký tự. Slug chỉ chữ thường ASCII/số/dấu nối; tên được trim, chuẩn hoá NFC và gộp khoảng trắng. Kiểm tra trùng tên không dấu/hoa thường, trùng slug và giữ ID khi sửa.
- Validation cạnh field, focus lỗi đầu tiên, pending chặn gửi lặp, lỗi giữ dữ liệu, thông báo thành công sau repository xác nhận. Huỷ/rời màn hình/đổi phiên abort request và bỏ draft, không ghi sau abort.
- Sửa tên cập nhật nhãn thể loại trên các anime liên quan trong cùng workspace, giữ ID thể loại và số phim. Sửa slug cập nhật lựa chọn/filter quản trị; không sửa danh mục công khai.
- Thể loại mới xuất hiện trong checkbox form anime và bộ lọc quản trị. Validation anime ở cả form/repository dùng danh sách thể loại của phiên. Sau khi gán/bỏ thể loại trong anime, số phim sử dụng cập nhật khi mở lại/làm mới trang thể loại.
- Xoá bằng native dialog có tên thể loại/hậu quả/phạm vi, focus Huỷ, Tab/Escape/trả focus, pending và lỗi/thử lại. Repository kiểm tra lại quan hệ trước commit, chặn xoá khi còn bất kỳ phim sử dụng; không xoá cascade hoặc tự bỏ thể loại khỏi phim. Thể loại chưa được dùng có thể xoá.
- Dashboard tổng hợp số thể loại trong danh mục quản trị (gồm cả chưa dùng), không tự tạo phim/tập cho thể loại mới. Fixture, bộ lọc công khai và dữ liệu cá nhân giữ nguyên.

## Source, trạng thái và kiểm chứng

Route `FE/src/app/routes/admin/genres.tsx`; feature độc lập `features/admin-genres/{components,hooks,utils}`. Contract tại `lib/api/contracts/admin-genre-repository.ts`, adapter tại `lib/api/mock/mock-admin-genre-repository.ts`, chọn adapter ở repositories.ts. `admin-catalog-workspace.ts` giữ bản sao anime + thể loại trong WeakMap theo phiên; các repository kiểm tra quyền riêng. `options` cho phép quyền đọc Anime lấy taxonomy tối thiểu để nhập phim mà không yêu cầu quyền quản lý thể loại.

Có loading/empty/error/retry/thiếu quyền. Chỉ dev nhận `mock=loading|empty|error|forbidden|save-error|delete-error`. Save/delete error mô phỏng lần đầu trên form/dialog; thử lại tiếp tục kiểm tra dữ liệu và quan hệ thật của workspace. Các query không cấp thêm quyền. Repository/hook dùng AbortSignal, key theo phiên/query/lần thử và lọc response cũ.

Browser `tests/admin-genres.browser.mjs` export `verifyAdminGenres` và `verifyAdminGenresProduction`. Fixture repository hiện có bổ sung kiểm tra guard thể loại, liên kết/đổi tên/filter Anime, ràng buộc xoá, độc lập phiên, abort và slug trùng đồng thời. Kết quả thực tế nối thêm tại [verification.md](verification.md).

Xem [quản trị](rules/admin-screens.md), [routes](rules/routes.md), [Quản lý anime](admin-anime-screen.md) và [Dashboard](admin-dashboard-screen.md).

## Cập nhật phân trang — 2026-10-31

Danh sách records dùng [Pagination chung](rules/common/pagination.md) ở cả trên và dưới; hai thanh đồng bộ trang và URL, vẫn hiện khi có một trang. Ô chọn số bản ghi mỗi trang nằm bên phải thanh trên, chỉ có một ô và không còn ở bộ lọc/tiêu đề/thanh dưới. Đổi số lượng về trang 1, giữ bộ lọc; Form GET giữ pageSize bằng hidden Input. Khi không có records, giữ ô số lượng phía trên và ẩn thanh dưới. Không áp dụng ô số lượng cho màn công khai.
