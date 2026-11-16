-- Cotuí Go Market hardening: strict order transitions and accurate stock returns.
create or replace function public.cg_market_update_order(
  p_order_id uuid,
  p_status text default null,
  p_payment_status text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.cg_market_orders%rowtype;
  v_item record;
begin
  select * into v_order
  from public.cg_market_orders
  where id=p_order_id
  for update;

  if not found or not public.cg_market_is_owner(v_order.merchant_id) then
    raise exception 'Pedido no encontrado o no autorizado.';
  end if;

  if p_status is not null then
    if p_status not in ('accepted','preparing','ready_for_pickup','completed','rejected','cancelled') then
      raise exception 'Estado no permitido.';
    end if;

    if p_status='completed' and v_order.delivery_mode <> 'pickup' then
      raise exception 'El repartidor debe confirmar la entrega de este pedido.';
    end if;

    if p_status in ('rejected','cancelled') then
      if v_order.delivery_request_id is not null then
        raise exception 'Este pedido ya fue enviado a delivery. Contacta administración para cancelarlo.';
      end if;
      if v_order.status not in ('new','accepted','preparing','ready_for_pickup') then
        raise exception 'No se puede cancelar en este estado.';
      end if;
    else
      if not (
        (v_order.status='new' and p_status='accepted')
        or (v_order.status='accepted' and p_status='preparing')
        or (v_order.status='preparing' and p_status='ready_for_pickup')
        or (v_order.status='ready_for_pickup' and p_status='completed' and v_order.delivery_mode='pickup')
      ) then
        raise exception 'Transición de pedido no permitida.';
      end if;
    end if;

    if p_status in ('rejected','cancelled') then
      for v_item in
        select oi.product_id, oi.quantity
        from public.cg_market_order_items oi
        join public.cg_market_products p on p.id=oi.product_id and p.track_stock=true
        where oi.order_id=p_order_id and oi.product_id is not null
      loop
        update public.cg_market_products
        set stock=stock+v_item.quantity,updated_at=now()
        where id=v_item.product_id;
        insert into public.cg_market_inventory_movements(
          merchant_id,product_id,order_id,movement_type,quantity_delta,note,created_by
        ) values (
          v_order.merchant_id,v_item.product_id,p_order_id,'cancellation_return',
          v_item.quantity,'Devolución por cancelación',auth.uid()
        );
      end loop;
    end if;

    update public.cg_market_orders
    set status=p_status,
        cancelled_at=case when p_status in ('rejected','cancelled') then now() else cancelled_at end,
        updated_at=now()
    where id=p_order_id;
  end if;

  if p_payment_status is not null then
    if p_payment_status not in ('pending','paid','failed','refunded') then
      raise exception 'Estado de pago no permitido.';
    end if;
    update public.cg_market_orders
    set payment_status=p_payment_status,updated_at=now()
    where id=p_order_id;
  end if;
end;
$$;
revoke all on function public.cg_market_update_order(uuid,text,text) from public, anon;
grant execute on function public.cg_market_update_order(uuid,text,text) to authenticated;

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
