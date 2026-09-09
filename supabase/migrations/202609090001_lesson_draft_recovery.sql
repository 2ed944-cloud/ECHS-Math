-- ECHS-011: account-owned offline checkpoint encryption material.
-- This is not a new lesson store and does not authorize publication or sync.
begin;

-- pgcrypto lives in public in the isolated baseline and extensions on Supabase.
-- Resolve only the installed extension namespace at migration time; never use a
-- client-controlled name or a writable schema in a SECURITY DEFINER search_path.
do $$
declare extension_schema name;
begin
  select n.nspname into strict extension_schema from pg_extension e join pg_namespace n on n.oid=e.extnamespace where e.extname='pgcrypto';
  execute format('create function private.lesson_recovery_random_key() returns bytea language sql volatile set search_path=pg_catalog as %L',
    format('select %I.gen_random_bytes(32)',extension_schema));
end;
$$;

create table private.lesson_draft_recovery_keys (
  account_id uuid not null,
  organization_id uuid not null,
  class_id uuid not null,
  lesson_id uuid not null,
  key_id uuid not null default gen_random_uuid() unique,
  key_material bytea not null check(octet_length(key_material)=32),
  created_at timestamptz not null default clock_timestamp(),
  primary key(account_id,organization_id,class_id,lesson_id),
  constraint lesson_recovery_account_tenant foreign key(organization_id,account_id) references public.accounts(organization_id,id) on delete restrict,
  constraint lesson_recovery_class_tenant foreign key(organization_id,class_id) references public.classes(organization_id,id) on delete restrict,
  constraint lesson_recovery_lesson_tenant foreign key(organization_id,lesson_id) references public.authored_lessons(organization_id,id) on delete restrict
);

create function private.lesson_recovery_key_guard()
returns trigger language plpgsql set search_path=pg_catalog as $$
begin
  if tg_op<>'INSERT' then raise exception 'Recovery keys are immutable' using errcode='23514'; end if;
  if not exists(select 1 from public.authored_lessons l where l.id=new.lesson_id and l.organization_id=new.organization_id and l.class_id=new.class_id) then
    raise exception 'Exact recovery lesson scope required' using errcode='23514'; end if;
  return new;
end;
$$;
create trigger lesson_recovery_key_immutable before insert or update or delete on private.lesson_draft_recovery_keys
  for each row execute function private.lesson_recovery_key_guard();
create trigger lesson_recovery_key_no_truncate before truncate on private.lesson_draft_recovery_keys
  for each statement execute function private.lesson_append_only();
alter table private.lesson_draft_recovery_keys enable row level security;
revoke all on private.lesson_draft_recovery_keys from public,anon,authenticated,service_role;

create function public.lesson_draft_recovery_key(p_token_hash text,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare context jsonb; lesson public.authored_lessons%rowtype; material private.lesson_draft_recovery_keys%rowtype;
  selected_lesson uuid; actor_id uuid; session_expires_at timestamptz;
begin
  if private.lesson_keys(p_payload,array['lesson_id'],array['lesson_id']) is not true
    or octet_length(p_payload::text)>128 or private.lesson_json_valid(p_payload->'lesson_id','uuid') is not true then
    raise exception 'Exact recovery lesson identifier required' using errcode='22023'; end if;
  selected_lesson:=(p_payload->>'lesson_id')::uuid;
  -- Original staff/get performs current account, session, tenant, class and
  -- teacher-membership authorization and retains its transaction locks. It also
  -- intentionally permits authorized history recovery after an active pin ends.
  context:=public.lesson_store(p_token_hash,'get',jsonb_build_object('lesson_id',selected_lesson));
  select l.* into strict lesson from public.authored_lessons l where l.id=selected_lesson;
  select s.account_id,s.expires_at into strict actor_id,session_expires_at from private.sessions s where s.token_hash=p_token_hash;
  select k.* into material from private.lesson_draft_recovery_keys k where k.account_id=actor_id and k.organization_id=lesson.organization_id
    and k.class_id=lesson.class_id and k.lesson_id=lesson.id for share;
  if not found then
    insert into private.lesson_draft_recovery_keys(account_id,organization_id,class_id,lesson_id,key_material)
      values(actor_id,lesson.organization_id,lesson.class_id,lesson.id,private.lesson_recovery_random_key())
      on conflict(account_id,organization_id,class_id,lesson_id) do nothing;
    select k.* into strict material from private.lesson_draft_recovery_keys k where k.account_id=actor_id and k.organization_id=lesson.organization_id
      and k.class_id=lesson.class_id and k.lesson_id=lesson.id for share;
  end if;
  -- Session rows cannot change under the existing locks, but the clock can pass
  -- expiry during key-row/uniqueness waits. Any newly inserted key rolls back.
  if session_expires_at<=clock_timestamp() then raise exception 'School session expired' using errcode='28000'; end if;
  return jsonb_build_object('ok',true,'contract','echs.lesson.recovery.v1','account_id',actor_id,'organization_id',lesson.organization_id,
    'class_id',lesson.class_id,'lesson_id',lesson.id,'key_id',material.key_id,'key_base64',encode(material.key_material,'base64'));
end;
$$;

create function public.lesson_recovery_capabilities()
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
begin
  if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='private'
    and c.relname='lesson_draft_recovery_keys' and c.relrowsecurity) then return null; end if;
  if exists(select 1 from unnest(array['anon','authenticated','service_role']) r(role_name)
    where has_table_privilege(r.role_name::name,'private.lesson_draft_recovery_keys','SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
      or has_any_column_privilege(r.role_name::name,'private.lesson_draft_recovery_keys','SELECT,INSERT,UPDATE,REFERENCES')) then return null; end if;
  if octet_length(private.lesson_recovery_random_key())<>32 then return null; end if;
  return '{"contract":"echs.lesson.recovery.v1","cipher":"AES-256-GCM","checkpoint_version":1,"max_plaintext_bytes":4194304}'::jsonb;
end;
$$;

revoke all on function private.lesson_recovery_random_key(),private.lesson_recovery_key_guard(),
  public.lesson_draft_recovery_key(text,jsonb),public.lesson_recovery_capabilities() from public,anon,authenticated,service_role;
grant execute on function public.lesson_draft_recovery_key(text,jsonb),public.lesson_recovery_capabilities() to service_role;
comment on table private.lesson_draft_recovery_keys is 'Immutable 32-byte recovery keys per account/org/class/lesson. Trusted backend only; current original staff authorization required for every release. Never log or persist browser keys.';
comment on function public.lesson_draft_recovery_key(text,jsonb) is 'Service-only recovery key release. No lesson, publication, mastery or revision mutation; no client identity claims. Key retirement requires a separate retention design.';
commit;
