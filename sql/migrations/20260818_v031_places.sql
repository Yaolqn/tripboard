-- TripBoard V0.3.1: structured AMap places.
-- Safe to run after the original V0.3 schema. Legacy activities.location is retained.

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'amap' check (provider = 'amap'),
  provider_place_id text not null,
  name text not null,
  formatted_address text not null default '',
  city text,
  country text,
  country_code text,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_place_id)
);

alter table public.activities
  add column if not exists place_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'activities_place_id_fkey'
  ) THEN
    ALTER TABLE public.activities
      ADD CONSTRAINT activities_place_id_fkey
      FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE SET NULL;
  END IF;
END $$;

create index if not exists places_provider_idx
  on public.places (provider, provider_place_id);
create index if not exists activities_place_idx
  on public.activities (place_id);

alter table public.places enable row level security;

drop policy if exists "places: read with trip" on public.places;
create policy "places: read with trip" on public.places
  for select using (
    exists (
      select 1 from public.activities a
      join public.trip_days d on d.id = a.day_id
      join public.trips t on t.id = d.trip_id
      where a.place_id = places.id
        and (t.user_id = auth.uid() or t.visibility = 'public' or public.is_trip_member(t.id))
    )
  );

drop policy if exists "places: write with trip" on public.places;
drop policy if exists "places: insert authenticated" on public.places;
create policy "places: insert authenticated" on public.places
  for insert with check (
    auth.uid() is not null
    and provider = 'amap'
    and latitude between -90 and 90
    and longitude between -180 and 180
  );

-- Resolve provider identities atomically without exposing the place catalog.
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

-- Keep edits and deletes limited to places linked to an owned or editable trip.
drop policy if exists "places: update with trip" on public.places;
create policy "places: update with trip" on public.places
  for update using (
    exists (
      select 1 from public.activities a
      join public.trip_days d on d.id = a.day_id
      join public.trips t on t.id = d.trip_id
      where a.place_id = places.id
        and (t.user_id = auth.uid() or (public.is_trip_member(t.id) and exists (
          select 1 from public.trip_members m
          where m.trip_id = t.id and m.user_id = auth.uid() and m.role in ('owner', 'editor')
        )))
    )
  )
  with check (provider = 'amap' and latitude between -90 and 90 and longitude between -180 and 180);

drop policy if exists "places: delete with trip" on public.places;
create policy "places: delete with trip" on public.places
  for delete using (
    exists (
      select 1 from public.activities a
      join public.trip_days d on d.id = a.day_id
      join public.trips t on t.id = d.trip_id
      where a.place_id = places.id
        and (t.user_id = auth.uid() or (public.is_trip_member(t.id) and exists (
          select 1 from public.trip_members m
          where m.trip_id = t.id and m.user_id = auth.uid() and m.role in ('owner', 'editor')
        )))
    )
  );
