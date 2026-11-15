-- Cotuí Go: schema inicial. Ejecutar en Supabase SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.profiles(
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null default 'Usuario',
 phone text,
 role text not null default 'customer' check(role in ('customer','driver','admin')),
 created_at timestamptz not null default now()
);
create table if not exists public.driver_wallets(
 driver_id uuid primary key references public.profiles(id) on delete cascade,
 balance numeric(12,2) not null default 0 check(balance>=0),
 updated_at timestamptz not null default now()
);
create table if not exists public.wallet_transactions(
 id uuid primary key default gen_random_uuid(),
 driver_id uuid not null references public.profiles(id),
 order_id uuid,
 amount numeric(12,2) not null,
 kind text not null check(kind in ('topup','commission','adjustment')),
 note text,
 created_at timestamptz not null default now()
);
create table if not exists public.orders(
 id uuid primary key default gen_random_uuid(),
 customer_id uuid not null references public.profiles(id),
 driver_id uuid references public.profiles(id),
 service_type text not null check(service_type in ('food','package')),
 pickup_address text not null,
 dropoff_address text not null,
 pickup_lat double precision not null,
 pickup_lng double precision not null,
 dropoff_lat double precision not null,
 dropoff_lng double precision not null,
 distance_km numeric(8,2) not null,
 estimated_price numeric(12,2) not null,
 commission_amount numeric(12,2) not null,
 start_pin text not null,
 details text,
 status text not null default 'pending' check(status in ('pending','accepted','arrived','in_progress','delivered','cancelled')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists orders_status_created_idx on public.orders(status,created_at desc);
create index if not exists orders_customer_idx on public.orders(customer_id,created_at desc);
create index if not exists orders_driver_idx on public.orders(driver_id,created_at desc);
alter table public.profiles enable row level security;
alter table public.driver_wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.orders enable row level security;
create policy "profiles read self or admin" on public.profiles for select to authenticated using(id=auth.uid() or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy "profiles update self" on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid() and role=(select p.role from public.profiles p where p.id=auth.uid()));
create policy "wallet owner read" on public.driver_wallets for select to authenticated using(driver_id=auth.uid() or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy "wallet transactions owner read" on public.wallet_transactions for select to authenticated using(driver_id=auth.uid() or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy "order visibility" on public.orders for select to authenticated using(customer_id=auth.uid() or driver_id=auth.uid() or status='pending' and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='driver') or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
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
 update public.profiles set phone=phone where id=auth.uid();
end $$;
create or replace function public.admin_dashboard_stats() returns json language plpgsql security definer set search_path=public as $$
declare r json;
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception 'No autorizado'; end if;
 select json_build_object('total',(select count(*) from public.orders),'active',(select count(*) from public.orders where status not in ('delivered','cancelled')),'drivers',(select count(*) from public.profiles where role='driver'),'revenue',(select coalesce(sum(amount),0) from public.wallet_transactions where kind='commission')) into r;
 return r;
end $$;
grant execute on function public.create_order(text,text,text,double precision,double precision,double precision,double precision,text) to authenticated;
grant execute on function public.claim_order(uuid) to authenticated;
grant execute on function public.verify_order_start(uuid,text) to authenticated;
grant execute on function public.update_driver_location(double precision,double precision) to authenticated;
grant execute on function public.admin_dashboard_stats() to authenticated;
-- Para producción: completar ubicación de repartidor en tabla separada, notificaciones push,
-- pasarela de recargas y proceso de aprobación de roles antes de abrir el servicio.