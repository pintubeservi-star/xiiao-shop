-- Consolidate permissive SELECT policies while preserving row ownership and admin access.
-- Profiles
drop policy if exists "profiles read own" on public.profiles;
drop policy if exists "admin reads all profiles" on public.profiles;
create policy "profiles read own or admin" on public.profiles for select to authenticated
using (id = (select auth.uid()) or private.is_admin());

-- Products
drop policy if exists "active products public read" on public.products;
drop policy if exists "admin manages products" on public.products;
create policy "public reads published products" on public.products for select to anon using (status = 'published');
create policy "published products or admin" on public.products for select to authenticated
using (status = 'published' or private.is_admin());
create policy "admin inserts products" on public.products for insert to authenticated with check (private.is_admin());
create policy "admin updates products" on public.products for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "admin deletes products" on public.products for delete to authenticated using (private.is_admin());

-- Categories
drop policy if exists "public reads active categories" on public.categories;
drop policy if exists "admin manages categories" on public.categories;
create policy "anon reads active categories" on public.categories for select to anon using (is_active = true);
create policy "active categories or admin" on public.categories for select to authenticated
using (is_active = true or private.is_admin());
create policy "admin inserts categories" on public.categories for insert to authenticated with check (private.is_admin());
create policy "admin updates categories" on public.categories for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "admin deletes categories" on public.categories for delete to authenticated using (private.is_admin());

-- Merchants
drop policy if exists "merchant reads own store" on public.merchants;
drop policy if exists "admin manages merchants" on public.merchants;
create policy "merchant or admin reads stores" on public.merchants for select to authenticated
using (owner_id = (select auth.uid()) or private.is_admin());
create policy "admin inserts merchants" on public.merchants for insert to authenticated with check (private.is_admin());
create policy "admin updates merchants" on public.merchants for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "admin deletes merchants" on public.merchants for delete to authenticated using (private.is_admin());

-- Affiliate profiles and links
drop policy if exists "affiliate reads own profile" on public.affiliate_profiles;
drop policy if exists "admin manages affiliates" on public.affiliate_profiles;
create policy "affiliate or admin reads profiles" on public.affiliate_profiles for select to authenticated
using (user_id = (select auth.uid()) or private.is_admin());
create policy "admin inserts affiliate profiles" on public.affiliate_profiles for insert to authenticated with check (private.is_admin());
create policy "admin updates affiliate profiles" on public.affiliate_profiles for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "admin deletes affiliate profiles" on public.affiliate_profiles for delete to authenticated using (private.is_admin());

drop policy if exists "affiliate reads own links" on public.affiliate_links;
drop policy if exists "admin reads all affiliate links" on public.affiliate_links;
create policy "affiliate or admin reads links" on public.affiliate_links for select to authenticated
using (affiliate_id in (select id from public.affiliate_profiles where user_id = (select auth.uid())) or private.is_admin());

-- Orders
drop policy if exists "customer reads own orders" on public.orders;
drop policy if exists "affiliate reads attributed orders" on public.orders;
drop policy if exists "admin manages orders" on public.orders;
create policy "customer affiliate or admin reads orders" on public.orders for select to authenticated
using (
 customer_id = (select auth.uid())
 or affiliate_id in (select id from public.affiliate_profiles where user_id = (select auth.uid()))
 or private.is_admin()
);
create policy "admin inserts orders" on public.orders for insert to authenticated with check (private.is_admin());
create policy "admin updates orders" on public.orders for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "admin deletes orders" on public.orders for delete to authenticated using (private.is_admin());

-- Order items
drop policy if exists "customer reads own order items" on public.order_items;
drop policy if exists "admin manages order items" on public.order_items;
create policy "customer or admin reads order items" on public.order_items for select to authenticated
using (order_id in (select id from public.orders where customer_id = (select auth.uid())) or private.is_admin());
create policy "admin inserts order items" on public.order_items for insert to authenticated with check (private.is_admin());
create policy "admin updates order items" on public.order_items for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "admin deletes order items" on public.order_items for delete to authenticated using (private.is_admin());

-- Commissions
drop policy if exists "affiliate reads own commissions" on public.commissions;
drop policy if exists "admin manages commissions" on public.commissions;
create policy "affiliate or admin reads commissions" on public.commissions for select to authenticated
using (affiliate_id in (select id from public.affiliate_profiles where user_id = (select auth.uid())) or private.is_admin());
create policy "admin inserts commissions" on public.commissions for insert to authenticated with check (private.is_admin());
create policy "admin updates commissions" on public.commissions for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "admin deletes commissions" on public.commissions for delete to authenticated using (private.is_admin());

-- Ledger is read-only to end users; financial entries are written by trusted functions only.
drop policy if exists "affiliate reads own ledger" on public.ledger_entries;
drop policy if exists "admin reads all ledger entries" on public.ledger_entries;
create policy "affiliate or admin reads ledger" on public.ledger_entries for select to authenticated
using (affiliate_id in (select id from public.affiliate_profiles where user_id = (select auth.uid())) or private.is_admin());

-- Payouts
drop policy if exists "affiliate reads own payouts" on public.payouts;
drop policy if exists "admin manages payouts" on public.payouts;
create policy "affiliate or admin reads payouts" on public.payouts for select to authenticated
using (affiliate_id in (select id from public.affiliate_profiles where user_id = (select auth.uid())) or private.is_admin());
create policy "admin inserts payouts" on public.payouts for insert to authenticated with check (private.is_admin());
create policy "admin updates payouts" on public.payouts for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "admin deletes payouts" on public.payouts for delete to authenticated using (private.is_admin());

-- Store settings
drop policy if exists "public reads public store settings" on public.store_settings;
drop policy if exists "admin manages store settings" on public.store_settings;
create policy "anon reads public store settings" on public.store_settings for select to anon
using (key in ('storefront','shipping_public','promotions_public'));
create policy "public settings or admin" on public.store_settings for select to authenticated
using (key in ('storefront','shipping_public','promotions_public') or private.is_admin());
create policy "admin inserts store settings" on public.store_settings for insert to authenticated with check (private.is_admin());
create policy "admin updates store settings" on public.store_settings for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "admin deletes store settings" on public.store_settings for delete to authenticated using (private.is_admin());

-- Cover all foreign-key columns flagged by the database advisor.
create index if not exists affiliate_links_product_id_idx on public.affiliate_links(product_id);
create index if not exists audit_logs_actor_id_idx on public.audit_logs(actor_id);
create index if not exists ledger_entries_commission_id_idx on public.ledger_entries(commission_id);
create index if not exists ledger_entries_payout_id_idx on public.ledger_entries(payout_id);
create index if not exists merchants_owner_id_idx on public.merchants(owner_id);
create index if not exists order_items_merchant_id_idx on public.order_items(merchant_id);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists order_items_product_id_idx on public.order_items(product_id);
create index if not exists orders_affiliate_link_id_idx on public.orders(affiliate_link_id);
create index if not exists payouts_affiliate_id_idx on public.payouts(affiliate_id);
create index if not exists payouts_reviewed_by_idx on public.payouts(reviewed_by);
create index if not exists products_created_by_idx on public.products(created_by);
create index if not exists store_settings_updated_by_idx on public.store_settings(updated_by);
