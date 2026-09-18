# A Birthday in the Stars

**A Birthday in the Stars** là một Birthday Creator bằng React/Vinext. Người tạo chỉnh sửa một trang sinh nhật 3D, xem trước ngay trong trình duyệt, lưu bản nháp bằng Supabase và xuất bản bằng một đường link riêng.

Ứng dụng kết hợp Three.js, Framer Motion và Supabase để tạo một trải nghiệm gồm cổng mở đầu, chuyển cảnh vũ trụ, bánh sinh nhật, nến, pháo hoa, thư chúc, gallery ảnh và Guest Book / Wish Galaxy.

## Tính năng chính

### Birthday Creator

Mở trang chủ không có query string để vào trình chỉnh sửa. Các nhóm cấu hình hiện có:

- Thông tin: tên người nhận, tuổi, ngày sinh, tiêu đề và lời mở đầu.
- Ảnh kỷ niệm: tối đa **3 ảnh/trang**; hỗ trợ JPG, PNG, WebP, tối đa 10 MB/ảnh.
- Lời chúc: nhiều đoạn văn, lời kết và thông điệp bí mật.
- Mẫu giao diện: `midnight-wish`, `pink-dream`, `golden-night`, `galaxy-birthday`, `minimal-birthday`.
- Màu chủ đạo và các hiệu ứng: bóng bay, pháo hoa, confetti, cực quang, Memory Galaxy và hộp quà.
- Âm nhạc: một tệp MP3, WAV, OGG hoặc M4A, tối đa 20 MB, có điều chỉnh âm lượng.
- Sổ lời chúc: bật/tắt Guest Book, Wish Galaxy và tên người gửi.
- Thời gian mở quà: mở ngay hoặc Scheduled Unlock theo ngày, giờ và múi giờ.

Preview được lưu tạm trong `sessionStorage` với key `birthday-creator-preview`; nút **Mở rộng** mở `/?preview=1` trong tab mới. Preview không ghi dữ liệu lên Supabase.

### Birthday Experience công khai

Sau khi xuất bản, trang được mở bằng:

```text
/?wish=<slug>
```

Flow công khai:

1. `BirthdayApp` gọi RPC `get_published_birthday`.
2. Nếu Scheduled Unlock chưa tới, người xem chỉ thấy màn hình đếm ngược và metadata an toàn.
3. Khi đã mở, ứng dụng tải `published_config`, tạo signed URL cho asset private và hiển thị trải nghiệm 3D.
4. Người xem mở cổng, đi qua warp tunnel, thổi nến, xem pháo hoa, ký ức, thư chúc, hộp quà và Guest Book.
5. URL không tồn tại hoặc chưa publish sẽ hiển thị màn hình 404 thân thiện.

### Guest Book / Wish Galaxy

- Lời chúc được lưu trong `birthday_wishes` và hiển thị thành các ngôi sao trong Three.js.
- Danh sách fallback HTML và dialog chi tiết hỗ trợ keyboard/accessibility.
- Realtime subscription cập nhật lời chúc mới mà không cần reload.
- Giới hạn hiển thị phía client là 100 lời chúc; server áp dụng cooldown 15 giây theo visitor ID.
- Preview dùng dữ liệu mẫu và không gọi Supabase.

## Luồng dữ liệu

```text
Trang chủ /
  ├─ không có query  → BirthdayCreator
  │    ├─ preview local → BirthdayExperience (previewMode)
  │    ├─ autosave      → birthday_pages.config
  │    └─ publish       → publish_birthday_page → slug
  └─ ?wish=<slug>      → get_published_birthday
       ├─ locked        → ScheduledUnlockScreen
       └─ open          → BirthdayExperience
                            ├─ MemoryGalaxy (tối đa 3 ảnh)
                            └─ GuestBookSection → wishes RPC + Realtime
```

### Autosave và publish

`useBirthdayDraft` tạo một anonymous Supabase user khi có đủ biến môi trường. Thay đổi cấu hình được debounce khoảng 700 ms, sau đó ghi tuần tự vào bản nháp để tránh race condition. Nút **Xuất bản** flush bản mới nhất trước khi gọi `publish_birthday_page`.

Ảnh được validate trước khi upload, nén xuống tối đa 1920 px nếu phù hợp, upload tuần tự vào bucket private `birthday-assets` và dùng signed URL. Upload lỗi sẽ giải phóng slot đang chờ và dọn các object đã upload trong batch để tránh orphan asset.

Giới hạn ảnh được kiểm tra ở nhiều lớp:

