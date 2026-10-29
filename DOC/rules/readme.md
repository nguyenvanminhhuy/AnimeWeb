# Quy định chung khi generate màn hình

Thư mục này tập trung các tài liệu quy định cách tạo/cập nhật màn hình FE. Đây là nơi chỉnh quy tắc chung; file trong prompts là cách gọi hoặc template đầu vào.

## Thứ tự áp dụng

Luôn đọc AGENTS.md tại các cấp áp dụng trước. Yêu cầu hiện tại của người dùng được ưu tiên; quyết định đã xác nhận trong DOC/decisions.md được phân biệt với các đề xuất chưa chốt. Nếu tài liệu mâu thuẫn đáng kể với yêu cầu, nêu rõ để giải quyết, không tự đổi nghiệp vụ.

| Tài liệu | Quy định |
| --- | --- |
| [architecture.md](architecture.md) | Kiến trúc FE/BE, luồng dữ liệu và phụ thuộc |
| [fe-structure.md](fe-structure.md) | Vị trí page, feature, component common/ui và pnpm |
| [styling.md](styling.md) | Tailwind, Bootstrap, style common và CSS riêng khi cần |
| [common/readme.md](common/readme.md) | Tài liệu component dùng chung; [Button](common/button.md) cho nút hành động/CTA |
| [routes.md](routes.md) | React Router, route tập trung, navigation, query và returnTo |
| [roles-permissions.md](roles-permissions.md) | API common/me, guest/member, permission và ownership |

## Cách dùng

Người dùng vẫn chỉ cần nói:

> Đọc Anime-Web/DOC/prompts/screen-generation.md và tạo màn hình Trang chủ.

[Prompt thực thi](../prompts/screen-generation.md) sẽ dẫn đến bộ rules này. Không cần gửi lại từng file quy định.

Quy trình nhận diện màn hình, mặc định UI/mock, kiểm chứng và bàn giao nằm trực tiếp trong prompt đó, không có file generate-screen trung gian.

Đặc tả API/entity, roadmap, quyết định, wireframe và lịch sử kiểm chứng giữ tại vị trí tương ứng trong DOC. Không chuyển AGENTS.md khỏi phạm vi áp dụng của nó. Chỉ chỉnh tài liệu rules không tự kích hoạt tạo màn hình.
