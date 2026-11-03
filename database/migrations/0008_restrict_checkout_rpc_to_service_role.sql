-- Checkout is callable only through the server-side Edge Function.
revoke all on function public.create_guest_order(text,text,jsonb,jsonb,numeric) from public, anon, authenticated;
grant execute on function public.create_guest_order(text,text,jsonb,jsonb,numeric) to service_role;
