# Sinh màn hình quản trị

Áp dụng khi người dùng gọi Dashboard quản trị, Quản lý phim/tập/thể loại/bình luận/người dùng hoặc tên tương đương. Đây là mặc định triển khai FE cho lần gọi tương ứng. [Dashboard](../admin-dashboard-screen.md) đã có UI mock tại /admin ngày 2026-10-30; các trang CRUD, API và quyền quản trị thật chưa triển khai. API/role quản trị vẫn cần chốt theo [quyền BE](../../docs-BE/auth-permissions.md) và [API chung](../../api-contract.md).

Đọc cùng [screen-generation.md](../prompts/screen-generation.md), [cấu trúc FE](fe-structure.md), [routes](routes.md), [style](styling.md), [quyền](roles-permissions.md) và [common](common/readme.md). Chỉ triển khai màn hình được gọi tên và nền cần thiết; không sinh toàn bộ hệ thống quản trị hoặc BE.

## Nhận diện màn hình và phạm vi mặc định

Các route bên dưới là quy ước khi generate; hiện chỉ Dashboard đã có UI mock, không phải toàn bộ danh sách đều được triển khai. Dùng ID ổn định và URL builders trong config/paths.ts. Tên Dashboard không kèm ngữ cảnh được hiểu là Dashboard quản trị của Anime Web; tên Trang chủ vẫn là Home công khai.

| Tên gọi | Route dự kiến | Phạm vi lần generate |
| --- | --- | --- |
| Dashboard / Dashboard quản trị / Tổng quan quản trị | `/admin` | Số liệu từ fixture/repository, nội dung cập nhật gần đây, liên kết đến chức năng đã có |
| Quản lý phim / Quản lý anime / Anime management | `/admin/anime` | Danh sách, tìm/lọc/sort/phân trang, liên kết thêm/sửa và hành động theo quyền |
| Thêm phim / Tạo anime | `/admin/anime/new` | Form metadata, validation, lưu/hủy và phản hồi kết quả |
| Sửa phim / Chỉnh sửa anime | `/admin/anime/:animeId/edit` | Tải theo ID, form, lưu/hủy, không tìm thấy và lỗi cập nhật |
| Quản lý tập phim / Episode management | `/admin/episodes` | Chọn anime/mùa, tìm/lọc tập, danh sách và trạng thái công bố |
| Thêm tập phim | `/admin/episodes/new` | Chọn anime/mùa, số tập, tiêu đề, thứ tự, thời lượng và trạng thái |
| Sửa tập phim | `/admin/episodes/:episodeId/edit` | Tải tập theo ID, chỉnh metadata và lưu/hủy |
| Quản lý thể loại / Genre management | `/admin/genres` | Danh sách, thêm/sửa tên/slug; kiểm tra trùng và quan hệ đang dùng |
| Quản lý bình luận / Kiểm duyệt bình luận | `/admin/comments` | Lọc theo phim/trạng thái, xem nội dung, ẩn/hiện theo quyền và trạng thái hợp lệ |
| Quản lý người dùng / User management | `/admin/users` | Danh sách, tìm/lọc, xem hồ sơ tối thiểu; đổi trạng thái chỉ khi có đặc tả/quyền tương ứng |

Danh sách phim/tập mặc định là màn hình danh sách. Không tự sinh thêm mọi route form từ một yêu cầu danh sách: chỉ hiện CTA khi route đích đã có, hoặc dùng thông báo tối thiểu có đường quay lại theo prompt chung. Với thể loại, form ngắn có thể nằm trong cùng màn hình nếu chưa có thiết kế khác. Không để nút chính im lặng hoặc callback rỗng.

Dashboard không tự triển khai CRUD của từng module. Số liệu mẫu phải tính từ fixture hoặc được repository định nghĩa rõ; không bịa lượt xem/doanh thu/người dùng trực tuyến như dữ liệu vận hành thật. Không cài thư viện biểu đồ nếu các số liệu chưa cần biểu đồ.

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

User trong SessionProvider vẫn là guest/member demo với permission cá nhân; Dashboard dùng adminPreview chỉ đọc, tách riêng user và chỉ bật chủ động trong dev. Có user không đồng nghĩa có quyền quản trị. Không tự nâng quyền cho viewer, newcomer, tài khoản đăng ký mới, email có chữ admin hoặc mọi member.

