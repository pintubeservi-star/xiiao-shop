-- Enforce unique, 64-character random bearer tokens for public trip tracking.
create unique index if not exists cg_ride_tracking_token_unique_idx on public.cg_ride_requests(tracking_token);
create unique index if not exists cg_delivery_tracking_token_unique_idx on public.cg_delivery_requests(tracking_token);
create or replace function public.cg_get_public_trip(p_token text)
returns jsonb language plpgsql security definer set search_path = '' as $function$
declare v_result jsonb;
begin
 if p_token is null or p_token !~ '^[a-f0-9]{64}$' then return null; end if;
 select jsonb_build_object('kind','ride','id',r.id,'status',r.status,'pickup_address',r.pickup_address,'destination_address',r.destination_address,'pickup_lat',r.pickup_lat,'pickup_lng',r.pickup_lng,'destination_lat',r.destination_lat,'destination_lng',r.destination_lng,'driver_name',d.full_name,'driver_lat',case when r.status in ('accepted','driver_arriving','in_progress') then d.current_lat else null end,'driver_lng',case when r.status in ('accepted','driver_arriving','in_progress') then d.current_lng else null end,'last_location_at',case when r.status in ('accepted','driver_arriving','in_progress') then d.last_location_at else null end)
 into v_result from public.cg_ride_requests r left join public.cg_driver_profiles d on d.id=r.driver_id where r.tracking_token=p_token limit 1;
 if v_result is not null then return v_result; end if;
 select jsonb_build_object('kind','delivery','id',r.id,'status',r.status,'pickup_address',r.pickup_address,'destination_address',r.delivery_address,'pickup_lat',r.pickup_lat,'pickup_lng',r.pickup_lng,'destination_lat',r.destination_lat,'destination_lng',r.destination_lng,'driver_name',d.full_name,'driver_lat',case when r.status in ('accepted','picked_up','on_the_way') then d.current_lat else null end,'driver_lng',case when r.status in ('accepted','picked_up','on_the_way') then d.current_lng else null end,'last_location_at',case when r.status in ('accepted','picked_up','on_the_way') then d.last_location_at else null end,'tracking_code',r.tracking_code)
 into v_result from public.cg_delivery_requests r left join public.cg_driver_profiles d on d.id=r.courier_id where r.tracking_token=p_token limit 1;
 return v_result;
end; $function$;