create extension if not exists pgcrypto;

create table if not exists public.birthday_pages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text unique,
  status text not null default 'draft' check (status in ('draft', 'published')),
  recipient_name text not null,
  title text not null,
  template_id text not null default 'midnight-wish',
  unlock_at timestamptz,
  unlock_timezone text not null default 'Asia/Ho_Chi_Minh',
  config jsonb not null default '{}'::jsonb,
  published_config jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_snapshot_required check (status <> 'published' or published_config is not null)
);

alter table public.birthday_pages add column if not exists unlock_at timestamptz;
alter table public.birthday_pages add column if not exists unlock_timezone text not null default 'Asia/Ho_Chi_Minh';

create table if not exists public.birthday_wishes (
  id uuid primary key default gen_random_uuid(),
  birthday_id uuid not null references public.birthday_pages(id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 40),
  message text not null check (char_length(message) between 1 and 500),
  status text not null default 'VISIBLE' check (status in ('VISIBLE', 'HIDDEN')),
  created_at timestamptz not null default now(),
  moderated_at timestamptz,
  visitor_id text
);

create index if not exists birthday_wishes_page_status_created_idx on public.birthday_wishes (birthday_id, status, created_at desc);
create index if not exists birthday_wishes_visitor_created_idx on public.birthday_wishes (visitor_id, created_at desc) where visitor_id is not null;

alter table public.birthday_wishes enable row level security;

drop policy if exists "visitors can read visible birthday wishes" on public.birthday_wishes;
create policy "visitors can read visible birthday wishes"
on public.birthday_wishes for select to anon
using (
  public.birthday_wishes.status = 'VISIBLE'
  and exists (
    select 1
    from public.birthday_pages page
    where page.id = public.birthday_wishes.birthday_id
      and page.status = 'published'
      and (page.unlock_at is null or page.unlock_at <= now())
  )
);

drop policy if exists "owners can read birthday wishes" on public.birthday_wishes;
create policy "owners can read birthday wishes"
on public.birthday_wishes for select to authenticated
using (
  exists (
    select 1
    from public.birthday_pages page
    where page.id = public.birthday_wishes.birthday_id
      and page.owner_id = auth.uid()
  )
);

revoke all on public.birthday_wishes from anon, authenticated;
grant select (id, birthday_id, author_name, message, created_at) on public.birthday_wishes to anon;
grant select on public.birthday_wishes to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'birthday_wishes') then
    execute 'alter publication supabase_realtime add table public.birthday_wishes';
  end if;
end;
$$;

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
revoke all on public.birthday_pages from anon;
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

drop function if exists public.publish_birthday_page(uuid, jsonb);

create or replace function public.publish_birthday_page(page_uuid uuid, config_snapshot jsonb, unlock_timestamp timestamptz, unlock_zone text)
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
  select page.recipient_name, page.slug
    into recipient, existing_slug
    from public.birthday_pages page
   where page.id = page_uuid
     and page.owner_id = auth.uid();
  if recipient is null then raise exception 'Birthday page not found or access denied'; end if;
  if jsonb_typeof(coalesce(config_snapshot -> 'memories', '[]'::jsonb)) <> 'array' then
    raise exception 'Birthday page memories must be an array';
  end if;
  if jsonb_array_length(coalesce(config_snapshot -> 'memories', '[]'::jsonb)) > 3 then
    raise exception 'Birthday page can contain at most 3 photos';
  end if;
  if unlock_zone is null or not exists (select 1 from pg_timezone_names where name = unlock_zone) then
    raise exception 'Invalid unlock timezone';
  end if;
  if unlock_timestamp is not null and unlock_timestamp <= now() then
    raise exception 'Unlock time must be in the future';
  end if;
  if existing_slug is null then
    loop
      generated_slug := trim(both '-' from regexp_replace(lower(public.unaccent_name(recipient)), '[^a-z0-9]+', '-', 'g')) || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
      exit when not exists (
        select 1
        from public.birthday_pages page
        where page.slug = generated_slug
      );
    end loop;
  else
    generated_slug := existing_slug;
  end if;
  update public.birthday_pages page
     set config = config_snapshot,
         published_config = config_snapshot,
         slug = generated_slug,
         status = 'published',
         unlock_at = unlock_timestamp,
         unlock_timezone = unlock_zone,
         published_at = now(),
         updated_at = now()
   where page.id = page_uuid
     and page.owner_id = auth.uid();
  return generated_slug;
