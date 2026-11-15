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
    where d.id=p_delivery_id and d.status='requested'
    order by
      case when p.current_lat is null or p.current_lng is null or d.pickup_lat is null or d.pickup_lng is null then 1 else 0 end,
      case when p.current_lat is null or p.current_lng is null or d.pickup_lat is null or d.pickup_lng is null then 999999
      else 6371 * 2 * asin(sqrt(
        power(sin(radians(d.pickup_lat-p.current_lat)/2),2)
        + cos(radians(p.current_lat))*cos(radians(d.pickup_lat))
        * power(sin(radians(d.pickup_lng-p.current_lng)/2),2)
      )) end
    limit 8;
end;
$$;