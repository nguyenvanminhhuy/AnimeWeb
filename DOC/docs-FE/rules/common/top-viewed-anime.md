# Danh sách phim có lượt xem cao nhất

Source `FE/src/components/anime/top-viewed-anime.tsx`, dùng chung ở Dashboard và Trang chủ. Component nhận `items: readonly TopViewedAnimeEntry[]`, mỗi item gồm `anime: Anime` và `viewCount: number`. Chỉ hiển thị danh sách, không gọi repository hoặc import feature.

- Tiêu đề “Top 10 phim được xem nhiều nhất”, thứ hạng 01–10, poster có fallback, tên phim, tổng lượt xem định dạng vi-VN và React Router Link đến chi tiết công khai. Không đặt tập phim lên poster hoặc thêm icon hover. Heading dùng useId; danh sách ol/li giữ thứ tự đọc. Font tối thiểu 14px, Tailwind, hai cột desktop/tablet và một cột mobile.
- Hai repository trả cùng dữ liệu topViewed trong HomeCatalog/AdminDashboardData từ `lib/api/mock/top-viewed-anime.ts`. Adapter lấy danh mục công khai và fixture `testing/mocks/fixtures/anime-views.ts`, loại upcoming/không có lượt xem dương, sắp viewCount giảm dần rồi ID tăng dần, lấy tối đa 10. Trả bản sao gồm cả genres; không sửa seed.
- Đây là tổng lượt xem **hư cấu dùng cho giao diện mẫu**, không có thống kê thật hoặc khoảng thời gian ngày/tuần/tháng. Giao diện ghi rõ “Số liệu mẫu”; không tăng số lượt khi mở trang/nhấn link, không nối vào player/analytics hoặc tự gọi API. Khi tích hợp dữ liệu thật cần cập nhật contract nguồn thống kê và thông báo tương ứng.
- Bảng xếp hạng dùng cùng snapshot công khai trên hai màn, độc lập với bộ lọc đề xuất của Trang chủ và workspace CRUD quản trị. Phim chỉ có trong workspace không có số lượt xem/public URL nên không xuất hiện. Thống kê khác của Dashboard tiếp tục lấy workspace như trước.
- Empty trả topViewed rỗng; component có lời nhắc chưa có dữ liệu. Loading/error/retry và guard do màn/hook hiện có quản lý. Không thêm pagination hoặc ô pageSize cho bảng Top 10 cố định này.

Kiểm chứng `tests/top-viewed-anime.browser.mjs` export verifyTopViewedAnime: cùng dữ liệu giữa hai màn, thứ tự/số lượng/lượt xem/link, guest guard, bộ lọc độc lập, responsive, loại upcoming và bản sao không sửa dữ liệu nguồn. Chạy cùng verifyHome và verifyAdminDashboard theo [hướng dẫn browser](../routes.md#kiểm-chứng).
