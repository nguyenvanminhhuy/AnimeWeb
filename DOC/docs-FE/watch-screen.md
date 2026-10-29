# Màn hình Xem phim

Route công khai `/watch/:episodeId`. Ví dụ: `/watch/episode-01-03`, ngoại truyện `/watch/episode-01-side-a`, điện ảnh `/watch/episode-04-01`. Dùng cùng fixture với Trang chủ, Chi tiết anime và Thư viện; không yêu cầu đăng nhập để mở player.

## Giao diện và hành vi

- Header/breadcrumb, tên anime, mùa và tên tập; liên kết về thông tin phim.
- Player ở bên trái, danh sách tập bên phải trên desktop; dưới 1000px danh sách nằm dưới player. Chế độ rạp mở rộng player và đưa danh sách xuống dưới; trạng thái rạp/tự chuyển giữ khi đổi tập trong SPA, đặt lại khi rời màn hình hoặc reload.
- Chọn mùa dùng query `season`, chỉ thay danh sách đang duyệt; không tự đổi tập hiện tại. Query không hợp lệ được chuẩn hóa bằng replace về mùa của tập hiện tại. Click tập cập nhật route và trở về mùa của tập đó. Back/Forward/reload giữ episodeId và query.
- Tập trước/sau lấy từ danh sách published đã sắp theo mùa.sortOrder rồi tập.sortOrder; không cộng ID hoặc số tập. Đi qua ranh giới mùa và ngoại truyện có ID không liên tiếp. Đầu/cuối danh sách có Button disabled.
- Tái sử dụng Button, Icon, Input checkbox unstyled, Selectbox, ContentState, SessionProvider và paths. Toàn bộ layout/style mới dùng Tailwind, không thêm stylesheet hoặc dependency.
- Không thêm chữ demo vào nhãn Button. Giới hạn dữ liệu và nguồn phát được mô tả trong nội dung trang.

## Nguồn phát và tiến độ

**Hiện không có asset video.** Repository trả sources rỗng; trang hiển thị “Chưa có video demo”, Nguồn phát disabled, thông báo chưa có phụ đề. Không tạo video với URL rỗng, không tải video/CDN ngoài và không tạo tiến độ chỉ vì mở/chuyển tập. Loading, lỗi/thử lại, danh sách rỗng và tập không tồn tại/chưa công bố có trạng thái riêng.

VideoPlayer đã có nhánh native video controls/playsInline, chọn nguồn, track phụ đề, khôi phục vị trí sau metadata, lỗi và thử phát lại. Kiểu nguồn hiện hỗ trợ MP4/WebM native; chưa có HLS adapter. Toggle tự chuyển chỉ điều hướng khi nhận ended và có tập tiếp theo; không tự phát video ở tập mới, tuân theo thao tác người dùng/chính sách autoplay.

Thành viên có progress:write:own lưu theo tài khoản/episodeId trong schema aw:account:v1 hiện có. Chỉ ghi sau playing và khi duration hợp lệ; timeupdate giới hạn 10 giây, flush khi pause/ended/ẩn trang/pagehide/chuyển tập. ended đánh dấu hoàn thành; tập đã hoàn thành mở lại từ đầu. Đổi nguồn giữ mốc đã lưu gần nhất; đổi tài khoản/đăng xuất không cho callback phiên trước ghi vào tài khoản hiện tại. Khi storage lỗi, giữ tiến độ trong phiên và báo không lưu được. Guest không ghi tiến độ, có link đăng nhập giữ returnTo. Không thay API hoặc giả lập xác thực BE.

## Source

- `FE/src/app/routes/watch.tsx`: ghép trang, mùa/query, trước/sau, chế độ rạp/tự chuyển và lựa chọn nguồn.
- `FE/src/features/player/`: useWatchEpisode và VideoPlayer; types chia sẻ tại `FE/src/types/player.ts`.
- `FE/src/lib/api/contracts/playback-repository.ts`, `lib/api/mock/mock-playback-repository.ts`: lấy metadata tập công khai và nguồn; adapter được chọn tại repositories.ts.
- `SessionProvider.saveProgress`: kiểm tra chủ phiên, gộp tiến độ và lưu qua local adapter đang có. Không gọi localStorage trong page/player.
- Route Watch thay placeholder; DestinationPage chỉ còn trang không tìm thấy.

## Kiểm chứng

`tests/watch.browser.mjs` export verifyWatch(browser, baseURL): responsive 375/768/1440px, rạp/tự chuyển qua navigation, mùa/tập thường/ngoại truyện/điện ảnh, lịch sử/reload, query sai, draft/404, mock loading/error/retry/empty, guest/member/returnTo và không ghi lịch sử khi thiếu video.

`tests/player.browser.mjs` export verifyPlayer(browser, baseURL), dùng fixture `tests/fixtures/player.html` riêng: mô phỏng sự kiện media và duration/currentTime để kiểm tra resume, throttle, pause/ended, đổi tập/tài khoản/đăng xuất, lỗi/retry và quota. Fixture không nằm trong router hoặc production entry. **Các test sự kiện này không chứng minh phát/seek/phụ đề/autoplay hoạt động với một asset video thực.** Cần bổ sung video được phép sử dụng và kiểm chứng playback thực tế trước khi bàn giao khả năng xem video.

Chạy qua Chromium đã có trong workspace theo [hướng dẫn route](rules/routes.md#kiểm-chứng); kết quả thực tế được bổ sung tại [verification.md](verification.md).
