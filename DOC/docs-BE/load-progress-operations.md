# Kiểm thử tải, tiến độ nhiều thiết bị và giám sát

Triển khai 2026-11-03, tiếp nối [nhiều người cùng xem](concurrent-viewers.md). Không migration/schema mới, không thay database dev hoặc tự chạy server dev.

## Kiểm thử HTTP thật

`RealHttpLoadTests` chạy Kestrel trên cổng loopback ngẫu nhiên và PostgreSQL test54330/schema riêng, không dùng TestServer cho lưu lượng đo. Tạo50 account fixture, tăng mức đồng thời 5 →20 →50, mỗi user lần lượt đọc home/catalog/playback, PUT progress riêng và GET Range64KiB từ payload256KiB chỉ tồn tại trong test assembly. Endpoint file test không có trong app triển khai. Không tải video bên ngoài, không decode video/audio hoặc giả lập mạng Internet.

Mặc định mỗi user3 vòng, tổng675 request, dùng như smoke load trong suite. Biến ANIMEWEB_LOAD_SECONDS=1..60 bật tải duy trì từng mức, 0 giữ smoke. Report lưu BE/.local/load-tests/latest.json và smoke.json/sustained.json tương ứng, không chứa token/email/credentials. Có số request, thời gian, req/s, p50/p95/p99 đo từ gửi request đến đọc hết body, status counts, số byte body, working set và CPU time của tiến trình test/server. Dữ liệu nhỏ chạy loopback, latency gồm cả thời gian đọc body; không coi đây là SLA.

Chạy riêng từ BE:

```powershell
docker compose -f compose.test.yaml up -d --wait
$env:ANIMEWEB_TEST_DATABASE='Host=127.0.0.1;Port=54330;Database=animeweb_test;Username=animeweb_test;Password=animeweb_test_only'
$env:ANIMEWEB_LOAD_SECONDS='10'
dotnet test AnimeWeb.slnx --filter 'Category=Load' --artifacts-path .local/load-operations-validation
Remove-Item Env:ANIMEWEB_LOAD_SECONDS
docker compose -f compose.test.yaml stop
```

Credential ở ví dụ chỉ dành cho compose test cục bộ. Fixture kiểm tra đúng host127.0.0.1/port54330/database/user test trước khi tạo schema. Không trỏ bài tải vào production. Rate limits fixture Global10000/Auth1000, không đo giới hạn rate mặc định; các test rate limit riêng vẫn kiểm tra429. Mỗi schema có pool max8 và đóng pool sau dispose. Load collection chạy riêng để không tranh CPU/kết nối với các collection khác; không tăng max_connections của database dev/test để giấu lỗi. Khi triển khai nhiều instance phải tính tổng pool budget theo giới hạn PostgreSQL, không áp số8 của fixture thành cấu hình production mặc định.

Kết quả lượt duy trì ngày2026-11-03 09:08UTC, mỗi mức10 giây, pool8:

| User đồng thời | Request | Req/s | p50 ms | p95 ms | p99 ms | 429/5xx |
| --- | --- | --- | --- | --- | --- | --- |
| 5 | 4074 | 406.29 | 11.71 | 20.11 | 34.40 | 0/0 |
| 20 | 5817 | 578.52 | 36.09 | 54.95 | 64.66 | 0/0 |
| 50 | 6276 | 617.04 | 86.17 | 125.58 | 144.56 | 0/0 |

Tổng16167 request, tất cả200/206; số liệu gốc tại sustained.json trên máy kiểm chứng. Đây là baseline ngắn của máy dev với HTTP API + file mẫu, **không kết luận50/1000 người xem phim liên tục**, không đo CDN, TLS/WAN, codec, adaptive bitrate hoặc soak test nhiều giờ. Cần lặp lại trên hạ tầng mục tiêu, theo dõi cả lỗi, pool, CPU/IO và băng thông video.

## Cùng tài khoản xem nhiều thiết bị

Progress vẫn có PK UserId+EpisodeId và optimistic version. PUT me/progress/{episodeId} trả409 `PROGRESS_CONFLICT` khi version cũ hoặc hai thiết bị cùng tạo bản ghi. Không dùng timestamp từ client hoặc tự lấy vị trí lớn nhất: người dùng có thể chủ động xem lại từ đầu.

Khi gặp409, SessionProvider chặn các lần ghi tiếp theo cho tập đó, tải snapshot mới và player tạm dừng. Cả ghi đã xếp hàng, pause/ended/unmount đều kiểm tra trạng thái chặn. Không auto-retry với version mới để âm thầm ghi đè tiến độ thiết bị khác.

