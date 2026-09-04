-- IB Mathematics Readiness & Pathway Intelligence System
-- Evidence layers: MAP + MYP criteria + local IB mathematics diagnostic.
-- Scores are local decision-support indices, not official IB/NWEA predictions.

create table if not exists public.readiness_schools (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  code text not null,
  status text not null default 'active' check (status in ('active','archived')),
  created_by uuid references public.accounts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);
create index if not exists readiness_schools_org_idx
  on public.readiness_schools(organization_id, status, name);

create table if not exists public.readiness_student_schools (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid not null references public.accounts(id) on delete cascade,
  school_id uuid not null references public.readiness_schools(id) on delete cascade,
  academic_year text not null default '2026-2027',
  is_current boolean not null default true,
  assigned_by uuid references public.accounts(id) on delete set null,
  assigned_at timestamptz not null default now(),
  primary key (student_id, school_id, academic_year)
);
create unique index if not exists readiness_student_schools_one_current_idx
  on public.readiness_student_schools(student_id) where is_current = true;
create index if not exists readiness_student_schools_school_idx
  on public.readiness_student_schools(school_id, academic_year, is_current);

create table if not exists public.readiness_models (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null default 'IB Mathematics readiness model',
  version integer not null,
  status text not null default 'draft' check (status in ('draft','active','retired')),
  configuration jsonb not null default '{}'::jsonb,
  notes text,
  created_by uuid references public.accounts(id) on delete set null,
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  unique (organization_id, version)
);
create unique index if not exists readiness_models_one_active_idx
  on public.readiness_models(organization_id) where status = 'active';
create index if not exists readiness_models_org_version_idx
  on public.readiness_models(organization_id, version desc);

create table if not exists public.readiness_import_batches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  school_id uuid references public.readiness_schools(id) on delete set null,
  import_type text not null check (import_type in ('map','myp','outcome')),
  file_name text,
  headers jsonb not null default '[]'::jsonb,
  row_count integer not null default 0 check (row_count >= 0),
  matched_count integer not null default 0 check (matched_count >= 0),
  rejected_count integer not null default 0 check (rejected_count >= 0),
  imported_by uuid not null references public.accounts(id),
  created_at timestamptz not null default now()
);
create index if not exists readiness_import_batches_org_idx
  on public.readiness_import_batches(organization_id, created_at desc);

create table if not exists public.map_assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid not null references public.accounts(id) on delete cascade,
  school_id uuid references public.readiness_schools(id) on delete set null,
  import_batch_id uuid references public.readiness_import_batches(id) on delete set null,
  test_date date not null,
  season text not null default 'default' check (season in ('fall','winter','spring','default')),
  grade text,
  overall_rit numeric,
  percentile numeric check (percentile is null or (percentile >= 0 and percentile <= 100)),
  growth_percentile numeric check (growth_percentile is null or (growth_percentile >= 0 and growth_percentile <= 100)),
  domains jsonb not null default '{}'::jsonb,
  source_note text,
  created_by uuid not null references public.accounts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, test_date, season)
);
create index if not exists map_assessments_student_time_idx
  on public.map_assessments(student_id, test_date desc, created_at desc);
create index if not exists map_assessments_org_time_idx
  on public.map_assessments(organization_id, test_date desc);

create table if not exists public.myp_math_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid not null references public.accounts(id) on delete cascade,
  school_id uuid references public.readiness_schools(id) on delete set null,
  import_batch_id uuid references public.readiness_import_batches(id) on delete set null,
  evidence_date date not null default current_date,
  criterion_a numeric check (criterion_a is null or (criterion_a >= 0 and criterion_a <= 8)),
  criterion_b numeric check (criterion_b is null or (criterion_b >= 0 and criterion_b <= 8)),
  criterion_c numeric check (criterion_c is null or (criterion_c >= 0 and criterion_c <= 8)),
  criterion_d numeric check (criterion_d is null or (criterion_d >= 0 and criterion_d <= 8)),
  source_title text,
  notes text,
  teacher_id uuid references public.accounts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (criterion_a is not null or criterion_b is not null or criterion_c is not null or criterion_d is not null)
);
create index if not exists myp_math_evidence_student_time_idx
  on public.myp_math_evidence(student_id, evidence_date desc, created_at desc);
