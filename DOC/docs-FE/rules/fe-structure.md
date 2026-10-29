# Cấu trúc FE theo Bulletproof React

Áp dụng từ 2026-10-29 theo yêu cầu tổ chức source theo [Bulletproof React](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md), đối chiếu bản [React + Vite](https://github.com/alan2207/bulletproof-react/tree/master/apps/react-vite/src). Giữ React/TypeScript/Vite, React Router và Tailwind/Bootstrap hiện có; không sao chép các dependency chưa dùng của ứng dụng mẫu.

```text
FE/src/
├── app/
│   ├── app.tsx                 # Ghép AppProvider và RouterProvider
│   ├── provider.tsx            # Điểm ghép provider của ứng dụng
│   ├── router.tsx              # Một createBrowserRouter
│   └── routes/                 # Màn hình ghép feature; CSS riêng khi cần
├── components/
│   ├── ui/                     # Button/Input/Selectbox/Combobox/Icon
│   ├── common/                 # Artwork/Pagination/ContentState
│   ├── anime/                  # AnimeCard nhận dữ liệu qua props
│   ├── navigation/             # Header
│   └── layouts/                # MainLayout
├── config/                     # paths.ts và catalog.ts
├── features/
│   ├── anime/                  # components, hooks, utils
│   ├── auth/                   # components, hooks, types, utils
│   ├── comments/               # components, hooks
│   ├── episode/                # components
│   ├── library/                # components, hooks, types, config, utils
│   └── player/                 # components, hooks
├── lib/
│   ├── api/                    # Repository contracts, mock adapters, repositories.ts
│   └── storage/                # Adapter lưu trữ cục bộ có schema version
├── stores/                     # session.tsx: Context state dùng toàn ứng dụng
├── testing/mocks/fixtures/     # Dữ liệu mẫu ổn định dùng trong chế độ mock
├── types/                      # Entity/DTO dùng ở nhiều feature và repository
├── utils/                      # Hàm thuần: search, progress, kiểm tra ID tài khoản
├── styles/                     # Entry CSS, tokens, global, common và cascade layers
└── main.tsx                    # Mount ứng dụng và import CSS một lần
```

Không tạo thư mục trống để khớp một sơ đồ. Khi có nhu cầu mới mới thêm assets/hooks dùng chung hoặc api/stores/assets riêng của feature. Ảnh URL tĩnh hiện có giữ tại public/images; browser suites/fixtures HTML vẫn tại FE/tests để giữ công cụ hiện tại. testing/mocks chứa dữ liệu demo được adapter mock sử dụng trong cả dev/production hiện tại; không coi thư mục này là dữ liệu chỉ tồn tại trong test.

## Ranh giới phụ thuộc

- app được ghép các feature và phần dùng chung. Trang màn hình đặt ở app/routes, không đặt lại thư mục pages hoặc router bên trong feature.
- features/<name> được dùng code của chính feature và components/config/lib/stores/types/utils/testing dùng chung. Không import feature khác; ghép chúng trong app hoặc tách phần thực sự dùng chung.
- components/config/lib/stores/types/utils/testing không import app hoặc features. Đây là chiều phụ thuộc được kiểm tra tự động, áp dụng cả import type.
- Entity chia sẻ (Anime, Episode, WatchDetail, Comment, DemoProfile, Progress, CatalogQuery) ở types; AuthValues/AuthErrors và LibraryQuery chỉ thuộc một feature thì ở feature/types.
- SessionProvider/useSession là state dùng toàn ứng dụng nên ở stores/session.tsx. AppProvider ghép nó phía trên RouterProvider. Không đưa SessionProvider trở lại feature auth rồi cho feature khác import chéo.
- AnimeCard nhận Anime qua props và dùng chung giữa Library/các route nên ở components/anime/anime-card.tsx. FeaturedBanner, ExploreFilters, CommentsPanel, SeasonEpisodes và VideoPlayer giữ trong feature vì có nghiệp vụ riêng.
- Repository dùng chung giữa nhiều feature đặt tại lib/api; adapter storage ở lib/storage. Shared lib không lấy type/constant từ feature. Chỉ lib/api/repositories.ts chọn adapter; đây là module cấu hình cụ thể, không phải barrel export toàn feature.
- Dùng import trực tiếp với alias @/ tới src, không tạo barrel index.ts export hàng loạt. Đặt tên file kebab-case, component/type vẫn PascalCase và hook vẫn useCamelCase.

## Kiểm tra và vận hành

Chạy từ SRC: pnpm --filter anime-web-fe run check:architecture. Script scripts/check-architecture.mjs dùng TypeScript AST kiểm tra đường dẫn/casing, import type/runtime/dynamic, feature import chéo, shared import ngược và vòng phụ thuộc. Build chạy cả kiểm tra này cùng format:check, typecheck, typecheck:tests và Vite.

Alias @/* được cấu hình cùng nhau trong tsconfig.json và vite.config.ts; tests/tsconfig.json kế thừa alias cho hợp đồng TypeScript. Khi di chuyển file, cập nhật import, CSS entry, fixture và tài liệu; không giữ các re-export shim ở vị trí cũ.

Dùng pnpm@11.10.0, store mặc định và lockfile chung tại SRC. Cài từ SRC bằng pnpm install khi dependency inputs thay đổi, kiểm tra pnpm install --frozen-lockfile khi cần; không thêm lockfile FE/BE riêng. Format sau sửa code theo AGENTS.md. Giữ lịch sử verification.md, chỉ nối thêm bằng chứng mới.

Các quy tắc bổ sung: [kiến trúc](architecture.md), [route](routes.md), [style](styling.md), [common](common/readme.md).
