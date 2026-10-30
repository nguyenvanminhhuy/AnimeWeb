# Đặc tả phạm vi module BE

Tất cả endpoint bên dưới thuộc prefix `/api/v1`. Method/payload/status đầy đủ theo [api-contract.md](../api-contract.md); không xem bảng này là bản thay thế contract. Áp dụng [rules](rules/readme.md) cho mọi module.

## Bảng triển khai

| Tên gọi trong prompt | Module | Phụ thuộc | Phạm vi |
| --- | --- | --- | --- |
| Nền BE | Program/Shared/Infrastructure | Stack C# đã chốt | [setup.md](setup.md) |
| Anime / Danh mục anime / catalog | anime | Nền, publication đã xác nhận | Đã có GET common/anime, common/anime/:slug, common/genres |
| Mùa và tập / episode | episode | Anime | Đã có GET common/anime/:id/seasons, common/seasons/:id/episodes, common/episodes/:id |
| Xác thực / auth | auth/authorization | User, hợp đồng auth đã bổ sung | Phiên thật, GET me; login/register/logout theo contract được chốt |
| Thư viện / library | library | Anime, auth/authorization | GET me/library, PUT/DELETE me/library/:animeId |
| Tiến độ / progress | progress | Episode, auth, chính sách đồng bộ | GET me/progress, PUT me/progress/:episodeId |
| Bình luận / comments | comments | Anime, auth, chính sách hiển thị | GET common/anime/:animeId/comments; POST me/anime/:animeId/comments; PATCH/DELETE me/comments/:commentId |
| Nguồn phát / playback | playback | Episode, provider adapter | GET common/episodes/:id/playback |

## Tiêu chí riêng

### Danh mục anime

Đã triển khai tìm q theo title/alternativeTitles, genre slug, status, year, format, sort newest/title và pagination theo [contract](../api-contract.md). Chỉ published được đọc; draft/không tồn tại cùng trả 404. Người dùng đã xác nhận publication, tìm không phân biệt hoa/thường, mới nhất trước và trang vượt cuối rỗng. Có migration, seed demo explicit và kiểm thử PostgreSQL; chưa nối FE.

### Mùa và tập

Đã triển khai model/migration/seed và ba API metadata theo contract. Season theo anime published; tập chỉ published với cha public. Sắp sortOrder/id, pagination dùng chung, draft/cha bị ẩn trả 404; có test tập đặc biệt/ID không liên tiếp. durationSeconds nullable khi chưa biết; hasPlayback=false cho đến feature Playback, không tự suy ra từ status published.

### Xác thực và authorization

Đặc tả endpoint auth trước khi code vì contract hiện chưa có. Session/credentials thật độc lập phiên demo; `/me` tổng hợp roles/permissions từ server. Test thiếu/hết hạn/thu hồi phiên, user blocked, thiếu permission, không nhận quyền từ client. Không thêm admin bypass ownership.

### Thư viện

PUT nhận đủ status/isFavorite, upsert duy nhất user/anime; DELETE 204 giữ lịch sử. GET trả summary anime và pagination; bộ lọc status/isFavorite theo contract. Test hai user, ghi đồng thời, payload sai và bỏ library không xóa progress.

### Tiến độ

PUT chỉ nhận positionSeconds/completed; updatedAt do server cấp, duy nhất user/episode. Chốt hoàn thành, xem lại, thời lượng chưa biết và xung đột trước khi ghi chính sách vào code. Test số âm/quá thời lượng theo quy tắc đã chốt, hai user và request đồng thời.

### Bình luận

GET chỉ trả visible và thông tin tác giả tối thiểu. POST/PATCH nhận body plain text; giới hạn/trim theo contract đã chốt. Tác giả lấy từ phiên; không nhận authorId/status/quyền. Xóa mềm; không phục hồi hidden/deleted bằng sửa. Test guest, user khác, blocked, nội dung rỗng/quá dài và không lộ email.

### Playback

Provider adapter trả sources/subtitles và previousEpisodeId/nextEpisodeId theo thứ tự nội dung công khai. Không có tập trả 404; chưa có nguồn trả 200 sources rỗng; provider lỗi trả 503. Fake provider cho mọi test, có URL hết hạn và đầu/cuối danh sách. Không thêm video thật hoặc proxy video ngoài yêu cầu.

## Khi thiếu phụ thuộc

Không mặc định generate toàn bộ hệ thống để làm một module. Tái sử dụng phần có sẵn; tạo interface/fake giới hạn cho kiểm thử nếu phù hợp, ghi rõ phần chưa tích hợp. Auth fake chỉ dùng trong test, không gắn vào route cá nhân như xác thực thật. Nếu thiếu quyết định chi phối hành vi, nêu câu hỏi cụ thể và tiếp tục phần độc lập.
