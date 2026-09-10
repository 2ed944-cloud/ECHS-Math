-- C08 archive foundation only. No existing provider/table rewrite, seed, or delivery grant.
begin;

do $$
declare extension_schema name;
begin
  select n.nspname into strict extension_schema from pg_extension e join pg_namespace n on n.oid=e.extnamespace where e.extname='pgcrypto';
  execute format('create function private.bank_snapshot_hash(value bytea) returns text language sql immutable set search_path=pg_catalog as %L',
    format('select encode(%I.digest(value,''sha256''),''hex'')',extension_schema));
end;
$$;

create function private.bank_snapshot_frame(fields text[])
returns bytea language plpgsql immutable set search_path=pg_catalog as $$
declare result bytea:=''::bytea; item text; bytes bytea;
begin
  foreach item in array fields loop
    if item is null then raise exception 'Non-null hash field required' using errcode='22023'; end if;
    bytes:=convert_to(item,'UTF8');result:=result||int4send(octet_length(bytes))||bytes;
  end loop;
  return result;
end;
$$;

create function private.bank_snapshot_value(value jsonb,kind text)
returns boolean language plpgsql immutable set search_path=pg_catalog as $$
declare text_value text;
begin
  if value is null or value='null'::jsonb then return false; end if;
  if kind='integer' then return jsonb_typeof(value)='number' and value::text collate "C" ~ '^(0|[1-9][0-9]{0,9})$'; end if;
  if jsonb_typeof(value)<>'string' then return false; end if;
  text_value:=value#>>'{}';
  if kind='uuid' then return private.lesson_json_valid(value,'uuid') is true and text_value collate "C" ~ '^[0-9a-f-]{36}$'; end if;
  if kind='hash' then return text_value collate "C" ~ '^[0-9a-f]{64}$'; end if;
  if kind='commit' then return text_value collate "C" ~ '^[0-9a-f]{40}$'; end if;
  if kind='id' then return length(text_value) between 1 and 160 and text_value collate "C" ~ '^[A-Za-z0-9][A-Za-z0-9_.:-]*$'; end if;
  if kind='path' then return length(text_value) between 1 and 512 and text_value collate "C" ~ '^[A-Za-z0-9_][A-Za-z0-9_./-]*$'
    and text_value collate "C" !~ '(^|/)\.{1,2}(/|$)' and text_value collate "C" !~ '//' and right(text_value,1)<>'/'; end if;
  if kind='evidence' then return length(text_value) between 1 and 2048 and text_value ~ '[^[:space:]]' and text_value !~ '[[:cntrl:]]'; end if;
  return false;
end;
$$;

create function private.bank_snapshot_banks_valid(value text[])
returns boolean language sql immutable set search_path=pg_catalog as $$
  select coalesce(array_ndims(value)=1 and cardinality(value) between 1 and 3
    and value collate "C" <@array['ADAMS10','CALCT3BC','PEARSON_CH0']::text[]
    and cardinality(value)=(select count(distinct x) from unnest(value) x),false);
$$;

create table public.private_bank_snapshots (
  id uuid primary key,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  collection_key text not null check(private.bank_snapshot_value(to_jsonb(collection_key),'id')),
  bank_codes text[] not null check(private.bank_snapshot_banks_valid(bank_codes)),
  source_main text not null check(source_main collate "C" ~ '^[0-9a-f]{40}$'),
  contract_version integer not null default 1 check(contract_version=1),
  manifest_sha256 text not null check(manifest_sha256 collate "C" ~ '^[0-9a-f]{64}$'),
  expected_question_count integer not null check(expected_question_count between 1 and 10000),
  expected_file_count integer not null check(expected_file_count between 1 and 25000),
  expected_media_count integer not null check(expected_media_count between 0 and 25000 and expected_media_count<expected_file_count),
  expected_manifest_count integer not null check(expected_manifest_count between 0 and 1),
  expected_occurrence_count integer not null check(expected_occurrence_count between 1 and 100000),
  expected_dependency_count integer not null check(expected_dependency_count between 0 and 100000),
  expected_mapping_count integer not null check(expected_mapping_count between 0 and 100000),
  expected_total_bytes bigint not null check(expected_total_bytes between 1 and 268435456),
  question_root text not null check(question_root collate "C" ~ '^[0-9a-f]{64}$'),
  file_root text not null check(file_root collate "C" ~ '^[0-9a-f]{64}$'),
  membership_root text not null check(membership_root collate "C" ~ '^[0-9a-f]{64}$'),
  mapping_root text not null check(mapping_root collate "C" ~ '^[0-9a-f]{64}$'),
  unit_review_sets jsonb not null check(jsonb_typeof(unit_review_sets)='array' and jsonb_array_length(unit_review_sets)<=100 and octet_length(unit_review_sets::text)<=262144),
  reserve_request jsonb not null check(jsonb_typeof(reserve_request)='object' and octet_length(reserve_request::text)<=1048576),
  state text not null default 'staging' check(state in ('staging','ready','aborted')),
  created_by uuid not null,
  created_at timestamptz not null default clock_timestamp(),
  ready_at timestamptz,
  aborted_at timestamptz,
  unique(organization_id,id),
  unique(organization_id,collection_key,manifest_sha256),
  foreign key(organization_id,created_by) references public.accounts(organization_id,id) on delete restrict,
  check((state='staging' and ready_at is null and aborted_at is null) or (state='ready' and ready_at is not null and aborted_at is null) or (state='aborted' and ready_at is null and aborted_at is not null))
);

create table public.private_bank_snapshot_files (
  organization_id uuid not null,
  snapshot_id uuid not null,
  file_id uuid not null,
  kind text not null check(kind in ('source-json','media','manifest')),
  source_path text not null check(private.bank_snapshot_value(to_jsonb(source_path),'path')),
  mime_type text not null check(mime_type in ('application/json','image/svg+xml','image/png','image/jpeg','image/webp','image/gif')),
  byte_length integer not null check(byte_length between 1 and 16777216),
  sha256 text not null check(sha256 collate "C" ~ '^[0-9a-f]{64}$'),
  record_layout text,
  source_occurrence_count integer,
  source_record_root text,
  state text not null default 'reserved' check(state in ('reserved','verified')),
  verified_at timestamptz,
  source_content_verified_at timestamptz,
  primary key(organization_id,snapshot_id,file_id),
  unique(organization_id,snapshot_id,source_path),
  foreign key(organization_id,snapshot_id) references public.private_bank_snapshots(organization_id,id) on delete restrict,
  check((state='reserved' and verified_at is null and source_content_verified_at is null) or (state='verified' and verified_at is not null)),
  check(((kind='source-json' and mime_type='application/json' and record_layout in ('questions','review-questions') and source_occurrence_count between 1 and 100000 and source_record_root collate "C" ~ '^[0-9a-f]{64}$')
    or (kind<>'source-json' and record_layout is null and source_occurrence_count is null and source_record_root is null and source_content_verified_at is null)) is true),
  check((kind='media' and mime_type<>'application/json') or (kind<>'media' and mime_type='application/json'))
);

create table public.private_bank_snapshot_questions (
  organization_id uuid not null,
  snapshot_id uuid not null,
  question_id text not null check(private.bank_snapshot_value(to_jsonb(question_id),'id')),
  bank_code text not null check(bank_code in ('ADAMS10','CALCT3BC','PEARSON_CH0')),
  canonical_record_text text not null check(octet_length(canonical_record_text) between 2 and 65536),
  canonical_record_sha256 text not null check(canonical_record_sha256=private.bank_snapshot_hash(convert_to(canonical_record_text,'UTF8'))),
  payload jsonb generated always as (canonical_record_text::jsonb) stored,
  source_file_id uuid not null,
  source_record_index integer not null check(source_record_index between 0 and 99999),
  bundle_memberships jsonb not null check(jsonb_typeof(bundle_memberships)='array' and jsonb_array_length(bundle_memberships) between 1 and 100),
  source_provenance jsonb not null check(private.lesson_keys(source_provenance,array['source_path','source_sha256'],array['source_path','source_sha256']) is true),
  primary key(organization_id,snapshot_id,question_id),
  unique(organization_id,snapshot_id,source_file_id,source_record_index),
  foreign key(organization_id,snapshot_id) references public.private_bank_snapshots(organization_id,id) on delete restrict,
  foreign key(organization_id,snapshot_id,source_file_id) references public.private_bank_snapshot_files(organization_id,snapshot_id,file_id) on delete restrict,
  check((jsonb_typeof(payload)='object' and jsonb_typeof(payload->'id')='string' and payload->>'id'=question_id) is true)
);

