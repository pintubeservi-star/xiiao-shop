-- Allow the merchant application workflow to create pending records.
alter table public.merchants drop constraint if exists merchants_status_check;
alter table public.merchants add constraint merchants_status_check
  check (status = any (array['pending'::text,'active'::text,'suspended'::text,'rejected'::text]));

drop policy if exists "merchant submits own application" on public.merchants;
create policy "merchant submits own application"
  on public.merchants for insert to authenticated
  with check (owner_id = (select auth.uid()) and status = 'pending');
