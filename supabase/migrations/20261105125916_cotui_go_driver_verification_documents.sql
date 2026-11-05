create table if not exists public.cg_driver_verifications (
  driver_id uuid primary key references public.cg_driver_profiles(id) on delete cascade,
  national_id text not null,
  motorcycle_photo_path text not null,
  insurance_document_path text not null,
  insurance_expires_on date not null,
  motorcycle_condition_confirmed boolean not null default false,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  admin_note text,
  constraint cg_driver_verifications_national_id_format check (national_id ~ '^[0-9]{3}-?[0-9]{7}-?[0-9]{1}$'),
  constraint cg_driver_verifications_condition_check check (motorcycle_condition_confirmed = true)
);
alter table public.cg_driver_verifications enable row level security;
create policy "cg driver reads own verification or admin" on public.cg_driver_verifications for select to authenticated
using (exists (select 1 from public.cg_driver_profiles d where d.id=driver_id and d.user_id=auth.uid()) or public.cg_is_admin());
create policy "cg driver submits own verification while pending" on public.cg_driver_verifications for insert to authenticated
with check (exists (select 1 from public.cg_driver_profiles d where d.id=driver_id and d.user_id=auth.uid() and d.status='pending') and motorcycle_condition_confirmed=true);
create policy "cg driver updates own pending verification" on public.cg_driver_verifications for update to authenticated
using (exists (select 1 from public.cg_driver_profiles d where d.id=driver_id and d.user_id=auth.uid() and d.status='pending'))
with check (exists (select 1 from public.cg_driver_profiles d where d.id=driver_id and d.user_id=auth.uid() and d.status='pending') and motorcycle_condition_confirmed=true);
create policy "cg admin manages driver verifications" on public.cg_driver_verifications for all to authenticated
using (public.cg_is_admin()) with check (public.cg_is_admin());

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('cg-driver-documents','cg-driver-documents',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public=false,file_size_limit=10485760,allowed_mime_types=array['image/jpeg','image/png','image/webp','application/pdf'];
create policy "cg drivers upload own verification documents" on storage.objects for insert to authenticated
with check (bucket_id='cg-driver-documents' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "cg drivers and admins read verification documents" on storage.objects for select to authenticated
using (bucket_id='cg-driver-documents' and ((storage.foldername(name))[1]=auth.uid()::text or public.cg_is_admin()));
create policy "cg drivers update own verification documents" on storage.objects for update to authenticated
using (bucket_id='cg-driver-documents' and (storage.foldername(name))[1]=auth.uid()::text)
with check (bucket_id='cg-driver-documents' and (storage.foldername(name))[1]=auth.uid()::text);
