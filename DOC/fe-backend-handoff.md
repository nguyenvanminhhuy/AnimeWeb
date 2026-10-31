# Bàn giao yêu cầu dữ liệu FE để triển khai API BE

Đối chiếu source Fe-Dev ngày **2026-11-01**. Mục tiêu: BE biết mỗi feature FE đang gọi hàm gì, gửi gì, cần nhận gì và endpoint nào sẽ thay lời gọi đó. Dùng tài liệu này khi triển khai từng module; [feature-api-review.md](feature-api-review.md) chỉ là review tổng quan.

**FE hiện chưa gọi HTTP API thật.** Các “API FE đang dùng” là interface repository/mock/local storage tại [repositories.ts](../FE/src/lib/api/repositories.ts), [contracts](../FE/src/lib/api/contracts) và [SessionProvider](../FE/src/stores/session.tsx). Bảng dưới phân biệt **hàm thực tế** với **HTTP cần triển khai**. URL mới là đề xuất bàn giao, cần đưa vào [api-contract.md](api-contract.md) trước khi code; không xem như endpoint đã tồn tại.

## 1. Quy ước để BE và FE ghép được với nhau

- Prefix HTTP `/api/v1`; URL ở các bảng dưới bỏ prefix cho ngắn. ID string, date ISO 8601 UTC, JSON camelCase.
- Object HTTP trả `{data: T}`; list phân trang `{data: T[], meta:{page,pageSize,total,totalPages}}`. Repository FE nhận phần dữ liệu đã unwrap/map, không phải Response/envelope HTTP.
- Hàm FE hiện trả void có thể được HTTP adapter thay bằng POST/PATCH trả data rồi bỏ data, hoặc DELETE 204; không bắt BE trả void cho mọi mutation.
- `state`, `mock`, `fail`, `shouldFail`, `AdminPreviewSession`, `CommentActor`, `AbortSignal` là tham số nội bộ/demo. Không serialize vào query/body. Signal dùng huỷ request; user/permission lấy từ phiên server.
- Những schema ở mục 8 là **view model FE đang cần**, không bắt DB/DTO BE giống từng field. Mapper FE được đổi nhưng phải tạo đủ dữ liệu để UI hoạt động. Những API đã có giữ contract hiện hành, không sửa chỉ để giống fixture.
- Có ba API BE đã triển khai: GET `/common/anime`, GET `/common/anime/:slug`, GET `/common/genres`. FE chưa sử dụng HTTP của cả ba. Những endpoint còn lại trong tài liệu này cần triển khai/đặc tả thêm.

## 2. Danh mục, Trang chủ, Chi tiết và Xem phim

| Feature/nơi gọi | Hàm FE thực sự gọi | Input nghiệp vụ | Output repository FE cần | HTTP thay thế |
| --- | --- | --- | --- | --- |
| Trang chủ: useHomeCatalog | `animeRepository.getHome(state)` | Không có filter server; genre chỉ lọc recommended tại FE | `HomeCatalog` | GET `/common/home` → data HomeCatalog hoặc DTO map tương đương |
| Khám phá: useExploreCatalog | `animeRepository.list(query,state)` | `CatalogQuery` ở mục 7 | `CatalogResult` | GET `/common/anime` với query; đã có BE |
| Chi tiết: useAnimeDetail | `animeRepository.getBySlug(slug,state)` | slug | `AnimeDetail \| null` | GET `/common/anime/:slug` đã có metadata; thêm mùa/tập/related hoặc ghép các endpoint bên dưới |
| Library/Profile: useLibrary, useProfileLibrary | `animeRepository.getByIds(ids,state)` | Mảng anime ID từ favorites/progress | `Anime[]` | Nếu giữ flow cũ: GET `/common/anime/by-ids?ids=...` với giới hạn batch được chốt; ưu tiên trả summary trực tiếp trong me/library và me/progress để bỏ lời gọi này |
| Watch: useWatchEpisode | `playbackRepository.getEpisode(id,state)` | episodeId | `WatchDetail \| null` | Ghép GET `/common/episodes/:episodeId`, detail anime, mùa/tập và GET `/common/episodes/:episodeId/playback` |

Các endpoint bổ sung để dựng AnimeDetail/WatchDetail theo contract nháp hiện tại:

