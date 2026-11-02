# Nhập dữ liệu anime công khai cho database local

Nguồn: [anime-offline-database — manami-project](https://github.com/manami-project/anime-offline-database), bản phát hành [2026-27](https://github.com/manami-project/anime-offline-database/releases/tag/2026-27), snapshot ngày 2026-07-04. Đây là dataset metadata, không phải database tài khoản hoặc kho video.

## Nhập hoặc chạy lại

Mở Docker Desktop, chạy BE bằng `dotnet run` để PostgreSQL dev hoạt động. Trong terminal khác tại `Anime-Web/BE`:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/import-public-catalog.ps1
```

Script chỉ nhắm database Docker local `127.0.0.1:54329/animeweb_dev`, user `animeweb_dev`, container `animeweb-be-postgres-1`. Dùng lại cơ chế mật khẩu dev đã lưu hoặc `ANIMEWEB_DB_PASSWORD` được cấp trong terminal. Không ghi plaintext vào source. Không tạo API import công khai.

Tải snapshot khoảng 62 MB một lần vào `BE/.local/imports`, đã gitignore. SHA256 bắt buộc:

```text
395be786fb2f98f1fca9e963911b9332110098a080e7e2569902bbc5641d1a41
```

Build importer sang output riêng để không ảnh hưởng API đang chạy trên Windows; nhập bằng CLI Development `--import-public-catalog <snapshot-path>`, không khởi động HTTP server thứ hai. Ghi nguồn/release/hash/license/thời điểm vào `.local/imports/provenance.json` sau khi thành công. Snapshot lỗi checksum bị từ chối trước khi ghi database; nếu tải dở, xóa riêng file snapshot đó rồi chạy lại.

## Cách chọn và ánh xạ

- Chọn tối đa 100 anime có MAL ID, poster HTTPS trên CDN MyAnimeList, năm/trạng thái/format hợp lệ. Bỏ nhãn hentai/erotica/pornography, loại trùng ID/tên. Ưu tiên anime đã/đang phát hành, sau đó điểm arithmeticMean giảm dần của snapshot và ID để thứ tự ổn định. Điểm chỉ dùng chọn dữ liệu, không biến thành lượt xem/rating nội bộ.
- ID `anime_mal_<MAL ID>` giữ liên kết nguồn; slug là tên chuẩn hóa kèm `-mal-<MAL ID>`. Title/synonyms, poster URL, năm, format, trạng thái lấy từ dataset. `FINISHED/ONGOING/UPCOMING` thành `completed/airing/upcoming`; type thành chữ thường. Phim mới được published để API common/FE hiển thị.
- Ánh xạ các genre quen thuộc sang tên tiếng Việt, gom các alias sci-fi/science fiction; tái dùng genre theo slug hoặc tên để giữ uniqueness. Không nhập toàn bộ tag tùy ý thành genre.
- Không có synopsis, banner, tên mùa/tập, video hoặc phụ đề trong nguồn nên không tự tạo những phần này. Không suy ra các entry franchise là các mùa của một phim. Ảnh chỉ lưu URL từ snapshot, không tải/copy ảnh vào repo.
- Một transaction và advisory lock cho một lượt nhập. Bỏ qua phim có cùng ID/slug/tên hoặc synonym đã tồn tại; không ghi đè thay đổi admin, không xóa phim, genre, tài khoản hoặc dữ liệu cá nhân. Số phim thực thêm có thể dưới 100 khi có trùng. Chạy lại cùng snapshot không tạo thêm các phim đã nhập.
- Không tự chạy importer khi `dotnet run`; việc nhập dữ liệu là thao tác chủ động. Không tự migrate/reset database.

## Nguồn và giấy phép

Attribution: **Contains information from anime-offline-database by manami-project, made available under the Open Database License (ODbL) 1.0 and Database Contents License (DbCL) 1.0.**

- [Giấy phép của snapshot](https://github.com/manami-project/anime-offline-database/blob/2026-27/LICENSE).
- [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/), [DbCL 1.0](https://opendatacommons.org/licenses/dbcl/1-0/).
- Đây là bộ dữ liệu phái sinh đã chọn lọc/ánh xạ. Khi xuất bản hoặc phân phối phần dữ liệu này, giữ attribution và thực hiện các nghĩa vụ ODbL/DbCL tương ứng, gồm share-alike đối với database phái sinh khi áp dụng. Snapshot không cập nhật thời gian thực.
- Giấy phép dataset không cấp quyền phát hành video hoặc phụ đề, cũng không chuyển giao quyền đối với hình ảnh anime được tham chiếu. Importer không thêm nguồn phát.

Kết quả thực tế và các giới hạn kiểm tra được ghi bổ sung tại [verification.md](verification.md).
