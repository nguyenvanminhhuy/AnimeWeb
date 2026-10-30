# Lịch sử kiểm chứng

Chỉ ghi thao tác đã chạy và kết quả quan sát được. Giữ nguyên các mục lịch sử; thêm mục mới khi có kiểm chứng mới.

## 2026-10-23 — Chuẩn bị tài liệu

- Đọc quy tắc SRC trước khi thực hiện; kiểm tra không có AGENTS.md bổ sung trong Anime-Web.
- Kiểm tra cấu trúc hiện có: FE, BE, DOC; chưa có source ứng dụng.
- Đọc pnpm-workspace.yaml: hiện nhận các package con trực tiếp bằng `*`.
- Tạo tài liệu đề xuất; chưa thay đổi cấu hình pnpm, chưa cài dependencies.
- Chưa có build, test ứng dụng hoặc kiểm tra trình duyệt. Các endpoint và ví dụ trong tài liệu chưa được triển khai hoặc gọi thử.

Kết quả kiểm tra file/liên kết tài liệu được bổ sung sau khi chạy kiểm tra.

### Kết quả kiểm tra tài liệu

- Chạy kiểm tra bằng PowerShell: liệt kê đệ quy `*.md`, đọc UTF-8 để phát hiện file rỗng, dùng regex lấy liên kết Markdown tới `.md` và `Test-Path` để xác nhận đích.
- Kết quả: 9 tài liệu, 8 liên kết Markdown được kiểm tra, 0 liên kết hỏng, không có tài liệu rỗng.
- Kiểm tra số file trong FE và BE: cả hai đều bằng 0; chưa tạo code ứng dụng.
- Không gọi API/model thật, không đọc .env hay credentials trong quá trình kiểm tra.

## 2026-10-23 — Tạo khung thư mục FE

- Đọc lại AGENTS.md ở SRC và kiểm tra không có AGENTS.md bổ sung trong Anime-Web.
- Tạo 20 đường dẫn thư mục FE theo kiến trúc, có `.gitkeep` tại các thư mục lá để Git lưu lại cấu trúc.
- Kiểm tra bằng PowerShell `Test-Path -PathType Container`: cả 20 đường dẫn đều tồn tại.
- Kiểm tra `Test-Path` với FE/package.json và FE/node_modules: đều False. Chưa cài dependency, chưa tạo script chạy ứng dụng.
- Chưa sửa workspace hoặc lockfile; chưa chạy install, build hoặc kiểm thử ứng dụng vì bước này chỉ tạo cấu trúc.
- Thêm DOC/FE-STRUCTURE.md hướng dẫn vai trò các thư mục và cách dùng pnpm sau khi thiết lập package.

## 2026-10-23 — Bổ sung component common

- Tạo FE/src/components/common/.gitkeep để giữ thư mục trong Git.
- Chạy `Test-Path -LiteralPath Anime-Web/FE/src/components/common/.gitkeep -PathType Leaf`: True.
- Liệt kê thư mục components bằng Get-ChildItem: có common, navigation và ui.
- Cập nhật FE-STRUCTURE.md và ARCHITECTURE.md để phân biệt common, ui, navigation và component theo feature.
- Chỉ thay đổi cấu trúc và tài liệu; không cài dependency hoặc chạy kiểm thử ứng dụng.

## 2026-10-24 — API common, role và permission

- Cập nhật API-CONTRACT v0.2, entity RBAC/bình luận, quyết định, roadmap, wireframe, kiến trúc, hướng dẫn FE và prompt; thêm ROLES-PERMISSIONS.md.
- Chạy kiểm tra PowerShell: Get-ChildItem tìm Markdown, đọc UTF-8 và dùng regex/Test-Path xác nhận liên kết. Kết quả: 11 tài liệu, 14 liên kết Markdown, 0 liên kết hỏng, không có file rỗng.
- Kiểm tra regex các route GET danh mục cũ thiếu prefix common trong bảng API: không còn route vi phạm.
- Dùng regex lấy các code block JSON trong API-CONTRACT.md và ConvertFrom-Json: cả 6 ví dụ parse thành công.
- FE có 0 file source ngoài .gitkeep, BE có 0 file; không triển khai xác thực hoặc phân quyền thực tế ở bước này.
- Không cài dependency, không gọi API/model thật hoặc đọc .env/credentials. Các tình huống kiểm tra quyền trong tài liệu là kế hoạch, chưa phải kiểm thử runtime đã chạy.

## 2026-10-24 — Prompt khung cho từng màn hình

- Tạo DOC/prompts/SCREEN-PROMPT-TEMPLATE.md: khối yêu cầu theo màn hình, quy tắc source/common, quyền common/me, mock, pnpm, kiểm chứng và bàn giao; có ví dụ Khám phá chưa được thực thi.
- Bổ sung liên kết từ DOC/README.md và DOC/prompts/README.md.
- Chạy kiểm tra PowerShell Get-ChildItem, regex và Test-Path: 12 tài liệu, 16 liên kết Markdown, 0 liên kết hỏng, không có file rỗng.
- Kiểm tra code fence trong prompt: 4 dấu mở/đóng, cân bằng. Rà soát bằng đọc nội dung để phân biệt template với lệnh triển khai ngay, giữ lựa chọn stack chưa chốt và mặc định không xuất bản.
- FE vẫn có 0 file source ngoài .gitkeep; BE có 0 file. Chưa thực thi prompt sinh màn hình, chưa cài dependencies hoặc chạy build/test ứng dụng.

## 2026-10-24 — Prompt chỉ cần tên màn hình

- Thêm DOC/prompts/GENERATE-SCREEN.md với bảng nhận diện màn hình, route, mặc định UI/mock, khởi tạo nền FE khi được yêu cầu thực thi và quy tắc tái sử dụng common.
- Cập nhật mục lục; giữ template chi tiết làm lựa chọn nâng cao.
- Kiểm tra liên kết bằng PowerShell regex/Test-Path: 13 tài liệu, 18 liên kết Markdown, 0 liên kết hỏng.
- Đếm file FE ngoài .gitkeep: 0. Chỉ tạo tài liệu, chưa chạy prompt hoặc sinh code màn hình; không cài dependencies hay gọi API thật.

## 2026-10-24 — Cài Tailwind và Bootstrap 5, style common

- Đọc AGENTS.md áp dụng; kiểm tra FE chưa có package.json/config/source ứng dụng trước khi thiết lập.
- Thêm package điều phối anime-web và package anime-web-fe; nhận diện Anime-Web/FE trong pnpm-workspace.yaml tại SRC. Chỉ dùng pnpm@11.10.0 và lockfile chung.
- Cài Bootstrap 5.3.8, Tailwind/@tailwindcss/vite 4.3.3; nền tối thiểu React 19.3.1, Vite 8.3.4, TypeScript 5.9.3. Chưa triển khai router hoặc màn hình nghiệp vụ anime.
- Chạy tại SRC: `pnpm install` thành công; `pnpm install --frozen-lockfile` thành công (6 workspace projects, Already up to date).
- `pnpm --filter anime-web-fe run build` ban đầu pass typecheck/build nhưng có cảnh báo @charset từ Bootstrap nằm trong cascade layer. Tắt optimize riêng của plugin Tailwind, normalize @charset bằng PostCSS trước bước tối ưu của Vite; build lại thành công và không còn cảnh báo.
- Kiểm tra browser lần đầu phát hiện Bootstrap p-4 có !important chặn padding responsive Tailwind ở 768px. Thay spacing trên phần tử đó bằng tw:p-6 và tw:md:p-8; bổ sung quy tắc tránh trộn utility cùng thuộc tính trong STYLING.md.
- Kiểm tra browser dùng Chromium và @playwright/test đã có ở package react-snapshot-effect-ref-lab, không thêm dependency test/browser mới cho FE. Lệnh kiểm tra đầu tiên dùng node -e lỗi quoting trên PowerShell, lần tiếp theo import playwright không được vì package không khai báo trực tiếp; sửa bằng stdin và import @playwright/test.
- Chạy bản production bằng `pnpm --filter anime-web-fe run preview --port 4174 --strictPort`, sau đó truyền script qua stdin vào `pnpm --filter react-snapshot-effect-ref-lab exec node --input-type=module -`.
- Kết quả Chromium cuối: HTTP 200, heading React render; ở 375/768/1440px không tràn ngang, Bootstrap badge có background rgb(25,135,84), common surface rgb(25,28,43), Tailwind flex/gap 12px/max-width 672px; padding responsive lần lượt 24/32/32px. Không có pageerror hoặc request ngoài; mọi request ngoài localhost bị chặn khi kiểm tra.
- Đã đối chiếu tài liệu chính thức Tailwind/Vite, Preflight/prefix và Bootstrap/Vite trước khi cài; tra registry chỉ phục vụ chọn/cài dependencies. Không gọi API/model thật của ứng dụng, không đọc .env hoặc credentials. Vite envDir=false để không tự nạp .env trong giai đoạn này.
- Tạo styles/common/index.css và surfaces.css, cập nhật prompt sinh màn hình, cấu trúc và quyết định. Kiểm tra liên kết tài liệu trước bước ghi log: 14 tài liệu, 20 liên kết Markdown, 0 liên kết hỏng. Liên kết STYLING.md bổ sung trong README trỏ tới file đã kiểm tra.
- Đây là kiểm chứng nền CSS/React, chưa phải kiểm chứng các chức năng anime, đăng nhập hoặc phân quyền.

## 2026-10-24 — Tập trung quy định sinh màn hình trong rules

- Tạo DOC/rules/README.md; chuyển ARCHITECTURE.md, FE-STRUCTURE.md, STYLING.md và ROLES-PERMISSIONS.md vào DOC/rules.
- Chuyển nội dung quy định chi tiết của prompt tạo màn hình sang rules/SCREEN-GENERATION.md. Giữ prompts/GENERATE-SCREEN.md làm điểm gọi ngắn gọn để người dùng tiếp tục chỉ gửi tên màn hình.
- Template nâng cao dẫn đến bộ rules thay vì lặp lại các mục quy định; cập nhật mục lục, API/entity, roadmap, quyết định và prompt giai đoạn.
- Chạy PowerShell regex/Test-Path kiểm tra Markdown: 16 tài liệu, 46 liên kết, 0 liên kết hỏng. Kiểm tra bốn file đã chuyển tồn tại ở rules và không còn tại đường dẫn gốc.
- Tìm bằng rg các đường dẫn DOC/STYLING.md, DOC/ARCHITECTURE.md, DOC/FE-STRUCTURE.md và DOC/ROLES-PERMISSIONS.md ngoài VERIFICATION.md: không có kết quả (exit 1 của rg nghĩa là không khớp).
- Giữ nguyên nội dung lịch sử kiểm chứng trước đó, kể cả tên đường dẫn được sử dụng lúc kiểm tra cũ. Chỉ sắp xếp tài liệu; không thay đổi source FE/BE, dependencies hoặc chạy lại build/test ứng dụng.

## 2026-10-24 — Đổi tên tài liệu sang chữ thường

- Đổi tên 16 tài liệu Markdown trong DOC và thư mục con sang chữ thường bằng Rename-Item qua tên tạm, phù hợp với Windows khi chỉ thay đổi hoa/thường.
- Cập nhật liên kết và tên file tham chiếu trong tài liệu/prompt hiện hành. Không đổi tên các thư mục FE/BE/DOC hoặc AGENTS.md ở SRC.
- So sánh SHA256 verification trước/sau thao tác đổi tên: nội dung lịch sử không đổi; chỉ bổ sung mục kiểm chứng mới này.
- Kiểm tra bằng PowerShell: cả 16 tên file đều là chữ thường; 46 liên kết Markdown có đích tồn tại và tên file khớp chính xác cả hoa/thường. Không còn tham chiếu tên tài liệu chữ hoa ngoài lịch sử; AGENTS.md giữ đúng tên quy định.
- Điểm gọi prompt hiện tại là Anime-Web/DOC/prompts/generate-screen.md. Chỉ đổi tài liệu, không thay đổi ứng dụng hoặc dependencies.

## 2026-10-24 — Dùng trực tiếp prompt screen-generation