- `MAX_BIRTHDAY_PHOTOS = 3` trong `config/birthday.ts` là nguồn dùng chung cho UI và runtime.
- UI hiển thị `0 / 3` đến `3 / 3`, khóa input khi đầy và mở lại sau khi xóa.
- Handler lọc MIME/extension/size, chỉ nhận số file còn slot; upload song song vẫn có reservation slot.
- Autosave, `flush` và publish client chặn snapshot có hơn 3 ảnh.
- RPC publish trong `supabase/schema.sql` và patch tương ứng cũng chặn `config.memories` không hợp lệ.

Config legacy có hơn 3 ảnh không bị âm thầm xóa. Creator sẽ báo lỗi và chặn publish; public Memory Galaxy chỉ render ba ảnh đầu tiên cho tới khi người sở hữu xóa bớt.

## Công nghệ

- React 19 + TypeScript 5.9
- Vinext/Vite static build
- Three.js, `@react-three/fiber`, `@react-three/drei`
- Framer Motion
- Supabase Auth, Postgres, RPC, Realtime và Storage
- Cloudflare Workers runtime thông qua OpenAI Sites
- Oxlint và Oxfmt

## Yêu cầu môi trường

- Node.js `>=22.13.0`
- Một project Supabase đã bật Anonymous Sign-Ins
- Trình duyệt hỗ trợ WebGL, `createImageBitmap` và các API media cơ bản để dùng đầy đủ tính năng upload/3D

## Chạy local

```bash
npm install
copy .env.example .env.local
npm run dev
```

PowerShell có thể dùng:

```powershell
Copy-Item .env.example .env.local
npm run dev
```

Mở URL dev được in trong terminal. Khi chưa cấu hình Supabase, Creator vẫn cho phép chỉnh sửa và preview local nhưng không thể autosave, upload asset hoặc publish.

### Biến môi trường

`.env.local` cần có:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

Chỉ dùng publishable/anon key ở frontend. Không đưa secret key hoặc service-role key vào `.env.local`, source code hay production bundle. Vì đây là static build, cần chạy build lại sau khi thay đổi biến `NEXT_PUBLIC_*`.

## Supabase

### Cài đặt lần đầu

1. Tạo project Supabase và bật **Authentication → Providers → Anonymous Sign-Ins**.
2. Mở **SQL Editor** và chạy [`supabase/schema.sql`](supabase/schema.sql).
3. Điền URL và publishable key vào `.env.local`.
4. Chạy lại build rồi mở Creator để kiểm tra anonymous session, autosave và publish.

Schema chính tạo hoặc nâng cấp:

- `public.birthday_pages`: bản nháp, published snapshot, slug, Scheduled Unlock và RLS owner/visitor.
- `public.birthday_wishes`: Guest Book, trạng thái moderation, visitor cooldown và Realtime publication.
- RPC: `publish_birthday_page`, `get_published_birthday`, `submit_birthday_wish`, `get_published_birthday_wishes`, cùng các RPC moderation owner-only.
- Bucket private `birthday-assets` và storage policies cho owner upload/read/update/delete, visitor chỉ đọc asset của trang published đã mở.

### Patch cho database đã tồn tại

SQL deploy không tự chạy cùng frontend deploy. Với database production đã có schema, chạy patch phù hợp trong Supabase SQL Editor:

- [`supabase/patches/fix_birthday_wish_ambiguity.sql`](supabase/patches/fix_birthday_wish_ambiguity.sql): sửa lỗi PostgreSQL `42702` và qualify các cột/policy Guest Book; không drop bảng hoặc xóa dữ liệu.
- [`supabase/patches/enforce_birthday_photo_limit.sql`](supabase/patches/enforce_birthday_photo_limit.sql): cập nhật riêng publish RPC để chặn snapshot có hơn 3 ảnh khi base schema đã cài.

Sau khi pull thay đổi schema, ưu tiên chạy lại `schema.sql` theo hướng dẫn trong [`supabase/README.md`](supabase/README.md). Kiểm tra log SQL và chữ ký RPC nếu database đã có migration tùy biến.

### Quy tắc bảo mật dữ liệu

- `birthday_pages` chỉ cho owner đọc/sửa/xóa bản nháp của mình; anon chỉ đọc dữ liệu public qua RPC/policy.
- `birthday_wishes` chỉ trả về lời chúc visible của trang published và đã unlock.
- Tệp upload không phải public bucket. Public URL là signed URL có thời hạn.
- RLS và RPC là lớp bảo vệ cuối; validation phía client chỉ giúp phản hồi sớm cho người dùng.

## Validation và build

Các lệnh kiểm tra trước khi commit:

```bash
npx tsc --noEmit
npm run lint
npx vinext build
```

`npm run build` là alias của `vinext build`. Production artifact được tạo tại:

```text
dist/client
```

Có thể chạy artifact Workers local sau khi build:

```bash
npm run start
```

Project hiện không có test runner hoặc script `npm run test`; khi bổ sung test cần cập nhật README và `package.json` cùng lúc. Cảnh báo bundle chunk lớn hoặc deprecation trong build không phải build failure, nhưng nên được theo dõi khi tối ưu performance.