| HTTP | Dữ liệu cần có | Điều FE cần lưu ý |
| --- | --- | --- |
| GET `/common/anime/:animeId/seasons` | `Season[]` có sortOrder | Mapper dùng ID từ detail, không dùng slug thay ID |
| GET `/common/seasons/:seasonId/episodes` | `Episode[]` + meta, chỉ published | FE hiện nhận tất cả tập trong detail; phải tải đủ trang hoặc chuyển playlist sang paging/lazy |
| GET `/common/episodes/:episodeId` | Episode và tham chiếu anime/season đủ dựng trang Watch | Không suy ra anime từ chuỗi ID fixture |
| GET `/common/episodes/:episodeId/playback` | sources/subtitles, expiresAt, previousEpisodeId/nextEpisodeId | Adapter ghép vào WatchDetail; không có tập 404, chưa có nguồn 200 sources=[], provider lỗi 503 |
| GET `/common/anime/:animeId/related` hoặc field trong detail | `Anime[]` hoặc summary map đủ card | Chọn một phương án; chưa có lời gọi related riêng trong FE |
| GET `/common/genres` và metadata filter options | Genre id/slug/name; years cần cho bộ lọc | FE hiện còn options từ config/fixture; không suy ra tất cả options từ một page kết quả |

`HomeCatalog = {featured:Anime[], updated:Anime[], recommended:Anime[], topViewed:TopViewedAnimeEntry[]}`. Không trả cùng một mảng cho mọi nhóm chỉ vì cùng kiểu. “Mới cập nhật” cần tiêu chí riêng; API sort newest hiện dựa releaseYear, chưa phải tập công bố gần nhất.

Top 10 hiện lấy `getTopViewedAnime()` **bên trong hai mock repository**, không có lời gọi HTTP ranking từ component. Cùng ranking phải được dùng ở HomeCatalog.topViewed và AdminDashboardData.topViewed. Có thể dùng chung service BE, hoặc GET `/common/rankings/anime?metric=views&limit=10` rồi adapter tổng hợp. `TopViewedAnimeEntry={anime:Anime,viewCount:number}`; giảm dần lượt xem rồi ID, chỉ public. View fixture không phải analytics; API ghi nhận lượt xem chưa có trong flow FE, phải thiết kế khi triển khai thống kê thật.

## 3. Đăng nhập, Đăng ký, Hồ sơ và Đổi mật khẩu

| Feature/nơi gọi | Hàm hiện tại | Input/return hiện tại | HTTP cần có và thay đổi FE |
| --- | --- | --- | --- |
| Form login: useAuthForm | `authRepository.login(email,state,signal)` | email → DemoProfile | POST `/auth/login` body `{email,password}`; **FE hiện không truyền password vào repository**, cần sửa interface/adapter |
| Form register: useAuthForm | `authRepository.register({displayName,email},state,signal)` | Không password → DemoProfile | POST `/auth/register` body `{displayName,email,password}`; confirmation ở FE, cần sửa interface |
| Khôi phục phiên/login: SessionProvider | `demoAccount.readSession()`, `authRepository.getProfile(id)` | DemoUser → DemoProfile/null, đồng bộ local | GET `/me` bất đồng bộ; trả id/displayName/email/roles/permissions, thêm loading bootstrap và cache theo user |
| Login sau form/demo | `useSession().login(profileId)` | Chọn hồ sơ local | Dùng profile/claims do auth/me trả; không gửi profileId demo để xác thực |
| Logout | `useSession().logout()`, `demoAccount.saveSession(null)` | Xoá phiên local | POST `/auth/logout`, thu hồi phiên server + clear cache/local draft và huỷ request |
| Change password: useChangePassword | `authRepository.previewPasswordChange(user,state,signal)` | Không nhận mật khẩu; `{status:'preview-only'}` | POST `/me/change-password` body `{currentPassword,newPassword}`; bỏ preview-only sau khi nối thật, chốt response và thu hồi phiên |
| Header/ProfileInfo | Đọc `displayName,email,permissions,user` từ useSession | Profile chỉ đọc | GET `/me` đủ dữ liệu; chưa cần API PATCH profile hoặc upload avatar |

