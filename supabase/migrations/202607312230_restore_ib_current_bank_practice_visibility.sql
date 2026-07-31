-- Repair mapped private-bank visibility in Practice.
--
-- Manager imports store the canonical route in course_mappings. Practice uses the
-- derived course_keys/lesson_keys arrays for fast filtering. If those arrays are
-- stale or empty, a complete bank remains visible in Manager but has ready_count
-- zero and is therefore hidden from students.

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
      from jsonb_array_elements(coalesce(new.course_mappings, '[]'::jsonb)) mapping
      where nullif(trim(mapping->>'course'), '') is not null
    ) courses
    order by course_key
  );

  new.lesson_keys := array(
    select lesson_key
    from (
      select distinct concat(
        trim(mapping->>'course'),
        ':',
        trim(mapping->>'lesson_key')
      ) as lesson_key
      from jsonb_array_elements(coalesce(new.course_mappings, '[]'::jsonb)) mapping
      where nullif(trim(mapping->>'course'), '') is not null
        and nullif(trim(mapping->>'lesson_key'), '') is not null
    ) lessons
    order by lesson_key
  );

  return new;
end;
$$;

drop trigger if exists private_bank_mapping_indexes_trigger
  on public.private_bank_questions;
create trigger private_bank_mapping_indexes_trigger
before insert or update of course_mappings
on public.private_bank_questions
for each row
execute function public.sync_private_bank_mapping_indexes();

-- Rebuild the derived indexes for every existing bank, including
-- IBAI-CURRENT-DIGITAL-06, without changing IDs, payloads, mappings, provenance,
-- trust, visibility, or verification state.
with derived as (
  select
    q.organization_id,
    q.question_id,
    array(
      select course_key
      from (
        select distinct trim(mapping->>'course') as course_key
        from jsonb_array_elements(coalesce(q.course_mappings, '[]'::jsonb)) mapping
        where nullif(trim(mapping->>'course'), '') is not null
      ) courses
      order by course_key
    ) as course_keys,
    array(
      select lesson_key
      from (
        select distinct concat(
          trim(mapping->>'course'),
          ':',
          trim(mapping->>'lesson_key')
        ) as lesson_key
        from jsonb_array_elements(coalesce(q.course_mappings, '[]'::jsonb)) mapping
        where nullif(trim(mapping->>'course'), '') is not null
          and nullif(trim(mapping->>'lesson_key'), '') is not null
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

-- Use canonical course_mappings to determine whether a question belongs to one
-- course. The derived arrays remain query indexes, not the source of truth.
create or replace function public.private_bank_practice_inventory(
  p_organization_id uuid,
  p_course_key text default null
)
returns table (
  bank_code text,
  course_key text,
  unit_number integer,
  lesson_key text,
  lesson_title text,
  question_count bigint,
  ready_count bigint
)
language sql
security definer
stable
set search_path = public
as $$
  select
    q.bank_code,
    mapping.value ->> 'course' as course_key,
    case
      when coalesce(mapping.value ->> 'unit', '') ~ '^\\d{1,2}$'
        then (mapping.value ->> 'unit')::integer
      else null
    end as unit_number,
    coalesce(mapping.value ->> 'lesson_key', '') as lesson_key,
    coalesce(mapping.value ->> 'lesson_title', '') as lesson_title,
    count(*) as question_count,
    count(*) filter (
      where q.student_visible = true
        and q.mapping_verified = true
        and q.trust_tier in ('publisher_key_direct', 'student_ready_verified')
        and coalesce(mapping.value ->> 'unit', '') ~ '^\\d{1,2}$'
        and (mapping.value ->> 'unit')::integer between 1 and 20
        and nullif(trim(mapping.value ->> 'lesson_key'), '') is not null
        and nullif(trim(mapping.value ->> 'lesson_title'), '') is not null
        and (
          select count(distinct trim(course_mapping.value ->> 'course'))
          from jsonb_array_elements(
            coalesce(q.course_mappings, '[]'::jsonb)
          ) course_mapping(value)
          where nullif(trim(course_mapping.value ->> 'course'), '') is not null
        ) = 1
    ) as ready_count
  from public.private_bank_questions q
  cross join lateral jsonb_array_elements(
    coalesce(q.course_mappings, '[]'::jsonb)
  ) mapping(value)
  where q.organization_id = p_organization_id
    and nullif(trim(mapping.value ->> 'course'), '') is not null
    and (
      nullif(trim(coalesce(p_course_key, '')), '') is null
      or mapping.value ->> 'course' = p_course_key
    )
  group by
    q.bank_code,
    mapping.value ->> 'course',
    case
      when coalesce(mapping.value ->> 'unit', '') ~ '^\\d{1,2}$'
        then (mapping.value ->> 'unit')::integer
      else null
    end,
    coalesce(mapping.value ->> 'lesson_key', ''),
    coalesce(mapping.value ->> 'lesson_title', '')
  order by course_key, bank_code, unit_number nulls last, lesson_key;
$$;

revoke all on function public.private_bank_practice_inventory(uuid, text)
  from public, anon, authenticated;
grant execute on function public.private_bank_practice_inventory(uuid, text)
  to service_role;

comment on function public.private_bank_practice_inventory(uuid, text) is
  'Service-role-only practice inventory. Canonical course_mappings determine readiness; course_keys and lesson_keys are synchronized query indexes.';
