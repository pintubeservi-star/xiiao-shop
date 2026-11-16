create or replace function public.cg_driver_update_delivery_status(p_delivery_id uuid,p_status text)
returns void
language plpgsql
security definer
set search_path=public
as $function$
declare
  v_driver public.cg_driver_profiles%rowtype;
begin
  select * into v_driver
  from public.cg_driver_profiles
  where user_id=auth.uid() and status='approved'
  limit 1;
  if v_driver.id is null then
    raise exception 'Conductor no autorizado.';
  end if;

  if p_status not in ('courier_arriving','on_the_way','delivered') then
    raise exception 'Para recoger el paquete debes verificar primero el PIN de entrega.';
  end if;

  update public.cg_delivery_requests
  set status=p_status,updated_at=now()
  where id=p_delivery_id and courier_id=v_driver.id
    and (
      (p_status='courier_arriving' and status='accepted')
      or (p_status='on_the_way' and status='picked_up')
      or (p_status='delivered' and status='on_the_way')
    );
  if not found then
    raise exception 'No se pudo actualizar este paquete. Verifica el estado actual.';
  end if;
end;
$function$;
revoke all on function public.cg_driver_update_delivery_status(uuid,text) from public,anon;
grant execute on function public.cg_driver_update_delivery_status(uuid,text) to authenticated;