Form FE hiện validate displayName 2–40 sau trim, email hợp lệ tối đa 254, password 8–128; register confirmation khớp. Change password: current/new 8–128, không chỉ whitespace, mới khác hiện tại, confirmation khớp chính xác. Không trim/lowercase password. Đây là baseline validation UI, BE cần tự validate; chính sách mật khẩu/phiên thật cần chốt, không dựa vào validation FE.

Cookie hay bearer chưa chốt, do đó không giả định refresh-token endpoint đã cần/chạy được. Đăng ký không nhận role/permissions, mặc định user. Mã DemoUser viewer/newcomer/local-* không phải giới hạn ID của User DB; FE cần đổi type khi tích hợp.

## 4. Yêu thích, Thư viện, Lịch sử và Tiến độ

**Chưa có LibraryRepository/ProgressRepository HTTP.** FE đang đọc `favorites:string[]`, `progress:Progress[]` từ SessionProvider và lưu cả account vào localStorage.

| Flow thực tế | Lời gọi FE | API thay thế | Dữ liệu cần nhận |
| --- | --- | --- | --- |
| Hydrate dữ liệu cá nhân | `demoAccount.read(user)` | GET `/me/library`, GET `/me/progress` hoặc aggregate được chốt | Favorites/trạng thái và progress kèm summary; không tải mỗi anime một request |
| Banner/detail/library toggle yêu thích | `toggleFavorite(animeId)` → `demoAccount.save(user,nextAccount)` | PUT `/me/library/:animeId` `{status,isFavorite}` theo contract nháp; giữ status hiện có | LibraryEntry đủ phản ánh trạng thái mới; UI dùng kết quả server, giữ progress/history |
| Bỏ hẳn mục thư viện nếu triển khai thao tác đó | Hiện UI chủ yếu toggleFavorite | DELETE `/me/library/:animeId` | 204; không xoá lịch sử. Không dùng DELETE chỉ để tắt isFavorite nếu muốn giữ entry/status |
| Tab favorites | getByIds + local filter/paging | GET `/me/library?isFavorite=true&q=&sort=&page=&pageSize=8` | Anime summary, progress mới nhất nếu có, meta và counts |
| Tab history | Dựng một item cho mỗi progress của tập | GET `/me/progress?q=&sort=&page=&pageSize=8` | Mỗi dòng một tập, key episodeId, anime summary, meta |
| Tab watching | Lấy progress mới nhất mỗi anime rồi lọc chưa completed | GET `/me/progress?collection=watching&...` hoặc aggregate riêng | **Một dòng mỗi anime**, dùng tập được xem gần nhất rồi kiểm tra completed; query collection là bổ sung đề xuất, chưa có contract |
| Profile thống kê/preview và Home ContinueWatching | Đếm favorites/progress toàn account; getByIds; chọn preview | GET `/me/library/summary` hoặc gộp vào me/aggregate | favoriteAnimeCount, inProgressEpisodeCount, completedEpisodeCount, historyEpisodeCount + preview dữ liệu cần thiết |
| Native player lưu tiến độ | `saveProgress(owner,entry)` | PUT `/me/progress/:episodeId` `{positionSeconds,completed}` | Progress authoritative; animeId/episodeNumber/duration có thể derive server, updatedAt server cấp |

Semantics đang có cần giữ hoặc thay đổi có chủ đích:

- Library có đúng ba tab `favorites/watching/history`; pageSize=8; q theo title/subtitle, sort recent/title. Counts tính toàn collection trước q, không đếm page hiện tại. Watching không đơn thuần là mọi tập `completed=false`.
- Profile hiện đếm **tập đang xem** là progress chưa hoàn thành, khác số **phim** trong tab watching; cần phân biệt hai số trên API summary. Favorites/history count cũng không cùng đơn vị.
- Progress gồm animeId/episodeId/episodeNumber/positionSeconds/durationSeconds, completed?/updatedAt?. Player ghi tối đa khoảng mỗi 10 giây trong timeupdate, và force khi pause/ended/ẩn trang/unmount; chỉ sau khi thực sự phát và duration hợp lệ. Ended lưu completed=true. Đồng bộ nhiều thiết bị/request cũ cần chính sách server.
- Bỏ yêu thích giữ lịch sử. Không tự nhập local demo vào user thật. Server lấy owner từ phiên, không dùng owner tham số FE để chọn user khác.

