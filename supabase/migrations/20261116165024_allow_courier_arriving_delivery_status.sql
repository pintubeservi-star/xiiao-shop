alter table public.cg_delivery_requests
  drop constraint if exists cg_delivery_requests_status_check;
alter table public.cg_delivery_requests
  add constraint cg_delivery_requests_status_check
  check (status = any (array[
    'requested'::text,
    'accepted'::text,
    'courier_arriving'::text,
    'picked_up'::text,
    'on_the_way'::text,
    'delivered'::text,
    'cancelled'::text
  ]));
