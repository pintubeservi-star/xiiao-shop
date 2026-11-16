-- Market orders use the existing package service kind; package_type distinguishes food and store orders.
create or replace function public.cg_market_dispatch_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.cg_market_orders%rowtype;
  v_merchant public.cg_market_merchants%rowtype;
  v_category public.cg_market_categories%rowtype;
  v_delivery public.cg_delivery_requests%rowtype;
begin
  select * into v_order from public.cg_market_orders where id=p_order_id for update;
  if not found or not public.cg_market_is_owner(v_order.merchant_id) then
    raise exception 'Pedido no encontrado o no autorizado.';
  end if;
  if v_order.source <> 'marketplace' or v_order.delivery_mode <> 'delivery' then
    raise exception 'Este pedido no requiere repartidor.';
  end if;
  if v_order.status <> 'ready_for_pickup' then
    raise exception 'Primero marca el pedido como listo para recoger.';
  end if;
  if v_order.delivery_request_id is not null then
    raise exception 'Este pedido ya tiene un repartidor solicitado.';
  end if;

  select * into v_merchant from public.cg_market_merchants where id=v_order.merchant_id;
  select * into v_category from public.cg_market_categories where id=v_merchant.category_id;

  if not v_merchant.delivery_enabled then
    raise exception 'Este comercio no tiene delivery habilitado.';
  end if;
  if v_merchant.pickup_lat is null or v_merchant.pickup_lng is null
     or v_order.customer_lat is null or v_order.customer_lng is null then
    raise exception 'Falta la ubicación GPS del comercio o del cliente.';
  end if;
  if v_merchant.pickup_lat < 18.5 or v_merchant.pickup_lat > 19.5
     or v_merchant.pickup_lng < -70.8 or v_merchant.pickup_lng > -69.5 then
    raise exception 'El punto de recogida está fuera de la zona inicial de Cotuí.';
  end if;

  insert into public.cg_delivery_requests(
    customer_id,sender_name,sender_phone,recipient_name,recipient_phone,
    pickup_address,delivery_address,package_type,package_description,status,
    pickup_lat,pickup_lng,destination_lat,destination_lng,distance_km,service_kind
  ) values (
    v_order.customer_user_id,v_merchant.store_name,v_merchant.phone,
    v_order.customer_name,v_order.customer_phone,v_merchant.address,v_order.delivery_address,
    case when v_category.slug in ('restaurantes','reposteria') then 'comida' else 'compra' end,
    'Pedido Cotuí Go Market #'||v_order.order_number,'requested',
    v_merchant.pickup_lat,v_merchant.pickup_lng,v_order.customer_lat,v_order.customer_lng,
    null,'package'
  ) returning * into v_delivery;

  update public.cg_market_orders
  set delivery_request_id=v_delivery.id,
      delivery_tracking_token=v_delivery.tracking_token,
      delivery_tracking_code=v_delivery.tracking_code,
      status='courier_requested',
      delivery_fee_dop=coalesce(v_delivery.estimated_fee_dop,delivery_fee_dop),
      total_dop=subtotal_dop-discount_dop+coalesce(v_delivery.estimated_fee_dop,delivery_fee_dop),
      updated_at=now()
  where id=v_order.id;

  return jsonb_build_object(
    'delivery_id',v_delivery.id,
    'tracking_token',v_delivery.tracking_token,
    'tracking_code',v_delivery.tracking_code,
    'status',v_delivery.status
  );
end;
$$;
revoke all on function public.cg_market_dispatch_order(uuid) from public, anon;
grant execute on function public.cg_market_dispatch_order(uuid) to authenticated;
