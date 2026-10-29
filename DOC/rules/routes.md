# Route và navigation

Áp dụng cho mọi lần generate/sửa màn hình FE. Người dùng xác nhận dùng React Router và quản lý route tập trung ngày 2026-10-28.

## Cấu trúc

```text
FE/src/routes/
├── paths.ts        # Pattern, URL builders và kiểm tra returnTo
└── router.tsx      # createBrowserRouter, layout và đăng ký màn hình
```

FE dùng react-router-dom 7.18.5 ở Data mode: một createBrowserRouter tại routes/router.tsx và một RouterProvider trong app/App.tsx. SessionProvider nằm trên RouterProvider để giữ phiên khi chuyển trang. MainLayout dùng Outlet render route con và ScrollRestoration quản lý cuộn.

Không tạo BrowserRouter/RouterProvider mới trong page/feature/layout con. Không phân tuyến thủ công bằng if/switch trên window.location.pathname.

## Route hiện tại

| Pattern | Nội dung | Truy cập |
| --- | --- | --- |
| `/` | HomePage | Công khai |
| `/anime` | ExplorePage | Công khai |
| `/anime/:slug` | AnimeDetailPage | Công khai; favorite/ghi bình luận yêu cầu member |
| `/watch/:episodeId` | DestinationPage kind watch | Công khai; thông báo tối thiểu |
| `/library` | LibraryPage, query tab/q/sort/page | Member; guest thấy lời mời đăng nhập giữ returnTo |
| `/login` | LoginPage | Phiên demo; xem auth-screens.md |
| `/register` | RegisterPage | Tạo hồ sơ demo cục bộ, chưa có auth BE |
| `*` | DestinationPage kind not-found | Không tìm thấy |

## Khi generate màn hình

1. Đọc routes/paths.ts và routes/router.tsx, tái sử dụng pattern đã có.
2. Thêm/cập nhật pattern và builder tại paths.ts nếu cần. Dùng generatePath và encode giá trị slug/episodeId khi xây URL.
3. Đăng ký page dưới MainLayout trong router.tsx. Nếu có placeholder, thay element của route đó; không tạo route trùng.
4. Đọc URL bằng useParams/useSearchParams/useLocation. Không quyết định màn hình bằng cách phân tích pathname thủ công trong page.
5. Giữ route `*`, đường quay lại, chính sách quyền và các màn hình đã triển khai. Không tự triển khai thêm màn hình đích hoặc BE.

## Navigation và form

- Dùng Link cho link nội bộ, NavLink cho menu active, useNavigate để chuyển trang sau thao tác. Dùng paths hoặc builder nghiệp vụ dựa trên paths; không rải chuỗi route giữa component.
- Link Trang chủ dùng end khi cần. Menu Thư viện không active chỉ vì guest đang ở login.
- Dùng Form của React Router cho tìm kiếm/lọc GET. Control lọc có thể gọi form.requestSubmit để đi qua Form. Không dùng form HTML gây document navigation cho tác vụ nội bộ.
- Thẻ a dành cho link ngoài, download hoặc liên kết vị trí cùng trang như skip link #main-content. Không dùng href="#" thay hành động.
- Không dùng window.location.assign/reload hoặc history.pushState/replaceState để điều hướng nội bộ. Trường hợp cần reload thật phải có lý do riêng trong nhiệm vụ.

## Query URL

