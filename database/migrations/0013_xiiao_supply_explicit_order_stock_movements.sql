-- Keep inventory movement semantics explicit: admin adjustments and order sales are logged separately.
drop trigger if exists products_stock_movement on public.products;
drop function if exists private.log_product_stock_change();

create or replace function public.create_guest_order(
 p_customer_name text, p_customer_phone text, p_shipping_address jsonb, p_items jsonb,
 p_shipping_dop numeric default 150, p_affiliate_code text default null,
 p_customer_id uuid default null, p_coupon_code text default null
) returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare
 v_order_id uuid; v_order_number bigint; v_customer_id uuid := p_customer_id;
 v_item jsonb; v_product public.products%rowtype; v_qty integer;
 v_unit_price numeric(12,2); v_line_total numeric(12,2); v_line_discount numeric(12,2);
 v_allocated numeric(12,2) := 0; v_item_index integer := 0;
 v_subtotal numeric(12,2) := 0; v_total numeric(12,2); v_discount numeric(12,2) := 0;
 v_affiliate_id uuid; v_affiliate_link_id uuid; v_code text; v_coupon public.coupons%rowtype;
begin
 if p_customer_name is null or length(trim(p_customer_name)) < 3 or length(p_customer_name) > 120 then raise exception 'Nombre inválido'; end if;
 if p_customer_phone is null or length(regexp_replace(p_customer_phone,'[^0-9]','','g')) < 10 then raise exception 'Teléfono inválido'; end if;
 if p_shipping_address is null or length(coalesce(p_shipping_address->>'address','')) < 5 then raise exception 'Dirección incompleta'; end if;
 if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 30 then raise exception 'Carrito inválido'; end if;
 if exists(select 1 from jsonb_array_elements(p_items) x group by x->>'product_id' having count(*)>1) then raise exception 'El carrito contiene productos duplicados'; end if;
 if p_shipping_dop is null or p_shipping_dop < 0 or p_shipping_dop > 5000 then raise exception 'Costo de envío inválido'; end if;
 if p_affiliate_code is not null and length(p_affiliate_code) <= 80 then
  select l.affiliate_id,l.id,l.code into v_affiliate_id,v_affiliate_link_id,v_code from public.affiliate_links l join public.affiliate_profiles a on a.id=l.affiliate_id where l.code=p_affiliate_code and a.status='active' limit 1;
 end if;
 for v_item in select value from jsonb_array_elements(p_items) loop
  if coalesce(v_item->>'product_id','')='' then raise exception 'Producto inválido'; end if;
  begin v_qty := (v_item->>'quantity')::integer; exception when others then raise exception 'Cantidad inválida'; end;
  if v_qty < 1 or v_qty > 20 then raise exception 'Cantidad fuera de rango'; end if;
  select * into v_product from public.products where id=(v_item->>'product_id')::uuid and status='published' for update;
  if not found then raise exception 'Uno de los productos ya no está disponible'; end if;
  if v_product.stock < v_qty then raise exception 'Inventario insuficiente para: %',v_product.name; end if;
  v_unit_price := case when v_product.wholesale_price_dop is not null and v_qty>=v_product.wholesale_min_qty then v_product.wholesale_price_dop else v_product.price_dop end;
  v_subtotal := v_subtotal+(v_unit_price*v_qty);
 end loop;
 if nullif(trim(coalesce(p_coupon_code,'')),'') is not null then
  select * into v_coupon from public.coupons where code=upper(trim(p_coupon_code)) and is_active=true for update;
  if not found then raise exception 'El cupón no existe o está desactivado'; end if;
  if v_coupon.starts_at is not null and now()<v_coupon.starts_at then raise exception 'Este cupón todavía no está vigente'; end if;
  if v_coupon.expires_at is not null and now()>v_coupon.expires_at then raise exception 'Este cupón ha vencido'; end if;
  if v_coupon.max_uses is not null and v_coupon.uses_count>=v_coupon.max_uses then raise exception 'Este cupón agotó sus usos'; end if;
  if v_subtotal<v_coupon.min_subtotal_dop then raise exception 'Compra mínima para este cupón: RD$ %',v_coupon.min_subtotal_dop; end if;
  v_discount := case when v_coupon.discount_type='percentage' then round(v_subtotal*v_coupon.discount_value/100,2) else least(v_subtotal,v_coupon.discount_value) end;
 end if;
 v_total := greatest(0,v_subtotal+p_shipping_dop-v_discount);
 insert into public.orders(customer_id,customer_name,customer_phone,shipping_address,payment_method,status,subtotal_dop,shipping_dop,total_dop,affiliate_id,affiliate_link_id,attribution_code,coupon_code,discount_dop)
 values(v_customer_id,trim(p_customer_name),trim(p_customer_phone),p_shipping_address,'cash_on_delivery','pending',v_subtotal,p_shipping_dop,v_total,v_affiliate_id,v_affiliate_link_id,v_code,case when v_coupon.id is null then null else v_coupon.code end,v_discount)
 returning id,order_number into v_order_id,v_order_number;
 for v_item in select value from jsonb_array_elements(p_items) loop
  v_item_index:=v_item_index+1; v_qty:=(v_item->>'quantity')::integer;
  select * into v_product from public.products where id=(v_item->>'product_id')::uuid for update;
  v_unit_price:=case when v_product.wholesale_price_dop is not null and v_qty>=v_product.wholesale_min_qty then v_product.wholesale_price_dop else v_product.price_dop end;
  v_line_total:=round(v_unit_price*v_qty,2);
  if v_discount>0 and v_subtotal>0 then
   if v_item_index<jsonb_array_length(p_items) then v_line_discount:=round(v_discount*v_line_total/v_subtotal,2);v_allocated:=v_allocated+v_line_discount;
   else v_line_discount:=v_discount-v_allocated; end if;
   v_line_total:=greatest(0,v_line_total-v_line_discount);
  end if;
  insert into public.order_items(order_id,product_id,merchant_id,product_name_snapshot,quantity,unit_price_dop,commission_type_snapshot,commission_value_snapshot,line_total_dop)
  values(v_order_id,v_product.id,v_product.merchant_id,v_product.name,v_qty,round(v_line_total/v_qty,2),v_product.commission_type,v_product.commission_value,v_line_total);
  update public.products set stock=stock-v_qty where id=v_product.id;
  insert into public.inventory_movements(product_id,quantity_delta,movement_type,note) values(v_product.id,-v_qty,'sale','Salida automática por pedido #'||v_order_number);
 end loop;
 if v_coupon.id is not null then update public.coupons set uses_count=uses_count+1,updated_at=now() where id=v_coupon.id; end if;
 return jsonb_build_object('order_id',v_order_id,'order_number',v_order_number,'subtotal_dop',v_subtotal,'shipping_dop',p_shipping_dop,'discount_dop',v_discount,'coupon_code',case when v_coupon.id is null then null else v_coupon.code end,'total_dop',v_total);
end;
$function$;
revoke all on function public.create_guest_order(text,text,jsonb,jsonb,numeric,text,uuid,text) from public;
grant execute on function public.create_guest_order(text,text,jsonb,jsonb,numeric,text,uuid,text) to anon,authenticated;
