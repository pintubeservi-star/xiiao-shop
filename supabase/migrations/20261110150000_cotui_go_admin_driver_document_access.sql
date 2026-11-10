create policy "cg admin reads driver documents" on storage.objects for select to authenticated using (bucket_id='cg-driver-documents' and public.cg_is_admin());
create policy "cg admin uploads driver documents" on storage.objects for insert to authenticated with check (bucket_id='cg-driver-documents' and public.cg_is_admin());
create policy "cg admin updates driver documents" on storage.objects for update to authenticated using (bucket_id='cg-driver-documents' and public.cg_is_admin()) with check (bucket_id='cg-driver-documents' and public.cg_is_admin());