end;
$$;

revoke all on function public.publish_birthday_page(uuid, jsonb, timestamptz, text) from public;
grant execute on function public.publish_birthday_page(uuid, jsonb, timestamptz, text) to authenticated;

create or replace function public.get_published_birthday(page_slug text)
returns table (
  id uuid,
  slug text,
  recipient_name text,
  title text,
  template_id text,
  unlock_at timestamptz,
  unlock_timezone text,
  published_at timestamptz,
  published_config jsonb,
  unlock_status text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    page.id,
    page.slug,
    page.recipient_name,
    page.title,
    page.template_id,
    page.unlock_at,
    page.unlock_timezone,
    page.published_at,
    case when page.unlock_at is null or page.unlock_at <= now() then page.published_config else null end,
    case when page.unlock_at is null or page.unlock_at <= now() then 'OPEN' else 'LOCKED' end
  from public.birthday_pages page
  where page.slug = page_slug
    and page.status = 'published'
    and page.published_config is not null
  limit 1;
$$;

revoke all on function public.get_published_birthday(text) from public;
grant execute on function public.get_published_birthday(text) to anon, authenticated;

drop function if exists public.submit_birthday_wish(text, text, text, text);
create or replace function public.submit_birthday_wish(p_birthday_slug text, p_author_name text, p_message text, p_visitor_id text default null)
returns table (id uuid, author_name text, message text, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_page_id uuid;
  v_status text;
  v_unlock_at timestamptz;
  v_author_name text;
  v_message text;
  v_visitor_id text;
  v_wish_id uuid;
  v_created_at timestamptz;
begin
  select page.id, page.status, page.unlock_at
    into v_page_id, v_status, v_unlock_at
    from public.birthday_pages page
   where page.slug = btrim(coalesce(p_birthday_slug, ''))
   limit 1;
  if v_page_id is null or v_status <> 'published' then raise exception 'Birthday page is not available'; end if;
  if v_unlock_at is not null and v_unlock_at > now() then raise exception 'Birthday page is still locked'; end if;

  v_author_name := regexp_replace(btrim(coalesce(p_author_name, '')), '\s+', ' ', 'g');
  v_message := btrim(coalesce(p_message, ''));
  v_visitor_id := nullif(left(btrim(coalesce(p_visitor_id, '')), 128), '');
  if char_length(v_author_name) < 1 or char_length(v_author_name) > 40 then raise exception 'Author name must be between 1 and 40 characters'; end if;
  if char_length(v_message) < 1 or char_length(v_message) > 500 then raise exception 'Wish message must be between 1 and 500 characters'; end if;

  if v_visitor_id is not null then
    perform pg_advisory_xact_lock(hashtextextended(v_visitor_id, 0));
    if exists (
      select 1
      from public.birthday_wishes wish
      where wish.visitor_id = v_visitor_id
        and wish.created_at > now() - interval '15 seconds'
    ) then
      raise exception 'Please wait before sending another wish';
    end if;
  end if;

  insert into public.birthday_wishes (birthday_id, author_name, message, visitor_id)
  values (v_page_id, v_author_name, v_message, v_visitor_id)
  returning birthday_wishes.id, birthday_wishes.created_at into v_wish_id, v_created_at;
  return query select v_wish_id, v_author_name, v_message, v_created_at;
end;
$$;

revoke all on function public.submit_birthday_wish(text, text, text, text) from public;
grant execute on function public.submit_birthday_wish(text, text, text, text) to anon, authenticated;

create or replace function public.get_published_birthday_wishes(p_birthday_slug text)
returns table (id uuid, author_name text, message text, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select wish.id, wish.author_name, wish.message, wish.created_at
    from public.birthday_wishes wish
    join public.birthday_pages page on page.id = wish.birthday_id
   where page.slug = btrim(coalesce(p_birthday_slug, ''))
     and page.status = 'published'
     and (page.unlock_at is null or page.unlock_at <= now())
     and wish.status = 'VISIBLE'
   order by wish.created_at desc
   limit 100;
$$;

revoke all on function public.get_published_birthday_wishes(text) from public;
grant execute on function public.get_published_birthday_wishes(text) to anon, authenticated;

create or replace function public.set_birthday_wish_status(p_wish_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('VISIBLE', 'HIDDEN') then raise exception 'Invalid wish status'; end if;
  if not exists (select 1 from public.birthday_wishes wish join public.birthday_pages page on page.id = wish.birthday_id where wish.id = p_wish_id and page.owner_id = auth.uid()) then
    raise exception 'Wish not found or access denied';
  end if;
  update public.birthday_wishes wish
     set status = p_status,
         moderated_at = case when p_status = 'HIDDEN' then now() else null end
   where wish.id = p_wish_id;
end;
$$;

revoke all on function public.set_birthday_wish_status(uuid, text) from public;
grant execute on function public.set_birthday_wish_status(uuid, text) to authenticated;

create or replace function public.delete_birthday_wish(p_wish_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.birthday_wishes wish join public.birthday_pages page on page.id = wish.birthday_id where wish.id = p_wish_id and page.owner_id = auth.uid()) then
    raise exception 'Wish not found or access denied';
  end if;
  delete from public.birthday_wishes wish
   where wish.id = p_wish_id;
end;
$$;

revoke all on function public.delete_birthday_wish(uuid) from public;
grant execute on function public.delete_birthday_wish(uuid) to authenticated;

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
  storage.objects.bucket_id = 'birthday-assets'
  and split_part(storage.objects.name, '/', 1) = auth.uid()::text
  and exists (
    select 1
    from public.birthday_pages page
    where page.id::text = split_part(storage.objects.name, '/', 2)
      and page.owner_id = auth.uid()
  )
  and lower(storage.extension(storage.objects.name)) in ('jpg', 'jpeg', 'png', 'webp', 'mp3', 'wav', 'ogg', 'm4a', 'mp4')
);

drop policy if exists "owners can read birthday assets" on storage.objects;
create policy "owners can read birthday assets"
on storage.objects for select to authenticated
using (
  storage.objects.bucket_id = 'birthday-assets'
  and split_part(storage.objects.name, '/', 1) = auth.uid()::text
);

drop policy if exists "owners can update birthday assets" on storage.objects;
create policy "owners can update birthday assets"
on storage.objects for update to authenticated
using (
  storage.objects.bucket_id = 'birthday-assets'
  and split_part(storage.objects.name, '/', 1) = auth.uid()::text
)
with check (
  storage.objects.bucket_id = 'birthday-assets'
  and split_part(storage.objects.name, '/', 1) = auth.uid()::text
);

drop policy if exists "owners can delete birthday assets" on storage.objects;
create policy "owners can delete birthday assets"
on storage.objects for delete to authenticated
using (
  storage.objects.bucket_id = 'birthday-assets'
  and split_part(storage.objects.name, '/', 1) = auth.uid()::text
);

drop policy if exists "visitors can read published birthday assets" on storage.objects;
create policy "visitors can read published birthday assets"
on storage.objects for select to anon
using (
  storage.objects.bucket_id = 'birthday-assets'
  and exists (
    select 1
    from public.birthday_pages page
    where page.id::text = split_part(storage.objects.name, '/', 2)
      and page.status = 'published'
      and (page.unlock_at is null or page.unlock_at <= now())
  )
);
