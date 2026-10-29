# Button dùng chung

Source: `FE/src/components/ui/Button.tsx`. Đây là component UI cơ bản dùng chung toàn FE; đặt trong `components/ui/` theo [cấu trúc FE](../fe-structure.md). Component không phụ thuộc page/feature, không tự gọi repository, kiểm tra quyền hoặc chuyển hướng đăng nhập.

## Cách dùng

```tsx
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { paths } from '../routes/paths';

// Hành động: render button, mặc định type="button".
<Button label="Lưu" onClick={save} startIcon={<Icon name="check" />} />

// Form phải khai báo submit rõ ràng. loading tự khóa nút và đặt aria-busy.
<Button type="submit" loading={pending} label={pending ? 'Đang lưu…' : 'Lưu thay đổi'} />

// Điều hướng nội bộ: render Link của React Router, cần nằm dưới RouterProvider.
<Button as="link" to={paths.explore} variant="glass" label="Khám phá anime" endIcon={<Icon name="arrow-right" />} />

// Vị trí cùng trang; link ngoài/download cũng dùng as="anchor".
<Button as="anchor" href="#episodes" label="Danh sách tập" endIcon={<Icon name="arrow-down" />} />

// Kiểu đặc thù của feature, giữ style tại feature/page tương ứng.
<Button
  variant="unstyled"
  className="aw-library-favorite"
  aria-label="Yêu thích anime"
  aria-pressed={favorite}
  onClick={toggleFavorite}
  startIcon={<Icon name="heart" />}
/>

// Nội dung phức tạp vẫn dùng children, không truyền label đồng thời.
<Button endIcon={<Icon name="arrow-right" />}><strong>Tiếp tục</strong> xem phim</Button>
```

Các biến `save`, `pending`, `favorite`, `toggleFavorite` trong ví dụ do component gọi cung cấp; điều chỉnh đường dẫn import theo vị trí file.

## Props

`ButtonProps` là union theo `as`, được export cùng `ButtonVariant`. TypeScript phân biệt thuộc tính của button, React Router Link và anchor.

| Prop | Giá trị / mặc định | Ý nghĩa |
| --- | --- | --- |
| `as` | `button` (mặc định), `link`, `anchor` | Chọn đúng phần tử theo hành vi |
| `variant` | `primary` (mặc định), `glass`, `quiet`, `unstyled` | Kiểu hiển thị |
| `size` | `sm`, `md` (mặc định), `lg` | Kích thước dọc cho button/Link/anchor; xem [size](sizes.md) |
| `className` | Chuỗi tùy chọn | Class bổ sung cho bố cục hoặc kiểu riêng |
| `label` | ReactNode | Nhãn nút; chỉ truyền label hoặc children |
| `children` | ReactNode | Nội dung tùy biến khi không truyền label; có thể bỏ trống với nút icon-only có aria-label |
| `startIcon` | ReactNode, tùy chọn | Icon đứng trước nhãn theo hướng đọc |
| `endIcon` | ReactNode, tùy chọn | Icon đứng sau nhãn theo hướng đọc |
| `type` | `button` (mặc định), `submit`, `reset` | Chỉ áp dụng `as="button"` |
| `disabled` | Boolean | Chỉ button; khóa bằng thuộc tính HTML thật |
| `loading` | Boolean, mặc định false | Chỉ button; đặt disabled và aria-busy khi true |
| `to` | LinkProps.to, bắt buộc khi `as="link"` | Route từ paths hoặc URL builder nghiệp vụ |
| `href` | Chuỗi, bắt buộc khi `as="anchor"` | Hash, URL ngoài hoặc download |
| Các props gốc | Theo phần tử đã chọn | Event, aria-*, name/value/form, target/rel/download, replace/state, ref… |

Ref theo phần tử tương ứng được truyền xuống trực tiếp theo React 19. Root vẫn là button/Link/anchor. Khi có icon slot, component thêm span cho icon và nhãn; khi không có slot, giữ nội dung trực tiếp để tương thích children hiện có. label/startIcon/endIcon không được truyền thành thuộc tính HTML.

TypeScript không cho truyền label và children đồng thời, áp dụng cả ba dạng as. label có thể là 0 và vẫn hiển thị; nhãn rỗng/null/undefined không tạo khoảng trống giữa các icon. startIcon/endIcon có thể dùng cùng label hoặc children. Với nội dung phức tạp ưu tiên children; các nút hiện có đã được chuyển sang label và slot cho icon.

`loading` khóa native button và đặt aria-busy, giữ nguyên nội dung/slot được truyền vào; không tự thêm spinner hoặc đổi nhãn. Nơi gọi cung cấp label tiến trình và startIcon spinner/endIcon khi phù hợp, cùng role="status" nếu cần. Không tự khởi chạy/cancel tác vụ hoặc chống gọi trùng ở repository; hook nghiệp vụ vẫn chịu trách nhiệm.

