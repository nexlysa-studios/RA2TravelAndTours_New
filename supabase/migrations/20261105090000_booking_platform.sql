-- Guest enquiries enter only through the validated Edge Function. Auth accounts
-- are for staff; profiles and roles are created together by the Auth trigger.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated, service_role;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null default 'user' check (role in ('admin', 'user')),
  updated_at timestamptz not null default now()
);

create function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.user_roles where user_id = (select auth.uid()) and role = 'admin');
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated, service_role;

create function public.has_admin_role() returns boolean
language sql stable security invoker set search_path = '' as $$ select private.is_admin(); $$;
revoke all on function public.has_admin_role() from public;
grant execute on function public.has_admin_role() to authenticated, service_role;

create function private.sync_auth_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do update set email = excluded.email, updated_at = now();
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke all on function private.sync_auth_profile() from public, anon, authenticated;
create trigger sync_auth_profile after insert or update of email on auth.users
for each row execute function private.sync_auth_profile();

insert into public.profiles (id, email, full_name)
select id, coalesce(email, ''), coalesce(raw_user_meta_data ->> 'full_name', '') from auth.users;
insert into public.user_roles (user_id) select id from public.profiles;

create function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end; $$;
revoke all on function private.touch_updated_at() from public, anon, authenticated;
create trigger touch_profiles before update on public.profiles for each row execute function private.touch_updated_at();
create trigger touch_roles before update on public.user_roles for each row execute function private.touch_updated_at();

