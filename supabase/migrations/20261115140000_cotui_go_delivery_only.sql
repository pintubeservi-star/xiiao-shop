-- Cotuí Go: delivery-only operations. Disable passenger trips and all driver wallet/top-up enforcement.
alter table public.cg_delivery_requests
  add column if not exists service_kind text not null default 'package';

alter table public.cg_delivery_requests
  drop constraint if exists cg_delivery_requests_service_kind_check;
alter table public.cg_delivery_requests
  add constraint cg_delivery_requests_service_kind_check
  check (service_kind in ('food','package'));

create index if not exists cg_delivery_requests_service_kind_status_created_idx
  on public.cg_delivery_requests(service_kind,status,created_at desc);

-- No passenger trips are accepted on the delivery platform.
create or replace function public.cg_driver_accept_ride(p_ride_id uuid)
returns jsonb language plpgsql security definer set search_path=public
as $$
begin
  raise exception 'Cotuí Go ahora ofrece únicamente entregas de comida y paquetes.';
end;
$$;
revoke all on function public.cg_driver_accept_ride(uuid) from public, anon;
grant execute on function public.cg_driver_accept_ride(uuid) to authenticated;

-- A courier can accept an available delivery without a prepaid balance or wallet reservation.
create or replace function public.cg_driver_accept_delivery(p_delivery_id uuid)
returns jsonb language plpgsql security definer set search_path=public
as $$
declare
  v_driver public.cg_driver_profiles%rowtype;
  v_delivery public.cg_delivery_requests%rowtype;
begin
  select * into v_driver
  from public.cg_driver_profiles
  where user_id=auth.uid() and status='approved'
  limit 1 for update;
  if v_driver.id is null then raise exception 'Tu cuenta de repartidor aún no está aprobada.'; end if;
  if not v_driver.is_available then raise exception 'Activa tu disponibilidad antes de aceptar entregas.'; end if;

  update public.cg_delivery_requests
    set courier_id=v_driver.id,status='accepted',updated_at=now()
    where id=p_delivery_id and status='requested'
    returning * into v_delivery;
  if v_delivery.id is null then raise exception 'Esta entrega ya fue asignada a otro repartidor.'; end if;

  return jsonb_build_object(
    'id',v_delivery.id,'status',v_delivery.status,
    'service_kind',v_delivery.service_kind,
    'tracking_token',v_delivery.tracking_token
  );
end;
$$;
revoke all on function public.cg_driver_accept_delivery(uuid) from public, anon;
grant execute on function public.cg_driver_accept_delivery(uuid) to authenticated;

-- Remove all wallet/top-up automation from the active workflow while retaining legacy
-- ledger rows for audit/history. No trigger may block or debit a courier's delivery.
drop trigger if exists cg_wallet_finalize_ride on public.cg_ride_requests;
drop trigger if exists cg_wallet_finalize_delivery on public.cg_delivery_requests;
drop trigger if exists cg_wallet_create_for_driver on public.cg_driver_profiles;

revoke all on function public.cg_driver_request_wallet_topup(numeric,text,text,text) from public,anon,authenticated;
revoke all on function public.cg_admin_review_wallet_topup(uuid,boolean,text) from public,anon,authenticated;
revoke all on function public.cg_wallet_reserve_commission(uuid,text,uuid,numeric) from public,anon,authenticated;

drop function if exists public.cg_wallet_finalize_service();
drop function if exists public.cg_wallet_reserve_commission(uuid,text,uuid,numeric);
drop function if exists public.cg_driver_request_wallet_topup(numeric,text,text,text);
drop function if exists public.cg_admin_review_wallet_topup(uuid,boolean,text);
drop function if exists public.cg_wallet_ensure_driver();

-- Keep the fare quote as a delivery fee, not a passenger fare.
comment on column public.cg_delivery_requests.service_kind is
  'Cotuí Go service category: food delivery or parcel delivery.';
