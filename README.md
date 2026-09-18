# A Birthday in the Stars

Website sinh nhật tương tác 3D được xây dựng bằng React, Vinext, Three.js và Supabase.

## Tính năng

- Birthday Experience cinematic với cake, candles, fireworks, memories và gift scene.
- Scheduled Unlock: trang published có thể mở theo thời điểm và timezone đã chọn.
- Birthday photos: mỗi trang được lưu và publish tối đa 3 ảnh kỷ niệm.
- Guest Book / Wish Galaxy: khách gửi lời chúc, mỗi lời chúc trở thành một ngôi sao trong cảnh Three.js.
- Realtime wishes, accessible fallback list/detail dialog, reduced-motion và tối ưu mobile.
- Supabase RLS, RPC validation, server cooldown 15 giây và private birthday assets.

## Chạy local

Yêu cầu Node.js `>=22.13.0`.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Các biến môi trường cần có:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Không đưa secret key hoặc service-role key vào frontend.

## Supabase

Mở **Supabase Dashboard → SQL Editor** và chạy [`supabase/schema.sql`](supabase/schema.sql). File này tạo hoặc nâng cấp:

- `birthday_pages` và Scheduled Unlock RPC;
- `birthday_wishes`, Guest Book RPC và Realtime publication;
- RLS policies cho owner/visitor;
- bucket private `birthday-assets` và storage policies.

Nếu database đã có đầy đủ Guest Book objects và chỉ gặp lỗi PostgreSQL `42702`, chạy patch [`supabase/patches/fix_birthday_wish_ambiguity.sql`](supabase/patches/fix_birthday_wish_ambiguity.sql). Patch không drop bảng và không xóa dữ liệu.

Nếu database đã có schema nhưng chưa có guard giới hạn ảnh ở RPC publish, chạy [`supabase/patches/enforce_birthday_photo_limit.sql`](supabase/patches/enforce_birthday_photo_limit.sql).

Sau khi thay đổi public environment variables, phải chạy lại build vì giá trị được nhúng vào static export.

## Validation

```bash
npx tsc --noEmit
npm run lint
npm run build
```

`npm run build` sử dụng `vinext build` và tạo production artifact tại `dist/client`.

## OpenAI Sites

Project này dùng Site hiện tại được khai báo trong [`.openai/hosting.json`](.openai/hosting.json). Không tạo Site hoặc project mới khi cập nhật website.

- Build command: `vinext build`
- Static directory: `dist/client`
- Production URL: <https://birthday-midnight-wish.phophoccode.chatgpt.site>

Quy trình publish chuẩn là build và kiểm tra artifact trước, sau đó lưu version mới và deploy vào đúng Site hiện tại.

## Cấu trúc liên quan

```text
app/                         App shell và global styles
components/birthday/        Birthday scenes, CosmicCanvas, Wish Galaxy
components/creator/         Birthday Creator và preview
config/                     Birthday/Guest Book configuration
hooks/                      Device quality, reduced motion, wishes data
lib/supabase/                Supabase client và RPC helpers
supabase/                    Canonical schema, README và SQL patches
scripts/                    Browser/performance QA helpers
```
