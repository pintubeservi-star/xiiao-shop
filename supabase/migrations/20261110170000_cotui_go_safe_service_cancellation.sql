alter table public.cg_ride_requests
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by_role text,
  add column if not exists cancellation_reason text;
alter table public.cg_delivery_requests
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by_role text,
  add column if not exists cancellation_reason text;

create or replace function public.cg_customer_cancel_service(p_token text, p_reason text default 'Cambio de planes')
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_ride public.cg_ride_requests%rowtype;
  v_delivery public.cg_delivery_requests%rowtype;
  v_reason text := left(coalesce(nullif(trim(p_reason),''),'Cambio de planes'),250);
begin
  if p_token is null or length(p_token)<32 then raise exception 'Enlace de seguimiento no válido.'; end if;
  select * into v_ride from public.cg_ride_requests where tracking_token=p_token for update;
  if v_ride.id is not null then
    if v_ride.status not in ('requested','accepted','driver_arriving') then
      raise exception 'Este viaje ya comenzó o finalizó y no se puede cancelar desde aquí. Contacta a soporte.';
    end if;
    update public.cg_ride_requests set status='cancelled',cancelled_at=now(),cancelled_by_role='customer',
      cancellation_reason=v_reason,updated_at=now() where id=v_ride.id;
    return jsonb_build_object('id',v_ride.id,'kind','ride','status','cancelled','reason',v_reason);
  end if;
  select * into v_delivery from public.cg_delivery_requests where tracking_token=p_token for update;
  if v_delivery.id is not null then
    if v_delivery.status not in ('requested','accepted') then
      raise exception 'El paquete ya fue recogido o la entrega finalizó. Contacta a soporte.';
    end if;
    update public.cg_delivery_requests set status='cancelled',cancelled_at=now(),cancelled_by_role='customer',
      cancellation_reason=v_reason,updated_at=now() where id=v_delivery.id;
    return jsonb_build_object('id',v_delivery.id,'kind','delivery','status','cancelled','reason',v_reason);
  end if;
  raise exception 'No encontramos el servicio asociado a este enlace.';
end; $$;

create or replace function public.cg_driver_cancel_service(p_service_type text,p_service_id uuid,p_reason text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_driver public.cg_driver_profiles%rowtype;
  v_ride public.cg_ride_requests%rowtype;
  v_delivery public.cg_delivery_requests%rowtype;
  v_reason text := left(coalesce(nullif(trim(p_reason),''),'Imprevisto del conductor'),250);
begin
  if auth.uid() is null then raise exception 'Inicia sesión para cancelar un servicio.'; end if;
  if length(v_reason)<5 then raise exception 'Indica un motivo de al menos 5 caracteres.'; end if;
  select * into v_driver from public.cg_driver_profiles
   where user_id=auth.uid() and status='approved' limit 1 for update;
  if v_driver.id is null then raise exception 'Conductor no autorizado.'; end if;
  if p_service_type='ride' then
    select * into v_ride from public.cg_ride_requests where id=p_service_id and driver_id=v_driver.id for update;
    if v_ride.id is null then raise exception 'Este viaje no pertenece a tu cuenta.'; end if;
    if v_ride.status not in ('accepted','driver_arriving') then
      raise exception 'Solo puedes cancelar antes de iniciar el viaje. Si ya comenzó, contacta a soporte.';
    end if;
    update public.cg_ride_requests set status='cancelled',cancelled_at=now(),cancelled_by_role='driver',
      cancellation_reason=v_reason,updated_at=now() where id=v_ride.id;
    return jsonb_build_object('id',v_ride.id,'kind','ride','status','cancelled');
  elsif p_service_type='delivery' then
    select * into v_delivery from public.cg_delivery_requests where id=p_service_id and courier_id=v_driver.id for update;
    if v_delivery.id is null then raise exception 'Este envío no pertenece a tu cuenta.'; end if;
    if v_delivery.status<>'accepted' then
      raise exception 'Solo puedes cancelar antes de recoger el paquete. Contacta a soporte si ya lo recogiste.';
    end if;
    update public.cg_delivery_requests set status='cancelled',cancelled_at=now(),cancelled_by_role='driver',
      cancellation_reason=v_reason,updated_at=now() where id=v_delivery.id;
    return jsonb_build_object('id',v_delivery.id,'kind','delivery','status','cancelled');
  else raise exception 'Tipo de servicio no válido.';
  end if;
end; $$;

revoke all on function public.cg_customer_cancel_service(text,text) from public;
grant execute on function public.cg_customer_cancel_service(text,text) to anon,authenticated;
revoke all on function public.cg_driver_cancel_service(text,uuid,text) from public;
grant execute on function public.cg_driver_cancel_service(text,uuid,text) to authenticated;
