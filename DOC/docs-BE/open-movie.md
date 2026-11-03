# Phim có thể xem trong môi trường local

Cập nhật 2026-11-03: không cần sửa từng URL seed để test LAN. BE trả nguồn local `/media/...` trong Development để trình duyệt dùng đúng origin FE đang mở; deployment cấu hình Playback:PublicMediaBaseUrl. Xem [nhiều người cùng xem](concurrent-viewers.md#video-trên-lan-và-khi-triển-khai). URL localhost trong seed bên dưới vẫn giữ nguyên ở database.

Đã thêm riêng **Big Buck Bunny (2008)** của Blender Foundation, giấy phép [CC BY 3.0](https://peach.blender.org/about/), để trải nghiệm player. Không gán video này cho các anime khác trong catalog.

- [Trang chi tiết local](http://127.0.0.1:5173/anime/big-buck-bunny).
- [Xem phim local](http://127.0.0.1:5173/watch/episode_open_bbb).
- Bản MP4 đầy đủ 320×180, khoảng 9 phút 56 giây; metadata thời lượng làm tròn lên 597 giây. Không có phụ đề tiếng Việt.
- Có track âm thanh AAC (mp4a); đã xác nhận browser giải mã audio và tín hiệu Web Audio khác 0, volume 1/muted false. Nếu không nghe, kiểm tra nút loa player, tab trình duyệt và Windows Volume Mixer/thiết bị phát. Kiểm chứng này không kiểm tra loa vật lý của máy người dùng.
- Poster/thumbnail tại `FE/public/images/big-buck-bunny-poster.png` là khung hình trích từ chính phim khoảng giây 62, giữ attribution/CC BY 3.0 như phim. Không dùng ảnh fallback làm poster.
- Ghi công: **(c) copyright 2008, Blender Foundation / www.bigbuckbunny.org**. Ghi công và giấy phép cũng có trong synopsis hiển thị ở trang chi tiết.

## Setup trên máy clone mới

Mở Docker Desktop, chạy BE bằng `dotnet run`. Tại terminal khác trong `Anime-Web/BE`:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/setup-open-movie.ps1
```

Script tải [ZIP MP4 từ máy chủ Blender](https://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4.zip) vào `BE/.local/open-movies`, chỉ lấy đúng entry MP4 tới đường dẫn cố định `FE/public/media/open-movies/big-buck-bunny.mp4`. ZIP khoảng 65 MB. Phim được phục vụ local bởi Vite; lúc xem không phụ thuộc máy chủ Blender. Các file tải về/provenance không được commit.

SQL tại `BE/scripts/seed-open-movie.sql` chạy qua psql trong đúng container dev, một transaction có advisory lock. Thêm một anime, một phần, một tập published, một nguồn MP4 enabled và liên kết genre comedy nếu có; dùng ID cố định và không ghi đè dữ liệu đã có khi chạy lại. Không đọc .env, không đổi schema/role hoặc thông tin đăng nhập. Không cần tắt BE/FE để setup.

Sau đó tại `Anime-Web/FE` chạy `pnpm run dev` như thường lệ. URL nguồn dev cố định `http://127.0.0.1:5173/media/open-movies/big-buck-bunny.mp4`; nếu đổi host/port hoặc triển khai, cập nhật nguồn trong trang quản lý nguồn phát cho phù hợp. Đây là cách setup phim mẫu local; production nên dùng nơi lưu media/reverse proxy/CDN riêng. Thư mục public được Vite copy khi build, nên video mẫu cũng xuất hiện trong dist nếu file đang có trên máy build.

Nếu tải ZIP dở, xóa riêng file ZIP đó trong BE/.local/open-movies rồi chạy lại. Nếu MP4 local thiếu bytes, script dừng và yêu cầu xóa riêng file MP4 đó trước khi chạy lại. Không xóa volume PostgreSQL.

## Thêm phim khác để xem

Trong phiên **admin** có quyền ghi, tạo/chỉnh phim tại `/admin/anime`, tạo phần và tập published tại `/admin/episodes`, rồi chọn tập và thêm nguồn tại `/admin/playback`. Nguồn cần URL trực tiếp tới MP4 hoặc playlist HLS (.m3u8), chọn đúng loại và bật enabled. URL trang thông tin phim hoặc trang xem YouTube không phải nguồn MP4/HLS trực tiếp cho player hiện tại. Phụ đề là dữ liệu riêng, có thể thêm VTT/SRT khi có.

Chỉ thêm nội dung/nguồn bạn có quyền sử dụng. Các anime nhập từ dataset vẫn chỉ có metadata cho tới khi được bổ sung tập và nguồn riêng; thiếu synopsis hiển thị rõ là chưa có mô tả. Danh sách alternativeTitles được giữ như tên khác, không dùng làm mô tả.

Trang chủ và sort mặc định Khám phá ưu tiên phim có tập published và nguồn enabled chưa hết hạn, trước phân trang. Trong mỗi nhóm vẫn dùng thứ tự phụ năm/ngày cập nhật và ID ổn định; sort Tên A–Z và bảng xếp hạng lượt xem vẫn giữ đúng ý nghĩa. Nguồn lỗi URL hoặc file bị xóa vẫn cần sửa trong quản lý nguồn, không được thăm dò từ xa mỗi request.

## Ba phim mở bổ sung

Đã thêm các phim riêng, mỗi phim một phần/một tập đầy đủ, có poster từ khung hình và audio tiếng Anh. Giữ nguyên credit ở cuối video; chưa có phụ đề tiếng Việt.

| Phim | Bản local | Thời lượng thực đo | Xem |
| --- | --- | --- | --- |
| Sintel (2010) | 564×240 | 14:48 | [Xem Sintel](http://127.0.0.1:5173/watch/episode_open_sintel) |
| Elephants Dream (2006) | 426×240 | 10:54 | [Xem Elephants Dream](http://127.0.0.1:5173/watch/episode_open_elephants_dream) |
| Tears of Steel (2012), người đóng kết hợp CGI | 640×360 | 12:14 | [Xem Tears of Steel](http://127.0.0.1:5173/watch/episode_open_tears_of_steel) |

Tại `Anime-Web/BE`, sau khi dev database chạy:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/setup-more-open-movies.ps1
```

Danh mục nguồn, dung lượng, checksum, ghi công, giấy phép và mô tả nằm ở `scripts/more-open-movies.json`. Script tải ba MP4 khoảng 206 MB tổng cộng từ các bản phân phối Internet Archive, kiểm đúng số byte và SHA1 của file metadata trước khi ghi database. Lưu video trong thư mục public/media/open-movies đã gitignore; poster PNG nằm trong public/images và được giữ trong source. Không cài thêm phần mềm hoặc dependencies.

Mọi record được thêm qua `scripts/seed-more-open-movies.sql` trong một transaction/advisory lock. JSON metadata truyền dưới dạng literal dollar-quoted với delimiter ngẫu nhiên, không nối field thành SQL. ID cố định, ON CONFLICT không ghi đè; chạy lại không tạo phim/tập/nguồn trùng. Không tự migrate, xóa phim khác hoặc thay đổi tài khoản. File provenance SHA256 riêng mỗi phim nằm tại BE/.local/open-movies. Khi xem, toàn bộ video/poster được phục vụ local, không gọi Internet Archive.

Nguồn và attribution:

- **Sintel:** Blender Foundation | durian.blender.org, [CC BY 3.0 / sharing](https://durian.blender.org/sharing/). Bản MP4 từ [Internet Archive/Sintel](https://archive.org/details/Sintel), file `sintel-2048-stereo_512kb.mp4`. Giữ đầy đủ credit scroll theo yêu cầu nguồn.
- **Elephants Dream:** Orange Open Movie Project Studio / Blender Foundation / Netherlands Media Art Institute | orange.blender.org. Dự án công bố phim mở theo Creative Commons tại [trang tải chính thức](https://orange.blender.org/download/); bản phân phối [Internet Archive/ElephantsDream](https://archive.org/details/ElephantsDream) khai báo CC BY 3.0 US, file `ed_1024_512kb.mp4`. Manifest ghi nguyên thông tin giấy phép của bản phân phối này.
- **Tears of Steel:** Blender Foundation | mango.blender.org, [CC BY 3.0 / sharing](https://mango.blender.org/sharing/). Bản MP4 đầy đủ từ [Internet Archive/tweakers006325](https://archive.org/details/tweakers006325); giấy phép của tác phẩm đối chiếu với dự án Blender, không suy từ metadata mirror vì mirror không khai báo licenseurl. Phim kết hợp người đóng và kỹ xảo; không mô tả là hoạt hình hoàn toàn.

Poster được trích từ khoảng giây 62 của mỗi video, giữ attribution/giấy phép của phim tương ứng, không phải ảnh fallback. Synopsis trong database cũng ghi công và dẫn link giấy phép. Chất lượng thấp vừa đủ test player, seek, audio và giao diện; không phải bản HD.
