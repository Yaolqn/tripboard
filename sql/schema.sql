-- =============================================================
-- TripBoard V0.3 — Supabase schema + Row Level Security
-- Run this whole file in the Supabase SQL Editor (project → SQL).
-- The script is idempotent: it can be re-run safely.
-- =============================================================

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- auto-create a profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- trips ----------
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'My Trip',
  destination text not null default '',
  start_date date,
  end_date date,
  currency text not null default 'JPY',
  cover text,
  theme text not null default 'minimal',
  visibility text not null default 'private' check (visibility in ('private', 'unlisted', 'public')),
  status text not null default 'draft' check (status in ('draft', 'planning', 'ready', 'completed')),
  slug text unique,
  show_budget boolean not null default true,
  show_notes boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists trips_user_idx on public.trips (user_id);
create index if not exists trips_visibility_idx on public.trips (visibility);

-- ---------- trip_days ----------
create table if not exists public.trip_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  day_number int not null,
  date date,
  title text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists trip_days_trip_idx on public.trip_days (trip_id);

-- ---------- places ----------
-- Places are shared by activities through the provider identity. The activity
-- relationship remains nullable so legacy/free-form activities keep working.
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
create index if not exists places_provider_idx on public.places (provider, provider_place_id);

-- ---------- activities ----------
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.trip_days (id) on delete cascade,
  title text not null default '',
  time text not null default '',
  type text not null default 'other',
  location text,
  cost numeric,
  notes text,
  url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.activities
  add column if not exists place_id uuid references public.places(id) on delete set null;
create index if not exists activities_place_idx on public.activities (place_id);
create index if not exists activities_day_idx on public.activities (day_id);

-- ---------- trip_members ----------
create table if not exists public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'viewer' check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  unique (trip_id, user_id)
);
create index if not exists trip_members_user_idx on public.trip_members (user_id);

-- ---------- trip_invites (invite links) ----------
create table if not exists public.trip_invites (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  token text not null unique,
  role text not null default 'viewer' check (role in ('editor', 'viewer')),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

-- =============================================================
-- ROW LEVEL SECURITY
-- (drop-if-exists guards make the whole file re-runnable)
-- =============================================================
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_days enable row level security;
alter table public.activities enable row level security;
alter table public.places enable row level security;
alter table public.trip_members enable row level security;
alter table public.trip_invites enable row level security;

-- helper: is the current user a member (any role) of a trip?
create or replace function public.is_trip_member(trip_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.trip_members m
    where m.trip_id = $1 and m.user_id = auth.uid()
  );
$$;

-- helper: is the current user the owner (or owner-member) of a trip?
create or replace function public.is_trip_owner(trip_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.trips t
    where t.id = $1 and t.user_id = auth.uid()
  )
  or exists (
    select 1 from public.trip_members m
    where m.trip_id = $1 and m.user_id = auth.uid() and m.role = 'owner'
  );
$$;

-- ---------- profiles ----------
drop policy if exists "profiles: read own or member-of" on public.profiles;
create policy "profiles: read own or member-of" on public.profiles
  for select using (id = auth.uid());
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid());

-- ---------- trips ----------
drop policy if exists "trips: read own / member / public" on public.trips;
create policy "trips: read own / member / public" on public.trips
  for select using (
    user_id = auth.uid()
    or public.is_trip_member(id)
    or visibility = 'public'
  );
drop policy if exists "trips: insert own" on public.trips;
create policy "trips: insert own" on public.trips
  for insert with check (user_id = auth.uid());
drop policy if exists "trips: update owner/editor" on public.trips;
create policy "trips: update owner/editor" on public.trips
  for update using (
    public.is_trip_owner(id)
    or (public.is_trip_member(id) and exists (
      select 1 from public.trip_members m
      where m.trip_id = id and m.user_id = auth.uid() and m.role = 'editor'
    ))
  );
drop policy if exists "trips: delete owner" on public.trips;
create policy "trips: delete owner" on public.trips
  for delete using (public.is_trip_owner(id));

-- ---------- trip_days ----------
drop policy if exists "trip_days: read with trip" on public.trip_days;
create policy "trip_days: read with trip" on public.trip_days
  for select using (
    exists (
      select 1 from public.trips t
      where t.id = trip_id
        and (t.user_id = auth.uid() or t.visibility = 'public' or public.is_trip_member(t.id))
    )
  );