- Theo yêu cầu mới, xóa DOC/prompts/generate-screen.md và chuyển DOC/rules/screen-generation.md sang DOC/prompts/screen-generation.md.
- File screen-generation giữ nội dung quy trình đầy đủ, cập nhật cách gọi và liên kết trực tiếp tới bốn tài liệu quy định trong rules.
- Cập nhật mục lục và template hiện hành, giữ nguyên lịch sử cũ trong verification.md.
- Kiểm tra bằng PowerShell regex/Test-Path: 15 tài liệu, 40 liên kết Markdown hợp lệ và khớp chữ hoa/thường. Đường dẫn prompt cũ và vị trí rules/screen-generation không còn; không còn tham chiếu cũ ngoài lịch sử.
- Chỉ thay đổi tài liệu, không chạy prompt sinh màn hình hoặc sửa source ứng dụng.

## 2026-10-24 — Triển khai màn hình Trang chủ

- Đọc prompt screen-generation, AGENTS.md và các tài liệu entity/API/wireframe/rules. FE ban đầu chỉ có trang xác nhận thiết lập; không có AGENTS.md bổ sung trong Anime-Web. Giữ nguyên thay đổi ngoài dự án.
- Thêm HomePage ở `/`, MainLayout/Header, FeaturedBanner, AnimeCard, ContinueWatching, Artwork fallback, ContentState; hook → repository contract → mock adapter. Thêm local adapter schema v1 và SessionProvider guest/member với hai tài khoản demo tách dữ liệu.
- Dùng tên trung tính Anime Web, màu nhấn tím, nội dung hư cấu và SVG cục bộ theo mặc định prompt; không gọi AI để tạo asset. Màn hình đích có thông báo tối thiểu và đường về; chưa triển khai Khám phá/Chi tiết/Player/Thư viện đầy đủ. Không triển khai BE, video, deploy hoặc đăng nhập thật.
- Chạy tại SRC `pnpm install --frozen-lockfile`: thành công, 6 workspace projects, Already up to date, pnpm 11.10.0. Không thay dependencies hoặc lockfile.
- `pnpm --filter anime-web-fe run build` thành công (gồm `tsc --noEmit` và Vite). Chạy lại sau sửa CSS layer và metadata: thành công, 31 modules, không có cảnh báo build.
- Dev server xác nhận `http://127.0.0.1:4174/` bằng `pnpm --filter anime-web-fe run dev --port 4174 --strictPort`.
- Chạy FE/tests/home.browser.mjs qua stdin Node bằng `pnpm --filter react-snapshot-effect-ref-lab exec node --input-type=module -`, tái sử dụng Chromium/@playwright/test đã có. Lần đầu selector heading trùng h1/h3; sửa selector level để kiểm tra đúng banner.
- Kiểm tra browser ban đầu chức năng pass nhưng ảnh chụp/computed styles phát hiện CSS trang được nạp trước khai báo layer, làm Bootstrap ghi đè nút và h3. Chuyển import CSS trang vào styles/index.css sau khai báo thứ tự layer; thêm kiểm tra computed font h3 13px và nền nút rgb(172,154,247), chạy lại toàn bộ: PASS.
- Kết quả Chromium: 375/768/1440px không tràn ngang; 10 card, asset tải thành công. Carousel, lọc đề xuất/query/reload, guest không thấy lịch sử, yêu thích yêu cầu login, thành viên có hai tiến độ mẫu, yêu thích giữ sau reload, tài khoản mới không thấy lịch sử/yêu thích tài khoản trước, đăng xuất xóa state cá nhân: PASS.
- Tìm kiếm chuyển query sang route đích thông báo; mở trực tiếp/reload, guard thư viện cho guest, route không tồn tại, returnTo ngoài origin bị đổi về `/`, loading/empty/error/retry, session JSON lỗi và ảnh hỏng dùng fallback: PASS. Không có pageerror hoặc request ngoài origin; mọi request ngoài bị chặn trong test.
- Xem ảnh desktop/mobile và lưu ảnh tại FE/test-results/home-375.png, home-768.png, home-1440.png (gitignore). Giới hạn: kiểm tra Chromium, chưa chạy trình duyệt khác hoặc công cụ audit accessibility tự động.
- Chạy production preview `pnpm --filter anime-web-fe run preview --port 4175 --strictPort`. Smoke test lần đầu timeout vì PowerShell pipe chuyển tiếng Việt inline thành dấu `?`; đặt OutputEncoding UTF-8 và chạy lại với finally đóng browser: PASS Trang chủ, query mock bị bỏ qua trong production, CSS nút, direct route `/anime/hanh-trinh-anh-sao` và reload.
- Không đọc .env/credentials, không gọi API/model/video thật. envDir=false được giữ. Playback chưa được triển khai/kiểm chứng; lịch sử là fixture có nhãn rõ. Hướng dẫn chạy và kiểm tra tái lập tại home-screen.md.
- Kiểm tra liên kết Markdown sau khi bổ sung hướng dẫn: 16 tài liệu, 0 liên kết hỏng. `git diff --check -- Anime-Web` trả exit 0; lưu ý Anime-Web hiện là thư mục untracked trong workspace, nên lệnh diff không đánh giá các file mới chưa stage.

## 2026-10-28 — Triển khai màn hình Khám phá

- Đọc lại AGENTS.md tại SRC, screen-generation.md, readme/decisions/entities/API/wireframe và bộ rules. Không tìm thấy AGENTS.md bổ sung trong Anime-Web. Giữ nguyên thay đổi ngoài phạm vi.
- Thêm ExplorePage tại `/anime`, ExploreFilters và Pagination dùng chung. Tái sử dụng AnimeCard, Artwork/ảnh fallback, ContentState, MainLayout/Header và SessionProvider. Mở rộng AnimeRepository.list và fixture chung từ 8 lên 24 anime hư cấu; giữ ID/slug và các nhóm Trang chủ cũ.
- Dùng query URL cho tìm kiếm tên Việt/Anh, không phân biệt dấu; bộ lọc thể loại/năm/trạng thái/định dạng; sort năm mới nhất/tên A–Z; 12 hoặc 24 item mỗi trang. GET form và liên kết gốc giữ router hiện tại. Parse/serialize query, chấp nhận tên thể loại tiếng Việt từ link Trang chủ cũ, bỏ giá trị sai và giới hạn trang theo kết quả.
- Chuyển CSS thẻ anime/skeleton dùng chung từ HomePage.css sang styles/common/catalog.css, thêm common/pagination.css; CSS riêng ExplorePage đăng ký qua entry CSS hiện có. Không thêm dependency, API, BE hoặc asset ngoài. Header login giữ returnTo của trang/query đang mở.
- Chạy tại SRC `pnpm install --frozen-lockfile`: thành công, 7 workspace projects, Already up to date, pnpm 11.10.0. Không cập nhật phiên bản package manager, dependencies hoặc lockfile.
- `pnpm --filter anime-web-fe run build` chạy thành công trước kiểm tra browser. Chạy lại sau sửa label và tách CSS chung: typecheck thành công, Vite build thành công với 36 modules, không có cảnh báo build.
- Dev server: `pnpm --filter anime-web-fe run dev --port 4174 --strictPort`, xác nhận `http://127.0.0.1:4174/anime`.
- Thêm FE/tests/explore.browser.mjs, chạy cùng verifyHome bằng stdin vào `pnpm --filter react-snapshot-effect-ref-lab exec node --input-type=module -`, dùng Chromium/@playwright/test có sẵn. Những lần đầu kiểm tra select timeout: label bọc cả select khiến tên label dùng để tìm chính xác gồm thêm text option. Tách label và select thành sibling, giữ htmlFor/id; helper kiểm tra URL đích sau chọn thay vì chỉ chờ navigation.
- Kết quả cuối Explore: PASS tại 375/768/1440px, không tràn ngang, grid 2/3/6 cột; bộ lọc mobile thu gọn mặc định và mở bằng bàn phím; tìm không dấu/tên Anh/Enter; lọc kết hợp, về trang 1, bỏ từng điều kiện, xóa tất cả; sort tên vi/năm; thay pageSize; trang 1/2 không trùng ID, đủ 24 mục; reload/Back/Forward giữ kết quả; page vượt giới hạn và query sai được chuẩn hóa; thể loại tên Việt chuyển sang slug.
- PASS loading/empty/error/retry, không có kết quả và nút xóa lọc, link card tới thông báo Chi tiết; guest và member nhận cùng danh mục, login giữ query và logout không đổi danh mục; ảnh hỏng dùng fallback. Không có pageerror hoặc request ngoài origin; test chặn mọi request ngoài.
- Kiểm tra hồi quy verifyHome chạy lại toàn bộ: PASS banner, responsive, lọc, guest/member, yêu thích, tách tài khoản, đăng xuất, tìm kiếm/reload, route, mock state, returnTo, storage lỗi và fallback. Test cũ không bị đổi để bỏ qua chức năng.
- Chụp và xem ảnh desktop/mobile; ảnh cuối tại FE/test-results/explore-375.png, explore-768.png, explore-1440.png, được gitignore.
- Production: `pnpm --filter anime-web-fe run preview --port 4175 --strictPort`; Chromium smoke PASS direct `/anime`, query lọc kết hợp và reload, mock=error bị bỏ qua, màu nút primary rgb(172,154,247), không request ngoài hoặc pageerror.
- Cập nhật readme, home-screen, architecture/fe-structure và thêm explore-screen.md với lệnh kiểm tra tái lập. Kiểm tra PowerShell regex/Test-Path: 17 tài liệu Markdown, 48 liên kết, 0 liên kết hỏng.
- Giữ nguyên lịch sử kiểm chứng cũ. Mặc định 12 item/trang, sort theo năm và thiết kế tối/tím là lựa chọn triển khai, chưa phải thay đổi API/thương hiệu đã chốt. Chưa kiểm thử trình duyệt khác, API thật hoặc playback; Chi tiết/Xem/Thư viện vẫn là thông báo tối thiểu. Không đọc .env/credentials hoặc gọi API/model thật.

## 2026-10-28 — Cấu hình format tự động

- Kiểm tra AGENTS.md áp dụng, settings VS Code và package scripts. Workspace trước đó chưa cấu hình formatOnSave/defaultFormatter; FE chưa có dependency/script formatter. `code --list-extensions` xác nhận đã có esbenp.prettier-vscode.
- Đối chiếu tài liệu chính thức Prettier/install và prettier-vscode; `pnpm view prettier version` trả 3.9.10. Cài phiên bản chính xác vào FE bằng `pnpm --filter anime-web-fe add --save-dev --save-exact prettier@3.9.10` từ SRC. Tiếp tục dùng pnpm 11.10.0 và pnpm-lock.yaml chung.
- Chạy `pnpm install` rồi `pnpm install --frozen-lockfile` từ SRC: thành công, 7 workspace projects, Already up to date. Không tạo lockfile hoặc store khác.
- Thêm FE/.prettierrc.json, FE/.prettierignore, script format/format:check tại FE và script điều phối tại Anime-Web. Script build kiểm tra format trước typecheck/build. Ignore loại trừ môi trường, node_modules, build/test output và artwork SVG; không chạy formatter trên DOC.
- Bật format khi lưu và chọn Prettier cho JS/JSX/TS/TSX/JSON/JSONC/CSS/HTML tại SRC/.vscode/settings.json; giữ cSpell.words hiện có. Thêm extension recommendation. Đây là cấu hình workspace SRC; không có kiểm chứng thao tác Save trong UI editor ở bước này.
- Thêm Anime-Web/AGENTS.md yêu cầu chạy format sau khi tạo/sửa code và trước bàn giao; file ghi trực tiếp từ công cụ không phụ thuộc sự kiện Save của VS Code. Không thêm watcher chạy nền.
- `pnpm --filter anime-web-fe run format`: thành công, định dạng lại source/config/test FE hiện có, không sửa lịch sử kiểm chứng hoặc artwork. `pnpm --filter anime-web-fe run build`: format:check PASS, typecheck PASS, Vite build PASS (36 modules, không có cảnh báo).
- Chỉ đổi định dạng và cấu hình quy trình; không chạy lại browser suite cho thay đổi này. Không đọc .env/credentials, không gọi API/model thật. Bổ sung hướng dẫn và liên kết tài liệu chính thức trong rules/styling.md.

## 2026-10-28 — Cấu hình cSpell cho tiếng Việt và URL

