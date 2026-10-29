# Quyết định và câu hỏi còn mở

## Đã thống nhất theo trao đổi

| Nội dung | Trạng thái |
| --- | --- |
| Mục tiêu là web xem anime hoạt động thực tế | Đã xác nhận |
| Chưa có nguồn phim/API | Đã xác nhận |
| Làm giao diện trước, nối BE sau | Đã xác nhận |
| Source chung trong Anime-Web, tách FE/BE/DOC | Đã tạo thư mục |
| Thảo luận và đọc tài liệu trước khi code màn hình | Đang áp dụng; đã cho phép thiết lập thư viện FE |
| Dùng pnpm và lockfile chung tại SRC | Theo AGENTS.md |
| Dùng React Router, quản lý tập trung tại FE/src/routes và có rule cho lần generate sau | Xác nhận 2026-10-28; DOC/rules/routes.md |
| Khách tìm kiếm, xem phim qua API /common | Xác nhận 2026-10-24 |
| Thư viện và đăng bình luận yêu cầu đăng nhập | Xác nhận 2026-10-24 |
| API phải có thiết kế role và permission | Xác nhận 2026-10-24; mô hình chi tiết còn là đề xuất |
| Cài Tailwind và Bootstrap 5 bằng pnpm | Yêu cầu 2026-10-24; đã tích hợp trên nền React + TypeScript + Vite |
| Ưu tiên class; style riêng chỉ khi cần; có style common | Yêu cầu 2026-10-24; quy ước chi tiết tại rules/styling.md |
| Tập trung quy định generate màn hình trong DOC/rules | Yêu cầu 2026-10-24; prompt thực thi giữ trong DOC/prompts |

## Đề xuất đang chờ duyệt

| Vấn đề | Đề xuất ban đầu | Ảnh hưởng |
| --- | --- | --- |
| Mùa/phần | Một anime chứa nhiều mùa | URL, entity và danh sách tập |
| Phim điện ảnh | Một mùa, một tập | Cách tái sử dụng trình phát |
| Giao diện | Nền tối; màu nhấn chờ chọn | Tokens, thiết kế màn hình |
| Thời điểm có đăng nhập thật | FE mô phỏng guest/member trước; BE xác thực thật sau | Thư viện và gửi bình luận chỉ mở cho trạng thái member |
| Phân quyền chi tiết | RBAC với UserRole/RolePermission, quyền own kiểm tra ownership | Chi tiết role moderator/admin và cách xác thực chưa chốt |
| Bình luận | Guest đọc; member tạo và sửa/xóa của mình | Đọc công khai, sửa/xóa và chính sách duyệt là đề xuất |
| Trang quản trị | Bổ sung khi triển khai BE | Phạm vi và thời gian |
| Backend/database | Chưa chọn | Hạ tầng, triển khai, xác thực |
| Thương hiệu | Chưa chọn tên/logo chính thức | Không mặc định dùng tên Kaze từ bản nháp cũ |
| Phát hành | Chưa chọn hosting và audience | Chỉ bàn sau khi có bản chạy và yêu cầu triển khai |

## Cách cập nhật

Khi có lựa chọn được xác nhận, ghi ngày, quyết định, lý do và tài liệu chịu ảnh hưởng. Không ghi một gợi ý của trợ lý thành quyết định của người dùng.

Các tài liệu hiện tại là bản đề xuất tổng thể, chưa phải ước lượng chi phí hoặc cam kết thời hạn.