create table public.private_bank_snapshot_question_files (
  organization_id uuid not null,
  snapshot_id uuid not null,
  question_id text not null,
  file_id uuid not null,
  dependency_kind text not null check(dependency_kind in ('direct-image','transitive-media')),
  primary key(organization_id,snapshot_id,question_id,file_id),
  foreign key(organization_id,snapshot_id,question_id) references public.private_bank_snapshot_questions(organization_id,snapshot_id,question_id) on delete restrict,
  foreign key(organization_id,snapshot_id,file_id) references public.private_bank_snapshot_files(organization_id,snapshot_id,file_id) on delete restrict
);

create table public.private_bank_snapshot_mappings (
  organization_id uuid not null,
  snapshot_id uuid not null,
  question_id text not null,
  course_version_id uuid not null references public.course_versions(id) on delete restrict,
  access_key text not null,
  bank_code text not null check(bank_code in ('ADAMS10','CALCT3BC','PEARSON_CH0')),
  catalog_route text not null check(private.bank_snapshot_value(to_jsonb(catalog_route),'path')),
  catalog_unit_index integer not null check(catalog_unit_index between 0 and 999),
  catalog_topic text not null check(private.bank_snapshot_value(to_jsonb(catalog_topic),'id')),
  catalog_position integer not null check(catalog_position between 0 and 99999),
  curriculum_mapping_status text not null check(curriculum_mapping_status in ('reviewed','unresolved')),
  rights_status text not null check(rights_status in ('school-practice-approved','archive-only','unresolved')),
  evidence_reference text not null check(private.bank_snapshot_value(to_jsonb(evidence_reference),'evidence')),
  reviewed_by uuid not null,
  reviewed_at timestamptz not null default clock_timestamp(),
  primary key(organization_id,snapshot_id,question_id,course_version_id,access_key),
  foreign key(organization_id,snapshot_id,question_id) references public.private_bank_snapshot_questions(organization_id,snapshot_id,question_id) on delete restrict,
  foreign key(organization_id,access_key) references public.lesson_catalog(organization_id,access_key) on delete restrict,
  foreign key(organization_id,reviewed_by) references public.accounts(organization_id,id) on delete restrict
);

create table public.private_bank_snapshot_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  snapshot_id uuid not null,
  actor_id uuid not null,
  event_type text not null check(event_type in ('reserve','records','mappings','register','verify_bytes','verify_records','seal','abort')),
  request_id uuid not null,
  request_sha256 text not null check(request_sha256 collate "C" ~ '^[0-9a-f]{64}$'),
  details jsonb not null default '{}' check(private.lesson_keys(details,array['count'],array[]::text[]) is true
    and (not(details?'count') or private.bank_snapshot_value(details->'count','integer'))),
  created_at timestamptz not null default clock_timestamp(),
  unique(organization_id,snapshot_id,request_id),
  foreign key(organization_id,snapshot_id) references public.private_bank_snapshots(organization_id,id) on delete restrict,
  foreign key(organization_id,actor_id) references public.accounts(organization_id,id) on delete restrict
);

create function private.bank_snapshot_guard()
returns trigger language plpgsql set search_path=pg_catalog as $$
declare parent public.private_bank_snapshots%rowtype;
begin
  if tg_op='TRUNCATE' then raise exception 'Immutable snapshot archive' using errcode='23514'; end if;
  if tg_table_name='private_bank_snapshots' then
    if tg_op='INSERT' then
      if new.state<>'staging' then raise exception 'Staging snapshot required' using errcode='23514'; end if;return new;
    end if;
    if tg_op='DELETE' or old.state<>'staging' or new.state not in ('ready','aborted')
      or (to_jsonb(new)-array['state','ready_at','aborted_at']) is distinct from (to_jsonb(old)-array['state','ready_at','aborted_at']) then
      raise exception 'Immutable snapshot identity and terminal state' using errcode='23514'; end if;
    return new;
  end if;
  if tg_op='DELETE' or (tg_op='UPDATE' and tg_table_name<>'private_bank_snapshot_files') then
    raise exception 'Snapshot children are append-only' using errcode='23514'; end if;
  select * into parent from public.private_bank_snapshots where organization_id=new.organization_id and id=new.snapshot_id for update;
  if not found then raise exception 'Snapshot tenant foreign key required' using errcode='23503'; end if;
  -- Audit events describe terminal transitions; no other child is writable then.
  if parent.state<>'staging' and tg_table_name<>'private_bank_snapshot_events' then raise exception 'Snapshot is terminal' using errcode='23514'; end if;
  if tg_table_name='private_bank_snapshot_files' then
    if tg_op='INSERT' and (new.state<>'reserved' or new.verified_at is not null or new.source_content_verified_at is not null) then raise exception 'Reserved file required' using errcode='23514'; end if;
    if tg_op='UPDATE' and ((to_jsonb(new)-array['state','verified_at','source_content_verified_at']) is distinct from (to_jsonb(old)-array['state','verified_at','source_content_verified_at'])
      or old.state='verified' and (new.state<>'verified' or new.verified_at is distinct from old.verified_at)
      or old.source_content_verified_at is not null or new.state<>'verified') then raise exception 'Immutable file receipt' using errcode='23514'; end if;
  elsif tg_table_name='private_bank_snapshot_question_files' then
    if not exists(select 1 from public.private_bank_snapshot_files where organization_id=new.organization_id and snapshot_id=new.snapshot_id and file_id=new.file_id and kind='media') then
      raise exception 'Same-snapshot media dependency required' using errcode='23514'; end if;
  elsif tg_table_name='private_bank_snapshot_questions' then
    if not new.bank_code=any(parent.bank_codes) then raise exception 'Snapshot bank required' using errcode='23514'; end if;
  elsif tg_table_name='private_bank_snapshot_mappings' then
    if not exists(select 1 from public.private_bank_snapshot_questions where organization_id=new.organization_id and snapshot_id=new.snapshot_id and question_id=new.question_id and bank_code=new.bank_code) then
      raise exception 'Exact question bank required' using errcode='23514'; end if;
  end if;
  return new;
end;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array['private_bank_snapshots','private_bank_snapshot_files','private_bank_snapshot_questions','private_bank_snapshot_question_files','private_bank_snapshot_mappings','private_bank_snapshot_events'] loop
    execute format('alter table public.%I enable row level security',table_name);
    execute format('revoke all on public.%I from public,anon,authenticated,service_role',table_name);
    execute format('create trigger bank_snapshot_immutable before insert or update or delete on public.%I for each row execute function private.bank_snapshot_guard()',table_name);
    execute format('create trigger bank_snapshot_no_truncate before truncate on public.%I for each statement execute function private.bank_snapshot_guard()',table_name);
  end loop;
end;
$$;

-- Supported Storage configuration only. No custom trigger on managed objects.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
  values('private-bank-snapshots','private-bank-snapshots',false,16777216,array['application/json','image/svg+xml','image/png','image/jpeg','image/webp','image/gif'])
  on conflict(id) do nothing;
create policy private_bank_snapshots_objects_closed on storage.objects as restrictive for all to anon,authenticated
  using(bucket_id<>'private-bank-snapshots') with check(bucket_id<>'private-bank-snapshots');
create policy private_bank_snapshots_bucket_closed on storage.buckets as restrictive for all to anon,authenticated
  using(id<>'private-bank-snapshots') with check(id<>'private-bank-snapshots');

