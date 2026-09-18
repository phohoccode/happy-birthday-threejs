-- Apply this patch to an existing database after the Guest Book/Scheduled Unlock schema.
-- It replaces only the publish RPC and does not drop tables or data.

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