Khi chưa có auth/API quản trị, dùng adapter/fixture phiên quản trị mẫu **riêng và chỉ bật chủ động ở dev/test** để kiểm chứng giao diện. Tái sử dụng provider chung, không tạo router hoặc phiên production song song. Ghi rõ cách mở phiên mẫu trong tài liệu/bàn giao; không tự đăng nhập, không thêm quyền admin vào danh sách quyền mặc định. Production mặc định từ chối nếu chưa có nguồn quyền đáng tin cậy. Hành vi này là mô phỏng FE, không phải cấp quyền server.

Các mã sau là đề xuất cho fixture/guard FE, phải map lại theo hợp đồng BE được duyệt khi tích hợp:

| Nghiệp vụ | Đọc | Ghi |
| --- | --- | --- |
| Dashboard | `admin:dashboard:read` | Không có |
| Phim | `admin:anime:read` | `admin:anime:write` |
| Tập | `admin:episode:read` | `admin:episode:write` |
| Thể loại | `admin:genre:read` | `admin:genre:write` |
| Bình luận | `admin:comment:read` | `admin:comment:moderate` |
| Người dùng | `admin:user:read` | Chưa mặc định cấp quyền thay trạng thái/role |

- Guest vào admin: yêu cầu đăng nhập, giữ returnTo nội bộ bằng paths.loginTo/safeReturnTo. Sau đăng nhập phải kiểm tra lại permission; member thông thường vẫn nhận trang thiếu quyền.
- Mỗi route kiểm tra quyền đọc; form/hành động kiểm tra quyền ghi riêng. Người có quyền đọc không tự được sửa/xóa. Khi đăng xuất hoặc đổi phiên, dừng request đang ghi và xóa cache/draft nhạy cảm của phiên cũ.
- Không mặc định role admin có mọi permission, bỏ ownership hoặc được sửa bình luận bị xóa. Không thêm giao diện cấp role/permission, reset mật khẩu, xem thông tin bí mật hoặc thao tác hàng loạt ngoài yêu cầu.
- Chức năng kiểm duyệt là quy trình riêng với quyền comment:update:own. Hiện lại bình luận chỉ áp dụng từ trạng thái hidden hợp lệ, không tự khôi phục deleted. Quyền thật và trạng thái tài nguyên vẫn phải được BE kiểm tra.
- FE guard và dữ liệu localStorage chỉ phục vụ UI/mock; không phải bằng chứng xác thực hoặc phân quyền BE.

## Dữ liệu, form và thao tác

- Nếu chưa có API phù hợp, hoàn thiện bằng repository mock, seed riêng và ổn định. Giữ ID liên quan nhất quán với danh mục; ghi quản trị mock không tự sửa fixture công khai hoặc dữ liệu tài khoản khác. Việc đồng bộ màn hình công khai cần đặc tả rõ khi có yêu cầu.
- Không gọi API thật hoặc tự tạo endpoint quản trị trong nhiệm vụ FE. Khi có contract được duyệt, adapter chịu trách nhiệm DTO/mapping/lỗi; không rải URL `/admin` API vào component hoặc coi route FE là endpoint BE.
- Tìm/lọc/sort/page/pageSize ở URL. Đổi điều kiện về trang 1, phân trang giữ điều kiện, Back/Forward/reload đồng bộ control và kết quả. Tái sử dụng hành vi tự tìm debounce 350ms khi phù hợp; không tự tạo chip từ khóa nếu đã có ô tìm kiếm.
- Form có required/giới hạn độ dài/kiểu dữ liệu, validation cạnh field, focus lỗi đầu tiên, pending/error/success. Chặn gửi lặp, giữ nội dung khi lỗi; thông báo thành công chỉ sau repository xác nhận. Không lưu password, token hoặc quyền do người dùng nhập vào fixture quản trị.
- Form phim: metadata tối thiểu title/slug/synopsis/year/status/format/genres, poster/banner cục bộ hoặc placeholder. Slug/ID không được thay thế nhau; kiểm tra slug trùng. Không tự thêm upload hoặc dịch vụ ảnh ngoài.
- Form tập: anime/mùa phải liên quan hợp lệ, số tập/thứ tự/thời lượng có kiểm tra. Published không đồng nghĩa có nguồn phát. Không nhập hoặc bịa nguồn phim thật; cấu hình playback/subtitle/upload cần yêu cầu và contract riêng.
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
