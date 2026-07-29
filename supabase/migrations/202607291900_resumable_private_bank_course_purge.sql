-- Resumable, organization-scoped private-bank course purge jobs.
-- Large IB Mathematics AI removals are processed in bounded database and storage
-- batches so Supabase statement and Edge Function CPU limits are never asked to
-- handle the full bank in one request.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.private_bank_course_purge_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  course_key text not null check (course_key in (
    'ap-precalculus',
    'ib-math-ai',
    'ap-calculus',
    'algebra-2',
    'grade-9'
  )),
  status text not null default 'pending' check (status in ('pending','running','completed','failed')),
  phase text not null default 'mixed-questions' check (phase in (
    'mixed-questions',
    'dedicated-questions',
    'dedicated-media',
    'source-archives',
    'mixed-packages',
    'import-runs',
    'dedicated-packages',
    'verify',
    'completed'
  )),
  dedicated_package_ids uuid[] not null default '{}',
  mixed_package_ids uuid[] not null default '{}',
  dedicated_bank_codes text[] not null default '{}',
  totals jsonb not null default '{}'::jsonb,
  progress jsonb not null default '{}'::jsonb,
  last_error text,
  created_by uuid references public.accounts(id) on delete set null,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create unique index if not exists private_bank_course_purge_jobs_active_idx
  on public.private_bank_course_purge_jobs(organization_id, course_key)
  where status in ('pending','running','failed');

create index if not exists private_bank_course_purge_jobs_org_updated_idx
  on public.private_bank_course_purge_jobs(organization_id, updated_at desc);

alter table public.private_bank_course_purge_jobs enable row level security;
revoke all on public.private_bank_course_purge_jobs from public, anon, authenticated;
grant all on public.private_bank_course_purge_jobs to service_role;

create or replace function private.clean_private_bank_payload_for_course(
  p_payload jsonb,
  p_course_key text,
  p_remaining_mappings jsonb
)
returns jsonb
language plpgsql
immutable
as $$
declare
  result jsonb := coalesce(p_payload, '{}'::jsonb);
  classification jsonb := coalesce(result -> 'classification', '{}'::jsonb);
  aliases jsonb := coalesce(result -> 'display_bank_aliases', '{}'::jsonb) - p_course_key;
  first_mapping jsonb := p_remaining_mappings -> 0;
  skill_keys jsonb;
  first_skill text;
begin
  result := jsonb_set(result, '{course_mappings}', coalesce(p_remaining_mappings, '[]'::jsonb), true);
  result := jsonb_set(result, '{display_bank_aliases}', aliases, true);

  if p_course_key = 'ib-math-ai' then
    classification := classification - 'ib_unit' - 'ib_lesson' - 'ib_lesson_title';
  end if;

  if first_mapping is not null then
    classification := classification || jsonb_build_object(
      'course_scope', first_mapping ->> 'course',
      'primary_unit', first_mapping -> 'unit',
      'primary_topic', first_mapping ->> 'lesson_key',
      'primary_topic_title', first_mapping ->> 'lesson_title',
      'topic', first_mapping ->> 'lesson_key',
      'topic_title', first_mapping ->> 'lesson_title',
      'mapping_verified', true
    );
    if coalesce(first_mapping ->> 'course', '') in ('ap-precalculus', 'ap-calculus') then
      classification := classification || jsonb_build_object(
        'ap_unit', first_mapping -> 'unit',
        'ap_topic', first_mapping ->> 'lesson_key',
        'ap_topic_title', first_mapping ->> 'lesson_title'
      );
    end if;
  end if;
  result := jsonb_set(result, '{classification}', classification, true);

  select coalesce(jsonb_agg(to_jsonb(skill) order by skill), '[]'::jsonb), min(skill)
    into skill_keys, first_skill
  from (
    select distinct mapping ->> 'skill_key' as skill
    from jsonb_array_elements(coalesce(p_remaining_mappings, '[]'::jsonb)) mapping
    where coalesce(mapping ->> 'skill_key', '') <> ''
  ) skills;

  result := jsonb_set(result, '{skill_keys}', skill_keys, true);
  result := jsonb_set(result, '{skill_key}', coalesce(to_jsonb(first_skill), 'null'::jsonb), true);
  return result;
end;
$$;

