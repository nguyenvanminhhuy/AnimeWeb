# Quy tắc generate code backend

Áp dụng khi tạo/sửa code trong `BE/`. Đọc AGENTS.md tại SRC, Anime-Web và thư mục con nếu có. Yêu cầu hiện tại của người dùng được ưu tiên; chỉ xem lựa chọn đã xác nhận trong [decisions.md](../../decisions.md) là quyết định dự án.

## Nguồn đặc tả

| Trách nhiệm | Tài liệu |
| --- | --- |
| Công nghệ và nền BE | [setup.md](../setup.md) |
| Phạm vi module | [modules.md](../modules.md) |
| Kiến trúc/phụ thuộc | [architecture.md](../architecture.md) |
| Model, constraint, migration | [database.md](../database.md), [entities.md](../../entities.md) |
| HTTP/DTO/lỗi | [api.md](../api.md), [api-contract.md](../../api-contract.md) |
| Phiên, permission, ownership | [auth-permissions.md](../auth-permissions.md) |
| Adapter và khoảng cách FE | [integration.md](../integration.md) |
| Nghiệm thu | [testing.md](../testing.md) |

## Cấu trúc và phạm vi

- Source BE nằm trong `BE/`; dùng module theo nghiệp vụ, controller/service/repository và DTO theo [architecture.md](../architecture.md). Theo convention của framework đã chọn, không tạo abstraction không được sử dụng.
- Tái sử dụng code sẵn có. Không ghi đè thay đổi chưa commit hoặc tự thay stack đã triển khai. Không generate tất cả module khi chỉ được yêu cầu một module.
- Tách model lưu trữ khỏi DTO công khai. Không đưa cấu trúc riêng của provider/ORM vào hợp đồng FE.
- Chỉ thêm dependency cần dùng. Với Node, dùng pnpm@11.10.0 và lockfile tại SRC; không tạo workspace/lockfile riêng hoặc dùng npm/npx/yarn. CLI đã cài chạy bằng pnpm exec.
- Không tự thêm API quản trị, thanh toán, rating, upload hay nguồn phim ngoài phạm vi.

## HTTP và dữ liệu

- Giữ prefix, method, DTO, pagination và mã lỗi theo contract. Validate params/query/body tại server; định nghĩa rõ trường được phép ghi để tránh nhận userId/role/status ngoài hợp đồng.
- Không đổi contract âm thầm để khớp code. Khi thiếu hành vi ảnh hưởng FE, cập nhật đề xuất và nêu điểm cần quyết định trước phần code phụ thuộc; phần độc lập vẫn tiếp tục.
- Common chỉ trả nội dung công khai, gồm kiểm tra tài nguyên cha. Anime.status là trạng thái phát hành, không thay cho publication.
- Me lấy userId từ phiên đã xác thực, kiểm tra active/permission/ownership. Không tin actor hoặc quyền do FE cung cấp, không dùng auth demo làm xác thực thật.
- Constraint duy nhất/khóa ngoại được thực thi tại database; transaction cho thao tác liên quan. Migration có phiên bản, seed giả lập tái lập được. Không tự reset/xóa dữ liệu thật.
- UTC ISO 8601 trong response, ID string ổn định; thứ tự phân trang có khóa phụ ổn định. Không lưu URL phát tạm làm định danh tập.

## Cấu hình và kiểm chứng

- Không đọc `.env`/credentials. File cấu hình mẫu chỉ chứa placeholder; cấu hình test dùng giá trị giả và tài nguyên cục bộ được kiểm soát.
- Provider bên ngoài được bọc adapter và thay bằng fake khi kiểm tra; không gọi API/model thật.
- Không log mật khẩu, hash, token, cookie hoặc URL ký có bí mật; không trả stack trace cho FE. Timeout và lỗi provider được ánh xạ rõ.
- Dùng formatter/test runner của stack đã chọn. Chạy format, kiểm tra định dạng, typecheck/build nếu áp dụng và test có ý nghĩa cho thay đổi. Không ghi PASS khi chưa chạy.
- Nếu sửa code FE để tích hợp, áp dụng rules FE và chạy format/format:check từ SRC theo AGENTS.md.
- Thêm bằng chứng vào `DOC/docs-BE/verification.md` khi thực sự kiểm tra BE; giữ nguyên lịch sử. Ghi lệnh, kết quả, fixture và giới hạn. Tài liệu kế hoạch không phải bằng chứng triển khai.
