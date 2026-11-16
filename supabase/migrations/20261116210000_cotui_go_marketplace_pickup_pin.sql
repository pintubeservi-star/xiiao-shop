-- Permite al comercio ver el PIN de recogida del pedido que le pertenece.
create or replace function public.cg_market_get_pickup_pin(p_order_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_delivery_id uuid;
  v_pin text;
begin
  select d.id into v_delivery_id
  from public.cg_market_orders o
  join public.cg_market_merchants m on m.id=o.merchant_id
  join public.cg_delivery_requests d on d.id=o.delivery_request_id
  where o.id=p_order_id
    and m.owner_user_id=auth.uid()
    and d.status in ('requested','accepted','courier_arriving');

  if v_delivery_id is null then
    raise exception 'El PIN no está disponible o este pedido no pertenece a tu comercio.';
  end if;

  select pickup_pin into v_pin
  from public.cg_delivery_pickup_secrets
  where delivery_id=v_delivery_id;

  if v_pin is null then
    raise exception 'No se encontró el PIN de recogida.';
  end if;

  return v_pin;
end;
$$;
revoke all on function public.cg_market_get_pickup_pin(uuid) from public, anon;
grant execute on function public.cg_market_get_pickup_pin(uuid) to authenticated;