- Kiểm tra các cảnh báo người dùng gửi trong Header, DestinationPage, ExploreFilters, FeaturedBanner và ExplorePage: đều thuộc cSpell, không phải TypeScript. `Flibrary` đến từ chuỗi URL `%2Flibrary`; `khóa` là từ tiếng Việt và `VIETSUB` là thuật ngữ dự án.
- Xác nhận máy đã có code-spell-checker 4.10.0 và extension Vietnamese 2.0.1. Đọc cấu hình dictionary đã cài: locale vi kích hoạt dictionary vi-vn.
- Thêm Anime-Web/cspell.json với language en,vi, words chứa VIETSUB và ignoreRegExpList chỉ bỏ qua mã percent-encoding `%xx`. Không thêm Flibrary vào từ điển, không tắt cSpell hoặc thay nội dung/URL ứng dụng. Thêm recommendations cho hai extension cSpell tại workspace.
- PowerShell parse JSON và xác nhận language, từ VIETSUB, regex khớp đúng `%2F`: PASS. `pnpm --filter anime-web-fe run format:check` PASS, `pnpm --filter anime-web-fe run typecheck` PASS.
- Chưa xác nhận trực tiếp danh sách Problems sau khi extension VS Code tải lại cấu hình. Không cài thêm dependency, không đọc .env/credentials hoặc gọi API/model thật.

### Bổ sung từ tiếng Việt còn bị cảnh báo

- Người dùng xác nhận cSpell vẫn cảnh báo `khóa` sau cấu hình language en,vi. Việc bật locale trước đó chưa đủ giải quyết từ này trong editor; chưa xác định được nguyên nhân từ dictionary hay việc nạp dictionary.
- Thêm trực tiếp `khóa` (đúng chuỗi được báo) vào words của Anime-Web/cspell.json. Giữ nguyên UI và các quy tắc kiểm tra chính tả khác.
- PowerShell ConvertFrom-Json và kiểm tra words chứa chính xác `khóa`: PASS. Chỉ sửa từ điển dự án, không thay source FE hoặc chạy lại build/browser; chưa xác nhận trực tiếp Problems trong VS Code.

## 2026-10-28 — Chuyển navigation sang React Router

- Theo yêu cầu người dùng: cài react-router-dom 7.18.5, tạo FE/src/routes/paths.ts và router.tsx để quản lý pattern, URL builders, returnTo và route registry tập trung. Đối chiếu tài liệu chính thức React Router; pnpm view xác nhận version 7.18.5, Node >=20, React/ReactDOM >=18 phù hợp nền hiện tại.
- App chỉ còn SessionProvider và RouterProvider; một createBrowserRouter quản lý Home, Explore, anime/:slug, watch/:episodeId, library, login và wildcard. MainLayout dùng Outlet/ScrollRestoration. Các màn hình đích vẫn là thông báo tối thiểu; không triển khai thêm chức năng phim/BE.
- Chuyển toàn bộ liên kết nội bộ sang Link/NavLink và tìm kiếm/lọc sang Form React Router. Header active theo router; URL nội bộ dùng paths. Chỉ còn thẻ a cho skip link #main-content. Kiểm tra rg không còn window.location hoặc history.pushState/replaceState trong source FE.
- Home và Explore dùng useSearchParams, dữ liệu phản ứng theo query thay vì chỉ đọc lúc mount. Explore bỏ kết quả cũ, đồng bộ lại input/select khi Back/Forward và giữ kết quả đã có khi chỉ chuẩn hóa page vượt giới hạn; canonical URL dùng navigate replace. SessionProvider giữ phiên khi chuyển SPA, bao gồm trường hợp localStorage không ghi được.
- Cài tại SRC bằng pnpm --filter anime-web-fe add --save-exact react-router-dom@7.18.5. pnpm tự thêm minimumReleaseAgeExclude cho react-router-dom@7.18.5 và react-router@7.18.5 vào workspace trong lúc cài; giữ store/lockfile chung và packageManager pnpm@11.10.0. pnpm install và pnpm install --frozen-lockfile sau đó đều thành công, 7 workspace projects, Already up to date.
- Chạy pnpm --filter anime-web-fe run format và build (gồm format:check/typecheck): PASS. Bản cuối Vite 46 modules, CSS 248.04 kB và JS 351.47 kB trước gzip, không có cảnh báo build.
- Dev server xác nhận http://127.0.0.1:4174/ bằng pnpm --filter anime-web-fe run dev --port 4174 --strictPort. Dùng Chromium/@playwright/test đã có trong workspace, chạy verifyExplore, verifyHome và verifyNavigation qua stdin vào pnpm --filter react-snapshot-effect-ref-lab exec node --input-type=module -.
- Lần đầu test SPA đọc kết quả cũ vì URL đổi trước khi React commit view mới; cập nhật test Explore chờ snapshot query của kết quả khớp URL và dữ liệu đã tải, Home chờ nút thể loại active. Kiểm tra page=999 còn phát hiện một lần tải lại thừa sau clamp; giữ response tương ứng cả query yêu cầu và query page đã chuẩn hóa để không xóa kết quả khi replace URL. Không bỏ các assertion nghiệp vụ.
- Kết quả cuối: verifyExplore PASS toàn bộ responsive 375/768/1440, tìm/lọc/sort/pageSize, phân trang, reload/Back/Forward, query sai/clamp, mock state/retry, guest/member và ảnh fallback. verifyHome PASS toàn bộ hồi quy Trang chủ, yêu thích, session, tách tài khoản, đăng xuất và fallback.
- verifyNavigation mới PASS: marker trong window giữ nguyên và chỉ có 1 document request cho chuỗi Home → Explore → Form search → Back/Forward → chi tiết → login → library → logout. Menu active và giá trị form khớp query. Mô phỏng Storage.setItem ném lỗi vẫn giữ phiên trong SPA và logout cập nhật guard Thư viện ngay.
- Production preview tại http://127.0.0.1:4175/ bằng pnpm --filter anime-web-fe run preview --port 4175 --strictPort. verifyNavigation PASS trên bản production. Smoke direct/reload PASS cho Explore có query, Chi tiết, Watch, Library guest, Login và unknown route nhiều segment; returnTo ngoài origin, protocol-relative, backslash và login/login trailing slash đều trở về /. Không có pageerror; test chỉ cho request local.
- Thêm DOC/rules/routes.md, nối từ AGENTS.md, mục lục rules, readme và prompt screen-generation để lần generate sau bắt buộc áp dụng. Cập nhật cấu trúc FE/kiến trúc/style, Home/Explore và ghi quyết định đã được người dùng xác nhận. Kiểm tra Markdown: 18 tài liệu, 55 liên kết nội bộ, 0 liên kết hỏng.
- Giữ nguyên lịch sử kiểm chứng trước đây. Không đọc .env/credentials, không gọi API/model thật, không deploy. Chưa kiểm tra browser khác; production hosting về sau cần SPA fallback về index.html.

## 2026-10-28 — Triển khai màn hình Thư viện

- Đọc prompt screen-generation, AGENTS.md áp dụng, rules/routes và các tài liệu entity/API/wireframe/kiến trúc/style/permission. Không có AGENTS.md bổ sung bên trong FE. Giữ thay đổi ngoài phạm vi.
- Thêm LibraryPage tại /library, thay route placeholder trong registry React Router và bỏ nhánh library không còn dùng trong DestinationPage. Dùng Link/Form/useSearchParams và paths hiện có, không thêm router hoặc dependency.
- Thêm feature library gồm LibraryCard/useLibrary, types và parser/builder tab/q/sort/page. Tái sử dụng AnimeCard, Artwork fallback, Pagination, ContentState, SessionProvider/MainLayout/Header và asset SVG cục bộ. AnimeRepository.getByIds cùng mock adapter lấy danh mục theo ID cá nhân, không truy cập localStorage từ JSX.
- Yêu thích dùng chung danh sách với Trang chủ; Đang xem suy ra từ tiến độ mới nhất mỗi anime chưa hoàn thành; Lịch sử là từng episode đã lưu, gồm cả tập hoàn thành. Bỏ yêu thích giữ nguyên lịch sử/tiến độ. Chưa có LibraryEntry.status riêng hoặc API thật; giả định này được ghi rõ trong library-screen.md, không biến thành quyết định nghiệp vụ.
- SessionProvider cấp permission own mặc định cho member demo. Guest không thấy số lượng/dữ liệu và login giữ returnTo cả query; trang kiểm tra quyền trước khi lấy dữ liệu và chỉ hiện thao tác favorite khi có quyền ghi. Cache riêng của trang được bỏ khi mất phiên/quyền, kết quả request cũ bị bỏ qua. Demo mock forbidden không cấp thêm quyền hoặc role.
- Local adapter schema v1 giữ tương thích dữ liệu cũ, bổ sung completed/updatedAt tùy chọn và cho phép positionSeconds bằng durationSeconds. Không gán timestamp mới cho lịch sử cũ. ContinueWatching trên Trang chủ bỏ tập đã hoàn thành. Dữ liệu cá nhân vẫn tách theo viewer/newcomer; storage lỗi có thông báo và fallback fixture an toàn đúng tài khoản.
- Dev server http://127.0.0.1:4174/ đã đang chạy; mở và kiểm tra /library bằng Chromium. Chạy verifyLibrary trong FE/tests/library.browser.mjs qua stdin vào pnpm --filter react-snapshot-effect-ref-lab exec node --input-type=module -, tái sử dụng Chromium/@playwright/test có sẵn.
- Lần kiểm tra đầu selector getByLabel cho ô tìm bị trùng aria-label của nút submit; đổi selector test sang role searchbox, giữ nguyên UI. Lần chạy cuối verifyLibrary PASS: guest/returnTo, favorite chung với Home và persist sau reload, bỏ favorite không xóa lịch sử, phân biệt completed/watching/history, responsive 375/768/1440px không tràn ngang, phân trang 8 item và tự clamp khi xóa hết trang cuối, tìm không dấu/sort/back/forward/reload và query sai.
- PASS loading/empty/error/retry/forbidden; guest và trạng thái thiếu quyền không có card/tóm tắt riêng; tài khoản mới không thấy dữ liệu viewer, query userId không đổi chủ dữ liệu; logout ẩn dữ liệu ngay; JSON lỗi và mô phỏng Storage.setItem ném QuotaExceededError được xử lý; ảnh hỏng dùng fallback. Không có pageerror hoặc request ngoài origin; test chặn request ngoài.
- Xem ảnh desktop/mobile; lưu tại FE/test-results/library-375.png, library-768.png, library-1440.png (gitignore). Dữ liệu nhiều trang/completed chỉ seed trong browser context test riêng, không sửa phiên của người dùng.
- Chạy pnpm --filter anime-web-fe run format; pnpm --filter anime-web-fe run build: format:check, typecheck và Vite build PASS (51 modules, CSS 254.13 kB, JS 362.67 kB trước gzip, không cảnh báo). pnpm install --frozen-lockfile tại SRC PASS, 7 workspace projects, Already up to date, pnpm 11.10.0; không thay dependencies/lockfile.
- Hồi quy verifyHome, verifyExplore và verifyNavigation: tất cả PASS; giữ kiểm tra SPA một document, active menu, session khi storage không khả dụng và guard cập nhật khi logout, cùng chức năng Trang chủ/Khám phá đã có.
- Production preview http://127.0.0.1:4175/ dùng bản build mới. Chromium smoke PASS: guest → login giữ query → History, query mock=forbidden bị bỏ qua trong production, reload giữ hai tiến độ mẫu, thêm/bỏ favorite và lịch sử không đổi, logout về guest không còn dữ liệu. Không pageerror hoặc request ngoài.
- Thêm library-screen.md, cập nhật readme/home-screen/architecture/fe-structure/routes và hướng dẫn chạy test. Kiểm tra trước bước ghi log: 19 tài liệu Markdown, 59 liên kết nội bộ, 0 liên kết hỏng; liên kết library-screen bổ sung trong fe-structure trỏ tới file đã kiểm tra.
- Giữ nguyên lịch sử kiểm chứng cũ. Không đọc .env/credentials, không gọi API/model/video thật, không deploy. Chưa kiểm tra browser khác hoặc playback; route Xem/Chi tiết vẫn là thông báo tối thiểu. Thư viện là demo cục bộ, chưa có xác thực/phân quyền BE hoặc ghi tiến độ từ player.

## 2026-10-28 — VS Code nhận diện CSS entry của Tailwind

