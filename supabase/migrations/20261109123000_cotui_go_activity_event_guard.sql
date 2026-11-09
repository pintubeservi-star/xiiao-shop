drop policy if exists cg_activity_insert_public on public.cg_activity_events;
create policy cg_activity_insert_public on public.cg_activity_events
for insert to anon,authenticated
with check (
 event_name='page_view'
 and (user_id is null or user_id=(select auth.uid()))
 and role in ('visitor','customer','driver','admin')
);
