-- Atomic guest checkout for cash-on-delivery orders.
create or replace function public.create_guest_order(
  p_customer_name text, p_customer_phone text, p_shipping_address jsonb,
  p_items jsonb, p_shipping_dop numeric default 150
) returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare
  v_order_id uuid; v_order_number bigint; v_customer_id uuid := auth.uid();
  v_item jsonb; v_product public.products%rowtype; v_qty integer;
  v_subtotal numeric(12,2) := 0; v_total numeric(12,2);
begin
  if p_customer_name is null or length(trim(p_customer_name)) < 3 or length(p_customer_name) > 120 then raise exception 'Nombre inválido'; end if;
  if p_customer_phone is null or length(regexp_replace(p_customer_phone, '[^0-9]', '', 'g')) < 10 then raise exception 'Teléfono inválido'; end if;
  if p_shipping_address is null or length(coalesce(p_shipping_address->>'address','')) < 5 then raise exception 'Dirección incompleta'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 30 then raise exception 'Carrito inválido'; end if;
  if p_shipping_dop is null or p_shipping_dop < 0 or p_shipping_dop > 5000 then raise exception 'Costo de envío inválido'; end if;
  for v_item in select value from jsonb_array_elements(p_items) loop
    if coalesce(v_item->>'product_id','') = '' then raise exception 'Producto inválido'; end if;
    begin v_qty := (v_item->>'quantity')::integer; exception when others then raise exception 'Cantidad inválida'; end;
    if v_qty < 1 or v_qty > 20 then raise exception 'Cantidad fuera de rango'; end if;
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid and status = 'published' for update;
    if not found then raise exception 'Uno de los productos ya no está disponible'; end if;
    if v_product.stock < v_qty then raise exception 'Inventario insuficiente para: %', v_product.name; end if;
    v_subtotal := v_subtotal + (v_product.price_dop * v_qty);
  end loop;
  v_total := v_subtotal + p_shipping_dop;
  insert into public.orders (customer_id,customer_name,customer_phone,shipping_address,payment_method,status,subtotal_dop,shipping_dop,total_dop)
  values (v_customer_id,trim(p_customer_name),trim(p_customer_phone),p_shipping_address,'cash_on_delivery','pending',v_subtotal,p_shipping_dop,v_total)
  returning id,order_number into v_order_id,v_order_number;
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::integer;
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid for update;
    insert into public.order_items (order_id,product_id,merchant_id,product_name_snapshot,quantity,unit_price_dop,commission_type_snapshot,commission_value_snapshot,line_total_dop)
    values (v_order_id,v_product.id,v_product.merchant_id,v_product.name,v_qty,v_product.price_dop,v_product.commission_type,v_product.commission_value,v_product.price_dop*v_qty);
    update public.products set stock = stock - v_qty where id = v_product.id;
  end loop;
  return jsonb_build_object('order_id',v_order_id,'order_number',v_order_number,'subtotal_dop',v_subtotal,'shipping_dop',p_shipping_dop,'total_dop',v_total);
end;
$function$;
revoke all on function public.create_guest_order(text,text,jsonb,jsonb,numeric) from public;
grant execute on function public.create_guest_order(text,text,jsonb,jsonb,numeric) to anon,authenticated;
