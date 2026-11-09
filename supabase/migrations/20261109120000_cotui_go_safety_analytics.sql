-- Cotuí Go safety, activity analytics and driver-risk monitoring foundation.
create table if not exists public.cg_activity_events (
 id uuid primary key default gen_random_uuid(),
 user_id uuid,
 event_name text not null,
 role text not null default 'visitor' check (role in ('visitor','customer','driver','admin')),
 path text,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index if not exists cg_activity_events_created_idx on public.cg_activity_events(created_at desc);
create index if not exists cg_activity_events_name_created_idx on public.cg_activity_events(event_name,created_at desc);
alter table public.cg_activity_events enable row level security;
drop policy if exists cg_activity_insert_public on public.cg_activity_events;
create policy cg_activity_insert_public on public.cg_activity_events for insert to anon,authenticated
 with check (user_id is null or user_id=(select auth.uid()));
drop policy if exists cg_activity_admin_read on public.cg_activity_events;
create policy cg_activity_admin_read on public.cg_activity_events for select to authenticated using (public.cg_is_admin());

create table if not exists public.cg_safety_reports (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null,
 reporter_role text not null check (reporter_role in ('customer','driver')),
 report_type text not null check (report_type in ('unsafe','emergency','support')),
 details text,
 status text not null default 'open' check (status in ('open','in_review','resolved','closed')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists cg_safety_reports_status_created_idx on public.cg_safety_reports(status,created_at desc);
alter table public.cg_safety_reports enable row level security;
drop policy if exists cg_safety_report_insert_own on public.cg_safety_reports;
create policy cg_safety_report_insert_own on public.cg_safety_reports for insert to authenticated with check (user_id=(select auth.uid()));
drop policy if exists cg_safety_report_read_own on public.cg_safety_reports;
create policy cg_safety_report_read_own on public.cg_safety_reports for select to authenticated using (user_id=(select auth.uid()) or public.cg_is_admin());
drop policy if exists cg_safety_report_admin_update on public.cg_safety_reports;
create policy cg_safety_report_admin_update on public.cg_safety_reports for update to authenticated using (public.cg_is_admin()) with check (public.cg_is_admin());

create table if not exists public.cg_driver_risk_alerts (
 id uuid primary key default gen_random_uuid(),
 driver_id uuid not null references public.cg_driver_profiles(id) on delete cascade,
 alert_type text not null,
 severity text not null check (severity in ('low','medium','high')),
 details text not null,
 evidence_count integer not null default 1,
 status text not null default 'open' check (status in ('open','reviewed','dismissed','actioned')),
 created_at timestamptz not null default now(),
 reviewed_at timestamptz,
 reviewed_by uuid
);
create index if not exists cg_driver_risk_alerts_driver_created_idx on public.cg_driver_risk_alerts(driver_id,created_at desc);
alter table public.cg_driver_risk_alerts enable row level security;
drop policy if exists cg_driver_risk_alert_admin_only on public.cg_driver_risk_alerts;
create policy cg_driver_risk_alert_admin_only on public.cg_driver_risk_alerts for select to authenticated using (public.cg_is_admin());
drop policy if exists cg_driver_risk_alert_admin_update on public.cg_driver_risk_alerts;
create policy cg_driver_risk_alert_admin_update on public.cg_driver_risk_alerts for update to authenticated using (public.cg_is_admin()) with check (public.cg_is_admin());

create or replace function public.cg_log_cancelled_service()
returns trigger language plpgsql security definer set search_path=public
as $$
declare v_driver uuid; v_user uuid; v_count integer;
begin
 if old.status is distinct from new.status and new.status='cancelled' then
  v_driver:=coalesce((to_jsonb(new)->>'driver_id')::uuid,(to_jsonb(new)->>'courier_id')::uuid);
  if v_driver is not null then
   select user_id into v_user from public.cg_driver_profiles where id=v_driver;
   if v_user is null or auth.uid() is distinct from v_user then return new; end if;
   insert into public.cg_activity_events(user_id,event_name,role,path,metadata)
   values(v_user,'driver_cancelled_service','driver',null,jsonb_build_object('service_table',tg_table_name,'service_id',new.id));
   select count(*) into v_count from public.cg_activity_events
    where user_id=v_user and event_name='driver_cancelled_service' and created_at>now()-interval '7 days';
   if v_count>=3 and not exists(select 1 from public.cg_driver_risk_alerts
      where driver_id=v_driver and alert_type='repeated_cancellations' and status='open'
      and created_at>now()-interval '24 hours') then
    insert into public.cg_driver_risk_alerts(driver_id,alert_type,severity,details,evidence_count)
    values(v_driver,'repeated_cancellations',case when v_count>=6 then 'high' else 'medium' end,
      'El sistema detectó cancelaciones repetidas durante los últimos 7 días. Requiere revisión humana antes de aplicar sanciones.',v_count);
   end if;
  end if;
 end if;
 return new;
end; $$;
drop trigger if exists cg_ride_cancellation_monitor on public.cg_ride_requests;
create trigger cg_ride_cancellation_monitor after update of status on public.cg_ride_requests
for each row execute function public.cg_log_cancelled_service();
drop trigger if exists cg_delivery_cancellation_monitor on public.cg_delivery_requests;
create trigger cg_delivery_cancellation_monitor after update of status on public.cg_delivery_requests
for each row execute function public.cg_log_cancelled_service();

create or replace function public.cg_admin_platform_metrics()
returns jsonb language plpgsql security definer set search_path=public
as $$
declare v jsonb;
begin
 if not public.cg_is_admin() then raise exception 'No autorizado.'; end if;
 select jsonb_build_object(
  'visits_today',(select count(*) from public.cg_activity_events where event_name='page_view' and created_at>=date_trunc('day',now())),
  'visits_7d',(select count(*) from public.cg_activity_events where event_name='page_view' and created_at>=now()-interval '7 days'),
  'registered_users',(select count(*) from auth.users),
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
revoke all on function public.cg_log_cancelled_service() from public,anon,authenticated;
grant select,insert on public.cg_activity_events to anon,authenticated;
grant select,insert,update on public.cg_safety_reports to authenticated;
grant select,update on public.cg_driver_risk_alerts to authenticated;

create table if not exists public.cg_customer_verifications (
 user_id uuid primary key references auth.users(id) on delete cascade,
 selfie_path text not null,
 status text not null default 'pending' check (status in ('pending','approved','rejected')),
 submitted_at timestamptz not null default now(),
 reviewed_at timestamptz,
 reviewed_by uuid,
 admin_note text
);
alter table public.cg_customer_verifications enable row level security;
drop policy if exists cg_customer_verification_read_own on public.cg_customer_verifications;
create policy cg_customer_verification_read_own on public.cg_customer_verifications for select to authenticated
 using (user_id=(select auth.uid()) or public.cg_is_admin());
drop policy if exists cg_customer_verification_insert_own on public.cg_customer_verifications;
create policy cg_customer_verification_insert_own on public.cg_customer_verifications for insert to authenticated
 with check (user_id=(select auth.uid()) and status='pending');
drop policy if exists cg_customer_verification_update_own on public.cg_customer_verifications;
create policy cg_customer_verification_update_own on public.cg_customer_verifications for update to authenticated
 using (user_id=(select auth.uid()) and status in ('pending','rejected'))
 with check (user_id=(select auth.uid()) and status='pending');
drop policy if exists cg_customer_verification_admin_update on public.cg_customer_verifications;
create policy cg_customer_verification_admin_update on public.cg_customer_verifications for update to authenticated
 using (public.cg_is_admin()) with check (public.cg_is_admin());
grant select,insert,update on public.cg_customer_verifications to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('cg-customer-verification','cg-customer-verification',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
drop policy if exists cg_customer_selfie_upload on storage.objects;
create policy cg_customer_selfie_upload on storage.objects for insert to authenticated
 with check (bucket_id='cg-customer-verification' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists cg_customer_selfie_read on storage.objects;
create policy cg_customer_selfie_read on storage.objects for select to authenticated
 using (bucket_id='cg-customer-verification' and ((storage.foldername(name))[1]=(select auth.uid())::text or public.cg_is_admin()));
