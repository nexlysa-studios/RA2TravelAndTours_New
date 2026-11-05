create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- The scheduler's credential lives in Vault; it is never embedded in the cron
-- command. The same random credential is held in Edge Function secrets.
create function private.dispatch_booking_emails() returns void
language plpgsql security definer set search_path = '' as $$
declare worker_token text;
begin
  select decrypted_secret into worker_token from vault.decrypted_secrets where name = 'booking_email_worker_token' limit 1;
  if worker_token is null then return; end if;
  perform net.http_post(
    url := 'https://kqiizpibptowcqfzycvj.supabase.co/functions/v1/booking-emails',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-worker-token', worker_token),
    body := '{}'::jsonb,
    timeout_milliseconds := 15000
  );
end;
$$;
revoke all on function private.dispatch_booking_emails() from public, anon, authenticated;
select cron.schedule('ra2-booking-emails', '* * * * *', 'select private.dispatch_booking_emails();');
