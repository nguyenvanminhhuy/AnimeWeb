# Nhiều người dùng cùng truy cập và xem phim

Cập nhật 2026-11-03. Đã triển khai nền cho một BE instance; không có thay đổi schema hoặc migration trong lượt này. Cấu hình tham khảo không chứa credentials tại [traffic.example.json](../../BE/config/traffic.example.json), **không tự động được nạp**. Đặt các giá trị bằng biến môi trường hoặc cơ chế cấu hình triển khai hiện có.

## Rate limit và proxy

BE xác thực trước rate limiter để chia hạn mức theo ID tài khoản active lấy từ phiên server. Guest/phiên không hợp lệ dùng IP, không dùng userId/header do client khai báo. Các nhóm có ngân sách riêng theo cửa sổ một phút:

| Key cấu hình | Mặc định | Phạm vi |
| --- | --- | --- |
| RateLimits:PublicRead | 600 | GET/HEAD guest, mỗi IP |
| RateLimits:UserRead | 240 | GET/HEAD đã đăng nhập, mỗi user |
| RateLimits:UserWrite | 60 | Mutation khác, mỗi user hoặc IP khi guest |
| RateLimits:Progress | 30 | Ghi me/progress, mỗi user |
| RateLimits:View | 120 | Tạo/xác nhận view session, mỗi user hoặc IP guest |
| RateLimits:Auth | 10 | Login/register/change-password, mỗi IP |

Logout dùng nhóm write theo tài khoản, không chia sẻ ngân sách login/register theo IP. Cấu hình riêng từng key được ưu tiên; `RateLimits:Global` cũ là fallback nếu key chưa có, sau đó mới dùng mặc định trong bảng. Giới hạn hợp lệ 1–1.000.000, restart để áp dụng. Hết hạn mức trả JSON 429 theo contract và header Retry-After theo giây; không xếp hàng request.

`UseForwardedHeaders` chạy trước xác thực/rate limit. Chỉ nhận X-Forwarded-For/Proto từ `Proxy:KnownProxies`, mặc định loopback 127.0.0.1/::1, ForwardLimit=1 (hợp lệ 1–5). Không dùng X-Forwarded-Host. Proxy khác cần khai báo đúng địa chỉ và hop; không xoá trust list để tin mọi nguồn, không bật biến ASPNETCORE_FORWARDEDHEADERS_ENABLED theo chế độ tin tất cả. Proxy biên phải ghi đè hoặc thêm IP peer thật vào cuối chuỗi; Vite dev/preview đã bật xfwd. Client không thể đổi IP hạn mức bằng cách thêm prefix giả trước IP peer thật.

Ví dụ BE sau proxy cùng máy hoặc LAN tin cậy:

```powershell
$env:Proxy__KnownProxies__0='127.0.0.1'
$env:Proxy__ForwardLimit='1'
$env:RateLimits__UserRead='240'
$env:RateLimits__Progress='30'
dotnet run
```

Xác thực đã bỏ đọc toàn bộ Account/profile khi chỉ cần claims: lấy userId/status phiên và hai truy vấn role/permission. Không tải PasswordHash vào truy vấn xác thực/profile này. Vẫn đọc quyền từ DB mỗi request, không cache trạng thái để vô hiệu hoá khoá/đổi role/logout. Guest chung NAT vẫn dùng chung hạn mức IP theo chủ ý; rate limiter hiện ở từng tiến trình, chưa phân tán qua nhiều BE.

## Cache dữ liệu công khai

Cache server chỉ dành cho DTO của common/home (key genre), common/catalog/options và common/rankings/anime (key limit). Dùng chung cho guest/user vì dữ liệu ba endpoint này hoàn toàn công khai; không cache session, me, admin, comments, danh sách/detail anime, episode hoặc playback URL.

Mặc định TTL 10 giây, cấu hình CatalogCache:Enabled/Seconds (Seconds clamp 1–60), tối đa 128 mục; TTL tuyệt đối, không kéo dài theo mỗi lượt đọc. Lượt view mới có thể chậm xuất hiện trên bảng xếp hạng/trang chủ tối đa TTL. Các lỗi/tác vụ huỷ không được cache.

Một semaphore điều phối cache miss: cùng key chỉ nạp một lần, request chờ có thể huỷ. Mỗi lần nạp có DI scope/DbContext riêng, không dùng chung DbContext giữa request. Mutation admin thành công invalidation sau khi service commit, trước serialize response. Generation tăng ngăn request cũ nạp lại dữ liệu trước mutation vào cache mới; mutation thất bại không invalidation. Không đổi hoặc cache payload riêng tư.

Cache/generation là trong bộ nhớ của **một instance**. Khi có nhiều BE, instance khác có thể giữ DTO tổng hợp cũ đến TTL; cần cache/invalidation phân tán trước khi yêu cầu nhất quán tức thời trên cả cụm. Detail/playback luôn kiểm tra publication hiện tại. Seed/script SQL ngoài API không phát tín hiệu invalidation; chờ TTL hoặc restart sau seed.

## Dọn phiên xem

