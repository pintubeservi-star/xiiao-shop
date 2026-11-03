-- XiiAO Shop: admin operations, categories, store settings and product image storage.
-- Apply after 0001_initial_schema.sql in the Supabase SQL Editor.
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Admin-only management policies. Public product reads remain limited to published items.
drop policy if exists "admin manages products" on public.products;
create policy "admin manages products" on public.products
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin manages categories" on public.categories;
alter table public.categories enable row level security;
create policy "public reads active categories" on public.categories
for select to anon, authenticated using (is_active = true);
create policy "admin manages categories" on public.categories
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin reads all profiles" on public.profiles;
create policy "admin reads all profiles" on public.profiles
for select to authenticated using (public.is_admin());

drop policy if exists "admin manages merchants" on public.merchants;
create policy "admin manages merchants" on public.merchants
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin manages affiliates" on public.affiliate_profiles;
create policy "admin manages affiliates" on public.affiliate_profiles
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin manages orders" on public.orders;
create policy "admin manages orders" on public.orders
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin manages order items" on public.order_items;
create policy "admin manages order items" on public.order_items
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin manages commissions" on public.commissions;
create policy "admin manages commissions" on public.commissions
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin manages payouts" on public.payouts;
create policy "admin manages payouts" on public.payouts
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin reads audit logs" on public.audit_logs;
create policy "admin reads audit logs" on public.audit_logs
for select to authenticated using (public.is_admin());

drop policy if exists "admin reads all affiliate links" on public.affiliate_links;
create policy "admin reads all affiliate links" on public.affiliate_links
for select to authenticated using (public.is_admin());

drop policy if exists "admin reads all ledger entries" on public.ledger_entries;
create policy "admin reads all ledger entries" on public.ledger_entries
for select to authenticated using (public.is_admin());

drop policy if exists "admin manages store settings" on public.store_settings;
alter table public.store_settings enable row level security;
create policy "public reads public store settings" on public.store_settings
for select to anon, authenticated using (key in ('storefront','shipping_public','promotions_public'));
create policy "admin manages store settings" on public.store_settings
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Public product photos; only authenticated administrators can upload or remove files.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/avif'];

drop policy if exists "public reads product images" on storage.objects;
create policy "public reads product images" on storage.objects
for select to anon, authenticated using (bucket_id = 'product-images');
drop policy if exists "admin uploads product images" on storage.objects;
create policy "admin uploads product images" on storage.objects
for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "admin updates product images" on storage.objects;
create policy "admin updates product images" on storage.objects
for update to authenticated using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "admin deletes product images" on storage.objects;
create policy "admin deletes product images" on storage.objects
for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());

create index if not exists categories_active_order_idx on public.categories(is_active, sort_order);
create trigger categories_updated_at before update on public.categories
for each row execute function public.set_updated_at();
