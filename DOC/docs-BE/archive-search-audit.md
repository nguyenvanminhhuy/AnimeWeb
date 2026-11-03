# Lưu trữ, tìm kiếm, player và nhật ký quản trị

Đã triển khai BE/FE ngày 2026-11-03. Bổ sung cho [API contract](../api-contract.md); giao diện dùng các repository/DTO tương ứng, không gọi URL từ component.

## Lưu trữ phim

`Anime.PublicationStatus` nhận draft/published/archived, độc lập trạng thái phát hành. PATCH `/api/v1/admin/anime/{id}/archive`, quyền `admin:anime:write`, body `{archived: true, version: 3}` để lưu trữ; `{archived: false, version: 4}` để khôi phục **về draft**. Response `{data: AdminAnimeDto}`. Cùng advisory lock theo anime và optimistic version với sửa/xoá. Sai version trả 409, thiếu phim trả 404. Gửi archived=true cho phim đã archived với version đúng không thay đổi dữ liệu.

Admin anime list thêm `publicationStatus=archived`, DTO trả ba trạng thái; input tạo/sửa chỉ draft/published. Phim archived không được sửa/xoá trực tiếp (409 ANIME_ARCHIVED); khôi phục phim chưa archived trả 409 ANIME_NOT_ARCHIVED. Không đổi điều kiện xoá cứng: draft và không có dữ liệu liên quan; không cascade.

Common danh mục/detail/home/ranking/related, mùa/tập, bình luận và playback chỉ trả published. Sau lưu trữ, playback/view confirmation mới bị từ chối; URL video trực tiếp đã cấp không bị thu hồi trên máy chủ media bởi thao tác này.

Giữ nguyên mùa/tập/nguồn/phụ đề/bình luận/lượt xem/thư viện/progress. Chủ tài khoản thấy archived trong yêu thích/lịch sử với `AnimeCardDto.available=false`; FE vô hiệu điều hướng detail/phát, hiện nút “Phim đã lưu trữ”. Được cập nhật/bỏ yêu thích entry archived đã tồn tại, không thêm entry mới. Đang xem/preview chỉ gồm published; ghi progress yêu cầu published. Khi khôi phục về draft, phim vẫn ẩn công khai và tạm ẩn khỏi danh sách cá nhân; công bố lại sẽ hiện dữ liệu đã giữ, không reset tiến độ.

Tại `/admin/anime`, bộ lọc Công bố gồm cả lưu trữ; admin dùng icon archive trên hàng thao tác và xác nhận hậu quả. Archived chỉ có khôi phục, không sửa/xoá. Manager không có nút ghi. Dialog huỷ request khi unmount/đổi phiên, giữ query khi refresh, lỗi stale/404 yêu cầu tải lại và xác nhận snapshot mới. Backend quyết định quyền/constraint.

## Tìm kiếm

SQL function `aw_fold_search(text)`: Unicode NFD, bỏ dấu kết hợp, đ/Đ → d và lowercase; không cần extension PostgreSQL. Public/admin anime tìm title/subtitle/alternativeTitles, options tìm title. Chuẩn hoá cả chuỗi nhập và cột; `%`, `_`, `~` là ký tự literal. Kết hợp AND với năm/trạng thái/định dạng/thể loại. q public tối đa 200 ký tự. Substring vẫn có chi phí theo số dòng; chưa có trigram/full-text index cho dữ liệu lớn.

FE debounce 350ms, hỗ trợ IME, giữ query/filter trên URL, giữ options trong loading/error. AbortController huỷ list/genres/options cũ khi thay điều kiện; guard key ngăn kết quả cũ ghi đè. Không thêm chip từ khoá vào vùng đang lọc.

## Player

Giữ native controls, bổ sung âm lượng, tắt/bật tiếng, tốc độ 0.5/0.75/1/1.25/1.5/2× và phụ đề mặc định/tắt/ngôn ngữ. SRT chuyển WebVTT, HLS tải hls.js khi cần; nguồn lỗi/hết hạn có retry/refresh. Dùng common Input/Selectbox/Button, không thêm API player.

