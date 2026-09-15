# Supabase setup

1. Create a Supabase project and enable **Anonymous Sign-Ins** in Authentication → Providers.
2. Open SQL Editor and run `schema.sql` once. It creates `birthday_pages`, the publish function, RLS policies, and the private `birthday-assets` bucket.
3. Copy `.env.example` to `.env.local`, then add the Project URL and publishable key. Never use a secret or service-role key in this app.
4. Run `npm run build` again after changing public environment variables. This is a static export, so the values are embedded at build time.

Published visitors read only rows whose status is `published`. Uploaded files remain private; signed URLs are created only when the owner is signed in or the page containing the asset is published.
