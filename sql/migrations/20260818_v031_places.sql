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
create policy "places: write with trip" on public.places
  for all using (
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
