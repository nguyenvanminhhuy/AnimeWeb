# Đăng nhập và Đăng ký

Triển khai giao diện FE ngày 2026-10-28 theo screen-generation, giữ React Router và phiên demo hiện có. Chưa triển khai BE, đăng nhập thật, xác minh email, khôi phục mật khẩu hoặc OAuth.

## Mở màn hình

Tại SRC: `pnpm --filter anime-web-fe run dev --port 4174 --strictPort`. Đã xác nhận server `http://127.0.0.1:4174/` trong phiên kiểm tra.

- `/login`: Đăng nhập, thay trang thông báo/demo tối thiểu cũ.
- `/register`: Đăng ký hồ sơ demo.
- `/login?returnTo=%2Flibrary%3Ftab%3Dhistory`: sau đăng nhập có nút tiếp tục về Lịch sử.

Hai trang dùng cùng MainLayout và AuthScreen, artwork SVG cục bộ. Mobile tập trung vào form; desktop có phần minh họa cạnh form. Hai nút Dùng tài khoản có lịch sử mẫu/Dùng tài khoản mới vẫn giữ nguyên để các luồng cũ hoạt động.

Từ 2026-10-30, Login có thêm nút Dùng phiên quản trị mẫu chỉ trong dev và khi returnTo thuộc /admin. Phiên adminPreview chỉ ở bộ nhớ, chỉ đọc Dashboard, tách riêng user member và không persist; production không có activation này. AuthScreen hiển thị xác nhận/tiếp tục cho preview chỉ khi quay về admin; tại login công khai vẫn cho chọn member để đổi phiên. Xem [Dashboard](admin-dashboard-screen.md).

## Quy tắc demo

- Email dùng để chọn hồ sơ demo; có thể dùng viewer@anime.test hoặc newcomer@anime.test. Tên và email đăng ký mới chỉ lưu trên trình duyệt này. Không dùng dữ liệu thật.
- Mật khẩu và xác nhận chỉ là giá trị trong state form để kiểm tra giao diện, không truyền vào repository, không lưu password/hash, không đưa lên URL và không gửi request HTTP. Đăng nhập demo chấp nhận mật khẩu bất kỳ từ 8 đến 128 ký tự cho email hồ sơ đã tồn tại, không so khớp với mật khẩu đăng ký. Điều này được nêu rõ ngay trên form; không coi đây là xác thực an toàn.
- Đăng ký kiểm tra tên hiển thị 2–40 ký tự, email hợp lệ/tối đa 254 ký tự, mật khẩu 8–128 ký tự và xác nhận khớp. Email trim/lowercase; không tạo hai hồ sơ trùng email, kể cả trùng email fixture. Lỗi gắn với input bằng aria-invalid/aria-describedby; submit sai focus trường lỗi đầu.
- Có hiện/ẩn mật khẩu, trạng thái pending, khóa submit trùng và hủy thao tác chưa hoàn tất khi rời trang. Không tạo link/nút đăng nhập xã hội hoặc quên mật khẩu vô tác dụng.
- Đăng ký thành công mở phiên member demo và hiển thị nút tiếp tục. Khi đã có phiên, truy cập Login/Register hiển thị hồ sơ hiện tại và nút đổi tài khoản, không tự tạo thêm hồ sơ.
- Đổi giữa Login/Register giữ returnTo đã kiểm tra; URL ngoài origin/protocol-relative/backslash và returnTo trỏ lại login/register, gồm hoa/thường hoặc segment encode, đều về `/`. Không tự thực hiện lại favorite/comment sau đăng nhập.

## Dữ liệu và quyền

`aw:profiles:v1` lưu registry `{version: 1, profiles: [{id, displayName, email}]}`. ID hồ sơ mới dạng local-UUID; `aw:session:v1` vẫn chỉ lưu version/user ID. `aw:account:v1:<id>` tiếp tục tách yêu thích/tiến độ theo từng hồ sơ. Giữ tương thích viewer/newcomer và dữ liệu cũ, không lấy chung thư viện newcomer cho mọi người đăng ký.

SessionProvider khôi phục hồ sơ bằng repository trước khi mở phiên; ID local không có hồ sơ hợp lệ không được coi là member. Registry lỗi không bị ghi đè âm thầm; người dùng vẫn có thể chọn hai tài khoản mẫu. Không ghi được registry thì báo lỗi đăng ký, không tạo phiên giả thành công. Không ghi được session thì dùng phiên trong bộ nhớ với thông báo hiện có; reload có thể mất phiên.

Role/quyền vẫn là member demo mặc định, không lấy quyền/admin từ dữ liệu form/registry. Đây là metadata phục vụ FE, không phải thay đổi hợp đồng auth BE hoặc cơ sở dữ liệu User. Nếu xóa dữ liệu trình duyệt thì chưa có cơ chế khôi phục hồ sơ demo.

## Source và route

- `FE/src/app/routes/login.tsx`, `RegisterPage.tsx`: ghép AuthScreen.
- `features/auth/components`: AuthScreen/AuthForm/PasswordField; `hooks/useAuthForm.ts` quản lý form, validate, pending và hủy.
- `lib/api/contracts/auth-repository.ts` không có password trong interface; `lib/storage/local-demo-auth-repository.ts` chọn/tạo hồ sơ demo và xử lý registry. Chọn adapter tại lib/api/repositories.ts.
- `config/paths.ts` có register/registerTo và safeReturnTo dùng chung; registry router đăng ký LoginPage/RegisterPage. Bỏ nhánh login cũ khỏi DestinationPage. Header giữ returnTo khi đang ở hai route auth.
- CSS dùng chung của hai trang tại app/routes/auth.css, nạp một lần qua styles/index.css; selector aw-auth được đặt riêng, không import lại Bootstrap/Tailwind.
- Layout/spacing/responsive dùng utility Tailwind trong AuthScreen/AuthForm; CSS giữ giao diện, state và các selector form theo ngữ cảnh. Font dùng token 14px, các breakpoint cũ giữ qua variant trong rules/styling.md.

## Kiểm chứng

Dev hỗ trợ `?mock=error` để lỗi thao tác một lần rồi submit thử lại, `?mock=loading` để kéo dài pending 1,5 giây. Chỉ áp dụng khi submit form, không ảnh hưởng nút tài khoản mẫu. Production bỏ qua mock. Không có bảng debug trên UI.

Tại SRC chạy `pnpm --filter anime-web-fe run format`, `pnpm --filter anime-web-fe run build` và `pnpm install --frozen-lockfile`.

Khi dev server ở cổng 4174, kiểm tra với Chromium/@playwright/test đã có trong workspace:

```powershell
@'
import { chromium } from '@playwright/test';
import { verifyAuth } from '../Anime-Web/FE/tests/auth.browser.mjs';
const browser = await chromium.launch({ headless: true });
try { await verifyAuth(browser, 'http://127.0.0.1:4174'); }
finally { await browser.close(); }
'@ | pnpm --filter react-snapshot-effect-ref-lab exec node --input-type=module -
```

Test dùng thông tin giả và browser context riêng; chặn request ngoài origin, xác nhận không có HTTP POST/password trong localStorage, hồ sơ và thư viện tách biệt, các trạng thái form, lưu trữ lỗi, hủy/pending, safe returnTo và fallback artwork. Ảnh tại FE/test-results/login-*.png và register-*.png (gitignore). Kết quả thật được thêm vào verification.md; chưa có BE/auth thật để kiểm chứng.
