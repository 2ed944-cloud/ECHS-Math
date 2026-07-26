-- ECHS Mathematics institutional account and learning platform
-- Phase 3: custom username/password accounts, role-based access and cloud sync.
-- Apply with: supabase db push

create extension if not exists pgcrypto;
create extension if not exists citext;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug citext not null unique,
  settings jsonb not null default jsonb_build_object(
    'teachers_can_view_all_accounts', true,
    'teachers_can_reset_student_passwords', true,
    'students_can_change_passwords', false,
    'session_hours', 12,
    'remember_session_days', 30
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  username citext not null,
  display_name text not null,
  email citext,
  role text not null check (role in ('admin','teacher','student','parent')),
  status text not null default 'active' check (status in ('active','suspended','archived')),
  external_id text,
  grade text,
  avatar_url text,
  can_manage_accounts boolean not null default false,
  created_by uuid references public.accounts(id) on delete set null,
  last_login_at timestamptz,
  password_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (username),
  unique (organization_id, username)
);

create index if not exists accounts_org_role_idx on public.accounts(organization_id, role, status);
create index if not exists accounts_email_idx on public.accounts(organization_id, email);
create unique index if not exists accounts_org_external_id_idx
  on public.accounts(organization_id, external_id) where external_id is not null;

create table if not exists private.account_credentials (
  account_id uuid primary key references public.accounts(id) on delete cascade,
  password_hash text not null,
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  password_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists private.sessions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  user_agent_hash text,
  ip_hash text,
  created_at timestamptz not null default now()
);
create index if not exists sessions_account_idx on private.sessions(account_id, expires_at desc);
create index if not exists sessions_active_idx on private.sessions(token_hash)
  where revoked_at is null;

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  course_key text not null,
  academic_year text,
  section text,
  status text not null default 'active' check (status in ('active','archived')),
  created_by uuid not null references public.accounts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists classes_org_idx on public.classes(organization_id, status);

