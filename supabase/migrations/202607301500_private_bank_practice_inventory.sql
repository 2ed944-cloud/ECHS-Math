-- Compact, organization-scoped inventory for the mapped practice builder.
-- The browser receives counts and routing keys only; question payloads remain private.

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
      when coalesce(mapping.value ->> 'unit', '') ~ '^\d{1,2}$'
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
        and cardinality(q.course_keys) = 1
    ) as ready_count
  from public.private_bank_questions q
  cross join lateral jsonb_array_elements(coalesce(q.course_mappings, '[]'::jsonb)) mapping(value)
  where q.organization_id = p_organization_id
    and coalesce(mapping.value ->> 'course', '') <> ''
    and (
      nullif(trim(coalesce(p_course_key, '')), '') is null
      or mapping.value ->> 'course' = p_course_key
    )
  group by
    q.bank_code,
    mapping.value ->> 'course',
    case
      when coalesce(mapping.value ->> 'unit', '') ~ '^\d{1,2}$'
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
  'Service-role-only routing inventory used to build course → bank → unit → lesson practice selectors without exposing question payloads.';
