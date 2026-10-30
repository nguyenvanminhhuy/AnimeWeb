# Prompt generate backend

Các prompt là hướng dẫn cho lần yêu cầu thực thi sau; lưu tài liệu không tự kích hoạt cài đặt hoặc viết BE.

## Cách dùng nhanh

Chỉ cần tên module, dùng [module-generation.md](module-generation.md):

```text
Đọc DOC/docs-BE/prompts/module-generation.md và tạo module danh mục anime.
```

Prompt nhận tên trong [modules.md](../modules.md), đọc đặc tả và kiểm tra phụ thuộc. Stack C#/ASP.NET Core Controller/PostgreSQL/EF Core đã chốt; khi BE chưa có nền, thiết lập theo [setup.md](../setup.md), không hỏi lại lựa chọn công nghệ này.

## Thiết lập nền

```text
Đọc DOC/docs-BE/prompts/module-generation.md và thiết lập nền BE.
Dùng C#, ASP.NET Core Web API Controller, PostgreSQL và EF Core theo quyết định đã chốt.
Thiết lập solution theo DOC/docs-BE/setup.md và kiểm tra code hiện có trước khi tạo file.
Chỉ triển khai cục bộ, cập nhật tài liệu và ghi bằng chứng kiểm tra thực tế.
```

## Chỉ review trước khi code

```text
Đọc DOC/docs-BE/readme.md, DOC/api-contract.md và DOC/entities.md.
Đối chiếu module [tên module] với code FE/BE hiện có.
Chỉ rà soát tài liệu: liệt kê phần thiếu/mâu thuẫn, đề xuất contract và tiêu chí test.
Chưa cài thư viện hoặc viết backend; không ghi đề xuất thành quyết định đã chốt.
```

## Đặc tả chi tiết

Dùng [module-prompt-template.md](module-prompt-template.md) nếu cần giới hạn endpoint, migration hoặc hành vi cụ thể. Không bắt buộc điền template cho mỗi module.
