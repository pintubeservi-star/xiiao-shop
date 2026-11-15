create table if not exists public.cg_driver_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cg_driver_push_subscriptions_user_idx on public.cg_driver_push_subscriptions(user_id);
alter table public.cg_driver_push_subscriptions enable row level security;
drop policy if exists "Drivers manage their own push subscriptions" on public.cg_driver_push_subscriptions;
create policy "Drivers manage their own push subscriptions"
on public.cg_driver_push_subscriptions for all to authenticated
using (auth.uid()=user_id) with check (auth.uid()=user_id);
grant select,insert,update,delete on public.cg_driver_push_subscriptions to authenticated;
