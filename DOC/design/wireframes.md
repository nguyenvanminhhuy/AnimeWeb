# Khung giao diện đề xuất

Wireframe thể hiện vị trí và chức năng, chưa chốt màu, ảnh, tên thương hiệu hoặc thiết kế chi tiết. Lịch phát sóng chưa nằm trong bản đầu. Theo cập nhật 2026-10-24, header sẽ có đăng nhập/trạng thái tài khoản; trước khi có BE dùng phiên mock có nhãn rõ.

## Điều hướng và luồng chính

```text
Trang chủ → Khám phá → Chi tiết anime → Trang xem
    ↑                      ↓               ↓
    └──────────── Thư viện / Tiếp tục xem ──┘
```

| Trang | Route dự kiến |
| --- | --- |
| Trang chủ | / |
| Khám phá | /anime?q=...&genre=...&page=1 |
| Chi tiết | /anime/:slug |
| Xem tập | /watch/:episodeId |
| Thư viện | /library?tab=favorites |
| Không tìm thấy | Các đường dẫn không hợp lệ |

## Trang chủ

```text
┌───────────────────────────────────────────────┐
│ Logo   Khám phá   Thư viện         Tìm kiếm   │
├───────────────────────────────────────────────┤
│ Anime nổi bật                   Ảnh banner   │
│ Giới thiệu ngắn                              │
│ [Xem chi tiết] [Yêu thích]                    │
├───────────────────────────────────────────────┤
│ Tiếp tục xem: thẻ tập + tiến độ               │
├───────────────────────────────────────────────┤
│ Mới cập nhật                     [Xem thêm]   │
│ [Poster] [Poster] [Poster] [Poster]           │
├───────────────────────────────────────────────┤
│ Thể loại / Đề xuất biên tập                   │
└───────────────────────────────────────────────┘
```

Ẩn mục tiếp tục xem khi chưa có lịch sử. Dữ liệu demo cần nhãn nhận biết; không dùng số lượt xem giả để thể hiện hoạt động thật.

Guest xem phim và tìm kiếm bình thường; nút yêu thích/thư viện yêu cầu đăng nhập. Tiếp tục xem lấy tiến độ cá nhân khi có phiên thành viên.

## Khám phá

```text
┌───────────────────────────────────────────────┐
│ [Tìm anime...............................]   │
│ [Thể loại] [Năm] [Trạng thái] [Định dạng]     │
│ Bộ lọc đang chọn   [Xóa lọc]      [Sắp xếp]   │
├───────────────────────────────────────────────┤
│ Số kết quả                                    │
│ [Anime] [Anime] [Anime] [Anime]               │
│ [Anime] [Anime] [Anime] [Anime]               │
│                  [Trang trước / sau]         │
└───────────────────────────────────────────────┘
```

Thay bộ lọc đưa về trang 1; tải lại hoặc chia sẻ URL vẫn giữ truy vấn. Không có kết quả thì hướng dẫn sửa từ khóa hoặc bỏ lọc.

## Chi tiết anime

```text
┌───────────────────────────────────────────────┐
│ Banner                                        │
├────────────┬──────────────────────────────────┤
│ Poster     │ Tên phim / tên khác              │
│            │ Năm · trạng thái · thể loại      │
│            │ Giới thiệu                       │
│            │ [Xem / Xem tiếp] [Yêu thích]     │
├────────────┴──────────────────────────────────┤
│ [Chọn mùa/phần]                              │
│ [Tập 01] [Tập 02] [Tập 03] ...               │
├───────────────────────────────────────────────┤
│ Anime cùng thể loại                          │
└───────────────────────────────────────────────┘
```

Xem ngay chọn tập khả dụng đầu tiên; xem tiếp dẫn đến tập có tiến độ gần nhất. Nếu chưa có tập phát được, hiển thị thông báo thay vì nút dẫn vào trình phát trống.

Bổ sung khối bình luận dưới thông tin phim: danh sách visible (đọc công khai là đề xuất), form gửi cho thành viên, lời mời đăng nhập cho khách. Nút sửa/xóa của chính mình hiển thị theo permission và ownership; BE kiểm tra lại. Tương tác kiểm duyệt chưa nằm trong màn hình này.

## Trang xem

```text
┌────────────────────────────────┬──────────────┐
│                                │ Chọn mùa     │
│          VIDEO PLAYER          │ Danh sách tập│
│                                │ ▶ Tập hiện tại│
├────────────────────────────────┤              │
│ [Trước] [Sau] [Tự chuyển]      │              │
│ [Chế độ rạp] [Nguồn] [Phụ đề] │              │
├────────────────────────────────┴──────────────┤
│ Tên phim · tên tập · Nhãn video demo          │
│ Trạng thái lỗi và [Thử lại] nếu cần           │
└───────────────────────────────────────────────┘
```

Chọn tập cập nhật URL và đặt lại trạng thái trình phát. Tự chuyển chỉ hoạt động khi đã bật và có tập tiếp theo. Lưu tiến độ theo episodeId; tải lại không áp dụng tiến độ của tập khác. Khi tiếp tục xem có thể cần người dùng bấm phát do chính sách trình duyệt.

## Thư viện

```text
┌───────────────────────────────────────────────┐
│ [Yêu thích] [Đang xem] [Lịch sử]              │
├───────────────────────────────────────────────┤
│ Poster · tên phim · tập · tiến độ             │
│ [Xem tiếp] [Bỏ yêu thích khi phù hợp]         │
└───────────────────────────────────────────────┘
```

Trang thư viện yêu cầu đăng nhập; guest thấy lời mời đăng nhập và không thấy dữ liệu cá nhân. Giai đoạn mock dữ liệu chỉ thuộc tài khoản giả lập trên trình duyệt hiện tại. Bỏ yêu thích không tự xóa lịch sử. Tab lịch sử lấy từ progress; không phải một danh sách yêu thích khác.

## Đăng nhập và đăng ký demo

Đã triển khai `/login` và `/register`; xem [auth-screens.md](../auth-screens.md). Desktop có minh họa cục bộ bên cạnh form; mobile ưu tiên form. Login có email/mật khẩu demo và hai nút tài khoản mẫu; Register có tên/email/mật khẩu/xác nhận. Cả hai có validation, pending/error/success, chuyển qua lại giữ returnTo và đường về Trang chủ. Không có backend auth; mật khẩu chỉ kiểm tra form, không lưu hoặc xác thực.

## Responsive và khả năng sử dụng chung

- Điện thoại: poster xếp khoảng hai cột tùy chiều rộng; bộ lọc thu gọn; danh sách tập nằm dưới player.
- Máy tính: grid mở rộng; danh sách tập có thể đặt cạnh player.
- Điều khiển dùng được bằng bàn phím; có focus rõ, label cho input, văn bản thay thế cho ảnh.
- Dùng controls video có sẵn trước; chỉ thay bằng player tùy biến khi có nhu cầu rõ.
- Mỗi trang có loading, empty, error; xử lý ảnh hỏng bằng ảnh dự phòng.
