# Sinh màn hình quản trị

Áp dụng khi người dùng gọi Dashboard hoặc trang quản lý. [Dashboard](../admin-dashboard-screen.md), [CRUD anime](../admin-anime-screen.md), [CRUD thể loại](../admin-genres-screen.md), [Mùa/phần và tập](../admin-episodes-screen.md), [Nguồn và phụ đề](../admin-playback-screen.md), [Kiểm duyệt bình luận](../admin-comments-screen.md) và [Người dùng chỉ đọc](../admin-users-screen.md) đã có FE mock; API và quyền quản trị thật chưa triển khai. API/role quản trị vẫn cần chốt theo [quyền BE](../../docs-BE/auth-permissions.md) và [API chung](../../api-contract.md).

Đọc cùng [screen-generation.md](../prompts/screen-generation.md), [cấu trúc FE](fe-structure.md), [routes](routes.md), [style](styling.md), [quyền](roles-permissions.md) và [common](common/readme.md). Chỉ triển khai màn hình được gọi tên và nền cần thiết; không sinh toàn bộ hệ thống quản trị hoặc BE.

## Nhận diện màn hình và phạm vi mặc định

Các route bên dưới là quy ước khi generate; hiện Dashboard, Anime, Thể loại, Mùa và tập, Người dùng đã có UI mock với phạm vi riêng. Dùng ID ổn định và URL builders trong config/paths.ts. Tên Dashboard không kèm ngữ cảnh được hiểu là Dashboard quản trị; tên Trang chủ vẫn là Home công khai.

| Tên gọi | Route dự kiến | Phạm vi lần generate |
| --- | --- | --- |
| Dashboard / Dashboard quản trị / Tổng quan quản trị | `/admin` | Số liệu từ fixture/repository, nội dung cập nhật gần đây, liên kết đến chức năng đã có |
| Quản lý phim / Quản lý anime / Admin anime / Anime management | `/admin/anime` | Danh sách/tìm/lọc/sort/phân trang, thêm/sửa/xoá theo quyền đã có trong mock |
| Thêm phim / Tạo anime | `/admin/anime/new` | Form metadata, validation, lưu/hủy và phản hồi kết quả |
| Sửa phim / Chỉnh sửa anime | `/admin/anime/:animeId/edit` | Tải theo ID, form, lưu/hủy, không tìm thấy và lỗi cập nhật |
| Mùa/phần và tập phim / Quản lý tập phim / Episode management | `/admin/episodes` | CRUD mùa inline, tìm/lọc/sort/phân trang tập và thêm/sửa/xoá metadata theo quyền; chặn xoá mùa còn tập, tập đã công bố |
| Quản lý nguồn phát và phụ đề / Nguồn phát / Phụ đề | `/admin/playback` | CRUD form inline nguồn theo tập và phụ đề theo nguồn, bật/tắt và mặc định; FE mock đã có, chưa kiểm chứng playback |
| Thêm tập phim | `/admin/episodes/new` | Chọn anime/mùa, số tập, tiêu đề, thứ tự, thời lượng và trạng thái |
| Sửa tập phim | `/admin/episodes/:episodeId/edit` | Tải tập theo ID, chỉnh metadata và lưu/hủy |
| Thể loại / Quản lý thể loại / Genres / Genre management | `/admin/genres` | CRUD form inline đã có, tìm/lọc/sort/phân trang, kiểm tra trùng và chặn xoá đang dùng |
| Comment / Comments / Bình luận / Quản lý bình luận / Kiểm duyệt bình luận | `/admin/comments` | Tìm/lọc/sort/phân trang, panel nội dung và ẩn/hiện lại có lý do theo quyền; deleted không được khôi phục |
| User / Users / Người dùng / Quản lý người dùng | `/admin/users` | Danh sách/tìm/lọc/sort/phân trang và hồ sơ query userId chỉ đọc đã có; không tự cấp role hoặc đổi trạng thái |

Theo yêu cầu cập nhật CRUD ngày 2026-10-30, khi generate/cập nhật màn quản lý tài nguyên có nghiệp vụ CRUD (phim/tập/thể loại/nguồn/phụ đề), mặc định hoàn thiện danh sách cùng thêm/sửa/xoá của chính module đó, form, validation, xác nhận xoá và guard đọc/ghi. Nếu người dùng chỉ yêu cầu danh sách hoặc một form cụ thể thì giữ phạm vi đó. Với thể loại và cấu hình nguồn/phụ đề, form ngắn có thể nằm cùng màn hình. Không tạo module quản lý khác khi chưa được gọi; CTA chỉ hiện khi có route và hành vi hoạt động.