create function private.bank_snapshot_actor(token_hash text)
returns jsonb language plpgsql set search_path=pg_catalog as $$
declare account public.accounts%rowtype; session private.sessions%rowtype; account_id uuid;
begin
  if token_hash is null or token_hash collate "C" !~ '^[0-9a-f]{64}$' then raise exception 'Valid school session required' using errcode='28000'; end if;
  select s.account_id into account_id from private.sessions s where s.token_hash=bank_snapshot_actor.token_hash;
  if not found then raise exception 'Valid school session required' using errcode='28000'; end if;
  select a.* into account from public.accounts a where a.id=account_id for share;
  select s.* into session from private.sessions s where s.token_hash=bank_snapshot_actor.token_hash and s.account_id=account.id for share;
  if not found or account.status is distinct from 'active' or session.revoked_at is not null or session.expires_at<=clock_timestamp() then
    raise exception 'Valid school session required' using errcode='28000'; end if;
  if account.role<>'admin' then raise exception 'School administrator required' using errcode='42501'; end if;
  return jsonb_build_object('account_id',account.id,'organization_id',account.organization_id,'expires_at',session.expires_at);
end;
$$;

create function private.bank_snapshot_assert_current(actor jsonb)
returns void language plpgsql set search_path=pg_catalog as $$
begin
  if (actor->>'expires_at')::timestamptz<=clock_timestamp() then raise exception 'School session expired' using errcode='28000'; end if;
end;
$$;

create function private.bank_snapshot_root(domain text,leaves bytea[])
returns text language plpgsql immutable set search_path=pg_catalog as $$
declare bytes bytea; joined bytea;
begin
  if array_position(leaves,null) is not null then raise exception 'Non-null root leaf required' using errcode='22023'; end if;
  bytes:=private.bank_snapshot_frame(array[domain,coalesce(cardinality(leaves),0)::text]);
  -- Aggregate once; repeated bytea concatenation is quadratic for full archives.
  select string_agg(leaf,''::bytea order by ordinal) into joined
    from unnest(coalesce(leaves,array[]::bytea[])) with ordinality as entries(leaf,ordinal);
  return private.bank_snapshot_hash(bytes||coalesce(joined,''::bytea));
end;
$$;

create function private.bank_snapshot_roots(org uuid,snapshot uuid)
returns jsonb language sql stable set search_path=pg_catalog as $$
with q as(select * from public.private_bank_snapshot_questions where organization_id=org and snapshot_id=snapshot),
 f as(select * from public.private_bank_snapshot_files where organization_id=org and snapshot_id=snapshot),
 question_leaves as(
  select 'q' kind,q.question_id key1,'' key2,private.bank_snapshot_frame(array['question',q.question_id,q.bank_code,q.canonical_record_sha256,f.source_path,q.source_record_index::text]) leaf from q join f on f.file_id=q.source_file_id
  union all select 'e',e.question_id,f.source_path,private.bank_snapshot_frame(array['media-edge',e.question_id,f.source_path,e.dependency_kind])
   from public.private_bank_snapshot_question_files e join f on f.file_id=e.file_id where e.organization_id=org and e.snapshot_id=snapshot),
 membership_leaves as(select q.question_id,f.source_path,(m->>'record_index')::integer index,
  private.bank_snapshot_frame(array['membership',q.question_id,f.source_path,m->>'record_index',q.canonical_record_sha256]) leaf
  from q cross join lateral jsonb_array_elements(q.bundle_memberships) m join f on f.file_id=(m->>'file_id')::uuid),
 mapping_leaves as(
  select 'm' kind,m.question_id key1,m.course_version_id::text key2,m.access_key key3,
   private.bank_snapshot_frame(array['mapping',m.question_id,m.course_version_id::text,m.access_key,m.bank_code,m.catalog_route,m.catalog_unit_index::text,m.catalog_topic,m.catalog_position::text,m.curriculum_mapping_status,m.rights_status,m.evidence_reference]) leaf
  from public.private_bank_snapshot_mappings m where m.organization_id=org and m.snapshot_id=snapshot
  union all select 'u',u->>'course_version_id',u->>'unit_index',l->>'access_key',
   private.bank_snapshot_frame(array['unit-review',u->>'course_version_id',u->>'unit_index',l->>'access_key',l->>'route',l->>'topic',l->>'position'])
  from public.private_bank_snapshots s cross join lateral jsonb_array_elements(s.unit_review_sets) u cross join lateral jsonb_array_elements(u->'lessons') l where s.organization_id=org and s.id=snapshot)
select jsonb_build_object(
 'question_root',(select private.bank_snapshot_root('echs.private-bank.questions.v1',array_agg(leaf order by kind collate "C",key1 collate "C",key2 collate "C")) from question_leaves),
 'file_root',(select private.bank_snapshot_root('echs.private-bank.files.v1',array_agg(private.bank_snapshot_frame(array['file',source_path,kind,mime_type,byte_length::text,sha256,coalesce(record_layout,''),coalesce(source_occurrence_count::text,''),coalesce(source_record_root,'')]) order by source_path collate "C")) from f where kind<>'manifest'),
 'membership_root',(select private.bank_snapshot_root('echs.private-bank.memberships.v1',array_agg(leaf order by question_id collate "C",source_path collate "C",index)) from membership_leaves),
 'mapping_root',(select private.bank_snapshot_root('echs.private-bank.mappings.v1',array_agg(leaf order by kind collate "C",key1 collate "C",key2 collate "C",key3 collate "C")) from mapping_leaves));
$$;

create function private.bank_snapshot_source_root(org uuid,snapshot uuid,file uuid)
returns jsonb language sql stable set search_path=pg_catalog as $$
 with members as(select q.question_id,q.canonical_record_sha256,(m->>'record_index')::integer index
  from public.private_bank_snapshot_questions q cross join lateral jsonb_array_elements(q.bundle_memberships) m
  where q.organization_id=org and q.snapshot_id=snapshot and (m->>'file_id')::uuid=file)
 select jsonb_build_object('count',count(*),'root',private.bank_snapshot_root('echs.private-bank.source-records.v1',
   array_agg(private.bank_snapshot_frame(array['source-record',index::text,question_id,canonical_record_sha256]) order by index))) from members;
$$;

create function private.bank_snapshot_catalog_match(org uuid,course uuid,access text,route text,unit_index integer,topic text,catalog_position integer)
returns boolean language plpgsql set search_path=pg_catalog as $$
declare selected public.course_versions%rowtype; parent_status text; family text;
begin
  select v.* into selected from public.course_versions v where v.id=course for share;
  if not found or selected.status<>'active' or selected.is_placeholder then return false; end if;
  select c.status into parent_status from public.curriculum_versions c where c.id=selected.curriculum_version_id for share;
  if parent_status is distinct from 'active' then return false; end if;
  return exists(select 1 from public.lesson_catalog c where c.organization_id=org and c.access_key=access
    and c.course_key=private.lesson_course_family(selected.course_code,c.course_key) and c.url=route and c.unit_index=bank_snapshot_catalog_match.unit_index
    and c.topic=bank_snapshot_catalog_match.topic and c.position=bank_snapshot_catalog_match.catalog_position);
end;
$$;

