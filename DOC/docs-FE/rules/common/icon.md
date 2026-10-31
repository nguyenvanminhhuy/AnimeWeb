# Icon — Font Awesome Free

Source: `FE/src/components/ui/icon.tsx`; registry tại `icon-definitions.ts`. FE dùng component React chính thức để render SVG inline, đóng gói cùng ứng dụng; không dùng CDN, Kit script, icon font hoặc API key. Registry hiện có 15 definition, gồm `tags` (faTags) và `users` (faUsers) cho menu quản trị bằng named import.

## Dependencies và CSS

Đã cài/pin bằng pnpm với lockfile chung tại SRC:

- `@fortawesome/react-fontawesome`: 3.5.0.
- `@fortawesome/fontawesome-svg-core`: 7.3.1.
- `@fortawesome/free-solid-svg-icons`: 7.3.1.
- `@fortawesome/free-regular-svg-icons`: 7.3.1 (trái tim rỗng).

Registry import từng definition cần dùng; không import toàn bộ fas/far hoặc gọi library.add với cả bộ. Các icon có trong registry được đóng gói cùng component, kể cả khi một màn hình chưa render chúng. Khi cần icon mới, thêm named import và tên registry rõ ràng; không tự tải icon từ URL theo tên người dùng nhập. Chưa cài bộ Brands hoặc Pro.

Icon tắt `config.autoAddCss`; stylesheet core được import một lần trong styles/index.css ở layer components, trước common CSS. Style dự án tại styles/common/icon.css qua common/index.css. Không thêm link/script Font Awesome vào HTML, không gọi dom.watch hoặc thêm stylesheet runtime; giữ React quản lý DOM và thứ tự layer.

## API

| Prop | Mặc định / ý nghĩa |
| --- | --- |
| `name` | Bắt buộc, kiểu IconName từ registry |
| `size` | `sm` = 16px, `md` = 18px (mặc định), `lg` = 24px ở thiết lập trình duyệt mặc định; dùng rem |
| `label` | Nhãn cho icon có ý nghĩa độc lập; bỏ trống thì icon là trang trí, aria-hidden=true |
| `className` | Class bổ sung để căn chỉnh/màu sắc; mặc định kế thừa màu nơi chứa |
| Props còn lại | FontAwesomeIconProps trừ các props do wrapper quản lý: icon, size, title/titleId, role, aria-label/hidden, focusable |

Icon tự đặt focusable=false. Có label không rỗng thì role=img, aria-label là label đã trim và aria-hidden=false; không có label thì bị ẩn khỏi cây accessibility. Không truyền title để thay label. Size của Icon là kích thước đồ họa, khác [size control](sizes.md); font chữ nội dung vẫn 14px.

Các tên hiện có: search, heart, heart-filled, play, history, external-link, arrow-left, arrow-right, arrow-down, replay, close, check, plus. Heart dùng regular, heart-filled dùng solid.

## Ví dụ

```tsx
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

// Có chữ bên cạnh: icon chỉ trang trí, nhãn nút lấy từ chữ.
<Button onClick={search} label="Tìm kiếm" startIcon={<Icon name="search" size="sm" />} />

// Chỉ có icon: đặt nhãn trên phần tử tương tác.
<Button aria-label="Tìm kiếm" onClick={search} startIcon={<Icon name="search" />} />

// Trạng thái độc lập không có chữ đi kèm.
<Icon name="check" label="Đã lưu thành công" />

// Toggle vẫn có chữ và trạng thái aria-pressed ở Button.
<Button
  aria-pressed={favorite}
  onClick={toggleFavorite}
  label={favorite ? 'Đã yêu thích' : 'Yêu thích'}
  startIcon={<Icon name={favorite ? 'heart-filled' : 'heart'} />}
/>
```

Callback/state thuộc feature; đường dẫn import theo vị trí file. Không dùng màu hoặc hình icon làm nguồn thông tin duy nhất: giữ chữ/nhãn và aria-pressed/disabled phù hợp. Link nội bộ vẫn dùng React Router dù có icon external-link làm dấu mũi tên; icon không quyết định hành vi navigation.

## Quy tắc generate và tích hợp

- Icon chức năng của Header, Home/FeaturedBanner, Explore, Library, Detail, Auth, Comments, SeasonEpisodes và Pagination dùng Icon chung. Không import FontAwesomeIcon hoặc package icon trực tiếp từ page/feature.
- Không dùng lại ký tự Unicode cho tìm kiếm, yêu thích, play hoặc mũi tên hành động. Các dấu trang trí thương hiệu ✦, dấu phân cách, chấm carousel/status CSS và spinner Bootstrap hiện tại được giữ; mũi tên select native vẫn là SVG data URI trong CSS để hoạt động với select HTML.
- Icon trang trí không xuất hiện trong tên truy cập. Khi đổi từ chuỗi ký tự sang SVG, nhãn truy cập là chữ như Yêu thích/Đã yêu thích/Sau; không đưa ký tự cũ vào aria-label để giữ test.
- Kiểm chứng `verifyIcons` tại FE/tests/icons.browser.mjs theo [hướng dẫn browser](../routes.md#kiểm-chứng). Fixture riêng kiểm tra registry, size, màu kế thừa, semantic/decorative và không inject CSS ngoài stylesheet Vite. Luồng thật kiểm tra guest login/returnTo và đổi tim regular → solid; chặn request ngoài origin để kiểm tra không phụ thuộc CDN.

Tham chiếu chính thức: [thiết lập React](https://docs.fontawesome.com/web/use-with/react/), [import từng icon](https://docs.fontawesome.com/web/use-with/react/add-icons/).