- Người dùng báo css-semicolonexpected/css-lcurlyexpected tại prefix(tw) và source('../') trong FE/src/styles/index.css. Các chẩn đoán thuộc CSS language mode mặc định, trong khi file dùng cú pháp Tailwind v4.
- Đọc metadata/README của extension đã cài bradlc.vscode-tailwindcss 0.16.0: có language id tailwindcss và hướng dẫn files.associations. Đọc hướng dẫn documentSelectors của Prettier extension 12.4.0 để giữ formatter cho language mode tùy chỉnh.
- Thêm association chỉ cho **/Anime-Web/FE/src/styles/index.css sang tailwindcss trong SRC/.vscode/settings.json, defaultFormatter Prettier cho tailwindcss và prettier.documentSelectors cho đúng file. Thêm extension recommendation Tailwind. Không tắt CSS validation toàn workspace hoặc sửa cú pháp/import/layer của source.
- pnpm --filter anime-web-fe run build: format:check PASS, typecheck PASS, Vite build PASS (51 modules, không cảnh báo). Không thay source FE/dependency hoặc chạy lại browser suite cho thay đổi editor settings.
- PowerShell ConvertFrom-Json và assertion association/formatter/selector/recommendation: PASS. Chưa kiểm chứng trực tiếp Problems/language mode sau khi VS Code tải lại settings; có thể cần mở lại file hoặc Developer: Reload Window.
- Cập nhật rules/styling.md; giữ lịch sử cũ. Không đọc .env/credentials hoặc gọi API/model thật.

## 2026-10-28 — Đăng nhập và Đăng ký demo

- Đọc lại screen-generation, AGENTS.md, rule route, các tài liệu nghiệp vụ/kiến trúc/style/permission và source phiên demo. Chỉ triển khai hai màn hình được yêu cầu, không tạo BE hoặc auth thật.
- Thêm LoginPage tại /login và RegisterPage tại /register trong router registry. Thay login placeholder, giữ hai nút tài khoản mẫu để bảo toàn các luồng cũ. AuthScreen/AuthForm/PasswordField và useAuthForm được dùng chung; artwork SVG cục bộ và MainLayout/Header giữ thiết kế hiện có. CSS AuthPages.css được nạp qua styles/index.css.
- Form có validate tên/email/mật khẩu/xác nhận, lỗi theo input/aria-describedby, focus lỗi đầu, hiện/ẩn mật khẩu, pending, khóa submit trùng và hủy tác vụ khi unmount. Login/Register chuyển qua lại giữ returnTo; safeReturnTo từ chối cả login/register, gồm hoa/thường hoặc segment encoded. Header cũng giữ đích quay về khi đang ở hai trang auth.
- Thêm AuthRepository và LocalDemoAuthRepository tại data layer. Contract cố ý không nhận password; form chỉ dùng password/confirmation trong state để kiểm tra UI và xóa khi thành công. Không lưu hash/password, không có HTTP POST hoặc API xác thực. Email chỉ chọn hồ sơ demo; quy tắc mật khẩu bất kỳ đủ độ dài được giải thích rõ trên form và trong auth-screens.md.
- Registry aw:profiles:v1 chỉ lưu ID, displayName, email đã chuẩn hóa. Hồ sơ đăng ký có local-UUID và thư viện aw:account:v1:<id> riêng, không dùng chung newcomer. SessionProvider khôi phục hồ sơ hợp lệ trước khi mở phiên, giữ tương thích viewer/newcomer/session v1 và quyền member own mặc định. Registry sai không bị ghi đè âm thầm, lỗi quota báo thất bại thay vì giả vờ đăng ký thành công; hai fixture vẫn dùng được khi registry lỗi.
- Dev server http://127.0.0.1:4174/ và preview http://127.0.0.1:4175/ đã đang chạy. Chạy verifyAuth bằng Chromium/@playwright/test có sẵn, qua stdin vào pnpm --filter react-snapshot-effect-ref-lab exec node --input-type=module -.
- Lần test đầu selector tìm link Đăng nhập kèm ký tự mũi tên bị timeout vì mũi tên đã aria-hidden; sửa test tìm link bằng tên accessible trong aw-auth-switch. Không đổi UI để né assertion.
- verifyAuth cuối PASS: /login và /register ở 375/768/1440px không tràn ngang; validate/focus, toggle mật khẩu, email chưa có/trùng fixture, xác nhận không khớp, loading/double-submit chỉ tạo một hồ sơ, normalize email case, đăng ký hai hồ sơ có thư viện riêng, reload khôi phục hồ sơ/thư viện và login demo chọn lại đúng hồ sơ. Tên không ngắt dài 40 ký tự được kiểm tra ở mobile; thêm overflow-wrap vào dòng session/notice dùng chung.
- PASS lỗi thao tác mock và submit lại, hủy đăng ký khi chuyển sang Login không tạo hồ sơ, quota/registry JSON lỗi không tạo phiên hoặc ghi đè registry, fixture fallback, returnTo ngoài origin/protocol-relative/backslash/auth route, ảnh hỏng fallback. Không có pageerror, request ngoài origin hoặc HTTP POST; test xác nhận không có các password giả đã nhập trong localStorage. Test dùng browser context riêng và chỉ dữ liệu giả.
- Chụp và xem ảnh desktop/mobile; lưu login-375/768/1440.png và register-375/768/1440.png tại FE/test-results (gitignore).
- pnpm install --frozen-lockfile tại SRC PASS (7 workspace projects, Already up to date, pnpm 11.10.0). Không thêm dependency hoặc thay lockfile. pnpm --filter anime-web-fe run format rồi build: format:check/typecheck/Vite PASS. Build cuối 60 modules, CSS 258.75 kB, JS 373.67 kB trước gzip, không cảnh báo.
- Hồi quy verifyHome, verifyExplore, verifyLibrary, verifyNavigation: tất cả PASS, gồm phiên mẫu, dữ liệu riêng, storage lỗi, SPA cùng document, direct/reload/back/forward và chức năng các màn hình trước. Sau bổ sung wrap tên dài, chạy lại verifyAuth đầy đủ: PASS.
- Production smoke PASS: direct/reload Register/Login, mock=error bị bỏ qua, đăng ký hồ sơ mới → thư viện rỗng → thêm favorite → reload giữ phiên/thư viện → logout → login email cùng hồ sơ với password demo khác → thấy đúng favorite. Không có HTTP POST/password trong localStorage/pageerror. Test chặn mọi request ngoài origin local.
- Thêm auth-screens.md, cập nhật readme/wireframe, mục Register trong prompt, route table/rule, liên kết tài liệu Thư viện/cấu trúc FE và lệnh verifyAuth. Kiểm tra Markdown: 20 tài liệu, 65 liên kết nội bộ, 0 liên kết hỏng.
- Giữ lịch sử kiểm chứng cũ; không đọc .env/credentials, không gọi API/model thật hoặc deploy. Chưa có xác thực/đăng ký BE, xác minh email, OAuth hay khôi phục mật khẩu; chưa kiểm tra browser khác. Mô hình hồ sơ cục bộ là mặc định FE để hoàn thiện yêu cầu màn hình, không phải quyết định về hệ thống tài khoản thật.

## 2026-10-29 — Chi tiết anime

- Đọc lại AGENTS.md/prompt screen-generation, rule route và các tài liệu entity/API/wireframe/kiến trúc/style/permission. Không có AGENTS.md sâu hơn trong FE. Giữ thay đổi ngoài Anime-Web.
- Thay placeholder /anime/:slug bằng AnimeDetailPage trong router registry; DestinationPage chỉ còn Watch/Not found. Thêm getBySlug vào AnimeRepository, fixture chi tiết dựa trên cùng catalog 24 anime, types Season/Episode, useAnimeDetail và SeasonEpisodes. Giữ các ID tiến độ episode-01-03/episode-02-02 hiện có; ngoại truyện dùng ID không liên tiếp side-a/side-z, UI dùng sortOrder thay vì cộng ID.
- Trang có banner/poster/fallback, tên khác, synopsis, metadata/genre links, yêu thích dùng chung Home/Library, tiến độ mẫu, query chọn mùa, anime liên quan và bình luận. Draft episode không được trả qua repository. Unknown slug có thông báo/đường về; upcoming không có tập, movie có một tập theo mặc định tạm của entities.md.
- Tất cả hasPlayback=false vì chưa có asset video. Hiển thị Chưa có video demo, primary đi đến danh sách tập; link tập được ghi là thông tin tập và mở Watch placeholder có thông báo chưa có video. Không dựng player, URL nguồn phim hoặc nút Xem ngay giả hoạt động. Mô hình nhiều phần và ngoại truyện là fixture FE, chưa trở thành quyết định nghiệp vụ mới.
- Thêm CommentRepository/LocalCommentRepository và feature comments component/hook/types. List chỉ trả visible, loại hidden/deleted cho mọi tài khoản. Member demo có comment:create/update:own/delete:own; UI và adapter kiểm tra ownership/status khi sửa/xóa. Actor lấy từ SessionProvider, form không cho chỉ định userId. Không cấp admin/moderator hoặc triển khai auth/permission BE.
- Bình luận lưu version 1 theo bucket aw:comments:v1:<userId>; nội dung visible là công khai cục bộ trên cùng trình duyệt, không gửi server. Trim 1–2000 ký tự, render plain text bằng React, sửa inline và soft delete với xác nhận/Hủy. commentPage phân trang 5 bài và clamp; query giữ mùa. Storage lỗi không giả lưu thành công, JSON lỗi không bị ghi đè. Đổi anime/tài khoản/logout bỏ draft/edit state, hủy load/write đang chờ.
- Chạy pnpm --filter anime-web-fe run format rồi build: format:check/typecheck/Vite PASS (68 modules; CSS 267.40 kB, JS 396.42 kB trước gzip; không cảnh báo). pnpm install --frozen-lockfile tại SRC PASS (7 workspace projects, Already up to date, pnpm 11.10.0). Không thêm dependency hoặc thay lockfile.
- Dùng dev server đang chạy http://127.0.0.1:4174/. Thêm FE/tests/detail.browser.mjs, chạy Chromium/@playwright/test có sẵn qua stdin vào pnpm --filter react-snapshot-effect-ref-lab exec node --input-type=module -. Test đầu đọc text mới từ textarea trước khi bài đăng đã render; sửa selector chờ nội dung trong article, không bỏ kiểm tra ownership.
- verifyDetail cuối PASS: 375/768/1440px không tràn ngang, 8 tập mùa chính/2 ngoại truyện, draft không xuất hiện, chọn mùa/reload/Back/Forward, ID đích, guest login giữ season, yêu thích đồng bộ Library, tiến độ đúng anime, không có primary xem phim khi chưa có nguồn. Đã xem ảnh desktop/mobile, lưu detail-375.png/detail-768.png/detail-1440.png tại FE/test-results (gitignore).
- PASS đọc fixture visible và không hiện hidden/deleted; tạo/persist/reload/sửa/xóa mềm, Hủy xóa, body dạng HTML chỉ là text không thực thi. Adapter update/remove với actor tài khoản khác đều bị từ chối; UI tài khoản khác không có nút sửa/xóa. Draft không được gửi lại sau logout/login; request create vừa bắt đầu bị hủy khi logout cùng lượt event, không có bản ghi được lưu sau đó. Phân trang bình luận/reload, error/retry/empty/forbidden/loading, quota/corrupt storage/fallback: PASS.
- PASS main loading/error/retry/empty, slug không tồn tại, upcoming/movie, related link chuyển đúng anime trong cùng route. Mock production được tắt. Test chặn mọi request ngoài origin; không pageerror hoặc request ngoài.
- Hồi quy verifyHome, verifyExplore, verifyLibrary, verifyAuth, verifyNavigation: tất cả PASS. Hai assertion heading Chi tiết anime của placeholder cũ trong Explore/Navigation được đổi sang đúng tên anime thật ở route đã mở, giữ kiểm tra URL/SPA và các assertion nghiệp vụ khác.
- Production preview http://127.0.0.1:4175/: smoke PASS direct route/reload, query mock bị bỏ qua, chọn mùa, guest login/returnTo, favorite, tạo bình luận công khai và persist sau reload, unknown slug; không pageerror. Không kiểm chứng playback vì chưa có video.
- Thêm anime-detail-screen.md; cập nhật readme, Home/Explore, architecture/fe-structure và route table/test command. Kiểm tra Markdown: 21 tài liệu, 70 liên kết nội bộ, 0 liên kết hỏng.
- Giữ nguyên lịch sử kiểm chứng cũ. Không đọc .env/credentials, không gọi API/model/video thật hoặc deploy. Chưa kiểm tra browser khác; FE ownership/session vẫn là mô phỏng, không thay kiểm tra BE trong tương lai.