## 5. Bình luận công khai

| Nơi gọi: useComments | Input nghiệp vụ | Return hiện tại | HTTP thay thế |
| --- | --- | --- | --- |
| `commentRepository.list(animeId,state,signal)` | animeId | `Comment[]` | GET `/common/anime/:animeId/comments?page=&pageSize=5` |
| `commentRepository.create(actor,animeId,body,signal)` | animeId/body | void | POST `/me/anime/:animeId/comments` `{body}`, 201 |
| `commentRepository.update(actor,id,body,signal)` | commentId/body | void | PATCH `/me/comments/:commentId` `{body}`, 200 |
| `commentRepository.remove(actor,id,signal)` | commentId | void | DELETE `/me/comments/:commentId`, 204 |

FE hiện tải toàn bộ comments rồi phân trang 5 dòng; URL UI dùng **commentPage**. Khi nối API: mapper đổi commentPage→page, hook dùng meta server, không phân trang lại một page API. Mutation hiện refetch list; server trả data hay không đều cần refresh đúng trang. `Comment={id,animeId,userId,authorName,body,status,createdAt,updatedAt}`; DTO author object trong contract có thể map thành userId/authorName. Public chỉ visible; own check ở server, không gửi actor. Chính sách duyệt trước/hiện ngay còn cần chốt; không biến hidden/deleted thành visible qua sửa body.

## 6. Bàn giao các lời gọi quản trị

Các hàm dưới ở [repository contracts](../FE/src/lib/api/contracts), được gọi từ hook/form/dialog tương ứng. Mọi endpoint yêu cầu phiên/quyền server; không nhận AdminPreviewSession từ body. URL admin trong mục này là đề xuất mới.

### Dashboard

`adminDashboardRepository.getOverview(state,signal,session)` → **AdminDashboardData**; thay bằng GET `/admin/dashboard`.

Output FE cần: `totalAnime,publishedEpisodes,upcomingAnime,episodesWithoutVideo,totalSeasons,totalGenres` (number); `statuses:[{status,label,count}]`; `topViewed:[{anime,viewCount}]`; `recentAnime:[{publicSlug:string|null,anime,episodeCount,lastPublishedAt:string|null}]`. Gần đây hiện 6 phim, sort ngày công bố tập mới nhất rồi ID; không lấy ngày sửa phim thay ngày công bố mà không đổi nhãn. Ranking cùng nguồn Home. Khi không có số liệu trả 0/mảng rỗng, không bịa số vận hành.

### Anime

| Hàm FE | HTTP thay thế | Input/output nghiệp vụ |
| --- | --- | --- |
| `adminAnimeRepository.list(query,state,signal,session)` | GET `/admin/anime` | CatalogQuery → `{data:AdminAnimeRow[],meta,genreOptions,years}` |
| `adminAnimeRepository.get(id,signal,session,fail)` | GET `/admin/anime/:animeId` | → AdminAnimeRow/null |
| `adminAnimeRepository.create(input,signal,session,fail)` | POST `/admin/anime` | AdminAnimeInput → AdminAnimeRow |
| `adminAnimeRepository.update(id,input,signal,session,fail)` | PATCH `/admin/anime/:animeId` | Cùng input hiện FE gửi đủ form → AdminAnimeRow |
| `adminAnimeRepository.remove(id,signal,session,fail)` | DELETE `/admin/anime/:animeId` | → void/HTTP 204 |

`AdminAnimeRow={anime:Anime,publishedEpisodes:number,publicSlug:string|null}`. `AdminAnimeInput` có **title,slug,subtitle,synopsis,releaseYear,status,format,genres,posterUrl,bannerUrl**; hiện genres là tên thể loại string[], không phải IDs. BE có thể nhận genreIds nhưng FE phải map bằng options; không lưu tên làm foreign key. Options hiện `{value,label}`, value dùng cho filter; không mặc định value đó là ID ghi DB. Years/options cần đại diện toàn danh mục, không chỉ page.

Publication không có field riêng trong form FE hiện tại; BE có draft/published độc lập status. Cần chốt cách tạo/publication và UI nếu muốn cho chỉnh publication, không dùng status=airing thay published.

### Thể loại

