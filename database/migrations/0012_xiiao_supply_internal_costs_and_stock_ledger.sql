-- Internal stock cost and inventory ledger for XiiAO Supply.
create table if not exists public.product_costs (
  product_id uuid primary key references public.products(id) on delete cascade,
  unit_cost_dop numeric(12,2) not null default 0 check (unit_cost_dop >= 0),
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);
alter table public.product_costs enable row level security;
drop policy if exists "admin manages product costs" on public.product_costs;
create policy "admin manages product costs" on public.product_costs
for all to authenticated using (private.is_admin()) with check (private.is_admin());
revoke all on public.product_costs from anon, authenticated;
grant select, insert, update, delete on public.product_costs to authenticated;

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  quantity_delta integer not null check (quantity_delta <> 0),
  movement_type text not null check (movement_type in ('initial','restock','sale','adjustment','return')),
  note text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists inventory_movements_product_time_idx
on public.inventory_movements(product_id, created_at desc);
alter table public.inventory_movements enable row level security;
drop policy if exists "admin reads inventory movements" on public.inventory_movements;
create policy "admin reads inventory movements" on public.inventory_movements
for select to authenticated using (private.is_admin());
drop policy if exists "admin inserts inventory movements" on public.inventory_movements;
create policy "admin inserts inventory movements" on public.inventory_movements
for insert to authenticated with check (private.is_admin());
revoke all on public.inventory_movements from anon, authenticated;
grant select, insert on public.inventory_movements to authenticated;

create or replace function private.log_product_stock_change()
returns trigger language plpgsql security invoker set search_path = ''
as $$
declare v_delta integer;
begin
  v_delta := new.stock - old.stock;
  if v_delta <> 0 then
    insert into public.inventory_movements(product_id, quantity_delta, movement_type, note, created_by)
    values(new.id, v_delta, case when v_delta < 0 then 'sale' else 'adjustment' end,
      case when v_delta < 0 then 'Salida automática por pedido' else 'Ajuste de inventario' end,
      auth.uid());
  end if;
  return new;
end;
$$;
drop trigger if exists products_stock_movement on public.products;
create trigger products_stock_movement after update of stock on public.products
for each row when (old.stock is distinct from new.stock)
execute function private.log_product_stock_change();