## 2026-10-29 — Button dùng chung và tài liệu common

- Đọc AGENTS.md ở SRC/Anime-Web, rule route, cấu trúc FE, styling và prompt generate; chỉ có AGENTS.md tại gốc Anime-Web trong project. Giữ thay đổi ngoài phạm vi.
- Tạo FE/src/components/ui/Button.tsx theo phân lớp UI hiện tại: variant primary/glass/quiet/unstyled, mặc định native type=button; as=link dùng React Router Link, as=anchor cho hash/ngoài/download. Props union phân biệt button/link/anchor; truyền ref và props gốc xuống phần tử. loading khóa button và đặt aria-busy, nơi gọi tự cung cấp nhãn tiến trình.
- Chuyển nút hành động và CTA trong 14 file page/component hiện có sang Button; giữ Link/NavLink văn bản, menu, phân trang. Nút đặc thù chuyển variant=unstyled để giữ CSS feature. Auth submit dùng loading=pending, giữ spinner/nhãn và cơ chế chống gửi trùng của hook.
- Tách CSS nút từ layout.css vào styles/common/button.css, đăng ký trước layout.css để giữ override responsive của nút tài khoản. Scope quy tắc nền từ .btn sang .aw-button, giữ focus-visible và disabled cho nút unstyled. Quét source: thẻ button thô chỉ còn bên trong implementation Button; không còn class btn aw-btn-* lặp tại nơi gọi.
- Tạo DOC/rules/common/readme.md và button.md, mô tả API, ví dụ, semantics, state, CSS, accessibility và quy tắc generate. Liên kết từ AGENTS.md, prompt screen-generation, rules/readme, styling, fe-structure và DOC/readme để áp dụng cho những lần sau. Kiểm tra 23 tài liệu Markdown/87 liên kết .md nội bộ: không có liên kết hỏng.
- Typecheck đầu phát hiện một thẻ đóng button còn sót trong AuthForm khi chuyển JSX có spinner tự đóng; sửa thành Button. Sau sửa, chạy pnpm --filter anime-web-fe run format và build: PASS format:check, tsc --noEmit, Vite (69 modules; CSS 267.59 kB, JS 396.79 kB trước gzip). Không thêm dependency hoặc thay lockfile.
- Chạy dev http://127.0.0.1:4174, Chromium/@playwright/test có sẵn bằng pnpm --filter react-snapshot-effect-ref-lab exec node --input-type=module -; toàn bộ verifyExplore, verifyHome, verifyNavigation, verifyLibrary, verifyAuth, verifyDetail PASS. Bao gồm responsive 375/768/1440, form/query, SPA/Back/Forward, favorite, account/returnTo, pending/double submit, CRUD bình luận/ownership, mock và lỗi storage. Không sửa các assertion của bộ hồi quy.
- Smoke bổ sung Button tích hợp: PASS tất cả button Trang chủ có type rõ, nút hiện mật khẩu type=button, dùng Space đổi trạng thái mà không submit, focus outline hiện, submit loading có disabled + aria-busy=true, nút tiếp tục dùng Link, mobile account font 11px/padding 9px giữ nguyên. Lần đầu smoke chờ tự về Home sau login bị timeout vì luồng hiện có yêu cầu bấm Tiếp tục; sửa kỳ vọng theo hành vi thật, chạy lại PASS.
- Các browser context độc lập, chặn request ngoài localhost; không đọc .env/credentials hoặc gọi API/model thật. Không deploy, không đổi auth demo/playback. Chưa kiểm tra trình duyệt khác Chromium.

## 2026-10-29 — Font nội dung 16px

- Theo yêu cầu tăng cỡ chữ, thêm quy tắc Font chữ trong rules/styling.md: nội dung/control/metadata/badge tối thiểu 16px ở thiết lập trình duyệt mặc định, không giảm trên mobile; tiêu đề giữ phân cấp lớn hơn. Liên kết rule từ AGENTS.md, prompt screen-generation và common/button.md để áp dụng khi generate sau này.
- Thêm token --aw-font-size-base: 1rem; html font-size 100%, body dùng token và line-height 1.6, select/textarea kế thừa font cùng button/input. Thay font-size cố định dưới 16px trong các stylesheet Home/Explore/Library/Auth/Detail và common bằng token; giữ font tiêu đề/icon lớn hơn. Không dùng important hoặc selector wildcard để ép toàn bộ DOM.
- Chạy pnpm --filter anime-web-fe run format và build: PASS format:check, typecheck, Vite (69 modules; CSS 270.61 kB, JS 396.79 kB trước gzip). Không thêm dependency hoặc thay lockfile.
- Chromium smoke tại http://127.0.0.1:4174: Home, Explore, Detail, Library guest, Login/Register ở 375/768/1440px đều không tràn ngang. Quét phần tử hiển thị có text trên sáu route ở thiết lập mặc định: không có cỡ chữ dưới 16px. Đã xem ảnh Home/Login mobile; ảnh font-* trong FE/test-results được gitignore.
- Hồi quy đầu dừng tại assertion font AnimeCard 13px cũ; cập nhật hai kỳ vọng trong home.browser.mjs và explore.browser.mjs thành 16px theo yêu cầu mới, giữ kiểm tra font thực tế. Chạy lại toàn bộ verifyExplore, verifyHome, verifyNavigation, verifyLibrary, verifyAuth, verifyDetail: tất cả PASS, gồm Library member, responsive, form/navigation, favorites, comment ownership, pending và lỗi storage.
- Kiểm tra 89 liên kết Markdown nội bộ: PASS. Quét CSS source không còn khai báo font-size px dưới 16. Các test dùng context cô lập và chặn request ngoài origin; không đọc .env/credentials, không gọi API/model thật, không deploy. Chưa kiểm tra browser khác Chromium.

## 2026-10-29 — Điều chỉnh chuẩn font xuống 14px

- Theo yêu cầu mới, đổi --aw-font-size-base từ 1rem sang 0.875rem (14px ở thiết lập mặc định), giữ html 100% và phân cấp tiêu đề. Các màn hình/controls đã dùng token tự áp dụng mức mới.
- Đồng bộ rule font trong AGENTS.md, rules/styling.md, common/button.md và prompt screen-generation; đổi kỳ vọng font AnimeCard của Home/Explore thành 14px. Giữ nguyên bằng chứng kiểm chứng 16px trước đây.
- Chạy pnpm --filter anime-web-fe run format và build: PASS format:check, typecheck và Vite.
- Chromium smoke tại http://127.0.0.1:4174: kiểm tra Home, Explore, Detail, Library guest, Login/Register ở 375/768/1440px; body, Button, form control và tiêu đề AnimeCard hiển thị đúng 14px, không tràn ngang hoặc pageerror. Context cô lập, chặn request ngoài origin; không gọi API/model thật, không đọc credentials. Không chạy lại toàn bộ sáu bộ hồi quy cho thay đổi token này.

## 2026-10-29 — Common Input, Combobox, Selectbox

- Đọc AGENTS.md tại SRC/Anime-Web và quy tắc common, cấu trúc FE, font/style; giữ các thay đổi ngoài phạm vi và lịch sử kiểm chứng.
- Tạo components/ui/Input.tsx (native input, default/unstyled), Selectbox.tsx (native select, options hoặc children) và Combobox.tsx (Input + datalist native, nhập tự do). Props/ref native theo React 19, controlled/uncontrolled, aria/validation và form do nơi gọi quản lý. Combobox tạo id riêng bằng useId, lọc chuỗi rỗng/trùng, không gọi API hoặc tự submit.
- Tích hợp Input/Selectbox vào Header, AuthForm, PasswordField, ExploreFilters, ExplorePage, LibraryPage và SeasonEpisodes. Explore search dùng Combobox với gợi ý tiêu đề từ kết quả trang hiện tại; không thêm request catalog. Sort Explore dùng API options của Selectbox; các select còn lại giữ children native. Quét source: input/select thô chỉ còn trong hai implementation UI; textarea bình luận giữ nguyên.
- Thêm styles/common/form-controls.css qua common/index.css trước layout/page: font token 14px, nền tối, placeholder, focus-visible, invalid, disabled/readOnly và mũi tên select. Dùng Input unstyled cho các field shell tìm kiếm đã có, giữ CSS feature và native hidden fields.
- Thêm tài liệu rules/common/input.md, combobox.md, selectbox.md với API, ví dụ, semantics, accessibility, controlled/uncontrolled, CSS và giới hạn native. Cập nhật mục lục common, AGENTS.md, screen-generation prompt, fe-structure, styling, DOC/readme và hướng dẫn browser routes.md. Kiểm tra 26 tài liệu/110 liên kết Markdown nội bộ: không có liên kết hỏng.
- Chạy pnpm --filter anime-web-fe run format và build: PASS format:check, typecheck, Vite (72 modules; CSS 271.60 kB, JS 397.39 kB trước gzip). Không thêm dependency hoặc thay lockfile.
- Thêm FE/tests/form-controls.browser.mjs, export verifyFormControls, chạy Chromium qua pnpm --filter react-snapshot-effect-ref-lab exec node --input-type=module - với server http://127.0.0.1:4174: PASS label/datalist liên kết, gợi ý khớp kết quả/không trùng, tìm theo gợi ý, nhập giá trị ngoài gợi ý, empty suggestions, Back khôi phục q, Selectbox options/onChange giữ q. Không pageerror hoặc request ngoài origin.
- Hồi quy verifyExplore, verifyHome, verifyNavigation, verifyLibrary, verifyAuth, verifyDetail: tất cả PASS. Bao gồm responsive 375/768/1440, native submit/query/Back/Forward, validation/focus/ref password/pending, account storage và chọn mùa/bình luận. Không sửa assertion của sáu bộ hồi quy. Đã xem ảnh Explore mobile sau tích hợp; ảnh test nằm trong test-results được gitignore.
- Combobox dùng popup datalist do trình duyệt quản lý; test xác nhận DOM, form và giá trị, chưa khẳng định popup/screen reader trên mọi nền tảng hoặc browser khác Chromium. Không đọc .env/credentials, không gọi API/model thật hoặc deploy.

## 2026-10-29 — Size cho common controls và Button

- Kiểm tra cả bốn component: trước thay đổi chưa có size giao diện; Input/Selectbox chỉ kế thừa size HTML dạng số. Thêm ControlSize sm/md/lg tại components/ui/control.types.ts, áp dụng cho Button (kể cả Link/anchor), Input, Selectbox; Combobox kế thừa từ Input.
- Input/Selectbox chuyển native size sang htmlSize, không gửi chuỗi sm/md/lg xuống DOM. Không có nơi gọi native size dạng số trong source hiện tại cần di chuyển. Default styled control dùng md; unstyled không truyền size giữ kích thước feature, truyền size rõ sẽ áp dụng kích thước dọc.
- Thêm styles/common/control-sizes.css ở layer overrides sau CSS page để size hoạt động trong các shell hiện có. Min-height sm/md/lg lần lượt 2/2.75/3.25rem (32/44/52px mặc định), padding-block 0.25/0.625/0.875rem; giữ font token 14px, không ép height cố định hoặc đổi padding ngang của password/search. Hidden vẫn ẩn. Không dùng important.
- Thêm rules/common/sizes.md, cập nhật tài liệu Button/Input/Combobox/Selectbox, common readme, styling, AGENTS.md và screen-generation prompt. Quy tắc nêu rõ htmlSize native, default md, unstyled opt-in và cách dùng prop size. Hướng dẫn browser trong routes.md bổ sung verifyControlSizes.
- Chạy pnpm --filter anime-web-fe run format và build: PASS format:check, typecheck, Vite (72 modules; CSS 272.11 kB, JS 397.59 kB trước gzip). Không thêm dependency hoặc thay lockfile.
- Thêm tests/control-sizes.browser.mjs và fixture tests/fixtures/control-sizes.html + jsx. Fixture dùng component thật trong shell CSS Hero/Auth/Explore, không đăng ký route sản phẩm hoặc entry build production. verifyControlSizes PASS ở 375/768/1440: chiều cao sm < md < lg, minimum đúng, default bằng md, font 14px cho Button/button-link/anchor/quiet và cả ba form controls, không rò size chuỗi vào DOM, htmlSize input/select đúng, unstyled opt-in, hidden và FormData giữ giá trị. Không tràn ngang/pageerror. Chạy lại sau format vẫn PASS.
- Hồi quy verifyExplore, verifyHome, verifyNavigation, verifyLibrary, verifyAuth, verifyDetail, verifyFormControls: tất cả PASS, không đổi assertion cũ. Tổng cộng tám bộ browser kiểm chứng. Kiểm tra 27 tài liệu Markdown/121 liên kết nội bộ: không có liên kết hỏng.
- Dùng Chromium sẵn có qua pnpm --filter react-snapshot-effect-ref-lab exec node --input-type=module - và dev http://127.0.0.1:4174. Context kiểm thử cô lập, chặn request ngoài origin; không đọc .env/credentials, không gọi API/model thật hoặc deploy. Chưa kiểm tra browser khác Chromium.

