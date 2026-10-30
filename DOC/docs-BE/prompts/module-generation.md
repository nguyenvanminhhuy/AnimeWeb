# Quy trình thực thi generate module backend

Cách gọi: **“Đọc DOC/docs-BE/prompts/module-generation.md và tạo module [tên module].”** Tên gọi đối chiếu [modules.md](../modules.md). Nếu yêu cầu chỉ đọc/review, chỉ làm tài liệu; không tự triển khai.

## 1. Khảo sát

1. Đọc AGENTS.md tại các cấp, [mục lục BE](../readme.md), [rules](../rules/readme.md), [quyết định chung](../../decisions.md) và [setup](../setup.md).
2. Kiểm tra git status, source BE, solution/csproj, global.json, local tool manifest và test hiện có; giữ nguyên thay đổi của người dùng. Không đọc `.env`, cấu hình có bí mật hoặc credentials.
3. Đọc [API contract](../../api-contract.md), [entity](../../entities.md), [kiến trúc](../architecture.md), [database](../database.md), [quyền](../auth-permissions.md), [tích hợp](../integration.md) và [kiểm thử](../testing.md). Đọc source FE liên quan để xác định DTO thực tế, không suy đoán chỉ từ giao diện.
4. Xác định module, endpoint, phụ thuộc và tiêu chí nghiệm thu từ [modules.md](../modules.md). Nếu tên mơ hồ ảnh hưởng phạm vi, hỏi một câu ngắn; vẫn tiếp tục rà soát phần chung.

## 2. Xử lý nền và khoảng trống đặc tả

- Dùng stack đã chốt: C#, ASP.NET Core Web API Controller, PostgreSQL, EF Core, tổ chức theo Features. Setup theo .NET 10 LTS/EF Core 10 và pin phiên bản tương thích; không hỏi lại việc chọn ngôn ngữ/framework/database. Nếu gặp code hiện có khác tài liệu, kiểm tra nguyên nhân trước khi đổi stack hoặc ghi đè code.
- Tách điểm chưa chốt thực sự ảnh hưởng module khỏi phần có thể thực hiện. Ví dụ auth chưa có endpoint; progress chưa chốt xung đột; catalog chưa chốt publication. Chuẩn bị thay đổi contract/fixture cụ thể trước câu hỏi quyết định khi có thể.
- Không yêu cầu xác nhận lại các quyền người dùng đã cấp. Các lựa chọn triển khai thông thường trong stack/phạm vi đã chốt tự xử lý và ghi giả định nếu cần.
- Nếu cần nền để module chạy, thực hiện phần nền tối thiểu trong phạm vi được giao; không generate các module nghiệp vụ không liên quan. Không dùng fake auth ở runtime để lấp thiếu xác thực.

## 3. Triển khai

1. Cập nhật đặc tả endpoint/DTO/validation/lỗi được thống nhất trước hoặc cùng thay đổi code; giữ API/entity một bản dùng chung.
2. Tạo EF Core configuration/migration/seed theo phạm vi, service/policy, DTO/validation và ControllerBase + ApiController. Dùng DbContext scoped; repository riêng chỉ khi có trách nhiệm cần tách. Chuẩn hóa lỗi binding/validation, auth và exception theo envelope của contract.
3. Áp dụng common/me, publication của cha/con và permission/ownership tại server. Không nhận userId/role/status ngoài trường hợp contract cho phép rõ.
4. Tách provider adapter, fake cho test; xử lý sources rỗng, timeout/lỗi và URL hết hạn. Không gọi dịch vụ thật trong kiểm tra.
5. Chỉ sửa FE nếu yêu cầu tích hợp bao gồm việc đó. Khi cần, dùng API adapter/mapper và giữ mock; áp dụng rules/format FE.

## 4. Kiểm chứng

- Chạy dotnet format, kiểm tra --verify-no-changes, dotnet build và dotnet test theo setup; build thay bước typecheck riêng. Test xUnit/HTTP qua WebApplicationFactory và PostgreSQL test cho constraint/migration. Dùng local tool manifest cho dotnet-ef; không bịa lệnh hoặc báo đã chạy khi chỉ viết tài liệu.
- Kiểm tra happy path, input sai, empty/not found và lỗi phụ thuộc. Với API riêng tư, thêm guest/blocked/thiếu quyền/hai user ownership. Kiểm tra ràng buộc database và ghi đồng thời khi module có upsert.
- Chạy server/database kiểm thử cục bộ và fake provider; không reset dữ liệu thật hoặc gọi API/model thật.
- Sửa lỗi trong phạm vi rồi chạy lại kiểm tra liên quan. Nếu môi trường thiếu điều kiện, ghi rõ lệnh thất bại/chưa chạy và nguyên nhân, không báo hoàn tất kiểm thử.

## 5. Bàn giao

Cập nhật trạng thái trong docs-BE và thêm bằng chứng thật vào `DOC/docs-BE/verification.md` (tạo khi có kiểm tra BE). Giữ lịch sử cũ. Ghi endpoint đã có, migration, lệnh chạy thật, cấu hình placeholder, kết quả và giới hạn còn lại.

Trả lời ngắn về thay đổi, cách chạy và kiểm chứng. Chỉ đánh dấu module đã triển khai khi endpoint/nghiệp vụ trong phạm vi thực sự hoạt động; code khung hoặc fake riêng lẻ không phải module hoàn chỉnh. Việc generate không tự cho phép deploy, push hoặc kết nối dữ liệu thật ngoài yêu cầu.
