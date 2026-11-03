-- Basic abuse control for anonymous checkout: max 5 orders per phone per 15 minutes.
create or replace function private.guard_checkout_rate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_recent integer;
begin
  select count(*) into v_recent
  from public.orders
  where customer_phone = new.customer_phone
    and created_at > now() - interval '15 minutes';
  if v_recent >= 5 then
    raise exception 'Demasiados pedidos desde este teléfono. Intenta nuevamente en 15 minutos.';
  end if;
  return new;
end;
$function$;
revoke all on function private.guard_checkout_rate() from public,anon,authenticated;
drop trigger if exists guard_checkout_rate on public.orders;
create trigger guard_checkout_rate before insert on public.orders
for each row execute function private.guard_checkout_rate();
