create function public.booking_dashboard_stats() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'total', count(*),
    'new', count(*) filter (where status = 'new'),
    'upcoming', count(*) filter (where travel_date >= (now() at time zone 'Africa/Johannesburg')::date and status in ('confirmed', 'quoted', 'contacted', 'new')),
    'confirmed', count(*) filter (where status = 'confirmed')
  ) from public.bookings;
$$;
revoke all on function public.booking_dashboard_stats() from public, anon;
grant execute on function public.booking_dashboard_stats() to authenticated;
