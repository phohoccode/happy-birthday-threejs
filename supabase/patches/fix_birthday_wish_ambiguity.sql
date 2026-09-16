-- Patch for an existing Supabase database.
-- This only replaces functions/policies; it does not drop tables or data.

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

create or replace function public.publish_birthday_page(
  page_uuid uuid,
  config_snapshot jsonb,
  unlock_timestamp timestamptz,
  unlock_zone text
)
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

create or replace function public.submit_birthday_wish(
  p_birthday_slug text,
  p_author_name text,
  p_message text,
  p_visitor_id text default null
)
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

create or replace function public.set_birthday_wish_status(p_wish_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('VISIBLE', 'HIDDEN') then raise exception 'Invalid wish status'; end if;
  if not exists (
    select 1
    from public.birthday_wishes wish
    join public.birthday_pages page on page.id = wish.birthday_id
    where wish.id = p_wish_id
      and page.owner_id = auth.uid()
  ) then
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
  if not exists (
    select 1
    from public.birthday_wishes wish
    join public.birthday_pages page on page.id = wish.birthday_id
    where wish.id = p_wish_id
      and page.owner_id = auth.uid()
  ) then
    raise exception 'Wish not found or access denied';
  end if;
  delete from public.birthday_wishes wish
   where wish.id = p_wish_id;
end;
$$;

revoke all on function public.delete_birthday_wish(uuid) from public;
grant execute on function public.delete_birthday_wish(uuid) to authenticated;

-- The storage policies are unchanged semantically; qualify outer storage columns
-- and the correlated birthday_pages columns to keep nested references explicit.
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
