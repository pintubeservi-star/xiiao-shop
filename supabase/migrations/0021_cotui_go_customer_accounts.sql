-- Require an authenticated Cotui Go customer for every new ride and delivery.
drop policy if exists "cg rides public request insert" on public.cg_ride_requests;
drop policy if exists "cg deliveries public request insert" on public.cg_delivery_requests;

create policy "cg rides authenticated customer insert"
on public.cg_ride_requests for insert to authenticated
with check (auth.uid() is not null and customer_id = (select auth.uid()));

create policy "cg deliveries authenticated customer insert"
on public.cg_delivery_requests for insert to authenticated
with check (auth.uid() is not null and customer_id = (select auth.uid()));

revoke insert on public.cg_ride_requests from anon, authenticated;
grant insert (
  customer_id, customer_name, customer_phone, pickup_address, destination_address,
  ride_type, passengers, note, pickup_lat, pickup_lng, destination_lat, destination_lng,
  distance_km, pickup_pin_hash
) on public.cg_ride_requests to authenticated;

revoke insert on public.cg_delivery_requests from anon, authenticated;
grant insert (
  customer_id, sender_name, sender_phone, recipient_name, recipient_phone,
  pickup_address, delivery_address, package_type, package_description,
  pickup_lat, pickup_lng, destination_lat, destination_lng, distance_km
) on public.cg_delivery_requests to authenticated;

grant select on public.cg_ride_requests, public.cg_delivery_requests to authenticated;
