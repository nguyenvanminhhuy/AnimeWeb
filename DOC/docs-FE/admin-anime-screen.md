# Quản lý anime

Đã triển khai FE tại `/admin/anime` ngày 2026-10-30, gồm danh sách và chức năng thêm/sửa/xoá trong phiên mẫu riêng. Seed ban đầu có 24 anime; chưa kết nối BE hoặc có API quản trị. Chưa có upload, phát hành ra danh mục công khai hoặc quản lý tập trong màn này.

## Mở màn hình

Từ SRC chạy `pnpm --filter anime-web-fe run dev --port 4174`, mở `http://127.0.0.1:4174/admin/anime`.

1. Chọn **Đăng nhập** tại trang yêu cầu quyền.
2. Chọn **Dùng phiên quản trị có quyền chỉnh sửa** để dùng CRUD, hoặc **Dùng phiên quản trị mẫu** để chỉ đọc; sau đó **Tiếp tục về trang đã yêu cầu**.
3. Có thể chuyển giữa Dashboard và Quản lý anime qua sidebar; mobile mở bằng **Mở menu**.

Nếu đang là member, dùng **Đổi phiên đăng nhập** trước. Phiên mẫu chỉ bật chủ động trong dev, không lưu và kết thúc khi reload. Cả hai phiên có `admin:dashboard:read` và `admin:anime:read`; phiên chỉnh sửa có thêm `admin:anime:write`. Mỗi lần mở phiên tạo ID và workspace mới. Member không được nâng quyền; production từ chối truy cập cho đến khi có auth/quyền đáng tin cậy từ BE.

## Giao diện và hành vi

- Header tiêu đề, mô tả, nút Làm mới, Thêm phim khi có quyền ghi và thông báo giới hạn phiên mẫu.
- Input tìm tên tiếng Việt/tiếng Anh, có dấu hoặc không dấu. Tự tìm sau 350ms, Enter tìm ngay, không gửi giữa composition tiếng Việt, không có nút tìm kiếm hay chip từ khóa. Đổi route/unmount huỷ timer; Back/Forward đồng bộ ô nhập, chuẩn hoá URL không xoá nội dung đang gõ mới hơn.
- Selectbox thể loại, trạng thái phát hành, định dạng, năm, sắp xếp năm mới nhất/tên A–Z và 12/24 phim mỗi trang. Danh sách năm lấy từ workspace, gồm năm của phim mới; năm hợp lệ là 1–9999. Các điều kiện kết hợp AND; thay điều kiện đưa về trang 1. Đặt lại bộ lọc xoá tìm kiếm và khôi phục mặc định.
- Query `q/genre/status/format/year/sort/page/pageSize` nằm trên URL. Giá trị sai được chuẩn hoá, trang vượt cuối được đưa về trang cuối bằng replace theo mock FE hiện tại. Đây chưa phải hành vi API BE; adapter cần đối chiếu contract khi tích hợp.
- Bảng semantic có caption, header/row header, poster cục bộ, tên/ID, trạng thái phát hành, định dạng/năm, thể loại, số tập công khai và liên kết Xem chi tiết. Số tập lấy từ cùng fixture chi tiết, gồm ngoại truyện; không suy ra từ badge poster. Trạng thái phát hành không đại diện draft/published hoặc khả năng phát video.
- Dùng Pagination chung giữ query, có Back/Forward và SPA navigation. Link tên phim và Xem chi tiết chỉ có với seed có trang công khai; giữ slug công khai gốc dù metadata quản trị đã thay đổi. Phim mới chỉ có trong workspace nên không có link công khai giả.
- Bảng có vùng cuộn ngang riêng có nhãn và focus bàn phím. Bố cục 375/768/1440 không làm tràn trang; bộ lọc một cột trên điện thoại. Tailwind `tw:`, font nội dung/control tối thiểu 14px; không thêm CSS hoặc dependency.

