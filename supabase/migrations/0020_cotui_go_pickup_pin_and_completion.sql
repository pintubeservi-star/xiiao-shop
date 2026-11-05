alter table public.cg_ride_requests
  add column if not exists pickup_pin_hash text,
  add column if not exists pickup_pin_attempts integer not null default 0,
  add column if not exists pickup_pin_verified_at timestamptz,
  add column if not exists ride_started_at timestamptz,
  add column if not exists ride_completed_at timestamptz;

create or replace function public.cg_driver_start_ride(p_ride_id uuid, p_pin text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_driver public.cg_driver_profiles%rowtype;
  v_ride public.cg_ride_requests%rowtype;
begin
  select * into v_driver
  from public.cg_driver_profiles
  where user_id = auth.uid() and status = 'approved'
  limit 1;

  if v_driver.id is null then
    raise exception 'Conductor no autorizado.';
  end if;

  if p_pin is null or p_pin !~ '^[0-9]{4}$' then
    return false;
  end if;

  select * into v_ride
  from public.cg_ride_requests
  where id = p_ride_id and driver_id = v_driver.id
  for update;

  if v_ride.id is null
     or v_ride.status not in ('accepted', 'driver_arriving')
     or v_ride.pickup_pin_verified_at is not null
     or v_ride.pickup_pin_hash is null
     or v_ride.pickup_pin_attempts >= 5 then
    return false;
  end if;

  if v_ride.pickup_pin_hash <> encode(extensions.digest(convert_to(p_pin, 'UTF8'), 'sha256'), 'hex') then
    update public.cg_ride_requests
    set pickup_pin_attempts = pickup_pin_attempts + 1,
        updated_at = now()
    where id = p_ride_id;
    return false;
  end if;

  update public.cg_ride_requests
  set status = 'in_progress',
      pickup_pin_verified_at = now(),
      ride_started_at = now(),
      updated_at = now()
  where id = p_ride_id;

  return true;
end;
$function$;

revoke all on function public.cg_driver_start_ride(uuid, text) from public;
grant execute on function public.cg_driver_start_ride(uuid, text) to authenticated;

create or replace function public.cg_driver_update_ride_status(p_ride_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  v_driver public.cg_driver_profiles%rowtype;
begin
  select * into v_driver
  from public.cg_driver_profiles
  where user_id = auth.uid() and status = 'approved'
  limit 1;

  if v_driver.id is null then
    raise exception 'Conductor no autorizado.';
  end if;

  if p_status not in ('driver_arriving', 'completed') then
    raise exception 'Estado no permitido.';
  end if;

  update public.cg_ride_requests
  set status = p_status,
      ride_completed_at = case when p_status = 'completed' then now() else ride_completed_at end,
      updated_at = now()
  where id = p_ride_id
    and driver_id = v_driver.id
    and (
      (p_status = 'driver_arriving' and status = 'accepted')
      or
      (p_status = 'completed' and status = 'in_progress' and pickup_pin_verified_at is not null)
    );

  if not found then
    raise exception 'No se pudo actualizar este viaje. Verifica que el PIN se haya validado al iniciar.';
  end if;
end;
$function$;

revoke all on function public.cg_driver_update_ride_status(uuid, text) from public;
grant execute on function public.cg_driver_update_ride_status(uuid, text) to authenticated;
