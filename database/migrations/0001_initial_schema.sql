-- XiiAO Shop: initial relational model for Supabase/PostgreSQL.
-- Financial and attribution writes must be performed by trusted server code (service role).
create extension if not exists pgcrypto;

create type public.app_role as enum ('customer', 'affiliate', 'merchant', 'admin');
create type public.product_status as enum ('draft', 'published', 'paused', 'archived');
create type public.order_status as enum ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded');
create type public.commission_status as enum ('calculated', 'pending_validation', 'available', 'paid', 'reversed');
create type public.payout_status as enum ('requested', 'under_review', 'approved', 'paid', 'rejected');

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role public.app_role not null default 'customer',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.merchants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  store_name text not null,
  slug text not null unique,
  description text,
  status text not null default 'pending' check (status in ('pending','active','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.affiliate_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id),
  public_code text not null unique,
  bio text,
  status text not null default 'pending' check (status in ('pending','active','suspended')),
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid references public.merchants(id),
  created_by uuid not null references public.profiles(id),
  name text not null,
  slug text not null unique,
  description text,
  category text not null default 'General',
  price_dop numeric(12,2) not null check (price_dop >= 0),
  compare_at_price_dop numeric(12,2) check (compare_at_price_dop is null or compare_at_price_dop >= price_dop),
  stock integer not null default 0 check (stock >= 0),
  image_urls text[] not null default '{}',
  video_url text,
  status public.product_status not null default 'draft',
  commission_type text not null default 'fixed' check (commission_type in ('fixed','percentage')),
  commission_value numeric(12,2) not null default 0 check (commission_value >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.affiliate_links (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliate_profiles(id),
  product_id uuid not null references public.products(id),
  code text not null unique,
  created_at timestamptz not null default now(),
  unique (affiliate_id, product_id)
);

-- Click events are written by a server endpoint to prevent forged attribution.
create table public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  affiliate_link_id uuid not null references public.affiliate_links(id),
  visitor_key text not null,
  clicked_at timestamptz not null default now(),
  landing_path text,
  user_agent_hash text
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  customer_id uuid references public.profiles(id),
  customer_name text not null,
  customer_phone text not null,
  shipping_address jsonb not null,
  payment_method text not null check (payment_method in ('cash_on_delivery','card','bank_transfer','wallet')),
  status public.order_status not null default 'pending',
  subtotal_dop numeric(12,2) not null check (subtotal_dop >= 0),
  shipping_dop numeric(12,2) not null default 0 check (shipping_dop >= 0),
  total_dop numeric(12,2) not null check (total_dop >= 0),
  affiliate_id uuid references public.affiliate_profiles(id),
  affiliate_link_id uuid references public.affiliate_links(id),
  attribution_code text,
  delivered_at timestamptz,
  payment_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  product_id uuid not null references public.products(id),
  merchant_id uuid references public.merchants(id),
  product_name_snapshot text not null,
  quantity integer not null check (quantity > 0),
  unit_price_dop numeric(12,2) not null check (unit_price_dop >= 0),
  commission_type_snapshot text not null,
  commission_value_snapshot numeric(12,2) not null check (commission_value_snapshot >= 0),
  line_total_dop numeric(12,2) not null check (line_total_dop >= 0)
);

create table public.commissions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliate_profiles(id),
  order_item_id uuid not null unique references public.order_items(id),
  amount_dop numeric(12,2) not null check (amount_dop >= 0),
  status public.commission_status not null default 'calculated',
  eligible_at timestamptz,
  released_at timestamptz,
  reversal_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Append-only financial ledger. Never expose UPDATE/DELETE to application users.
create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliate_profiles(id),
  commission_id uuid references public.commissions(id),
  payout_id uuid,
  entry_type text not null check (entry_type in ('commission_pending','commission_available','commission_paid','commission_reversal','payout_debit','payout_refund','adjustment')),
  amount_dop numeric(12,2) not null,
  reference_key text not null unique,
  note text,
  created_at timestamptz not null default now()
);

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliate_profiles(id),
  amount_dop numeric(12,2) not null check (amount_dop > 0),
  method text not null check (method in ('bank_transfer','mobile_wallet')),
  destination jsonb not null,
  status public.payout_status not null default 'requested',
  reviewed_by uuid references public.profiles(id),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ledger_entries add constraint ledger_payout_fk foreign key (payout_id) references public.payouts(id);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index products_status_category_idx on public.products(status, category);
create index products_merchant_idx on public.products(merchant_id);
create index affiliate_links_code_idx on public.affiliate_links(code);
create index clicks_link_time_idx on public.affiliate_clicks(affiliate_link_id, clicked_at desc);
create index orders_customer_time_idx on public.orders(customer_id, created_at desc);
create index orders_affiliate_time_idx on public.orders(affiliate_id, created_at desc);
create index commissions_affiliate_status_idx on public.commissions(affiliate_id, status);
create index ledger_affiliate_time_idx on public.ledger_entries(affiliate_id, created_at desc);

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger merchants_updated_at before update on public.merchants for each row execute function public.set_updated_at();
create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();
create trigger commissions_updated_at before update on public.commissions for each row execute function public.set_updated_at();
create trigger payouts_updated_at before update on public.payouts for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.merchants enable row level security;
alter table public.affiliate_profiles enable row level security;
alter table public.products enable row level security;
alter table public.affiliate_links enable row level security;
alter table public.affiliate_clicks enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.commissions enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.payouts enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles read own" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles update own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "active products public read" on public.products for select to anon, authenticated using (status = 'published');
create policy "merchant reads own store" on public.merchants for select to authenticated using (owner_id = auth.uid());
create policy "affiliate reads own profile" on public.affiliate_profiles for select to authenticated using (user_id = auth.uid());
create policy "affiliate reads own links" on public.affiliate_links for select to authenticated using (
  affiliate_id in (select id from public.affiliate_profiles where user_id = auth.uid())
);
create policy "customer reads own orders" on public.orders for select to authenticated using (customer_id = auth.uid());
create policy "affiliate reads attributed orders" on public.orders for select to authenticated using (
  affiliate_id in (select id from public.affiliate_profiles where user_id = auth.uid())
);
create policy "customer reads own order items" on public.order_items for select to authenticated using (
  order_id in (select id from public.orders where customer_id = auth.uid())
);
create policy "affiliate reads own commissions" on public.commissions for select to authenticated using (
  affiliate_id in (select id from public.affiliate_profiles where user_id = auth.uid())
);
create policy "affiliate reads own ledger" on public.ledger_entries for select to authenticated using (
  affiliate_id in (select id from public.affiliate_profiles where user_id = auth.uid())
);
create policy "affiliate reads own payouts" on public.payouts for select to authenticated using (
  affiliate_id in (select id from public.affiliate_profiles where user_id = auth.uid())
);
-- No client insert/update/delete policies for clicks, orders, commissions, ledger, payouts or audit logs.
-- Trusted server routes/functions must validate all transitions and write financial events idempotently.


-- Secure profile bootstrap: user-controlled metadata may populate contact fields only,
-- never the authorization role.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    'customer'::public.app_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

-- Explicit Data API grants: Supabase no longer exposes newly created tables by default.
grant select on public.products to anon, authenticated;
grant select on public.categories to anon, authenticated;
grant select on public.store_settings to anon, authenticated;
grant select on public.profiles, public.merchants, public.affiliate_profiles,
  public.affiliate_links, public.affiliate_clicks, public.orders, public.order_items,
  public.commissions, public.ledger_entries, public.payouts, public.audit_logs
to authenticated;
grant insert, update, delete on public.products, public.merchants,
  public.affiliate_profiles, public.affiliate_links, public.affiliate_clicks,
  public.orders, public.order_items, public.commissions, public.ledger_entries,
  public.payouts, public.audit_logs
to authenticated;
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;