| Hàm FE | HTTP thay thế | Output |
| --- | --- | --- |
| `adminGenreRepository.list(query,state,signal,session)` | GET `/admin/genres` | `{data:({id,name,slug,animeCount})[],meta}` |
| `adminGenreRepository.options(signal,session)` | GET `/admin/genres/options` | `{id,name,slug}[]` cho form anime, gồm cả chưa dùng |
| `adminGenreRepository.create(input,signal,session,fail)` | POST `/admin/genres` | `{id,name,slug}` |
| `adminGenreRepository.update(id,input,signal,session,fail)` | PATCH `/admin/genres/:genreId` | `{id,name,slug}` |
| `adminGenreRepository.remove(id,signal,session,fail)` | DELETE `/admin/genres/:genreId` | void/204 |

Input create/update `{name,slug}`. Unique và chặn xoá còn anime do server kiểm tra; genre public endpoint chỉ trả thể loại có phim public nên không dùng thay options admin.

### Mùa/phần và tập phim

| Hàm FE | HTTP thay thế | Input/output |
| --- | --- | --- |
| `adminEpisodeRepository.getCatalog(signal,session,fail)` | Tách GET `/admin/anime/options`, GET `/admin/seasons?animeId=...`, GET `/admin/episodes?...` | Hiện trả `{anime:[{id,title,status}],seasons:Season[],episodes:AdminEpisode[]}` |
| `saveSeason(id|null,input,signal,session,fail)` | id=null POST `/admin/seasons`; còn lại PATCH `/admin/seasons/:seasonId` | `{animeId,number,title,sortOrder}` → void hiện tại |
| `saveEpisode(id|null,input,signal,session,fail)` | POST `/admin/episodes` hoặc PATCH `/admin/episodes/:episodeId` | `{animeId,seasonId,number,title,sortOrder,durationSeconds,status}` → void |
| `remove(kind,id,signal,session,fail)` | DELETE `/admin/seasons/:seasonId` hoặc `/admin/episodes/:episodeId` | kind season/episode → void |

Form edit tập hiện tìm record trong getCatalog, chưa gọi getEpisode riêng. Khi tách paging API cần GET `/admin/episodes/:episodeId` cho edit trực tiếp; nếu chỉ tìm trong page list sẽ lỗi “không thấy” giả. AdminEpisode giống Episode nhưng publishedAt nullable. Chặn mùa còn tập/tập published hoặc còn nguồn theo quy tắc nghiệp vụ được chốt, không cascade.

### Nguồn phát và phụ đề

| Hàm FE | HTTP thay thế | Input/output |
| --- | --- | --- |
| `adminPlaybackRepository.getCatalog(signal,session,fail)` | Lookup phim/mùa/tập + GET `/admin/playback-sources?...` + GET `/admin/playback-sources/:sourceId/subtitles` | Hiện `{anime,seasons,episodes,sources,subtitles}` toàn catalog |
| `saveSource(id|null,input,signal,session,fail)` | POST `/admin/playback-sources` hoặc PATCH `/admin/playback-sources/:sourceId` | `{episodeId,providerKey,label,language,type:'mp4'|'hls',url,enabled}` → void |
| `saveSubtitle(id|null,input,signal,session,fail)` | POST `/admin/subtitles` hoặc PATCH `/admin/subtitles/:subtitleId` | `{playbackSourceId,label,language,format:'vtt'|'srt',url,isDefault}` → void |
| `remove(kind,id,signal,session,fail)` | DELETE `/admin/playback-sources/:sourceId` hoặc `/admin/subtitles/:subtitleId` | kind source/subtitle → void |

Bật/tắt nguồn hiện dùng saveSource với enabled mới; đổi mặc định dùng saveSubtitle. Chưa có hàm toggle/default riêng nên không bắt buộc thêm endpoint riêng. Server đảm bảo một track mặc định mỗi nguồn, chặn xoá nguồn còn phụ đề và không lộ credential provider. FE admin lưu HLS/SRT không có nghĩa player native đã hỗ trợ; xem mục 8.

### Người dùng

`adminUserRepository.list(query,state,signal,session)` → GET `/admin/users`; output `{data:AdminUser[],meta,summary:{total,active,blocked}}`.

