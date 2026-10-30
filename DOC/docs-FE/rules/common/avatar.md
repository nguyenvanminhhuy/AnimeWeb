# Avatar dùng chung

Source `FE/src/components/ui/avatar.tsx`; nhận `name: string` và `size?: 'sm' | 'md' | 'lg'` (mặc định md). Avatar lấy chữ viết tắt đầu/cuối tên, chuẩn hóa NFC và chữ hoa tiếng Việt; tên rỗng dùng TK. Không gọi API hoặc tải ảnh ngoài.

| Size | Kích thước mặc định | Mục đích |
| --- | --- | --- |
| sm | 32 × 32px | Vị trí gọn |
| md | 36 × 36px | Menu Header/AdminLayout |
| lg | 80 × 80px | Phần tóm tắt hồ sơ |

Avatar là hình trang trí, luôn aria-hidden vì nơi gọi đã có tên hoặc aria-label trên nút. Không dùng Avatar làm hành động trực tiếp; bọc trong Button/Link có tên truy cập khi cần. Chữ viết tắt lớn ở size lg là phần đồ họa; label/nội dung vẫn theo rule font 14px.

Dùng Tailwind và ControlSize chung, không có CSS riêng. AccountMenu và ProfileOverview dùng chung component này để giữ hình thức/chữ viết tắt nhất quán; chưa có API upload/chọn ảnh đại diện.
