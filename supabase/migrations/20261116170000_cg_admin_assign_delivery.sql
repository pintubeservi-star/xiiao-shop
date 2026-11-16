-- Allow administrators to dispatch package deliveries while preserving the driver's wallet commission reservation.
create or replace function public.cg_admin_assign_delivery(p_delivery_id uuid,p_driver_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_delivery public.cg_delivery_requests%rowtype;
  v_driver public.cg_driver_profiles%rowtype;
  v_commission numeric;
begin
  if not public.cg_is_admin() then
    raise exception 'No autorizado.';
  end if;

  select * into v_delivery
  from public.cg_delivery_requests
  where id=p_delivery_id and status='requested'
  for update;
  if v_delivery.id is null then
    raise exception 'El paquete ya fue asignado o dejó de estar disponible.';
  end if;

  select * into v_driver
  from public.cg_driver_profiles
  where id=p_driver_id and status='approved' and is_available=true
  for update;
  if v_driver.id is null then
    raise exception 'El repartidor no está aprobado o no está disponible.';
  end if;

  v_commission:=coalesce(
    v_delivery.platform_commission_dop,
    round(coalesce(v_delivery.agreed_fee_dop,v_delivery.estimated_fee_dop,0)*coalesce(v_delivery.commission_rate_pct,15)/100,2)
  );
  perform public.cg_wallet_reserve_commission(v_driver.id,'delivery',v_delivery.id,v_commission);

  update public.cg_delivery_requests
  set courier_id=v_driver.id,status='accepted',updated_at=now()
  where id=v_delivery.id;

  return jsonb_build_object('id',v_delivery.id,'status','accepted','courier_id',v_driver.id,'commission_reserved_dop',v_commission);
end;
$$;

revoke all on function public.cg_admin_assign_delivery(uuid,uuid) from public,anon;
grant execute on function public.cg_admin_assign_delivery(uuid,uuid) to authenticated;
