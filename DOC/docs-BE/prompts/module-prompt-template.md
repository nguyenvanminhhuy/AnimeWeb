# Template đặc tả module BE

Dùng khi muốn ghi yêu cầu chi tiết. Quy trình chung vẫn theo [module-generation.md](module-generation.md); trường đã có trong contract không cần chép lại. Mục bỏ trống kế thừa tài liệu đã chốt, không tự biến đề xuất thành quyết định.

```text
Đọc và thực thi DOC/docs-BE/prompts/module-generation.md.

MODULE: <tên theo DOC/docs-BE/modules.md>
MỤC TIÊU: <hành vi đầu vào/đầu ra người dùng cần>
PHẠM VI: <endpoint/nghiệp vụ cần làm, phần loại trừ nếu có>
CÔNG NGHỆ: C# / ASP.NET Core Web API Controller / PostgreSQL / EF Core theo setup.md
CONTRACT: <mục trong DOC/api-contract.md; thay đổi đã được xác nhận nếu có>
DỮ LIỆU: <entity, migration, constraint và fixture cần thiết>
QUYỀN: <guest/member, permission, ownership và trạng thái tài nguyên>
NGHIỆP VỤ ĐẶC BIỆT: <quy tắc chưa có trong contract>
TÍCH HỢP FE: <có/không; luồng và adapter liên quan>
NGHIỆM THU: <request/response, lỗi, test database và quyền phải đạt>

Chỉ làm cục bộ. Không đọc .env/credentials hoặc gọi API/model thật khi kiểm tra.
Giữ thay đổi đang có, cập nhật tài liệu và thêm bằng chứng chạy thật.
```

Ví dụ sau này, khi nền và publication đã được chốt:

```text
Đọc DOC/docs-BE/prompts/module-generation.md và tạo module danh mục anime.
Phạm vi: GET common/anime, common/anime/:slug và common/genres theo contract.
Dùng stack và publication đã xác nhận trong DOC/decisions.md; chưa sửa FE.
Nghiệm thu: filter kết hợp, input sai, phân trang, empty và anime không công khai.
```