drop policy if exists "trip_days: write with trip" on public.trip_days;
create policy "trip_days: write with trip" on public.trip_days
  for all using (
    exists (
      select 1 from public.trips t
      where t.id = trip_id
        and (t.user_id = auth.uid() or (public.is_trip_member(t.id) and exists (
          select 1 from public.trip_members m
          where m.trip_id = t.id and m.user_id = auth.uid() and m.role in ('owner', 'editor')
        )))
    )
  )
  with check (exists (
    select 1 from public.trips t
    where t.id = trip_id
      and (t.user_id = auth.uid() or (public.is_trip_member(t.id) and exists (
        select 1 from public.trip_members m
        where m.trip_id = t.id and m.user_id = auth.uid() and m.role in ('owner', 'editor')
      )))
  ));

-- ---------- activities ----------
drop policy if exists "activities: read with day" on public.activities;
create policy "activities: read with day" on public.activities
  for select using (
    exists (
      select 1 from public.trip_days d
      join public.trips t on t.id = d.trip_id
      where d.id = day_id
        and (t.user_id = auth.uid() or t.visibility = 'public' or public.is_trip_member(t.id))
    )
  );
drop policy if exists "activities: write with day" on public.activities;
create policy "activities: write with day" on public.activities
  for all using (
    exists (
      select 1 from public.trip_days d
      join public.trips t on t.id = d.trip_id
      where d.id = day_id
        and (t.user_id = auth.uid() or (public.is_trip_member(t.id) and exists (
          select 1 from public.trip_members m
          where m.trip_id = t.id and m.user_id = auth.uid() and m.role in ('owner', 'editor')
        )))
    )
  )
  with check (exists (
    select 1 from public.trip_days d
    join public.trips t on t.id = d.trip_id
    where d.id = day_id
      and (t.user_id = auth.uid() or (public.is_trip_member(t.id) and exists (
        select 1 from public.trip_members m
        where m.trip_id = t.id and m.user_id = auth.uid() and m.role in ('owner', 'editor')
      )))
  ));

-- ---------- places ----------
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

-- ---------- trip_members ----------
drop policy if exists "trip_members: read own/owner" on public.trip_members;
create policy "trip_members: read own/owner" on public.trip_members
  for select using (
    user_id = auth.uid()
    or exists (select 1 from public.trips t where t.id = trip_id and public.is_trip_owner(t.id))
  );
drop policy if exists "trip_members: owner manages" on public.trip_members;
create policy "trip_members: owner manages" on public.trip_members
  for all using (exists (select 1 from public.trips t where t.id = trip_id and public.is_trip_owner(t.id)))
  with check (exists (select 1 from public.trips t where t.id = trip_id and public.is_trip_owner(t.id)));

-- ---------- trip_invites ----------
drop policy if exists "trip_invites: read owner / by token" on public.trip_invites;
create policy "trip_invites: read owner / by token" on public.trip_invites
  for select using (
    exists (select 1 from public.trips t where t.id = trip_id and public.is_trip_owner(t.id))
  );
drop policy if exists "trip_invites: owner creates" on public.trip_invites;
create policy "trip_invites: owner creates" on public.trip_invites
  for insert with check (exists (select 1 from public.trips t where t.id = trip_id and public.is_trip_owner(t.id)));
drop policy if exists "trip_invites: owner deletes" on public.trip_invites;
create policy "trip_invites: owner deletes" on public.trip_invites
  for delete using (exists (select 1 from public.trips t where t.id = trip_id and public.is_trip_owner(t.id)));

-- =============================================================
-- INVITE RPCs (security definer — the shared token is the credential)
-- =============================================================
create or replace function public.get_invite(invite_token text)
returns table (trip_id uuid, role text, trip_title text)
language sql stable security definer set search_path = public
as $$
  select i.trip_id, i.role, t.title
  from public.trip_invites i
  join public.trips t on t.id = i.trip_id
  where i.token = invite_token
    and (i.expires_at is null or i.expires_at > now());
$$;

create or replace function public.accept_invite(invite_token text)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  inv record;
begin
  select trip_id, role into inv
  from public.trip_invites
  where token = invite_token
    and (expires_at is null or expires_at > now());
  if inv.trip_id is null then
    return false;
  end if;
  insert into public.trip_members (trip_id, user_id, role)
  values (inv.trip_id, auth.uid(), inv.role)
  on conflict (trip_id, user_id) do update set role = excluded.role;
  delete from public.trip_invites where token = invite_token;
  return true;
end;
$$;

revoke all on function public.get_invite(text) from public;
revoke all on function public.accept_invite(text) from public;
grant execute on function public.get_invite(text) to authenticated;
grant execute on function public.accept_invite(text) to authenticated;
