# Quy tắc cho Anime-Web

- Tuân thủ AGENTS.md tại SRC; tiếp tục dùng pnpm và lockfile chung.
- Chữ nội dung và control tối thiểu 14px ở thiết lập mặc định (`0.875rem`, token `--aw-font-size-base`); áp dụng [quy tắc font](DOC/rules/styling.md#font-chữ), không thu nhỏ chữ trên mobile để ép bố cục.
- Ưu tiên utility Tailwind tw: trong JSX cho layout/spacing/responsive; dùng tw:text-body cho font token. Chỉ thêm CSS khi component/utility có sẵn chưa đáp ứng, xóa rule bị thay thế; áp dụng [quy tắc style](DOC/rules/styling.md) và các variant max-desktop/tablet/mobile/phone đã cấu hình.
- Khi generate/sửa UI, đọc [DOC/rules/common/readme.md](DOC/rules/common/readme.md) và áp dụng tài liệu component dùng chung tương ứng. Nút hành động/CTA dùng Button theo [DOC/rules/common/button.md](DOC/rules/common/button.md).
- Button có nhãn/icon dùng label/startIcon/endIcon, căn khoảng cách bằng gap chung; children dành cho nội dung tùy biến và không truyền cùng label. Nút icon-only cần aria-label trên Button.
- Ô nhập dùng [Input](DOC/rules/common/input.md), nhập tự do có gợi ý dùng [Combobox](DOC/rules/common/combobox.md), danh sách chỉ chọn dùng [Selectbox](DOC/rules/common/selectbox.md). Giữ label, native props/ref và form/query ở feature.
- Common Button/Input/Combobox/Selectbox dùng size sm/md/lg theo [quy tắc size](DOC/rules/common/sizes.md), mặc định md và giữ font 14px. Native size dạng số dùng htmlSize.
- Icon chức năng dùng common [Icon với Font Awesome Free](DOC/rules/common/icon.md), registry named imports; không thêm CDN/Kit hoặc ký tự Unicode thay icon. Giữ nhãn truy cập trên Button/Link và ẩn icon trang trí.
- Danh sách có phân trang dùng [Pagination chung](DOC/rules/common/pagination.md), truyền label và URL builder giữ query; không viết lại dãy số trang hoặc điều hướng thủ công trong page.
- Khi generate/sửa màn hình hoặc navigation, bắt buộc đọc và áp dụng [DOC/rules/routes.md](DOC/rules/routes.md). Đăng ký route tập trung tại FE/src/routes; dùng React Router và các URL builder sẵn có.
- Sau khi tạo hoặc sửa code FE, chạy `pnpm --filter anime-web-fe run format` từ SRC trước khi bàn giao. Không dựa vào thao tác Save của editor để format file do công cụ ghi.
- Chạy `pnpm --filter anime-web-fe run format:check` để xác nhận định dạng. Build FE cũng kiểm tra định dạng trước typecheck/build.
- Dùng cấu hình Prettier đã cài trong FE; không tải formatter bằng dlx hoặc thêm formatter khác khi không cần.
- Không format lại lịch sử trong DOC/verification.md hoặc tài liệu kiểm chứng cũ; chỉ thêm kết quả mới.
