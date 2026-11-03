# Cải thiện UI/UX — 2026-11-03

Phạm vi đã chốt: palette hiện tại, font base 14px, chức năng/API/phân quyền giữ nguyên. Triển khai dựa trên critique bằng mock; không gọi API thật hoặc sửa BE.

## Control và điều hướng

- Input/Combobox/Selectbox giữ border mặc định/invalid và không box-shadow. `:focus-visible` có outline tím nhạt 2px, offset 3px; không tắt focus bàn phím ở page.
- Liên kết nội bộ dùng arrow-right; external-link dành cho ra ngoài. Dashboard ghi rõ “Xem danh mục công khai” khi dẫn sang `/anime`.
- Nút carousel có vùng tương tác 44px và chấm hiển thị nhỏ bằng pseudo-element; nút hiện mật khẩu có vùng chạm tối thiểu 44px. Không thêm dependency.

## Responsive và thứ tự nội dung

- Header giữ avatar-only và ba hàng trên phone; giảm spacing, giữ ô tìm kiếm luôn hiện và navigation có vùng chạm 44px. Tablet giữ cách wrap hiện có; desktop giữ một hàng.
- Khám phá rút intro còn tiêu đề và một câu dẫn. Search một hàng, bốn filter luôn hiện: bốn cột desktop, hai cột dưới breakpoint tablet. Không thêm collapse/drawer cho filter. Sort/pageSize và query/debounce/IME giữ nguyên.
- Danh sách admin dùng cùng một table/rows/callbacks và guard; dưới 768px mỗi hàng trình bày như card. Header cột vẫn trong cây accessibility; `data-label` và `.aw-admin-record-value` tạo nhãn/value trên card. Giữ đầy đủ trường, icon actions cùng hàng, min target 44px. Từ 768px giữ bảng với cuộn ngang nội bộ nếu cần. CSS dùng chung ở `styles/common/responsive-table.css`; không tạo bản sao mobile riêng hoặc gọi lại repository.
- Áp dụng cho anime, thể loại, users, tập phim, nguồn phát, bình luận, recent Dashboard, audit và bảng request vận hành. Pagination admin trên/dưới giữ nguyên; pageSize chỉ thanh trên. Audit/operations có thể empty/error trong mock, không bịa dữ liệu vận hành.
- Home: Featured → Tiếp tục xem khi có → Mới cập nhật → Top 10 → Đề xuất. Dashboard đặt recent trước Top 10. Ranking mobile cuộn ngang theo [common](rules/common/top-viewed-anime.md), giữ đủ dữ liệu.
- Detail: poster + title/meta trên mobile, CTA và trạng thái nguồn toàn chiều rộng; Mùa & tập trước Câu chuyện. Thông tin chi tiết theo sau nội dung chính trên mobile, Bình luận vẫn đầy đủ. Season/query/returnTo/favorite/playback giữ nguyên.
- Thư viện ẩn summary cards dưới 768px; ba tabs kèm count và cho wrap, không giảm cỡ chữ. Từ 768px vẫn có summary. Search/sort/pagination và các bộ sưu tập không đổi.
- Giảm kicker/câu dẫn trang trí ở các section được sửa; tên phim đậm hơn, giữ khung hai dòng cố định và ảnh có aspect-ratio. Heading dùng tracking tương đối, spacing nhóm theo nhịp 8/12/16/24/32px.

## Kiểm tra

`FE/tests/uiux-polish.browser.mjs` export `verifyUiuxPolish(browser, baseURL)`. Chỉ chạy với Vite mock (`VITE_API_MODE=mock`), dùng Chromium đã cài ở workspace qua pnpm. Script chặn mọi request API `/api/` và origin ngoài; kiểm tra 375/768/1440px, focus, carousel/ranking, filter AND, season/comments, library tabs/avatar, guest/admin chỉ đọc/có quyền ghi và hai pagination. Screenshot tại `FE/test-results/uiux-*.png` (gitignored). Các bộ hồi quy hiện có tiếp tục kiểm tra chức năng chi tiết; kết quả thực tế nối thêm tại [verification](verification.md).
