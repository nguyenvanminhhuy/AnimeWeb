# Đặc tả thiết lập nền backend

Trạng thái: framework/runtime, database/ORM và cơ chế phiên chưa chọn. Tài liệu này xác định đầu vào và đầu ra cho bước setup; không tự chọn công nghệ hoặc cam kết tương thích phiên bản.

## Đầu vào cần xác định

| Lựa chọn | Thông tin cần có | Khi nào cần |
| --- | --- | --- |
| Runtime/ngôn ngữ/framework | Stack và phiên bản tương thích | Trước khi cài nền BE |
| Database và truy cập dữ liệu | Database, ORM/query builder, migration tool | Trước schema/repository lưu trữ |
| Xác thực | Cookie/token, vòng đời phiên, thu hồi; mật khẩu hoặc nhà cung cấp | Trước module auth/me |
| Công cụ kiểm tra | Formatter, test runner, integration database | Cùng bước setup |
| Môi trường local | Port, origin FE, cách chạy database test | Trước chạy tích hợp |

Nếu code đã tồn tại, kiểm tra manifest/config công khai và convention của repo trước khi hỏi. Nếu người dùng đã cho phép tự chọn stack, ghi phương án thực tế cùng lý do, cập nhật tài liệu và triển khai; không yêu cầu xác nhận lại quyền đã có. Nếu chưa có lựa chọn/ủy quyền, hỏi gọn phần công nghệ thực sự cần cho bước kế tiếp, tiếp tục chuẩn bị contract/fixture độc lập.

## Đầu ra của bước setup

1. Ứng dụng BE khởi động cục bộ, có cấu hình được validate và xử lý lỗi thống nhất; chỉ tạo module dùng thực tế.
2. Với Node: package dự kiến tên `anime-web-be`, `packageManager: pnpm@11.10.0`; thêm chính xác `Anime-Web/BE` vào workspace SRC nếu chưa được nhận. Đây là tên đề xuất, ưu tiên tên đã có trong repo.
3. Script dev/build/typecheck/format/format:check/test phù hợp stack, tài liệu ghi đúng lệnh đã cài. Không tạo script rỗng luôn báo thành công.
4. Schema/migration khởi đầu và seed demo theo phạm vi triển khai; database test tách khỏi dữ liệu dùng thật.
5. Fake provider và fixture tối thiểu để kiểm tra không gọi dịch vụ ngoài. Có ít nhất hai tài khoản giả lập khi kiểm tra ownership.
6. File hướng dẫn chạy với placeholder cấu hình, các điều kiện tiên quyết và cách kiểm tra smoke. Nếu thêm health endpoint, đặc tả path/DTO trong tài liệu API trước khi dùng.

Với công nghệ ngoài Node, dùng build/test tool của stack đó; không ép BE thành package JavaScript. pnpm vẫn quản lý công cụ JavaScript trong SRC.

## Điều kiện bàn giao

Khởi động và smoke test local chạy được; cấu hình thiếu trả thông báo rõ không lộ giá trị bí mật; lệnh format/build/test áp dụng chạy đạt. Ghi kết quả thật vào verification BE, kèm giới hạn. Chưa triển khai hosting hoặc kết nối nguồn phim thật trong bước này.
