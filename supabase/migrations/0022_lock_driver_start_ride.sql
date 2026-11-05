-- The driver PIN verifier is an authenticated-only operation.
revoke all on function public.cg_driver_start_ride(uuid, text) from public, anon;
grant execute on function public.cg_driver_start_ride(uuid, text) to authenticated;
