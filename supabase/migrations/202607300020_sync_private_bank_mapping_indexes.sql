-- Keep the fast course/lesson index columns aligned with canonical course_mappings.
-- This repairs Manager imports whose verified mappings were stored correctly in
-- course_mappings but whose derived course_keys/lesson_keys arrays were empty.

create or replace function public.sync_private_bank_mapping_indexes()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.course_keys := array(
    select course_key
    from (
      select distinct mapping->>'course' as course_key
      from jsonb_array_elements(coalesce(new.course_mappings, '[]'::jsonb)) as mapping
      where nullif(mapping->>'course', '') is not null
    ) courses
    order by course_key
  );

  new.lesson_keys := array(
    select lesson_key
    from (
      select distinct concat(mapping->>'course', ':', mapping->>'lesson_key') as lesson_key
      from jsonb_array_elements(coalesce(new.course_mappings, '[]'::jsonb)) as mapping
      where nullif(mapping->>'course', '') is not null
        and nullif(mapping->>'lesson_key', '') is not null
    ) lessons
    order by lesson_key
  );

  return new;
end;
$$;

drop trigger if exists private_bank_mapping_indexes_trigger on public.private_bank_questions;
create trigger private_bank_mapping_indexes_trigger
before insert or update of course_mappings
on public.private_bank_questions
for each row
execute function public.sync_private_bank_mapping_indexes();

-- Backfill existing Manager-uploaded questions without changing IDs, payloads,
-- provenance, trust, visibility, or the canonical mapping objects.
--
-- PostgreSQL does not allow the UPDATE target alias to be referenced from the
-- original FROM LATERAL subquery used here. Build the derived arrays in a CTE,
-- keyed by the table's composite primary key, then join that result to UPDATE.
with derived as (
  select
    q.organization_id,
    q.question_id,
    array(
      select course_key
      from (
        select distinct mapping->>'course' as course_key
        from jsonb_array_elements(coalesce(q.course_mappings, '[]'::jsonb)) as mapping
        where nullif(mapping->>'course', '') is not null
      ) courses
      order by course_key
    ) as course_keys,
    array(
      select lesson_key
      from (
        select distinct concat(mapping->>'course', ':', mapping->>'lesson_key') as lesson_key
        from jsonb_array_elements(coalesce(q.course_mappings, '[]'::jsonb)) as mapping
        where nullif(mapping->>'course', '') is not null
          and nullif(mapping->>'lesson_key', '') is not null
      ) lessons
      order by lesson_key
    ) as lesson_keys
  from public.private_bank_questions q
)
update public.private_bank_questions q
set
  course_keys = derived.course_keys,
  lesson_keys = derived.lesson_keys,
  updated_at = now()
from derived
where q.organization_id = derived.organization_id
  and q.question_id = derived.question_id
  and (
    q.course_keys is distinct from derived.course_keys
    or q.lesson_keys is distinct from derived.lesson_keys
  );

create index if not exists private_bank_questions_course_keys_gin
  on public.private_bank_questions using gin (course_keys);
create index if not exists private_bank_questions_lesson_keys_gin
  on public.private_bank_questions using gin (lesson_keys);