create table if not exists public.class_memberships (
  class_id uuid not null references public.classes(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  membership_role text not null check (membership_role in ('teacher','student')),
  joined_at timestamptz not null default now(),
  primary key (class_id, account_id)
);
create index if not exists class_members_account_idx on public.class_memberships(account_id, membership_role);

create table if not exists public.parent_student_links (
  parent_id uuid not null references public.accounts(id) on delete cascade,
  student_id uuid not null references public.accounts(id) on delete cascade,
  relationship_label text default 'Parent/Guardian',
  created_at timestamptz not null default now(),
  primary key (parent_id, student_id)
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  created_by uuid not null references public.accounts(id),
  title text not null,
  description text,
  activity_type text not null check (activity_type in ('practice','adaptive','review','exam','lesson')),
  configuration jsonb not null default '{}'::jsonb,
  available_at timestamptz not null default now(),
  due_at timestamptz,
  status text not null default 'published' check (status in ('draft','published','closed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists assignments_class_idx on public.assignments(class_id, status, due_at);

create table if not exists public.assignment_results (
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.accounts(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started','in_progress','submitted','returned')),
  score numeric,
  correct integer,
  total integer,
  duration_seconds integer,
  payload jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  submitted_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (assignment_id, student_id)
);

create table if not exists public.learning_attempts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  client_event_id text not null,
  question_id text not null,
  course text,
  unit text,
  topic text,
  correct boolean not null,
  response text,
  mode text,
  bank_code text,
  assignment_id uuid references public.assignments(id) on delete set null,
  occurred_at timestamptz not null,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  unique (account_id, client_event_id)
);
create index if not exists learning_attempts_account_time_idx on public.learning_attempts(account_id, occurred_at desc);
create index if not exists learning_attempts_scope_idx on public.learning_attempts(organization_id, course, unit, topic);

create table if not exists public.learning_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  client_session_id text not null,
  mode text not null,
  course text,
  unit text,
  topic text,
  assignment_id uuid references public.assignments(id) on delete set null,
  correct integer not null default 0,
  total integer not null default 0,
  duration_seconds integer not null default 0,
  started_at timestamptz not null,
  completed_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  unique (account_id, client_session_id)
);

create table if not exists public.mastery_records (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  skill_key text not null,
  course text,
  unit text,
  topic text,
  title text,
  score numeric not null default 0 check (score >= 0 and score <= 100),
  attempts integer not null default 0,
  correct integer not null default 0,
  evidence numeric not null default 0 check (evidence >= 0 and evidence <= 1),
  updated_at timestamptz not null default now(),
  primary key (account_id, skill_key)
);
create index if not exists mastery_org_scope_idx on public.mastery_records(organization_id, course, unit);

create table if not exists public.review_items (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  question_id text not null,
  course text,
  unit text,
  topic text,
  status text not null default 'open' check (status in ('open','recovered','dismissed')),
  due_at timestamptz not null default now(),
  interval_days integer not null default 1,
  wrong_count integer not null default 0,
  correct_recovery_count integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (account_id, question_id)
);

create table if not exists public.account_audit_log (
  id bigserial primary key,
  organization_id uuid references public.organizations(id) on delete cascade,
  actor_id uuid references public.accounts(id) on delete set null,
  target_account_id uuid references public.accounts(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
create index if not exists audit_org_time_idx on public.account_audit_log(organization_id, occurred_at desc);

alter table public.organizations enable row level security;
alter table public.accounts enable row level security;
alter table public.classes enable row level security;
alter table public.class_memberships enable row level security;
alter table public.parent_student_links enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_results enable row level security;
alter table public.learning_attempts enable row level security;
alter table public.learning_sessions enable row level security;
alter table public.mastery_records enable row level security;
alter table public.review_items enable row level security;
alter table public.account_audit_log enable row level security;

revoke all on all tables in schema public from anon, authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

create or replace function private.password_is_strong(p_password text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select length(p_password) >= 10
    and p_password ~ '[a-z]'
    and p_password ~ '[A-Z]'
    and p_password ~ '[0-9]'
    and p_password ~ '[^A-Za-z0-9]';
$$;

create or replace function private.normalise_username(p_username text)
returns public.citext
language sql
immutable
set search_path = ''
as $$
  select lower(trim(p_username))::public.citext;
$$;

create or replace function public.api_bootstrap_admin(
  p_organization_name text,
  p_organization_slug text,
  p_username text,
  p_display_name text,
  p_email text,
  p_password text
)
returns table(account_id uuid, organization_id uuid, username citext, display_name text, role text)
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  v_org_id uuid;
  v_account_id uuid;
  v_username citext;
begin
  if exists(select 1 from public.accounts where role = 'admin') then
    raise exception 'Bootstrap is already complete';
  end if;
  if not private.password_is_strong(p_password) then
    raise exception 'Password does not meet the minimum policy';
  end if;
  v_username := private.normalise_username(p_username);
  if v_username::text !~ '^[a-z0-9._-]{3,40}$' then
    raise exception 'Invalid username';
  end if;

  insert into public.organizations(name, slug)
  values (trim(p_organization_name), lower(trim(p_organization_slug))::citext)
  returning id into v_org_id;

  insert into public.accounts(
    organization_id, username, display_name, email, role, can_manage_accounts
  ) values (
    v_org_id, v_username, trim(p_display_name), nullif(trim(p_email),'')::citext,
    'admin', true
  ) returning id into v_account_id;

  insert into private.account_credentials(account_id, password_hash)
  values (v_account_id, crypt(p_password, gen_salt('bf', 12)));

  insert into public.account_audit_log(organization_id, actor_id, target_account_id, action)
  values (v_org_id, v_account_id, v_account_id, 'bootstrap_admin');

  return query
    select a.id, a.organization_id, a.username, a.display_name, a.role
    from public.accounts a where a.id = v_account_id;
end;
$$;

create or replace function public.api_create_account(
  p_actor_id uuid,
  p_organization_id uuid,
  p_username text,
  p_display_name text,
  p_email text,
  p_role text,
  p_password text,
  p_external_id text default null,
  p_grade text default null,
  p_can_manage_accounts boolean default false
)
returns public.accounts
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  v_actor public.accounts;
  v_account public.accounts;
  v_username citext;
begin
  select * into v_actor from public.accounts where id = p_actor_id and status = 'active';
  if not found or v_actor.organization_id <> p_organization_id then
    raise exception 'Not authorised';
  end if;
  if v_actor.role <> 'admin'
     and not (v_actor.role = 'teacher' and v_actor.can_manage_accounts and p_role in ('student','parent')) then
    raise exception 'Not authorised to create this role';
  end if;
  if p_role not in ('admin','teacher','student','parent') then
    raise exception 'Invalid role';
  end if;
  if not private.password_is_strong(p_password) then
    raise exception 'Password does not meet the minimum policy';
  end if;
  v_username := private.normalise_username(p_username);
  if v_username::text !~ '^[a-z0-9._-]{3,40}$' then
    raise exception 'Invalid username';
  end if;

  insert into public.accounts(
    organization_id, username, display_name, email, role, external_id, grade,
    can_manage_accounts, created_by
  ) values (
    p_organization_id, v_username, trim(p_display_name), nullif(trim(p_email),'')::citext,
    p_role, nullif(trim(p_external_id),''), nullif(trim(p_grade),''),
    case when p_role in ('admin','teacher') then p_can_manage_accounts else false end,
    p_actor_id
  ) returning * into v_account;

  insert into private.account_credentials(account_id, password_hash)
  values (v_account.id, crypt(p_password, gen_salt('bf', 12)));

  insert into public.account_audit_log(
    organization_id, actor_id, target_account_id, action, details
  ) values (
    p_organization_id, p_actor_id, v_account.id, 'create_account',
    jsonb_build_object('role', p_role, 'username', v_username)
  );

  return v_account;
end;
$$;

create or replace function public.api_verify_login(
  p_username text,
  p_password text
)
returns table(
  account_id uuid,
  organization_id uuid,
  username citext,
  display_name text,
  email citext,
  role text,
  status text,
  grade text,
  can_manage_accounts boolean,
  organization_name text,
  organization_settings jsonb
)
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  v_account public.accounts;
  v_credential private.account_credentials;
begin
  select a.* into v_account
  from public.accounts a
  where a.username = private.normalise_username(p_username)
  order by a.created_at asc
  limit 1;

  if not found then
    perform pg_sleep(0.15);
    return;
  end if;

  select * into v_credential
  from private.account_credentials c
  where c.account_id = v_account.id
  for update;

  if v_account.status <> 'active'
     or (v_credential.locked_until is not null and v_credential.locked_until > now()) then
    perform pg_sleep(0.15);
    return;
  end if;

  if v_credential.password_hash <> crypt(p_password, v_credential.password_hash) then
    update private.account_credentials
      set failed_attempts = failed_attempts + 1,
          locked_until = case when failed_attempts + 1 >= 5 then now() + interval '10 minutes' else locked_until end,
          updated_at = now()
    where account_id = v_account.id;
    perform pg_sleep(0.15);
    return;
  end if;

  update private.account_credentials
    set failed_attempts = 0, locked_until = null, updated_at = now()
  where account_id = v_account.id;

  update public.accounts set last_login_at = now(), updated_at = now()
  where id = v_account.id;

  return query
  select a.id, a.organization_id, a.username, a.display_name, a.email, a.role,
         a.status, a.grade, a.can_manage_accounts, o.name, o.settings
  from public.accounts a
  join public.organizations o on o.id = a.organization_id
  where a.id = v_account.id;
end;
$$;

create or replace function public.api_create_session(
  p_account_id uuid,
  p_token_hash text,
  p_expires_at timestamptz,
  p_user_agent_hash text default null,
  p_ip_hash text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, private
as $$
declare v_id uuid;
begin
  delete from private.sessions
  where account_id = p_account_id
    and (expires_at < now() or revoked_at is not null);
  insert into private.sessions(account_id, token_hash, expires_at, user_agent_hash, ip_hash)
  values (p_account_id, p_token_hash, p_expires_at, p_user_agent_hash, p_ip_hash)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.api_session_lookup(p_token_hash text)
returns table(
  session_id uuid,
  account_id uuid,
  organization_id uuid,
  username citext,
  display_name text,
  email citext,
  role text,
  status text,
  grade text,
  can_manage_accounts boolean,
  organization_name text,
  organization_settings jsonb,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public, private
as $$
begin
  update private.sessions
    set last_seen_at = now()
  where token_hash = p_token_hash
    and revoked_at is null
    and expires_at > now();

  return query
  select s.id, a.id, a.organization_id, a.username, a.display_name, a.email,
         a.role, a.status, a.grade, a.can_manage_accounts, o.name, o.settings,
         s.expires_at
  from private.sessions s
  join public.accounts a on a.id = s.account_id
  join public.organizations o on o.id = a.organization_id
  where s.token_hash = p_token_hash
    and s.revoked_at is null
    and s.expires_at > now()
    and a.status = 'active';
end;
$$;

create or replace function public.api_revoke_session(p_token_hash text)
returns void
language sql
security definer
set search_path = private
as $$
  update private.sessions set revoked_at = now()
  where token_hash = p_token_hash and revoked_at is null;
$$;

create or replace function public.api_reset_password(
  p_actor_id uuid,
  p_target_id uuid,
  p_new_password text
)
returns void
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  v_actor public.accounts;
  v_target public.accounts;
  v_settings jsonb;
  v_allowed boolean := false;
begin
  if not private.password_is_strong(p_new_password) then
    raise exception 'Password does not meet the minimum policy';
  end if;

  select * into v_actor from public.accounts where id = p_actor_id and status = 'active';
  select * into v_target from public.accounts where id = p_target_id;
  if v_actor.id is null or v_target.id is null or v_actor.organization_id <> v_target.organization_id then
    raise exception 'Not authorised';
  end if;

  select settings into v_settings from public.organizations where id = v_actor.organization_id;

  if v_actor.role = 'admin' then
    v_allowed := true;
  elsif v_actor.role = 'teacher'
    and v_target.role = 'student'
    and coalesce((v_settings->>'teachers_can_reset_student_passwords')::boolean, false) then
    v_allowed := coalesce((v_settings->>'teachers_can_view_all_accounts')::boolean, false)
      or exists(
        select 1
        from public.class_memberships teacher_membership
        join public.class_memberships student_membership
          on student_membership.class_id = teacher_membership.class_id
        where teacher_membership.account_id = v_actor.id
          and teacher_membership.membership_role = 'teacher'
          and student_membership.account_id = v_target.id
          and student_membership.membership_role = 'student'
      );
  end if;

  if not v_allowed then raise exception 'Not authorised'; end if;

  update private.account_credentials
    set password_hash = crypt(p_new_password, gen_salt('bf', 12)),
        failed_attempts = 0,
        locked_until = null,
        password_version = password_version + 1,
        updated_at = now()
  where account_id = p_target_id;

  update public.accounts set password_updated_at = now(), updated_at = now()
  where id = p_target_id;

  update private.sessions set revoked_at = now()
  where account_id = p_target_id and revoked_at is null;

  insert into public.account_audit_log(
    organization_id, actor_id, target_account_id, action
  ) values (
    v_actor.organization_id, v_actor.id, v_target.id, 'reset_password'
  );
end;
$$;

create or replace function public.api_set_account_status(
  p_actor_id uuid,
  p_target_id uuid,
  p_status text
)
returns public.accounts
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.accounts;
  v_target public.accounts;
begin
  if p_status not in ('active','suspended','archived') then raise exception 'Invalid status'; end if;
  select * into v_actor from public.accounts where id = p_actor_id and status = 'active';
  select * into v_target from public.accounts where id = p_target_id;
  if v_actor.id is null or v_target.id is null or v_actor.organization_id <> v_target.organization_id or v_actor.role <> 'admin' then
    raise exception 'Not authorised';
  end if;
  if v_actor.id = v_target.id and p_status <> 'active' then
    raise exception 'An administrator cannot suspend their own active account';
  end if;

  update public.accounts set status = p_status, updated_at = now()
  where id = p_target_id returning * into v_target;

  if p_status <> 'active' then
    update private.sessions set revoked_at = now()
    where account_id = p_target_id and revoked_at is null;
  end if;

  insert into public.account_audit_log(
    organization_id, actor_id, target_account_id, action, details
  ) values (
    v_actor.organization_id, v_actor.id, v_target.id, 'set_account_status',
    jsonb_build_object('status', p_status)
  );

  return v_target;
end;
$$;

revoke all on function public.api_bootstrap_admin(text,text,text,text,text,text) from public, anon, authenticated;
revoke all on function public.api_create_account(uuid,uuid,text,text,text,text,text,text,text,boolean) from public, anon, authenticated;
revoke all on function public.api_verify_login(text,text) from public, anon, authenticated;
revoke all on function public.api_create_session(uuid,text,timestamptz,text,text) from public, anon, authenticated;
revoke all on function public.api_session_lookup(text) from public, anon, authenticated;
revoke all on function public.api_revoke_session(text) from public, anon, authenticated;
revoke all on function public.api_reset_password(uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.api_set_account_status(uuid,uuid,text) from public, anon, authenticated;

grant execute on function public.api_bootstrap_admin(text,text,text,text,text,text) to service_role;
grant execute on function public.api_create_account(uuid,uuid,text,text,text,text,text,text,text,boolean) to service_role;
grant execute on function public.api_verify_login(text,text) to service_role;
grant execute on function public.api_create_session(uuid,text,timestamptz,text,text) to service_role;
grant execute on function public.api_session_lookup(text) to service_role;
grant execute on function public.api_revoke_session(text) to service_role;
grant execute on function public.api_reset_password(uuid,uuid,text) to service_role;
grant execute on function public.api_set_account_status(uuid,uuid,text) to service_role;
