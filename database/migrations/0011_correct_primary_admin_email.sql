create or replace function private.promote_primary_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.email_confirmed_at is not null
     and (old.email_confirmed_at is null or old.email_confirmed_at is distinct from new.email_confirmed_at)
     and lower(coalesce(new.email,'')) = 'pintubeservi@gmail.com' then
    update public.profiles set role = 'admin'::public.app_role where id = new.id;
    insert into public.audit_logs(actor_id,action,entity_type,entity_id,details)
    values(new.id,'primary_admin_verified','profile',new.id,jsonb_build_object('email',lower(new.email)));
  end if;
  return new;
end;
$function$;
