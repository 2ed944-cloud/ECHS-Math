-- Keep the fast course/lesson index columns aligned with canonical course_mappings.
-- This repairs Manager imports whose verified mappings were stored correctly in
-- course_mappings but whose derived course_keys/lesson_keys arrays were empty.

create or replace function public.sync_private_bank_mapping_indexes()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  select coalesce(array_agg(distinct mapping->>'course' order by mapping->>'course')
    filter (where nullif(mapping->>'course', '') is not null), '{}'::text[])
  into new.course_keys
  from jsonb_array_elements(coalesce(new.course_mappings, '[]'::jsonb)) mapping;

  select coalesce(array_agg(distinct concat(mapping->>'course', ':', mapping->>'lesson_key')
    order by concat(mapping->>'course', ':', mapping->>'lesson_key'))
    filter (
      where nullif(mapping->>'course', '') is not null
        and nullif(mapping->>'lesson_key', '') is not null
    ), '{}'::text[])
  into new.lesson_keys
  from jsonb_array_elements(coalesce(new.course_mappings, '[]'::jsonb)) mapping;

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
update public.private_bank_questions q
set
  course_keys = derived.course_keys,
  lesson_keys = derived.lesson_keys,
  updated_at = now()
from lateral (
  select
    coalesce(array_agg(distinct mapping->>'course' order by mapping->>'course')
      filter (where nullif(mapping->>'course', '') is not null), '{}'::text[]) as course_keys,
    coalesce(array_agg(distinct concat(mapping->>'course', ':', mapping->>'lesson_key')
      order by concat(mapping->>'course', ':', mapping->>'lesson_key'))
      filter (
        where nullif(mapping->>'course', '') is not null
          and nullif(mapping->>'lesson_key', '') is not null
      ), '{}'::text[]) as lesson_keys
  from jsonb_array_elements(coalesce(q.course_mappings, '[]'::jsonb)) mapping
) derived
where q.course_keys is distinct from derived.course_keys
   or q.lesson_keys is distinct from derived.lesson_keys;

create index if not exists private_bank_questions_course_keys_gin
  on public.private_bank_questions using gin (course_keys);
create index if not exists private_bank_questions_lesson_keys_gin
  on public.private_bank_questions using gin (lesson_keys);
