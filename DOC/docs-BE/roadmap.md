# Lộ trình backend

## Hiện trạng sau triển khai 2026-11-01

Các bước BE trong bảng bên dưới đã được triển khai theo bộ mặc định người dùng xác nhận và contract v0.3: Auth/quyền, cá nhân, Playback metadata, admin, Home/related/ranking. Bảng giữ thứ tự phụ thuộc để tham chiếu; các mục “cần quyết định” trong kế hoạch cũ đã được thay bằng quyết định đầu API contract khi có lựa chọn tương ứng. Xem [hiện trạng](current-status.md) và verification.

Phần tiếp theo chưa làm: nối HTTP adapter/session/form/version vào FE; hỗ trợ player HLS/SRT; kiểm tra media thật/MIME/range/CORS; vận hành HTTPS, limiter nhiều instance, vòng đời/dọn session và deploy khi được yêu cầu. Đây không phải module BE chưa có. Không tự thêm CRUD user, gán role, upload, avatar hoặc quên mật khẩu.

Đây là thứ tự đề xuất, chưa cam kết thời hạn. Đối chiếu [roadmap chung](../roadmap.md); ghi lựa chọn được xác nhận tại [decisions.md](../decisions.md).

| Bước | Công việc | Điều kiện hoàn thành |
| --- | --- | --- |
| 1. Đồng bộ đặc tả | Đã có stack, nền, sáu API Anime/Mùa/tập; handoff FE là nguồn nhu cầu | Mỗi feature cập nhật API contract và chốt phần mở trước generate |
| 2. Tích hợp common | HTTP client/mapper và sáu API đọc đã có; FE còn mock | Explore/detail metadata, query/DTO/nullable/meta/options/404 đúng |
| 3. Playback/media | Đặc tả nguồn/phụ đề/expiry, provider/fake; ghép mùa/tập đã có | Guest phát/chuyển tập, đủ playlist, phân biệt nguồn rỗng/404/503 |
| 4. Auth/quyền | Register/login/logout/me/change-password, phiên và quyền user/manage/admin | Thu hồi/hết phiên/blocked, permission và hai user cách ly; không tin demo |
| 5. Cá nhân | Library/progress/comments, summary và đồng bộ FE | Counts đúng tập/phim, bỏ favorite giữ history, own và concurrency đã chốt |
| 6. Admin nội dung | Anime/genres → mùa/tập → nguồn/phụ đề, list/detail/options và ghi theo quyền | DB bền vững, publication/public đồng bộ, constraint/delete/concurrency đúng |
| 7. Admin bổ sung | Comments moderation, users chỉ đọc, Dashboard aggregate | manage chỉ đọc; admin kiểm duyệt theo quyền; summary/audit đúng, không CRUD user |
| 8. Home/related/ranking | Tiêu chí biên tập và định nghĩa view/thống kê, cùng ranking Home/Dashboard | Dữ liệu thật đúng nghĩa nhóm, không fixture giả analytics |
| 9. Nghiệm thu từng luồng | Adapter/cache/refetch theo phiên, URL/direct link và lỗi | Có bằng chứng theo testing.md sau mỗi module, ghi rõ giới hạn media |

Đồng bộ 2026-11-01 theo [handoff](../fe-backend-handoff.md). Các bước là kế hoạch theo phụ thuộc, không yêu cầu viết cả hệ thống. Auth/Playback có thể phát triển độc lập; Auth phải có trước API cá nhân/admin. Home không phụ thuộc view có thể làm sớm; ranking thật chờ định nghĩa view. Nền/Anime/Mùa/tập đã có kiểm chứng lịch sử tại verification, các module mới chưa triển khai.

## Cần quyết định

- Cơ chế phiên, endpoint auth, thu hồi và chính sách mật khẩu nếu có.
- Workflow xuất bản/ẩn anime trong admin, publishedAt/republication của tập; không hỏi lại publication đọc public đã xác nhận.
- DTO Home/related/options, mapping format/genres/nullable và cách tải playlist đủ trang.
- q/sort/summary library/progress, đơn vị tập/phim, hoàn thành/xem lại, xung đột nhiều thiết bị/thời lượng chưa biết. Không tự nhập demo vào tài khoản thật.
- Bình luận hiện ngay hay duyệt trước, giới hạn body/request; moderation reason và audit theo contract.
- HLS/MP4/WebM, VTT/SRT, media hợp lệ/expiry/CORS; nguồn view, chống trùng và thời điểm tổng hợp ranking.
- Admin DTO/query, lookup/detail, quy tắc xoá/concurrency/409 và định nghĩa metrics/summary.

Các lựa chọn ở mục này còn mở, chỉ chốt khi chọn feature liên quan. Stack/version đã pin tại setup; nhiều mùa, movie một mùa/một tập và hành vi đọc Anime/Mùa/tập đã xác nhận. Role user/manage/admin và phạm vi quyền đã có quy định, auth runtime còn thiếu. Tạo tài liệu không tự kích hoạt viết backend hoặc xuất bản dịch vụ.
