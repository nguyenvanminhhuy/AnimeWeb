# Dữ liệu và lưu trữ BE

Mô hình chuẩn nằm tại [entities.md](../entities.md), gồm sơ đồ quan hệ và enum đề xuất. Database/ORM chưa chọn; các ràng buộc dưới đây là thiết kế logic, chưa có migration.

| Nhóm | Entity | Ràng buộc chính |
| --- | --- | --- |
| Danh mục | Anime, Genre, AnimeGenre | Slug anime/genre duy nhất; cặp animeId/genreId không trùng |
| Mùa/tập | Season, Episode | Khóa ngoại hợp lệ; sắp theo sortOrder, thêm ID làm khóa phụ khi phân trang |
| Nguồn phát | PlaybackSource, SubtitleTrack | Đúng tập/nguồn; chỉ trả nguồn enabled của nội dung công khai |
| Tài khoản/quyền | User, Role, Permission, UserRole, RolePermission | Code role/permission duy nhất; cặp liên kết không trùng |
| Thư viện | LibraryEntry | Duy nhất userId/animeId; yêu thích độc lập trạng thái xem |
| Tiến độ | WatchProgress | Duy nhất userId/episodeId; positionSeconds không âm |
| Bình luận | Comment | Tác giả lấy từ phiên; visible/hidden/deleted; xóa mềm |

Anime.status là trạng thái phát hành `upcoming/airing/completed`, không phải trạng thái công khai. Cần bổ sung cách lưu publication/visibility của anime vào mô hình và contract trước khi triển khai; episode đã có `draft/published`. Không dùng trạng thái phát hành để suy ra quyền đọc.

ID là string ổn định; thời gian trả UTC ISO 8601. Không suy luận tập trước/sau bằng cộng số tập; dùng thứ tự mùa/tập và chỉ lấy tập công khai. Mô hình một anime nhiều mùa và movie một mùa/một tập vẫn cần duyệt.

## Ghi và truy vấn

Upsert thư viện/tiến độ dựa trên khóa duy nhất từng user. Transaction bảo vệ thao tác nhiều bản ghi; không chỉ kiểm tra trùng ở ứng dụng. Chưa xóa cứng anime/tập có lịch sử khi chưa có chính sách lưu trữ.

Index đề xuất theo truy vấn: anime slug; genre/anime; season theo animeId/sortOrder; episode theo seasonId/status/sortOrder; library và progress theo userId/updatedAt; comment theo animeId/status/createdAt. Chốt index sau khi chọn database và xem kế hoạch truy vấn; chưa có số đo hiệu năng.

## Migration và seed

Migration có phiên bản, review cùng model/API. Kiểm tra trên database rỗng và database có fixture phiên bản trước; xác định cách khôi phục khi lỗi trước khi dùng dữ liệu thật.

Seed dùng dữ liệu giả, ID ổn định, ít nhất hai member để kiểm tra ownership. Có anime chưa công khai, tập draft, tập thiếu nguồn, comment hidden/deleted và user blocked. Guest không phải dòng UserRole. Không đưa credentials hoặc hash mật khẩu thật vào fixture/tài liệu.
