# Lộ trình phát triển

Trạng thái: đề xuất để duyệt. Chưa ấn định thời gian vì phạm vi và công nghệ chưa chốt.

Cập nhật 2026-10-24: đã thiết lập nền React + TypeScript + Vite và cài Tailwind/Bootstrap 5 bằng pnpm. Giai đoạn nền FE mới hoàn thành phần build và style; chưa có router, layout nghiệp vụ hoặc các màn hình anime.

## Phạm vi bản đầu

- Năm trang: trang chủ, khám phá, chi tiết anime, xem phim, thư viện.
- Tiếng Việt; sử dụng được trên điện thoại và máy tính.
- Khoảng 12–20 anime mẫu, đủ nhiều thể loại và trạng thái để thử bộ lọc.
- Tìm kiếm, lọc, phân trang, chọn mùa/tập, yêu thích, lịch sử và xem tiếp.
- Video demo được ghi nhãn rõ; không thể hiện anime mẫu là đã có nguồn phát thật.
- Khách tìm kiếm/xem phim qua common; thư viện và gửi bình luận yêu cầu đăng nhập theo cập nhật 2026-10-24.
- Trước khi có BE, FE dùng phiên mock guest/member; thư viện và tiến độ demo lưu theo tài khoản mock trên trình duyệt, chưa đồng bộ giữa thiết bị.
- Bổ sung danh sách và form bình luận anime; chưa mở reply lồng nhau hoặc reaction.

Chưa đưa vào bản đầu: thanh toán, mạng xã hội, đề xuất bằng AI, ứng dụng điện thoại riêng và quản trị nội dung hoàn chỉnh. Đăng nhập thật triển khai khi có BE; phiên mock không phải xác thực thật.

## Các giai đoạn

| Giai đoạn | Công việc | Điều kiện hoàn thành |
| --- | --- | --- |
| 0. Chốt yêu cầu | Duyệt tài liệu, phong cách, mô hình mùa/phần | Ghi nhận quyết định trong decisions.md |
| 1. Dựng nền FE | Thiết lập source, điều hướng, layout, màu và typography | Có khung responsive; build được |
| 2. Duyệt giao diện | Trang chủ, chi tiết và trang xem trước; sau đó khám phá, thư viện | Người dùng duyệt được bố cục cả desktop và mobile |
| 3. Chạy với mock | Nối dữ liệu mẫu, tìm kiếm/lọc, chọn tập, localStorage | Đi hết luồng chính, tải lại vẫn giữ tiến độ và yêu thích |
| 4. Chốt hợp đồng BE | Duyệt API, lỗi, phân trang, đăng nhập và nguồn video | Có ví dụ request/response thống nhất giữa FE và BE |
| 5. Triển khai BE | Database, API danh mục, xác thực, thư viện, tiến độ | Kiểm thử bằng fixture hoặc dịch vụ giả lập; không gọi API thật khi kiểm tra |
| 6. Tích hợp và vận hành | Đổi adapter, cấu hình nguồn hợp lệ, triển khai theo môi trường | Kiểm tra luồng FE/BE cục bộ; xác định rõ khả năng phát video thực tế |

Cập nhật phạm vi: giai đoạn 3 có giả lập guest/member và bình luận; giai đoạn 4–5 có role/permission, ownership và API comments. Khách không được mở thư viện chỉ vì có dữ liệu localStorage. Kiểm tra các tình huống quyền trong [rules/roles-permissions.md](docs-FE/rules/roles-permissions.md) khi triển khai.

## Luồng dùng để nghiệm thu

```text
Trang chủ → Tìm anime → Chi tiết → Chọn mùa/tập
→ Phát demo → Lưu tiến độ → Tải lại → Xem tiếp
→ Yêu thích → Thư viện → Bỏ yêu thích
```

Mỗi trang cần trạng thái đang tải, trống, lỗi và thử lại. Trang xem cần trường hợp chưa có nguồn, lỗi video và hết tập; không tự chuyển sang một video không liên quan.

## Phụ thuộc cần giải quyết sau

Giao diện có thể hoàn thành độc lập. Để phát anime thật cần nguồn được phép sử dụng, định dạng phát được trình duyệt hỗ trợ, cấu hình truy cập video/phụ đề và hạ tầng phân phối phù hợp. Có backend không tự tạo ra kho phim.

Chỉ bắt đầu viết code sau khi người dùng yêu cầu triển khai; việc duyệt tài liệu không tự động cho phép xuất bản website.
