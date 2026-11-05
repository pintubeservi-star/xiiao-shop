create unique index if not exists cg_driver_verifications_national_id_uidx
on public.cg_driver_verifications (national_id);
create or replace function public.cg_guard_driver_verification_review_fields()
returns trigger language plpgsql set search_path = public as $$
begin
  if not public.cg_is_admin() then
    if new.reviewed_at is not null or new.reviewed_by is not null or new.admin_note is not null then
      raise exception 'Los campos de revisión solo pueden ser modificados por administración.';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists cg_guard_driver_verification_review_fields on public.cg_driver_verifications;
create trigger cg_guard_driver_verification_review_fields
before insert or update on public.cg_driver_verifications
for each row execute function public.cg_guard_driver_verification_review_fields();
