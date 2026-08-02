-- Multi-route assignments use the existing assignments.configuration JSONB.
-- This table adds administrator-managed weekly mathematics timetables.

create table if not exists public.timetable_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  teacher_id uuid not null references public.accounts(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 1 and 7),
  period_order smallint not null check (period_order between 1 and 20),
  start_time time not null,
  end_time time not null,
  room text,
  label text,
  created_by uuid not null references public.accounts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint timetable_time_order check (end_time > start_time),
  constraint timetable_teacher_slot unique (organization_id, teacher_id, day_of_week, period_order)
);

create index if not exists timetable_teacher_week_idx
  on public.timetable_entries(teacher_id, day_of_week, period_order);
create index if not exists timetable_class_week_idx
  on public.timetable_entries(class_id, day_of_week, period_order);

alter table public.timetable_entries enable row level security;

comment on table public.timetable_entries is
  'Administrator-managed class timetable. Read access is mediated by institution-api and class membership.';

create or replace function public.api_replace_timetable(
  p_organization_id uuid,
  p_teacher_id uuid,
  p_created_by uuid,
  p_entries jsonb
)
returns setof public.timetable_entries
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.class_memberships (class_id, account_id, membership_role)
  select distinct (entry->>'class_id')::uuid, p_teacher_id, 'teacher'
  from jsonb_array_elements(coalesce(p_entries, '[]'::jsonb)) as entry
  on conflict (class_id, account_id) do nothing;

  delete from public.timetable_entries
  where organization_id = p_organization_id and teacher_id = p_teacher_id;

  insert into public.timetable_entries (
    organization_id, teacher_id, class_id, day_of_week, period_order,
    start_time, end_time, room, label, created_by, updated_at
  )
  select
    p_organization_id,
    p_teacher_id,
    (entry->>'class_id')::uuid,
    (entry->>'day_of_week')::smallint,
    (entry->>'period_order')::smallint,
    (entry->>'start_time')::time,
    (entry->>'end_time')::time,
    nullif(trim(entry->>'room'), ''),
    nullif(trim(entry->>'label'), ''),
    p_created_by,
    now()
  from jsonb_array_elements(coalesce(p_entries, '[]'::jsonb)) as entry;

  return query
  select timetable.* from public.timetable_entries as timetable
  where timetable.organization_id = p_organization_id and timetable.teacher_id = p_teacher_id
  order by timetable.day_of_week, timetable.period_order;
end;
$$;

revoke all on function public.api_replace_timetable(uuid, uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.api_replace_timetable(uuid, uuid, uuid, jsonb) to service_role;
