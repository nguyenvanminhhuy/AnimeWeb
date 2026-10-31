# Pagination dùng chung

Source: `FE/src/components/common/pagination.tsx`; stylesheet `styles/common/pagination.css` được đăng ký qua common/index.css. Component ghép dùng React Router Link và common Icon, không biết nghiệp vụ anime hoặc gọi repository. Đã dùng tại Explore, Library và bình luận Detail.

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
| `className` | Class bố cục; áp dụng lên nav mặc định, hoặc wrapper khi bật `showSinglePage`/`pageSizeControl` |
| `showSinglePage` | false; bật để giữ thanh phân trang khi chỉ có một trang, dùng cho danh sách admin |
| `pageSizeControl` | Tuỳ chọn `{ value: number; options: readonly number[]; onChange: (value: number) => void; label?: string }`; mặc định không hiển thị |

Font chữ giữ token chung 14px ở mọi size. Padding theo stylesheet pagination; [size control](sizes.md) có cùng ba mức chiều cao nhưng không cần truyền class aw-control-* vào Pagination. Số trang nhiều chữ số có thể rộng hơn min-width; nhóm điều khiển tự xuống dòng trên mobile.

## Ví dụ

```tsx
import { Pagination } from '@/components/common/pagination';

<Pagination
  label="Phân trang anime"
  page={query.page}
  totalPages={result.meta.totalPages}
  size="md"
  loading={loading}
  hrefForPage={(page) => catalogHref({ ...query, page }, mock)}
/>
```

`query`, `result`, `loading`, `catalogHref`, `mock` thuộc feature. Với bình luận, builder giữ season và ghi commentPage thay cho page. Với Library, giữ tab/q/sort/mock. Component không tự đọc/ghi URL, reset filter hoặc tính số trang từ mảng dữ liệu. `pageSizeControl` chỉ phát callback; feature cập nhật pageSize, đưa về trang 1 và giữ bộ lọc. Khi chưa có kết quả, page quyết định giữ pagination đang loading hoặc render loading state của danh sách.

## Số bản ghi mỗi trang và danh sách quản trị

- Chỉ truyền `pageSizeControl` tại thanh **phía trên** các danh sách admin; thanh dưới và các màn công khai không truyền prop này. Đặt hai Pagination trước/sau bảng hoặc danh sách records, cùng page/totalPages/hrefForPage và `showSinglePage`.
- Nhóm nút phân trang căn giữa toàn bộ chiều rộng thanh trên và thanh dưới. Ô số lượng nằm bên phải thanh trên, dùng common Selectbox controlled và size của Pagination; label mặc định `Số bản ghi mỗi trang`, có thể đặt theo loại dữ liệu. ID label được tạo bằng useId để không trùng giữa các instance. Trên màn hình tablet/mobile, ô số lượng xuống dòng và vẫn canh phải; nhóm nút trang giữ căn giữa.
- Chỉ có một ô số lượng cho mỗi danh sách. Chuyển ô pageSize cũ khỏi bộ lọc/tiêu đề/thanh dưới; Form GET giữ pageSize hiện tại bằng hidden Input để tìm/lọc không làm mất lựa chọn.
- `options` là các số nguyên dương được feature hỗ trợ. Feature kiểm tra giá trị, cập nhật URL bằng React Router, giữ điều kiện hiện tại và về trang 1; giữ chính sách đóng panel khi đổi điều kiện của từng màn.
- Ô số lượng bị disabled khi Pagination loading/disabled. Vẫn hiện khi danh sách rỗng hoặc chỉ có một trang để người dùng đổi số lượng; thanh dưới chỉ hiện khi có records. Không render trang 0.
- Label nav trên có hậu tố `phía trên`; nav dưới dùng label của danh sách. Các link vẫn có aria-current/rel/nhãn Trang N. Kiểm tra hai thanh bằng nav label riêng, không truy vấn link Trang N toàn trang vì có hai bản.

## Hành vi

- Mặc định tổng trang dưới 2 ẩn pagination, bao gồm empty hoặc một trang. `showSinglePage` hoặc `pageSizeControl` cho phép giữ thanh khi ít trang; tổng bằng 0 không tạo số trang. Chỉ tạo trang đầu, trang cuối và cửa sổ quanh trang hiện tại; khoảng bị bỏ qua hiển thị dấu … không tương tác. Không tạo mảng có độ dài bằng toàn bộ totalPages nên hoạt động với tổng trang lớn.
- Trước/Sau chỉ có Link khi còn trang tương ứng và không bị khóa. Trang active dùng aria-current=page, mỗi số trang có aria-label Trang N; icon mũi tên chỉ trang trí. Cả pagination nằm trong nav có label riêng.
- Khi loading/disabled, các link được thay bằng span aria-disabled=true không có href hoặc tab stop; trang active vẫn được đánh dấu. Không dùng href=# hoặc Link giả disabled. Component không hủy request, debounce hoặc ngăn request cũ từ feature; hook vẫn chịu trách nhiệm.
- Link giữ hành vi SPA, mở tab mới, Back/Forward và reload theo [route](../routes.md). Có rel=prev/next cho điều hướng lân cận. Không đổi sang onClick/window.location cho điều hướng nội bộ; không dùng Button thay link phân trang.
- Giá trị số được cắt phần thập phân. totalPages hữu hạn được giới hạn từ 0 đến MAX_SAFE_INTEGER; không hữu hạn coi là 0. page hữu hạn được clamp vào khoảng hợp lệ, không hữu hạn dùng 1. siblingCount không hữu hạn dùng 1, còn lại clamp 0–3. Đây chỉ là bảo vệ render; feature vẫn chuẩn hóa URL/query bằng replace theo rule route, không dựa vào Pagination để sửa URL.
- Component không tự chuyển focus hoặc cuộn trang; giữ focus-visible của Link và cơ chế ScrollRestoration hiện có. Không áp dụng rule bỏ ring của Input/Selectbox vào pagination.

## Quy tắc generate

Dùng Pagination chung cho danh sách mới; không viết lại dãy số trang ở page/feature. Truyền label phân biệt khi có nhiều danh sách và URL builder thuần từ query hiện tại. Khi đổi tìm kiếm/lọc/sort/pageSize, feature đưa về trang 1; khi đổi trang giữ các điều kiện còn lại. Với pagination của bình luận dùng commentPage để không xung đột query khác.

Danh sách quản trị tuân theo bố cục hai thanh và số lượng chỉ ở thanh trên như mục trên; không áp dụng ô số lượng cho Explore/Library/bình luận công khai.

Kiểm chứng: `tests/pagination.browser.mjs` export verifyPagination; fixture riêng dùng component thật, không đăng ký route sản phẩm hoặc entry build. Test totalPages lớn, dữ liệu biên, ellipsis, size, loading/disabled, label/current/prev/next, không tràn ngang và query/SPA/Back/Forward/reload. Các bộ Explore/Library/Detail tiếp tục kiểm tra phân trang trong luồng thật. Xem [lệnh chạy browser](../routes.md#kiểm-chứng).
