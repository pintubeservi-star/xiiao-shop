-- Cotuí Go: esquema inicial para Supabase. Ejecutar completo en SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.profiles(id uuid primary key references auth.users(id) on delete cascade,full_name text not null default 'Usuario',phone text,role text not null default 'customer' check(role in ('customer','driver','admin')),created_at timestamptz not null default now());
create table if not exists public.driver_wallets(driver_id uuid primary key references public.profiles(id) on delete cascade,balance numeric(12,2) not null default 0 check(balance>=0),updated_at timestamptz not null default now());
create table if not exists public.driver_locations(driver_id uuid primary key references public.profiles(id) on delete cascade,lat double precision not null,lng double precision not null,updated_at timestamptz not null default now());
create table if not exists public.wallet_transactions(id uuid primary key default gen_random_uuid(),driver_id uuid not null references public.profiles(id),order_id uuid,amount numeric(12,2) not null,kind text not null check(kind in ('topup','commission','adjustment')),note text,created_at timestamptz not null default now());
create table if not exists public.orders(id uuid primary key default gen_random_uuid(),customer_id uuid not null references public.profiles(id),driver_id uuid references public.profiles(id),service_type text not null check(service_type in ('food','package')),pickup_address text not null,dropoff_address text not null,pickup_lat double precision not null,pickup_lng double precision not null,dropoff_lat double precision not null,dropoff_lng double precision not null,distance_km numeric(8,2) not null,estimated_price numeric(12,2) not null,commission_amount numeric(12,2) not null,start_pin text not null,details text,status text not null default 'pending' check(status in ('pending','accepted','arrived','in_progress','delivered','cancelled')),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create index if not exists orders_status_created_idx on public.orders(status,created_at desc);
create index if not exists orders_customer_idx on public.orders(customer_id,created_at desc);
create index if not exists orders_driver_idx on public.orders(driver_id,created_at desc);
alter table public.profiles enable row level security;
alter table public.driver_wallets enable row level security;
alter table public.driver_locations enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.orders enable row level security;
drop policy if exists "profiles read self" on public.profiles;
create policy "profiles read self" on public.profiles for select to authenticated using(id=auth.uid());
drop policy if exists "profiles update self" on public.profiles;
create policy "profiles update self" on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid() and role=(select p.role from public.profiles p where p.id=auth.uid()));
drop policy if exists "wallet owner read" on public.driver_wallets;
create policy "wallet owner read" on public.driver_wallets for select to authenticated using(driver_id=auth.uid() or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
drop policy if exists "wallet transactions owner read" on public.wallet_transactions;
create policy "wallet transactions owner read" on public.wallet_transactions for select to authenticated using(driver_id=auth.uid() or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
drop policy if exists "order visibility" on public.orders;
create policy "order visibility" on public.orders for select to authenticated using(customer_id=auth.uid() or driver_id=auth.uid() or (status='pending' and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='driver')) or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
drop policy if exists "driver location visibility" on public.driver_locations;
create policy "driver location visibility" on public.driver_locations for select to authenticated using(driver_id=auth.uid() or exists(select 1 from public.orders o where o.driver_id=driver_locations.driver_id and o.customer_id=auth.uid() and o.status not in ('delivered','cancelled')) or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.profiles(id,full_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','Usuario')) on conflict(id) do nothing;
 return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
create or replace function public.create_order(p_service_type text,p_pickup_address text,p_dropoff_address text,p_pickup_lat double precision,p_pickup_lng double precision,p_dropoff_lat double precision,p_dropoff_lng double precision,p_details text default null)
returns public.orders language plpgsql security definer set search_path=public as $$
declare d numeric(8,2); price numeric(12,2); pin text; result public.orders;
begin
 if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;
 if p_service_type not in ('food','package') then raise exception 'Servicio no válido'; end if;
 if length(trim(p_dropoff_address))<3 then raise exception 'Destino inválido'; end if;
 d:=round((6371*2*asin(sqrt(power(sin(radians(p_dropoff_lat-p_pickup_lat)/2),2)+cos(radians(p_pickup_lat))*cos(radians(p_dropoff_lat))*power(sin(radians(p_dropoff_lng-p_pickup_lng)/2),2))))::numeric,2);
 price:=greatest(100,ceil((100+greatest(d,0)*25)/5)*5);
 pin:=lpad((floor(random()*10000))::int::text,4,'0');
 insert into public.orders(customer_id,service_type,pickup_address,dropoff_address,pickup_lat,pickup_lng,dropoff_lat,dropoff_lng,distance_km,estimated_price,commission_amount,start_pin,details)
 values(auth.uid(),p_service_type,trim(p_pickup_address),trim(p_dropoff_address),p_pickup_lat,p_pickup_lng,p_dropoff_lat,p_dropoff_lng,d,price,round(price*.15,2),pin,p_details) returning * into result;
 return result;
end $$;
create or replace function public.claim_order(p_order_id uuid) returns void language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role='driver') then raise exception 'Solo repartidores autorizados'; end if;
 update public.orders set driver_id=auth.uid(),status='accepted',updated_at=now() where id=p_order_id and status='pending' and driver_id is null;
 if not found then raise exception 'Este servicio ya fue asignado o no está disponible'; end if;
end $$;
create or replace function public.verify_order_start(p_order_id uuid,p_pin text) returns void language plpgsql security definer set search_path=public as $$
begin
 update public.orders set status='in_progress',updated_at=now() where id=p_order_id and driver_id=auth.uid() and status in ('accepted','arrived') and start_pin=p_pin;
 if not found then raise exception 'PIN incorrecto o servicio no asignado'; end if;
end $$;
create or replace function public.update_driver_location(p_lat double precision,p_lng double precision) returns void language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role='driver') then raise exception 'No autorizado'; end if;
 insert into public.driver_locations(driver_id,lat,lng,updated_at) values(auth.uid(),p_lat,p_lng,now())
 on conflict(driver_id) do update set lat=excluded.lat,lng=excluded.lng,updated_at=now();
end $$;
create or replace function public.advance_order_status(p_order_id uuid,p_next_status text) returns void language plpgsql security definer set search_path=public as $$
declare o public.orders;
begin
 select * into o from public.orders where id=p_order_id for update;
 if o.id is null or o.driver_id<>auth.uid() then raise exception 'Servicio no asignado a tu cuenta'; end if;
 if p_next_status='arrived' and o.status='accepted' then
  update public.orders set status='arrived',updated_at=now() where id=p_order_id;
 elsif p_next_status='delivered' and o.status='in_progress' then
  update public.driver_wallets set balance=balance-o.commission_amount,updated_at=now() where driver_id=auth.uid() and balance>=o.commission_amount;
  if not found then raise exception 'Saldo insuficiente para cubrir la comisión. Recarga tu cuenta.'; end if;
  insert into public.wallet_transactions(driver_id,order_id,amount,kind,note) values(auth.uid(),p_order_id,-o.commission_amount,'commission','Comisión 15% Cotuí Go');
  update public.orders set status='delivered',updated_at=now() where id=p_order_id;
 else raise exception 'Cambio de estado no permitido'; end if;
end $$;
create or replace function public.admin_wallet_topup(p_driver_id uuid,p_amount numeric,p_note text default 'Recarga administrativa') returns void language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception 'No autorizado'; end if;
 if p_amount<=0 then raise exception 'Monto inválido'; end if;
 insert into public.driver_wallets(driver_id,balance) values(p_driver_id,p_amount) on conflict(driver_id) do update set balance=driver_wallets.balance+p_amount,updated_at=now();
 insert into public.wallet_transactions(driver_id,amount,kind,note) values(p_driver_id,p_amount,'topup',p_note);
end $$;
create or replace function public.admin_dashboard_stats() returns json language plpgsql security definer set search_path=public as $$
declare r json;
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception 'No autorizado'; end if;
 select json_build_object('total',(select count(*) from public.orders),'active',(select count(*) from public.orders where status not in ('delivered','cancelled')),'drivers',(select count(*) from public.profiles where role='driver'),'revenue',(select coalesce(sum(-amount),0) from public.wallet_transactions where kind='commission')) into r;
 return r;
end $$;
grant execute on function public.create_order(text,text,text,double precision,double precision,double precision,double precision,text) to authenticated;
grant execute on function public.claim_order(uuid) to authenticated;
grant execute on function public.verify_order_start(uuid,text) to authenticated;
grant execute on function public.update_driver_location(double precision,double precision) to authenticated;
grant execute on function public.advance_order_status(uuid,text) to authenticated;
grant execute on function public.admin_wallet_topup(uuid,numeric,text) to authenticated;
grant execute on function public.admin_dashboard_stats() to authenticated;
-- Activar Realtime para orders y driver_locations desde Supabase Dashboard > Database > Publications.
-- Antes de operar: integrar pasarela de recargas y notificaciones push; asignar roles desde entorno seguro.