Dashboard chỉ tổng hợp dữ liệu, không có CRUD riêng. Bình luận theo quy trình kiểm duyệt, người dùng theo đặc tả trạng thái/quyền; không suy ra quyền xoá tài khoản, cấp role hoặc xoá bình luận ngoài chính sách từ rule CRUD chung. Xoá tài nguyên đang được tham chiếu phải bị chặn hoặc theo contract rõ ràng, không tự cascade.

Dashboard không tự triển khai CRUD của từng module. Số liệu mẫu phải tính từ fixture hoặc được repository định nghĩa rõ; không bịa lượt xem/doanh thu/người dùng trực tuyến như dữ liệu vận hành thật. Không cài thư viện biểu đồ nếu các số liệu chưa cần biểu đồ.

Theo yêu cầu Top phim ngày 2026-10-31, Dashboard và Trang chủ dùng [TopViewedAnime chung](common/top-viewed-anime.md): Top 10 từ cùng danh mục công khai và fixture lượt xem hư cấu, ghi rõ số liệu mẫu. Không suy ra đã có analytics thật, không tự tăng lượt khi truy cập. Bảng xếp hạng độc lập các bộ lọc/CRUD và không có pagination riêng.

## Layout, route và cấu trúc source

- AdminLayout riêng gồm sidebar, header, breadcrumb, tiêu đề/hành động và Outlet. Không đưa sidebar quản trị vào MainLayout công khai; giữ một router và một hệ provider hiện có.
- Đăng ký nhánh `/admin` ở app/router.tsx, màn hình tại app/routes/admin/. Sidebar dùng NavLink; Dashboard dùng end để không active trên mọi trang con. Header có tên màn hình, người dùng hiện tại, đăng xuất và đường về giao diện xem phim.
- Chỉ hiện menu đến chức năng đã triển khai và có quyền đọc. Route chưa có không được trỏ thành link hỏng; menu không thay cho guard truy cập trực tiếp URL.
- Shared layout tại components/layouts nhận cấu hình menu/nội dung qua props; không import feature hoặc app. Ghép feature ở app/routes/admin; feature không import chéo. Tái sử dụng nghiệp vụ anime/episode hiện có khi phù hợp, chỉ tách feature quản lý riêng khi trách nhiệm khác rõ ràng.
- Contract/adapter dùng chung ở lib/api, fixture ổn định ở testing/mocks/fixtures, entity chia sẻ ở types, session/quyền dùng chung ở stores. Không sửa fixture trong component hoặc gọi storage/fetch trong JSX.
- Dùng alias @/, file kebab-case và chạy check:architecture. Giữ Tailwind tw: là chính, font tối thiểu 14px; tái sử dụng Button, Input, Combobox, Selectbox, Icon và Pagination. Giữ lựa chọn kích thước/common focus theo tài liệu hiện có.
- Desktop có sidebar; mobile dùng vùng điều hướng mở/đóng với Button có aria-expanded/aria-controls. Nếu dùng drawer/dialog, hỗ trợ Escape, quản lý focus và trả focus về nút mở. Bảng dài chỉ cuộn trong vùng bảng có nhãn, không làm cả trang tràn ngang ở 375px.
- Ưu tiên bảng HTML semantic với caption/header cells, label rõ cho hành động từng dòng. Không tạo DataTable/Dialog common chỉ để đủ bộ; chỉ trừu tượng khi có nhu cầu tái sử dụng thực tế.

## Phiên và phân quyền