## 2026-10-29 — Font Awesome Free và common Icon

- Theo yêu cầu cài Font Awesome, đọc lại AGENTS.md và source icon hiện tại; tham khảo tài liệu React/import chính thức của Font Awesome. Kiểm tra registry package qua pnpm view: react-fontawesome 3.5.0 hỗ trợ React 18/19 và SVG core 6/7.
- Thêm/pin dependencies tại FE/package.json: @fortawesome/react-fontawesome 3.5.0, fontawesome-svg-core/free-solid-svg-icons/free-regular-svg-icons 7.3.1. Chạy pnpm install từ SRC: PASS, thêm 5 package cùng type transitive; pnpm install --frozen-lockfile PASS, 7 workspace projects, pnpm 11.10.0. Cập nhật lockfile chung; không thêm lockfile/store riêng hoặc thay chính sách tuổi package.
- Tạo components/ui/Icon.tsx và iconDefinitions.ts: registry 13 definition named imports, solid/regular cho tim; không import toàn bộ fas/far. Icon size sm/md/lg = 16/18/24px ở cấu hình mặc định, kế thừa màu, không có label thì aria-hidden, có label thì role img/aria-label; SVG không focusable. Không dùng Kit/CDN/icon font hoặc token Pro.
- Tắt core autoAddCss, import core stylesheet một lần qua styles/index.css ở layer components; CSS common/icon.css định nghĩa kích thước/căn dòng. Icon là đồ họa, font chữ nội dung/control tiếp tục 14px, size control giữ nguyên.
- Chuyển icon chức năng ở Header, FeaturedBanner/Home, Explore, Library, Detail, Auth, Comments, SeasonEpisodes, AnimeCard/ContinueWatching và Pagination sang common Icon. Library tab config dùng tên registry; trái tim chuyển regular/solid theo favorite. Giữ dấu thương hiệu/trang trí, chấm trạng thái/carousel CSS, spinner Bootstrap và SVG arrow của select native.
- Các icon trang trí không còn đóng góp ký tự vào tên truy cập. Cập nhật selector nhãn trong năm bộ Home/Explore/Library/Auth/Detail từ chuỗi có glyph sang chữ Yêu thích/Đã yêu thích/Xem tiếp/Xem lại/Về Trang chủ/Sau; giữ assertion nghiệp vụ, URL, state và ownership.
- Thêm rules/common/icon.md, cập nhật mục lục common, AGENTS.md, prompt generate, styling, DOC/readme và lệnh browser routes.md. Kiểm tra 28 tài liệu Markdown/126 liên kết nội bộ: không có liên kết hỏng.
- Chạy format và build bằng pnpm --filter anime-web-fe: PASS format:check, typecheck và Vite (78 modules; CSS 298.15 kB, JS 498.04 kB trước gzip). Không có cảnh báo build. Đã xem ảnh Home/Detail mobile từ kiểm thử; không tràn ngang ở 375/768/1440 qua hồi quy.
- Thêm tests/icons.browser.mjs và fixture icons.html/jsx. Test đầu đếm toàn bộ style tag bị fail vì Vite dùng style tag cho CSS entry; kiểm tra xác nhận đó là stylesheet Vite, sửa assertion chỉ đếm style ngoài data-vite-dev-id. Chạy lại verifyIcons PASS: registry 13 SVG path, 16/18/24, màu kế thừa, decorative/semantic accessibility, nút icon-only có nhãn, không inject CSS runtime/CDN, guest login returnTo và đổi tim regular → solid.
- Hồi quy verifyExplore, verifyHome, verifyNavigation, verifyLibrary, verifyAuth, verifyDetail, verifyFormControls, verifyControlSizes đều PASS; cùng verifyIcons là 9 bộ kiểm chứng. Browser context cô lập, chặn request ngoài origin, không pageerror.
- Khởi chạy preview http://127.0.0.1:4175 và production smoke PASS: SVG/CSS đóng gói local, icon search 18px, không style tag runtime, login/returnTo, favorite đổi regular/solid, direct Detail, mobile không tràn ngang, không request ngoài origin hoặc pageerror. Fixture kiểm thử không nằm trong entry build production.
- Không đọc .env/credentials, không gọi API/model/video thật hoặc deploy. Kiểm tra browser bằng Chromium; chưa xác nhận browser khác. Packages chỉ được tải trong bước cài dependency, runtime icon không cần nguồn ngoài.

## 2026-10-29 — Bỏ node_modules khỏi Git của Anime-Web

- Xác nhận Anime-Web là repository Git riêng nằm trong SRC. Rule node_modules/ của .gitignore tại SRC không áp dụng vào repository con. Trước sửa, Anime-Web có 4.650 thay đổi, trong đó 4.580 thuộc node_modules; 505 file modules đã được theo dõi trong index.
- Thêm Anime-Web/.gitignore với node_modules/ và stage riêng file này. Chạy git rm -r --cached -- FE/node_modules tại Anime-Web: bỏ 505 entry khỏi index, không xóa thư mục/file đang cài trên ổ đĩa và không thay source khác.
- Kiểm tra sau sửa: FE/node_modules vẫn tồn tại; git ls-files không còn node_modules; không còn module untracked. Còn 505 staged deletion là thao tác bỏ các file modules cũ khỏi Git, cần được commit cùng .gitignore. git check-ignore -v FE/node_modules xác nhận rule tại Anime-Web/.gitignore:1.
- Chưa tạo commit. Không chạy build/test vì chỉ đổi ignore/index; không đọc credentials hoặc dọn pnpm store/cache.

## 2026-10-29 — Bỏ hiệu ứng viền focus của common form controls

- Theo yêu cầu UI, Input/Selectbox/Combobox khi focus giữ viền thường hoặc viền lỗi, bỏ đổi màu viền, outline và box-shadow. Rule common áp dụng cả Input unstyled nên Combobox tìm kiếm không nhận outline từ global CSS. Button/Link/textarea giữ style focus hiện có.
- Sửa styles/common/form-controls.css và bỏ hai rule focus-within/focus của search shell/select trong ExplorePage.css. Cập nhật rules/styling.md và tài liệu common Input/Selectbox/Combobox để generate sau không thêm lại hiệu ứng focus này.
- Chạy pnpm --filter anime-web-fe run format và build: PASS format:check, typecheck và Vite (78 modules). Không thay dependencies hoặc Git index đã stage từ bước bỏ modules.
- Chromium smoke tại localhost:4174 kiểm tra 28 control ở Login, Explore, Detail và fixture size: default/unstyled/sm/md/lg có border color/width giữ nguyên khi focus bằng bàn phím, outline none, box-shadow none. Search shell không đổi viền; Input invalid vẫn giữ màu lỗi; Button nhận focus bằng Tab vẫn có outline.
- Lần smoke đầu kiểm tra Button focus-visible ngay sau click/pointer nên nhận outline none; sửa thao tác kiểm chứng sang Tab thật, chạy lại PASS. verifyFormControls tiếp tục PASS gợi ý native, free text, query/Back và Selectbox onChange. Không chạy lại toàn bộ bộ hồi quy cho thay đổi CSS focus này.
- Không đọc credentials, gọi API/model thật hoặc deploy; browser context cô lập, chặn request ngoài origin.

## 2026-10-29 — Chuẩn hóa common Pagination

- Source đã có Pagination chung tại components/common/Pagination.tsx dùng ở Explore/Library/Comments; nâng cấp component hiện có, không tạo bản trùng. Export PaginationProps, label mặc định trung tính và label riêng cho Explore/Library/Comments.
- Thêm size sm/md/lg, siblingCount, disabled, loading, className. Giữ font 14px và React Router Link, Icon Font Awesome, rel prev/next, aria-current và nhãn Trang N. Loading/disabled render span aria-disabled không href/tab stop, loading có aria-busy. Tổng trang dưới 2 ẩn component.
- Thay tạo mảng theo toàn bộ totalPages bằng Set gồm trang đầu/cuối/cửa sổ kề; siblingCount clamp 0–3 nên số nút được giới hạn dù tổng trang rất lớn. Chuẩn hóa dữ liệu số chỉ để render an toàn; query/URL clamp vẫn thuộc feature.
- CSS pagination hỗ trợ ba mức chiều cao/rộng tối thiểu 32/44/52px, wrap mobile, trạng thái active/disabled; giữ focus-visible của link. Không thay rule focus form control hoặc logic pageSize/query của feature.
- Thêm rules/common/pagination.md với API, ví dụ, semantics, size, loading/disabled và giới hạn; cập nhật common readme, AGENTS.md, prompt generate, fe-structure và lệnh browser routes.md. Kiểm tra 29 tài liệu Markdown/132 liên kết nội bộ: PASS.
- Chạy pnpm --filter anime-web-fe run format và build: PASS format:check, typecheck, Vite (78 modules). Không thay dependency, lockfile hoặc Git index đang stage.
- Thêm pagination.browser.mjs và fixture HTML/JSX riêng. verifyPagination PASS: số trang/ellipsis/current, prev/next, size và font, 375/768/1440 không tràn ngang, loading/disabled không link, giá trị biên/NaN/Infinity, tổng một tỷ trang với siblingCount lớn vẫn chỉ 9 link số, focus bàn phím, SPA giữ document/query, Back/Forward/reload. Fixture không đăng ký route sản phẩm hoặc entry production.
- Chạy hồi quy verifyExplore, verifyLibrary và verifyDetail trong các browser context độc lập: cả ba PASS, gồm pagination/filter/query, Library account state, commentPage/season và các hành vi cũ; không đổi assertion. Tổng bốn bộ kiểm chứng cho thay đổi này; không chạy lại các bộ không bị ảnh hưởng.
- Đã xem ảnh pagination tại viewport 375px, lưu trong test-results được ignore. Dùng Chromium có sẵn qua pnpm exec, chặn request ngoài localhost; không đọc credentials hoặc gọi API/model thật, không deploy.

## 2026-10-29 — Button label/startIcon/endIcon

- Thêm label, startIcon, endIcon (ReactNode) cho common Button, dùng chung ở button/React Router Link/anchor. ContentProps union chỉ chấp nhận label hoặc children; children vẫn tương thích nội dung tùy biến và icon-only không bắt buộc label hiển thị.
- Slot render theo startIcon → label/children → endIcon, inline-flex/gap 0.5rem và căn giữa. Wrapper icon aria-hidden; nút icon-only tiếp tục lấy aria-label ở phần tử tương tác. Nhãn 0 được giữ, nhãn rỗng/null/undefined không tạo wrapper trống. Các props mới được loại khỏi native DOM props, ref/type/loading/disabled vẫn giữ hành vi cũ.
- Chuyển nút hiện có trong 14 file page/component sang label và icon slot; Auth submit dùng label tiến trình, startIcon spinner khi pending/endIcon mũi tên khi sẵn sàng. Bỏ margin/gap cũ tại Hero/Library/Auth gây căn icon chồng chéo; Button quản lý khoảng cách bằng gap, không chèn whitespace riêng.
- Cập nhật common/button.md, ví dụ icon.md, AGENTS.md, prompt screen-generation và hướng dẫn browser routes.md; nêu API exclusive content, slot accessibility, RTL, loading và cách kiểm chứng. Kiểm tra 29 tài liệu Markdown/132 liên kết nội bộ: PASS.
- Chạy pnpm --filter anime-web-fe run format và build: PASS format:check, typecheck và Vite (78 modules; CSS 298.38 kB, JS 499.04 kB trước gzip). Không thêm dependency hoặc đổi lockfile/Git index.
- Thêm tests/button.types.tsx; chạy pnpm --filter anime-web-fe exec tsc --noEmit --strict --skipLibCheck --jsx react-jsx --module ESNext --target ES2022 --moduleResolution Bundler tests/button.types.tsx: PASS. Kiểm tra trường hợp hợp lệ cùng @ts-expect-error cho label + children ở cả ba dạng as và loading trên Link; không emit file.
- Thêm button.browser.mjs và fixture HTML/JSX riêng. verifyButton PASS: thứ tự hai slot/nhãn, gap 8px, icon trang trí bị ẩn dù có label bên trong, icon-only không tạo nhãn trống, children rich/nhãn 0, loading/disabled, default button không submit và submit rõ hoạt động, Link/anchor/ref, không rò label/startIcon/endIcon xuống DOM, RTL đảo vị trí theo hướng đọc, ba size/font 14px.
- Chạy toàn bộ verifyExplore, verifyLibrary, verifyDetail, verifyHome, verifyAuth, verifyNavigation, verifyFormControls, verifyControlSizes, verifyIcons, verifyPagination và verifyButton: cả 11 bộ PASS trong Chromium, context cô lập, giới hạn ba bộ đồng thời. Bao gồm responsive 375/768/1440, submit/query/returnTo, yêu thích, comment ownership và mock/storage. Không thay assertion các bộ hồi quy cũ.
- Đã xem ảnh Home/Login mobile sau tích hợp, không thấy tràn ngang hoặc icon lệch nhãn; ảnh thuộc test-results được ignore. Fixture không thêm route sản phẩm/entry build. Chặn request ngoài origin, không đọc credentials/gọi API/model thật/deploy.

