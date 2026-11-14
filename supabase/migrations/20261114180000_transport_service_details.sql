-- Additive transport details: existing receipts, hashes and history stay valid.
alter table public.packages add column transport_service text not null default 'transfer' check (transport_service in ('transfer','chauffeur'));
alter table public.packages add constraint packages_transport_service_type check (transport_service = 'transfer' or package_type = 'transfer');
grant update (transport_service) on public.packages to authenticated;
alter table public.bookings
  add column transport_service text check (transport_service in ('transfer','chauffeur')),
  add column chauffeur_duration text check (chauffeur_duration in ('half_day','full_day','multi_day')),
  add column service_end_date date,
  add column planned_stops text check (length(planned_stops) <= 2000);
alter table public.bookings drop constraint transfer_locations;
alter table public.bookings add constraint transfer_locations check (
  (coalesce(package_type, '') <> 'transfer' and experience <> 'Transfer / Chauffeur')
  or (length(coalesce(pickup_location,'')) >= 2 and coalesce(pickup_time,'') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' and (coalesce(transport_service,'') = 'chauffeur' or length(coalesce(dropoff_location,'')) >= 2))
);
alter table public.bookings add constraint chauffeur_details check (
  (transport_service is distinct from 'chauffeur' and chauffeur_duration is null and service_end_date is null and coalesce(planned_stops,'') = '')
  or (coalesce(transport_service,'') = 'chauffeur' and chauffeur_duration is not null and length(coalesce(planned_stops,'')) >= 2
    and (service_end_date is null or (chauffeur_duration = 'multi_day' and not flexible_dates and service_end_date >= travel_date))
    and (chauffeur_duration <> 'multi_day' or flexible_dates or (service_end_date is not null and service_end_date >= travel_date)))
);
-- Do not rename custom packages; retain the old title as an accepted legacy alias.
update public.packages set name = 'Private Transfers'
where id = '00000000-0000-4000-8000-000000000007' and name = 'Transfer / Chauffeur';
insert into public.packages (id,name,slug,package_type,transport_service,summary,description,location,duration,image_key,badge,show_in_tours,show_on_category_page,is_published,sort_order,cta_label,before_you_go)
values ('00000000-0000-4000-8000-000000000014','Private Chauffeur Service','chauffeur-services','transfer','chauffeur',
  'A dedicated vehicle and driver for half-day, full-day or multi-day travel, with stops planned around you.',
  'Arrange private chauffeur transport for business meetings, shopping, dining, events or a multi-day journey. Share your service dates, start time, pickup, planned stops, passenger numbers and vehicle preference. Hours, route, mileage, waiting time and any overtime are agreed in your personalised quotation.',
  'Cape Town and South Africa','Half day, full day or multi-day','hero','Private chauffeur',false,true,true,75,'Plan My Chauffeur Service',
  'Vehicle choice is a preference. Availability, seating, luggage space, hours and the final route are confirmed with your quotation. No payment is taken with your enquiry.')
on conflict (id) do nothing;
-- Save the existing safari artwork in the catalogue; preserve any custom admin photo.
update public.packages set image_url = 'https://kqiizpibptowcqfzycvj.supabase.co/storage/v1/object/public/package-images/seed/' || slug || case when slug = 'aquila' then '.webp' else '.jpg' end,
  image_alt = case slug when 'aquila' then 'Aquila safari vehicle near rhinos in the reserve' when 'kruger' then 'Elephants beside a waterhole in Kruger National Park' else 'Safari lodge dining deck beside a river in Sabi Sands' end
where slug in ('aquila','kruger','sabi-sands') and image_url = '';

create or replace function private.capture_booking_package() returns trigger
language plpgsql set search_path = '' as $$
declare p public.packages;
begin
  -- Old frontend versions can still submit the original experience name.
  -- New versions use the stable package ID, including when names are edited.
  if new.package_id is null then
    select * into p from public.packages where (name = new.experience or (new.experience = 'Transfer / Chauffeur' and id = '00000000-0000-4000-8000-000000000007')) and is_published for share;
  else
    select * into p from public.packages where id = new.package_id and is_published for share;
  end if;
  if not found then raise exception 'PACKAGE_UNAVAILABLE'; end if;
  if p.name <> new.experience and not (new.experience = 'Transfer / Chauffeur' and p.id = '00000000-0000-4000-8000-000000000007') then raise exception 'PACKAGE_CHANGED'; end if;
  if new.transport_service is not null and (p.package_type <> 'transfer' or new.transport_service <> p.transport_service) then raise exception 'SERVICE_CHANGED'; end if;
  new.transport_service = case when p.package_type = 'transfer' then p.transport_service else null end;
  if new.transport_service = 'chauffeur' then
    if new.chauffeur_duration is null or length(coalesce(new.planned_stops,'')) < 2 or length(coalesce(new.pickup_location,'')) < 2 or coalesce(new.pickup_time,'') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then raise exception 'CHAUFFEUR_DETAILS_REQUIRED'; end if;
    if new.chauffeur_duration = 'multi_day' and not new.flexible_dates and (new.service_end_date is null or new.service_end_date < new.travel_date) then raise exception 'CHAUFFEUR_DETAILS_REQUIRED'; end if;
    if new.service_end_date is not null and (new.chauffeur_duration <> 'multi_day' or new.flexible_dates) then raise exception 'CHAUFFEUR_DETAILS_REQUIRED'; end if;
  elsif new.chauffeur_duration is not null or new.service_end_date is not null or coalesce(new.planned_stops,'') <> '' then
    raise exception 'SERVICE_CHANGED';
  end if;
  if p.package_type = 'transfer' and p.transport_service <> 'chauffeur' and (length(new.pickup_location) < 2 or length(new.dropoff_location) < 2 or new.pickup_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$') then
    raise exception 'TRANSFER_DETAILS_REQUIRED';
  end if;
  new.package_id = p.id;
  new.package_type = p.package_type;
  new.package_snapshot = jsonb_build_object(
    'name', p.name, 'slug', p.slug, 'package_type', p.package_type, 'version', p.updated_at,
    'transport_service', new.transport_service, 'subtitle', p.subtitle, 'summary', p.summary, 'duration', p.duration, 'location', p.location,
    'facts', p.facts, 'included', p.included, 'excluded', p.excluded, 'booking_terms', p.booking_terms
  );
  return new;
end;
$$;

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
    request_id, request_hash, experience, package_id, transport_service, chauffeur_duration, service_end_date, planned_stops, vehicle_preference, vehicle_id, travel_date, flexible_dates, adults, children,
    pickup_location, dropoff_location, pickup_time, flight_number, luggage, special_requests,
    full_name, email, phone, contact_preference
  ) values (
    p_request_id, p_hash, p_data->>'experience', nullif(p_data->>'package_id', '')::uuid,
    p_data->>'transport_service', p_data->>'chauffeur_duration', nullif(p_data->>'service_end_date','')::date, p_data->>'planned_stops',
    p_data->>'vehicle_choice', nullif(p_data->>'vehicle_id', '')::uuid,
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
