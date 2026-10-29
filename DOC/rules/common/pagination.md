# Pagination dùng chung

Source: `FE/src/components/common/Pagination.tsx`; stylesheet `styles/common/pagination.css` được đăng ký qua common/index.css. Component ghép dùng React Router Link và common Icon, không biết nghiệp vụ anime hoặc gọi repository. Đã dùng tại Explore, Library và bình luận Detail.

## API

Export `Pagination` và `PaginationProps`.

| Prop | Mặc định / ý nghĩa |
| --- | --- |
| `page` | Trang hiện tại, đánh số từ 1; nơi gọi lấy từ query |
| `totalPages` | Tổng số trang từ kết quả phân trang |
| `hrefForPage` | `(page: number) => string`, URL builder bắt buộc |
| `label` | `Phân trang`; nên đặt rõ cho từng danh sách |
| `size` | `sm`, `md` mặc định, `lg`; ô trang cao/rộng tối thiểu 32/44/52px ở thiết lập trình duyệt mặc định |
| `siblingCount` | Số trang kề mỗi bên trang hiện tại, mặc định 1; giới hạn 0–3 |
| `disabled` | false; khóa mọi link phân trang khi true |
| `loading` | false; khóa link và đặt aria-busy=true khi true |
| `className` | Class bổ sung của nav cho bố cục |

Font chữ giữ token chung 14px ở mọi size. Padding theo stylesheet pagination; [size control](sizes.md) có cùng ba mức chiều cao nhưng không cần truyền class aw-control-* vào Pagination. Số trang nhiều chữ số có thể rộng hơn min-width; nhóm điều khiển tự xuống dòng trên mobile.

## Ví dụ

```tsx
import { Pagination } from '../components/common/Pagination';

<Pagination
  label="Phân trang anime"
  page={query.page}
  totalPages={result.meta.totalPages}
  size="md"
  loading={loading}
  hrefForPage={(page) => catalogHref({ ...query, page }, mock)}
/>
```

`query`, `result`, `loading`, `catalogHref`, `mock` thuộc feature. Với bình luận, builder giữ season và ghi commentPage thay cho page. Với Library, giữ tab/q/sort/mock. Component không tự đọc/ghi URL, đổi pageSize, reset filter hoặc tính số trang từ mảng dữ liệu. Khi chưa có kết quả, page quyết định giữ pagination đang loading hoặc render loading state của danh sách.

## Hành vi

- Tổng trang dưới 2 ẩn pagination, bao gồm empty hoặc một trang. Chỉ tạo trang đầu, trang cuối và cửa sổ quanh trang hiện tại; khoảng bị bỏ qua hiển thị dấu … không tương tác. Không tạo mảng có độ dài bằng toàn bộ totalPages nên hoạt động với tổng trang lớn.
- Trước/Sau chỉ có Link khi còn trang tương ứng và không bị khóa. Trang active dùng aria-current=page, mỗi số trang có aria-label Trang N; icon mũi tên chỉ trang trí. Cả pagination nằm trong nav có label riêng.
- Khi loading/disabled, các link được thay bằng span aria-disabled=true không có href hoặc tab stop; trang active vẫn được đánh dấu. Không dùng href=# hoặc Link giả disabled. Component không hủy request, debounce hoặc ngăn request cũ từ feature; hook vẫn chịu trách nhiệm.
- Link giữ hành vi SPA, mở tab mới, Back/Forward và reload theo [route](../routes.md). Có rel=prev/next cho điều hướng lân cận. Không đổi sang onClick/window.location cho điều hướng nội bộ; không dùng Button thay link phân trang.
- Giá trị số được cắt phần thập phân. totalPages hữu hạn được giới hạn từ 0 đến MAX_SAFE_INTEGER; không hữu hạn coi là 0. page hữu hạn được clamp vào khoảng hợp lệ, không hữu hạn dùng 1. siblingCount không hữu hạn dùng 1, còn lại clamp 0–3. Đây chỉ là bảo vệ render; feature vẫn chuẩn hóa URL/query bằng replace theo rule route, không dựa vào Pagination để sửa URL.
- Component không tự chuyển focus hoặc cuộn trang; giữ focus-visible của Link và cơ chế ScrollRestoration hiện có. Không áp dụng rule bỏ ring của Input/Selectbox vào pagination.

## Quy tắc generate

Dùng Pagination chung cho danh sách mới; không viết lại dãy số trang ở page/feature. Truyền label phân biệt khi có nhiều danh sách và URL builder thuần từ query hiện tại. Khi đổi tìm kiếm/lọc/sort/pageSize, feature đưa về trang 1; khi đổi trang giữ các điều kiện còn lại. Với pagination của bình luận dùng commentPage để không xung đột query khác.

Kiểm chứng: `tests/pagination.browser.mjs` export verifyPagination; fixture riêng dùng component thật, không đăng ký route sản phẩm hoặc entry build. Test totalPages lớn, dữ liệu biên, ellipsis, size, loading/disabled, label/current/prev/next, không tràn ngang và query/SPA/Back/Forward/reload. Các bộ Explore/Library/Detail tiếp tục kiểm tra phân trang trong luồng thật. Xem [lệnh chạy browser](../routes.md#kiểm-chứng).
