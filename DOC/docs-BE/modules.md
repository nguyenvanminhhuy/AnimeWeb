# Đặc tả phạm vi module BE

**Cập nhật triển khai 2026-11-01:** tất cả module trong bảng đã có BE theo bộ mặc định v0.3 được người dùng xác nhận, gồm Auth/cá nhân/Playback/admin/Home/ranking. Xem [current-status.md](current-status.md) và verification để phân biệt code/test với FE/media chưa tích hợp. Các ghi chú “cần chốt/trước code” bên dưới là checklist thiết kế; những quyết định đã chốt tại contract v0.3 được ưu tiên và không hỏi lại.

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
| Trang chủ / home / related | catalog aggregate | Anime, mùa/tập; tiêu chí chọn còn mở | HomeCatalog gồm featured/updated/recommended/topViewed; related chọn aggregate hoặc endpoint riêng |
| Top lượt xem / ranking | ranking | Định nghĩa view, nguồn thống kê/tổng hợp | Một nguồn ranking public cho cả Home/Dashboard; chưa có analytics thật |
| Quản trị anime / admin anime | admin catalog | Auth, admin:anime:read/write | List/detail theo ID, options, create/update/delete; publication cần chốt |
| Quản trị thể loại / admin genres | admin genres | Auth, admin:genre:read/write | List/usage count/options gồm chưa dùng; ghi name/slug và chặn xoá đang dùng |
| Quản trị mùa tập / admin episodes | admin episodes | Auth, admin:episode:read/write, Anime | Lookup cha, mùa, tập phân trang/detail; CRUD theo quan hệ/publication |
| Quản trị nguồn phụ đề / admin playback | admin playback | Auth, admin:playback:read/write, Episode | Lookup/list sources, tracks; ghi enabled/default qua save, ràng buộc nguồn/track |
| Người dùng quản trị / admin users | admin users | Auth, admin:user:read | List/detail/summary; admin PATCH trạng thái với version, không mutation tài khoản khác |
| Kiểm duyệt bình luận / admin comments | moderation | Auth, Comments, admin:comment:read/moderate | List/detail/summary và hide/restore có lý do, không restore deleted |
| Dashboard / admin dashboard | admin aggregate | Auth, admin:dashboard:read, catalog; ranking chung | Metrics/statuses/recentAnime/topViewed; không số liệu vận hành giả |

Home/ranking/admin đã triển khai theo [API contract v0.3](../api-contract.md). Ký hiệu read/write hoặc read/moderate là hai permission riêng. Chọn đúng phạm vi thay đổi, tái sử dụng module hiện có và chỉ chốt điểm mới ngoài contract; không generate trùng hoặc tự mở rộng khi chỉ gọi một tên feature.

## Tiêu chí riêng

### Danh mục anime

Đã triển khai tìm q theo title/alternativeTitles, genre slug, status, year, format, sort newest/title và pagination theo [contract](../api-contract.md). Chỉ published được đọc; draft/không tồn tại cùng trả 404. Người dùng đã xác nhận publication, tìm không phân biệt hoa/thường, mới nhất trước và trang vượt cuối rỗng. Có migration, seed demo explicit và kiểm thử PostgreSQL; chưa nối FE.

### Mùa và tập

Đã triển khai model/migration/seed và ba API metadata theo contract. Season theo anime published; tập chỉ published với cha public. Sắp sortOrder/id, pagination dùng chung, draft/cha bị ẩn trả 404; có test tập đặc biệt/ID không liên tiếp. durationSeconds nullable khi chưa biết; hasPlayback=false cho đến feature Playback, không tự suy ra từ status published.

### Xác thực và authorization

Đặc tả endpoint auth trước khi code vì contract hiện chưa có. Session/credentials thật độc lập phiên demo; `/me` tổng hợp roles/permissions từ server. Test thiếu/hết hạn/thu hồi phiên, user blocked, thiếu permission, không nhận quyền từ client. Không thêm admin bypass ownership.

Handoff yêu cầu login/register nhận password, logout thu hồi phiên, me có id/displayName/email/roles/permissions và đổi mật khẩu của chính mình. FE repository hiện chưa nhận password, SessionProvider còn khôi phục phiên đồng bộ từ local; cần refactor khi nhiệm vụ có tích hợp. Đăng ký mặc định user; manage chỉ đọc admin; admin ghi theo ma trận, Users có đọc và admin khoá/mở khoá/đổi role theo quyền admin:user:status:write. Cookie/bearer và vòng đời phiên chưa chốt; không tự thêm refresh endpoint. Profile hiện chỉ đọc, không có yêu cầu sửa hồ sơ/avatar/quên mật khẩu.

### Thư viện

PUT nhận đủ status/isFavorite, upsert duy nhất user/anime; DELETE 204 giữ lịch sử. GET trả summary anime và pagination; bộ lọc status/isFavorite theo contract. Test hai user, ghi đồng thời, payload sai và bỏ library không xóa progress.

FE có favorites/watching/history, pageSize 8, q theo title/subtitle và sort recent/title; q/sort/summary phải bổ sung vào contract trước code. Bỏ yêu thích chỉ tắt isFavorite, giữ status và lịch sử, không dùng DELETE thay toggle. Favorites đếm anime, history đếm tập; counts toàn collection trước q, không đếm page. Profile cần favoriteAnimeCount/inProgressEpisodeCount/completedEpisodeCount/historyEpisodeCount và preview; chọn aggregate hay endpoint summary, tránh gọi từng anime qua getByIds.

### Tiến độ

PUT chỉ nhận positionSeconds/completed; updatedAt do server cấp, duy nhất user/episode. Chốt hoàn thành, xem lại, thời lượng chưa biết và xung đột trước khi ghi chính sách vào code. Test số âm/quá thời lượng theo quy tắc đã chốt, hai user và request đồng thời.

