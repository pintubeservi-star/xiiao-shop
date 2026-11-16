-- Cost snapshots, receivables/payables and secure e-CF tracking.
alter table public.cg_market_order_items add column if not exists unit_cost_dop numeric(12,2) not null default 0 check (unit_cost_dop>=0);
create or replace function public.cg_market_snapshot_item_cost()
returns trigger language plpgsql set search_path=''
as $$
begin
 if new.product_id is not null then
  select coalesce(p.cost_dop,0) into new.unit_cost_dop from public.cg_market_products p where p.id=new.product_id;
 end if;
 return new;
end $$;
drop trigger if exists cg_market_order_item_cost_snapshot on public.cg_market_order_items;
create trigger cg_market_order_item_cost_snapshot before insert on public.cg_market_order_items for each row execute function public.cg_market_snapshot_item_cost();

create table if not exists public.cg_market_receivables (
 id uuid primary key default gen_random_uuid(), merchant_id uuid not null references public.cg_market_merchants(id) on delete cascade,
 order_id uuid references public.cg_market_orders(id) on delete set null, customer_id uuid references public.cg_market_customers(id) on delete set null,
 customer_name text not null, description text, amount_dop numeric(12,2) not null check(amount_dop>0),
 paid_dop numeric(12,2) not null default 0 check(paid_dop>=0 and paid_dop<=amount_dop),
 due_date date, status text not null default 'open' check(status in ('open','partial','paid','overdue','cancelled')),
 created_by uuid references auth.users(id), created_at timestamptz not null default now()
);
create table if not exists public.cg_market_receivable_payments (
 id uuid primary key default gen_random_uuid(), receivable_id uuid not null references public.cg_market_receivables(id) on delete cascade,
 merchant_id uuid not null references public.cg_market_merchants(id) on delete cascade,
 amount_dop numeric(12,2) not null check(amount_dop>0),
 payment_method text not null default 'cash' check(payment_method in ('cash','transfer','card','other')),
 reference text, received_by uuid references auth.users(id), received_at timestamptz not null default now()
);
create table if not exists public.cg_market_payables (
 id uuid primary key default gen_random_uuid(), merchant_id uuid not null references public.cg_market_merchants(id) on delete cascade,
 supplier_id uuid references public.cg_market_suppliers(id) on delete set null, purchase_id uuid references public.cg_market_purchase_orders(id) on delete set null,
 description text not null, amount_dop numeric(12,2) not null check(amount_dop>0),
 paid_dop numeric(12,2) not null default 0 check(paid_dop>=0 and paid_dop<=amount_dop),
 due_date date, status text not null default 'open' check(status in ('open','partial','paid','overdue','cancelled')),
 created_by uuid references auth.users(id), created_at timestamptz not null default now()
);
create table if not exists public.cg_market_payable_payments (
 id uuid primary key default gen_random_uuid(), payable_id uuid not null references public.cg_market_payables(id) on delete cascade,
 merchant_id uuid not null references public.cg_market_merchants(id) on delete cascade,
 amount_dop numeric(12,2) not null check(amount_dop>0),
 payment_method text not null default 'cash' check(payment_method in ('cash','transfer','card','other')),
 reference text, paid_by uuid references auth.users(id), paid_at timestamptz not null default now()
);
create table if not exists public.cg_market_ecf_documents (
 id uuid primary key default gen_random_uuid(), merchant_id uuid not null references public.cg_market_merchants(id) on delete cascade,
 invoice_id uuid not null references public.cg_market_invoices(id) on delete cascade,
 document_type text not null, encf text, provider_code text, provider_reference text,
 status text not null default 'queued' check(status in ('queued','signed','submitted','accepted','rejected','cancelled','error')),
 request_hash text not null, idempotency_key text not null, xml_storage_path text, pdf_storage_path text,
 submitted_at timestamptz, accepted_at timestamptz, response_code text, response_message text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(merchant_id,idempotency_key), unique(merchant_id,encf)
);
create table if not exists public.cg_market_ecf_events (
 id uuid primary key default gen_random_uuid(), merchant_id uuid not null references public.cg_market_merchants(id) on delete cascade,
 ecf_document_id uuid not null references public.cg_market_ecf_documents(id) on delete cascade,
 event_type text not null, response_code text, message text, payload jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index if not exists cg_market_receivables_merchant_status_idx on public.cg_market_receivables(merchant_id,status,due_date);
create index if not exists cg_market_payables_merchant_status_idx on public.cg_market_payables(merchant_id,status,due_date);
create index if not exists cg_market_ecf_merchant_created_idx on public.cg_market_ecf_documents(merchant_id,created_at desc);

alter table public.cg_market_receivables enable row level security;
alter table public.cg_market_receivable_payments enable row level security;
alter table public.cg_market_payables enable row level security;
alter table public.cg_market_payable_payments enable row level security;
alter table public.cg_market_ecf_documents enable row level security;
alter table public.cg_market_ecf_events enable row level security;
create policy cg_market_receivables_access on public.cg_market_receivables for all to authenticated using(public.cg_market_can_access(merchant_id)) with check(public.cg_market_can_access(merchant_id));
create policy cg_market_receivable_payments_access on public.cg_market_receivable_payments for all to authenticated using(public.cg_market_can_access(merchant_id)) with check(public.cg_market_can_access(merchant_id));
create policy cg_market_payables_access on public.cg_market_payables for all to authenticated using(public.cg_market_can_access(merchant_id)) with check(public.cg_market_can_access(merchant_id));
create policy cg_market_payable_payments_access on public.cg_market_payable_payments for all to authenticated using(public.cg_market_can_access(merchant_id)) with check(public.cg_market_can_access(merchant_id));
create policy cg_market_ecf_documents_read on public.cg_market_ecf_documents for select to authenticated using(public.cg_market_can_access(merchant_id));
create policy cg_market_ecf_events_read on public.cg_market_ecf_events for select to authenticated using(public.cg_market_can_access(merchant_id));

create or replace function public.cg_market_record_receivable_payment(p_receivable_id uuid,p_amount numeric,p_method text,p_reference text default null)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v public.cg_market_receivables%rowtype; v_paid numeric(12,2);
begin
 select * into v from public.cg_market_receivables where id=p_receivable_id for update;
 if not found or not public.cg_market_can_access(v.merchant_id) then raise exception 'Cuenta por cobrar no encontrada o sin permiso.'; end if;
 if v.status in ('paid','cancelled') or p_amount<=0 or p_amount>(v.amount_dop-v.paid_dop) then raise exception 'Monto de pago no válido.'; end if;
 if p_method not in ('cash','transfer','card','other') then raise exception 'Método de pago no válido.'; end if;
 insert into public.cg_market_receivable_payments(receivable_id,merchant_id,amount_dop,payment_method,reference,received_by)
 values(v.id,v.merchant_id,p_amount,p_method,p_reference,(select auth.uid()));
 v_paid:=v.paid_dop+p_amount;
 update public.cg_market_receivables set paid_dop=v_paid,status=case when v_paid>=amount_dop then 'paid' else 'partial' end where id=v.id;
 return jsonb_build_object('paid_dop',v_paid,'balance_dop',v.amount_dop-v_paid);
end $$;
create or replace function public.cg_market_record_payable_payment(p_payable_id uuid,p_amount numeric,p_method text,p_reference text default null)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v public.cg_market_payables%rowtype; v_paid numeric(12,2);
begin
 select * into v from public.cg_market_payables where id=p_payable_id for update;
 if not found or not public.cg_market_can_access(v.merchant_id) then raise exception 'Cuenta por pagar no encontrada o sin permiso.'; end if;
 if v.status in ('paid','cancelled') or p_amount<=0 or p_amount>(v.amount_dop-v.paid_dop) then raise exception 'Monto de pago no válido.'; end if;
 if p_method not in ('cash','transfer','card','other') then raise exception 'Método de pago no válido.'; end if;
 insert into public.cg_market_payable_payments(payable_id,merchant_id,amount_dop,payment_method,reference,paid_by)
 values(v.id,v.merchant_id,p_amount,p_method,p_reference,(select auth.uid()));
 v_paid:=v.paid_dop+p_amount;
 update public.cg_market_payables set paid_dop=v_paid,status=case when v_paid>=amount_dop then 'paid' else 'partial' end where id=v.id;
 return jsonb_build_object('paid_dop',v_paid,'balance_dop',v.amount_dop-v_paid);
end $$;
revoke all on function public.cg_market_record_receivable_payment(uuid,numeric,text,text) from public,anon;
revoke all on function public.cg_market_record_payable_payment(uuid,numeric,text,text) from public,anon;
grant execute on function public.cg_market_record_receivable_payment(uuid,numeric,text,text) to authenticated;
grant execute on function public.cg_market_record_payable_payment(uuid,numeric,text,text) to authenticated;

-- Payment ledgers are append-only from the client perspective; the RPCs write them.
drop policy if exists cg_market_receivable_payments_access on public.cg_market_receivable_payments;
create policy cg_market_receivable_payments_read on public.cg_market_receivable_payments for select to authenticated using(public.cg_market_can_access(merchant_id));
drop policy if exists cg_market_payable_payments_access on public.cg_market_payable_payments;
create policy cg_market_payable_payments_read on public.cg_market_payable_payments for select to authenticated using(public.cg_market_can_access(merchant_id));
