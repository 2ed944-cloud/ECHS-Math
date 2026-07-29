-- Resumable, organization-scoped private-bank course purge jobs.
-- Large IB Mathematics AI removals are processed in small Edge Function batches so
-- Supabase statement and CPU limits are never asked to handle the full bank at once.

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

comment on table public.private_bank_course_purge_jobs is
  'Resumable administrator course purge state. Each API call removes only a bounded batch and can be safely retried.';
