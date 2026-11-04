create or replace function public.cg_driver_update_ride_status(p_ride_id uuid,p_status text) returns void language plpgsql security definer set search_path=public as $$
declare v_driver public.cg_driver_profiles%rowtype;
begin
 select * into v_driver from public.cg_driver_profiles where user_id=auth.uid() and status='approved' limit 1;
 if v_driver.id is null then raise exception 'Conductor no autorizado.'; end if;
 if p_status not in ('driver_arriving','in_progress','completed') then raise exception 'Estado no permitido.'; end if;
 update public.cg_ride_requests set status=p_status,updated_at=now() where id=p_ride_id and driver_id=v_driver.id and status in ('accepted','driver_arriving','in_progress');
 if not found then raise exception 'No se pudo actualizar este viaje.'; end if;
end; $$;
create or replace function public.cg_driver_update_delivery_status(p_delivery_id uuid,p_status text) returns void language plpgsql security definer set search_path=public as $$
declare v_driver public.cg_driver_profiles%rowtype;
begin
 select * into v_driver from public.cg_driver_profiles where user_id=auth.uid() and status='approved' limit 1;
 if v_driver.id is null then raise exception 'Conductor no autorizado.'; end if;
 if p_status not in ('picked_up','on_the_way','delivered') then raise exception 'Estado no permitido.'; end if;
 update public.cg_delivery_requests set status=p_status,updated_at=now() where id=p_delivery_id and courier_id=v_driver.id and status in ('accepted','picked_up','on_the_way');
 if not found then raise exception 'No se pudo actualizar este paquete.'; end if;
end; $$;
revoke all on function public.cg_driver_update_ride_status(uuid,text) from public; revoke all on function public.cg_driver_update_delivery_status(uuid,text) from public;
grant execute on function public.cg_driver_update_ride_status(uuid,text) to authenticated; grant execute on function public.cg_driver_update_delivery_status(uuid,text) to authenticated;