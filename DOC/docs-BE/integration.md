# Tích hợp backend với FE

Đã đối chiếu interface trong `FE/src/lib/api/contracts`, entity chia sẻ tại `FE/src/types` và `FE/src/lib/api/repositories.ts`. FE chọn mock anime, local demo auth và local comments; chưa có HTTP adapter hoạt động. Thư viện/tiến độ dùng `FE/src/lib/storage/demo-account.ts`, phiên dùng chung ở stores/session.tsx. Các đường dẫn này được cập nhật theo cấu trúc Bulletproof React ngày 2026-10-29.

## Khoảng cách cần xử lý

| Luồng FE | Hiện tại | Khi nối BE |
| --- | --- | --- |
| Trang chủ | getHome trả featured/updated/recommended | Contract chưa có home endpoint; chốt cách tổng hợp và tiêu chí chọn |
| Khám phá | list(query, mockState) | Map query vào common/anime; mockState chỉ cho demo/test |
| Chi tiết | getBySlug trả seasons/episodes/related cùng AnimeDetail | Ghép API mùa/tập hoặc duyệt DTO tổng hợp; related chưa có hợp đồng riêng |
| Thư viện | Tab, tìm, phân trang local; getByIds lấy danh mục | Dùng summary library/progress; chưa có bulk getByIds; chốt tìm kiếm/sort |
| Auth | Profile demo, repository không nhận mật khẩu | Thiết kế luồng xác thực thật; không dùng nguyên contract demo để gửi mật khẩu |
| Comments | Local nhận CommentActor từ FE; list chưa phân trang | Server lấy user từ phiên; bỏ actor client, cập nhật hook/UI cho phân trang |
| Player/progress | Player tối thiểu, dữ liệu local | Chốt contract rồi triển khai playback/đồng bộ; không coi dữ liệu demo là lịch sử thật |

DTO genres đề xuất là object id/slug/name, còn Anime FE dùng string[]. FE có subtitle và episodeLabel phục vụ hiển thị. Mapper quy định cách chuyển/derive, không ép BE trả tên trường trình bày. Format, hasPlayback, related và danh sách tập cần rà soát cùng [api.md](api.md).

## Trình tự đề xuất

1. Chốt phần thiếu trong contract; giữ mock/local adapter để phát triển độc lập.
2. Khi triển khai, tạo HTTP client/DTO/mapper ở `FE/src/lib/api`; gom lỗi, 204, timeout và AbortSignal. Component không gọi fetch trực tiếp.
3. Nối common trước; sau đó nối phiên thật và cache theo tài khoản.
4. Tách interface library/progress nếu chưa có; nối me theo user đã xác thực.
5. Nối comments, playback và tiến độ; kiểm tra nguồn trống/hết hạn/lỗi provider.

Không tự nhập dữ liệu demo vào tài khoản thật. Nếu cần, thiết kế xác nhận và quy tắc hợp nhất riêng. Kiểm tra bằng server/database cục bộ và fake provider; không gọi dịch vụ thật.
