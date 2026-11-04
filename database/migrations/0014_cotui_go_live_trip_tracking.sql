-- Realtime trip tracking for Cotuí Go.
alter table public.cg_ride_requests add column if not exists tracking_token text unique;
alter table public.cg_delivery_requests add column if not exists tracking_token text unique;
create index if not exists cg_ride_tracking_token_idx on public.cg_ride_requests(tracking_token) where tracking_token is not null;
create index if not exists cg_delivery_tracking_token_idx on public.cg_delivery_requests(tracking_token) where tracking_token is not null;
create or replace function public.cg_public_track_service(p_tracking_token text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_result jsonb;
begin
 if p_tracking_token is null or length(p_tracking_token)<32 or length(p_tracking_token)>128 then raise exception 'Código de seguimiento no válido.'; end if;
 select jsonb_build_object('service_type','moto','id',r.id,'status',r.status,'pickup_address',r.pickup_address,'destination_address',r.destination_address,'pickup_lat',r.pickup_lat,'pickup_lng',r.pickup_lng,'destination_lat',r.destination_lat,'destination_lng',r.destination_lng,'updated_at',r.updated_at,'driver',case when d.id is null then null else jsonb_build_object('name',d.full_name,'phone',d.phone,'lat',d.current_lat,'lng',d.current_lng,'last_location_at',d.last_location_at) end) into v_result
 from public.cg_ride_requests r left join public.cg_driver_profiles d on d.id=r.driver_id where r.tracking_token=p_tracking_token and r.status in ('requested','accepted','driver_arriving','in_progress');
 if v_result is not null then return v_result; end if;
 select jsonb_build_object('service_type','paquete','id',r.id,'status',r.status,'pickup_address',r.pickup_address,'destination_address',r.delivery_address,'pickup_lat',null,'pickup_lng',null,'destination_lat',null,'destination_lng',null,'updated_at',r.updated_at,'tracking_code',r.tracking_code,'driver',case when d.id is null then null else jsonb_build_object('name',d.full_name,'phone',d.phone,'lat',d.current_lat,'lng',d.current_lng,'last_location_at',d.last_location_at) end) into v_result
 from public.cg_delivery_requests r left join public.cg_driver_profiles d on d.id=r.courier_id where r.tracking_token=p_tracking_token and r.status in ('requested','accepted','picked_up','on_the_way');
 if v_result is not null then return v_result; end if;
 raise exception 'Este seguimiento no existe o el servicio ya finalizó.';
end; $$;
revoke all on function public.cg_public_track_service(text) from public;
grant execute on function public.cg_public_track_service(text) to anon, authenticated;
drop policy if exists "cg live tracking channel read" on realtime.messages;
create policy "cg live tracking channel read" on realtime.messages for select to anon,authenticated using (
 exists(select 1 from public.cg_ride_requests r where r.tracking_token=(select realtime.topic()) and r.status in ('requested','accepted','driver_arriving','in_progress'))
 or exists(select 1 from public.cg_delivery_requests r where r.tracking_token=(select realtime.topic()) and r.status in ('requested','accepted','picked_up','on_the_way'))
 or exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin')
);
drop policy if exists "cg assigned driver broadcast location" on realtime.messages;
create policy "cg assigned driver broadcast location" on realtime.messages for insert to authenticated with check (
 realtime.messages.extension='broadcast' and (
 exists(select 1 from public.cg_ride_requests r join public.cg_driver_profiles d on d.id=r.driver_id where r.tracking_token=(select realtime.topic()) and d.user_id=(select auth.uid()) and r.status in ('accepted','driver_arriving','in_progress'))
 or exists(select 1 from public.cg_delivery_requests r join public.cg_driver_profiles d on d.id=r.courier_id where r.tracking_token=(select realtime.topic()) and d.user_id=(select auth.uid()) and r.status in ('accepted','picked_up','on_the_way'))
 )
);