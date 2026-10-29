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
