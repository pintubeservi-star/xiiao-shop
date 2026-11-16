create table if not exists public.cg_delivery_pickup_secrets (
  delivery_id uuid primary key references public.cg_delivery_requests(id) on delete cascade,
  pickup_pin text not null check (pickup_pin ~ '^[0-9]{4}$'),
  attempts integer not null default 0 check (attempts >= 0),
  created_at timestamptz not null default now()
);

insert into public.cg_delivery_pickup_secrets(delivery_id,pickup_pin,attempts)
select id,pickup_pin,pickup_pin_attempts
from public.cg_delivery_requests
on conflict (delivery_id) do nothing;

alter table public.cg_delivery_pickup_secrets enable row level security;
revoke all on public.cg_delivery_pickup_secrets from public,anon,authenticated;

create or replace function public.cg_create_delivery_pickup_secret()
returns trigger
language plpgsql
security definer
set search_path=public
as $function$
begin
  insert into public.cg_delivery_pickup_secrets(delivery_id,pickup_pin)
  values(new.id,lpad((floor(random()*10000))::integer::text,4,'0'))
  on conflict(delivery_id) do nothing;
  return new;
end;
$function$;

drop trigger if exists cg_create_delivery_pickup_secret on public.cg_delivery_requests;
create trigger cg_create_delivery_pickup_secret
after insert on public.cg_delivery_requests
for each row execute function public.cg_create_delivery_pickup_secret();

alter table public.cg_delivery_requests drop column if exists pickup_pin_attempts;
alter table public.cg_delivery_requests drop column if exists pickup_pin;

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
    and (d.customer_id=auth.uid() or public.cg_is_admin());
  if v_pin is null then
    raise exception 'No tienes permiso para ver el PIN de este paquete.';
  end if;
  return v_pin;
end;
$function$;

revoke all on function public.cg_get_delivery_pickup_pin(uuid) from public,anon;
grant execute on function public.cg_get_delivery_pickup_pin(uuid) to authenticated;

create or replace function public.cg_driver_start_delivery(p_delivery_id uuid,p_pin text)
returns boolean
language plpgsql
security definer
set search_path=public
as $function$
declare
  v_driver public.cg_driver_profiles%rowtype;
  v_delivery public.cg_delivery_requests%rowtype;
  v_secret public.cg_delivery_pickup_secrets%rowtype;
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

  select * into v_secret
  from public.cg_delivery_pickup_secrets
  where delivery_id=p_delivery_id
  for update;
  if v_secret.delivery_id is null or v_secret.attempts>=5 then
    return false;
  end if;

  if p_pin is null or p_pin !~ '^[0-9]{4}$' or p_pin<>v_secret.pickup_pin then
    update public.cg_delivery_pickup_secrets
    set attempts=attempts+1
    where delivery_id=p_delivery_id;
    return false;
  end if;

  update public.cg_delivery_requests
  set status='picked_up',updated_at=now()
  where id=p_delivery_id;
  return true;
end;
$function$;

revoke all on function public.cg_driver_start_delivery(uuid,text) from public,anon;
grant execute on function public.cg_driver_start_delivery(uuid,text) to authenticated;