# Prompt thực thi: tạo màn hình từ tên

Người dùng chỉ cần yêu cầu: **“Đọc Anime-Web/DOC/docs-FE/prompts/screen-generation.md và tạo màn hình [tên màn hình].”** Không yêu cầu họ điền template hoặc cung cấp thêm ảnh UI. Khi chỉ được yêu cầu đọc/review tài liệu, không tự triển khai màn hình.

## Nhiệm vụ

Bạn là lập trình viên FE của dự án Anime-Web. Khi người dùng yêu cầu thực thi file này kèm tên màn hình, hãy tạo code hoạt động trong workspace, tích hợp vào FE hiện có, kiểm chứng và hướng dẫn mở màn hình. Không dừng ở đề xuất hoặc trả đoạn code để người dùng tự chép.

Chỉ triển khai màn hình được gọi tên và nền/component cần thiết. Không triển khai toàn bộ website hoặc BE. Không tự tạo Site, push lên hosting, deploy hoặc publish; thực hiện cục bộ.

## 1. Tự đọc bối cảnh

- Đọc AGENTS.md áp dụng cho SRC và các thư mục dự án trước khi sửa.
- Đọc DOC/readme.md, DOC/decisions.md, DOC/entities.md, DOC/api-contract.md, DOC/docs-FE/design/wireframes.md và [mục lục rules](../rules/readme.md). Áp dụng đầy đủ [kiến trúc](../rules/architecture.md), [cấu trúc FE](../rules/fe-structure.md), [style](../rules/styling.md) và [role/permission](../rules/roles-permissions.md).
- Đọc thêm [route và navigation](../rules/routes.md); đây là rule bắt buộc cho mọi màn hình được generate.
- Đọc [component dùng chung](../rules/common/readme.md), áp dụng [Button](../rules/common/button.md) cho nút hành động và CTA; tái sử dụng component thay vì lặp thẻ button/class btn ở page/feature.
- Button có icon dùng label/startIcon/endIcon theo hướng đọc; không chèn whitespace/margin riêng để căn icon. Chỉ truyền label hoặc children, giữ aria-label cho nút icon-only.
- Ô nhập dùng [Input](../rules/common/input.md), nhập có gợi ý tự do dùng [Combobox](../rules/common/combobox.md), lựa chọn giới hạn dùng [Selectbox](../rules/common/selectbox.md). Giữ label/validation và Form/query theo nghiệp vụ; không tự xây lại control tương đương.
- Các common control hỗ trợ [size sm/md/lg](../rules/common/sizes.md), mặc định md, font 14px; dùng prop size thay vì tự tạo class kích thước. htmlSize dành cho size HTML dạng số.
- Icon chức năng dùng [common Icon/Font Awesome Free](../rules/common/icon.md), import từ registry nội bộ; không thêm CDN/Kit hoặc dùng Unicode thay icon. Icon trang trí ẩn với screen reader, nút chỉ icon phải có nhãn.
- Danh sách phân trang dùng [Pagination chung](../rules/common/pagination.md), truyền label và URL builder giữ query, dùng size/loading/disabled khi cần. Không tạo pagination trùng trong feature hoặc điều hướng bằng callback thủ công.
- Kiểm tra source thực tế, package.json, workspace, router, styles, component và thay đổi đang có. Source có thể đã phát triển kể từ lúc tài liệu này được viết.
- Giữ nguyên thay đổi ngoài phạm vi và các màn hình đã làm. Tài liệu dự án tập trung trong DOC.
- Không yêu cầu người dùng điền lại route, component, mock, quyền hoặc checklist: tự suy ra từ các phần bên dưới và tài liệu liên quan.

## 2. Nhận diện tên màn hình

Không phân biệt hoa/thường. Chấp nhận các tên tiếng Việt hoặc tiếng Anh tương đương:

| Tên / tên khác | Page | Route | Phạm vi mặc định |
| --- | --- | --- | --- |
| Trang chủ / Home | HomePage | / | Banner, mới cập nhật, đề xuất; tiếp tục xem khi member có lịch sử |
| Khám phá / Tìm kiếm / Danh sách anime / Explore | ExplorePage | /anime | Tìm kiếm, lọc, sort, grid, phân trang và query URL |
| Chi tiết phim / Chi tiết anime / Anime Detail | AnimeDetailPage | /anime/:slug | Poster/banner, mô tả, mùa/tập, yêu thích, bình luận |
| Xem phim / Player / Watch | WatchPage | /watch/:episodeId | Player demo, chọn tập, trước/sau, chế độ rạp, tiến độ |
| Thư viện / Bộ sưu tập / Library | LibraryPage | /library | Yêu thích, đang xem, lịch sử; chỉ member |
| Đăng nhập / Login | LoginPage | /login | Đăng nhập mock có nhãn rõ, quay về route nội bộ đã yêu cầu |
| Đăng ký / Register / Sign up | RegisterPage | /register | Form tạo hồ sơ demo riêng, không lưu mật khẩu; giữ returnTo giữa hai trang auth |

Tên chưa có trong bảng: ưu tiên tìm đặc tả trong DOC và source. Nếu đủ rõ, tự chọn route/page phù hợp, nêu giả định trong bàn giao. Chỉ hỏi khi tên thực sự mơ hồ hoặc liên quan quyết định nghiệp vụ chưa thể suy ra; không tự dựng trang quản trị và cấp thêm quyền.

Nếu màn hình đã tồn tại, cập nhật màn hình đó theo yêu cầu và đặc tả; không tạo bản trùng hoặc xóa chức năng hiện có. Khi thiếu slug/episodeId, tự chọn item mock hợp lệ và đưa URL cụ thể để mở sau khi hoàn thành.

## 3. Mặc định để triển khai mà không cần thêm đầu vào

