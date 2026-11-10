-- Permite aceptar servicios con el saldo mínimo inicial de RD$100.
-- La comisión se reserva al aceptar; no se exige mantener RD$100 adicionales después.
create or replace function public.cg_wallet_reserve_commission(p_driver_id uuid, p_service_type text, p_service_id uuid, p_commission numeric)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_wallet public.cg_driver_wallets%rowtype;
begin
  if p_commission is null or p_commission < 0 then
    raise exception 'Comisión no válida.';
  end if;
  select * into v_wallet
  from public.cg_driver_wallets
  where driver_id=p_driver_id
  for update;
  if v_wallet.driver_id is null then
    raise exception 'El conductor no tiene billetera activa.';
  end if;
  if v_wallet.available_balance_dop < 100 then
    raise exception 'Tu balance debe ser de al menos RD$100 para aceptar servicios. Recarga tu billetera.';
  end if;
  if v_wallet.available_balance_dop < p_commission then
    raise exception 'Tu balance no cubre la comisión de este servicio. Recarga tu billetera.';
  end if;
  update public.cg_driver_wallets
  set available_balance_dop=available_balance_dop-p_commission,
      reserved_balance_dop=reserved_balance_dop+p_commission,
      updated_at=now()
  where driver_id=p_driver_id;
  insert into public.cg_wallet_ledger(driver_id,entry_type,available_delta_dop,reserved_delta_dop,reference_type,reference_id,description,created_by)
  values(p_driver_id,'commission_reserved',-p_commission,p_commission,p_service_type,p_service_id,'Comisión reservada al aceptar servicio',auth.uid());
end;
$function$;