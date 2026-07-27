-- ECHS Mathematics: authenticated private Blackboard banks with direct lesson mapping.
-- Source payloads stay server-only. Publisher-key items may be used in authenticated
-- course practice without a manual Question Trust review, while their independent
-- audit status remains explicit in the payload and learning evidence.

create table if not exists public.private_bank_packages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  bank_code text not null,
  bank_slug text not null,
  display_aliases jsonb not null default '{}'::jsonb,
  package_fingerprint text not null,
  package_sha256 text not null check (package_sha256 ~ '^[0-9a-f]{64}$'),
  package_size_bytes bigint not null default 0 check (package_size_bytes >= 0),
  question_count integer not null default 0 check (question_count >= 0),
  pool_count integer not null default 0 check (pool_count >= 0),
  media_count integer not null default 0 check (media_count >= 0),
  access text not null default 'private-school-authenticated' check (access in ('private-school-authenticated','private-teacher-archive')),
  trust_default text not null default 'publisher_key_direct' check (trust_default in ('publisher_key_direct','teacher_review_required')),
  deployment_state text not null default 'registered',
  storage_bucket text not null default 'private-question-banks',
  storage_path text,
  manifest jsonb not null default '{}'::jsonb,
  imported_by uuid references public.accounts(id) on delete set null,
  imported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, bank_code),
  unique (organization_id, bank_slug)
);

create table if not exists public.private_bank_questions (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  question_id text not null,
  package_id uuid not null references public.private_bank_packages(id) on delete cascade,
  bank_code text not null,
  pool_id text,
  chapter integer,
  section text,
  question_type text not null,
  course_keys text[] not null default '{}',
  lesson_keys text[] not null default '{}',
  skill_candidates text[] not null default '{}',
  course_mappings jsonb not null default '[]'::jsonb,
  mapping_verified boolean not null default false,
  trust_tier text not null default 'publisher_key_direct' check (trust_tier in (
    'publisher_key_direct',
    'student_ready_verified',
    'teacher_review_required',
    'indexed_only',
    'rights_restricted'
  )),
  student_visible boolean not null default false,
  payload_sha256 text not null check (payload_sha256 ~ '^[0-9a-f]{64}$'),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, question_id)
);

create table if not exists public.private_bank_media_objects (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  package_id uuid not null references public.private_bank_packages(id) on delete cascade,
  object_path text not null,
  source_path text not null,
  chapter integer,
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  mime_type text,
  uploaded_at timestamptz not null default now(),
  primary key (organization_id, object_path)
);

create table if not exists public.private_bank_import_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  package_id uuid references public.private_bank_packages(id) on delete set null,
  bank_code text not null,
  package_sha256 text not null,
  status text not null check (status in ('started','questions-uploaded','media-uploaded','completed','failed')),
  question_count integer not null default 0,
  media_count integer not null default 0,
  error_message text,
  created_by uuid references public.accounts(id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists private_bank_packages_org_state_idx
  on public.private_bank_packages(organization_id, deployment_state, bank_code);
create index if not exists private_bank_questions_package_idx
  on public.private_bank_questions(package_id, chapter, pool_id);
create index if not exists private_bank_questions_course_idx
  on public.private_bank_questions using gin(course_keys);
create index if not exists private_bank_questions_lesson_idx
  on public.private_bank_questions using gin(lesson_keys);
create index if not exists private_bank_questions_skill_idx
  on public.private_bank_questions using gin(skill_candidates);
create index if not exists private_bank_questions_trust_idx
  on public.private_bank_questions(organization_id, trust_tier, student_visible, mapping_verified);
create index if not exists private_bank_media_package_idx
  on public.private_bank_media_objects(package_id, chapter);

create or replace function private.enforce_private_bank_question_release()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if new.student_visible then
    if new.mapping_verified is not true
      or coalesce(array_length(new.lesson_keys, 1), 0) < 2
      or coalesce(array_length(new.skill_candidates, 1), 0) < 2
      or new.trust_tier not in ('publisher_key_direct', 'student_ready_verified')
    then
      raise exception 'Private bank question % is missing direct course, lesson, or skill mapping', new.question_id;
    end if;

    if new.trust_tier = 'publisher_key_direct' and (
      coalesce((new.payload #>> '{trust,source_verified}')::boolean, false) is not true
      or coalesce((new.payload #>> '{trust,media_verified}')::boolean, false) is not true
      or coalesce((new.payload #>> '{trust,mapping_verified}')::boolean, false) is not true
      or coalesce(new.payload #>> '{trust,verification_basis}', '') <> 'publisher-answer-key'
      or coalesce((new.payload #>> '{trust,manual_question_trust_required}')::boolean, true) is not false
      or coalesce((new.payload #>> '{rights,student_publication_allowed}')::boolean, false) is not true
      or coalesce((new.payload #>> '{metadata,student_ready}')::boolean, false) is not true
    ) then
      raise exception 'Private bank question % is missing the publisher-key direct-use contract', new.question_id;
    end if;

    if new.trust_tier = 'student_ready_verified' then
      if not exists (
        select 1
        from public.question_trust_records trust
        where trust.question_id = new.question_id
          and trust.trust_tier = 'student_ready_verified'
          and trust.student_visible is true
          and trust.source_verified is true
          and trust.mathematical_verified is true
          and trust.media_verified is true
          and trust.mapping_verified is true
      ) then
        raise exception 'Verified private bank question % does not have complete Question Trust evidence', new.question_id;
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists private_bank_question_release_guard on public.private_bank_questions;
create trigger private_bank_question_release_guard
before insert or update of student_visible, mapping_verified, trust_tier, question_id, lesson_keys, skill_candidates, payload
on public.private_bank_questions
for each row execute function private.enforce_private_bank_question_release();

alter table public.private_bank_packages enable row level security;
alter table public.private_bank_questions enable row level security;
alter table public.private_bank_media_objects enable row level security;
alter table public.private_bank_import_runs enable row level security;

revoke all on public.private_bank_packages from public, anon, authenticated;
revoke all on public.private_bank_questions from public, anon, authenticated;
revoke all on public.private_bank_media_objects from public, anon, authenticated;
revoke all on public.private_bank_import_runs from public, anon, authenticated;
grant all on public.private_bank_packages to service_role;
grant all on public.private_bank_questions to service_role;
grant all on public.private_bank_media_objects to service_role;
grant all on public.private_bank_import_runs to service_role;

revoke all on function private.enforce_private_bank_question_release() from public, anon, authenticated;
grant execute on function private.enforce_private_bank_question_release() to service_role;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'private-question-banks',
  'private-question-banks',
  false,
  104857600,
  array['application/zip','application/json','image/png','image/jpeg','image/gif','image/svg+xml','image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

comment on table public.private_bank_packages is 'Private school-authenticated package inventory. Publisher payloads are not published through GitHub Pages.';
comment on table public.private_bank_questions is 'Authenticated publisher-key practice questions with deterministic AP Precalculus and IB lesson mappings. Independent audit status is retained separately.';
comment on table public.private_bank_media_objects is 'Private storage object inventory for imported Blackboard figures and media.';