`adminUserRepository.getById(id,state,signal,session)` → GET `/admin/users/:userId`; output AdminUser/null. `AdminUser={id,displayName,email,status:'active'|'blocked',roles,createdAt}`; runtime type roles hiện member[], cần đổi khi nối user/manage/admin thật. **Không có hàm create/update/delete/ban/assignRole/resetPassword trong feature này**. Summary mock là toàn bộ người dùng; không thay bằng số dòng của page lọc.

### Bình luận quản trị

`adminCommentRepository.getCatalog(signal,session,fail)` hiện trả `{comments:AdminComment[],anime:[{id,title,publicSlug}]}`. Thay bằng GET `/admin/comments?...` có meta/summary + lookup anime, GET `/admin/comments/:commentId` để panel mở được record ngoài page. Không trả cả DB để giữ getCatalog.

`adminCommentRepository.moderate(id,action,reason,signal,session,fail)` → POST `/admin/comments/:commentId/moderations` body `{action:'hide'|'restore',reason}`; return hiện void. Lý do UI 3–300 ký tự; server validate, gán moderator/time. AdminComment gồm fields Comment nhưng body nullable, thêm `lastModeration:null|{action,reason,moderatorName,moderatedAt}`. Deleted không trả body; không restore deleted hoặc sửa nội dung người khác. Statistics hiện lấy toàn catalog, cần summary server toàn tập dữ liệu tương ứng.

## 7. Query chính xác đang dùng ở FE

| Feature | Query/giá trị hiện tại cần map sang HTTP |
| --- | --- |
| Explore/Admin Anime | q, genre (filter slug), year (string trên FE → number/omit), status=''\|airing\|completed\|upcoming, format=''\|tv\|movie, sort=newest\|title, page, pageSize=12\|24 |
| Admin Genres | q, usage=''\|used\|unused, sort=name\|name-desc, page, pageSize=5\|10\|20 |
| Admin Users | q, status=''\|active\|blocked, sort=newest\|oldest\|name, page, pageSize=10\|20\|50 |
| Admin Episodes (lọc local hiện tại) | q theo title/number, animeId, seasonId, status=''\|draft\|published, sort=order\|title, page, pageSize=10\|20\|50 |
| Admin Sources (lọc local) | episodeId/cha animeId/seasonId, q theo label/providerKey/language, enabled=''\|yes\|no, sort=created\|label, page, pageSize=5\|10\|20 |
| Admin Comments (lọc local) | q theo body/authorName/userId/id, animeId, status=''\|visible\|hidden\|deleted, sort=newest\|oldest\|updated, page, pageSize=5\|10\|20 |
| Library (lọc local) | tab=favorites\|watching\|history, q, sort=recent\|title, page; pageSize nội bộ 8 |
| Public comments (paging local) | UI commentPage, pageSize nội bộ 5; API dùng page |

`commentId`, `userId` trên URL panel; `sourceId` chọn nguồn để xem phụ đề; `returnTo`, `mock`, `comments` demo không tự là list filter server. Panel dùng ID cho detail request. `enabled=yes/no` có thể map boolean server; giá trị rỗng omit. Sort created của nguồn hiện giữ thứ tự mảng, chưa có createdAt trong model AdminSource; cần chốt server order/tie-breaker, không tự gọi là ngày mới nhất.

FE hiện tìm bỏ dấu và clamp page vượt cuối; BE danh mục đã có tìm chưa bỏ dấu và giữ page với data rỗng. Title sort cũng khác collation. Khi tích hợp phải map/đổi hành vi có chủ đích, không sửa contract BE đã có mà không đối chiếu.

## 8. Schema FE cần để render

Source chuẩn: [types/anime.ts](../FE/src/types/anime.ts), [episode.ts](../FE/src/types/episode.ts), [player.ts](../FE/src/types/player.ts), [admin types](../FE/src/types).

