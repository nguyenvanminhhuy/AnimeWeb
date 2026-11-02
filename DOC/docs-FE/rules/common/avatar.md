# Avatar dùng chung

Source `FE/src/components/ui/avatar.tsx`; nhận `name: string`, `src?: string|null` và `size?: 'sm' | 'md' | 'lg'` (mặc định md). Có src thì hiển thị ảnh object-cover trong khung tròn. Không có ảnh hoặc tải lỗi thì lấy chữ viết tắt đầu/cuối tên, chuẩn hóa NFC và chữ hoa tiếng Việt; tên rỗng dùng TK. Khi src đổi, thử tải ảnh mới. Common không tự fetch profile hoặc upload.

| Size | Kích thước mặc định | Mục đích |
| --- | --- | --- |
| sm | 32 × 32px | Vị trí gọn |
| md | 36 × 36px | Menu Header/AdminLayout |
| lg | 80 × 80px | Phần tóm tắt hồ sơ |

Avatar là hình trang trí, luôn aria-hidden vì nơi gọi đã có tên hoặc aria-label trên nút. Không dùng Avatar làm hành động trực tiếp; bọc trong Button/Link có tên truy cập khi cần. Chữ viết tắt lớn ở size lg là phần đồ họa; label/nội dung vẫn theo rule font 14px.

Dùng Tailwind và ControlSize chung, không có CSS riêng. AccountMenu, ProfileOverview, admin users và bình luận dùng chung Avatar. AvatarEditor thuộc feature profile, dùng [API ảnh đại diện](../../../docs-BE/account-avatar.md); không chuyển logic canvas/file/version vào common Avatar.