Link/anchor không có `disabled`, `loading` hoặc `type`; Link không nhận href, button không nhận to/href. Nếu chưa thể điều hướng, render thông báo hoặc button disabled thích hợp thay vì giả lập link disabled. Không lồng button/link bên trong Button.

## Style và accessibility

- `primary`: CTA chính, nền tím. `glass`: CTA phụ và toggle yêu thích. `quiet`: hành động ít nhấn mạnh.
- Nhãn nút tối thiểu 14px ở thiết lập mặc định; dùng token `--aw-font-size-base` (`0.875rem`) theo [quy tắc font](../styling.md#font-chữ), giữ cùng mức chữ trên mobile.
- Ba biến thể trên tự có class `btn aw-button aw-btn-<variant>`. Không lặp các class này ở nơi gọi.
- `unstyled` chỉ có `aw-button-unstyled`, không áp dụng Bootstrap btn/padding/nền; dành cho nút chuyển banner, chip, hiện mật khẩu và nút đặc thù đã có CSS. Không tạo lại CTA primary/glass/quiet bằng kiểu riêng.
- Size dùng class do component quản lý, giữ font 14px. Unstyled không truyền size giữ kiểu feature; truyền size rõ ràng sẽ áp dụng min-height/padding dọc theo [sizes.md](sizes.md).
- CSS dùng chung tại `FE/src/styles/common/button.css`, đăng ký qua common/index.css trong layer components. Không import CSS trực tiếp từ Button/page; giữ thứ tự layer theo [styling.md](../styling.md).
- Có slot icon sẽ dùng inline-flex, align-items center và gap 0.5rem (8px mặc định), thứ tự startIcon → label/children → endIcon. Không chèn dấu cách/margin riêng quanh icon. Tôn trọng direction của nơi chứa nên start/end tự đổi vị trí khi RTL; size/font/variant vẫn giữ nguyên API.
- Icon slot được bọc aria-hidden=true vì là trang trí. Dùng common Icon, không đặt phần tử tương tác trong slot. Nút chỉ có icon dùng startIcon/endIcon và aria-label trên Button; không dựa vào label của Icon nằm bên trong slot để đặt tên cho nút.
- Nút chỉ có icon phải có nhãn truy cập; icon trang trí đặt aria-hidden. Toggle dùng aria-pressed; trạng thái mở/đóng dùng aria-expanded và aria-controls phù hợp. Giữ focus-visible rõ và dùng bàn phím được.
- Button mặc định type="button"; mọi nút gửi form phải khai báo type="submit". Không gắn role="button" vào Link chỉ vì có hình thức CTA.
- Điều hướng dùng `as="link"` cùng paths, giữ hành vi SPA, Back/Forward, mở tab mới. Menu active vẫn dùng NavLink, link văn bản/phân trang vẫn dùng Link; không thay mọi liên kết bằng Button. Anchor chỉ dùng theo [quy tắc route](../routes.md).

## Quy tắc khi generate

Dùng Button cho các nút hành động và link có hình thức button trên màn hình mới hoặc được chỉnh sửa. Không thêm thẻ button thô ngoài implementation Button, không rải lại class `btn aw-btn-*`. Truyền callback/disabled/loading và nhãn từ feature; kiểm tra quyền ở luồng nghiệp vụ. Nếu cần biến thể mới, bổ sung API và CSS tập trung, cập nhật tài liệu này trước khi nhân rộng.

Ưu tiên label/startIcon/endIcon cho nút có nhãn và icon; children dành cho nội dung tùy biến. Không thêm label cùng children hoặc tự căn icon ở page bằng whitespace/margin.

Kiểm thử riêng: tests/button.browser.mjs export verifyButton với fixture HTML/JSX, kiểm tra slot order/gap, nhãn truy cập, icon-only, children, loading, submit, Link/anchor/ref, RTL và size. Hợp đồng TypeScript tại tests/button.types.tsx kiểm tra các trường hợp label + children bị từ chối. Chạy tại SRC:

```powershell
pnpm --filter anime-web-fe exec tsc --noEmit --strict --skipLibCheck --jsx react-jsx --module ESNext --target ES2022 --moduleResolution Bundler tests/button.types.tsx
```

Kiểm chứng sau thay đổi: chạy format và build (bao gồm format:check/typecheck); kiểm tra submit/Enter, nút phụ không submit, loading/disabled, focus bàn phím và điều hướng Link. Khi thay nhiều màn hình, chạy hồi quy browser tương ứng theo [routes.md](../routes.md). Kết quả thực tế được thêm vào `DOC/verification.md`.
