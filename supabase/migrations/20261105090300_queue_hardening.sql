-- Keep privileged retry logic outside the exposed Data API schema. The public
-- wrapper runs as the caller; the private helper rechecks the current DB role.
alter function public.retry_booking_emails(uuid) set schema private;
create function public.retry_booking_emails(p_booking_id uuid) returns integer
language sql security invoker set search_path = '' as $$ select private.retry_booking_emails(p_booking_id); $$;
revoke all on function public.retry_booking_emails(uuid) from public, anon;
grant execute on function public.retry_booking_emails(uuid) to authenticated;

create or replace function public.claim_booking_emails(p_booking_id uuid default null, p_limit integer default 10)
returns setof public.booking_emails language sql security definer set search_path = '' as $$
  with exhausted as (
    update public.booking_emails set status = 'failed', locked_at = null, lock_token = null,
      last_error = coalesce(last_error, 'WORKER_LEASE_EXPIRED')
    where status = 'sending' and locked_at < now() - interval '5 minutes' and attempts >= 8
      and (p_booking_id is null or booking_id = p_booking_id)
    returning id
  ), candidates as (
    select id from public.booking_emails
    where ((status = 'pending' and available_at <= now()) or (status = 'sending' and locked_at < now() - interval '5 minutes'))
      and attempts < 8 and (p_booking_id is null or booking_id = p_booking_id)
    order by created_at for update skip locked limit least(greatest(p_limit, 1), 20)
  ) update public.booking_emails as jobs set status = 'sending', locked_at = now(), lock_token = gen_random_uuid(), attempts = attempts + 1
    from candidates where jobs.id = candidates.id returning jobs.*;
$$;
