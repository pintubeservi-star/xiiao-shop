-- Cotuí Go: secure public trip tracking links and low-latency live broadcasts.
alter table public.cg_ride_requests
  add column if not exists tracking_token text not null default encode(gen_random_bytes(24), 'hex');
alter table public.cg_delivery_requests
  add column if not exists tracking_token text not null default encode(gen_random_bytes(24), 'hex'),
  add column if not exists pickup_lat double precision,
  add column if not exists pickup_lng double precision,
  add column if not exists destination_lat double precision,
  add column if not exists destination_lng double precision;

create or replace function public.cg_get_public_trip(p_token text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_result jsonb;
begin
  if p_token is null or length(p_token) < 40 then return null; end if;
  select jsonb_build_object(
    'kind','ride','id',r.id,'status',r.status,'pickup_address',r.pickup_address,
    'destination_address',r.destination_address,'pickup_lat',r.pickup_lat,'pickup_lng',r.pickup_lng,
    'destination_lat',r.destination_lat,'destination_lng',r.destination_lng,
    'driver_name',d.full_name,'driver_lat',d.current_lat,
    'driver_lng',d.current_lng,'last_location_at',d.last_location_at
  ) into v_result
  from public.cg_ride_requests r left join public.cg_driver_profiles d on d.id=r.driver_id
  where r.tracking_token=p_token limit 1;
  if v_result is not null then return v_result; end if;
  select jsonb_build_object(
    'kind','delivery','id',r.id,'status',r.status,'pickup_address',r.pickup_address,
    'destination_address',r.delivery_address,'pickup_lat',r.pickup_lat,'pickup_lng',r.pickup_lng,
    'destination_lat',r.destination_lat,'destination_lng',r.destination_lng,'driver_name',d.full_name,
    'driver_lat',d.current_lat,'driver_lng',d.current_lng,'last_location_at',d.last_location_at,
    'tracking_code',r.tracking_code
  ) into v_result
  from public.cg_delivery_requests r left join public.cg_driver_profiles d on d.id=r.courier_id
  where r.tracking_token=p_token limit 1;
  return v_result;
end; $$;
revoke all on function public.cg_get_public_trip(text) from public;
grant execute on function public.cg_get_public_trip(text) to anon, authenticated;

create or replace function public.cg_broadcast_driver_trip_location()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_job record;
begin
  if new.current_lat is null or new.current_lng is null then return new; end if;
  for v_job in
    select r.tracking_token from public.cg_ride_requests r
    where r.driver_id=new.id and r.status in ('accepted','driver_arriving','in_progress')
    union all
    select r.tracking_token from public.cg_delivery_requests r
    where r.courier_id=new.id and r.status in ('accepted','picked_up','on_the_way')
  loop
    perform realtime.send(jsonb_build_object(
      'driver_lat',new.current_lat,'driver_lng',new.current_lng,
      'last_location_at',coalesce(new.last_location_at,now()),'driver_name',new.full_name
    ),'driver_location','trip:' || v_job.tracking_token,false);
  end loop;
  return new;
end; $$;
drop trigger if exists cg_driver_trip_location_broadcast on public.cg_driver_profiles;
create trigger cg_driver_trip_location_broadcast
after update of current_lat,current_lng,last_location_at on public.cg_driver_profiles
for each row execute function public.cg_broadcast_driver_trip_location();

create or replace function public.cg_broadcast_trip_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    perform realtime.send(jsonb_build_object('status',new.status,'updated_at',new.updated_at),
      'trip_status','trip:' || new.tracking_token,false);
  end if;
  return new;
end; $$;
drop trigger if exists cg_ride_status_broadcast on public.cg_ride_requests;
create trigger cg_ride_status_broadcast after update of status on public.cg_ride_requests
for each row execute function public.cg_broadcast_trip_status();
drop trigger if exists cg_delivery_status_broadcast on public.cg_delivery_requests;
create trigger cg_delivery_status_broadcast after update of status on public.cg_delivery_requests
for each row execute function public.cg_broadcast_trip_status();
