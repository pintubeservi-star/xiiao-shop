create or replace function public.cg_get_delivery_pickup_pin(p_delivery_id uuid)
returns text
language plpgsql
security definer
set search_path=public
as $function$
declare v_pin text;
begin
  select s.pickup_pin into v_pin
  from public.cg_delivery_pickup_secrets s
  join public.cg_delivery_requests d on d.id=s.delivery_id
  where d.id=p_delivery_id
    and d.status in ('requested','accepted','courier_arriving')
    and (d.customer_id=auth.uid() or public.cg_is_admin());
  if v_pin is null then
    raise exception 'El PIN no está disponible o no tienes permiso para verlo.';
  end if;
  return v_pin;
end;
$function$;
revoke all on function public.cg_get_delivery_pickup_pin(uuid) from public,anon;
grant execute on function public.cg_get_delivery_pickup_pin(uuid) to authenticated;