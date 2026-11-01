# Template đặc tả module BE

Dùng khi muốn ghi yêu cầu chi tiết. Quy trình chung vẫn theo [module-generation.md](module-generation.md); trường đã có trong contract không cần chép lại. Mục bỏ trống kế thừa tài liệu đã chốt, không tự biến đề xuất thành quyết định.

```text
Đọc và thực thi DOC/docs-BE/prompts/module-generation.md.

MODULE: <tên theo DOC/docs-BE/modules.md>
MỤC TIÊU: <hành vi đầu vào/đầu ra người dùng cần>
PHẠM VI: <endpoint/nghiệp vụ cần làm, phần loại trừ nếu có>
CÔNG NGHỆ: C# / ASP.NET Core Web API Controller / PostgreSQL / EF Core theo setup.md
CONTRACT: <mục trong DOC/api-contract.md; thay đổi đã được xác nhận nếu có>
HANDOFF FE: <mục/flow/repository trong DOC/fe-backend-handoff.md>
HIỆN TRẠNG: <API đã có cần tái sử dụng; phần mới chưa triển khai>
QUYẾT ĐỊNH CÒN MỞ: <lựa chọn nghiệp vụ cần chốt trước code phụ thuộc>
DỮ LIỆU: <entity, migration, constraint và fixture cần thiết>
QUYỀN: <guest/user/manage/admin, permission cụ thể, ownership và trạng thái tài nguyên>
NGHIỆP VỤ ĐẶC BIỆT: <quy tắc chưa có trong contract>
TÍCH HỢP FE: <có/không; luồng và adapter liên quan>
NGHIỆM THU: <request/response, lỗi, test database và quyền phải đạt>

Chỉ làm cục bộ. Không đọc .env/credentials hoặc gọi API/model thật khi kiểm tra.
Giữ thay đổi đang có, cập nhật tài liệu và thêm bằng chứng chạy thật.
```

Ví dụ cho module chưa có; nền và API đọc Anime/Mùa/tập đã có:

```text
Đọc DOC/docs-BE/prompts/module-generation.md và tạo module quản trị thể loại.
Lấy flow Admin Genres trong DOC/fe-backend-handoff.md; đặc tả endpoint/DTO/query/lỗi trong contract trước code.
Tái sử dụng Genre đã có; không tạo lại schema/catalog public. Chốt unique/delete/concurrency trong phạm vi.
Áp admin:genre:read/write theo ma trận user/manage/admin; không dùng auth fake ở runtime.
Nếu thiếu Auth, soạn contract và chỉ rõ phụ thuộc, không tự generate mọi module. Chưa sửa FE.
Nghiệm thu khi triển khai: options có unused, usage counts/meta đúng scope, detail/ghi theo contract và constraint/quyền đúng.
```
