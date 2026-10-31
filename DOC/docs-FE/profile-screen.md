# Trang cá nhân / Profile

Route `/profile`, source `FE/src/app/routes/profile.tsx`, dưới MainLayout và router hiện có. Mở bằng avatar Header → Trang cá nhân, hoặc mở trực tiếp rồi đăng nhập giữ returnTo. Màn hình được hoàn thiện theo screen-generation ngày 2026-10-30: thông tin hồ sơ chỉ đọc, chưa có chỉnh sửa tên/email, đổi mật khẩu hoặc upload avatar.

Hero có avatar lớn, tên/email và nút Thư viện/Lịch sử xem. Bốn chỉ số từ phiên hiện tại: số phim yêu thích, tập đang xem, tập hoàn thành, tổng tập có lịch sử. Mỗi chỉ số là link đến tab thư viện phù hợp. Khối Thông tin tài khoản hiển thị tên, email và loại thành viên. Đây là số liệu cục bộ/mẫu, không phải lịch sử vận hành đã được xác thực.

Hiển thị tối đa bốn phim yêu thích bằng AnimeCard dùng chung, link Tất cả yêu thích mở Library tab favorites. Phần Tiếp tục xem tái sử dụng feature anime ở cấp app, chỉ có tập chưa hoàn thành và dùng đúng episodeId đã lưu. Mở/chuyển tập chưa có video không ghi thêm tiến độ giả. Dữ liệu metadata được lấy qua useProfileLibrary → animeRepository.getByIds; trang không gọi fetch/storage trực tiếp.

Guest hoặc phiên quản trị mẫu không có user member thấy lời mời đăng nhập giữ returnTo=/profile. Nội dung thư viện kiểm tra library:read:own/progress:read:own, keyed theo user/IDs/mock/attempt; không render kết quả cũ khi đổi phiên, bỏ qua response sau unmount. Đăng xuất xóa ngay tên/email và dữ liệu cá nhân khỏi màn hình. Email được SessionProvider lấy từ đúng profile hiện tại, không từ tham số URL.

Có loading, lỗi/thử lại, dữ liệu trống và thiếu quyền cho phần thư viện; identity vẫn hiển thị khi metadata lỗi. Trong dev dùng query mock=loading/error/empty/forbidden để kiểm tra; production bỏ qua các mock flag. Retry xóa flag qua React Router. Chưa có chỉnh sửa nên không tạo form hoặc nút Lưu giả.

Toàn bộ layout bằng Tailwind, font 14px, responsive 375/768/1440px, không thêm dependency/CSS riêng hoặc ảnh ngoài. Hero dùng SVG cục bộ; Avatar chữ viết tắt dùng chung size lg với size md trong menu. Tham khảo [Avatar](rules/common/avatar.md).

Source feature tại `features/profile/components/profile-overview.tsx` và `hooks/use-profile-library.ts`. App route ghép ProfileOverview/ProfileInfo, shared AnimeCard và feature ContinueWatching; không có import chéo feature. Library URL được tạo bằng libraryHref tại app, truyền đường dẫn qua props cho khối hồ sơ.

Header dùng avatar chữ viết tắt và [AccountMenu](rules/common/account-menu.md) sau đăng nhập. Member có Trang cá nhân, [Đổi mật khẩu](change-password-screen.md) và Thư viện; phiên quản trị mẫu chỉ có Dashboard và Đổi tài khoản. ProfileInfo nhận changePasswordTo từ app và thêm nút mở form đổi mật khẩu mô phỏng; metadata hồ sơ vẫn chỉ đọc. Để vào admin từ đầu: mở `/admin` → Đăng nhập → Dùng phiên quản trị mẫu → Tiếp tục về trang đã yêu cầu. Nút activation chỉ có trong dev; không tự cấp quyền cho member.

Kiểm chứng tại tests/profile.browser.mjs (verifyProfile) và tests/account-menu.browser.mjs: guard/returnTo, email/4 thống kê, giới hạn favorites và loại tập hoàn thành khỏi ContinueWatching, responsive, library/watch/Back, không ghi dữ liệu giả, mock states/retry, logout/member isolation và reload. Có thể gọi verifyProfile(browser, previewURL, {mockStates:false}) khi kiểm tra production; không dùng dev mock flag ở bản build.
