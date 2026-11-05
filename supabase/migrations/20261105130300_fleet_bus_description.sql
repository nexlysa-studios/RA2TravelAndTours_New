-- Keep public wording about the service; preserve any later admin edits.
update public.fleet_vehicles set description = 'Spacious coach for group transfers and private travel. Available guest seats are confirmed with your quotation.'
where id='10000000-0000-4000-8000-000000000007' and updated_at=created_at;
