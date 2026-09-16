# Supabase setup

1. Create a Supabase project and enable **Anonymous Sign-Ins** in Authentication → Providers.
2. Open SQL Editor and run `schema.sql`. It creates or upgrades `birthday_pages`, the publish/locked-viewer functions, RLS policies, and the private `birthday-assets` bucket. Re-run it after pulling schema changes so the Scheduled Unlock columns and RPC are installed.
3. Copy `.env.example` to `.env.local`, then add the Project URL and publishable key. Never use a secret or service-role key in this app.
4. Run `npm run build` again after changing public environment variables. This is a static export, so the values are embedded at build time.

Published visitors use the `get_published_birthday` RPC: before `unlock_at` it returns only safe metadata, and after unlock it returns the published snapshot. Uploaded files remain private; signed URLs are created only when the owner is signed in or the page is published and unlocked.
