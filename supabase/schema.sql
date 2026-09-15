create extension if not exists pgcrypto;

create table if not exists public.birthday_pages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text unique,
  status text not null default 'draft' check (status in ('draft', 'published')),
  recipient_name text not null,
  title text not null,
  template_id text not null default 'midnight-wish',
  config jsonb not null default '{}'::jsonb,
  published_config jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_snapshot_required check (status <> 'published' or published_config is not null)
);

create index if not exists birthday_pages_owner_updated_idx on public.birthday_pages (owner_id, updated_at desc);
create unique index if not exists birthday_pages_published_slug_idx on public.birthday_pages (slug) where status = 'published';

alter table public.birthday_pages enable row level security;

drop policy if exists "owners can create birthday pages" on public.birthday_pages;
create policy "owners can create birthday pages"
on public.birthday_pages for insert to authenticated
with check (owner_id = auth.uid());

drop policy if exists "owners can read birthday pages" on public.birthday_pages;
create policy "owners can read birthday pages"
on public.birthday_pages for select to authenticated
using (owner_id = auth.uid());

drop policy if exists "owners can update birthday pages" on public.birthday_pages;
create policy "owners can update birthday pages"
on public.birthday_pages for update to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "owners can delete birthday pages" on public.birthday_pages;
create policy "owners can delete birthday pages"
on public.birthday_pages for delete to authenticated
using (owner_id = auth.uid());

drop policy if exists "visitors can read published birthday pages" on public.birthday_pages;
create policy "visitors can read published birthday pages"
on public.birthday_pages for select to anon
using (status = 'published' and published_config is not null);

revoke all on public.birthday_pages from anon;
grant select (id, slug, status, recipient_name, title, template_id, published_config, published_at, created_at, updated_at)
on public.birthday_pages to anon;
grant select, insert, update, delete on public.birthday_pages to authenticated;

-- An immutable, dependency-free Vietnamese-friendly slug base.
create or replace function public.unaccent_name(value text)
returns text
language sql
immutable
parallel safe
return translate(
  value,
  'áàảãạăắằẳẵặâấầẩẫậđéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬĐÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴ',
  'aaaaaaaaaaaaaaaaadeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyAAAAAAAAAAAAAAAAADEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYY'
);

create or replace function public.publish_birthday_page(page_uuid uuid, config_snapshot jsonb)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  generated_slug text;
  existing_slug text;
  recipient text;
begin
  select recipient_name, slug into recipient, existing_slug from public.birthday_pages where id = page_uuid and owner_id = auth.uid();
  if recipient is null then raise exception 'Birthday page not found or access denied'; end if;
  if existing_slug is null then
    loop
      generated_slug := trim(both '-' from regexp_replace(lower(public.unaccent_name(recipient)), '[^a-z0-9]+', '-', 'g')) || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
      exit when not exists (select 1 from public.birthday_pages where slug = generated_slug);
    end loop;
  else
    generated_slug := existing_slug;
  end if;
  update public.birthday_pages set config = config_snapshot, published_config = config_snapshot, slug = generated_slug, status = 'published', published_at = now(), updated_at = now() where id = page_uuid and owner_id = auth.uid();
  return generated_slug;
end;
$$;

revoke all on function public.publish_birthday_page(uuid, jsonb) from public;
grant execute on function public.publish_birthday_page(uuid, jsonb) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'birthday-assets',
  'birthday-assets',
  false,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a']
)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "owners can upload birthday assets" on storage.objects;
create policy "owners can upload birthday assets"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'birthday-assets'
  and split_part(name, '/', 1) = auth.uid()::text
  and exists (
    select 1 from public.birthday_pages
    where id::text = split_part(name, '/', 2) and owner_id = auth.uid()
  )
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'mp3', 'wav', 'ogg', 'm4a', 'mp4')
);

drop policy if exists "owners can read birthday assets" on storage.objects;
create policy "owners can read birthday assets"
on storage.objects for select to authenticated
using (bucket_id = 'birthday-assets' and split_part(name, '/', 1) = auth.uid()::text);

drop policy if exists "owners can update birthday assets" on storage.objects;
create policy "owners can update birthday assets"
on storage.objects for update to authenticated
using (bucket_id = 'birthday-assets' and split_part(name, '/', 1) = auth.uid()::text)
with check (bucket_id = 'birthday-assets' and split_part(name, '/', 1) = auth.uid()::text);

drop policy if exists "owners can delete birthday assets" on storage.objects;
create policy "owners can delete birthday assets"
on storage.objects for delete to authenticated
using (bucket_id = 'birthday-assets' and split_part(name, '/', 1) = auth.uid()::text);

drop policy if exists "visitors can read published birthday assets" on storage.objects;
create policy "visitors can read published birthday assets"
on storage.objects for select to anon
using (
  bucket_id = 'birthday-assets'
  and exists (
    select 1 from public.birthday_pages
    where id::text = split_part(name, '/', 2) and status = 'published'
  )
);