Tuỳ chọn lưu tại localStorage `aw:player:preferences:v1`, validation/fallback khi JSON/storage lỗi. Không lưu token trong cấu hình. Chọn ngôn ngữ theo language để giữ qua nguồn; thiếu ngôn ngữ thì không bật nhầm track khác, thông báo không có. Nhiều track cùng language dùng track đầu tiên; điều khiển native đồng bộ volume/rate/subtitle.

Resume theo progress tài khoản; tập đã hoàn tất bắt đầu lại. Đổi nguồn/tải lại nguồn trong cùng trang giữ vị trí hiện tại bằng cache trong bộ nhớ keyed account+episode, áp sau loadedmetadata, clamp theo duration. Progress đến muộn chỉ áp trước khi phát nếu video còn ở đầu. Retry giữ vị trí, chuyển tập không mang vị trí tập cũ. Reload trình duyệt lấy progress đã lưu; guest không có progress bền vững. Tập trước/sau/tự chuyển dùng thứ tự tập hiện tại, không tự bật autoplay.

Chỉ lưu progress sau playing: timeupdate mỗi 10 giây, pause/ended/ẩn trang/unmount; ghi tuần tự version. Âm thanh phụ thuộc track audio/file/codec và mute thiết bị; điều khiển âm lượng không thêm audio cho file không có âm thanh.

## Nhật ký quản trị

GET `/api/v1/admin/audit-logs`, quyền `admin:audit:read` cấp manage/admin; user 403. Query q (<=200), action/resourceType (<=40), page>=1, pageSize 1–50. q tìm actorName/targetLabel/resourceId; action/resourceType chính xác. Sắp occurredAt DESC, id DESC. Response `{data: AuditDto[], meta}`.

AuditDto: id, actorId, actorName, action, resourceType, resourceId, targetLabel, changedFields, occurredAt (UTC). Actor lấy từ phiên server, tên snapshot tại thời điểm ghi; không tin actor/time do FE gửi. Resource: anime/genre/season/episode/source/subtitle/comment/account. Action: create/update/delete/archive/restore/change_role/change_status/moderate.

Ghi trong SaveChangesAsync cho mutation `/api/v1/admin/...` đã xác thực, cùng lần SaveChanges/transaction; lỗi unique/FK/version hoặc rollback không lưu log thành công. Không log request đọc, seed, login hoặc thao tác cá nhân. ChangedFields chỉ tên trường, đổi role ghi Role; không có before/after values, body request, mật khẩu/hash/token/cookie/bytes avatar/giá trị URL nguồn phát. Không FK tới actor/target để giữ log sau xoá đối tượng. Không API sửa/xoá log; đây là nhật ký ứng dụng, không phải kho chống sửa bởi quản trị database. Chỉ ghi thao tác mới từ lúc triển khai, không dựng lại lịch sử cũ.

FE route `/admin/audit-logs`, menu “Lịch sử quản trị”, guard quyền riêng. Tìm/lọc ở URL, loading/empty/error/retry. Hai Pagination chung trên/dưới căn giữa; chỉ trên bật Mỗi trang 20/50. Bảng cuộn ngang mobile. Mock trả rỗng, không dựng lịch sử server giả.

## Migration và kiểm chứng

Migration `20261103073218_ArchiveSearchAudit` mở rộng check constraint publication, tạo SQL function/AuditEntries/index thời gian, cấp quyền mới. Không reset database hoặc đổi phim hiện có. Down demote archived về draft trước thu hẹp constraint và xoá nhật ký/function/quyền: rollback schema làm mất log mới.

BE kiểm tra bằng ArchiveSearchAuditTests trên PostgreSQL riêng/WebApplicationFactory. FE có admin-archive-audit.browser.mjs (HTTP giả), player.browser.mjs và media-compatibility.browser.mjs (sự kiện/media giả), explore-filter-options.browser.mjs và admin-delete-errors.browser.mjs hồi quy. Không gọi API/provider thật để test; kết quả thực chạy và giới hạn tại verification mỗi phía. Sự kiện media giả không chứng minh audio của file thật.