## 2026-10-29 — Rà soát CSS và mức sử dụng Tailwind

- Xác nhận Tailwind đã cài, plugin Vite đang bật, theme/utilities được import với prefix tw và source đúng. Source TSX có 6 lần dùng utility, chỉ gồm 4 class duy nhất (tw:flex, tw:flex-wrap, tw:gap-2, tw:gap-3), tại hai khối trong FeaturedBanner.tsx. Kiểm tra runtime Hero actions: display flex, flex-wrap wrap, gap 12px; utilities có trong CSS build.
- CSS source sau sửa có 17 file/2.613 dòng và khoảng 180 class aw- khác nhau; 146 khai báo font-size dùng lại token. Phát hiện declaration trùng giữa breadcrumb/heading/note của Explore và Library, cùng các khai báo layout đơn giản có thể chuyển sang utility. Đây là kiểm tra source, không khẳng định mọi rule trùng hoặc font declaration đều có thể xóa an toàn.
- Phát hiện regression từ cấu trúc Button slot mới: selector Explore .aw-explore-search-row .btn span thêm margin-left 18px vào cả nhãn/icon và rule mobile ẩn mọi span. Chromium xác nhận tại 375px label và icon đều display none; ở 1440px cả hai nhận margin 18px.
- Sửa hẹp selector mobile chỉ ẩn aw-button-icon, bỏ margin cũ để giữ gap của common Button. Thêm assertion nhãn truy cập Tìm anime vẫn hiện trong vòng responsive 375/768/1440 của explore.browser.mjs. Không refactor diện rộng CSS/Tailwind trong bước audit này.
- Chạy format/build: PASS format:check, typecheck và Vite. verifyExplore PASS toàn bộ cùng kiểm tra mới về nhãn mobile. Không chạy lại các suite không liên quan. Giữ nguyên dependencies, lockfile và index đang stage; không gọi nguồn ngoài hoặc đọc credentials.

## 2026-10-29 — Ưu tiên Tailwind trong source

- Theo yêu cầu, chuyển layout/spacing/responsive sang utility tw: trong JSX trên Home, Explore, Library, Login/Register, Detail, Header/Footer, ContentState, AnimeCard/ContinueWatching, SeasonEpisodes và CommentsPanel. Giữ các marker aw-* phục vụ selector theo ngữ cảnh/test, trạng thái common, gradient, pseudo-element và animation.
- Chuyển 577 declaration từ bảy stylesheet page/common sang utility, cập nhật 189 className trong source và fixture có dùng shell thật. Xóa rule/at-rule rỗng sau khi di chuyển, không dùng apply để giữ nguyên toàn bộ CSS cũ. CSS source từ 2.613 xuống 1.790 dòng (giảm 823 dòng, khoảng 31,5%); class aw-* có selector CSS từ 180 xuống 160. Tailwind từ 6 lượt/4 utility trong một file lên 773 lượt/283 utility trong 18 file TSX.
- Thêm theme inline text-body dùng --aw-font-size-base, chỉ đặt font-size, không tự thay line-height. Thêm custom variant max-desktop/tablet/mobile/phone ứng với max-width inclusive 1100/1000/767/600px, đăng ký từ rộng đến hẹp. Rút gọn class responsive và bỏ override utility lặp lại cùng giá trị; giữ đúng các breakpoint cũ.
- Trước sửa đã chụp computed style/bounding box của 49 view: sáu route guest và Library member ở 375/600/767/768/1000/1100/1440px. Sau lượt chuyển đầu, so sánh phát hiện margin kế thừa của aw-demo bị utility thắng selector ngữ cảnh; giữ declaration đó trong CSS. Đổi radius utility sang 50% để giữ cả giá trị computed. So sánh cuối 49 view trước/sau dev: không còn khác biệt ở các phần tử/properties đã lấy mẫu. Artifact, backup và script chuyển đổi/so sánh nằm trong test-results được ignore.
- Bổ sung rule ưu tiên Tailwind trong AGENTS.md và screen-generation prompt; cập nhật styling.md với quy tắc tạo class, text-body, breakpoint và kiểm chứng; đồng bộ fe-structure cùng tài liệu năm nhóm màn hình. Kiểm tra 29 tài liệu Markdown/133 liên kết nội bộ: PASS.
- JSX có nhiều utility làm chunk JS ban đầu vượt ngưỡng cảnh báo 500 kB. Tham khảo API codeSplitting của Rolldown chính thức, tách riêng nhóm @fortawesome trong vite.config.ts, không tăng ngưỡng để che cảnh báo. Build cuối PASS không cảnh báo: CSS 300.04 kB, main JS 402.24 kB, Font Awesome 106.96 kB và runtime 0.59 kB trước gzip. Giảm CSS tự viết không đồng nghĩa giảm tổng bundle; Bootstrap/core icon CSS vẫn được đóng gói.
- Chạy pnpm --filter anime-web-fe run format, build (format:check/typecheck/Vite) và tsc kiểm tra tests/button.types.tsx: tất cả PASS. Không thêm dependency hoặc đổi lockfile. Không stage/commit hay sửa Git index.
- Toàn bộ verifyExplore, verifyLibrary, verifyDetail, verifyHome, verifyAuth, verifyNavigation, verifyFormControls, verifyControlSizes, verifyIcons, verifyPagination và verifyButton PASS, giữ nguyên assertion. Tối đa ba bộ chạy song song với browser context độc lập; kiểm tra cả loading/empty/error/guest/member, size, focus, font 14px, form/query/history và ownership.
- Production preview 4175 chụp lại 49 view: mọi bounding box khớp baseline. Hai giá trị computed margin ở Login được lấy mẫu khác nhau, kiểm tra lại trực tiếp ở 768/1000px xác nhận margin 40px và hình học không thay đổi. Production smoke PASS mobile search/query, login returnTo, favorite/Library, SVG từ chunk riêng, không runtime style injection, không tràn ngang/request ngoài/pageerror.
- Đã xem ảnh Home mobile và Explore desktop sau refactor. Không đọc .env/credentials, không gọi API/model thật hoặc deploy. Test dùng Chromium hiện có; chưa xác nhận browser khác.

## 2026-10-29 — Bộ lọc Khám phá luôn hiển thị

- Thay details/summary và state đóng/mở bằng section luôn hiển thị, có aria-label Bộ lọc. Bỏ thao tác Thu gọn/Mở rộng trên mọi kích thước; giữ layout Tailwind và form/query hiện có. Xóa CSS chỉ dùng cho phần thu gọn.
- Đồng bộ explore-screen.md và design/wireframes.md; giữ nguyên bằng chứng lịch sử cũ.
- Chạy pnpm --filter anime-web-fe run format và build (format:check/typecheck/Vite): PASS.
- Chạy verifyExplore bằng Chromium tại http://127.0.0.1:4174: PASS ở 375/768/1440px. Assertion mới xác nhận cả bốn control lọc hiển thị ngay và không còn details/summary. Hồi quy tìm kiếm, lọc kết hợp/xóa lọc, sắp xếp, phân trang, reload/Back/Forward, query sai, loading/error/empty, guest/member và ảnh dự phòng đều PASS; không request ngoài hoặc pageerror.

## 2026-10-29 — Cảnh báo editor tại ExploreFilters

- Đổi tw:rounded-[12px] thành utility chuẩn tw:rounded-xl theo gợi ý Tailwind IntelliSense; thêm Selectbox vào words của cspell.json tại project, giữ kiểm tra chính tả hoạt động.
- pnpm --filter anime-web-fe run format và build (format:check/typecheck/Vite): PASS. Không chạy lại browser cho thay đổi class tương đương và từ điển; chưa xác nhận trực tiếp diagnostics của extension trong editor.

## 2026-10-29 — Chuẩn hóa class Tailwind tại AnimeDetailPage

- Áp dụng tám gợi ý canonical class: năm minmax(0,_1fr) thành minmax(0,1fr), rounded-[8px] thành rounded-lg, leading-[2] thành leading-loose và max-mobile:order-[-1] thành max-mobile:-order-1. Giữ các chỉnh sửa có sẵn khác trong file.
- pnpm --filter anime-web-fe run format và build (format:check/typecheck/Vite): PASS. Tìm kiếm xác nhận không còn các class được báo trong AnimeDetailPage.tsx; chưa kiểm tra trực tiếp diagnostics của extension hoặc chạy lại browser cho thay đổi tương đương này.

## 2026-10-29 — Tìm kiếm tự động tại Khám phá

- Bỏ nút Tìm anime và CSS chỉ dành cho nút này. Ô Combobox tự submit GET qua React Router sau 350ms ngừng nhập; Enter submit ngay. Giữ bộ lọc/sort/pageSize, về trang 1, hỗ trợ xóa nội dung và chờ composition kết thúc. Không remount ô nhập theo từ khóa nên giữ focus.
- Hủy timer khi submit, điều hướng hoặc unmount; đồng bộ nội dung khi Back/Forward. Hai lượt test ban đầu phát hiện replace chuẩn hóa URL hủy lần nhập mới sau đổi sort; sửa để replace cùng từ khóa không hủy timer/ghi đè nội dung đang nhập.
- Cập nhật explore-screen.md và assertion browser cho giao diện không có nút submit. verifyFormControls PASS: tự tìm không click/Enter, debounce, focus, free text, xóa từ khóa giữ sort, IME, hủy tìm đang chờ khi Back và đồng bộ ô nhập. verifyExplore PASS tại 375/768/1440px: Enter, lọc/sort/phân trang, reload/history, query sai, trạng thái mock, guest/member và ảnh dự phòng; không request ngoài hoặc pageerror.
- pnpm --filter anime-web-fe run format và build (format:check/typecheck/Vite): PASS. Test chỉ dùng dữ liệu mock và Chromium hiện có, không gọi API/model thật.

## 2026-10-29 — Ẩn chip từ khóa tìm kiếm

- Bỏ q khỏi danh sách chip Đang lọc, giữ từ khóa trong ô nhập/URL và tiêu đề Kết quả dành cho bạn khi tìm kiếm. Các chip thể loại/năm/trạng thái/định dạng giữ nguyên. Đồng bộ explore-screen.md.
- pnpm --filter anime-web-fe run format và build (format:check/typecheck/Vite): PASS. Chromium smoke với q=moon và q=moon&year=2025: không có chip từ khóa, chip năm vẫn hiện khi có chọn, ô tìm kiếm giữ moon. Không thêm file test cho thay đổi hiển thị nhỏ.

﻿
## 2026-10-29 — Bỏ chữ demo khỏi button và Header