- “Dùng tiến độ đã lưu”: tải snapshot mới nhất một lần nữa, cập nhật version, tua về vị trí đó (tập hoàn tất về0), giữ player paused. Người dùng bấm phát để tiếp tục.
- “Tiếp tục ở vị trí hiện tại”: tải lại version nhưng giữ vị trí hiện tại; lần playing/pause/timeupdate sau mới ghi với version đã đồng bộ. Không tự phát.
- Nếu lại có ghi đồng thời giữa tải snapshot và ghi, vẫn trả409 và hỏi lại. Tải snapshot lỗi giữ chặn và cho thử lại; không xác nhận thành công giả.
- Chặn chỉ tập bị xung đột; tập khác vẫn lưu được. Đổi tài khoản/đăng xuất xoá trạng thái xung đột; kiểm tra auth revision ngăn response cũ cập nhật tài khoản mới. Guest không lưu progress.

Không khoá tài khoản, không giới hạn số thiết bị, không dùng “last write wins” và chưa có đồng bộ realtime qua WebSocket. Xung đột được phát hiện khi có request ghi. API không đổi body/response progress thành công hoặc schema.

## Giám sát vận hành

Trang FE `/admin/operations`, menu “Giám sát vận hành”, quyền `admin:dashboard:read` cho admin/manage; user/guest không đọc được. GET `/api/v1/admin/operations` trả `{data:{runtime,databaseReady,databaseProbeMs}}`; không mutation. Refresh thủ công, có loading/error/retry, bảng cuộn mobile.

Runtime DTO gồm instanceId, startedAt, activeRequests, requests[], database timing, clientPlaybackFailures theo media/hls/subtitle/expired, cleanup lastRunAt/lastSuccessAt/removed/errorType. Timing gồm name/count/errors(5xx)/limited(429)/averageMs/p95UpperBoundMs/maxMs. Database probe có timeout2 giây, không trả connection string/lỗi chi tiết; trạng thái false khi probe thất bại. ActiveRequests bao gồm request xem giám sát đang chạy.

Request middleware ghi route **pattern**, không URL có ID/query; giới hạn128 pattern + nhómother, không giữ từng request hoặc IP/tài khoản. DB interceptor chỉ ghi thời gian/số lệnh async/thất bại, không SQL, parameters hoặc PasswordHash. Histogram cố định từ5ms đến10000ms và overflow; P95 trên trang là **cận trên bucket**, không phải percentile chính xác từ toàn bộ samples. Counter tính từ startup, reset khi restart, không có lịch sử dài hạn/rolling window, không tổng hợp nhiều BE instance.

Log request chậm>=1000ms hoặc5xx chứa requestId, route pattern, status và elapsed; không body/token/cookie/query/URL nguồn ký. Cleanup worker ghi lần chạy/thành công/số xoá hoặc tên loại lỗi, giữ timestamp thành công cũ khi lần mới lỗi. Meter `AnimeWeb.Operations` xuất `animeweb.http.duration` (ms, tags route/status), `animeweb.playback.client_failures` (tag kind) cho diagnostics listener; chưa tự cài collector/exporter/Prometheus/Grafana hay gửi cảnh báo ra ngoài. Pool sử dụng/đợi không nằm trong timing lệnh DB; bổ sung collector Npgsql/host metrics khi triển khai nếu cần đo phần này.

POST `/api/v1/common/episodes/{episodeId}/playback-reports`, body chỉ `{kind:"media"|"hls"|"subtitle"|"expired"}`, trả204. Episode/anime phải published; invalid body400, không tồn tại404, rate20/phút theo account/IP, override RateLimits:Telemetry. Không nhận URL, message tuỳ ý hoặc payload khác. FE báo tối đa một lần/loại/attempt của player, best effort, không làm gián đoạn xem nếu report thất bại. Endpoint ghi counter trong bộ nhớ, không lưu DB, không phải audit log hoặc bằng chứng nguồn phim hỏng: dữ liệu do client báo có thể sai/spam trong hạn mức.

## Kiểm chứng

RealHttpLoadTests, OperationsTests/OperationsBoundsTests và kiểm thử progress đồng thời chạy cùng suite PostgreSQL. FE `multi-device-progress.browser.mjs` giả lập hai lần xung đột, chặn autosave, chọn remote/local và dùng version mới; `operations.browser.mjs` kiểm tra route manager, metrics, refresh/mobile bằng HTTP giả. Hồi quy player/media hiện có. Bằng chứng đã chạy tại verification mỗi phía; không gọi API/provider thật.
