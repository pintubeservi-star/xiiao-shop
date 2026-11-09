create or replace function public.cg_admin_platform_metrics()
returns jsonb language plpgsql security definer set search_path=public
as $$
declare v jsonb;
begin
 if not public.cg_is_admin() then raise exception 'No autorizado.'; end if;
 select jsonb_build_object(
  'visits_today',(select count(*) from public.cg_activity_events where event_name='page_view' and created_at>=date_trunc('day',now())),
  'visits_7d',(select count(*) from public.cg_activity_events where event_name='page_view' and created_at>=now()-interval '7 days'),
  'registered_users',(select count(*) from (
    select user_id from public.cg_driver_profiles
    union select user_id from public.cg_customer_verifications
    union select customer_id as user_id from public.cg_ride_requests where customer_id is not null
    union select customer_id as user_id from public.cg_delivery_requests where customer_id is not null
  ) cg_users),
  'completed_rides',(select count(*) from public.cg_ride_requests where status='completed'),
  'completed_deliveries',(select count(*) from public.cg_delivery_requests where status='delivered'),
  'cancelled_rides',(select count(*) from public.cg_ride_requests where status='cancelled'),
  'cancelled_deliveries',(select count(*) from public.cg_delivery_requests where status='cancelled'),
  'open_safety_reports',(select count(*) from public.cg_safety_reports where status in ('open','in_review')),
  'open_risk_alerts',(select count(*) from public.cg_driver_risk_alerts where status='open')
 ) into v;
 return v;
end; $$;
revoke all on function public.cg_admin_platform_metrics() from public,anon;
grant execute on function public.cg_admin_platform_metrics() to authenticated;
