# Prompt khung triển khai từng màn hình FE

Phiên bản 1.0 — 2026-10-24.

Mục đích: dùng cùng một bộ quy tắc để sinh code từng màn hình, ghép vào FE hiện có và chuẩn bị thay mock bằng BE API. Tài liệu này không tự kích hoạt viết code; chỉ thực hiện khi người dùng yêu cầu chạy prompt cho một màn hình cụ thể.

## 1. Cách sử dụng

1. Chuẩn bị thiết kế UI: ảnh đính kèm, file trong workspace hoặc mô tả bố cục. Nếu chỉ có wireframe trong DOC, có thể dùng wireframe đó.
2. Copy khối yêu cầu ở mục 2, điền ít nhất tên màn hình, route, UI tham chiếu và các hành vi chính.
3. Gửi khối đã điền cùng yêu cầu: **“Đọc và thực thi Anime-Web/DOC/docs-FE/prompts/screen-prompt-template.md cho màn hình dưới đây.”**
4. Mỗi lượt ưu tiên một màn hình. Màn hình sau tái sử dụng layout, tokens, component và dữ liệu từ màn hình trước.

Mục 3 dẫn đến quy tắc dùng chung trong DOC/docs-FE/rules. Ví dụ ở mục 4 chỉ minh họa cách điền, không phải yêu cầu triển khai ngay.

## 2. Khối yêu cầu cho mỗi màn hình

```text
Đọc và thực thi Anime-Web/DOC/docs-FE/prompts/screen-prompt-template.md.
Hãy viết code vào workspace cho đúng màn hình sau:

TÊN MÀN HÌNH: <ví dụ: Khám phá anime>
ROUTE: <ví dụ: /anime>
PAGE COMPONENT: <ví dụ: ExplorePage>
MỤC TIÊU: <người dùng cần làm được gì trên màn hình này>

UI THAM CHIẾU:
<Ảnh đính kèm, đường dẫn file, hoặc mục trong DOC/docs-FE/design/wireframes.md.
Nếu dùng ảnh, nêu ảnh nào và vùng cần triển khai.>

CÁC KHỐI NỘI DUNG:
- <khối 1>
- <khối 2>

HÀNH VI VÀ ĐIỀU HƯỚNG:
- <thao tác → kết quả → route đích nếu có>
- <quy tắc tìm kiếm/lọc/chọn tập/lưu dữ liệu nếu áp dụng>

QUYỀN TRUY CẬP:
- Xem trang: <guest + member / chỉ member>
- Thao tác cá nhân: <hành động → permission; không có thì ghi “không có”>
- Guest bấm thao tác yêu cầu đăng nhập: <hành vi mong muốn>

DỮ LIỆU:
- Chế độ: mock
- Entity sử dụng: <Anime, Episode, Comment...>
- API contract liên quan: <các endpoint dự kiến, không gọi thật>
- Lưu cục bộ: <dữ liệu nào cần lưu; không có thì ghi “không có”>

TRẠNG THÁI ĐẶC BIỆT:
<loading, empty, error, không có quyền, không có nguồn phát...>

YÊU CẦU RESPONSIVE / KHÁC BIỆT SO VỚI UI:
<nếu bỏ trống, áp dụng mặc định trong DOC/docs-FE/prompts/screen-generation.md>

CÔNG NGHỆ / KHỞI TẠO:
<mặc định dùng stack và thư viện có sẵn.
Nếu FE chưa có ứng dụng: chọn “Cho phép thiết lập React + TypeScript + Vite”
hoặc “Chỉ triển khai trên nền đã có, chưa cho phép thiết lập nền mới”.>

ĐIỀU KIỆN NGHIỆM THU RIÊNG:
- <kết quả có thể quan sát và kiểm tra được>

PHẠM VI: chỉ màn hình này và thành phần dùng chung cần thiết.
CHẠY CỤC BỘ: không tạo Site, không deploy, không publish.
```

Không cần điền mục không liên quan. Không suy đoán rằng placeholder `<...>` là dữ liệu thật. Nếu thiếu phần bắt buộc hoặc thiết kế không truy cập được, hỏi đúng thông tin còn thiếu; tiếp tục phần độc lập có thể làm. Nếu chỉ thiếu chi tiết nhỏ, dùng mặc định đang có và ghi rõ giả định.

## 3. Quy định chung khi thực thi

Đọc [mục lục rules](../rules/readme.md) và áp dụng toàn bộ các tài liệu sau, không cần sao chép quy tắc vào từng prompt màn hình:

- [screen-generation.md](screen-generation.md): quy trình, mặc định, phạm vi, kiểm chứng và bàn giao.
- [architecture.md](../rules/architecture.md): kiến trúc và luồng dữ liệu.
- [fe-structure.md](../rules/fe-structure.md): tổ chức source và component dùng chung.
- [styling.md](../rules/styling.md): Tailwind, Bootstrap, CSS common và style riêng khi cần.
- [roles-permissions.md](../rules/roles-permissions.md): guest/member, permission và ownership.

Khối yêu cầu đã điền bổ sung chi tiết cho màn hình; giữ các quy tắc chung cho phần không được chỉ định. Yêu cầu người dùng hiện tại được ưu tiên. Không coi việc đọc template hoặc ví dụ là lệnh triển khai ngay.

## 4. Ví dụ điền cho màn hình Khám phá

```text
Đọc và thực thi Anime-Web/DOC/docs-FE/prompts/screen-prompt-template.md.

TÊN MÀN HÌNH: Khám phá anime
ROUTE: /anime
PAGE COMPONENT: ExplorePage
MỤC TIÊU: Tìm và lọc anime, mở trang chi tiết của kết quả.
UI THAM CHIẾU: Mục Khám phá trong DOC/docs-FE/design/wireframes.md.
CÁC KHỐI NỘI DUNG: Header dùng chung, tìm kiếm, bộ lọc, số kết quả,
grid poster, phân trang, Footer dùng chung.
HÀNH VI: Lọc theo thể loại/năm/trạng thái/định dạng; sắp xếp newest/title;
giữ query trong URL; đổi bộ lọc về trang 1; có nút xóa lọc.
QUYỀN: Guest và member xem được; không có thao tác cá nhân trên trang này.
DỮ LIỆU: Mock qua AnimeRepository; tham chiếu GET /api/v1/common/anime
và GET /api/v1/common/genres. Không gọi API thật.
TRẠNG THÁI: Loading, không có kết quả, lỗi/thử lại, ảnh lỗi.
RESPONSIVE: Theo mặc định prompt khung.
CÔNG NGHỆ / KHỞI TẠO: Cho phép thiết lập React + TypeScript + Vite
nếu FE chưa có nền; nếu đã có thì giữ stack và component hiện tại.
NGHIỆM THU: Reload giữ bộ lọc; xóa lọc trả danh sách ban đầu;
phân trang không lặp item; không tràn ngang trên mobile;
route chi tiết chưa làm phải có thông báo rõ, không dẫn đến link hỏng.
PHẠM VI: Chỉ Khám phá và nền/component cần thiết.
CHẠY CỤC BỘ: Không tạo Site, không deploy, không publish.
```

Khi có UI từ ảnh, thay dòng UI THAM CHIẾU bằng ảnh đó và nêu các khác biệt mong muốn. Không chạy ví dụ này trừ khi người dùng chọn triển khai nó.
