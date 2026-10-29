# Combobox dùng chung

Source: `FE/src/components/ui/combobox.tsx`. Đây là **ô nhập một dòng có gợi ý native**: Input + datalist. Người dùng có thể chọn gợi ý hoặc gõ giá trị khác. Chọn một ID bắt buộc nằm trong tập options dùng [Selectbox](selectbox.md).

## API

`ComboboxProps` kế thừa [InputProps](input.md), loại bỏ list/type/children để component quản lý liên kết gợi ý; thêm:

| Prop | Ý nghĩa |
| --- | --- |
| `suggestions` | Mảng readonly string bắt buộc; chuỗi chính là giá trị có thể điền/gửi form |
| `type` | `text` mặc định hoặc `search` |
| `value`, `onChange`, `defaultValue` | Giống Input; onChange nhận native ChangeEvent, không có callback chọn ID riêng |
| `variant`, `className`, `ref` | Kiểu default/unstyled, class bổ sung, ref vào input thật |
| `size`, `htmlSize` | sm/md/lg (mặc định md) và size HTML dạng số kế thừa Input; xem [size](sizes.md) |
| `id`, `name`, `form`, `disabled`, `readOnly`, `required`, `aria-*`… | Props input được truyền xuống; type chỉ giới hạn text/search |

Component tự dùng useId tạo id datalist riêng cho từng instance, nối qua list, bỏ gợi ý rỗng và chuỗi trùng chính xác. Không thêm name/field ẩn, không đổi label thành ID, không tự submit hoặc gọi API. Mảng gợi ý có thể cập nhật mà không mất nội dung đang nhập; suggestions rỗng vẫn cho nhập bình thường.

## Ví dụ

```tsx
import { Combobox } from '@/components/ui/combobox';

<label htmlFor="anime-search">Từ khóa anime</label>
<Combobox
  id="anime-search"
  name="q"
  type="search"
  value={query}
  onChange={(event) => setQuery(event.currentTarget.value)}
  suggestions={titles}
  maxLength={100}
  placeholder="Nhập tên anime…"
/>
```

`query`, `setQuery`, `titles` do feature cung cấp. Khi submit Form GET, q chính là nội dung input, kể cả khi không thuộc titles. Không gọi requestSubmit trên mỗi ký tự nếu luồng sản phẩm chưa yêu cầu tìm ngay. Với dữ liệu từ API về sau, debounce/loading/error/abort thuộc hook feature, không thêm vào component UI.

## Hành vi native và giới hạn

- Trình duyệt quản lý mở/đóng, lọc, bàn phím và lựa chọn trong datalist. Không tự đặt aria-expanded/aria-activedescendant để mô tả một popup do React không quản lý.
- Popup gợi ý, cách lọc, hỗ trợ thiết bị/screen reader và kiểu hiển thị phụ thuộc trình duyệt. Component không cung cấp listbox custom, multiple selection, phân trang gợi ý hoặc tùy biến render từng dòng. Vẫn sử dụng được như Input khi nền tảng không hiện popup.
- Label phải nối với id input; lỗi/hint dùng aria-invalid + aria-describedby. Font ô nhập là token chung 14px; font popup native có thể do trình duyệt điều khiển.
- Focus ô nhập giữ viền bình thường, không đổi màu viền hoặc thêm outline/ring/box-shadow như Input. Field shell không thêm lại border focus-within; popup native vẫn do trình duyệt quản lý.
- Giữ id datalist độc lập với id input, không truyền list từ bên ngoài, không đặt các string nhạy cảm vào suggestions. Dùng Selectbox cho lựa chọn giới hạn cần validation theo ID.

## Tích hợp và generate

ExploreFilters dùng Combobox cho tìm kiếm anime. ExplorePage truyền tiêu đề của kết quả đã tải ở trang hiện tại; đây là gợi ý cục bộ, không phải toàn bộ catalog. Gợi ý chỉ xuất hiện khi có kết quả; người dùng vẫn tìm được tên khác bằng cách gõ. Dùng key theo query q để đồng bộ Back/Forward như trước, không thêm request dữ liệu.

Khi generate, dùng Combobox cho nhu cầu nhập tự do có gợi ý, Input cho nhập không gợi ý và Selectbox cho lựa chọn giới hạn. Kiểm tra label/list liên kết đúng, gợi ý theo dữ liệu, nhập ngoài suggestions, submit q và query Back/Forward. Test tự động có thể kiểm tra datalist và giá trị/form; việc hiển thị popup native cần kiểm tra trên nền tảng đích, không suy ra chỉ từ DOM.