```ts
type Anime = {
  id: string; slug: string; title: string; subtitle: string; synopsis: string;
  posterUrl: string; bannerUrl: string; releaseYear: number;
  status: 'airing' | 'completed' | 'upcoming'; format: 'tv' | 'movie';
  genres: string[]; episodeLabel: string;
};
type Season = { id: string; animeId: string; number: number; title: string; sortOrder: number };
type Episode = {
  id: string; seasonId: string; number: number; title: string; sortOrder: number;
  durationSeconds: number; thumbnailUrl: string; publishedAt: string;
  status: 'published' | 'draft'; hasPlayback: boolean;
};
type AnimeDetail = Anime & {
  alternativeTitles: string[]; seasons: Season[]; episodes: Episode[]; related: Anime[];
};
type WatchDetail = {
  anime: AnimeDetail; episode: Episode; episodes: Episode[];
  sources: {
    id: string; label: string; url: string; type: 'video/mp4' | 'video/webm';
    subtitles: { id: string; url: string; language: string; label: string; isDefault: boolean }[];
  }[];
};
```

Các field subtitle/episodeLabel là view model, có thể derive khi đủ dữ liệu; không bịa số tập. DTO BE đang có genres objects, banner nullable, format thêm ova/ona/special: mapper convert genres, fallback ảnh và chốt mở rộng type/UI. Không bắt BE trả entity EF hoặc cấu trúc DB như view model này.

WatchDetail chưa chứa expiresAt và nguồn chỉ MP4/WebM; admin có HLS/SRT. Nối BE cần thêm model/logic nguồn hết hạn, hỗ trợ HLS thích hợp và chuyển SRT sang VTT hoặc giới hạn format. Published/hasPlayback/nguồn enabled là ba khái niệm cần kiểm chứng riêng. Playlist và tập trước/sau theo sortOrder xuyên mùa, không theo số/ID liên tiếp.

### Ví dụ HTTP và giá trị adapter trả cho FE

```json
{
  "data": [{ "id": "genre_example", "name": "Phiêu lưu", "slug": "adventure", "animeCount": 7 }],
  "meta": { "page": 1, "pageSize": 5, "total": 1, "totalPages": 1 }
}
```

Ví dụ minh hoạ GET admin genres. Adapter unwrap thành AdminGenreResult `{data,meta}`. GET Home có envelope `{data:{featured:[],updated:[],recommended:[],topViewed:[]}}`; adapter trả trực tiếp HomeCatalog. GET admin anime giữ `genreOptions/years` như metadata bổ sung hoặc adapter ghép endpoint options để tạo AdminAnimeResult. Không chỉ trả mảng và bắt UI đoán total/options.

Lỗi dùng envelope contract `error.code/message/fields/requestId`; `fields` map được về key form (title/slug/email/currentPassword...). 401 phiên thiếu/hết hạn, 403 thiếu permission/blocked, 404 không có/không public hoặc own theo chính sách, 409 xung đột/ràng buộc khi được chốt, 400 validation. DELETE 204 không có JSON. Mutation hiện refetch, cache cần invalidation đúng user/module; GET thất bại không tự chuyển sang mock.

## 9. Phân quyền và phạm vi BE cần triển khai

Theo [roles-permissions.md](docs-FE/rules/roles-permissions.md): user dùng public + own; manage thêm admin read; admin thêm write nội dung/moderate. Users chỉ read cho cả hai. BE kiểm tra permission cụ thể/ownership/trạng thái, không tin tên role client. Không wildcard admin bypass; guest đọc public published; không lộ draft qua related/ranking/tập/playback.

Quyền theo nhóm: admin:dashboard:read; admin:anime:read/write; admin:genre:read/write; admin:episode:read/write; admin:playback:read/write; admin:user:read; admin:comment:read/moderate. Role mới đăng ký user; adminPreview/dev seed không là cơ chế login production.

### Trình tự dùng tài liệu này để code BE

1. Chọn một feature; chốt request/response và endpoint trong API contract, giữ mapping repository ở đây.
2. Triển khai service/controller/DB/validation/permission và test; dùng source validators làm baseline UI, BE vẫn tự validate.
3. Tạo HTTP adapter/mapper FE; với getCatalog/local storage cần sửa hook sang list/detail server như đã ghi, không chỉ thay URL.
4. Kiểm tra form, list/meta/options, direct link edit/panel, filter/history, refresh sau mutation, hai user, quyền đọc/ghi và lỗi.

Không có yêu cầu triển khai CRUD user, upload avatar/video, quên mật khẩu, cấp role hoặc view event tự động chỉ vì tài liệu liệt kê feature. Những phần đó chưa có lời gọi FE. API mới phục vụ đúng các flow trên; cơ chế auth/định nghĩa view/concurrency còn phải chốt theo module.
