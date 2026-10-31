# Prompt triển khai theo giai đoạn

Các prompt này để người dùng đọc, sửa và sử dụng sau. Việc lưu prompt không kích hoạt triển khai hoặc cho phép xuất bản.

Quy định kiến trúc, cấu trúc FE, style và quyền nằm trong [DOC/docs-FE/rules](../rules/readme.md). File screen-generation.md chứa quy trình thực thi đầy đủ và đọc các quy định này; không cần prompt trung gian.

## Prompt khung cho từng màn hình

**Cách dùng ưu tiên, chỉ cần tên màn hình:** đọc [screen-generation.md](screen-generation.md), rồi yêu cầu ví dụ: “Đọc Anime-Web/DOC/docs-FE/prompts/screen-generation.md và tạo màn hình Trang chủ”. File tự quy định route, dữ liệu, quyền, thiết kế mặc định và nền FE khi chưa có ứng dụng; không phải điền template. Việc yêu cầu thực thi file này cho phép thiết lập nền React + TypeScript + Vite nếu cần, chỉ chạy cục bộ.

Dùng [screen-prompt-template.md](screen-prompt-template.md) nếu muốn điền đặc tả chi tiết hoặc có thiết kế riêng. Đây là lựa chọn nâng cao, không bắt buộc khi dùng screen-generation.md.

## Generate trang quản trị

Alias Comment/Comments/Bình luận đã có [màn kiểm duyệt](../admin-comments-screen.md) tại `/admin/comments`: đọc danh sách/nội dung, ẩn hoặc hiện lại có lý do theo quyền; không áp dụng CRUD nội dung bình luận.

Dùng [admin-screen-generation.md](admin-screen-generation.md), hoặc tiếp tục gọi screen-generation.md với tên Dashboard quản trị, Quản lý phim, Thêm/Sửa phim, Quản lý tập phim, Quản lý thể loại, Quản lý bình luận hay Quản lý người dùng. Cả hai áp dụng [admin-screens.md](../rules/admin-screens.md) và chỉ tạo màn hình được gọi.

Ví dụ: “Đọc Anime-Web/DOC/docs-FE/prompts/admin-screen-generation.md và tạo màn hình Quản lý phim”. Layout sidebar/header riêng, route dưới /admin, common controls và Tailwind hiện có; chưa có API phù hợp thì dùng repository/phiên mock riêng, không nâng quyền member. [Dashboard](../admin-dashboard-screen.md) và [CRUD anime](../admin-anime-screen.md) đã có FE mock. Lần generate màn quản lý tài nguyên tiếp theo mặc định có CRUD trong chính module được gọi theo admin-screens.md, trừ khi người dùng giới hạn phạm vi; không tạo thêm module khác hoặc thao tác tài khoản/quyền chưa có đặc tả.

## Đặc tả chi tiết

Mỗi lượt điền tên màn hình, route, UI tham chiếu, hành vi và quyền truy cập. Prompt sẽ yêu cầu tích hợp vào FE hiện có, tái sử dụng common/ui, mock qua repository và chạy cục bộ. Nếu chưa có nền FE, cần chọn rõ có cho phép thiết lập React + TypeScript + Vite hay không.

Các prompt theo giai đoạn bên dưới dành cho công việc tổng thể; không chạy đồng thời với mọi màn hình nếu không có yêu cầu riêng.

## 1. Rà soát thiết kế trước khi code

```text
Đọc AGENTS.md áp dụng cho SRC và Anime-Web, rồi đọc DOC/readme.md,
decisions.md và các tài liệu liên quan. Chỉ rà soát tài liệu, chưa viết code.
Chỉ ra điểm chưa thống nhất giữa wireframe, entity và API.
Đề xuất lựa chọn đơn giản cho bản đầu và liệt kê câu hỏi cần tôi quyết định.
Không tự xem đề xuất trong tài liệu là lựa chọn đã được duyệt.
```

## 2. Thiết lập FE sau khi chốt công nghệ

```text
Triển khai nền FE trong Anime-Web/FE theo các quyết định đã xác nhận trong DOC.
Giữ source BE trong BE và tài liệu trong DOC. Tuân thủ pnpm@11.10.0,
workspace và lockfile chung tại SRC; cập nhật nhận diện package lồng nhau nếu cần.
Làm layout, routing và trang cơ bản trước, chưa tích hợp API thật.
Chỉ làm cục bộ, chưa tạo hoặc xuất bản Site.
Không đọc .env hay credentials. Không gọi API/model thật khi kiểm tra.
Ghi đúng lệnh và kết quả thực tế vào DOC/docs-FE/verification.md, chỉ bổ sung lịch sử.
```

## 3. Hoàn thiện luồng FE bằng mock

```text
Đọc DOC/roadmap.md, DOC/docs-FE/rules/architecture.md, DOC/entities.md
và DOC/docs-FE/design/wireframes.md. Áp dụng đầy đủ DOC/docs-FE/rules/readme.md.
Hoàn thiện năm trang với dữ liệu giả qua repository interface.
Tìm kiếm/lọc dùng URL; yêu thích và tiến độ dùng localStorage có version.
Áp dụng DOC/docs-FE/rules/roles-permissions.md: mock guest/member; guest xem phim và tìm kiếm
qua common, thư viện và gửi bình luận chỉ mở sau đăng nhập mock.
Tách dữ liệu cá nhân theo tài khoản, xóa cache cá nhân khi đổi phiên.
Player dùng video demo được phép sử dụng và hiển thị nhãn demo rõ ràng.
Không giả vờ có nguồn anime thật. Kiểm tra loading, empty, error,
chuyển tập, tải lại và responsive. Không thêm chức năng ngoài bản đầu.
Chỉ làm cục bộ; cập nhật tài liệu và bằng chứng kiểm chứng thực tế.
```

## 4. Chốt API trước khi triển khai BE

```text
Chỉ cập nhật tài liệu API và entity, chưa viết backend.
Rà soát DOC/api-contract.md với các luồng FE đã có.
Chốt DTO, pagination, validation, xác thực, lỗi, playback và đồng bộ tiến độ.
Áp dụng nhóm /common công khai và /me cá nhân, role/permission, ownership,
quyền bình luận theo DOC/docs-FE/rules/roles-permissions.md; không tự mở quyền quản trị.
Đánh dấu phần cần quyết định, nêu thay đổi có ảnh hưởng FE.
Không gọi API hoặc đọc thông tin bí mật.
```

## 5. Kết nối BE sau khi có hợp đồng được duyệt

```text
Kết nối FE với BE theo API contract đã duyệt bằng API adapter và mapper.
Giữ mock adapter để phát triển và kiểm thử độc lập.
Không gọi API/model thật trong kiểm tra; dùng server cục bộ và fixture.
Kiểm tra xác thực, quyền truy cập dữ liệu cá nhân, lỗi mạng và nguồn phát trống.
Không lưu URL phát tạm thời như định danh tập. Không tự đổi quyền truy cập
hoặc xuất bản dịch vụ. Cập nhật DOC và thêm kết quả vào verification.md.
```