create function private.bank_snapshot_units_valid(org uuid,sets jsonb)
returns boolean language plpgsql set search_path=pg_catalog as $$
declare item jsonb; lesson jsonb; seen text[]:='{}'; lesson_seen text[]; key text;
begin
  if jsonb_typeof(sets) is distinct from 'array' or jsonb_array_length(sets)>100 or octet_length(sets::text)>262144 then return false; end if;
  for item in select * from jsonb_array_elements(sets) loop
    if private.lesson_keys(item,array['course_version_id','unit_index','lessons'],array['course_version_id','unit_index','lessons']) is not true
      or private.bank_snapshot_value(item->'course_version_id','uuid') is not true or private.bank_snapshot_value(item->'unit_index','integer') is not true
      or (item->>'unit_index')::numeric>999 or jsonb_typeof(item->'lessons') is distinct from 'array' then return false; end if;
    if jsonb_array_length(item->'lessons') not between 1 and 120 then return false; end if;
    key:=(item->>'course_version_id')||':'||(item->>'unit_index');if key=any(seen) then return false; end if;seen:=array_append(seen,key);lesson_seen:='{}';
    for lesson in select * from jsonb_array_elements(item->'lessons') loop
      if private.lesson_keys(lesson,array['access_key','route','topic','position'],array['access_key','route','topic','position']) is not true
        or private.bank_snapshot_value(lesson->'access_key','id') is not true or private.bank_snapshot_value(lesson->'route','path') is not true
        or private.bank_snapshot_value(lesson->'topic','id') is not true or private.bank_snapshot_value(lesson->'position','integer') is not true
        or (lesson->>'position')::numeric>99999 then return false; end if;
      if lesson->>'access_key'=any(lesson_seen) then return false; end if;lesson_seen:=array_append(lesson_seen,lesson->>'access_key');
      if private.bank_snapshot_catalog_match(org,(item->>'course_version_id')::uuid,lesson->>'access_key',lesson->>'route',(item->>'unit_index')::integer,lesson->>'topic',(lesson->>'position')::integer) is not true then return false; end if;
    end loop;
  end loop;
  return true;
end;
$$;

create function private.bank_snapshot_request(actor jsonb,action text,payload jsonb)
returns boolean language plpgsql set search_path=pg_catalog as $$
declare existing public.private_bank_snapshot_events%rowtype; request_hash text;
begin
  request_hash:=private.bank_snapshot_hash(convert_to(payload::text,'UTF8'));
  select * into existing from public.private_bank_snapshot_events where organization_id=(actor->>'organization_id')::uuid
    and snapshot_id=(payload->>'snapshot_id')::uuid and request_id=(payload->>'request_id')::uuid;
  if found then
    if existing.event_type<>action or existing.request_sha256<>request_hash then raise exception 'Request identity conflict' using errcode='40001'; end if;
    return true;
  end if;
  return false;
end;
$$;

create function private.bank_snapshot_event(actor jsonb,action text,payload jsonb,item_count integer default 0)
returns void language sql set search_path=pg_catalog as $$
  insert into public.private_bank_snapshot_events(organization_id,snapshot_id,actor_id,event_type,request_id,request_sha256,details)
    values((actor->>'organization_id')::uuid,(payload->>'snapshot_id')::uuid,(actor->>'account_id')::uuid,action,
      (payload->>'request_id')::uuid,private.bank_snapshot_hash(convert_to(payload::text,'UTF8')),jsonb_build_object('count',item_count));
$$;

create function private.bank_snapshot_status(actor jsonb,snapshot uuid,reused boolean)
returns jsonb language plpgsql set search_path=pg_catalog as $$
declare selected public.private_bank_snapshots%rowtype; result jsonb;
begin
  select * into strict selected from public.private_bank_snapshots where organization_id=(actor->>'organization_id')::uuid and id=snapshot;
  result:=jsonb_build_object('ok',true,'contract','echs.private-bank.snapshot-store.v1','account_id',actor->>'account_id','organization_id',selected.organization_id,
    'snapshot_id',selected.id,'state',selected.state,'reused',reused,'manifest_sha256',selected.manifest_sha256,'bank_codes',selected.bank_codes,
    'counts',jsonb_build_object('questions',(select count(*) from public.private_bank_snapshot_questions where organization_id=selected.organization_id and snapshot_id=selected.id),
      'files',(select count(*) from public.private_bank_snapshot_files where organization_id=selected.organization_id and snapshot_id=selected.id),
      'verified_files',(select count(*) from public.private_bank_snapshot_files where organization_id=selected.organization_id and snapshot_id=selected.id and state='verified'),
      'verified_sources',(select count(*) from public.private_bank_snapshot_files where organization_id=selected.organization_id and snapshot_id=selected.id and source_content_verified_at is not null)));
  perform private.bank_snapshot_assert_current(actor);return result;
end;
$$;