- URL là nguồn trạng thái cho tìm kiếm/lọc/sort/phân trang. Đọc/ghi bằng useSearchParams. Chuẩn hóa query bằng navigate(..., { replace: true }) hoặc setSearchParams(..., { replace: true }).
- Lọc/sort/phân trang tạo history để Back/Forward hoạt động. Chuẩn hóa giá trị sai và clamp page dùng replace, tránh thêm bước history thừa.
- Đổi lọc/sort/pageSize về trang 1; phân trang giữ các điều kiện còn lại. Parser/serializer nghiệp vụ nằm trong feature tương ứng.
- Hook dữ liệu phải phản ứng khi query đổi, bỏ qua kết quả yêu cầu cũ và tránh render dữ liệu query trước như kết quả mới. Không chỉ chụp query một lần bằng useState lúc mount.
- Khi chuẩn hóa page, giữ kết quả hợp lệ thay vì tải lại cùng danh sách chỉ vì URL được replace.
- Input/select phải đồng bộ khi Back/Forward/xóa lọc/điều hướng trong cùng page. Dùng controlled values hoặc key theo query cho control dùng defaultValue.
- Hàm dựng URL thuần nhận query/mock rõ qua tham số; không đọc global location.

## Quyền và returnTo

- Danh mục/chi tiết/playback công khai không bị chặn vì chưa đăng nhập. Route thư viện kiểm tra phiên rồi hiển thị lời mời hoặc chuyển login theo luồng hiện có. Khi nhiều route dùng chung guard, đặt guard trong routes.
- Dùng paths.loginTo/registerTo và safeReturnTo. Chỉ nhận đường dẫn nội bộ, giữ query/hash; từ chối URL ngoài origin, protocol-relative và quay lại login/register gây vòng lặp. Hai trang auth giữ cùng returnTo khi chuyển qua lại. Form auth mock phải chặn submit HTTP, không đưa password lên URL hoặc truyền vào repository hồ sơ demo; xem [auth-screens.md](../auth-screens.md).
- Đăng xuất phải cập nhật route cá nhân ngay và xóa cache/state cá nhân. FE guard không thay kiểm tra quyền BE.

## Kiểm chứng

- Chạy format, format:check/typecheck/build theo AGENTS.md. Kiểm tra Link/Form không tạo document request mới, active menu, Back/Forward, query, direct URL/reload, unknown route, guest/member và returnTo.
- Test SPA phải chờ query mới đã render và tải xong; không giả định URL đổi đồng nghĩa React đã commit view mới.
- Vite dev/preview hỗ trợ direct route. Hosting production về sau cần fallback đường dẫn ứng dụng về index.html, giữ ngoại lệ asset/API. Bước này không deploy.
- Thêm bằng chứng thật vào DOC/verification.md; giữ nguyên lịch sử cũ.

Kiểm tra browser hiện có: FE/tests/home.browser.mjs, explore.browser.mjs, library.browser.mjs, auth.browser.mjs, detail.browser.mjs và navigation.browser.mjs. Với dev server cổng 4174, chạy từ SRC bằng PowerShell (tái sử dụng Chromium/@playwright/test đã cài ở workspace):

```powershell
@'
import { chromium } from '@playwright/test';
import { verifyHome } from '../Anime-Web/FE/tests/home.browser.mjs';
import { verifyExplore } from '../Anime-Web/FE/tests/explore.browser.mjs';
import { verifyNavigation } from '../Anime-Web/FE/tests/navigation.browser.mjs';
import { verifyLibrary } from '../Anime-Web/FE/tests/library.browser.mjs';
import { verifyAuth } from '../Anime-Web/FE/tests/auth.browser.mjs';
import { verifyDetail } from '../Anime-Web/FE/tests/detail.browser.mjs';
const browser = await chromium.launch({ headless: true });
try {
  await verifyExplore(browser, 'http://127.0.0.1:4174');
  await verifyHome(browser, 'http://127.0.0.1:4174');
  await verifyNavigation(browser, 'http://127.0.0.1:4174');
  await verifyLibrary(browser, 'http://127.0.0.1:4174');
  await verifyAuth(browser, 'http://127.0.0.1:4174');
  await verifyDetail(browser, 'http://127.0.0.1:4174');
} finally { await browser.close(); }
'@ | pnpm --filter react-snapshot-effect-ref-lab exec node --input-type=module -
```

Tham chiếu: [React Router routing](https://reactrouter.com/7.18.5/start/data/routing), [navigation](https://reactrouter.com/7.18.5/start/declarative/navigating).
