-- Prevent a signed-in driver from self-approving or changing ownership of their profile.
create or replace function public.cg_protect_driver_approval_fields()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is not null and auth.uid() = old.user_id
     and (new.status is distinct from old.status or new.user_id is distinct from old.user_id) then
    raise exception 'No puedes modificar el estado de aprobación de tu cuenta.';
  end if;
  return new;
end;
$$;
drop trigger if exists cg_protect_driver_approval_fields_trigger on public.cg_driver_profiles;
create trigger cg_protect_driver_approval_fields_trigger
before update on public.cg_driver_profiles
for each row execute function public.cg_protect_driver_approval_fields();
