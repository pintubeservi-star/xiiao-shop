-- XiiAO Shop: final hardening for the initial database foundation.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

-- Keep user lookups cached once per statement in RLS predicates.
alter policy "profiles read own" on public.profiles
  using (id = (select auth.uid()));
alter policy "profiles update own" on public.profiles
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
alter policy "merchant reads own store" on public.merchants
  using (owner_id = (select auth.uid()));
alter policy "affiliate reads own profile" on public.affiliate_profiles
  using (user_id = (select auth.uid()));
alter policy "affiliate reads own links" on public.affiliate_links
  using (affiliate_id in (
    select id from public.affiliate_profiles where user_id = (select auth.uid())
  ));
alter policy "customer reads own orders" on public.orders
  using (customer_id = (select auth.uid()));
alter policy "affiliate reads attributed orders" on public.orders
  using (affiliate_id in (
    select id from public.affiliate_profiles where user_id = (select auth.uid())
  ));
alter policy "customer reads own order items" on public.order_items
  using (order_id in (
    select id from public.orders where customer_id = (select auth.uid())
  ));
alter policy "affiliate reads own commissions" on public.commissions
  using (affiliate_id in (
    select id from public.affiliate_profiles where user_id = (select auth.uid())
  ));
alter policy "affiliate reads own ledger" on public.ledger_entries
  using (affiliate_id in (
    select id from public.affiliate_profiles where user_id = (select auth.uid())
  ));
alter policy "affiliate reads own payouts" on public.payouts
  using (affiliate_id in (
    select id from public.affiliate_profiles where user_id = (select auth.uid())
  ));

-- Admins may inspect click analytics; no client role may create or alter click events.
create policy "admin reads affiliate clicks" on public.affiliate_clicks
for select to authenticated
using (private.is_admin());
