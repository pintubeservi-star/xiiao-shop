create table if not exists public.cg_pricing_settings (
  id boolean primary key default true check (id),
  moto_base_dop numeric(10,2) not null default 60,
  moto_per_km_dop numeric(10,2) not null default 25,
  moto_minimum_dop numeric(10,2) not null default 100,
  package_base_dop numeric(10,2) not null default 70,
  package_per_km_dop numeric(10,2) not null default 28,
  package_minimum_dop numeric(10,2) not null default 120,
  route_multiplier numeric(5,3) not null default 1.250 check (route_multiplier >= 1 and route_multiplier <= 2),
  platform_commission_pct numeric(5,2) not null default 15.00 check (platform_commission_pct >= 0 and platform_commission_pct <= 40),
  updated_at timestamptz not null default now()
);
insert into public.cg_pricing_settings(id) values (true) on conflict (id) do nothing;

alter table public.cg_ride_requests
  add column if not exists distance_km numeric(8,2),
  add column if not exists platform_commission_dop numeric(10,2),
  add column if not exists driver_payout_dop numeric(10,2),
  add column if not exists commission_rate_pct numeric(5,2);
alter table public.cg_delivery_requests
  add column if not exists distance_km numeric(8,2),
  add column if not exists platform_commission_dop numeric(10,2),
  add column if not exists driver_payout_dop numeric(10,2),
  add column if not exists commission_rate_pct numeric(5,2);

alter table public.cg_pricing_settings enable row level security;
drop policy if exists "Public can read Cotui Go pricing" on public.cg_pricing_settings;
create policy "Public can read Cotui Go pricing" on public.cg_pricing_settings for select to anon, authenticated using (true);
drop policy if exists "Admins manage Cotui Go pricing" on public.cg_pricing_settings;
create policy "Admins manage Cotui Go pricing" on public.cg_pricing_settings for all to authenticated using (public.cg_is_admin()) with check (public.cg_is_admin());
grant select on public.cg_pricing_settings to anon, authenticated;
grant update on public.cg_pricing_settings to authenticated;

create or replace function public.cg_quote_fare(
  p_service text, p_pickup_lat double precision, p_pickup_lng double precision,
  p_destination_lat double precision, p_destination_lng double precision
) returns jsonb
language plpgsql stable security invoker set search_path = public
as $$
declare cfg public.cg_pricing_settings%rowtype;
        straight_km numeric; road_km numeric; base numeric; per_km numeric; minimum numeric;
        fare numeric; commission numeric; payout numeric;
begin
  if p_service not in ('moto','package') then raise exception 'Tipo de servicio no válido'; end if;
  if p_pickup_lat is null or p_pickup_lng is null or p_destination_lat is null or p_destination_lng is null then
    raise exception 'Selecciona la recogida y el destino en el mapa para calcular la tarifa';
  end if;
  select * into cfg from public.cg_pricing_settings where id = true;
  if not found then raise exception 'No hay tarifas configuradas'; end if;
  straight_km := 6371 * 2 * asin(sqrt(
    power(sin(radians(p_destination_lat-p_pickup_lat)/2),2) +
    cos(radians(p_pickup_lat))*cos(radians(p_destination_lat))*
    power(sin(radians(p_destination_lng-p_pickup_lng)/2),2)
  ));
  road_km := greatest(0.5, straight_km * cfg.route_multiplier);
  if p_service = 'moto' then
    base := cfg.moto_base_dop; per_km := cfg.moto_per_km_dop; minimum := cfg.moto_minimum_dop;
  else
    base := cfg.package_base_dop; per_km := cfg.package_per_km_dop; minimum := cfg.package_minimum_dop;
  end if;
  fare := greatest(minimum, ceil(base + road_km * per_km));
  commission := round(fare * cfg.platform_commission_pct / 100, 2);
  payout := fare - commission;
  return jsonb_build_object('service',p_service,'distance_km',round(road_km,2),'fare_dop',fare,
    'commission_pct',cfg.platform_commission_pct,'commission_dop',commission,'driver_payout_dop',payout,
    'currency','DOP','distance_method','estimated_road_distance');
end;
$$;
grant execute on function public.cg_quote_fare(text,double precision,double precision,double precision,double precision) to anon, authenticated;

create or replace function public.cg_set_request_fare_breakdown()
returns trigger language plpgsql security definer set search_path = public
as $$
declare q jsonb; service_kind text;
begin
  if tg_table_name = 'cg_ride_requests' then service_kind := 'moto'; else service_kind := 'package'; end if;
  if new.pickup_lat is not null and new.pickup_lng is not null and new.destination_lat is not null and new.destination_lng is not null then
    q := public.cg_quote_fare(service_kind,new.pickup_lat,new.pickup_lng,new.destination_lat,new.destination_lng);
    new.distance_km := (q->>'distance_km')::numeric;
    if tg_table_name = 'cg_ride_requests' then
      new.estimated_fare_dop := (q->>'fare_dop')::numeric;
    else
      new.estimated_fee_dop := (q->>'fare_dop')::numeric;
    end if;
    new.commission_rate_pct := (q->>'commission_pct')::numeric;
    new.platform_commission_dop := (q->>'commission_dop')::numeric;
    new.driver_payout_dop := (q->>'driver_payout_dop')::numeric;
  end if;
  return new;
end;
$$;
revoke all on function public.cg_set_request_fare_breakdown() from public, anon, authenticated;

drop trigger if exists cg_ride_price_breakdown on public.cg_ride_requests;
create trigger cg_ride_price_breakdown before insert or update of pickup_lat,pickup_lng,destination_lat,destination_lng on public.cg_ride_requests for each row execute function public.cg_set_request_fare_breakdown();
drop trigger if exists cg_delivery_price_breakdown on public.cg_delivery_requests;
create trigger cg_delivery_price_breakdown before insert or update of pickup_lat,pickup_lng,destination_lat,destination_lng on public.cg_delivery_requests for each row execute function public.cg_set_request_fare_breakdown();

create or replace function public.cg_get_pricing_settings()
returns jsonb language sql stable security invoker set search_path=public
as $$
 select to_jsonb(p) - 'id' from public.cg_pricing_settings p where id=true
$$;
grant execute on function public.cg_get_pricing_settings() to anon, authenticated;

create or replace function public.cg_admin_update_pricing_settings(
 p_moto_base numeric, p_moto_per_km numeric, p_moto_min numeric,
 p_package_base numeric, p_package_per_km numeric, p_package_min numeric,
 p_commission numeric
) returns jsonb language plpgsql security definer set search_path=public
as $$
declare outrow public.cg_pricing_settings%rowtype;
begin
 if not public.cg_is_admin() then raise exception 'No autorizado'; end if;
 if least(p_moto_base,p_moto_per_km,p_moto_min,p_package_base,p_package_per_km,p_package_min) < 0
   or p_commission < 0 or p_commission > 40 then raise exception 'Valores de tarifa no válidos'; end if;
 update public.cg_pricing_settings set moto_base_dop=p_moto_base,moto_per_km_dop=p_moto_per_km,moto_minimum_dop=p_moto_min,
 package_base_dop=p_package_base,package_per_km_dop=p_package_per_km,package_minimum_dop=p_package_min,
 platform_commission_pct=p_commission,updated_at=now() where id=true returning * into outrow;
 return to_jsonb(outrow)-'id';
end;
$$;
revoke all on function public.cg_admin_update_pricing_settings(numeric,numeric,numeric,numeric,numeric,numeric,numeric) from public, anon;
grant execute on function public.cg_admin_update_pricing_settings(numeric,numeric,numeric,numeric,numeric,numeric,numeric) to authenticated;