History một dòng mỗi tập; watching lấy progress mới nhất mỗi anime rồi mới kiểm tra completed, không lọc mọi tập chưa hoàn thành. Phân biệt số anime watching với số tập đang xem trên Profile. Query collection=watching là đề xuất, chưa chốt API. FE ghi khoảng mỗi 10 giây khi đã phát/duration hợp lệ và force pause/ended/hidden/unmount; ended gửi completed=true. Server cần quy tắc request cũ/đa thiết bị, không coi timestamp client là chuẩn; không nhập demo vào tài khoản thật tự động.

### Bình luận

GET chỉ trả visible và thông tin tác giả tối thiểu. POST/PATCH nhận body plain text; giới hạn/trim theo contract đã chốt. Tác giả lấy từ phiên; không nhận authorId/status/quyền. Xóa mềm; không phục hồi hidden/deleted bằng sửa. Test guest, user khác, blocked, nội dung rỗng/quá dài và không lộ email.

FE đang list toàn bộ rồi chia 5 dòng; tích hợp chuyển commentPage trên URL thành page HTTP và dùng meta server, không chia lại một page. DTO author object map sang userId/authorName; mutation refetch đúng trang. Duyệt trước/hiện ngay và giới hạn body vẫn cần chốt.

### Playback

Provider adapter trả sources/subtitles và previousEpisodeId/nextEpisodeId theo thứ tự nội dung công khai. Không có tập trả 404; chưa có nguồn trả 200 sources rỗng; provider lỗi trả 503. Fake provider cho mọi test, có URL hết hạn và đầu/cuối danh sách. Không thêm video thật hoặc proxy video ngoài yêu cầu.

Player native MP4/WebM khác admin MP4/HLS và VTT/SRT; chốt hỗ trợ HLS/chuyển subtitle hoặc giới hạn format. WatchDetail cần thêm expiry và mapper MIME. Kiểm tra MIME/range/CORS media riêng; published, enabled và phát được là các khái niệm riêng. Playlist xuyên mùa theo sortOrder/id, không number/ID liên tiếp; không bỏ sót trang.

### Home, related và ranking

HomeCatalog cần featured/updated/recommended/topViewed với tiêu chí riêng, không trả cùng một mảng cho mọi nhóm. sort newest hiện là releaseYear, không là ngày tập công bố. Related/options chọn aggregate hoặc endpoint riêng, không triển khai trùng. Options years/formats phải đại diện toàn danh mục public. Ranking dùng anime summary/viewCount cùng nguồn Home/Dashboard, giảm view rồi ID, chỉ public; định nghĩa view, chống trùng và lịch tổng hợp còn mở. Không cộng view khi GET playback hoặc tự thêm view-event API từ fixture.

### Quản trị nội dung

Theo mục 6–7 của [handoff](../fe-backend-handoff.md), các endpoint admin đều cần đưa vào contract trước code:

- Anime: list có meta/genreOptions/years; detail theo ID cho direct edit; form hiện genres là tên, cần options id/slug/name để map genreIds. Chốt subtitle, publication riêng khỏi release status và publicSlug null cho nội dung chưa công khai.
- Genres: list kèm animeCount, usage/sort/paging; options gồm cả chưa dùng, không lấy common/genres thay admin options. Unique tên/slug và chặn xoá đang dùng theo contract được chốt.
- Mùa/tập: tách getCatalog thành lookup anime/mùa, episode list/detail. Validate animeId khớp seasonId; input number/title/sortOrder/durationSeconds/status chưa có publishedAt/thumbnailUrl. Chốt ngày xuất bản/republication và giới hạn xoá trước code; không cascade quan hệ đang tham chiếu.
- Nguồn/phụ đề: lookup cha, sources phân trang và subtitles theo source. Save source nhận episodeId/providerKey/label/language/type/url/enabled; save track nhận source/label/language/format/url/isDefault. Đổi enabled/default có thể dùng save, chưa cần endpoint riêng; transaction bảo đảm default hợp lệ, chặn xoá nguồn còn track. Sort created của mock chỉ giữ thứ tự mảng, cần chốt order/tie-breaker server.

### Users, moderation và Dashboard

Users có list/detail với id/displayName/email/status/roles/createdAt/version và summary total/active/blocked toàn tập người dùng; admin có PATCH status/role theo quyền riêng, thu hồi phiên khi đổi và guard self/last active admin; không API xoá/reset mật khẩu. Moderation có list/detail theo ID, summary/lookup và action hide/restore, reason UI 3–300 làm baseline cần validate server; actor/time do server cấp. Deleted bỏ body và không được restore; không sửa tác giả/nội dung người khác.

Dashboard cần totalAnime/publishedEpisodes/upcomingAnime/episodesWithoutVideo/totalSeasons/totalGenres, statuses, ranking chung và recentAnime. FE hiện lấy 6 phim gần đây theo ngày tập công bố mới nhất rồi ID; không đổi sang ngày sửa anime mà giữ nhãn. Chốt định nghĩa metric/summary trước code; không lấy số dòng page làm tổng hoặc dùng fixture làm số thật.

## Khi thiếu phụ thuộc

Không mặc định generate toàn bộ hệ thống để làm một module. Tái sử dụng phần có sẵn; tạo interface/fake giới hạn cho kiểm thử nếu phù hợp, ghi rõ phần chưa tích hợp. Auth fake chỉ dùng trong test, không gắn vào route cá nhân như xác thực thật. Nếu thiếu quyết định chi phối hành vi, nêu câu hỏi cụ thể và tiếp tục phần độc lập.
