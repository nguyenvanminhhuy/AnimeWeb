# Selectbox dùng chung

Source: `FE/src/components/ui/selectbox.tsx`. Selectbox render select HTML gốc để chọn trong danh sách, không cho gõ giá trị ngoài options. Dùng khi lựa chọn giới hạn như thể loại, năm, trạng thái, sort hoặc mùa anime. Ô nhập có gợi ý dùng [Combobox](combobox.md).

## API

`SelectboxProps` kế thừa props/ref của select trừ size native; truyền **options hoặc children**, TypeScript không chấp nhận đồng thời hai nguồn.

```ts
interface SelectboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}
```

| Prop | Ý nghĩa |
| --- | --- |
| `options` | Mảng readonly SelectboxOption; value duy nhất, chuỗi ID gửi form |
| `children` | option/optgroup tự khai báo nếu cần nhóm hoặc tùy biến cấu trúc |
| `id`, `name`, `form` | Label và liên kết form HTML/React Router |
| `value`, `onChange` | Controlled; ChangeEvent<HTMLSelectElement>, đọc event.currentTarget.value |
| `defaultValue` | Uncontrolled; không dùng cùng value |
| `size` | `sm`, `md` (mặc định), `lg`; kích thước giao diện theo [size](sizes.md) |
| `multiple`, `htmlSize` | Chọn nhiều/số hàng theo HTML gốc; value/defaultValue dạng mảng khi multiple |
| `required`, `disabled`, `aria-*` | Validation, trạng thái và mô tả truy cập |
| `className`, `ref`, props gốc | Class bổ sung, ref HTMLSelectElement theo React 19 |

## Ví dụ

```tsx
import { Selectbox } from '@/components/ui/selectbox';

<label htmlFor="genre">Thể loại</label>
<Selectbox
  id="genre"
  name="genre"
  value={genre}
  onChange={(event) => setGenre(event.currentTarget.value)}
  options={[
    { value: '', label: 'Tất cả thể loại' },
    { value: 'phieu-luu', label: 'Phiêu lưu' },
    { value: 'gia-tuong', label: 'Giả tưởng', disabled: true },
  ]}
/>
```

`genre`/`setGenre` thuộc feature. Với required và lời mời chọn, thêm option value rỗng, disabled nếu cần; không tự thêm placeholder hoặc lựa chọn Tất cả ở component. Nếu dùng children, truyền option/optgroup trực tiếp, không lồng select.

## Hành vi và style

- Giữ bàn phím/focus, popup và validation native. Không tự submit, fetch, filter, ghi URL hoặc chọn option khi props thay đổi. Nơi gọi chuẩn hóa query và giá trị được chọn, dùng Form/requestSubmit theo [route](../routes.md).
- Component tự thêm `form-select aw-selectbox`; không lặp lại class form-select ở nơi gọi. CSS tại styles/common/form-controls.css, dùng nền tối, mũi tên, font token 14px, invalid và disabled. Focus giữ viền bình thường, không đổi màu viền, không outline/ring/box-shadow. Popup options/multiple vẫn tùy nền tảng trình duyệt.
- Giữ label htmlFor/id hoặc aria-label. Lỗi nối bằng aria-invalid + aria-describedby như [Input](input.md). Không đặt role combobox/listbox thủ công lên select native.
- Các select hiện có ở Explore, Library và SeasonEpisodes đã dùng Selectbox. Khi generate/sửa màn hình, dùng lại component; kiểm tra onChange, disabled/required, submit, query Back/Forward và responsive.
