create or replace function public.cg_prevent_driver_self_approval()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is not null and old.user_id = auth.uid()
     and not public.cg_is_admin()
     and new.status is distinct from old.status then
    raise exception 'Solo administración puede cambiar el estado de aprobación del conductor.';
  end if;
  return new;
end;
$$;
drop trigger if exists cg_prevent_driver_self_approval on public.cg_driver_profiles;
create trigger cg_prevent_driver_self_approval before update on public.cg_driver_profiles
for each row execute function public.cg_prevent_driver_self_approval();
