create table public.fleet_vehicles (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 2 and 140),
  category text not null check (category in ('sedan','mpv','van','minibus','coach')),
  model_year integer check (model_year between 1950 and 2100),
  description text not null default '' check (length(description) <= 2000),
  passenger_capacity integer check (passenger_capacity between 1 and 100),
  capacity_label text not null check (length(capacity_label) between 2 and 240),
  seating_notes text not null default '' check (length(seating_notes) <= 2000),
  luggage_guide text not null default '' check (length(luggage_guide) <= 2000),
  features text[] not null default '{}' check (cardinality(features) <= 20),
  image_url text not null default '' check (length(image_url) <= 2048 and (image_url='' or image_url ~ '^https://')),
  image_alt text not null default '' check (length(image_alt) <= 240),
  is_published boolean not null default false,
  sort_order integer not null default 100 check (sort_order between 0 and 9999),
  archived_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint published_fleet_content check (not is_published or (archived_at is null and length(image_url)>0 and length(description)>0))
);
create unique index fleet_active_name_idx on public.fleet_vehicles (lower(name)) where archived_at is null;
create index fleet_public_order_idx on public.fleet_vehicles (sort_order, name) where is_published and archived_at is null;
create trigger touch_fleet before update on public.fleet_vehicles for each row execute function private.touch_updated_at();
alter table public.fleet_vehicles enable row level security;
revoke all on public.fleet_vehicles from anon, authenticated;
grant select on public.fleet_vehicles to anon, authenticated;
grant insert on public.fleet_vehicles to authenticated;
grant update (name, category, model_year, description, passenger_capacity, capacity_label, seating_notes,
  luggage_guide, features, image_url, image_alt, is_published, sort_order, archived_at) on public.fleet_vehicles to authenticated;
grant all on public.fleet_vehicles to service_role;
create policy "Visitors read active fleet" on public.fleet_vehicles for select to anon using (is_published and archived_at is null);
create policy "Staff read active fleet; admins see all" on public.fleet_vehicles for select to authenticated using ((is_published and archived_at is null) or (select private.is_admin()));
create policy "Only admins add fleet" on public.fleet_vehicles for insert to authenticated with check ((select private.is_admin()));
create policy "Only admins manage fleet" on public.fleet_vehicles for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
-- Removing a vehicle archives it. Historical booking references are never deleted.
alter publication supabase_realtime add table public.fleet_vehicles;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fleet-images','fleet-images',true,5242880,array['image/jpeg','image/png','image/webp','image/avif']) on conflict(id) do nothing;
create policy "Admins upload fleet photos" on storage.objects for insert to authenticated with check (bucket_id='fleet-images' and (select private.is_admin()));
create policy "Admins inspect fleet photos" on storage.objects for select to authenticated using (bucket_id='fleet-images' and (select private.is_admin()));
create policy "Admins remove unused fleet photos" on storage.objects for delete to authenticated using (bucket_id='fleet-images' and (select private.is_admin()));
