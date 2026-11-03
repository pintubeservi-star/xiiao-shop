-- Promote only the explicitly designated owner account after Supabase verifies mailbox ownership.
create or replace function private.promote_primary_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.email_confirmed_at is not null
     and (old.email_confirmed_at is null or old.email_confirmed_at is distinct from new.email_confirmed_at)
     and lower(coalesce(new.email,'')) = 'seoxiiao@gmail.com' then
    update public.profiles set role = 'admin'::public.app_role where id = new.id;
    insert into public.audit_logs(actor_id,action,entity_type,entity_id,details)
    values(new.id,'primary_admin_verified','profile',new.id,jsonb_build_object('email',lower(new.email)));
  end if;
  return new;
end;
$function$;
revoke all on function private.promote_primary_admin() from public,anon,authenticated;
drop trigger if exists on_primary_admin_email_verified on auth.users;
create trigger on_primary_admin_email_verified
after update of email_confirmed_at on auth.users
for each row execute function private.promote_primary_admin();
