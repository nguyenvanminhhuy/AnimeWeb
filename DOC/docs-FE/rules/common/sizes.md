# Size của common controls

Button, Input, Combobox và Selectbox dùng chung `ControlSize = 'sm' | 'md' | 'lg'`, export tại `FE/src/components/ui/control.types.ts`. `size` là kích thước giao diện; mặc định `md` cho component có style nền.

| size | Chiều cao tối thiểu | Padding trên/dưới | Font |
| --- | --- | --- | --- |
| `sm` | 2rem ≈ 32px | 0.25rem ≈ 4px | Token chung ≈ 14px |
| `md` (mặc định) | 2.75rem ≈ 44px | 0.625rem ≈ 10px | Token chung ≈ 14px |
| `lg` | 3.25rem ≈ 52px | 0.875rem ≈ 14px | Token chung ≈ 14px |

Các giá trị px ở thiết lập trình duyệt mặc định; rem vẫn tôn trọng cỡ chữ người dùng. Chiều cao là tối thiểu, nội dung dài có thể xuống dòng làm control cao hơn. Size điều khiển chiều cao/padding dọc; chiều rộng và padding ngang theo variant hoặc field shell (ví dụ chừa chỗ cho nút hiện mật khẩu). Giữ font 14px cho cả ba size theo [styling.md](../styling.md#font-chữ).

```tsx
<Button size="sm" onClick={save}>Lưu</Button>
<Button as="link" size="lg" to={paths.explore}>Khám phá</Button>
<Input size="md" id="email" name="email" type="email" aria-label="Email" />
<Combobox size="lg" aria-label="Từ khóa" suggestions={titles} />
<Selectbox size="sm" aria-label="Thể loại" options={genres} />
```

Biến/callback thuộc nơi gọi; label và form vẫn cần theo tài liệu từng component. Button hỗ trợ size cho cả button, Link và anchor; Combobox kế thừa size của Input.

## Unstyled và native size

- `variant="unstyled"` của Button/Input/Combobox không truyền size thì giữ kích thước của feature (chip, dot banner, tìm kiếm Header…). Khi truyền size rõ ràng, kích thước dọc chung được áp dụng, phần nền/viền vẫn do feature quản lý.
- Input/Selectbox dùng `htmlSize?: number` để truyền thuộc tính size HTML thật. Input htmlSize biểu thị độ rộng theo số ký tự (CSS width có thể ưu tiên hơn); Selectbox htmlSize là số hàng hiển thị, thường dùng cùng multiple.
- Ví dụ: `<Selectbox size="sm" htmlSize={4} multiple options={options} aria-label="Chọn nhiều" />`. Size sm không giới hạn select còn một hàng: htmlSize vẫn quyết định số hàng.
- Nếu code cũ có `<Input size={30} />` hoặc `<Selectbox size={4} />`, đổi thành htmlSize tương ứng. size dạng số không còn là API hợp lệ. Combobox cũng nhận htmlSize từ Input.
- Input hidden vẫn ẩn, không bị size biến thành control hiển thị. Không gửi chuỗi sm/md/lg xuống thuộc tính HTML size.

## CSS và kiểm chứng

Component tự gắn class `aw-control-sm/md/lg`; không viết các class size này thủ công ở nơi gọi. `styles/common/control-sizes.css` được đăng ký ở layer overrides trong styles/index.css để size hoạt động cả khi page có CSS riêng. Rule chỉ áp dụng cho bốn control chung, không thay font-size của toàn bộ trang, không dùng important. Inline style hoặc important do nơi gọi thêm vẫn có thể ghi đè; tránh thêm chúng để chỉnh size.

Test riêng: `FE/tests/control-sizes.browser.mjs` export `verifyControlSizes(browser, baseURL)`. Dùng dev server như [hướng dẫn browser](../routes.md#kiểm-chứng). Test mở fixture riêng tại `/tests/fixtures/control-sizes.html`, kiểm tra cả bốn control và Button link/anchor/quiet, ba size/default trong shell CSS thật, responsive, font, htmlSize, unstyled và FormData. Fixture không đăng ký vào router và không nằm trong entry build production.
