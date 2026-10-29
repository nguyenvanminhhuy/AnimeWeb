# Kiến trúc backend đề xuất

Công nghệ BE/database chưa chọn. Cấu trúc dưới đây mô tả trách nhiệm, không yêu cầu tạo sẵn thư mục rỗng hoặc cài framework. FE tiếp tục theo [kiến trúc frontend](../docs-FE/rules/architecture.md).

```text
BE/
├── src/
│   ├── modules/
│   │   ├── anime/           # Anime, genre, lọc và tìm kiếm
│   │   ├── episode/         # Season, episode, thứ tự phát
│   │   ├── playback/        # Adapter nguồn video/phụ đề
│   │   ├── auth/            # Xác thực, vòng đời phiên
│   │   ├── authorization/   # Permission và policy ownership
│   │   ├── library/         # Theo dõi, yêu thích
│   │   ├── progress/        # Tiến độ theo user/episode
│   │   └── comments/        # Bình luận và trạng thái hiển thị
│   ├── shared/              # Validation, lỗi, request ID
│   └── config/              # Kiểm tra cấu hình khởi động
├── database/                # Schema, migration, seed demo
└── tests/                   # Unit, integration, contract
```

## Luồng xử lý

```text
Route → Validation → Xác thực/quyền khi cần → Service/policy
      → Repository/database hoặc provider adapter → DTO response
```

Controller xử lý HTTP; service giữ nghiệp vụ; repository xử lý lưu trữ. Kiểm tra ownership phải gắn với truy vấn/thao tác ghi để tránh ghi nhầm giữa tài khoản. DTO chỉ trả dữ liệu được phép; không serialize nguyên bản ghi database.

Common không bắt buộc phiên, chỉ trả tài nguyên công khai. Me lấy userId từ phiên server, kiểm tra tài khoản hoạt động, permission và ownership. Prefix URL không thay thế kiểm tra quyền.

## Playback và vận hành

API trả thông tin phát; video có thể được phân phối trực tiếp qua storage/CDN. Tách provider adapter để dùng fake trong kiểm thử. Không mặc định proxy toàn bộ video qua BE hoặc lưu URL tạm vào danh mục/lịch sử.

Kiểm tra cấu hình bắt buộc khi khởi động; chỉ ghi tên biến thiếu, không ghi giá trị bí mật. Log request ID, thời gian xử lý và lỗi đã lọc thông tin nhạy cảm; response không chứa stack trace. Health/readiness, CORS, timeout và giới hạn request cần đặc tả khi chọn stack, chưa phải chức năng hiện có.
