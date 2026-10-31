# Dashboard quản trị

Đã triển khai FE tại `/admin` ngày 2026-10-30. Dashboard tổng hợp dữ liệu từ cùng workspace của [Quản lý anime](admin-anime-screen.md), đã có thêm/sửa/xoá mẫu theo quyền. Dashboard không có CRUD riêng; chưa có API hoặc xác thực quản trị thật.

## Mở màn hình

Chạy từ SRC: `pnpm --filter anime-web-fe run dev -- --port 4174`. Server dev đã được kiểm tra tại `http://127.0.0.1:4174`.

1. Mở `/admin`, chọn **Đăng nhập**.
2. Tại trang đăng nhập có returnTo quản trị, chọn **Dùng phiên quản trị mẫu**.
3. Chọn **Tiếp tục về trang đã yêu cầu** để vào Dashboard.

Phiên mẫu phải được mở chủ động, chỉ có trong dev và chỉ tồn tại trong bộ nhớ. **Dùng phiên quản trị mẫu** có quyền đọc Dashboard/Anime/Thể loại/Mùa và tập/Người dùng; **Dùng phiên quản trị có quyền chỉnh sửa** thêm quyền ghi Anime/Thể loại/Mùa và tập. Xem các mã trong [quy tắc admin](rules/admin-screens.md). Tải lại trang sẽ kết thúc phiên; đăng xuất/đổi phiên đặt lại workspace seed. Member không có quyền admin. Production không có cả hai nút mở phiên mẫu và từ chối truy cập khi chưa có nguồn quyền quản trị thật.

Sau khi mở phiên mẫu, avatar ở Header hoặc AdminLayout có menu Dashboard quản trị, Đổi tài khoản và Đăng xuất; AdminLayout còn có Trang xem phim. Member thường dùng avatar để vào Trang cá nhân/Thư viện, không có link admin.

Nếu đang dùng member mà vào `/admin`, trang thiếu quyền có nút **Đổi phiên đăng nhập**. Không tạo hoặc lưu user admin vào kho hồ sơ/phiên cá nhân; claim admin/permissions tự thêm trong localStorage bị bỏ qua. Phiên mẫu không được coi là tài khoản thành viên để đọc thư viện, ghi bình luận hoặc tiến độ.

## Nội dung và hành vi

- Layout riêng: sidebar, breadcrumb, tên phiên, đăng xuất và đường về giao diện xem phim. Không dùng Header/Footer công khai bên trong AdminLayout. Sidebar có Dashboard/Anime/Thể loại/Người dùng, lọc theo quyền đọc riêng; URL quản trị con chưa có hiển thị not found và đường quay lại. [Người dùng](admin-users-screen.md) chỉ đọc fixture riêng, không thêm số liệu người dùng vào Dashboard danh mục.
- Bốn chỉ số ở seed ban đầu: 24 anime, 155 tập đã công bố, 3 anime sắp ra mắt, 155 tập chưa có video. Sau CRUD, mở lại/làm mới Dashboard tính phim/trạng thái/thể loại/mùa/tập từ workspace phiên. Tập nháp không tính vào số tập công bố; phim mới không tự có tập. Không tính lượt xem/doanh thu/người dùng giả.
- Phân bố trạng thái seed: 8 đang phát hành, 13 hoàn thành, 3 sắp ra mắt; tiến trình có nhãn cho screen reader. Tình trạng nội dung seed gồm 22 mùa/phần, 5 thể loại trong danh mục và 0/155 tập có nguồn phát.
- Sáu phim cập nhật gần đây được sắp theo publishedAt của tập đã công bố trong workspace, rồi ID ổn định. Cột cập nhật là ngày công bố metadata tập, không phải thời điểm sửa phim thật. Poster cục bộ có fallback, liên kết Xem chỉ mở chi tiết công khai nếu phim thuộc seed.
- Nút Làm mới tổng hợp lại repository, có pending. Loading/error/retry/empty riêng; Dashboard không có thao tác ghi. Link công khai giữ slug gốc của seed; phim chỉ có trong workspace không có link công khai giả. Không gọi API, không sửa fixture hoặc localStorage.
- Responsive 375/768/1440px. Sidebar chuyển thành vùng menu mở/đóng dưới 1000px, tự focus link khi mở, Escape đóng và trả focus về nút mở. Đây là disclosure không modal, không chặn focus phần nội dung. Bảng cuộn ngang trong vùng có nhãn, cả trang không tràn ngang.
- Toàn bộ layout dùng utility Tailwind, font 14px, common Button/Icon/Artwork/ContentState và design tokens hiện có. Không thêm dependency hoặc CSS riêng.

