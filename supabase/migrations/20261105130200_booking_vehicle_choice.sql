-- All existing booking records and request/email retry credentials are retained.
alter table public.bookings
  add column vehicle_id uuid references public.fleet_vehicles(id) on delete restrict,
  add column vehicle_preference text check (vehicle_preference in ('specific','recommend')),
  add column vehicle_snapshot jsonb;
create index bookings_vehicle_id_idx on public.bookings(vehicle_id);
create function private.capture_booking_vehicle() returns trigger
language plpgsql set search_path = '' as $$
declare v public.fleet_vehicles;
begin
  if new.vehicle_preference is null and new.vehicle_id is null then return new; end if;
  if new.vehicle_preference = 'recommend' and new.vehicle_id is null then return new; end if;
  if new.vehicle_preference is distinct from 'specific' or new.vehicle_id is null then raise exception 'VEHICLE_SELECTION_INVALID'; end if;
  select * into v from public.fleet_vehicles where id=new.vehicle_id and is_published and archived_at is null for share;
  if not found then raise exception 'VEHICLE_UNAVAILABLE'; end if;
  if v.passenger_capacity is not null and v.passenger_capacity < new.adults + new.children then raise exception 'VEHICLE_CAPACITY'; end if;
  new.vehicle_snapshot = jsonb_build_object('id',v.id,'name',v.name,'category',v.category,'model_year',v.model_year,
    'passenger_capacity',v.passenger_capacity,'capacity_label',v.capacity_label,'seating_notes',v.seating_notes,
    'luggage_guide',v.luggage_guide,'image_url',v.image_url);
  return new;
end;
$$;
revoke all on function private.capture_booking_vehicle() from public, anon, authenticated;
create trigger capture_booking_vehicle before insert on public.bookings for each row execute function private.capture_booking_vehicle();

-- Preserve the transaction and duplicate-request checks; add only vehicle inputs.

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
    request_id, request_hash, experience, package_id, vehicle_preference, vehicle_id, travel_date, flexible_dates, adults, children,
    pickup_location, dropoff_location, pickup_time, flight_number, luggage, special_requests,
    full_name, email, phone, contact_preference
  ) values (
    p_request_id, p_hash, p_data->>'experience', nullif(p_data->>'package_id', '')::uuid,
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
