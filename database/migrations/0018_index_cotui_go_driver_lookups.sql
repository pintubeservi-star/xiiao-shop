-- Index driver foreign keys used by driver job/profile lookups.
create index if not exists cg_delivery_requests_courier_id_idx on public.cg_delivery_requests(courier_id);
create index if not exists cg_vehicles_driver_id_idx on public.cg_vehicles(driver_id);