- Xóa badge DEMO cạnh tên Anime Web trên Header. Rút gọn nhãn Button thành Đăng nhập, Đăng xuất, Đăng ký, Đổi tài khoản và Gửi bình luận tại Header/Library/Auth/Comments. Không thay logic phiên hoặc lưu trữ.
- Đồng bộ locator trong các browser suite theo nhãn mới. Lượt Library đầu bị strict locator do Header và CTA cùng tên Đăng nhập; scope locator vào aw-library-guest rồi chạy lại PASS.
- pnpm --filter anime-web-fe run format, build (format:check/typecheck/Vite) và format:check sau chỉnh locator: PASS. verifyAuth, verifyNavigation, verifyDetail và verifyLibrary PASS với dữ liệu mock/Chromium, không gọi API/model thật.


## 2026-10-29 — Tách tài liệu FE/BE

- Chuyển tài liệu FE vào `DOC/docs-FE`, tạo tài liệu thiết kế BE tại `DOC/docs-BE`; giữ API/entity và kế hoạch chung tại `DOC`. Cập nhật mục lục, liên kết và AGENTS.md.
- Giữ nguyên nội dung lịch sử kiểm chứng; nối thêm bản ghi FE phát sinh tại đường dẫn cũ trước khi bỏ file cũ.
- Kiểm tra đích file của liên kết Markdown trong AGENTS.md và DOC (trừ đường dẫn lịch sử trong verification): PASS, không có liên kết hỏng.
- Chạy từ SRC: `pnpm --filter anime-web-fe run format:check`: PASS. Không sửa code FE; không chạy build hoặc kiểm thử BE vì chỉ thay tài liệu và BE chưa có code.

## 2026-10-29 — Màn hình Xem phim

- Đọc prompt tại DOC/docs-FE/prompts/screen-generation.md và rules/source thực tế; thay route /watch/:episodeId bằng WatchPage, DestinationPage chỉ còn Not found. Không thêm dependency, lockfile hoặc stylesheet. Layout dùng Tailwind và Button/Input/Selectbox/Icon/ContentState hiện có.
- Thêm PlaybackRepository/mock adapter/useWatchEpisode và types; cùng anime/season/episode fixtures, loại draft. Trước/sau theo sortOrder của mùa và tập, bao gồm ID ngoại truyện không liên tiếp. Chọn mùa lưu query, chuẩn hóa query sai, hỗ trợ Back/Forward/reload, chế độ rạp và tự chuyển qua ended. Giữ lựa chọn rạp/tự chuyển trong SPA khi đổi tập.
- Hiện repository trả sources rỗng vì chưa có video được phép sử dụng: hiển thị Chưa có video demo, nguồn disabled, không tạo video src rỗng hoặc lịch sử giả. Nhánh VideoPlayer native MP4/WebM, track phụ đề, error/retry, resume và SessionProvider.saveProgress đã có; tiến độ chỉ ghi sau playing, throttle 10 giây và flush pause/ended/visibility/pagehide/unmount, tách chủ phiên và báo lỗi storage. Chưa xác nhận phát/seek/phụ đề/autoplay/tự chuyển với video thực tế; không có HLS adapter.
- verifyWatch PASS tại 375/768/1440px: nguồn rỗng, sidebar responsive, theater, giữ toggle qua chuyển tập, trước/sau xuyên mùa, season query, history/reload, movie, draft/upcoming/404, mock loading/error/retry/empty, guest/member/returnTo và không ghi tiến độ khi chỉ mở tập. Lượt đầu phát hiện aspect-ratio kết hợp min-height gây tràn ngang mobile; bỏ aspect-ratio ở max-phone rồi kiểm tra lại PASS. Chờ danh sách commit sau URL đổi trong test chọn mùa.
- verifyPlayer PASS với fixture riêng và sự kiện media mô phỏng (không phải playback): resume 510 giây, không ghi trước playing, throttle, flush pause, ended/completed, tiến độ riêng từng tập, chuyển tài khoản/đăng xuất không ghi nhầm, guest không ghi, media error/retry và quota warning. Fixture không đăng ký trong router/production entry, không có asset video thật.
- verifyHome, verifyLibrary, verifyDetail, verifyAuth và verifyNavigation PASS. Đồng bộ assertion Watch thay placeholder; Home quay về qua breadcrumb và dùng Enter ở Header thay locator nút tìm kiếm cũ đã bị bỏ trước đó. Các luồng guest/member, phiên/storage, yêu thích/thư viện, comments và navigation tiếp tục hoạt động.
- Chạy pnpm --filter anime-web-fe run format và build (format:check/typecheck/Vite): PASS. 82 modules; CSS 302.43 kB, main JS 413.85 kB, Font Awesome 106.96 kB trước gzip, không cảnh báo build. git diff --check -- FE/src FE/tests: PASS. Không sửa nội dung lịch sử kiểm chứng; tài liệu đang tách FE/BE của người dùng được giữ lại.
- Dev http://127.0.0.1:4174 và preview http://127.0.0.1:4175 hoạt động. Production smoke PASS direct route /watch/episode-01-side-a, next sang side-z, mobile không tràn, không video src rỗng, không external request/pageerror. Lượt lệnh inline đầu bị PowerShell đổi dấu tiếng Việt trong locator; chạy lại với Unicode escape PASS.
- Đã xem ảnh Watch 375 và 1440px tại FE/test-results; bộ Watch còn chụp 768px. Kiểm tra 206 liên kết tài liệu (trừ lịch sử verification): PASS. Cập nhật watch-screen.md, mục lục FE/chung, routes/architecture/fe-structure và tài liệu Detail/Library.
- Kiểm tra dùng Chromium và dữ liệu cục bộ, không đọc .env/credentials, không gọi API/model/video ngoài, không triển khai BE hoặc deploy. Chưa kiểm tra browser khác hoặc playback thực tế.

## 2026-10-29 — Tổ chức source theo Bulletproof React

- Theo yêu cầu người dùng, đọc repository alan2207/bulletproof-react, docs/project-structure.md và ứng dụng apps/react-vite/src (app/provider/router, config paths và alias TypeScript). Áp dụng các nguyên tắc tổ chức/chiều phụ thuộc; giữ stack React/TS/Vite, React Router, Tailwind/Bootstrap, repository mock/local và toàn bộ URL hiện có. Không thêm dependency hoặc folder rỗng chỉ để giống ví dụ.
- Chuyển màn hình/CSS riêng vào app/routes, router vào app/router.tsx, URL builders vào config/paths.ts; thêm app/provider.tsx. MainLayout vào components/layouts. SessionProvider/useSession chuyển thành shared store tại stores/session.tsx. AnimeCard nhận props dùng chung đặt ở components/anime, không còn Library import chéo anime feature.
- Chuyển repository/contracts/adapters vào lib/api và lib/storage; fixture demo vào testing/mocks/fixtures. Các entity/DTO dùng nhiều nơi chuyển vào types; tách type/control/progress/auth/catalog, constant catalog vào config và hàm search/progress/ID validation vào utils. Kiểu và validation chỉ thuộc auth/library giữ trong feature/types, utils hoặc config. Shared code không lấy type/constant từ feature.
- Đổi tên file kebab-case, cập nhật import trực tiếp @/ trong source/fixtures/type tests, cấu hình alias đồng bộ Vite/TS và forceConsistentCasingInFileNames. Đường dẫn import động tuyệt đối trong detail.browser.mjs được sửa sang /src/lib/api/repositories.ts. Không giữ shim/re-export ở đường dẫn cũ. CSS vẫn đi qua styles/index.css, chỉ cập nhật đường dẫn đăng ký CSS màn hình.
- Thêm scripts/check-architecture.mjs dùng TypeScript AST: 74 modules PASS đường dẫn/casing, shared không import feature/app, feature không import chéo và không có cycle (kể cả type imports). Đã kiểm tra âm với file probe tạm: cross-feature, shared-to-feature và shared-to-app đều bị từ chối; xóa file probe ngay sau kiểm tra. Build bắt buộc chạy check:architecture, typecheck:tests cùng format:check/typecheck/Vite. tests/tsconfig.json kế thừa alias để kiểm tra Button type contract.
- Trong di chuyển ban đầu, Windows coi tên chỉ khác hoa/thường là cùng file, làm mất một số bản ghi working tree; phục hồi đúng nội dung HEAD của chín module không có thay đổi trước tác vụ và áp dụng import mới, sau đó typecheck/browser PASS. Dùng git mv qua tên tạm để Git ghi nhận chính xác chín rename chỉ khác casing: app/app, artwork, pagination, header, button, combobox, icon, input, selectbox. Git index chỉ stage chín rename R100 (không stage nội dung); các thay đổi code/tài liệu khác còn unstaged. Không commit, không đổi core.ignorecase hoặc stage thay đổi ngoài phạm vi.
- pnpm --filter anime-web-fe run format và build: PASS, gồm format:check, check:architecture, typecheck, typecheck:tests và Vite. 87 modules bundle; CSS 302.43 kB có cùng hash index-ZWmBr9f3 như trước tổ chức lại; main JS 413.92 kB, Font Awesome 106.96 kB trước gzip, không cảnh báo build. Không đổi dependency inputs/lockfile hoặc cài lại packages. git diff --check cho code/scripts/tests/config đã kiểm tra PASS.
- Sau di chuyển, verifyHome, verifyExplore, verifyNavigation, verifyLibrary, verifyAuth, verifyDetail, verifyFormControls, verifyControlSizes, verifyIcons, verifyPagination, verifyButton, verifyWatch và verifyPlayer đều PASS (13 bộ). Lượt đầu Navigation thấy document request phụ trong lúc Vite reload cấu hình; chạy lại khi server ổn định PASS, giữ nguyên assertion một document. Detail phát hiện import tuyệt đối còn dùng /src/data/repositories.ts, sửa đường dẫn rồi chạy lại PASS. Không đổi kỳ vọng nghiệp vụ để làm test qua.
- Production preview 4175: verifyNavigation PASS một document; smoke tám route /, /anime, /anime/hanh-trinh-anh-sao, /watch/episode-01-side-a, /library, /login, /register, /missing tại 375/1440px đều mở trực tiếp, không tràn ngang, external request hoặc pageerror. Browser suites còn kiểm tra 768px và các trạng thái mock/guest/member/storage/ownership/media events. Chưa có video thật nên vẫn chưa xác nhận playback/phụ đề/autoplay thực tế.
- Cập nhật AGENTS, prompt sinh màn hình, rules cấu trúc/kiến trúc/routes/common, đường dẫn các tài liệu màn hình và integration BE; ghi quyết định ngày 2026-10-29. Kiểm tra 194 liên kết Markdown hiện tại trong DOC (trừ lịch sử verification): PASS. Giữ nguyên nội dung bằng chứng cũ, chỉ thêm mục này.
- Không đọc .env/credentials, không gọi API/model/video thật hoặc deploy. Chỉ browser/fixture cục bộ; đọc GitHub công khai theo yêu cầu người dùng. Không thay đổi code BE hoặc các project khác trong SRC. Script chuyển đổi/map cục bộ nằm trong FE/test-results được ignore; không rerun chúng trên source đã chuyển đổi.

## 2026-10-30 — Làm gọn poster trên thẻ phim

- AnimeCard dùng chung chuyển episodeLabel xuống dưới tên phim, không đè thông tin tập lên poster. Bỏ icon external-link khi hover/focus và import Icon không còn dùng; xóa CSS aw-poster-tag/aw-poster-play. Giữ điều hướng Link và focus của liên kết.
- pnpm --filter anime-web-fe run format và build (format:check/check:architecture/typecheck/typecheck:tests/Vite): PASS.
- Chromium smoke PASS trên Home/Explore/Detail ở 375/1440px: thông tin tập nằm ngoài poster, không có badge/icon trên poster khi hover, không tràn ngang và click thẻ vẫn đến chi tiết. Không request ngoài origin hoặc pageerror. Không thêm file test cho thay đổi hiển thị nhỏ này.

## 2026-10-30 — Gạch dưới Header gần chữ

- Navigation tự căn giữa thay vì kéo link giãn theo toàn chiều cao Header; dùng utility Tailwind đặt padding dọc 6px cho link. Đường active 2px giữ màu/chiều ngang hiện có nhưng nằm gần chữ. Bỏ CSS padding responsive cũ đã được utility thay thế.
- pnpm --filter anime-web-fe run format và build (format:check/check:architecture/typecheck/typecheck:tests/Vite): PASS.
- Chromium tại 375/768/1440px: active link cao 34.39px, line-height 22.4px, padding-bottom 6px và underline 2px; không tràn ngang. Không thêm file test cho chỉnh spacing nhỏ.
