-- Keep live coordinates visible during active status changes and clear them at trip completion.
create or replace function public.cg_get_public_trip(p_token text)
returns jsonb language plpgsql security definer set search_path = '' as $function$
declare v_result jsonb;
begin
  if p_token is null or length(p_token)<40 then return null; end if;
  select jsonb_build_object('kind','ride','id',r.id,'status',r.status,'pickup_address',r.pickup_address,'destination_address',r.destination_address,'pickup_lat',r.pickup_lat,'pickup_lng',r.pickup_lng,'destination_lat',r.destination_lat,'destination_lng',r.destination_lng,'driver_name',d.full_name,'driver_lat',case when r.status in ('accepted','driver_arriving','in_progress') and d.last_location_at>now()-interval '2 minutes' then d.current_lat else null end,'driver_lng',case when r.status in ('accepted','driver_arriving','in_progress') and d.last_location_at>now()-interval '2 minutes' then d.current_lng else null end,'last_location_at',case when r.status in ('accepted','driver_arriving','in_progress') and d.last_location_at>now()-interval '2 minutes' then d.last_location_at else null end)
  into v_result from public.cg_ride_requests r left join public.cg_driver_profiles d on d.id=r.driver_id where r.tracking_token=p_token limit 1;
  if v_result is not null then return v_result; end if;
  select jsonb_build_object('kind','delivery','id',r.id,'status',r.status,'pickup_address',r.pickup_address,'destination_address',r.delivery_address,'pickup_lat',r.pickup_lat,'pickup_lng',r.pickup_lng,'destination_lat',r.destination_lat,'destination_lng',r.destination_lng,'driver_name',d.full_name,'driver_lat',case when r.status in ('accepted','picked_up','on_the_way') and d.last_location_at>now()-interval '2 minutes' then d.current_lat else null end,'driver_lng',case when r.status in ('accepted','picked_up','on_the_way') and d.last_location_at>now()-interval '2 minutes' then d.current_lng else null end,'last_location_at',case when r.status in ('accepted','picked_up','on_the_way') and d.last_location_at>now()-interval '2 minutes' then d.last_location_at else null end,'tracking_code',r.tracking_code)
  into v_result from public.cg_delivery_requests r left join public.cg_driver_profiles d on d.id=r.courier_id where r.tracking_token=p_token limit 1;
  return v_result;
end; $function$;
create or replace function public.cg_broadcast_trip_status()
returns trigger language plpgsql security definer set search_path = '' as $function$
declare v_payload jsonb;
begin
  if new.status is distinct from old.status then
    v_payload:=jsonb_build_object('status',new.status,'updated_at',new.updated_at);
    if new.status in ('completed','delivered','cancelled') then
      v_payload:=v_payload||jsonb_build_object('driver_lat',null,'driver_lng',null,'last_location_at',null);
    end if;
    perform realtime.send(v_payload,'trip_status','trip:'||new.tracking_token,false);
  end if;
  return new;
end; $function$;