Hosted worker mặc định mỗi 5 phút xoá tối đa 1.000 ViewSession có StartedAt cũ hơn 60 phút; chạy lần đầu sau interval để không phụ thuộc startup/migration. Phiên chỉ được xác nhận trong 10 phút, retention tối thiểu 15 phút. Retention hợp lệ 15–10.080 phút, interval 1–60, batch 1–10.000. Có thể tắt ViewSessionCleanup:Enabled.

Chỉ xoá phiên tạm, không xoá ViewEvents, lịch sử, progress, library hoặc phiên đăng nhập. Dùng index StartedAt hiện có; mỗi lượt xử lý một batch để tránh transaction lớn. Backlog lớn cần tăng batch/giảm interval theo số đo thực tế. Lỗi được ghi dạng loại lỗi rồi thử lại ở interval sau, không log connection string/token. Dừng app huỷ worker.

## Video trên LAN và khi triển khai

Database vẫn giữ URL nguồn ban đầu. DirectPlaybackProvider chỉ đổi URL loopback có path `/media/...` khi trả playback metadata, không tải file và không sửa database:

- Development, không có PublicMediaBaseUrl: trả path `/media/...`, trình duyệt dùng origin FE đang mở; tránh trỏ về localhost của máy người xem khác.
- Có `Playback:PublicMediaBaseUrl`: ghép base (có thể có prefix) với path `/media/...`, áp dụng cả phụ đề local thuộc `/media/`. Ví dụ base `https://media.example.com/anime` → `https://media.example.com/anime/media/open-movies/big-buck-bunny.mp4`.
- Production/staging thiếu base khi nguồn vẫn local: 503 MEDIA_NOT_CONFIGURED, thay vì trả URL localhost không dùng được. Base phải HTTPS, không userinfo/query/fragment; HTTP chỉ được phép trong Development. URL nguồn ngoài/URL ký sẵn giữ nguyên.

Để test cùng mạng, chạy FE trong thư mục FE bằng `pnpm exec vite --host 0.0.0.0 --port 5173`, truy cập từ máy khác qua IP LAN của máy chạy FE. FE vẫn proxy /api về BE local. Cần mạng/firewall cho phép cổng FE; không cần mở PostgreSQL ra LAN. Muốn dùng host media khác ở dev:

```powershell
$env:Playback__PublicMediaBaseUrl='http://192.0.2.10:5173'
dotnet run
```

Địa chỉ 192.0.2.10 chỉ là ví dụ tài liệu, thay bằng địa chỉ thực. Khi triển khai, đặt PublicMediaBaseUrl bằng domain thật và phục vụ đúng file qua máy chủ media/object storage/CDN; nâng cấp này chưa tạo CDN, upload, chuyển mã hoặc tự mua hạ tầng. Video mẫu vẫn ở FE/public/media/open-movies và Vite chỉ dành cho dev. Server production phải phục vụ byte ranges để tua, MIME/cache headers đúng và CORS phù hợp nếu phụ đề/HLS nằm khác origin; không đưa nội dung video qua truy vấn database.

Băng thông video thường lớn hơn tải metadata. Ví dụ 100 người × bitrate trung bình 3 Mb/s xấp xỉ 300 Mb/s dữ liệu video, chưa kể overhead. Cache JSON không thay thế CDN/băng thông media.

## Kiểm tra và giới hạn kết luận

- TrafficTests: proxy tin cậy/không tin cậy, spoof prefix, IP IPv4/mapped IPv6, guest có budget độc lập và JSON429/Retry-After.
- ConcurrentViewerTests: hai account chung IP không tranh read/progress budget; 20 request cache miss chỉ tốn một lần nạp DB; invalidation khi archive; invalidation khi request cũ đang nạp và huỷ request chờ; cleanup theo lô giữ phiên active/ViewEvents.
- Ca 20 tài khoản xem cùng một tập: 20 GET playback + 20 PUT progress + 20 start-view + 40 confirm đồng thời; 40 confirm ghi đúng 20 ViewEvents, progress từng user độc lập. Thời gian chờ playback 31 giây được mô phỏng bằng timestamp fixture.
- PlaybackAddressTests kiểm tra URL rewrite/validation/prod503, không gọi nguồn thật. FE `pnpm --filter anime-web-fe exec node tests/proxy-forwarding.mjs` dùng Vite config thật và HTTP stub local với port ngẫu nhiên; không mở server BE.

Các ca trên là kiểm thử tích hợp TestServer/PostgreSQL riêng, không phải tải 20 luồng video, không xác nhận sức chịu tải 100/1.000 user trên production. Trước mở rộng cần đo HTTP throughput/p95/429/5xx, pool kết nối/CPU/IO database và băng thông media trên hạ tầng thực; hiện chưa chạy benchmark mạng/video thật hoặc triển khai nhiều instance.

Tham khảo thiết kế proxy từ [Microsoft ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/proxy-load-balancer?view=aspnetcore-10.0). Cache trong dự án là cache DTO riêng có scope/khóa/generation, không phải OutputCache mặc định.