Áp dụng [ba role user/manage/admin](roles-permissions.md#ba-role-chuẩn): user không vào quản trị, manage chỉ đọc, admin đọc/ghi nội dung và kiểm duyệt trong phạm vi permission đã liệt kê. Quản lý người dùng vẫn chỉ đọc; tên admin không bỏ qua ownership, trạng thái hoặc ràng buộc xoá. Khi generate lấy ma trận role tại roles-permissions.md làm nguồn chung; không tự thêm quyền ngoài phạm vi.

User trong SessionProvider vẫn là guest/member demo với permission cá nhân. Phiên adminPreview tách riêng user, chỉ bật chủ động trong dev: hai lựa chọn đọc Dashboard/Anime/Mùa và tập/Thể loại/Người dùng/Nguồn và phụ đề/Bình luận; lựa chọn chỉnh sửa thêm admin:anime:write, admin:episode:write, admin:genre:write, admin:playback:write và admin:comment:moderate. Mỗi activation có ID và workspace bộ nhớ mới; bình luận quản trị và Người dùng không lấy từ registry đăng nhập/bình luận cá nhân. Không tự nâng quyền member hoặc thêm quyền ghi User. Mã quyền đọc/ghi đầy đủ ở bảng dưới.

Khi chưa có auth/API quản trị, dùng adapter/fixture phiên quản trị mẫu **riêng và chỉ bật chủ động ở dev/test** để kiểm chứng giao diện. Tái sử dụng provider chung, không tạo router hoặc phiên production song song. Ghi rõ cách mở phiên mẫu trong tài liệu/bàn giao; không tự đăng nhập, không thêm quyền admin vào danh sách quyền mặc định. Production mặc định từ chối nếu chưa có nguồn quyền đáng tin cậy. Hành vi này là mô phỏng FE, không phải cấp quyền server.

Các mã sau là đề xuất cho fixture/guard FE, phải map lại theo hợp đồng BE được duyệt khi tích hợp:

| Nghiệp vụ | Đọc | Ghi |
| --- | --- | --- |
| Dashboard | `admin:dashboard:read` | Không có |
| Phim | `admin:anime:read` | `admin:anime:write` |
| Mùa/phần và tập | `admin:episode:read` | `admin:episode:write` |
| Nguồn phát và phụ đề | `admin:playback:read` | `admin:playback:write` |
| Thể loại | `admin:genre:read` | `admin:genre:write` |
| Bình luận | `admin:comment:read` | `admin:comment:moderate` |
| Người dùng | `admin:user:read` | Chưa mặc định cấp quyền thay trạng thái/role |

- Guest vào admin: yêu cầu đăng nhập, giữ returnTo nội bộ bằng paths.loginTo/safeReturnTo. Sau đăng nhập phải kiểm tra lại permission; member thông thường vẫn nhận trang thiếu quyền.
- Mỗi route kiểm tra quyền đọc; form/hành động kiểm tra quyền ghi riêng. Người có quyền đọc không tự được sửa/xóa. Khi đăng xuất hoặc đổi phiên, dừng request đang ghi và xóa cache/draft nhạy cảm của phiên cũ.
- Không mặc định role admin có mọi permission, bỏ ownership hoặc được sửa bình luận bị xóa. Không thêm giao diện cấp role/permission, reset mật khẩu, xem thông tin bí mật hoặc thao tác hàng loạt ngoài yêu cầu.
- Chức năng kiểm duyệt là quy trình riêng với quyền comment:update:own. Hiện lại bình luận chỉ áp dụng từ trạng thái hidden hợp lệ, không tự khôi phục deleted. Quyền thật và trạng thái tài nguyên vẫn phải được BE kiểm tra.
- [Bình luận quản trị](../admin-comments-screen.md) đã có FE mock: read/moderate riêng, chỉ visible ↔ hidden, lý do 3–300 ký tự và xác nhận. Không tạo/sửa nội dung/xoá cứng hoặc khôi phục deleted; DTO lược bỏ body đã xoá. Chỉ lưu lần kiểm duyệt gần nhất trong phiên mẫu, không thay bình luận công khai/cá nhân; audit/contract BE vẫn cần chốt.
- FE guard và dữ liệu localStorage chỉ phục vụ UI/mock; không phải bằng chứng xác thực hoặc phân quyền BE.

## Dữ liệu, form và thao tác

- Nếu chưa có API phù hợp, hoàn thiện bằng repository mock, seed riêng và ổn định. Giữ ID liên quan nhất quán với danh mục; ghi quản trị mock không tự sửa fixture công khai hoặc dữ liệu tài khoản khác. Việc đồng bộ màn hình công khai cần đặc tả rõ khi có yêu cầu.
- Không gọi API thật hoặc tự tạo endpoint quản trị trong nhiệm vụ FE. Khi có contract được duyệt, adapter chịu trách nhiệm DTO/mapping/lỗi; không rải URL `/admin` API vào component hoặc coi route FE là endpoint BE.
- Tìm/lọc/sort/page/pageSize ở URL. Đổi điều kiện về trang 1, phân trang giữ điều kiện, Back/Forward/reload đồng bộ control và kết quả. Tái sử dụng hành vi tự tìm debounce 350ms khi phù hợp; không tự tạo chip từ khóa nếu đã có ô tìm kiếm.
- Danh sách records có hai [Pagination chung](common/pagination.md): phía trên và phía dưới, nhóm nút trang căn giữa chiều rộng danh sách ở cả hai vị trí, cùng trạng thái/URL builder, bật showSinglePage để giữ cả hai khi có một trang. Chỉ thanh phía trên truyền pageSizeControl để hiện ô số bản ghi mỗi trang ở bên phải; thanh dưới và màn công khai không bật ô này. Không giữ thêm ô pageSize ở bộ lọc hoặc tiêu đề. Form GET bảo toàn pageSize bằng hidden Input; đổi số lượng về trang 1 và giữ bộ lọc. Khi rỗng, giữ ô số lượng phía trên, ẩn thanh dưới; không thêm phân trang vào Dashboard tổng hợp hoặc danh sách con chưa có yêu cầu phân trang.
- Form có required/giới hạn độ dài/kiểu dữ liệu, validation cạnh field, focus lỗi đầu tiên, pending/error/success. Chặn gửi lặp, giữ nội dung khi lỗi; thông báo thành công chỉ sau repository xác nhận. Không lưu password, token hoặc quyền do người dùng nhập vào fixture quản trị.
- Form phim: metadata tối thiểu title/slug/synopsis/year/status/format/genres, poster/banner cục bộ hoặc placeholder. Slug/ID không được thay thế nhau; kiểm tra slug trùng. Không tự thêm upload hoặc dịch vụ ảnh ngoài.
- Form tập: anime/mùa phải liên quan hợp lệ, số tập/thứ tự/thời lượng có kiểm tra. Published không đồng nghĩa có nguồn phát. Không nhập hoặc bịa nguồn phim thật; cấu hình playback/subtitle/upload cần yêu cầu và contract riêng.
- [Nguồn phát và phụ đề](../admin-playback-screen.md) đã được gọi riêng: CRUD cấu hình trong phiên mẫu, read/write riêng; không tự fetch hoặc mở tài nguyên từ form. enabled không đặt hasPlayback=true khi chưa kiểm chứng. Phụ đề thuộc nguồn, mỗi nguồn tối đa một track mặc định; xoá nguồn còn phụ đề hoặc tập còn nguồn bị chặn. Không cascade, không tự nối cấu hình mock vào player công khai; upload/API/chuyển đổi định dạng cần yêu cầu riêng.
- Xóa/ẩn/đổi trạng thái phải mô tả đối tượng và hậu quả, có xác nhận, pending và phản hồi lỗi. Với dữ liệu đang được tham chiếu, dùng quy tắc repository hoặc báo chưa cho phép; không tự xóa cascade, lịch sử, tài khoản hay asset. Trong mock, xác nhận chỉ tác động dữ liệu cục bộ đã nêu; không gọi mutation server thật khi kiểm tra.
- Lưu mock trong bộ nhớ nếu chưa có yêu cầu bền vững; nêu rõ reload sẽ reset. Nếu dùng localStorage thì có namespace/schema version, xử lý dữ liệu hỏng/quota và tách phạm vi phiên; không lẫn kho admin mock với thư viện cá nhân.

## Trạng thái và kiểm chứng

Mỗi màn hình có loading, danh sách trống/chưa có kết quả, lỗi/thử lại, guest/thiếu quyền. Route sửa có not found; form có lỗi field, lỗi lưu và phản hồi thành công. Bộ lọc/bảng/nút theo quyền vẫn dùng được bằng bàn phím.

Sau triển khai, chạy format/build theo AGENTS (bao gồm architecture/typecheck/type tests), rồi browser phù hợp:

1. 375/768/1440px, sidebar/mobile drawer, focus và bảng không gây tràn trang.
2. Route trực tiếp/reload/Back/Forward, menu active, returnTo an toàn; không mở quyền admin chỉ qua URL hoặc tên email.
3. Guest, member, phiên quản trị mẫu, chỉ đọc và có quyền ghi; không chỉ kiểm tra trường hợp đầy đủ quyền.
4. Tìm/lọc/sort/phân trang, validation/lưu/hủy, thao tác xác nhận, lỗi/thử lại và chặn gửi lặp; đổi tài khoản khi request đang chạy.
5. Mock không ghi sang dữ liệu cá nhân khác; không request ngoài hoặc gọi server thật. Không bịa đã test API/permission BE.

Cập nhật tài liệu màn hình tại DOC/docs-FE và chỉ nối thêm bằng chứng vào verification.md. Bàn giao tên màn hình/route, cách mở phiên mẫu, thành phần đã tái sử dụng, kiểm chứng thực tế và giới hạn API/mock. Chỉ thêm rule/module/common thật sự cần cho màn hình đã gọi.
