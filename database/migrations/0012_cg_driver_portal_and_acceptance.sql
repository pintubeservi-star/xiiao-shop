-- Cotui Go driver self-service and secure job acceptance
alter table public.cg_driver_profiles add column if not exists current_lat double precision, add column if not exists current_lng double precision, add column if not exists last_location_at timestamptz;
drop policy if exists "cg drivers register own profile" on public.cg_driver_profiles;
create policy "cg drivers register own profile" on public.cg_driver_profiles for insert to authenticated with check (user_id=auth.uid() and status='pending' and is_available=false);
drop policy if exists "cg drivers update own profile" on public.cg_driver_profiles;
create policy "cg drivers update own profile" on public.cg_driver_profiles for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "cg drivers view open rides" on public.cg_ride_requests;
create policy "cg drivers view open rides" on public.cg_ride_requests for select to authenticated using (status='requested' and exists(select 1 from public.cg_driver_profiles d where d.user_id=auth.uid() and d.status='approved'));
drop policy if exists "cg drivers view open deliveries" on public.cg_delivery_requests;
create policy "cg drivers view open deliveries" on public.cg_delivery_requests for select to authenticated using (status='requested' and exists(select 1 from public.cg_driver_profiles d where d.user_id=auth.uid() and d.status='approved'));
drop policy if exists "cg drivers add own vehicle" on public.cg_vehicles;
create policy "cg drivers add own vehicle" on public.cg_vehicles for insert to authenticated with check (exists(select 1 from public.cg_driver_profiles d where d.id=driver_id and d.user_id=auth.uid() and d.status='pending'));
create or replace function public.cg_driver_accept_ride(p_ride_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_driver public.cg_driver_profiles%rowtype; v_ride public.cg_ride_requests%rowtype;
begin
 select * into v_driver from public.cg_driver_profiles where user_id=auth.uid() and status='approved' limit 1;
 if v_driver.id is null then raise exception 'Tu cuenta de conductor aún no está aprobada.'; end if;
 if not v_driver.is_available then raise exception 'Activa tu disponibilidad antes de aceptar servicios.'; end if;
 update public.cg_ride_requests set driver_id=v_driver.id,status='accepted',updated_at=now() where id=p_ride_id and status='requested' returning * into v_ride;
 if v_ride.id is null then raise exception 'Este viaje ya fue tomado por otro conductor.'; end if;
 return jsonb_build_object('id',v_ride.id,'status',v_ride.status);
end; $$;
create or replace function public.cg_driver_accept_delivery(p_delivery_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_driver public.cg_driver_profiles%rowtype; v_delivery public.cg_delivery_requests%rowtype;
begin
 select * into v_driver from public.cg_driver_profiles where user_id=auth.uid() and status='approved' limit 1;
 if v_driver.id is null then raise exception 'Tu cuenta de conductor aún no está aprobada.'; end if;
 if not v_driver.is_available then raise exception 'Activa tu disponibilidad antes de aceptar servicios.'; end if;
 update public.cg_delivery_requests set courier_id=v_driver.id,status='accepted',updated_at=now() where id=p_delivery_id and status='requested' returning * into v_delivery;
 if v_delivery.id is null then raise exception 'Este paquete ya fue tomado por otro conductor.'; end if;
 return jsonb_build_object('id',v_delivery.id,'status',v_delivery.status);
end; $$;
revoke all on function public.cg_driver_accept_ride(uuid) from public; revoke all on function public.cg_driver_accept_delivery(uuid) from public;
grant execute on function public.cg_driver_accept_ride(uuid) to authenticated; grant execute on function public.cg_driver_accept_delivery(uuid) to authenticated;