- Nếu FE đã có ứng dụng: giữ stack, routing, design system và thư viện hiện tại.
- Nếu FE chỉ có khung thư mục: việc người dùng yêu cầu thực thi prompt này cho phép thiết lập nền **React + TypeScript + Vite**, router và scripts dev/build/typecheck tối thiểu. Đây là mặc định của prompt cho lần triển khai, không khẳng định mọi đề xuất trong DOC đều đã được duyệt.
- Chỉ thêm dependency cần thiết; không cài sẵn một bộ UI/player/state management lớn nếu chưa dùng.
- Dự án đã cài Tailwind CSS và Bootstrap 5; tuân thủ DOC/docs-FE/rules/styling.md. Layout, flex/grid, spacing, kích thước và responsive ưu tiên utility Tailwind `tw:` trực tiếp trong JSX; dùng tw:text-body cho font token. Tái sử dụng component trước, chỉ thêm CSS cho thiết kế/trạng thái đặc thù khi cần, xóa declaration/rule đã được thay bằng utility. Không import lại thư viện hoặc bật Preflight. Không trộn utility Bootstrap !important với utility Tailwind cùng thuộc tính.
- Style chung nằm trong `src/styles/common/`, đăng ký qua common/index.css. CSS riêng chỉ thêm khi class/common không đáp ứng; ưu tiên file CSS/CSS Module. Chỉ thật cần mới dùng `<style>...</style>` ở cuối JSX, selector có namespace để không ảnh hưởng trang khác; React không tự scope thẻ style.
- Font nội dung, metadata, label và control tối thiểu 14px ở thiết lập mặc định; dùng `--aw-font-size-base: 0.875rem`, không giảm font trên mobile để ép layout. Áp dụng [quy tắc font](../rules/styling.md#font-chữ).
- Nếu chưa có thiết kế: dùng wireframe trong DOC, nền xanh đen, điểm nhấn tím, tiếng Việt, bố cục tập trung poster và nội dung. Tạo tokens dùng chung. Xem đây là mặc định có thể thay đổi, không phải thương hiệu đã chốt.
- Không tự dùng lại tên Kaze của bản nháp cũ; dùng tên trung tính “Anime Web” nếu chưa có tên chính thức.
- Nếu có UI/ảnh người dùng gửi cùng yêu cầu: ưu tiên tham chiếu đó, giữ các yêu cầu phân quyền và cấu trúc source. Không đòi ảnh nếu người dùng chỉ gửi tên màn hình.
- Dùng dữ liệu mock ổn định qua repository, không cần API key hoặc nguồn phim thật. Nếu mô hình mùa chưa chốt, tạm theo entities.md và ghi nhận giả định, không tự coi đó là quyết định chính thức.
- Với danh mục: tạo đủ fixture để thể hiện các nhóm nội dung; với khám phá, đủ item để phân trang và lọc có ý nghĩa. Các màn hình dùng chung ID và fixture.
- Ưu tiên ảnh/asset cục bộ; thiếu poster thì dùng placeholder được thiết kế, không phụ thuộc link ảnh ngẫu nhiên. Không tạo hoặc gọi dịch vụ AI để có asset.
- Player ưu tiên asset demo đã có và được phép sử dụng. Nếu chưa có video cục bộ, vẫn hoàn thiện giao diện/điều khiển phù hợp, hiển thị “Chưa có video demo” và báo rõ chưa kiểm chứng playback. Không bịa nguồn anime thật hoặc gọi dịch vụ video ngoài trong kiểm tra.

## 4. Vị trí và chất lượng source

```text
FE/src/app/routes/                 Màn hình ghép feature
FE/src/app/{app,provider,router}.tsx App/provider/router tập trung
FE/src/config/paths.ts             Pattern và URL builders
FE/src/features/<feature>/         components/hooks/types/utils/config riêng
FE/src/components/                 UI/common/navigation/layout và view dùng chung
FE/src/lib/api/                    Contracts, adapters, repositories.ts
FE/src/lib/storage/                Adapter localStorage có schema
FE/src/stores/                     State dùng chung như session
FE/src/testing/mocks/fixtures/     Fixture mock ổn định
FE/src/types/                      Entity/DTO chia sẻ nhiều feature
FE/src/utils/                      Hàm thuần dùng chung
FE/src/styles/                     Entry CSS, tokens, global và common
```

- Tái sử dụng component hiện có trước khi tạo mới. AnimeCard dùng chung tại components/anime; các khối có nghiệp vụ vẫn ở feature. Không import chéo feature hoặc để shared import app/feature; ghép chúng tại app/routes theo fe-structure.md. Common không import page/feature cụ thể; UI không import ngược common. Dùng alias @/, file kebab-case và import trực tiếp; build phải qua check:architecture.
- Luồng dữ liệu: page/component → hook/repository → mock hoặc local adapter. Không gọi fetch hoặc localStorage rải rác trong JSX.
- Bắt buộc đọc và áp dụng [quy tắc route](../rules/routes.md). Dùng một React Router chung, đăng ký page trong FE/src/app/router.tsx và URL builder tại paths.ts; dùng Link/NavLink/Form và các hook router. URL mở trực tiếp, reload, Back/Forward và query phải hoạt động; không dựng router thủ công bằng pathname.
- Khi cần dẫn tới màn hình chưa triển khai, dùng trang thông báo tối thiểu có đường quay lại, không làm toàn bộ màn hình đích và không để link hỏng.
- Không để callback rỗng, nút chính vô tác dụng hoặc `href="#"` thay cho điều hướng. Thao tác chưa có dịch vụ thật phải có trạng thái demo/giới hạn rõ.
- Tìm kiếm/bộ lọc/phân trang dùng query URL; đổi bộ lọc về trang 1. Player chuyển tập bằng ID có thứ tự từ dữ liệu, không cộng 1 vào ID.
- localStorage có schema version, xử lý dữ liệu lỗi/hết dung lượng và tách dữ liệu cá nhân theo tài khoản mock.

## 5. Quyền truy cập mặc định

- Guest và member dùng nội dung công khai tương ứng `/api/v1/common/...`: danh mục, tìm kiếm, chi tiết, playback.
- `/api/v1/me/...` dành cho thư viện, tiến độ cá nhân và ghi bình luận; yêu cầu đăng nhập và permission theo roles-permissions.md.
- Guest chọn thư viện, yêu thích hoặc gửi bình luận: yêu cầu đăng nhập; dùng luồng sẵn có hoặc LoginPage mock tối thiểu nếu cần. Giữ returnTo chỉ trong ứng dụng; không tự gửi lại bình luận sau đăng nhập.
- Guest không bị chặn xem phim chỉ vì chưa có tài khoản. Không dựng đăng nhập thật hoặc BE auth trong nhiệm vụ màn hình.
- Demo session phải có nhãn rõ, đủ để kiểm tra guest/member và đăng xuất; không giả vờ là xác thực an toàn. Không tự cấp quyền admin/moderator.
- Bình luận công khai chỉ visible theo đề xuất hiện tại; sửa/xóa kiểm tra permission own và tác giả. Không cho sửa bình luận người khác. Giữ chính sách đã xác nhận mới nhất nếu khác đề xuất.
- Khi đổi tài khoản/đăng xuất, xóa cache cá nhân của phiên trước. FE guard không thay kiểm tra quyền BE trong tương lai.

## 6. UI, responsive và trạng thái

- Hoàn thiện responsive tại các kích thước đại diện 375px, 768px, 1440px; không tràn ngang. Mobile đưa danh sách tập xuống dưới player.
- Semantic HTML, label cho input, alt cho ảnh, focus rõ, thao tác bàn phím; dialog quản lý focus và đóng phù hợp.
- Dựng loading/empty/error/thử lại và ảnh fallback khi có lấy dữ liệu. Với màn hình cá nhân, có trạng thái guest/thiếu quyền.
- Fixture và mock adapter hỗ trợ kiểm tra các trạng thái cần thiết bằng cơ chế dev phù hợp, không thêm bảng debug vào giao diện chính.
- Không hiển thị lượt xem/đánh giá giả như dữ liệu vận hành thật. Dữ liệu mock/video demo phải nhận biết được.

## 7. pnpm, kiểm chứng và tài liệu

- Dùng pnpm@11.10.0, store mặc định chung và một pnpm-lock.yaml tại SRC. Không dùng npm/npx/yarn hoặc tạo workspace/store riêng cho FE.
- Khi khởi tạo: package điều phối tại Anime-Web/package.json; thêm chính xác Anime-Web/FE vào pnpm-workspace.yaml tại SRC nếu chưa nhận diện package lồng nhau. Không tự tạo package BE.
- Cài từ SRC bằng `pnpm install` khi dependency inputs thay đổi, sau đó kiểm tra `pnpm install --frozen-lockfile`. Dùng pnpm exec cho CLI đã cài; tránh tải lại CLI.
- Khi có nền ứng dụng, chạy build/typecheck và kiểm tra hành vi phù hợp với thay đổi. Lệnh dùng tên package/script thực tế, không bịa lệnh đã chạy.
- Nếu có công cụ browser phù hợp, kiểm tra route trực tiếp, thao tác chính, responsive và guest/member liên quan. Nếu không có, ghi rõ chưa kiểm tra trình duyệt, không suy ra UI đúng chỉ từ build.
- Không đọc .env/credentials; không gọi API/model thật trong kiểm tra. Dùng fixture/mock/server cục bộ; tránh request ngoài từ asset/video khi kiểm thử.
- Chỉ thêm test khi có giá trị kiểm tra hành vi; không tạo test chỉ khẳng định thư mục tồn tại.
- Cập nhật tài liệu bị ảnh hưởng và thêm kết quả thật vào DOC/docs-FE/verification.md; giữ lịch sử cũ. Ghi giả định/mặc định đang dùng, không biến chúng thành quyết định người dùng đã xác nhận.

## 8. Điều kiện hoàn thành và bàn giao

Màn hình phải tích hợp vào FE, route mở được, các thao tác trong phạm vi hoạt động và các kiểm tra phù hợp đã chạy hoặc có lý do cụ thể chưa chạy được. Không đánh dấu hoàn thành playback nếu chưa có video kiểm chứng.

Báo cáo ngắn gọn:

1. Màn hình đã làm và URL/route cụ thể, kể cả slug/ID mock cần mở.
2. File chính và component dùng chung đã thêm/tái sử dụng.
3. Lệnh chạy ứng dụng kèm thư mục chạy; chỉ đưa URL server đã xác nhận hoặc ghi đó là URL dự kiến.
4. Kiểm chứng đã chạy, giả định và giới hạn còn lại.

Không yêu cầu người dùng xác nhận lại các mặc định đã cho phép trong file này khi họ yêu cầu thực thi. Chỉ hỏi khi có thiếu sót chặn triển khai hoặc xung đột đáng kể không thể giải quyết từ bối cảnh hiện tại.
