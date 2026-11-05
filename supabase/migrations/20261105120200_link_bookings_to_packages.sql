-- Additive columns preserve all existing bookings and their original titles.
alter table public.bookings
  add column package_id uuid references public.packages(id) on delete restrict,
  add column package_type text check (package_type in ('tour','safari','journey','transfer','consultation')),
  add column package_snapshot jsonb;
create index bookings_package_id_idx on public.bookings (package_id);
alter table public.bookings drop constraint if exists bookings_experience_check;
alter table public.bookings add constraint bookings_experience_length check (length(experience) between 2 and 140);
alter table public.bookings drop constraint transfer_locations;
alter table public.bookings add constraint transfer_locations check (
  (coalesce(package_type, '') <> 'transfer' and experience <> 'Transfer / Chauffeur')
  or (length(pickup_location) >= 2 and length(dropoff_location) >= 2 and pickup_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
);

create function private.capture_booking_package() returns trigger
language plpgsql set search_path = '' as $$
declare p public.packages;
begin
  -- Old frontend versions can still submit the original experience name.
  -- New versions use the stable package ID, including when names are edited.
  if new.package_id is null then
    select * into p from public.packages where name = new.experience and is_published for share;
  else
    select * into p from public.packages where id = new.package_id and is_published for share;
  end if;
  if not found then raise exception 'PACKAGE_UNAVAILABLE'; end if;
  if p.name <> new.experience then raise exception 'PACKAGE_CHANGED'; end if;
  if p.package_type = 'transfer' and (length(new.pickup_location) < 2 or length(new.dropoff_location) < 2 or new.pickup_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$') then
    raise exception 'TRANSFER_DETAILS_REQUIRED';
  end if;
  new.package_id = p.id;
  new.package_type = p.package_type;
  new.package_snapshot = jsonb_build_object(
    'name', p.name, 'slug', p.slug, 'package_type', p.package_type, 'version', p.updated_at,
    'subtitle', p.subtitle, 'summary', p.summary, 'duration', p.duration, 'location', p.location,
    'facts', p.facts, 'included', p.included, 'excluded', p.excluded, 'booking_terms', p.booking_terms
  );
  return new;
end;
$$;
revoke all on function private.capture_booking_package() from public, anon, authenticated;
create trigger capture_booking_package before insert on public.bookings for each row execute function private.capture_booking_package();

-- The existing transaction, UUID retry handling and email jobs are preserved.
create or replace function public.create_guest_booking(p_request_id uuid, p_hash text, p_data jsonb) returns jsonb
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
    request_id, request_hash, experience, package_id, travel_date, flexible_dates, adults, children,
    pickup_location, dropoff_location, pickup_time, flight_number, luggage, special_requests,
    full_name, email, phone, contact_preference
  ) values (
    p_request_id, p_hash, p_data->>'experience', nullif(p_data->>'package_id', '')::uuid,
    nullif(p_data->>'travel_date', '')::date, (p_data->>'flexible_dates')::boolean,
    (p_data->>'adults')::integer, (p_data->>'children')::integer,
    p_data->>'pickup_location', p_data->>'dropoff_location', p_data->>'pickup_time', p_data->>'flight_number',
    (p_data->>'luggage')::integer, p_data->>'special_requests', p_data->>'full_name',
    p_data->>'email', p_data->>'phone', p_data->>'contact_preference'
  ) returning * into b;
  insert into public.booking_emails (booking_id, audience) values (b.id, 'guest'), (b.id, 'admin');
  return jsonb_build_object('id', b.id, 'reference', b.reference, 'duplicate', false);
end;
$$;
