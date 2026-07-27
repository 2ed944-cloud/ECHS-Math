-- Map legacy topic-level attempt keys to the atomic skill registry on the server.
-- Mapping is applied only when the course/unit/topic identifies exactly one active skill.

create or replace function private.apply_atomic_skill_to_attempt()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_skill text;
  v_matches integer;
begin
  if new.skill_key is null or new.skill_key = '' or new.skill_key not like 'APCALC.%' then
    select count(*), min(definition.skill_key)
    into v_matches, v_skill
    from public.skill_definitions definition
    where definition.active = true
      and lower(definition.course) = lower(coalesce(new.course,''))
      and definition.unit = coalesce(new.unit,'')
      and (
        definition.topic = coalesce(new.topic,'')
        or coalesce(new.topic,'') = any(definition.ap_topics)
      );

    if v_matches = 1 and v_skill is not null then
      new.skill_key := v_skill;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists learning_attempts_atomic_skill_guard on public.learning_attempts;
create trigger learning_attempts_atomic_skill_guard
before insert or update of skill_key, course, unit, topic
on public.learning_attempts
for each row execute function private.apply_atomic_skill_to_attempt();

revoke all on function private.apply_atomic_skill_to_attempt() from public, anon, authenticated;
grant execute on function private.apply_atomic_skill_to_attempt() to service_role;
