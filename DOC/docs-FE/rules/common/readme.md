# Component dùng chung

Thư mục `DOC/docs-FE/rules/common/` là nơi lưu tài liệu và quy tắc sử dụng component dùng chung của FE, bao gồm thành phần UI cơ bản và component ghép. Source vẫn đặt theo trách nhiệm trong `components/ui/` hoặc `components/common/`; xem [cấu trúc FE](../fe-structure.md).

| Component | Source | Tài liệu |
| --- | --- | --- |
| Button | `FE/src/components/ui/button.tsx` | [button.md](button.md) |
| Input | `FE/src/components/ui/input.tsx` | [input.md](input.md) |
| Combobox | `FE/src/components/ui/combobox.tsx` | [combobox.md](combobox.md) |
| Selectbox | `FE/src/components/ui/selectbox.tsx` | [selectbox.md](selectbox.md) |
| Icon (Font Awesome Free) | `FE/src/components/ui/icon.tsx` | [icon.md](icon.md) |
| Pagination | `FE/src/components/common/pagination.tsx` | [pagination.md](pagination.md) |
| AdminLayout | `FE/src/components/layouts/admin-layout.tsx` | [admin-layout.md](admin-layout.md) |
| AccountMenu | `FE/src/components/navigation/account-menu.tsx` | [account-menu.md](account-menu.md) |
| Avatar | `FE/src/components/ui/avatar.tsx` | [avatar.md](avatar.md) |

Button, Input, Combobox và Selectbox hỗ trợ `size="sm" | "md" | "lg"`; xem [quy tắc size](sizes.md) cho kích thước mặc định, variant unstyled và htmlSize native. Không đổi font 14px theo size. Icon có kích thước đồ họa 16/18/24px theo tài liệu riêng.

Khi generate/sửa màn hình, đọc mục lục này và áp dụng tài liệu của component được sử dụng. Tái sử dụng component trước khi tạo mới. Khi thêm hoặc thay đổi API common, cập nhật tài liệu tại đây và thêm vào bảng trên. Không đưa repository, quyền nghiệp vụ hoặc logic của page vào component UI.

Phân biệt control: Input nhập không có gợi ý; Combobox nhập tự do có gợi ý native; Selectbox chỉ chọn từ options. Giữ font token 14px, label/validation rõ và props/ref native. Các control đã tích hợp vào Header, Auth, Explore, Library và bộ chọn mùa Detail.

Kiểm tra riêng form controls: `FE/tests/form-controls.browser.mjs` export `verifyFormControls(browser, baseURL)`. Chạy cùng các bộ hồi quy theo [hướng dẫn browser](../routes.md#kiểm-chứng). Test kiểm tra liên kết datalist, gợi ý từ kết quả, nhập ngoài gợi ý, form/query, empty, Back và Selectbox options; không khẳng định việc hiển thị popup native trên mọi nền tảng.

Quay lại [mục lục rules](../readme.md).
