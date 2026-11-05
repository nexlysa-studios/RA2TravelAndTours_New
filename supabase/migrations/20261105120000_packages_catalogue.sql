create table public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 2 and 140),
  slug text not null unique check (length(slug) between 2 and 80 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  package_type text not null check (package_type in ('tour', 'safari', 'journey', 'transfer', 'consultation')),
  subtitle text not null default '' check (length(subtitle) <= 180),
  tagline text not null default '' check (length(tagline) <= 300),
  summary text not null default '' check (length(summary) <= 500),
  description text not null default '' check (length(description) <= 12000),
  overview_title text not null default '' check (length(overview_title) <= 180),
  overview_text text not null default '' check (length(overview_text) <= 8000),
  location text not null default '' check (length(location) <= 200),
  duration text not null default '' check (length(duration) <= 120),
  badge text not null default 'Private' check (length(badge) <= 80),
  image_key text not null default 'peninsula' check (image_key in ('peninsula','winelands','safari','hero')),
  image_url text not null default '' check (length(image_url) <= 2048 and (image_url = '' or image_url ~ '^https://')),
  image_alt text not null default '' check (length(image_alt) <= 240),
  categories text[] not null default '{}' check (categories <@ array['Coast','Wine','Wildlife','City','Adventure']::text[] and cardinality(categories) <= 5),
  facts jsonb not null default '[]' check (jsonb_typeof(facts) = 'array' and jsonb_array_length(facts) <= 20),
  highlights text[] not null default '{}' check (cardinality(highlights) <= 60),
  itinerary jsonb not null default '[]' check (jsonb_typeof(itinerary) = 'array' and jsonb_array_length(itinerary) <= 30),
  itinerary_note text not null default '' check (length(itinerary_note) <= 1500),
  included text[] not null default '{}' check (cardinality(included) <= 60),
  excluded text[] not null default '{}' check (cardinality(excluded) <= 60),
  customisation_intro text not null default '' check (length(customisation_intro) <= 3000),
  customisation_options text[] not null default '{}' check (cardinality(customisation_options) <= 60),
  before_you_go text not null default '' check (length(before_you_go) <= 6000),
  booking_terms text not null default '' check (length(booking_terms) <= 4000),
  faqs jsonb not null default '[]' check (jsonb_typeof(faqs) = 'array' and jsonb_array_length(faqs) <= 30),
  cta_title text not null default '' check (length(cta_title) <= 180),
  cta_text text not null default '' check (length(cta_text) <= 1500),
  cta_label text not null default 'Request a Quote' check (length(cta_label) <= 80),
  seo_title text not null default '' check (length(seo_title) <= 180),
  seo_description text not null default '' check (length(seo_description) <= 500),
  is_published boolean not null default false,
  show_in_tours boolean not null default true,
  show_on_category_page boolean not null default true,
  featured boolean not null default false,
  sort_order integer not null default 100 check (sort_order between 0 and 9999),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint packages_publish_requirements check (not is_published or (length(summary) > 0 and length(description) > 0 and length(duration) > 0 and length(location) > 0))
);
create unique index packages_name_lower_idx on public.packages (lower(name));
create index packages_public_order_idx on public.packages (sort_order, name) where is_published;
create trigger touch_packages before update on public.packages for each row execute function private.touch_updated_at();

create function private.protect_package_slug() returns trigger language plpgsql set search_path = '' as $$
begin
  if old.slug <> new.slug then raise exception 'The website address is permanent. Change the package name instead, or create a new package.'; end if;
  return new;
end;
$$;
revoke all on function private.protect_package_slug() from public, anon, authenticated;
create trigger protect_package_slug before update on public.packages for each row execute function private.protect_package_slug();

alter table public.packages enable row level security;
revoke all on public.packages from anon, authenticated;
grant select on public.packages to anon, authenticated;
grant insert on public.packages to authenticated;
grant update (name, package_type, subtitle, tagline, summary, description, overview_title, overview_text,
  location, duration, badge, image_key, image_url, image_alt, categories, facts, highlights, itinerary,
  itinerary_note, included, excluded, customisation_intro, customisation_options, before_you_go,
  booking_terms, faqs, cta_title, cta_text, cta_label, seo_title, seo_description, is_published,
  show_in_tours, show_on_category_page, featured, sort_order) on public.packages to authenticated;
grant all on public.packages to service_role;
create policy "Visitors read published packages" on public.packages for select to anon using (is_published);
create policy "Staff read published packages; admins read drafts" on public.packages for select to authenticated using (is_published or (select private.is_admin()));
create policy "Only admins create packages" on public.packages for insert to authenticated with check ((select private.is_admin()));
create policy "Only admins edit packages" on public.packages for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
-- No client delete grant: unpublish packages so historical links and bookings survive.
alter publication supabase_realtime add table public.packages;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('package-images', 'package-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do nothing;
create policy "Admins upload package photos" on storage.objects for insert to authenticated
with check (bucket_id = 'package-images' and (select private.is_admin()));
create policy "Admins inspect package photos" on storage.objects for select to authenticated
using (bucket_id = 'package-images' and (select private.is_admin()));
create policy "Admins remove unused package photos" on storage.objects for delete to authenticated
using (bucket_id = 'package-images' and (select private.is_admin()));
