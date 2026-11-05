-- Transfer requirements follow the stable type, even after a package rename.
-- Existing bookings with no type retain the legacy name-based check.
alter table public.bookings drop constraint transfer_locations;
alter table public.bookings add constraint transfer_locations check (
  package_type is not null and package_type <> 'transfer'
  or package_type is null and experience <> 'Transfer / Chauffeur'
  or (length(pickup_location) >= 2 and length(dropoff_location) >= 2 and pickup_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
);
update public.packages set show_on_category_page = true
where slug = 'transfers-chauffeur' and updated_at = created_at;

-- Even edits made directly in Table Editor must retain valid public page rows.
create function private.valid_package_rows(value jsonb, first_key text, second_key text) returns boolean
language plpgsql immutable set search_path = '' as $$
declare item jsonb;
begin
  if jsonb_typeof(value) <> 'array' then return false; end if;
  for item in select * from jsonb_array_elements(value) loop
    if jsonb_typeof(item) <> 'object'
      or not (item ? first_key and item ? second_key)
      or jsonb_typeof(item->first_key) <> 'string' or jsonb_typeof(item->second_key) <> 'string'
      or length(trim(item->>first_key)) = 0 or length(trim(item->>second_key)) = 0
      or length(item->>first_key) > 240 or length(item->>second_key) > 6000
    then return false; end if;
  end loop;
  return true;
end;
$$;
revoke all on function private.valid_package_rows(jsonb, text, text) from public, anon;
grant execute on function private.valid_package_rows(jsonb, text, text) to authenticated, service_role;
alter table public.packages add constraint package_facts_shape check (private.valid_package_rows(facts, 'label', 'value'));
alter table public.packages add constraint package_itinerary_shape check (private.valid_package_rows(itinerary, 'title', 'body'));
alter table public.packages add constraint package_faqs_shape check (private.valid_package_rows(faqs, 'question', 'answer'));
