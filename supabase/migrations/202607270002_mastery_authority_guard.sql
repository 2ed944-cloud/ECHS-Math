-- Fail closed: mastery scores must be calculated by the approved server algorithm.

alter table public.mastery_records
  alter column source set default 'legacy';

update public.mastery_records
set source = 'legacy'
where source is null or source = '';

create or replace function private.enforce_mastery_authority()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if new.source is distinct from 'server' then
    raise exception 'Mastery records must be written by the server-authoritative evidence service';
  end if;
  if coalesce(new.payload->>'algorithm','') <> 'echs-mastery-2.0-foundation' then
    raise exception 'Mastery record is missing the approved algorithm identity';
  end if;
  if new.confidence < 0 or new.confidence > 1 then
    raise exception 'Mastery confidence must be between 0 and 1';
  end if;
  return new;
end;
$$;

drop trigger if exists mastery_records_authority_guard on public.mastery_records;
create trigger mastery_records_authority_guard
before insert or update of score, evidence, confidence, independent_evidence,
  transfer_evidence, retention_evidence, representation_count, active_days,
  last_verified_at, source, payload
on public.mastery_records
for each row execute function private.enforce_mastery_authority();

revoke all on function private.enforce_mastery_authority() from public, anon, authenticated;
grant execute on function private.enforce_mastery_authority() to service_role;