create function public.private_bank_snapshot_file(p_token_hash text,p_action text,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
#variable_conflict use_variable
declare actor jsonb; selected public.private_bank_snapshots%rowtype; file public.private_bank_snapshot_files%rowtype;
  org uuid; snapshot uuid; allowed text[]; item jsonb; field text; receipt jsonb; batch_seen text[]:='{}'; total_count bigint; total_bytes bigint;
begin
  actor:=private.bank_snapshot_actor(p_token_hash);org:=(actor->>'organization_id')::uuid;
  if private.bank_snapshot_bucket_ready() is not true then raise exception 'Snapshot storage unavailable' using errcode='55000'; end if;
  if jsonb_typeof(p_payload) is distinct from 'object' or octet_length(p_payload::text)>1048576 then raise exception 'Bounded object required' using errcode='22023'; end if;
  allowed:=case p_action when 'register' then array['snapshot_id','request_id','files'] when 'status' then array['snapshot_id','file_id']
    when 'verify_bytes' then array['snapshot_id','request_id','file_id','sha256','byte_length','mime_type']
    when 'verify_records' then array['snapshot_id','request_id','file_id','source_occurrence_count','source_record_root'] else null end;
  if allowed is null or private.lesson_keys(p_payload,allowed,allowed) is not true or private.bank_snapshot_value(p_payload->'snapshot_id','uuid') is not true
    or (p_action<>'status' and private.bank_snapshot_value(p_payload->'request_id','uuid') is not true) then raise exception 'Closed file action required' using errcode='22023'; end if;
  snapshot:=(p_payload->>'snapshot_id')::uuid;
  select * into selected from public.private_bank_snapshots where organization_id=org and id=snapshot for update;
  if not found then raise exception 'Snapshot not found' using errcode='P0002'; end if;
  perform private.bank_snapshot_assert_current(actor);
  if p_action<>'status' and private.bank_snapshot_request(actor,p_action,p_payload) then return private.bank_snapshot_status(actor,snapshot,true); end if;
  if p_action<>'status' and selected.state<>'staging' then raise exception 'Snapshot is terminal' using errcode='40001'; end if;
  if p_action='register' then
    if jsonb_typeof(p_payload->'files') is distinct from 'array' then raise exception 'File batch required' using errcode='22023'; end if;
    if jsonb_array_length(p_payload->'files') not between 1 and 100 then raise exception 'Bounded file batch required' using errcode='22023'; end if;
    for item in select * from jsonb_array_elements(p_payload->'files') loop
      allowed:=array['file_id','kind','source_path','mime_type','byte_length','sha256'];
      if item->>'kind'='source-json' then allowed:=allowed||array['record_layout','source_occurrence_count','source_record_root']; end if;
      if private.lesson_keys(item,allowed,allowed) is not true or private.bank_snapshot_value(item->'file_id','uuid') is not true
        or private.bank_snapshot_value(item->'source_path','path') is not true or private.bank_snapshot_value(item->'sha256','hash') is not true
        or private.bank_snapshot_value(item->'byte_length','integer') is not true or (item->>'byte_length')::numeric not between 1 and 16777216
        or jsonb_typeof(item->'kind') is distinct from 'string' or item->>'kind' not in ('source-json','media','manifest')
        or jsonb_typeof(item->'mime_type') is distinct from 'string' then raise exception 'Invalid file metadata' using errcode='22023'; end if;
      if (item->>'kind'='media' and item->>'mime_type' not in ('image/svg+xml','image/png','image/jpeg','image/webp','image/gif'))
        or (item->>'kind'<>'media' and item->>'mime_type'<>'application/json') then raise exception 'File kind and MIME mismatch' using errcode='22023'; end if;
      if ('id:'||(item->>'file_id'))=any(batch_seen) or ('path:'||(item->>'source_path'))=any(batch_seen) then raise exception 'Duplicate file in batch' using errcode='22023'; end if;
      batch_seen:=batch_seen||array['id:'||(item->>'file_id'),'path:'||(item->>'source_path')];
      if item->>'kind'='source-json' and (jsonb_typeof(item->'record_layout') is distinct from 'string' or item->>'record_layout' not in ('questions','review-questions')
        or private.bank_snapshot_value(item->'source_record_root','hash') is not true or private.bank_snapshot_value(item->'source_occurrence_count','integer') is not true
        or (item->>'source_occurrence_count')::numeric not between 1 and 100000) then raise exception 'Explicit source extraction profile required' using errcode='22023'; end if;
      if item->>'kind'='manifest' and item->>'sha256'<>selected.manifest_sha256 then raise exception 'Archived manifest must match frozen plan' using errcode='23514'; end if;
      select * into file from public.private_bank_snapshot_files where organization_id=org and snapshot_id=snapshot and file_id=(item->>'file_id')::uuid;
      if found then
        if jsonb_strip_nulls(to_jsonb(file)-array['organization_id','snapshot_id','state','verified_at','source_content_verified_at'])<>item then raise exception 'File identity conflict' using errcode='40001'; end if;
      else
        if exists(select 1 from public.private_bank_snapshot_files where organization_id=org and snapshot_id=snapshot and source_path=item->>'source_path') then raise exception 'Source path identity conflict' using errcode='40001'; end if;
        insert into public.private_bank_snapshot_files(organization_id,snapshot_id,file_id,kind,source_path,mime_type,byte_length,sha256,record_layout,source_occurrence_count,source_record_root)
          values(org,snapshot,(item->>'file_id')::uuid,item->>'kind',item->>'source_path',item->>'mime_type',(item->>'byte_length')::integer,item->>'sha256',item->>'record_layout',(item->>'source_occurrence_count')::integer,item->>'source_record_root');
      end if;
    end loop;
    select count(*),coalesce(sum(byte_length),0) into total_count,total_bytes from public.private_bank_snapshot_files where organization_id=org and snapshot_id=snapshot;
    if total_count>selected.expected_file_count+selected.expected_manifest_count or total_bytes>selected.expected_total_bytes
      or (select count(*) from public.private_bank_snapshot_files where organization_id=org and snapshot_id=snapshot and kind='media')>selected.expected_media_count
      or (select count(*) from public.private_bank_snapshot_files where organization_id=org and snapshot_id=snapshot and kind='manifest')>selected.expected_manifest_count
      or (select count(*) from public.private_bank_snapshot_files where organization_id=org and snapshot_id=snapshot and kind='source-json')>selected.expected_file_count-selected.expected_media_count then
      raise exception 'Snapshot file quota exceeded' using errcode='23514'; end if;
    perform private.bank_snapshot_event(actor,p_action,p_payload,jsonb_array_length(p_payload->'files'));
  else
    if private.bank_snapshot_value(p_payload->'file_id','uuid') is not true then raise exception 'Exact file identifier required' using errcode='22023'; end if;
    select * into file from public.private_bank_snapshot_files where organization_id=org and snapshot_id=snapshot and file_id=(p_payload->>'file_id')::uuid;
    if not found then raise exception 'File not found' using errcode='P0002'; end if;
    if p_action='status' then
      perform private.bank_snapshot_assert_current(actor);
      return jsonb_build_object('ok',true,'contract','echs.private-bank.snapshot-store.v1','account_id',actor->>'account_id','organization_id',org,'snapshot_id',snapshot,'file',to_jsonb(file));
    elsif p_action='verify_bytes' then
      -- INTERNAL: caller must have completed an authorized immutable Storage read-back.
      if private.bank_snapshot_value(p_payload->'sha256','hash') is not true or private.bank_snapshot_value(p_payload->'byte_length','integer') is not true
        or jsonb_typeof(p_payload->'mime_type') is distinct from 'string' then raise exception 'Closed read-back receipt required' using errcode='22023'; end if;
      if p_payload->>'sha256'<>file.sha256 or (p_payload->>'byte_length')::numeric<>file.byte_length or p_payload->>'mime_type'<>file.mime_type then raise exception 'Read-back integrity mismatch' using errcode='23514'; end if;
      if not exists(select 1 from storage.objects o where o.bucket_id='private-bank-snapshots' and o.name=org::text||'/'||snapshot::text||'/'||file.file_id::text) then
        raise exception 'Immutable stored object required' using errcode='23514'; end if;
      if file.state='reserved' then update public.private_bank_snapshot_files set state='verified',verified_at=clock_timestamp() where organization_id=org and snapshot_id=snapshot and file_id=file.file_id; end if;
    else
      -- INTERNAL: Edge parsed the archived profile and compared EVERY occurrence.
      if private.bank_snapshot_value(p_payload->'source_record_root','hash') is not true or private.bank_snapshot_value(p_payload->'source_occurrence_count','integer') is not true then raise exception 'Closed source receipt required' using errcode='22023'; end if;
      receipt:=private.bank_snapshot_source_root(org,snapshot,file.file_id);
      if file.kind<>'source-json' or file.state<>'verified' or file.source_record_root<>p_payload->>'source_record_root'
        or file.source_occurrence_count<>(p_payload->>'source_occurrence_count')::numeric or file.source_record_root<>receipt->>'root' or file.source_occurrence_count<>(receipt->>'count')::bigint then
        raise exception 'Source record consistency mismatch' using errcode='23514'; end if;
      if file.source_content_verified_at is null then update public.private_bank_snapshot_files set source_content_verified_at=clock_timestamp() where organization_id=org and snapshot_id=snapshot and file_id=file.file_id; end if;
    end if;
    perform private.bank_snapshot_event(actor,p_action,p_payload,1);
  end if;
  return private.bank_snapshot_status(actor,snapshot,false);
end;
$$;

create function public.private_bank_snapshot_import(p_token_hash text,p_action text,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
#variable_conflict use_variable
declare actor jsonb; org uuid; snapshot uuid; selected public.private_bank_snapshots%rowtype; question public.private_bank_snapshot_questions%rowtype;
  source_file public.private_bank_snapshot_files%rowtype; mapping public.private_bank_snapshot_mappings%rowtype;
  allowed text[]; field text; banks text[]; item jsonb; member jsonb; dependency jsonb; parsed jsonb; roots jsonb; seen text[]; batch_seen text[]:='{}'; key text; count_value bigint; reused boolean:=false;
begin
  actor:=private.bank_snapshot_actor(p_token_hash);org:=(actor->>'organization_id')::uuid;
  if private.bank_snapshot_bucket_ready() is not true then raise exception 'Snapshot storage unavailable' using errcode='55000'; end if;
  if jsonb_typeof(p_payload) is distinct from 'object' or octet_length(p_payload::text)>1048576 then raise exception 'Bounded object required' using errcode='22023'; end if;
  allowed:=case p_action when 'reserve' then array['snapshot_id','request_id','collection_key','bank_codes','source_main','manifest_sha256','expected_question_count','expected_file_count','expected_media_count','expected_manifest_count','expected_occurrence_count','expected_dependency_count','expected_mapping_count','expected_total_bytes','question_root','file_root','membership_root','mapping_root','unit_review_sets']
    when 'status' then array['snapshot_id'] when 'records' then array['snapshot_id','request_id','records'] when 'mappings' then array['snapshot_id','request_id','mappings']
    when 'seal' then array['snapshot_id','request_id'] when 'abort' then array['snapshot_id','request_id'] else null end;
  if allowed is null or private.lesson_keys(p_payload,allowed,allowed) is not true or private.bank_snapshot_value(p_payload->'snapshot_id','uuid') is not true
    or (p_action<>'status' and private.bank_snapshot_value(p_payload->'request_id','uuid') is not true) then raise exception 'Closed snapshot action required' using errcode='22023'; end if;
  snapshot:=(p_payload->>'snapshot_id')::uuid;
  -- Consistent order avoids an absent-row reserve and an existing-row seal
  -- acquiring catalog/snapshot locks in opposite orders behind a catalog writer.
  if p_action in ('reserve','mappings','seal') then lock table public.lesson_catalog in share mode; end if;
  if p_action='reserve' then
    if private.bank_snapshot_value(p_payload->'collection_key','id') is not true or private.bank_snapshot_value(p_payload->'source_main','commit') is not true
      or jsonb_typeof(p_payload->'bank_codes') is distinct from 'array' then raise exception 'Frozen snapshot identity required' using errcode='22023'; end if;
    if jsonb_array_length(p_payload->'bank_codes') not between 1 and 3 or exists(select 1 from jsonb_array_elements(p_payload->'bank_codes') value where jsonb_typeof(value)<>'string') then raise exception 'Closed source bank list required' using errcode='22023'; end if;
    select array_agg(value order by value collate "C") into banks from jsonb_array_elements_text(p_payload->'bank_codes');
    if private.bank_snapshot_banks_valid(banks) is not true then raise exception 'Closed source bank list required' using errcode='22023'; end if;
    foreach field in array array['manifest_sha256','question_root','file_root','membership_root','mapping_root'] loop
      if private.bank_snapshot_value(p_payload->field,'hash') is not true then raise exception 'Frozen expected roots required' using errcode='22023'; end if;
    end loop;
    foreach field in array array['expected_question_count','expected_file_count','expected_media_count','expected_manifest_count','expected_occurrence_count','expected_dependency_count','expected_mapping_count','expected_total_bytes'] loop
      if private.bank_snapshot_value(p_payload->field,'integer') is not true then raise exception 'Integer expected counts required' using errcode='22023'; end if;
    end loop;
    if (p_payload->>'expected_question_count')::numeric not between 1 and 10000 or (p_payload->>'expected_file_count')::numeric not between 1 and 25000
      or (p_payload->>'expected_media_count')::numeric not between 0 and 25000 or (p_payload->>'expected_media_count')::numeric>=(p_payload->>'expected_file_count')::numeric
      or (p_payload->>'expected_manifest_count')::numeric not between 0 and 1 or (p_payload->>'expected_occurrence_count')::numeric not between 1 and 100000
      or (p_payload->>'expected_occurrence_count')::numeric<(p_payload->>'expected_question_count')::numeric
      or (p_payload->>'expected_dependency_count')::numeric not between 0 and 100000 or (p_payload->>'expected_mapping_count')::numeric not between 0 and 100000
      or (p_payload->>'expected_total_bytes')::numeric not between 1 and 268435456 then raise exception 'Snapshot quotas exceeded' using errcode='22023'; end if;
    lock table public.lesson_catalog in share mode;
    if private.bank_snapshot_units_valid(org,p_payload->'unit_review_sets') is not true then raise exception 'Exact reviewed unit identities required' using errcode='22023'; end if;
    insert into public.private_bank_snapshots(id,organization_id,collection_key,bank_codes,source_main,manifest_sha256,expected_question_count,expected_file_count,expected_media_count,expected_manifest_count,expected_occurrence_count,expected_dependency_count,expected_mapping_count,expected_total_bytes,question_root,file_root,membership_root,mapping_root,unit_review_sets,reserve_request,created_by)
      values(snapshot,org,p_payload->>'collection_key',banks,p_payload->>'source_main',p_payload->>'manifest_sha256',(p_payload->>'expected_question_count')::integer,(p_payload->>'expected_file_count')::integer,
        (p_payload->>'expected_media_count')::integer,(p_payload->>'expected_manifest_count')::integer,(p_payload->>'expected_occurrence_count')::integer,(p_payload->>'expected_dependency_count')::integer,(p_payload->>'expected_mapping_count')::integer,
        (p_payload->>'expected_total_bytes')::bigint,p_payload->>'question_root',p_payload->>'file_root',p_payload->>'membership_root',p_payload->>'mapping_root',p_payload->'unit_review_sets',p_payload,(actor->>'account_id')::uuid)
      on conflict do nothing;
    reused:=not found;
  end if;
  select * into selected from public.private_bank_snapshots where organization_id=org and id=snapshot for update;
  if not found then
    if p_action='reserve' and exists(select 1 from public.private_bank_snapshots where organization_id=org and collection_key=p_payload->>'collection_key' and manifest_sha256=p_payload->>'manifest_sha256') then
      raise exception 'Existing snapshot identity required' using errcode='40001'; end if;
    raise exception 'Snapshot not found' using errcode='P0002';
  end if;
  perform private.bank_snapshot_assert_current(actor);
  if p_action='status' then return private.bank_snapshot_status(actor,snapshot,false); end if;
  if p_action='reserve' and selected.reserve_request<>p_payload then raise exception 'Snapshot identity conflict' using errcode='40001'; end if;
  if private.bank_snapshot_request(actor,p_action,p_payload) then return private.bank_snapshot_status(actor,snapshot,true); end if;
  if selected.state<>'staging' then raise exception 'Snapshot is terminal' using errcode='40001'; end if;
  if p_action='reserve' then
    perform private.bank_snapshot_event(actor,p_action,p_payload);return private.bank_snapshot_status(actor,snapshot,reused);
  elsif p_action='records' then
    if jsonb_typeof(p_payload->'records') is distinct from 'array' then raise exception 'Record batch required' using errcode='22023'; end if;
    if jsonb_array_length(p_payload->'records') not between 1 and 100 then raise exception 'Bounded record batch required' using errcode='22023'; end if;
    for item in select * from jsonb_array_elements(p_payload->'records') loop
      allowed:=array['question_id','bank_code','canonical_record_text','canonical_record_sha256','source_file_id','source_record_index','bundle_memberships','dependencies'];
      if private.lesson_keys(item,allowed,allowed) is not true or private.bank_snapshot_value(item->'question_id','id') is not true or private.bank_snapshot_value(item->'source_file_id','uuid') is not true
        or private.bank_snapshot_value(item->'canonical_record_sha256','hash') is not true or private.bank_snapshot_value(item->'source_record_index','integer') is not true
        or (item->>'source_record_index')::numeric>99999 or jsonb_typeof(item->'canonical_record_text') is distinct from 'string'
        or octet_length(item->>'canonical_record_text') not between 2 and 65536 or jsonb_typeof(item->'bank_code') is distinct from 'string'
        or not(item->>'bank_code'=any(selected.bank_codes)) or jsonb_typeof(item->'bundle_memberships') is distinct from 'array'
        or jsonb_typeof(item->'dependencies') is distinct from 'array' then raise exception 'Closed canonical record required' using errcode='22023'; end if;
      if jsonb_array_length(item->'bundle_memberships') not between 1 and 100 or jsonb_array_length(item->'dependencies')>100 then raise exception 'Bounded source/dependency list required' using errcode='22023'; end if;
      if item->>'question_id'=any(batch_seen) then raise exception 'Duplicate question in batch' using errcode='22023'; end if;batch_seen:=array_append(batch_seen,item->>'question_id');
      begin parsed:=(item->>'canonical_record_text')::jsonb;
      exception when invalid_text_representation or untranslatable_character or numeric_value_out_of_range or program_limit_exceeded then raise exception 'Valid bounded canonical JSON required' using errcode='22023'; end;
      if jsonb_typeof(parsed) is distinct from 'object' or jsonb_typeof(parsed->'id') is distinct from 'string' or parsed->>'id'<>item->>'question_id'
        or private.bank_snapshot_hash(convert_to(item->>'canonical_record_text','UTF8'))<>item->>'canonical_record_sha256' then raise exception 'Canonical record integrity mismatch' using errcode='23514'; end if;
      select * into source_file from public.private_bank_snapshot_files where organization_id=org and snapshot_id=snapshot and file_id=(item->>'source_file_id')::uuid;
      if not found or source_file.kind<>'source-json' or source_file.state<>'verified' or (item->>'source_record_index')::integer>=source_file.source_occurrence_count then raise exception 'Verified canonical source required' using errcode='23514'; end if;
      seen:='{}';
      for member in select * from jsonb_array_elements(item->'bundle_memberships') loop
        if private.lesson_keys(member,array['file_id','record_index'],array['file_id','record_index']) is not true or private.bank_snapshot_value(member->'file_id','uuid') is not true
          or private.bank_snapshot_value(member->'record_index','integer') is not true or (member->>'record_index')::numeric>99999 then raise exception 'Closed source occurrence required' using errcode='22023'; end if;
        key:=(member->>'file_id')||':'||(member->>'record_index');if key=any(seen) then raise exception 'Duplicate source occurrence' using errcode='22023'; end if;seen:=array_append(seen,key);
        if not exists(select 1 from public.private_bank_snapshot_files f where f.organization_id=org and f.snapshot_id=snapshot and f.file_id=(member->>'file_id')::uuid
          and f.kind='source-json' and f.state='verified' and (member->>'record_index')::integer<f.source_occurrence_count) then raise exception 'Verified source occurrence required' using errcode='23514'; end if;
        if exists(select 1 from public.private_bank_snapshot_questions q cross join lateral jsonb_array_elements(q.bundle_memberships) m where q.organization_id=org and q.snapshot_id=snapshot
          and q.question_id<>item->>'question_id' and m=member) then raise exception 'Source occurrence identity conflict' using errcode='40001'; end if;
      end loop;
      if not((item->>'source_file_id')||':'||(item->>'source_record_index')=any(seen)) then raise exception 'Canonical occurrence must be included' using errcode='23514'; end if;
      seen:='{}';
      for dependency in select * from jsonb_array_elements(item->'dependencies') loop
        if private.lesson_keys(dependency,array['file_id','dependency_kind'],array['file_id','dependency_kind']) is not true or private.bank_snapshot_value(dependency->'file_id','uuid') is not true
          or jsonb_typeof(dependency->'dependency_kind') is distinct from 'string' or dependency->>'dependency_kind' not in ('direct-image','transitive-media') then raise exception 'Closed media dependency required' using errcode='22023'; end if;
        if dependency->>'file_id'=any(seen) then raise exception 'Duplicate dependency' using errcode='22023'; end if;seen:=array_append(seen,dependency->>'file_id');
      end loop;
      select * into question from public.private_bank_snapshot_questions where organization_id=org and snapshot_id=snapshot and question_id=item->>'question_id';
      if found then
        if question.bank_code<>item->>'bank_code' or question.canonical_record_text<>item->>'canonical_record_text' or question.canonical_record_sha256<>item->>'canonical_record_sha256'
          or question.source_file_id<>(item->>'source_file_id')::uuid or question.source_record_index<>(item->>'source_record_index')::integer or question.bundle_memberships<>item->'bundle_memberships' then raise exception 'Question identity conflict' using errcode='40001'; end if;
        if (select coalesce(jsonb_agg(jsonb_build_object('file_id',e.file_id,'dependency_kind',e.dependency_kind) order by e.file_id),'[]') from public.private_bank_snapshot_question_files e where e.organization_id=org and e.snapshot_id=snapshot and e.question_id=question.question_id)
          is distinct from (select coalesce(jsonb_agg(d order by (d->>'file_id')::uuid),'[]') from jsonb_array_elements(item->'dependencies') d) then raise exception 'Dependency identity conflict' using errcode='40001'; end if;
      else
        insert into public.private_bank_snapshot_questions(organization_id,snapshot_id,question_id,bank_code,canonical_record_text,canonical_record_sha256,source_file_id,source_record_index,bundle_memberships,source_provenance)
          values(org,snapshot,item->>'question_id',item->>'bank_code',item->>'canonical_record_text',item->>'canonical_record_sha256',(item->>'source_file_id')::uuid,(item->>'source_record_index')::integer,item->'bundle_memberships',jsonb_build_object('source_path',source_file.source_path,'source_sha256',source_file.sha256));
        for dependency in select * from jsonb_array_elements(item->'dependencies') loop
          insert into public.private_bank_snapshot_question_files(organization_id,snapshot_id,question_id,file_id,dependency_kind) values(org,snapshot,item->>'question_id',(dependency->>'file_id')::uuid,dependency->>'dependency_kind');
        end loop;
      end if;
    end loop;
    if (select count(*) from public.private_bank_snapshot_questions where organization_id=org and snapshot_id=snapshot)>selected.expected_question_count
      or (select coalesce(sum(jsonb_array_length(bundle_memberships)),0) from public.private_bank_snapshot_questions where organization_id=org and snapshot_id=snapshot)>selected.expected_occurrence_count
      or (select count(*) from public.private_bank_snapshot_question_files where organization_id=org and snapshot_id=snapshot)>selected.expected_dependency_count then raise exception 'Snapshot record quota exceeded' using errcode='23514'; end if;
    perform private.bank_snapshot_event(actor,p_action,p_payload,jsonb_array_length(p_payload->'records'));
  elsif p_action='mappings' then
    if jsonb_typeof(p_payload->'mappings') is distinct from 'array' then raise exception 'Mapping batch required' using errcode='22023'; end if;
    if jsonb_array_length(p_payload->'mappings') not between 1 and 100 then raise exception 'Bounded mapping batch required' using errcode='22023'; end if;
    lock table public.lesson_catalog in share mode;
    for item in select * from jsonb_array_elements(p_payload->'mappings') loop
      allowed:=array['question_id','course_version_id','access_key','bank_code','catalog_route','catalog_unit_index','catalog_topic','catalog_position','curriculum_mapping_status','rights_status','evidence_reference'];
      if private.lesson_keys(item,allowed,allowed) is not true then raise exception 'Closed mapping required' using errcode='22023'; end if;
      foreach field in array array['question_id','access_key','bank_code','catalog_topic'] loop if private.bank_snapshot_value(item->field,'id') is not true then raise exception 'Exact mapping identity required' using errcode='22023'; end if; end loop;
      if private.bank_snapshot_value(item->'course_version_id','uuid') is not true or private.bank_snapshot_value(item->'catalog_route','path') is not true
        or private.bank_snapshot_value(item->'catalog_unit_index','integer') is not true or (item->>'catalog_unit_index')::numeric>999
        or private.bank_snapshot_value(item->'catalog_position','integer') is not true or (item->>'catalog_position')::numeric>99999
        or private.bank_snapshot_value(item->'evidence_reference','evidence') is not true or jsonb_typeof(item->'curriculum_mapping_status') is distinct from 'string'
        or item->>'curriculum_mapping_status' not in ('reviewed','unresolved') or jsonb_typeof(item->'rights_status') is distinct from 'string'
        or item->>'rights_status' not in ('school-practice-approved','archive-only','unresolved') then raise exception 'Explicit bounded mapping and rights required' using errcode='22023'; end if;
      if private.bank_snapshot_catalog_match(org,(item->>'course_version_id')::uuid,item->>'access_key',item->>'catalog_route',(item->>'catalog_unit_index')::integer,item->>'catalog_topic',(item->>'catalog_position')::integer) is not true then raise exception 'Current exact course/catalog mapping required' using errcode='23514'; end if;
      key:=(item->>'question_id')||'|'||(item->>'course_version_id')||'|'||(item->>'access_key');if key=any(batch_seen) then raise exception 'Duplicate mapping in batch' using errcode='22023'; end if;batch_seen:=array_append(batch_seen,key);
      select * into mapping from public.private_bank_snapshot_mappings where organization_id=org and snapshot_id=snapshot and question_id=item->>'question_id' and course_version_id=(item->>'course_version_id')::uuid and access_key=item->>'access_key';
      if found then
        if to_jsonb(mapping)-array['organization_id','snapshot_id','reviewed_by','reviewed_at']<>item then raise exception 'Mapping identity conflict' using errcode='40001'; end if;
      else
        insert into public.private_bank_snapshot_mappings(organization_id,snapshot_id,question_id,course_version_id,access_key,bank_code,catalog_route,catalog_unit_index,catalog_topic,catalog_position,curriculum_mapping_status,rights_status,evidence_reference,reviewed_by)
          values(org,snapshot,item->>'question_id',(item->>'course_version_id')::uuid,item->>'access_key',item->>'bank_code',item->>'catalog_route',(item->>'catalog_unit_index')::integer,item->>'catalog_topic',(item->>'catalog_position')::integer,item->>'curriculum_mapping_status',item->>'rights_status',item->>'evidence_reference',(actor->>'account_id')::uuid);
      end if;
    end loop;
    if (select count(*) from public.private_bank_snapshot_mappings where organization_id=org and snapshot_id=snapshot)>selected.expected_mapping_count then raise exception 'Snapshot mapping quota exceeded' using errcode='23514'; end if;
    perform private.bank_snapshot_event(actor,p_action,p_payload,jsonb_array_length(p_payload->'mappings'));
  elsif p_action='seal' then
    lock table public.lesson_catalog in share mode;
    if private.bank_snapshot_units_valid(org,selected.unit_review_sets) is not true then raise exception 'Unit review catalog drift' using errcode='23514'; end if;
    if exists(select 1 from public.private_bank_snapshot_mappings m where m.organization_id=org and m.snapshot_id=snapshot
      and private.bank_snapshot_catalog_match(org,m.course_version_id,m.access_key,m.catalog_route,m.catalog_unit_index,m.catalog_topic,m.catalog_position) is not true) then raise exception 'Mapping catalog drift' using errcode='23514'; end if;
    if (select count(*) from public.private_bank_snapshot_questions where organization_id=org and snapshot_id=snapshot)<>selected.expected_question_count
      or (select count(*) from public.private_bank_snapshot_files where organization_id=org and snapshot_id=snapshot and kind<>'manifest')<>selected.expected_file_count
      or (select count(*) from public.private_bank_snapshot_files where organization_id=org and snapshot_id=snapshot and kind='manifest')<>selected.expected_manifest_count
      or (select count(*) from public.private_bank_snapshot_files where organization_id=org and snapshot_id=snapshot and kind='media')<>selected.expected_media_count
      or (select coalesce(sum(byte_length),0) from public.private_bank_snapshot_files where organization_id=org and snapshot_id=snapshot)<>selected.expected_total_bytes
      or (select coalesce(sum(jsonb_array_length(bundle_memberships)),0) from public.private_bank_snapshot_questions where organization_id=org and snapshot_id=snapshot)<>selected.expected_occurrence_count
      or (select count(*) from public.private_bank_snapshot_question_files where organization_id=org and snapshot_id=snapshot)<>selected.expected_dependency_count
      or (select count(*) from public.private_bank_snapshot_mappings where organization_id=org and snapshot_id=snapshot)<>selected.expected_mapping_count
      or exists(select 1 from public.private_bank_snapshot_files where organization_id=org and snapshot_id=snapshot and (state<>'verified' or (kind='source-json' and source_content_verified_at is null))) then
      raise exception 'Snapshot preservation is incomplete' using errcode='23514'; end if;
    roots:=private.bank_snapshot_roots(org,snapshot);
    if roots<>jsonb_build_object('question_root',selected.question_root,'file_root',selected.file_root,'membership_root',selected.membership_root,'mapping_root',selected.mapping_root) then raise exception 'Snapshot roots do not match frozen plan' using errcode='23514'; end if;
    update public.private_bank_snapshots set state='ready',ready_at=clock_timestamp() where organization_id=org and id=snapshot;
    perform private.bank_snapshot_event(actor,p_action,p_payload);
  else
    update public.private_bank_snapshots set state='aborted',aborted_at=clock_timestamp() where organization_id=org and id=snapshot;
    perform private.bank_snapshot_event(actor,p_action,p_payload);
  end if;
  return private.bank_snapshot_status(actor,snapshot,false);
end;
$$;

create function private.bank_snapshot_bucket_ready()
returns boolean language sql stable set search_path=pg_catalog as $$
  select exists(select 1 from storage.buckets where id='private-bank-snapshots' and name='private-bank-snapshots' and public=false
    and file_size_limit=16777216 and allowed_mime_types=array['application/json','image/svg+xml','image/png','image/jpeg','image/webp','image/gif'])
    and exists(select 1 from pg_class t join pg_namespace n on n.oid=t.relnamespace where n.nspname='storage' and t.relname='objects' and t.relrowsecurity)
    and exists(select 1 from pg_class t join pg_namespace n on n.oid=t.relnamespace where n.nspname='storage' and t.relname='buckets' and t.relrowsecurity)
    and exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='private_bank_snapshots_objects_closed' and permissive='RESTRICTIVE' and cmd='ALL' and roles @> array['anon','authenticated']::name[]
      and qual='(bucket_id <> ''private-bank-snapshots''::text)' and with_check='(bucket_id <> ''private-bank-snapshots''::text)')
    and exists(select 1 from pg_policies where schemaname='storage' and tablename='buckets' and policyname='private_bank_snapshots_bucket_closed' and permissive='RESTRICTIVE' and cmd='ALL' and roles @> array['anon','authenticated']::name[]
      and qual='(id <> ''private-bank-snapshots''::text)' and with_check='(id <> ''private-bank-snapshots''::text)');
$$;

create function public.private_bank_snapshot_capabilities()
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
declare table_name text; role_name text;
begin
  foreach table_name in array array['private_bank_snapshots','private_bank_snapshot_files','private_bank_snapshot_questions','private_bank_snapshot_question_files','private_bank_snapshot_mappings','private_bank_snapshot_events'] loop
    if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=table_name and c.relrowsecurity) then return null; end if;
    foreach role_name in array array['anon','authenticated','service_role'] loop
      if has_table_privilege(role_name::name,('public.'||table_name)::regclass,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
        or has_any_column_privilege(role_name::name,('public.'||table_name)::regclass,'SELECT,INSERT,UPDATE,REFERENCES') then return null; end if;
    end loop;
    if (select count(*) from pg_trigger where tgrelid=('public.'||table_name)::regclass and tgname in ('bank_snapshot_immutable','bank_snapshot_no_truncate') and tgenabled='O')<>2 then return null; end if;
  end loop;
  if private.bank_snapshot_bucket_ready() is not true then return null; end if;
  return '{"contract":"echs.private-bank.snapshot-store.v1","schema_version":1,"immutable_ready":true,"student_delivery":false,"max_record_bytes":65536,"max_object_bytes":16777216,"max_snapshot_bytes":268435456}'::jsonb;
end;
$$;

revoke all on function private.bank_snapshot_hash(bytea),private.bank_snapshot_frame(text[]),private.bank_snapshot_value(jsonb,text),private.bank_snapshot_banks_valid(text[]),
  private.bank_snapshot_guard(),private.bank_snapshot_actor(text),private.bank_snapshot_assert_current(jsonb),private.bank_snapshot_root(text,bytea[]),
  private.bank_snapshot_roots(uuid,uuid),private.bank_snapshot_source_root(uuid,uuid,uuid),private.bank_snapshot_catalog_match(uuid,uuid,text,text,integer,text,integer),
  private.bank_snapshot_units_valid(uuid,jsonb),private.bank_snapshot_request(jsonb,text,jsonb),private.bank_snapshot_event(jsonb,text,jsonb,integer),
  private.bank_snapshot_status(jsonb,uuid,boolean),private.bank_snapshot_bucket_ready(),
  public.private_bank_snapshot_file(text,text,jsonb),public.private_bank_snapshot_import(text,text,jsonb),public.private_bank_snapshot_capabilities()
  from public,anon,authenticated,service_role;
grant execute on function public.private_bank_snapshot_file(text,text,jsonb),public.private_bank_snapshot_import(text,text,jsonb),public.private_bank_snapshot_capabilities() to service_role;

comment on table public.private_bank_snapshots is 'C08 immutable preservation snapshots. Ready is not student eligibility, mathematical verification, licensing permission, or grading authority. No legacy source/backfill or delivery cutover.';
comment on function public.private_bank_snapshot_file(text,text,jsonb) is 'Administrator session required. verify_bytes and verify_records are trusted Edge-internal actions after actual Storage read-back/parsing; never forward browser action/verified flags. No SQL transaction spans Storage I/O.';
comment on function public.private_bank_snapshot_import(text,text,jsonb) is 'Closed additive admin archive import. Exact idempotency/CAS, scoped quotas and atomic seal/abort. Does not create a class assignment or authorize student delivery.';
commit;
