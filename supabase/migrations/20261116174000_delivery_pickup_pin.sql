alter table public.cg_delivery_requests
  add column if not exists pickup_pin text not null default lpad((floor(random()*10000))::int::text,4,'0'),
  add column if not exists pickup_pin_attempts integer not null default 0;

create or replace function public.cg_driver_start_delivery(p_delivery_id uuid,p_pin text)
returns boolean
language plpgsql
security definer
set search_path=public
as $function$
declare
  v_driver public.cg_driver_profiles%rowtype;
  v_delivery public.cg_delivery_requests%rowtype;
begin
  select * into v_driver
  from public.cg_driver_profiles
  where user_id=auth.uid() and status='approved'
  limit 1
  for update;
  if v_driver.id is null then
    raise exception 'Tu cuenta de repartidor aún no está aprobada.';
  end if;

  select * into v_delivery
  from public.cg_delivery_requests
  where id=p_delivery_id and courier_id=v_driver.id
  for update;
  if v_delivery.id is null or v_delivery.status<>'courier_arriving' then
    raise exception 'El paquete no está en estado de recogida.';
  end if;

  if v_delivery.pickup_pin_attempts>=5 then
    return false;
  end if;

  if p_pin is null or p_pin !~ '^[0-9]{4}$' or p_pin<>v_delivery.pickup_pin then
    update public.cg_delivery_requests
    set pickup_pin_attempts=pickup_pin_attempts+1,updated_at=now()
    where id=p_delivery_id;
    return false;
  end if;

  update public.cg_delivery_requests
  set status='picked_up',pickup_pin_attempts=0,updated_at=now()
  where id=p_delivery_id;
  return true;
end;
$function$;

revoke all on function public.cg_driver_start_delivery(uuid,text) from public,anon;
grant execute on function public.cg_driver_start_delivery(uuid,text) to authenticated;