Dashboard bổ sung menu [Quản lý thể loại](admin-genres-screen.md) theo admin:genre:read. Phiên chỉnh sửa có thêm admin:genre:write; thống kê “Thể loại trong danh mục” tính tất cả thể loại của workspace, kể cả chưa gán phim. CRUD thể loại chỉ tác động dữ liệu quản trị cùng phiên.

## Source và ranh giới

Từ 2026-10-31, Dashboard có [Top 10 phim được xem nhiều nhất](rules/common/top-viewed-anime.md) phía trên Phim cập nhật gần đây. Component và dữ liệu topViewed dùng chung với Trang chủ, lấy danh mục công khai cùng tổng lượt xem hư cấu đã định nghĩa ở fixture. Ghi rõ số liệu mẫu; không có analytics/API thật hoặc tự tăng lượt. Xếp giảm dần theo viewCount rồi ID, loại upcoming, tối đa 10; có poster/hạng/tên/lượt xem/link chi tiết. Phần này độc lập workspace CRUD quản trị để giữ cùng bảng xếp hạng công khai ở hai màn; các metric và bảng gần đây vẫn lấy workspace như trước. Không thêm pagination cho Top 10.

- `FE/src/app/routes/admin/root.tsx`: guard phiên/quyền, ghép AdminLayout/Outlet và đăng xuất.
- `FE/src/app/routes/admin/dashboard.tsx`: màn hình ghép hook và DashboardOverview.
- `FE/src/features/admin-dashboard/`: lấy dữ liệu và hiển thị thống kê; không import feature khác.
- `FE/src/components/layouts/admin-layout.tsx`: layout dùng chung, nhận menu/nhãn trang/tên phiên/callback qua props; xem [API layout](rules/common/admin-layout.md).
- `FE/src/lib/api/contracts/admin-dashboard-repository.ts` và `mock/mock-admin-dashboard-repository.ts`: contract/adapter tổng hợp fixture, hỗ trợ AbortSignal, chỉ chọn adapter qua repositories.ts. Entity ở types/admin.ts.
- `FE/src/stores/session.tsx`: adminPreview riêng với user member, openAdminPreview chỉ chạy trong dev và không persist. Activation fixture tại testing/mocks/fixtures/admin-session.ts; AuthScreen chỉ hiện activation khi login có returnTo thuộc `/admin`.
- `FE/src/config/paths.ts`, `app/router.tsx`: thêm nhánh admin trong router chung, giữ nguyên URL/màn hình công khai.

## Kiểm chứng

Menu [Nguồn phát và phụ đề](admin-playback-screen.md) theo admin:playback:read; phiên chỉnh sửa có admin:playback:write. Đây là cấu hình chưa kiểm chứng: thêm/bật nguồn không tự giảm số “Tập chưa có video” hoặc đặt hasPlayback. Menu [Bình luận](admin-comments-screen.md) theo admin:comment:read, kiểm duyệt cần admin:comment:moderate. Sidebar hiện có bảy mục theo quyền riêng; không thêm số liệu kiểm duyệt giả vào Dashboard.

`tests/admin-dashboard.browser.mjs` export verifyAdminDashboard và verifyAdminProduction. Dev kiểm tra guest/member/claim giả, opt-in phiên mẫu chỉ đọc, dữ liệu tính từ seed, refresh, query `mock=loading|error|empty`, retry, menu/focus/Escape, responsive, URL con chưa có, liên kết chi tiết/Back, reload, đổi về member và logout khi đang tải. Mock state chỉ được đọc trong dev; truy cập trực tiếp URL có mock vẫn phải kiểm tra quyền.

Production kiểm tra guest/member bị từ chối, không có nút mở phiên mẫu và không lộ Dashboard. Không coi các test này là xác nhận quyền BE. Hồi quy màn hình cũ và kết quả thực tế ghi thêm tại [verification.md](verification.md).