create or replace function public.purge_private_bank_course_mappings_batch(
  p_organization_id uuid,
  p_course_key text,
  p_package_ids uuid[],
  p_limit integer default 100
)
returns jsonb
language sql
security definer
set search_path = public, private, extensions
as $$
with candidates as (
  select
    q.organization_id,
    q.question_id,
    q.course_mappings,
    coalesce((
      select jsonb_agg(item.value order by item.ordinality)
      from jsonb_array_elements(q.course_mappings) with ordinality item(value, ordinality)
      where item.value ->> 'course' <> p_course_key
    ), '[]'::jsonb) as remaining_mappings,
    q.payload
  from public.private_bank_questions q
  where q.organization_id = p_organization_id
    and q.course_keys @> array[p_course_key]::text[]
    and q.package_id = any(coalesce(p_package_ids, '{}'::uuid[]))
  order by q.question_id
  limit greatest(1, least(coalesce(p_limit, 100), 250))
), prepared as (
  select
    c.*,
    private.clean_private_bank_payload_for_course(c.payload, p_course_key, c.remaining_mappings) as new_payload,
    coalesce((
      select array_agg(distinct item.value ->> 'course' order by item.value ->> 'course')
      from jsonb_array_elements(c.remaining_mappings) item(value)
      where coalesce(item.value ->> 'course', '') <> ''
    ), '{}'::text[]) as new_course_keys,
    coalesce((
      select array_agg(distinct (item.value ->> 'course') || ':' || (item.value ->> 'lesson_key') order by (item.value ->> 'course') || ':' || (item.value ->> 'lesson_key'))
      from jsonb_array_elements(c.remaining_mappings) item(value)
      where coalesce(item.value ->> 'course', '') <> ''
        and coalesce(item.value ->> 'lesson_key', '') <> ''
    ), '{}'::text[]) as new_lesson_keys,
    coalesce((
      select array_agg(distinct item.value ->> 'skill_key' order by item.value ->> 'skill_key')
      from jsonb_array_elements(c.remaining_mappings) item(value)
      where coalesce(item.value ->> 'skill_key', '') <> ''
    ), '{}'::text[]) as new_skill_candidates
  from candidates c
), removed as (
  delete from public.private_bank_questions q
  using prepared p
  where q.organization_id = p.organization_id
    and q.question_id = p.question_id
    and jsonb_array_length(p.remaining_mappings) = 0
  returning q.question_id
), changed as (
  update public.private_bank_questions q
  set
    course_keys = p.new_course_keys,
    lesson_keys = p.new_lesson_keys,
    skill_candidates = p.new_skill_candidates,
    course_mappings = p.remaining_mappings,
    payload = p.new_payload,
    payload_sha256 = encode(extensions.digest(convert_to(p.new_payload::text, 'UTF8'), 'sha256'), 'hex'),
    updated_at = now()
  from prepared p
  where q.organization_id = p.organization_id
    and q.question_id = p.question_id
    and jsonb_array_length(p.remaining_mappings) > 0
  returning q.question_id
)
select jsonb_build_object(
  'processed', (select count(*) from candidates),
  'updated', (select count(*) from changed),
  'deleted', (select count(*) from removed),
  'deleted_ids', coalesce((select jsonb_agg(question_id order by question_id) from removed), '[]'::jsonb),
  'mappings_removed', coalesce((select sum(jsonb_array_length(course_mappings) - jsonb_array_length(remaining_mappings)) from candidates), 0)
);
$$;

create or replace function public.delete_private_bank_questions_batch(
  p_organization_id uuid,
  p_package_ids uuid[],
  p_limit integer default 250
)
returns jsonb
language sql
security definer
set search_path = public, private
as $$
with candidates as (
  select q.organization_id, q.question_id
  from public.private_bank_questions q
  where q.organization_id = p_organization_id
    and q.package_id = any(coalesce(p_package_ids, '{}'::uuid[]))
  order by q.question_id
  limit greatest(1, least(coalesce(p_limit, 250), 500))
), removed as (
  delete from public.private_bank_questions q
  using candidates c
  where q.organization_id = c.organization_id
    and q.question_id = c.question_id
  returning q.question_id
)
select jsonb_build_object(
  'processed', (select count(*) from removed),
  'deleted_ids', coalesce((select jsonb_agg(question_id order by question_id) from removed), '[]'::jsonb)
);
$$;

revoke all on function private.clean_private_bank_payload_for_course(jsonb, text, jsonb) from public, anon, authenticated;
revoke all on function public.purge_private_bank_course_mappings_batch(uuid, text, uuid[], integer) from public, anon, authenticated;
revoke all on function public.delete_private_bank_questions_batch(uuid, uuid[], integer) from public, anon, authenticated;
grant execute on function private.clean_private_bank_payload_for_course(jsonb, text, jsonb) to service_role;
grant execute on function public.purge_private_bank_course_mappings_batch(uuid, text, uuid[], integer) to service_role;
grant execute on function public.delete_private_bank_questions_batch(uuid, uuid[], integer) to service_role;

comment on table public.private_bank_course_purge_jobs is
  'Resumable administrator course purge state. Each API call removes only a bounded batch and can be safely retried.';
comment on function public.purge_private_bank_course_mappings_batch(uuid, text, uuid[], integer) is
  'Service-role-only RPC that removes one bounded course-mapping batch without loading the full bank into an Edge Function.';
comment on function public.delete_private_bank_questions_batch(uuid, uuid[], integer) is
  'Service-role-only RPC that deletes one bounded dedicated private-bank question batch and returns IDs for orphaned trust cleanup.';
