create table if not exists public.cg_push_private_config (
  id smallint primary key check (id = 1),
  push_secret text not null
);
alter table public.cg_push_private_config enable row level security;
revoke all on public.cg_push_private_config from public, anon, authenticated;

create or replace function public.cg_get_available_driver_push_targets(
  p_delivery_id uuid,
  p_secret text
)
returns table(subscription_id uuid, subscription jsonb, service_kind text, pickup_address text, estimated_fee_dop numeric)
language plpgsql
security definer
set search_path=public
as $$
begin
  if auth.uid() is null then raise exception 'No autorizado'; end if;
  if not exists(select 1 from public.cg_push_private_config where id=1 and push_secret=p_secret) then
    raise exception 'No autorizado';
  end if;
  return query
    select s.id, s.subscription, d.service_kind, d.pickup_address, d.estimated_fee_dop
    from public.cg_delivery_requests d
    join public.cg_driver_profiles p on p.status='approved' and p.is_available=true
    join public.cg_driver_push_subscriptions s on s.user_id=p.user_id
    where d.id=p_delivery_id and d.status='requested';
end;
$$;
revoke all on function public.cg_get_available_driver_push_targets(uuid,text) from public, anon;
grant execute on function public.cg_get_available_driver_push_targets(uuid,text) to authenticated;
