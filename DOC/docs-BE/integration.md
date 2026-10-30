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
| Player/progress | Watch UI/native video đã có, nguồn mock còn trống, tiến độ local | Nối playback/đồng bộ theo contract; không coi dữ liệu demo là lịch sử thật |

DTO genres đề xuất là object id/slug/name, còn Anime FE dùng string[]. FE có subtitle và episodeLabel phục vụ hiển thị. Mapper quy định cách chuyển/derive, không ép BE trả tên trường trình bày. Format, hasPlayback, related và danh sách tập cần rà soát cùng [api.md](api.md).

Cập nhật feature Anime 2026-10-30: API list/detail/genres đã có, FE vẫn dùng mock. API tìm không phân biệt hoa thường nhưng chưa bỏ dấu; page vượt cuối giữ nguyên page và data rỗng, khác mock tự clamp page. DTO detail chưa có seasons/episodes/related; không tự coi màn hình chi tiết FE đã tích hợp chỉ vì có endpoint theo slug. Xem quy tắc chính xác trong API contract trước khi viết mapper.

## Trình tự đề xuất

Cập nhật Mùa và tập 2026-10-30: đã có API danh sách mùa, danh sách tập phân trang và chi tiết tập với animeId/animeSlug. Adapter FE cần tải hết các trang cần thiết khi ghép AnimeDetail; không tự coi một page là toàn bộ tập. durationSeconds nullable khi chưa biết trong BE, khác number bắt buộc ở type FE hiện tại; cần mapper/hiển thị thời lượng chưa biết khi tích hợp. hasPlayback hiện false, chưa có nguồn phát. Chưa sửa source FE trong lượt generate BE.

1. Chốt phần thiếu trong contract; giữ mock/local adapter để phát triển độc lập.
2. Khi triển khai, tạo HTTP client/DTO/mapper ở `FE/src/lib/api`; gom lỗi, 204, timeout và AbortSignal. Component không gọi fetch trực tiếp.
3. Nối common trước; sau đó nối phiên thật và cache theo tài khoản.
4. Tách interface library/progress nếu chưa có; nối me theo user đã xác thực.
5. Nối comments, playback và tiến độ; kiểm tra nguồn trống/hết hạn/lỗi provider.

Không tự nhập dữ liệu demo vào tài khoản thật. Nếu cần, thiết kế xác nhận và quy tắc hợp nhất riêng. Kiểm tra bằng server/database cục bộ và fake provider; không gọi dịch vụ thật.

## Tích hợp ASP.NET Core

FE vẫn dùng HTTP/JSON, không phụ thuộc ngôn ngữ C#. Controller trả camelCase, enum string và envelope đúng contract; mapper FE không nhận entity EF hoặc navigation properties. Cấu hình CORS theo origin FE thực tế. Cookie credentials/CSRF hay bearer token chỉ được nối sau khi cơ chế phiên đã chốt; không suy ra từ local demo auth.

Request FE hủy qua AbortSignal tương ứng request cancellation phía API; service/EF nhận CancellationToken. Giữ xử lý 401/403/404/503 và DELETE 204 nhất quán. Nguồn video/subtitle do provider trả cần cấu hình truy cập riêng; CORS API không tự giải quyết CORS media.
