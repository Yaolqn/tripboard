-- TripBoard V0.3.2: fix resolve_places column-name ambiguity.
-- Run after 20260818_v031_places.sql.

create or replace function public.resolve_places(place_inputs jsonb)
returns table (id uuid, provider text, provider_place_id text)
language plpgsql security definer set search_path = public
as $$
declare
  item record;
  resolved_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  for item in
    select * from jsonb_to_recordset(coalesce(place_inputs, '[]'::jsonb)) as x(
      provider text,
      provider_place_id text,
      name text,
      formatted_address text,
      city text,
      country text,
      country_code text,
      latitude double precision,
      longitude double precision
    )
  loop
    if item.provider <> 'amap'
      or item.provider_place_id is null
      or item.provider_place_id = ''
      or item.latitude not between -90 and 90
      or item.longitude not between -180 and 180 then
      raise exception 'Invalid place input';
    end if;

    insert into public.places as p (
      provider, provider_place_id, name, formatted_address,
      city, country, country_code, latitude, longitude, updated_at
    ) values (
      item.provider, item.provider_place_id, coalesce(item.name, ''),
      coalesce(item.formatted_address, ''), item.city, item.country,
      item.country_code, item.latitude, item.longitude, now()
    )
    on conflict on constraint places_provider_provider_place_id_key do update set
      name = excluded.name,
      formatted_address = excluded.formatted_address,
      city = excluded.city,
      country = excluded.country,
      country_code = excluded.country_code,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      updated_at = now()
    returning p.id into resolved_id;

    id := resolved_id;
    provider := item.provider;
    provider_place_id := item.provider_place_id;
    return next;
  end loop;
end;
$$;

revoke all on function public.resolve_places(jsonb) from public;
grant execute on function public.resolve_places(jsonb) to authenticated;