create index if not exists myp_math_evidence_org_time_idx
  on public.myp_math_evidence(organization_id, evidence_date desc);

create table if not exists public.readiness_diagnostic_attempts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid not null references public.accounts(id) on delete cascade,
  school_id uuid references public.readiness_schools(id) on delete set null,
  diagnostic_version text not null,
  score numeric not null check (score >= 0 and score <= 100),
  correct integer not null check (correct >= 0),
  total integer not null check (total > 0),
  answered integer not null check (answered >= 0),
  skill_scores jsonb not null default '{}'::jsonb,
  response_digest text,
  proctored_by uuid references public.accounts(id) on delete set null,
  completed_at timestamptz not null default now()
);
create index if not exists readiness_diagnostic_student_time_idx
  on public.readiness_diagnostic_attempts(student_id, completed_at desc);

create table if not exists public.readiness_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid not null references public.accounts(id) on delete cascade,
  school_id uuid references public.readiness_schools(id) on delete set null,
  model_id uuid references public.readiness_models(id) on delete set null,
  model_version integer not null default 0,
  pathway text not null check (pathway in ('AA_HL','AA_SL','AI_HL','AI_SL')),
  readiness_index numeric check (readiness_index is null or (readiness_index >= 0 and readiness_index <= 100)),
  band text not null,
  confidence text not null,
  evidence_status text not null,
  evidence_completeness numeric not null default 0 check (evidence_completeness >= 0 and evidence_completeness <= 1),
  components jsonb not null default '{}'::jsonb,
  skill_profile jsonb not null default '{}'::jsonb,
  gaps jsonb not null default '[]'::jsonb,
  reasons jsonb not null default '[]'::jsonb,
  created_by uuid references public.accounts(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists readiness_snapshots_student_path_idx
  on public.readiness_snapshots(student_id, pathway, created_at desc);
create index if not exists readiness_snapshots_org_path_idx
  on public.readiness_snapshots(organization_id, pathway, created_at desc);

create table if not exists public.readiness_interventions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid not null references public.accounts(id) on delete cascade,
  school_id uuid references public.readiness_schools(id) on delete set null,
  pathway text not null check (pathway in ('AA_HL','AA_SL','AI_HL','AI_SL')),
  skill_key text not null,
  title text not null,
  recommendation text not null,
  priority text not null default 'medium' check (priority in ('high','medium','supporting')),
  status text not null default 'open' check (status in ('open','in_progress','mastered','dismissed')),
  baseline_score numeric check (baseline_score is null or (baseline_score >= 0 and baseline_score <= 100)),
  target_score numeric check (target_score is null or (target_score >= 0 and target_score <= 100)),
  resource_url text,
  source_snapshot_id uuid references public.readiness_snapshots(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists readiness_interventions_student_idx
  on public.readiness_interventions(student_id, pathway, status, priority);
create unique index if not exists readiness_interventions_active_skill_idx
  on public.readiness_interventions(student_id, pathway, skill_key)
  where status in ('open','in_progress');

create table if not exists public.readiness_preferences (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid primary key references public.accounts(id) on delete cascade,
  preferred_pathway text check (preferred_pathway is null or preferred_pathway in ('AA_HL','AA_SL','AI_HL','AI_SL')),
  student_note text,
  updated_by uuid references public.accounts(id) on delete set null,
  updated_at timestamptz not null default now()
);
create index if not exists readiness_preferences_org_idx
  on public.readiness_preferences(organization_id, preferred_pathway);

create table if not exists public.readiness_outcomes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid not null references public.accounts(id) on delete cascade,
  school_id uuid references public.readiness_schools(id) on delete set null,
  import_batch_id uuid references public.readiness_import_batches(id) on delete set null,
  pathway text not null check (pathway in ('AA_HL','AA_SL','AI_HL','AI_SL')),
  academic_year text not null,
  final_grade numeric not null check (final_grade >= 1 and final_grade <= 7),
  course_completed boolean not null default true,
  outcome_date date,
  source_note text,
  imported_by uuid not null references public.accounts(id),
  created_at timestamptz not null default now(),
  unique (student_id, pathway, academic_year)
);
create index if not exists readiness_outcomes_org_idx
  on public.readiness_outcomes(organization_id, pathway, academic_year);

-- All readiness data is accessed only through service-role Edge Functions after
-- custom institutional session validation. Browser roles receive no direct table access.
alter table public.readiness_schools enable row level security;
alter table public.readiness_student_schools enable row level security;
alter table public.readiness_models enable row level security;
alter table public.readiness_import_batches enable row level security;
alter table public.map_assessments enable row level security;
alter table public.myp_math_evidence enable row level security;
alter table public.readiness_diagnostic_attempts enable row level security;
alter table public.readiness_snapshots enable row level security;
alter table public.readiness_interventions enable row level security;
alter table public.readiness_preferences enable row level security;
alter table public.readiness_outcomes enable row level security;

revoke all on public.readiness_schools from anon, authenticated;
revoke all on public.readiness_student_schools from anon, authenticated;
revoke all on public.readiness_models from anon, authenticated;
revoke all on public.readiness_import_batches from anon, authenticated;
revoke all on public.map_assessments from anon, authenticated;
revoke all on public.myp_math_evidence from anon, authenticated;
revoke all on public.readiness_diagnostic_attempts from anon, authenticated;
revoke all on public.readiness_snapshots from anon, authenticated;
revoke all on public.readiness_interventions from anon, authenticated;
revoke all on public.readiness_preferences from anon, authenticated;
revoke all on public.readiness_outcomes from anon, authenticated;

grant all on public.readiness_schools to service_role;
grant all on public.readiness_student_schools to service_role;
grant all on public.readiness_models to service_role;
grant all on public.readiness_import_batches to service_role;
grant all on public.map_assessments to service_role;
grant all on public.myp_math_evidence to service_role;
grant all on public.readiness_diagnostic_attempts to service_role;
grant all on public.readiness_snapshots to service_role;
grant all on public.readiness_interventions to service_role;
grant all on public.readiness_preferences to service_role;
grant all on public.readiness_outcomes to service_role;


-- Seed one default school per existing organization so the readiness layer works
-- immediately in a single-school deployment and can later expand to a network.
insert into public.readiness_schools (organization_id, name, code)
select o.id, o.name, upper(regexp_replace(o.slug, '[^a-zA-Z0-9]+', '-', 'g'))
from public.organizations o
where not exists (select 1 from public.readiness_schools s where s.organization_id = o.id);

insert into public.readiness_student_schools (organization_id, student_id, school_id, academic_year, is_current)
select a.organization_id, a.id, s.id, '2026-2027', true
from public.accounts a
join lateral (
  select id from public.readiness_schools rs
  where rs.organization_id = a.organization_id and rs.status = 'active'
  order by rs.created_at asc limit 1
) s on true
where a.role = 'student' and a.status <> 'archived'
  and not exists (select 1 from public.readiness_student_schools rss where rss.student_id = a.id and rss.is_current = true);

-- Create a lightweight active model row for every existing institution. The
-- Edge Function merges this configuration with its versioned default model.
insert into public.readiness_models (organization_id, name, version, status, configuration, notes, activated_at)
select o.id,
       'IB Mathematics readiness baseline',
       1,
       'active',
       '{}'::jsonb,
       'Local evidence-based baseline. Not an official IB or NWEA predictor; local validation is required.',
       now()
from public.organizations o
where not exists (
  select 1 from public.readiness_models m
  where m.organization_id = o.id and m.status = 'active'
);
