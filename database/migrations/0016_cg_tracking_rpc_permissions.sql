-- Restrict driver RPCs and keep broadcast trigger functions out of the public RPC surface.
revoke all on function public.cg_broadcast_driver_trip_location() from public, anon, authenticated;
revoke all on function public.cg_broadcast_trip_status() from public, anon, authenticated;
revoke all on function public.cg_driver_accept_ride(uuid) from public, anon;
revoke all on function public.cg_driver_accept_delivery(uuid) from public, anon;
revoke all on function public.cg_driver_update_ride_status(uuid,text) from public, anon;
revoke all on function public.cg_driver_update_delivery_status(uuid,text) from public, anon;
grant execute on function public.cg_driver_accept_ride(uuid) to authenticated;
grant execute on function public.cg_driver_accept_delivery(uuid) to authenticated;
grant execute on function public.cg_driver_update_ride_status(uuid,text) to authenticated;
grant execute on function public.cg_driver_update_delivery_status(uuid,text) to authenticated;
revoke all on function public.cg_get_public_trip(text) from public;
grant execute on function public.cg_get_public_trip(text) to anon, authenticated;
