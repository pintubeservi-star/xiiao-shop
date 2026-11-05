create or replace function public.cg_set_request_fare_breakdown()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  q jsonb;
  service_kind text;
begin
  service_kind:=case when tg_table_name='cg_ride_requests' then 'moto' else 'package' end;

  if tg_op='INSERT' and (
    new.pickup_lat is null or new.pickup_lng is null
    or new.destination_lat is null or new.destination_lng is null
  ) then
    raise exception 'Selecciona la recogida y el destino en el mapa para calcular una tarifa válida.';
  end if;

  if new.pickup_lat is not null and new.pickup_lng is not null
     and new.destination_lat is not null and new.destination_lng is not null then
    q:=public.cg_quote_fare(service_kind,new.pickup_lat,new.pickup_lng,
      new.destination_lat,new.destination_lng,new.distance_km);
    new.distance_km:=(q->>'distance_km')::numeric;
    if tg_table_name='cg_ride_requests' then
      new.estimated_fare_dop:=(q->>'fare_dop')::numeric;
      new.agreed_fare_dop:=(q->>'fare_dop')::numeric;
    else
      new.estimated_fee_dop:=(q->>'fare_dop')::numeric;
      new.agreed_fee_dop:=(q->>'fare_dop')::numeric;
    end if;
    new.commission_rate_pct:=(q->>'commission_pct')::numeric;
    new.platform_commission_dop:=(q->>'commission_dop')::numeric;
    new.driver_payout_dop:=(q->>'driver_payout_dop')::numeric;
  end if;
  return new;
end;
$$;

create or replace function public.cg_driver_accept_ride(p_ride_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_driver public.cg_driver_profiles%rowtype;
  v_ride public.cg_ride_requests%rowtype;
  v_quote jsonb;
  v_commission numeric;
  v_fare numeric;
  v_payout numeric;
begin
  select * into v_driver
  from public.cg_driver_profiles
  where user_id=auth.uid() and status='approved'
  limit 1 for update;
  if v_driver.id is null then raise exception 'Tu cuenta de conductor aún no está aprobada.'; end if;
  if not v_driver.is_available then raise exception 'Activa tu disponibilidad antes de aceptar servicios.'; end if;

  select * into v_ride
  from public.cg_ride_requests
  where id=p_ride_id and status='requested'
  for update;
  if v_ride.id is null then raise exception 'Este viaje ya fue tomado por otro conductor.'; end if;

  v_quote:=public.cg_quote_fare('moto',v_ride.pickup_lat,v_ride.pickup_lng,
    v_ride.destination_lat,v_ride.destination_lng,v_ride.distance_km);
  v_fare:=(v_quote->>'fare_dop')::numeric;
  v_commission:=(v_quote->>'commission_dop')::numeric;
  v_payout:=(v_quote->>'driver_payout_dop')::numeric;
  if v_fare<=0 or v_commission<=0 or v_commission>=v_fare or v_payout<=0 then
    raise exception 'Este viaje no tiene una tarifa válida. Actualiza la solicitud antes de aceptarla.';
  end if;

  perform public.cg_wallet_reserve_commission(v_driver.id,'ride',v_ride.id,v_commission);
  update public.cg_ride_requests
  set estimated_fare_dop=v_fare,agreed_fare_dop=v_fare,
      platform_commission_dop=v_commission,driver_payout_dop=v_payout,
      commission_rate_pct=(v_quote->>'commission_pct')::numeric,
      distance_km=(v_quote->>'distance_km')::numeric,
      driver_id=v_driver.id,status='accepted',updated_at=now()
  where id=p_ride_id returning * into v_ride;
  return jsonb_build_object('id',v_ride.id,'status',v_ride.status,
    'fare_dop',v_fare,'commission_reserved_dop',v_commission,'driver_payout_dop',v_payout);
end;
$$;

create or replace function public.cg_driver_accept_delivery(p_delivery_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_driver public.cg_driver_profiles%rowtype;
  v_delivery public.cg_delivery_requests%rowtype;
  v_quote jsonb;
  v_commission numeric;
  v_fare numeric;
  v_payout numeric;
begin
  select * into v_driver
  from public.cg_driver_profiles
  where user_id=auth.uid() and status='approved'
  limit 1 for update;
  if v_driver.id is null then raise exception 'Tu cuenta de conductor aún no está aprobada.'; end if;
  if not v_driver.is_available then raise exception 'Activa tu disponibilidad antes de aceptar servicios.'; end if;

  select * into v_delivery
  from public.cg_delivery_requests
  where id=p_delivery_id and status='requested'
  for update;
  if v_delivery.id is null then raise exception 'Este paquete ya fue tomado por otro conductor.'; end if;

  v_quote:=public.cg_quote_fare('package',v_delivery.pickup_lat,v_delivery.pickup_lng,
    v_delivery.destination_lat,v_delivery.destination_lng,v_delivery.distance_km);
  v_fare:=(v_quote->>'fare_dop')::numeric;
  v_commission:=(v_quote->>'commission_dop')::numeric;
  v_payout:=(v_quote->>'driver_payout_dop')::numeric;
  if v_fare<=0 or v_commission<=0 or v_commission>=v_fare or v_payout<=0 then
    raise exception 'Este paquete no tiene una tarifa válida. Actualiza la solicitud antes de aceptarla.';
  end if;

  perform public.cg_wallet_reserve_commission(v_driver.id,'delivery',v_delivery.id,v_commission);
  update public.cg_delivery_requests
  set estimated_fee_dop=v_fare,agreed_fee_dop=v_fare,
      platform_commission_dop=v_commission,driver_payout_dop=v_payout,
      commission_rate_pct=(v_quote->>'commission_pct')::numeric,
      distance_km=(v_quote->>'distance_km')::numeric,
      courier_id=v_driver.id,status='accepted',updated_at=now()
  where id=p_delivery_id returning * into v_delivery;
  return jsonb_build_object('id',v_delivery.id,'status',v_delivery.status,
    'fare_dop',v_fare,'commission_reserved_dop',v_commission,'driver_payout_dop',v_payout);
end;
$$;

revoke all on function public.cg_driver_accept_ride(uuid) from public,anon;
revoke all on function public.cg_driver_accept_delivery(uuid) from public,anon;
grant execute on function public.cg_driver_accept_ride(uuid) to authenticated;
grant execute on function public.cg_driver_accept_delivery(uuid) to authenticated;
