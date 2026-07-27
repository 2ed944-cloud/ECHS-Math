-- Do not accept a question trust tier supplied by the browser.

create or replace function private.apply_question_trust_to_attempt()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_tier text;
begin
  select trust_tier into v_tier
  from public.question_trust_records
  where question_id = new.question_id;

  new.trust_tier := coalesce(v_tier, 'legacy_verified_boundary');
  return new;
end;
$$;

drop trigger if exists learning_attempts_trust_guard on public.learning_attempts;
create trigger learning_attempts_trust_guard
before insert or update of question_id, trust_tier
on public.learning_attempts
for each row execute function private.apply_question_trust_to_attempt();

revoke all on function private.apply_question_trust_to_attempt() from public, anon, authenticated;
grant execute on function private.apply_question_trust_to_attempt() to service_role;
