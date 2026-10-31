# AdminLayout dùng chung

Source: `FE/src/components/layouts/admin-layout.tsx`. Layout trình bày cho nhánh quản trị; không tự cấp quyền, chọn feature hoặc tạo router. App route thực hiện guard rồi truyền Outlet qua children.

| Prop | Ý nghĩa |
| --- | --- |
| `children` | Nội dung màn hình, thường là Outlet |
| `displayName` | Tên hiển thị của phiên hiện tại |
| `pageLabel` | Nhãn breadcrumb trang hiện tại |
| `previewWritable` | Boolean, mặc định false; mô tả phiên có thể chỉnh sửa mẫu hay chỉ đọc, không tự cấp quyền |
| `menu` | Danh sách `{label, to, icon, end?}` đã được app lọc theo route/quyền; icon là IconName nội bộ |
| `onLogout` | Callback đăng xuất và điều hướng do app cung cấp |

Desktop có sidebar sticky và header. Dưới breakpoint max-tablet 1000px, menu là disclosure không modal: Button dùng aria-expanded/aria-controls, mở focus link đầu, Escape/nhấn link đóng và trả focus về nút mở. Không có backdrop hoặc focus trap; nếu sau này đổi thành modal drawer thì phải quản lý focus theo quy tắc dialog.

Header có breadcrumb và [menu avatar](account-menu.md) chứa đăng xuất; có skip link đến main. Link về giao diện xem phim dùng config/paths.ts. Không import app/feature vào layout, không gọi repository/storage; giữ Tailwind, font 14px và common Button/Icon. App ghép bảy mục theo quyền: Dashboard, Anime, Mùa và tập, Thể loại, Nguồn và phụ đề, Người dùng, Bình luận. previewWritable mô tả quyền ghi hoặc kiểm duyệt, không cấp quyền thay đổi User. Xem [Dashboard](../../admin-dashboard-screen.md), [Anime](../../admin-anime-screen.md), [Mùa và tập](../../admin-episodes-screen.md), [Nguồn và phụ đề](../../admin-playback-screen.md), [Thể loại](../../admin-genres-screen.md), [Người dùng](../../admin-users-screen.md) và [Bình luận](../../admin-comments-screen.md).

Nội dung “Phiên quản trị mẫu” phản ánh giai đoạn dev chưa có auth BE; app truyền previewWritable theo permission ghi để mô tả đúng phiên chỉ đọc/chỉnh sửa. Khi tích hợp phiên thật, cập nhật mô tả từ app. Không đưa menu đến route chưa triển khai hoặc coi ẩn menu là guard truy cập.