## Thêm, sửa và xoá

| Chức năng | Route / hành vi |
| --- | --- |
| Thêm phim | `/admin/anime/new`, yêu cầu quyền đọc + ghi |
| Sửa phim | `/admin/anime/:animeId/edit`, tải bằng ID ổn định, có loading/error/retry/not found |
| Xoá phim | Button trên từng dòng, dialog xác nhận nêu rõ phim và phạm vi tác động |

- Form dùng Input, Selectbox, Button, textarea và checkbox thể loại. Bắt buộc tên (1–200 ký tự), slug duy nhất (chữ thường ASCII/số/dấu nối, tối đa 200), mô tả (1–5000), năm nguyên 1–9999, trạng thái/định dạng hợp lệ và ít nhất một thể loại. Tên tiếng Anh tuỳ chọn tối đa 200. Poster/banner chỉ chọn asset cục bộ hoặc placeholder, không nhận URL ngoài.
- Validation hiển thị cạnh field và focus lỗi đầu tiên; lỗi repository giữ dữ liệu. Pending chặn submit lặp; thành công chỉ thông báo sau repository xác nhận. Huỷ/quay lại danh sách giữ query `returnTo` nội bộ đã giới hạn `/admin/anime`; rời form hoặc đăng xuất huỷ request và bỏ draft cũ.
- ID phim tạo mới độc lập slug; sửa giữ ID và quan hệ tập. Với phim đã có tập công khai, từ chối đổi định dạng hoặc chuyển về sắp ra mắt. Chưa có thao tác chuyển publicationStatus draft/published.
- Dialog xoá có focus ban đầu tại Huỷ, Tab native trong modal, Escape khi chưa pending, trả focus nút mở khi đóng; sau xoá focus tiêu đề danh sách. Có pending và lỗi/thử lại. Repository chặn xoá phim có tập công khai, không xoá cascade tập/lịch sử/asset. Phim chưa có tập (bao gồm phim mới) có thể xoá khỏi workspace.
- Dashboard tổng hợp cùng workspace khi mở lại/làm mới nên phản ánh số phim/trạng thái/thể loại đã đổi. Số tập/mùa vẫn dựa trên quan hệ seed, không tự tạo tập cho phim mới. Danh mục công khai, thư viện cá nhân và fixture gốc giữ nguyên.
- Dữ liệu CRUD chỉ nằm trong bộ nhớ theo từng đối tượng phiên (WeakMap); tải lại/đăng xuất/đổi phiên tạo workspace seed mới, không lưu localStorage. Đây là mặc định mock FE, không phải xác thực hay dữ liệu server.

## Đồng bộ thể loại quản trị

Từ khi có [Quản lý thể loại](admin-genres-screen.md), danh sách lựa chọn trong form/bộ lọc và validation repository Anime dùng taxonomy của cùng phiên. Thể loại mới chọn được ngay; đổi tên giữ liên kết nhãn trên các phim, đổi slug dùng giá trị mới khi lọc. Slug hợp lệ nhưng không tồn tại trả rỗng, không tự bỏ điều kiện. Form chờ tải taxonomy, có lỗi/thử lại và không cho lưu khi chưa có thể loại.

`admin-catalog-workspace.ts` giữ bản sao chung Anime + Thể loại theo phiên; admin-anime-workspace.ts là wrapper kiểm tra quyền Anime và cung cấp delay có thể huỷ. Phiên chỉ đọc bổ sung admin:genre:read; phiên chỉnh sửa bổ sung admin:genre:write. Bộ lọc công khai tiếp tục dùng config/fixture gốc.

## Source và trạng thái

