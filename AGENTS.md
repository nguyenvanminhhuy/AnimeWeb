# Quy tắc cho Anime-Web

- Tuân thủ AGENTS.md tại SRC; tiếp tục dùng pnpm và lockfile chung.
- Khi generate/sửa màn hình hoặc navigation, bắt buộc đọc và áp dụng [DOC/rules/routes.md](DOC/rules/routes.md). Đăng ký route tập trung tại FE/src/routes; dùng React Router và các URL builder sẵn có.
- Sau khi tạo hoặc sửa code FE, chạy `pnpm --filter anime-web-fe run format` từ SRC trước khi bàn giao. Không dựa vào thao tác Save của editor để format file do công cụ ghi.
- Chạy `pnpm --filter anime-web-fe run format:check` để xác nhận định dạng. Build FE cũng kiểm tra định dạng trước typecheck/build.
- Dùng cấu hình Prettier đã cài trong FE; không tải formatter bằng dlx hoặc thêm formatter khác khi không cần.
- Không format lại lịch sử trong DOC/verification.md hoặc tài liệu kiểm chứng cũ; chỉ thêm kết quả mới.
