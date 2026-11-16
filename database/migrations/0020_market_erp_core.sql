-- ERP extensions for the existing multi-merchant marketplace.
-- Additive only: preserves existing Cotuí Go marketplace tables and orders.
alter table public.cg_market_products
  add column if not exists cost_dop numeric(12,2) not null default 0 check (cost_dop >= 0);

create table if not exists public.cg_market_memberships (
 id uuid primary key default gen_random_uuid(), merchant_id uuid not null references public.cg_market_merchants(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 member_role text not null default 'staff' check (member_role in ('manager','cashier','inventory','accountant','staff')),
 status text not null default 'active' check (status in ('active','invited','suspended')),
 created_at timestamptz not null default now(), unique(merchant_id,user_id)
);
create table if not exists public.cg_market_locations (
 id uuid primary key default gen_random_uuid(), merchant_id uuid not null references public.cg_market_merchants(id) on delete cascade,
 name text not null, address text, phone text, is_default boolean not null default false,
 is_active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.cg_market_customers (
 id uuid primary key default gen_random_uuid(), merchant_id uuid not null references public.cg_market_merchants(id) on delete cascade,
 full_name text not null, phone text, email text, tax_id text, address text, notes text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.cg_market_suppliers (
 id uuid primary key default gen_random_uuid(), merchant_id uuid not null references public.cg_market_merchants(id) on delete cascade,
 name text not null, phone text, email text, tax_id text, address text, notes text, created_at timestamptz not null default now()
);
create table if not exists public.cg_market_expenses (
 id uuid primary key default gen_random_uuid(), merchant_id uuid not null references public.cg_market_merchants(id) on delete cascade,
 location_id uuid references public.cg_market_locations(id) on delete set null,
 category text not null default 'General', description text not null,
 amount_dop numeric(12,2) not null check (amount_dop > 0),
 payment_method text not null default 'cash' check (payment_method in ('cash','transfer','card','other')),
 expense_date date not null default current_date, created_by uuid references auth.users(id), created_at timestamptz not null default now()
);
create table if not exists public.cg_market_cash_registers (
 id uuid primary key default gen_random_uuid(), merchant_id uuid not null references public.cg_market_merchants(id) on delete cascade,
 location_id uuid references public.cg_market_locations(id) on delete set null, name text not null,
 is_active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.cg_market_cash_sessions (
 id uuid primary key default gen_random_uuid(), merchant_id uuid not null references public.cg_market_merchants(id) on delete cascade,
 register_id uuid not null references public.cg_market_cash_registers(id), opened_by uuid not null references auth.users(id),
 closed_by uuid references auth.users(id), opening_cash_dop numeric(12,2) not null default 0 check (opening_cash_dop >= 0),
 expected_cash_dop numeric(12,2), counted_cash_dop numeric(12,2), difference_dop numeric(12,2),
 status text not null default 'open' check (status in ('open','closed')),
 opened_at timestamptz not null default now(), closed_at timestamptz
);
create unique index if not exists cg_market_one_open_session_per_register
 on public.cg_market_cash_sessions(register_id) where status='open';
create table if not exists public.cg_market_cash_movements (
 id uuid primary key default gen_random_uuid(), merchant_id uuid not null references public.cg_market_merchants(id) on delete cascade,
 session_id uuid not null references public.cg_market_cash_sessions(id) on delete cascade,
 movement_type text not null check (movement_type in ('sale','expense','cash_in','cash_out','refund')),
 description text not null, amount_dop numeric(12,2) not null check (amount_dop > 0),
 reference_id uuid, created_by uuid references auth.users(id), created_at timestamptz not null default now()
);
create table if not exists public.cg_market_purchase_orders (
 id uuid primary key default gen_random_uuid(), merchant_id uuid not null references public.cg_market_merchants(id) on delete cascade,
 supplier_id uuid references public.cg_market_suppliers(id) on delete set null, reference text,
 status text not null default 'draft' check (status in ('draft','received','cancelled')),
 subtotal_dop numeric(12,2) not null default 0, notes text, created_by uuid references auth.users(id),
 received_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.cg_market_purchase_items (
 id uuid primary key default gen_random_uuid(), purchase_id uuid not null references public.cg_market_purchase_orders(id) on delete cascade,
 product_id uuid not null references public.cg_market_products(id), quantity integer not null check (quantity > 0),
 unit_cost_dop numeric(12,2) not null check (unit_cost_dop >= 0),
 line_total_dop numeric(12,2) generated always as (quantity*unit_cost_dop) stored
);
create table if not exists public.cg_market_invoice_wallets (
 merchant_id uuid primary key references public.cg_market_merchants(id) on delete cascade,
 balance integer not null default 0 check (balance >= 0), updated_at timestamptz not null default now()
);
create table if not exists public.cg_market_invoice_wallet_transactions (
 id uuid primary key default gen_random_uuid(), merchant_id uuid not null references public.cg_market_merchants(id) on delete cascade,
 quantity_delta integer not null check (quantity_delta <> 0),
 transaction_type text not null check (transaction_type in ('purchase','ecf_issued','refund','adjustment')),
 package_code text, reference_id text, idempotency_key text unique, note text, created_at timestamptz not null default now()
);
create table if not exists public.cg_market_fiscal_profiles (
 merchant_id uuid primary key references public.cg_market_merchants(id) on delete cascade,
 legal_name text, rnc text, tax_address text, taxpayer_type text, ecf_provider text,
 ecf_status text not null default 'not_configured' check (ecf_status in ('not_configured','onboarding','sandbox','active','suspended')),
 provider_reference text, updated_at timestamptz not null default now()
);
create table if not exists public.cg_market_storefront_events (
 id uuid primary key default gen_random_uuid(), merchant_id uuid references public.cg_market_merchants(id) on delete cascade,
 event_type text not null check (event_type in ('store_view','product_view','search','add_to_cart','checkout','order_created')),
 product_id uuid references public.cg_market_products(id) on delete set null, visitor_key text, path text, source text,
 created_at timestamptz not null default now()
);
create index if not exists cg_market_customers_merchant_idx on public.cg_market_customers(merchant_id,created_at desc);
create index if not exists cg_market_expenses_merchant_date_idx on public.cg_market_expenses(merchant_id,expense_date desc);
create index if not exists cg_market_orders_merchant_created_idx on public.cg_market_orders(merchant_id,created_at desc);
create index if not exists cg_market_memberships_user_idx on public.cg_market_memberships(user_id,status);

create or replace function public.cg_market_can_access(p_merchant_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$
 select exists(select 1 from public.cg_market_merchants m where m.id=p_merchant_id and m.owner_user_id=(select auth.uid()))
 or exists(select 1 from public.cg_market_memberships mm where mm.merchant_id=p_merchant_id and mm.user_id=(select auth.uid()) and mm.status='active')
 or public.cg_is_admin();
$$;

do $$
declare t text;
begin
 foreach t in array array['cg_market_memberships','cg_market_locations','cg_market_customers','cg_market_suppliers','cg_market_expenses','cg_market_cash_registers','cg_market_cash_sessions','cg_market_cash_movements','cg_market_purchase_orders','cg_market_purchase_items','cg_market_invoice_wallets','cg_market_invoice_wallet_transactions','cg_market_fiscal_profiles','cg_market_storefront_events']
 loop execute format('alter table public.%I enable row level security',t); end loop;
end $$;

drop policy if exists "market members self or owner read" on public.cg_market_memberships;
create policy "market members self or owner read" on public.cg_market_memberships for select to authenticated
using (user_id=(select auth.uid()) or public.cg_market_can_access(merchant_id));
drop policy if exists "market owner manages memberships" on public.cg_market_memberships;
create policy "market owner manages memberships" on public.cg_market_memberships for all to authenticated
using (public.cg_market_is_owner(merchant_id) or public.cg_is_admin())
with check (public.cg_market_is_owner(merchant_id) or public.cg_is_admin());

do $$
declare t text;
begin
 foreach t in array array['cg_market_locations','cg_market_customers','cg_market_suppliers','cg_market_expenses','cg_market_cash_registers','cg_market_purchase_orders','cg_market_fiscal_profiles']
 loop
 execute format('drop policy if exists %I on public.%I',t||'_merchant_access',t);
 execute format('create policy %I on public.%I for all to authenticated using (public.cg_market_can_access(merchant_id)) with check (public.cg_market_can_access(merchant_id))',t||'_merchant_access',t);
 end loop;
end $$;
drop policy if exists "cg_market_purchase_items_merchant_access" on public.cg_market_purchase_items;
create policy "cg_market_purchase_items_merchant_access" on public.cg_market_purchase_items for all to authenticated
using (exists(select 1 from public.cg_market_purchase_orders po where po.id=purchase_id and public.cg_market_can_access(po.merchant_id)))
with check (exists(select 1 from public.cg_market_purchase_orders po where po.id=purchase_id and public.cg_market_can_access(po.merchant_id)));
drop policy if exists cg_market_cash_sessions_merchant_read on public.cg_market_cash_sessions;
create policy cg_market_cash_sessions_merchant_read on public.cg_market_cash_sessions for select to authenticated using(public.cg_market_can_access(merchant_id));
drop policy if exists cg_market_cash_movements_merchant_read on public.cg_market_cash_movements;
create policy cg_market_cash_movements_merchant_read on public.cg_market_cash_movements for select to authenticated using(public.cg_market_can_access(merchant_id));
drop policy if exists cg_market_invoice_wallets_merchant_read on public.cg_market_invoice_wallets;
create policy cg_market_invoice_wallets_merchant_read on public.cg_market_invoice_wallets for select to authenticated using(public.cg_market_can_access(merchant_id));
drop policy if exists cg_market_invoice_wallet_transactions_merchant_read on public.cg_market_invoice_wallet_transactions;
create policy cg_market_invoice_wallet_transactions_merchant_read on public.cg_market_invoice_wallet_transactions for select to authenticated using(public.cg_market_can_access(merchant_id));
drop policy if exists "market analytics admin read" on public.cg_market_storefront_events;
create policy "market analytics admin read" on public.cg_market_storefront_events for select to authenticated using(public.cg_is_admin() or (merchant_id is not null and public.cg_market_can_access(merchant_id)));

create or replace function public.cg_market_open_cash_session(p_register_id uuid,p_opening_cash numeric default 0)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_register public.cg_market_cash_registers%rowtype; v_id uuid;
begin
 select * into v_register from public.cg_market_cash_registers where id=p_register_id and is_active for update;
 if not found or not public.cg_market_can_access(v_register.merchant_id) then raise exception 'Caja no encontrada o sin permiso.'; end if;
 if p_opening_cash<0 or p_opening_cash>100000000 then raise exception 'Monto inicial no válido.'; end if;
 insert into public.cg_market_cash_sessions(merchant_id,register_id,opened_by,opening_cash_dop)
 values(v_register.merchant_id,p_register_id,(select auth.uid()),p_opening_cash) returning id into v_id;
 return v_id;
end $$;
create or replace function public.cg_market_close_cash_session(p_session_id uuid,p_counted_cash numeric)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_session public.cg_market_cash_sessions%rowtype; v_expected numeric(12,2);
begin
 select * into v_session from public.cg_market_cash_sessions where id=p_session_id for update;
 if not found or not public.cg_market_can_access(v_session.merchant_id) then raise exception 'Turno de caja no encontrado o sin permiso.'; end if;
 if v_session.status<>'open' then raise exception 'Este turno ya está cerrado.'; end if;
 if p_counted_cash<0 then raise exception 'El efectivo contado no puede ser negativo.'; end if;
 select round(v_session.opening_cash_dop + coalesce(sum(case when movement_type in ('sale','cash_in','refund') then amount_dop when movement_type in ('expense','cash_out') then -amount_dop else 0 end),0),2)
 into v_expected from public.cg_market_cash_movements where session_id=p_session_id;
 update public.cg_market_cash_sessions set status='closed',closed_by=(select auth.uid()),closed_at=now(),
 expected_cash_dop=v_expected,counted_cash_dop=p_counted_cash,difference_dop=p_counted_cash-v_expected where id=p_session_id;
 return jsonb_build_object('expected_cash_dop',v_expected,'counted_cash_dop',p_counted_cash,'difference_dop',p_counted_cash-v_expected);
end $$;
create or replace function public.cg_market_receive_purchase(p_purchase_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_purchase public.cg_market_purchase_orders%rowtype; v_item record; v_count integer:=0;
begin
 select * into v_purchase from public.cg_market_purchase_orders where id=p_purchase_id for update;
 if not found or not public.cg_market_can_access(v_purchase.merchant_id) then raise exception 'Compra no encontrada o sin permiso.'; end if;
 if v_purchase.status<>'draft' then raise exception 'Esta compra ya fue procesada.'; end if;
 if not exists(select 1 from public.cg_market_purchase_items where purchase_id=p_purchase_id) then raise exception 'Agrega productos antes de recibir la compra.'; end if;
 for v_item in select * from public.cg_market_purchase_items where purchase_id=p_purchase_id loop
  update public.cg_market_products set stock=stock+v_item.quantity,updated_at=now()
  where id=v_item.product_id and merchant_id=v_purchase.merchant_id and track_stock=true;
  if not found then raise exception 'Producto no válido o sin control de inventario.'; end if;
  insert into public.cg_market_inventory_movements(merchant_id,product_id,movement_type,quantity_delta,note,created_by)
  values(v_purchase.merchant_id,v_item.product_id,'restock',v_item.quantity,'Recepción compra '||coalesce(v_purchase.reference,p_purchase_id::text),(select auth.uid()));
  update public.cg_market_products set cost_dop=v_item.unit_cost_dop where id=v_item.product_id and merchant_id=v_purchase.merchant_id;
  v_count:=v_count+1;
 end loop;
 update public.cg_market_purchase_orders set status='received',received_at=now(),
 subtotal_dop=(select coalesce(sum(line_total_dop),0) from public.cg_market_purchase_items where purchase_id=p_purchase_id)
 where id=p_purchase_id;
 return jsonb_build_object('items_received',v_count);
end $$;
create or replace function public.cg_market_add_cash_movement(p_session_id uuid,p_type text,p_description text,p_amount numeric,p_reference_id uuid default null)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_session public.cg_market_cash_sessions%rowtype; v_id uuid;
begin
 select * into v_session from public.cg_market_cash_sessions where id=p_session_id for update;
 if not found or v_session.status<>'open' or not public.cg_market_can_access(v_session.merchant_id) then raise exception 'No hay un turno de caja abierto o no tienes permiso.'; end if;
 if p_type not in ('sale','expense','cash_in','cash_out','refund') or p_amount<=0 or p_amount>100000000 then raise exception 'Movimiento de caja no válido.'; end if;
 insert into public.cg_market_cash_movements(merchant_id,session_id,movement_type,description,amount_dop,reference_id,created_by)
 values(v_session.merchant_id,p_session_id,p_type,left(trim(p_description),200),p_amount,p_reference_id,(select auth.uid())) returning id into v_id;
 return v_id;
end $$;
revoke all on function public.cg_market_can_access(uuid) from public,anon;
revoke all on function public.cg_market_open_cash_session(uuid,numeric) from public,anon;
revoke all on function public.cg_market_close_cash_session(uuid,numeric) from public,anon;
revoke all on function public.cg_market_receive_purchase(uuid) from public,anon;
revoke all on function public.cg_market_add_cash_movement(uuid,text,text,numeric,uuid) from public,anon;
grant execute on function public.cg_market_can_access(uuid) to authenticated;
grant execute on function public.cg_market_open_cash_session(uuid,numeric) to authenticated;
grant execute on function public.cg_market_close_cash_session(uuid,numeric) to authenticated;
grant execute on function public.cg_market_receive_purchase(uuid) to authenticated;
grant execute on function public.cg_market_add_cash_movement(uuid,text,text,numeric,uuid) to authenticated;