-- Prevent accidentally removing the final administrator, including in Table Editor.
create function private.protect_last_admin() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(73201982);
  if old.role = 'admin' then
    if tg_op = 'DELETE' or new.role <> 'admin' then
      if (select count(*) from public.user_roles where role = 'admin') <= 1 then
        raise exception 'The last administrator cannot be removed. Add another admin first.';
      end if;
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function private.protect_last_admin() from public, anon, authenticated;
create trigger protect_last_admin before update or delete on public.user_roles for each row execute function private.protect_last_admin();

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('RA2-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  request_id uuid not null unique,
  request_hash text not null,
  experience text not null check (experience in ('Private Cape Peninsula Tour', 'Private Cape Winelands Tour', 'City & Table Mountain', 'Aquila Safari Day', 'Tailor-made Journey', 'Safari (Kruger / Sabi Sands)', 'Transfer / Chauffeur', 'Not sure yet')),
  travel_date date,
  flexible_dates boolean not null default false,
  adults integer not null check (adults between 1 and 100),
  children integer not null default 0 check (children between 0 and 100),
  pickup_location text not null default '' check (length(pickup_location) <= 300),
  dropoff_location text not null default '' check (length(dropoff_location) <= 300),
  pickup_time text not null default '',
  flight_number text not null default '' check (length(flight_number) <= 30),
  luggage integer not null default 0 check (luggage between 0 and 200),
  special_requests text not null default '' check (length(special_requests) <= 3000),
  full_name text not null check (length(full_name) between 2 and 120),
  email text not null check (length(email) <= 254),
  phone text not null check (length(phone) between 7 and 30),
  contact_preference text not null check (contact_preference in ('email', 'phone', 'whatsapp')),
  consent_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new', 'contacted', 'quoted', 'confirmed', 'completed', 'cancelled')),
  admin_notes text not null default '' check (length(admin_notes) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint date_or_flexible check (flexible_dates or travel_date is not null),
  constraint transfer_locations check (experience <> 'Transfer / Chauffeur' or (length(pickup_location) >= 2 and length(dropoff_location) >= 2 and pickup_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'))
);
create index bookings_created_at_idx on public.bookings (created_at desc);
create index bookings_status_idx on public.bookings (status, created_at desc);
create index bookings_travel_date_idx on public.bookings (travel_date);
create trigger touch_bookings before update on public.bookings for each row execute function private.touch_updated_at();

create table public.booking_emails (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  audience text not null check (audience in ('guest', 'admin')),
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed')),
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  lock_token uuid,
  provider_id text,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (booking_id, audience)
);
create index booking_emails_queue_idx on public.booking_emails (status, available_at);

create table private.booking_rate_limits (
  key_hash text primary key,
  window_start timestamptz not null,
  requests integer not null
);

-- Service-only rate limit. Atomic counters also cover concurrent requests.
create function public.consume_booking_limit(p_key text, p_limit integer) returns boolean
language plpgsql security definer set search_path = '' as $$
declare hits integer;
begin
  insert into private.booking_rate_limits as limits (key_hash, window_start, requests)
  values (p_key, now(), 1)
  on conflict (key_hash) do update set
    requests = case when limits.window_start < now() - interval '15 minutes' then 1 else limits.requests + 1 end,
    window_start = case when limits.window_start < now() - interval '15 minutes' then now() else limits.window_start end
  returning requests into hits;
  delete from private.booking_rate_limits where window_start < now() - interval '1 day';
  return hits <= p_limit;
end;
$$;

-- Commit the booking and both email jobs in one transaction. The request UUID
-- is a retry credential; a mismatched payload may never retrieve a prior receipt.
create function public.create_guest_booking(p_request_id uuid, p_hash text, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare b public.bookings;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));
  select * into b from public.bookings where request_id = p_request_id;
  if found then
    if b.request_hash <> p_hash then raise exception 'REQUEST_CONFLICT'; end if;
    return jsonb_build_object('id', b.id, 'reference', b.reference, 'duplicate', true);
  end if;
  insert into public.bookings (
    request_id, request_hash, experience, travel_date, flexible_dates, adults, children,
    pickup_location, dropoff_location, pickup_time, flight_number, luggage, special_requests,
    full_name, email, phone, contact_preference
  ) values (
    p_request_id, p_hash, p_data->>'experience', nullif(p_data->>'travel_date', '')::date,
    (p_data->>'flexible_dates')::boolean, (p_data->>'adults')::integer, (p_data->>'children')::integer,
    p_data->>'pickup_location', p_data->>'dropoff_location', p_data->>'pickup_time', p_data->>'flight_number',
    (p_data->>'luggage')::integer, p_data->>'special_requests', p_data->>'full_name',
    p_data->>'email', p_data->>'phone', p_data->>'contact_preference'
  ) returning * into b;
  insert into public.booking_emails (booking_id, audience) values (b.id, 'guest'), (b.id, 'admin');
  return jsonb_build_object('id', b.id, 'reference', b.reference, 'duplicate', false);
end;
$$;

-- SKIP LOCKED plus a lease token prevents cron and on-submit workers from
-- delivering the same job concurrently. Stale leases are recoverable.
create function public.claim_booking_emails(p_booking_id uuid default null, p_limit integer default 10)
returns setof public.booking_emails language sql security definer set search_path = '' as $$
  with candidates as (
    select id from public.booking_emails
    where ((status = 'pending' and available_at <= now()) or (status = 'sending' and locked_at < now() - interval '5 minutes'))
      and attempts < 8 and (p_booking_id is null or booking_id = p_booking_id)
    order by created_at for update skip locked limit least(greatest(p_limit, 1), 20)
  ) update public.booking_emails as jobs set status = 'sending', locked_at = now(), lock_token = gen_random_uuid(), attempts = attempts + 1
    from candidates where jobs.id = candidates.id returning jobs.*;
$$;

create function public.retry_booking_emails(p_booking_id uuid) returns integer
language plpgsql security definer set search_path = '' as $$
declare affected integer;
begin
  if not private.is_admin() then raise exception 'Administrator access required' using errcode = '42501'; end if;
  update public.booking_emails set status = 'pending', available_at = now(), attempts = 0, last_error = null,
    locked_at = null, lock_token = null
  where booking_id = p_booking_id and (status in ('pending', 'failed') or (status = 'sending' and locked_at < now() - interval '5 minutes'));
  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.consume_booking_limit(text, integer) from public, anon, authenticated;
revoke all on function public.create_guest_booking(uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.claim_booking_emails(uuid, integer) from public, anon, authenticated;
revoke all on function public.retry_booking_emails(uuid) from public, anon;
grant execute on function public.consume_booking_limit(text, integer), public.create_guest_booking(uuid, text, jsonb), public.claim_booking_emails(uuid, integer) to service_role;
grant execute on function public.retry_booking_emails(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_emails enable row level security;
alter table private.booking_rate_limits enable row level security;

revoke all on public.profiles, public.user_roles, public.bookings, public.booking_emails from anon, authenticated;
grant select on public.profiles, public.user_roles, public.bookings, public.booking_emails to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
grant update (role) on public.user_roles to authenticated;
grant update (status, admin_notes) on public.bookings to authenticated;
grant all on public.profiles, public.user_roles, public.bookings, public.booking_emails to service_role;

create policy "Staff see their profile; admins see all" on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select private.is_admin()));
create policy "Staff edit their contact details" on public.profiles for update to authenticated
using (id = (select auth.uid()) or (select private.is_admin())) with check (id = (select auth.uid()) or (select private.is_admin()));
create policy "Staff see their role; admins see all" on public.user_roles for select to authenticated
using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy "Only admins change roles" on public.user_roles for update to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Only admins read bookings" on public.bookings for select to authenticated using ((select private.is_admin()));
create policy "Only admins manage bookings" on public.bookings for update to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Only admins read email status" on public.booking_emails for select to authenticated using ((select private.is_admin()));

-- These tables are safe for Realtime because subscribers still pass their RLS.
alter publication supabase_realtime add table public.bookings, public.booking_emails, public.user_roles, public.profiles;