- Route ghép tại `FE/src/app/routes/admin/anime.tsx` và `anime-form.tsx`; router/paths tập trung. AdminRoot kiểm tra quyền đọc và lọc menu; form/hành động/repository kiểm tra quyền ghi riêng. Truy cập trực tiếp form bằng phiên chỉ đọc bị từ chối.
- Feature `FE/src/features/admin-anime/`: bộ lọc, bảng, hook và query helpers. Không import chéo feature anime/admin-dashboard.
- Contract `lib/api/contracts/admin-anime-repository.ts` có list/get/create/update/remove; adapter mock chọn tại repositories.ts. Workspace chung seed số tập từ fixture chi tiết; không ghi fixture công khai hoặc localStorage. Validation tại utils/admin-anime-validation.ts nhận tên thể loại của phiên; repository kiểm tra lại dữ liệu/slug/quyền trước khi ghi.
- Hook gắn response theo phiên/query/mock/lần thử, bỏ response cũ khi điều kiện/phiên đổi hoặc unmount qua AbortSignal. Delay 350ms của mock có thể huỷ; mutation kiểm tra quyền trước/sau delay rồi ghi nguyên tử, không ghi sau abort. Không gọi API thật.
- Có loading, empty/không có kết quả, error/thử lại và thiếu quyền. Chỉ dev nhận `mock=loading|empty|error|forbidden`; forbidden chỉ mô phỏng từ chối quyền đọc trang này, không cấp thêm quyền. Error/thử lại và Làm mới bỏ mock lỗi, giữ bộ lọc.
- Form sửa hỗ trợ `mock=error|loading` khi tải; `mock=save-error` làm lần lưu đầu thất bại, lần tiếp theo thử lại bằng dữ liệu còn giữ. Danh sách hỗ trợ `mock=delete-error` để lần xoá đầu trong dialog thất bại rồi thử lại. Các query này không thể cấp quyền ghi.

Browser `FE/tests/admin-anime.browser.mjs` export `verifyAdminAnime` cho dev và `verifyAdminAnimeProduction` cho preview; kiểm tra guard, query/SPA/Back/Forward, bộ lọc, số tập, responsive, trạng thái lỗi và không ghi dữ liệu cá nhân. Kết quả thực tế nối thêm tại [verification.md](verification.md).

`FE/tests/admin-anime-crud.browser.mjs` export `verifyAdminAnimeCrud` kiểm tra phiên chỉ đọc/có quyền ghi, validation/focus/slug trùng, thêm/sửa/xoá/xác nhận, lỗi/thử lại, huỷ request, cô lập phiên/dữ liệu công khai, Dashboard và 375/768/1440.

`FE/tests/admin-anime-repository.browser.mjs` export `verifyAdminAnimeRepository`, dùng fixture riêng ngoài router sản phẩm để kiểm tra guard ghi ở adapter, lọc field không được phép, ID không đổi, ràng buộc tập, slug trùng đồng thời, abort trước commit và fixture công khai không đổi.

Xem [quy tắc quản trị](rules/admin-screens.md), [Dashboard](admin-dashboard-screen.md), [routes](rules/routes.md) và [common](rules/common/readme.md).

Cập nhật 2026-10-31: [Mùa/phần và tập](admin-episodes-screen.md) dùng cùng workspace quản trị. PublishedEpisodes cập nhật khi tập được công bố; phim còn mùa/phần bị chặn xoá kể cả chưa có tập công bố. Không cascade. Danh mục công khai vẫn dùng fixture riêng.

## Cập nhật phân trang — 2026-10-31

Danh sách records dùng [Pagination chung](rules/common/pagination.md) ở cả trên và dưới; hai thanh đồng bộ trang và URL, vẫn hiện khi có một trang. Ô chọn số bản ghi mỗi trang nằm bên phải thanh trên, chỉ có một ô và không còn ở bộ lọc/tiêu đề/thanh dưới. Đổi số lượng về trang 1, giữ bộ lọc; Form GET giữ pageSize bằng hidden Input. Khi không có records, giữ ô số lượng phía trên và ẩn thanh dưới. Không áp dụng ô số lượng cho màn công khai.
