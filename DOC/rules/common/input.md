# Input dùng chung

Source: `FE/src/components/ui/Input.tsx`. Dùng cho ô nhập một dòng và input hidden. Component chỉ render một input, nhận props/callback từ nơi gọi; không tự gọi API, đọc storage hoặc xử lý nghiệp vụ. Font theo [rule 14px](../styling.md#font-chữ).

## API

`InputProps` kế thừa `ComponentPropsWithRef<'input'>` trừ size native, thêm variant, size giao diện và htmlSize.

| Prop | Mặc định / cách dùng |
| --- | --- |
| `type` | `text`; nhận các type HTML như search, email, password, number, hidden |
| `variant` | `default` có border/nền/padding chung; `unstyled` giữ kiểu field shell của feature |
| `size` | `sm`, `md` (mặc định), `lg`; font vẫn 14px, xem [size](sizes.md) |
| `htmlSize` | Number; thuộc tính size HTML thật, độ rộng theo số ký tự khi CSS không ghi đè |
| `id`, `name` | id nối label, name là khóa trong FormData |
| `value`, `onChange` | Controlled; callback nhận ChangeEvent của input |
| `defaultValue` | Uncontrolled; không truyền đồng thời với value |
| `disabled`, `readOnly`, `required` | Thuộc tính HTML thật; disabled không nằm trong FormData, readOnly vẫn được gửi |
| `aria-invalid`, `aria-describedby` | Nối trạng thái lỗi và nội dung hướng dẫn/lỗi do nơi gọi render |
| `className`, `ref`, props gốc | Class bổ sung, ref HTMLInputElement theo React 19; autoComplete, min/max, minLength/maxLength, pattern, form… |

Không tự sinh label, placeholder hoặc thông báo lỗi; cần label truy cập rõ ràng. Không dùng placeholder thay label. Input password không tự có nút ẩn/hiện: feature auth tiếp tục ghép PasswordField từ Input + Button.

## Ví dụ

```tsx
import { Input } from '../components/ui/Input';

<label htmlFor="email">Email</label>
<Input
  id="email"
  name="email"
  type="email"
  autoComplete="email"
  value={email}
  onChange={(event) => setEmail(event.currentTarget.value)}
  required
  aria-invalid={Boolean(error)}
  aria-describedby={error ? 'email-error' : undefined}
/>
{error && <p id="email-error" role="alert">{error}</p>}
```

`email`, `setEmail`, `error` là state của feature. Dùng `defaultValue` cho field GET hiện tại; khi URL thay đổi cần đồng bộ bằng controlled value hoặc key theo query như các màn hình Explore/Library. Giữ Form của React Router và quy tắc [route](../routes.md).

Style mặc định dành cho input nhập liệu; checkbox/radio/range/file nếu cần dùng `variant="unstyled"` cùng layout/label phù hợp, không áp dụng khung text field vào các loại control này. Textarea nhiều dòng vẫn là textarea; không ép vào Input.

## Style và generate

- Class `aw-input` hoặc `aw-input-unstyled`; CSS tại `styles/common/form-controls.css`, đăng ký trong common/index.css trước layout/page. Không import CSS từ TSX.
- Default có placeholder, invalid và disabled; readOnly có border dashed. Focus giữ viền bình thường, không đổi màu viền, không outline/ring/box-shadow, áp dụng cả unstyled và Combobox. Unstyled còn lại do feature sở hữu style.
- Unstyled không truyền size giữ kích thước feature; truyền size rõ sẽ áp dụng min-height/padding dọc. Native size dạng số phải chuyển sang htmlSize; xem [sizes.md](sizes.md).
- Khi generate/sửa màn hình, dùng Input thay thẻ input riêng; giữ native props, keyboard, ref, validation và submit. Không tạo state/query/repository trong Input. Label, hint/error và permission thuộc nơi gọi.
- Kiểm tra form submit, lỗi/focus, disabled/readOnly, controlled/uncontrolled, 14px và responsive. Xem thêm [Combobox](combobox.md), [Selectbox](selectbox.md).
