-- Cotuí Go: conductor wallet, manual top-ups and commission reservations.
-- Apply only to the isolated Supabase development branch first.

create table if not exists public.cg_driver_wallets (
  driver_id uuid primary key references public.cg_driver_profiles(id) on delete cascade,
  available_balance_dop numeric(12,2) not null default 0 check (available_balance_dop >= 0),
  reserved_balance_dop numeric(12,2) not null default 0 check (reserved_balance_dop >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cg_wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.cg_driver_profiles(id) on delete restrict,
  entry_type text not null check (entry_type in ('topup_credit','commission_reserved','commission_captured','commission_released','admin_adjustment')),
  available_delta_dop numeric(12,2) not null default 0,
  reserved_delta_dop numeric(12,2) not null default 0,
  reference_type text,
  reference_id uuid,
  description text not null,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists cg_wallet_ledger_driver_created_idx on public.cg_wallet_ledger(driver_id,created_at desc);

create table if not exists public.cg_wallet_topups (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.cg_driver_profiles(id) on delete restrict,
  amount_dop numeric(12,2) not null check (amount_dop >= 100),
  payment_method text not null check (payment_method in ('transferencia','efectivo')),
  payment_reference text,
  driver_note text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists cg_wallet_topups_status_created_idx on public.cg_wallet_topups(status,created_at desc);
create index if not exists cg_wallet_topups_driver_created_idx on public.cg_wallet_topups(driver_id,created_at desc);

insert into public.cg_driver_wallets(driver_id)
select id from public.cg_driver_profiles
on conflict (driver_id) do nothing;

create or replace function public.cg_wallet_ensure_driver()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  insert into public.cg_driver_wallets(driver_id) values(new.id) on conflict do nothing;
  return new;
end; $$;

drop trigger if exists cg_wallet_create_for_driver on public.cg_driver_profiles;
create trigger cg_wallet_create_for_driver after insert on public.cg_driver_profiles
for each row execute function public.cg_wallet_ensure_driver();

alter table public.cg_driver_wallets enable row level security;
alter table public.cg_wallet_ledger enable row level security;
alter table public.cg_wallet_topups enable row level security;

drop policy if exists cg_wallet_driver_read_own on public.cg_driver_wallets;
create policy cg_wallet_driver_read_own on public.cg_driver_wallets for select to authenticated
using (exists(select 1 from public.cg_driver_profiles d where d.id=driver_id and d.user_id=(select auth.uid())) or public.cg_is_admin());
drop policy if exists cg_wallet_ledger_driver_read_own on public.cg_wallet_ledger;
create policy cg_wallet_ledger_driver_read_own on public.cg_wallet_ledger for select to authenticated
using (exists(select 1 from public.cg_driver_profiles d where d.id=driver_id and d.user_id=(select auth.uid())) or public.cg_is_admin());
drop policy if exists cg_wallet_topups_driver_read_own on public.cg_wallet_topups;
create policy cg_wallet_topups_driver_read_own on public.cg_wallet_topups for select to authenticated
using (exists(select 1 from public.cg_driver_profiles d where d.id=driver_id and d.user_id=(select auth.uid())) or public.cg_is_admin());

revoke all on public.cg_driver_wallets,public.cg_wallet_ledger,public.cg_wallet_topups from anon,authenticated;
grant select on public.cg_driver_wallets,public.cg_wallet_ledger,public.cg_wallet_topups to authenticated;

create or replace function public.cg_driver_request_wallet_topup(
  p_amount numeric, p_payment_method text, p_payment_reference text default null, p_driver_note text default null
) returns uuid language plpgsql security definer set search_path=public
as $$
declare v_driver public.cg_driver_profiles%rowtype; v_id uuid;
begin
  select * into v_driver from public.cg_driver_profiles where user_id=auth.uid() and status='approved' for update;
  if v_driver.id is null then raise exception 'Solo los conductores aprobados pueden solicitar recargas.'; end if;
  if p_amount is null or p_amount < 100 or p_amount > 100000 then raise exception 'La recarga debe ser de RD$100 a RD$100,000.'; end if;
  if p_payment_method not in ('transferencia','efectivo') then raise exception 'Método de pago no válido.'; end if;
  insert into public.cg_wallet_topups(driver_id,amount_dop,payment_method,payment_reference,driver_note)
  values(v_driver.id,round(p_amount,2),p_payment_method,nullif(trim(p_payment_reference),''),nullif(trim(p_driver_note),'')) returning id into v_id;
  return v_id;
end; $$;

create or replace function public.cg_admin_review_wallet_topup(
  p_topup_id uuid, p_approve boolean, p_admin_note text default null
) returns jsonb language plpgsql security definer set search_path=public
as $$
declare v_topup public.cg_wallet_topups%rowtype; v_wallet public.cg_driver_wallets%rowtype;
begin
  if not public.cg_is_admin() then raise exception 'No autorizado.'; end if;
  select * into v_topup from public.cg_wallet_topups where id=p_topup_id for update;
  if v_topup.id is null then raise exception 'Solicitud de recarga no encontrada.'; end if;
  if v_topup.status <> 'pending' then raise exception 'Esta solicitud ya fue revisada.'; end if;
  update public.cg_wallet_topups set status=case when p_approve then 'approved' else 'rejected' end,
    admin_note=nullif(trim(p_admin_note),''),reviewed_by=auth.uid(),reviewed_at=now() where id=p_topup_id;
  if p_approve then
    select * into v_wallet from public.cg_driver_wallets where driver_id=v_topup.driver_id for update;
    if v_wallet.driver_id is null then raise exception 'Billetera no encontrada.'; end if;
    update public.cg_driver_wallets set available_balance_dop=available_balance_dop+v_topup.amount_dop,updated_at=now()
      where driver_id=v_topup.driver_id;
    insert into public.cg_wallet_ledger(driver_id,entry_type,available_delta_dop,reference_type,reference_id,description,created_by)
    values(v_topup.driver_id,'topup_credit',v_topup.amount_dop,'topup',v_topup.id,'Recarga aprobada',auth.uid());
  end if;
  return jsonb_build_object('id',p_topup_id,'status',case when p_approve then 'approved' else 'rejected' end);
end; $$;

create or replace function public.cg_wallet_reserve_commission(p_driver_id uuid,p_service_type text,p_service_id uuid,p_commission numeric)
returns void language plpgsql security definer set search_path=public
as $$
declare v_wallet public.cg_driver_wallets%rowtype;
begin
  if p_commission is null or p_commission < 0 then raise exception 'Comisión no válida.'; end if;
  select * into v_wallet from public.cg_driver_wallets where driver_id=p_driver_id for update;
  if v_wallet.driver_id is null then raise exception 'El conductor no tiene billetera activa.'; end if;
  if v_wallet.available_balance_dop < 100 then raise exception 'Tu balance debe ser de al menos RD$100 para aceptar servicios. Recarga tu billetera.'; end if;
  if v_wallet.available_balance_dop < p_commission then raise exception 'Balance insuficiente para reservar la comisión de este servicio.'; end if;
  update public.cg_driver_wallets set available_balance_dop=available_balance_dop-p_commission,
    reserved_balance_dop=reserved_balance_dop+p_commission,updated_at=now() where driver_id=p_driver_id;
  insert into public.cg_wallet_ledger(driver_id,entry_type,available_delta_dop,reserved_delta_dop,reference_type,reference_id,description,created_by)
  values(p_driver_id,'commission_reserved',-p_commission,p_commission,p_service_type,p_service_id,'Comisión reservada al aceptar servicio',auth.uid());
end; $$;

create or replace function public.cg_wallet_finalize_service()
returns trigger language plpgsql security definer set search_path=public
as $$
declare v_driver_id uuid; v_service_type text; v_wallet public.cg_driver_wallets%rowtype; v_reservation record; v_new_status text;
begin
  if tg_table_name='cg_ride_requests' then
    v_driver_id:=coalesce(new.driver_id,old.driver_id); v_service_type:='ride'; v_new_status:=new.status;
  else
    v_driver_id:=coalesce(new.courier_id,old.courier_id); v_service_type:='delivery'; v_new_status:=new.status;
  end if;
  if v_driver_id is null then return new; end if;
  if old.status is distinct from new.status then
    for v_reservation in
      select id,available_delta_dop,reserved_delta_dop,reference_id
      from public.cg_wallet_ledger
      where driver_id=v_driver_id and reference_type=v_service_type and reference_id=new.id
        and entry_type='commission_reserved'
        and not exists(select 1 from public.cg_wallet_ledger x where x.reference_type=v_service_type and x.reference_id=new.id and x.entry_type in ('commission_captured','commission_released'))
      order by created_at desc limit 1
    loop
      select * into v_wallet from public.cg_driver_wallets where driver_id=v_driver_id for update;
      if (tg_table_name='cg_ride_requests' and v_new_status='completed') or (tg_table_name='cg_delivery_requests' and v_new_status='delivered') then
        update public.cg_driver_wallets set reserved_balance_dop=greatest(0,reserved_balance_dop-v_reservation.reserved_delta_dop),updated_at=now() where driver_id=v_driver_id;
        insert into public.cg_wallet_ledger(driver_id,entry_type,reserved_delta_dop,reference_type,reference_id,description)
        values(v_driver_id,'commission_captured',-v_reservation.reserved_delta_dop,v_service_type,new.id,'Comisión cobrada por servicio completado');
      elsif v_new_status='cancelled' then
        update public.cg_driver_wallets set available_balance_dop=available_balance_dop+v_reservation.reserved_delta_dop,
          reserved_balance_dop=greatest(0,reserved_balance_dop-v_reservation.reserved_delta_dop),updated_at=now() where driver_id=v_driver_id;
        insert into public.cg_wallet_ledger(driver_id,entry_type,available_delta_dop,reserved_delta_dop,reference_type,reference_id,description)
        values(v_driver_id,'commission_released',v_reservation.reserved_delta_dop,-v_reservation.reserved_delta_dop,v_service_type,new.id,'Reserva liberada por cancelación');
      end if;
    end loop;
  end if;
  return new;
end; $$;

drop trigger if exists cg_wallet_finalize_ride on public.cg_ride_requests;
create trigger cg_wallet_finalize_ride after update of status on public.cg_ride_requests
for each row execute function public.cg_wallet_finalize_service();
drop trigger if exists cg_wallet_finalize_delivery on public.cg_delivery_requests;
create trigger cg_wallet_finalize_delivery after update of status on public.cg_delivery_requests
for each row execute function public.cg_wallet_finalize_service();

create or replace function public.cg_driver_accept_ride(p_ride_id uuid)
returns jsonb language plpgsql security definer set search_path=public
as $$
declare v_driver public.cg_driver_profiles%rowtype; v_ride public.cg_ride_requests%rowtype; v_commission numeric;
begin
  select * into v_driver from public.cg_driver_profiles where user_id=auth.uid() and status='approved' limit 1 for update;
  if v_driver.id is null then raise exception 'Tu cuenta de conductor aún no está aprobada.'; end if;
  if not v_driver.is_available then raise exception 'Activa tu disponibilidad antes de aceptar servicios.'; end if;
  select * into v_ride from public.cg_ride_requests where id=p_ride_id and status='requested' for update;
  if v_ride.id is null then raise exception 'Este viaje ya fue tomado por otro conductor.'; end if;
  v_commission:=coalesce(v_ride.platform_commission_dop,round(coalesce(v_ride.agreed_fare_dop,v_ride.estimated_fare_dop,0)*coalesce(v_ride.commission_rate_pct,15)/100,2));
  perform public.cg_wallet_reserve_commission(v_driver.id,'ride',v_ride.id,v_commission);
  update public.cg_ride_requests set driver_id=v_driver.id,status='accepted',updated_at=now() where id=p_ride_id returning * into v_ride;
  return jsonb_build_object('id',v_ride.id,'status',v_ride.status,'commission_reserved_dop',v_commission);
end; $$;

create or replace function public.cg_driver_accept_delivery(p_delivery_id uuid)
returns jsonb language plpgsql security definer set search_path=public
as $$
declare v_driver public.cg_driver_profiles%rowtype; v_delivery public.cg_delivery_requests%rowtype; v_commission numeric;
begin
  select * into v_driver from public.cg_driver_profiles where user_id=auth.uid() and status='approved' limit 1 for update;
  if v_driver.id is null then raise exception 'Tu cuenta de conductor aún no está aprobada.'; end if;
  if not v_driver.is_available then raise exception 'Activa tu disponibilidad antes de aceptar servicios.'; end if;
  select * into v_delivery from public.cg_delivery_requests where id=p_delivery_id and status='requested' for update;
  if v_delivery.id is null then raise exception 'Este paquete ya fue tomado por otro conductor.'; end if;
  v_commission:=coalesce(v_delivery.platform_commission_dop,round(coalesce(v_delivery.agreed_fee_dop,v_delivery.estimated_fee_dop,0)*coalesce(v_delivery.commission_rate_pct,15)/100,2));
  perform public.cg_wallet_reserve_commission(v_driver.id,'delivery',v_delivery.id,v_commission);
  update public.cg_delivery_requests set courier_id=v_driver.id,status='accepted',updated_at=now() where id=p_delivery_id returning * into v_delivery;
  return jsonb_build_object('id',v_delivery.id,'status',v_delivery.status,'commission_reserved_dop',v_commission);
end; $$;

revoke all on function public.cg_driver_request_wallet_topup(numeric,text,text,text) from public,anon;
revoke all on function public.cg_admin_review_wallet_topup(uuid,boolean,text) from public,anon;
revoke all on function public.cg_driver_accept_ride(uuid) from public,anon;
revoke all on function public.cg_driver_accept_delivery(uuid) from public,anon;
grant execute on function public.cg_driver_request_wallet_topup(numeric,text,text,text) to authenticated;
grant execute on function public.cg_admin_review_wallet_topup(uuid,boolean,text) to authenticated;
grant execute on function public.cg_driver_accept_ride(uuid) to authenticated;
grant execute on function public.cg_driver_accept_delivery(uuid) to authenticated;
revoke all on function public.cg_wallet_reserve_commission(uuid,text,uuid,numeric) from public,anon,authenticated;
revoke all on function public.cg_wallet_finalize_service() from public,anon,authenticated;
revoke all on function public.cg_wallet_ensure_driver() from public,anon,authenticated;
