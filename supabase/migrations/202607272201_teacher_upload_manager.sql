-- Teacher upload manager: private staged ZIP uploads and asynchronous processing queue.

create table if not exists public.teacher_upload_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  requested_by uuid not null references public.accounts(id) on delete cascade,
  upload_kind text not null check (upload_kind in ('private-bank','course-release')),
  course_key text,
  unit_key text,
  original_filename text not null,
  object_path text not null,
  file_size_bytes bigint not null check (file_size_bytes > 0 and file_size_bytes <= 157286400),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  status text not null default 'created' check (status in ('created','uploaded','queued','processing','pr-opened','completed','failed','cancelled')),
  progress integer not null default 0 check (progress between 0 and 100),
  stage text not null default 'Waiting for upload',
  result jsonb not null default '{}'::jsonb,
  error_message text,
  github_pr_url text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, sha256, upload_kind)
);

create index if not exists teacher_upload_requests_queue_idx
  on public.teacher_upload_requests(status, created_at);
create index if not exists teacher_upload_requests_org_idx
  on public.teacher_upload_requests(organization_id, created_at desc);

alter table public.teacher_upload_requests enable row level security;
revoke all on public.teacher_upload_requests from public, anon, authenticated;
grant all on public.teacher_upload_requests to service_role;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('teacher-upload-staging','teacher-upload-staging',false,157286400,array['application/zip','application/octet-stream'])
on conflict (id) do update set
  public=false,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

comment on table public.teacher_upload_requests is
  'Teacher/admin upload queue. ZIP files remain private in staging and are processed by protected GitHub Actions.';