## OpenAI Sites

Website dùng Site hiện tại được khai báo trong [`.openai/hosting.json`](.openai/hosting.json):

- Build command: `vinext build`
- Static directory: `dist/client`
- Production URL: <https://birthday-midnight-wish.phophoccode.chatgpt.site>
- Project ID: giữ nguyên giá trị đang có trong [`.openai/hosting.json`](.openai/hosting.json)

Khi phát hành bản mới:

1. Chạy typecheck, lint và `vinext build`.
2. Kiểm tra `dist/client/index.html`, asset tĩnh và `dist/.openai/hosting.json`.
3. Lưu version mới vào **Site hiện tại**.
4. Deploy version đó vào đúng project, không tạo Site/deployment project mới.
5. Smoke check production URL vẫn trả HTTP 200 và flow public hoạt động.

Deploy frontend không thay thế việc chạy SQL migration. Nếu thay đổi `supabase/schema.sql` hoặc patch, vẫn phải chạy SQL riêng trong Supabase Dashboard.

## Performance và accessibility

- `CosmicCanvas` được lazy-load sau khi trải nghiệm mở.
- `useDeviceQuality` chọn profile theo thiết bị; `FpsGuard` hạ quality nếu FPS thấp.
- `useReducedMotion` giảm animation, scroll behavior và timeline cho người dùng yêu cầu reduced motion.
- Canvas dừng render khi tab không visible (`frameloop="never"`).
- Các section nặng dùng `content-visibility`; ảnh dùng kích thước cố định/aspect ratio để hạn chế layout shift.
- Trạng thái loading, locked, not-found và lỗi publish có nội dung rõ ràng; Guest Book có fallback HTML ngoài canvas.
- Khi sửa CSS/layout, kiểm tra không tạo document overflow hoặc double scrollbar trên mobile và desktop.

## Cấu trúc thư mục

```text
app/
  page.tsx                  Entry point duy nhất
  layout.tsx                Metadata, font và app shell
  globals.css               Theme, layout, responsive và accessibility styles
components/
  BirthdayApp.tsx           Chọn creator, preview, locked hoặc public page
  creator/                  Birthday Creator và upload/publish controls
  birthday/                 Experience 3D, scenes, memories và Guest Book
  ui/                       Các primitive UI dùng lại
config/
  birthday.ts               BirthdayConfig, templates và MAX_BIRTHDAY_PHOTOS
hooks/
  useBirthdayDraft.ts       Anonymous auth, autosave và flush
  useBirthdayWishes.ts      Fetch, cooldown và Realtime wishes
  useDeviceQuality.ts       Quality profile cho Three.js
  useReducedMotion.ts       Reduced-motion preference
lib/
  media.ts                  Validate/nén ảnh và audio
  unlock.ts                 Timezone, lịch mở và countdown helpers
  supabase/                  Client, page RPC, asset và wish helpers
public/
  memories/                 Ảnh mẫu local cho config mặc định
  music/                    Nhạc mẫu local cho preview
supabase/
  schema.sql                Canonical schema/RLS/RPC/Storage
  patches/                  Migration an toàn cho database đã tồn tại
```

## Troubleshooting nhanh

| Hiện tượng | Cách kiểm tra |
| --- | --- |
| `Supabase chưa được cấu hình` | Kiểm tra `.env.local`, tên biến `NEXT_PUBLIC_*`, rồi build lại. |
| Anonymous session thất bại | Bật Anonymous Sign-Ins trong Supabase Authentication. |
| Upload bị từ chối | Kiểm tra MIME, extension, kích thước và còn slot ảnh; bucket phải là `birthday-assets`. |
| Publish báo hơn 3 ảnh | Xóa ảnh trong Creator; legacy config không bị tự xóa để tránh mất dữ liệu. |
| Trang đang khóa | Kiểm tra `unlock_at`, timezone và giờ server; chỉ snapshot published mới được trả sau unlock. |
| Guest Book không cập nhật | Chạy schema/patch, kiểm tra Realtime publication và RPC `get_published_birthday_wishes`. |
| Ảnh public không tải được | Trang phải published + unlocked; signed URL được tạo lại khi public page được đọc. |
| Build dùng env cũ | Cập nhật `.env.local` và chạy lại `npx vinext build`. |

## Quy ước thay đổi

- Giữ `project_id`, production URL và Site hiện tại khi deploy.
- Không commit `.env.local`, secret key hoặc file build tạm.
- Khi thay đổi schema, cập nhật cả `supabase/schema.sql`, patch cần thiết và `supabase/README.md`.
- Khi thay đổi flow publish hoặc config, cập nhật type trong `config/birthday.ts` và kiểm tra cả Creator, preview, public page, autosave, RPC và asset resolution.
