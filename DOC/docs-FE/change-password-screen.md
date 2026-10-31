# Đổi mật khẩu

Giao diện FE triển khai ngày 2026-10-31 theo screen-generation. Alias Change password/Đổi mật khẩu mở `/profile/change-password` dưới MainLayout. Vào từ menu avatar hoặc nút Đổi mật khẩu trong Thông tin tài khoản tại Profile.

## Phạm vi hiện tại

Auth hiện chỉ chọn/tạo hồ sơ mẫu, không lưu hoặc xác thực mật khẩu. Màn này hoàn thiện biểu mẫu và luồng mô phỏng, không thay đổi mật khẩu đăng nhập thật. Notice “Chế độ mô phỏng” luôn hiển thị; kết quả là “Biểu mẫu đã hợp lệ” cùng lời giải thích mật khẩu chưa được thay đổi. Không hiển thị thành công giả “Đã đổi mật khẩu”. Chỉ dùng dữ liệu giả khi thử.

Không triển khai BE, hash, reset password, OTP, quên mật khẩu hoặc chính sách phiên mới. Khi nối xác thực thật cần chốt contract xác minh mật khẩu hiện tại/reauthentication, thay credential và xử lý phiên theo [tài liệu BE](../docs-BE/auth-permissions.md); không coi validation FE là chính sách server đã duyệt.

## Truy cập và form

- Guest thấy lời mời đăng nhập, giữ pathname/query/hash nội bộ trong returnTo. Sau chọn hồ sơ mẫu cần bấm Tiếp tục về trang đã yêu cầu. Phiên adminPreview không có user member không được mở form. Header chỉ thêm link Đổi mật khẩu cho member.
- Hiển thị đúng tên/email của phiên hiện tại, email readOnly với autoComplete=username; không lấy danh tính từ query/form. Ba field: mật khẩu hiện tại, mới, nhập lại mới; có nút hiện/ẩn riêng, required, maxlength128, current-password/new-password autocomplete và label/aria lỗi.
- Mặc định FE: hiện tại và mới 8–128 ký tự, không chỉ whitespace; mới khác hiện tại; xác nhận khớp chính xác. Không trim/lowercase/normalize mật khẩu. Quy tắc này để kiểm tra giao diện theo auth mẫu, không xác minh mật khẩu hiện tại có đúng hay không.
- Submit sai focus lỗi đầu. Pending khóa field/submit trùng, có thông báo tiến trình. Huỷ vẫn dùng được để quay về Profile và abort yêu cầu đang chờ. Lỗi giữ giá trị để thử lại.
- Kết quả mô phỏng xoá cả ba field và hiện trạng thái preview-only. Thử lại biểu mẫu mở field trống/focus mật khẩu hiện tại. Unmount/đăng xuất/đổi user huỷ tác vụ, bỏ draft; không hiện kết quả phiên cũ.

## Dữ liệu và source

Mật khẩu chỉ ở state form để validation, không truyền vào repository, URL, HTTP request, log, localStorage hoặc sessionStorage. Không tạo password/hash hoặc thay registry hồ sơ, thư viện, bình luận. AuthRepository có `previewPasswordChange(id, state, signal)`, chỉ nhận ID hồ sơ mẫu và trả `{ status: 'preview-only' }`; adapter kiểm tra hồ sơ trước/sau delay, không nhận credential. Đây không phải endpoint hoặc phương án bảo mật server.

- `FE/src/app/routes/change-password.tsx`: member guard/returnTo, keyed theo user; lazy trong router chung. Pattern/builder tại config/paths.ts.
- `features/auth/components/change-password-screen.tsx`: bố cục, form và kết quả; tái sử dụng PasswordField cùng feature, common Input/Button/Avatar. `hooks/use-change-password.ts` quản lý draft, validation, pending/error/preview, abort.
- Kiểu và validation tại `features/auth/types/change-password.ts`, `utils/validate-change-password.ts`. Không import chéo feature; app/Profile truyền changePasswordTo cho ProfileInfo.
- Dùng Tailwind tw:, font tối thiểu 14px, không CSS/dependency mới. Form stack trên tablet/mobile, không thu nhỏ font. PasswordField dùng style auth đã đăng ký một lần ở styles/index.css.

## Chạy và kiểm chứng

Tại SRC: `pnpm --filter anime-web-fe run dev`, vào `/profile/change-password` và đăng nhập hồ sơ mẫu. Dev `mock=error` gây lỗi thao tác một lần rồi retry, `mock=loading` kéo dài pending 1,5 giây; production bỏ qua các flag, vẫn chỉ mô phỏng vì chưa có auth thật. Không có panel debug.

Browser `FE/tests/change-password.browser.mjs` kiểm tra UI, preview/validation adapter và production. Kiểm tra guard/returnTo, profile/avatar entry, validation/hiện ẩn/focus, no-secret boundary/storage/HTTP, pending cancel/logout và responsive. Kết quả thực tế nối vào [verification](verification.md); chưa kiểm chứng đổi mật khẩu hoặc xác thực BE thật.
