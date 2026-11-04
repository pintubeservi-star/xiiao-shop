-- Let drivers read only open requests and services assigned to their own profile.
drop policy if exists "cg drivers view open rides" on public.cg_ride_requests;
create policy "cg drivers view open rides and assigned rides"
on public.cg_ride_requests for select to authenticated
using (
  (status='requested' and exists(
    select 1 from public.cg_driver_profiles d
    where d.user_id=(select auth.uid()) and d.status='approved'
  ))
  or exists(
    select 1 from public.cg_driver_profiles d
    where d.id=driver_id and d.user_id=(select auth.uid())
  )
);
drop policy if exists "cg drivers view open deliveries" on public.cg_delivery_requests;
create policy "cg drivers view open and assigned deliveries"
on public.cg_delivery_requests for select to authenticated
using (
  (status='requested' and exists(
    select 1 from public.cg_driver_profiles d
    where d.user_id=(select auth.uid()) and d.status='approved'
  ))
  or exists(
    select 1 from public.cg_driver_profiles d
    where d.id=courier_id and d.user_id=(select auth.uid())
  )
);
