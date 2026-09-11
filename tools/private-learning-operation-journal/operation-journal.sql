-- Isolated tooling candidate: original27 migrations, then unchanged owner-fence.
-- No adoption, lazy owner creation, legacy writes, active API, or grading authority.
begin;

alter table private.learning_owner_routes add constraint learning_route_journal_scope_key
  unique(organization_id,account_id,fence_id,epoch);

create table private.learning_journal_owners (
  organization_id uuid not null, account_id uuid not null,
  incarnation_id uuid primary key, adoption_epoch smallint not null check(adoption_epoch=1),
  reset_generation bigint not null default 0 check(reset_generation between 0 and 9007199254740991),
  owner_revision bigint not null default 0 check(owner_revision between 0 and 9007199254740991),
  operation_count bigint not null default 0 check(operation_count between 0 and 50000),
  attempt_count bigint not null default 0 check(attempt_count between 0 and 50000),
  version_count bigint not null default 0 check(version_count between 0 and 200000),
  head_count bigint not null default 0 check(head_count between 0 and 50000),
  charged_bytes bigint not null default 0 check(charged_bytes between 0 and 268435456),
  unique(organization_id,account_id,incarnation_id,adoption_epoch),
  foreign key(organization_id,account_id,incarnation_id,adoption_epoch)
    references private.learning_owner_routes(organization_id,account_id,fence_id,epoch)
);

create table private.learning_journal_operations (
  organization_id uuid not null, account_id uuid not null, incarnation_id uuid not null,
  adoption_epoch smallint not null check(adoption_epoch=1), operation_id uuid not null,
  accepted_generation bigint not null check(accepted_generation between 0 and 9007199254740991),
  owner_revision bigint not null check(owner_revision between 1 and 9007199254740991),
  request_text text not null check(octet_length(request_text) <= 1048576),
  request_sha256 text not null check(request_sha256 collate "C" ~ '^[0-9a-f]{64}$'),
  receipt jsonb not null check(jsonb_typeof(receipt)='object' and octet_length(receipt::text)<=1048576),
  accepted_at timestamptz not null,
  primary key(incarnation_id,operation_id),
  unique(incarnation_id,owner_revision),
  unique(organization_id,account_id,incarnation_id,adoption_epoch,operation_id),
  foreign key(organization_id,account_id,incarnation_id,adoption_epoch)
    references private.learning_journal_owners(organization_id,account_id,incarnation_id,adoption_epoch)
);

create table private.learning_journal_attempts (
  organization_id uuid not null, account_id uuid not null, incarnation_id uuid not null,
  adoption_epoch smallint not null check(adoption_epoch=1), record_id text not null,
  record_generation bigint not null check(record_generation between 0 and 9007199254740991),
  operation_id uuid not null, value jsonb not null check(jsonb_typeof(value)='object' and octet_length(value::text)<=65536),
  value_sha256 text not null check(value_sha256 collate "C" ~ '^[0-9a-f]{64}$'),
  primary key(incarnation_id,record_id),
  foreign key(organization_id,account_id,incarnation_id,adoption_epoch,operation_id)
    references private.learning_journal_operations(organization_id,account_id,incarnation_id,adoption_epoch,operation_id)
);

create table private.learning_journal_versions (
  organization_id uuid not null, account_id uuid not null, incarnation_id uuid not null,
  adoption_epoch smallint not null check(adoption_epoch=1), record_generation bigint not null check(record_generation between 0 and 9007199254740991),
  kind text not null check(kind in ('sessions','review','lessons','mastery')), record_id text not null,
  record_revision bigint not null check(record_revision between 1 and 9007199254740991),
  operation_id uuid not null, deleted boolean not null, value jsonb not null,
  value_sha256 text not null check(value_sha256 collate "C" ~ '^[0-9a-f]{64}$'),
  check((deleted and value='null'::jsonb) or (not deleted and jsonb_typeof(value)='object')),
  check(octet_length(value::text)<=65536),
  primary key(incarnation_id,record_generation,kind,record_id,record_revision),
  unique(organization_id,account_id,incarnation_id,adoption_epoch,record_generation,kind,record_id,record_revision),
  foreign key(organization_id,account_id,incarnation_id,adoption_epoch,operation_id)
    references private.learning_journal_operations(organization_id,account_id,incarnation_id,adoption_epoch,operation_id)
);

create table private.learning_journal_heads (
  organization_id uuid not null, account_id uuid not null, incarnation_id uuid not null,
  adoption_epoch smallint not null check(adoption_epoch=1), record_generation bigint not null,
  kind text not null, record_id text not null, record_revision bigint not null,
  primary key(incarnation_id,record_generation,kind,record_id),
  foreign key(organization_id,account_id,incarnation_id,adoption_epoch,record_generation,kind,record_id,record_revision)
    references private.learning_journal_versions(organization_id,account_id,incarnation_id,adoption_epoch,record_generation,kind,record_id,record_revision)
);
create index journal_attempt_operation on private.learning_journal_attempts(incarnation_id,operation_id);
create index journal_version_operation on private.learning_journal_versions(incarnation_id,operation_id);

alter table private.learning_journal_owners enable row level security;
alter table private.learning_journal_operations enable row level security;
alter table private.learning_journal_attempts enable row level security;
alter table private.learning_journal_versions enable row level security;
alter table private.learning_journal_heads enable row level security;
revoke all on private.learning_journal_owners,private.learning_journal_operations,
  private.learning_journal_attempts,private.learning_journal_versions,private.learning_journal_heads
  from public,anon,authenticated,service_role;

create function private.learning_journal_immutable() returns trigger
language plpgsql set search_path=pg_catalog,pg_temp as $$
begin raise exception using errcode='23514',message='Immutable journal history'; end $$;
create trigger journal_operations_immutable before update or delete or truncate on private.learning_journal_operations
 for each statement execute function private.learning_journal_immutable();
create trigger journal_attempts_immutable before update or delete or truncate on private.learning_journal_attempts
 for each statement execute function private.learning_journal_immutable();
create trigger journal_versions_immutable before update or delete or truncate on private.learning_journal_versions
 for each statement execute function private.learning_journal_immutable();
create trigger journal_owners_retained before delete or truncate on private.learning_journal_owners
 for each statement execute function private.learning_journal_immutable();
create trigger journal_heads_retained before delete or truncate on private.learning_journal_heads
 for each statement execute function private.learning_journal_immutable();

create function private.learning_journal_owner_transition() returns trigger
language plpgsql set search_path=pg_catalog,pg_temp as $$
declare op private.learning_journal_operations%rowtype; ac bigint; vc bigint; hc bigint; charge bigint;
begin
 if tg_op='INSERT' then
   if (new.reset_generation,new.owner_revision,new.operation_count,new.attempt_count,new.version_count,new.head_count,new.charged_bytes)
     is distinct from (0::bigint,0::bigint,0::bigint,0::bigint,0::bigint,0::bigint,0::bigint) then
     raise exception using errcode='23514',message='Journal initialization invariant'; end if;
   return new;
 end if;
 if (new.organization_id,new.account_id,new.incarnation_id,new.adoption_epoch) is distinct from
   (old.organization_id,old.account_id,old.incarnation_id,old.adoption_epoch) or new.owner_revision<>old.owner_revision+1 then
   raise exception using errcode='23514',message='Journal owner transition invariant'; end if;
 select o.* into op from private.learning_journal_operations o where o.incarnation_id=old.incarnation_id and o.owner_revision=new.owner_revision;
 if not found then raise exception using errcode='23514',message='Journal owner receipt invariant'; end if;
 perform private.learning_journal_closed(op.receipt,array['contract','operation_id','incarnation_id','adoption_epoch','accepted_generation','owner_revision','request_sha256','accepted_at','durability','grading_authoritative','action','records','reset_to']);
 if op.receipt->>'contract' is distinct from 'echs.learning.server-receipt.v1' or op.receipt->'grading_authoritative' is distinct from 'false'::jsonb
   or op.receipt->>'operation_id' is distinct from op.operation_id::text or op.receipt->>'incarnation_id' is distinct from old.incarnation_id::text
   or op.receipt->'adoption_epoch' is distinct from '1'::jsonb or op.receipt->'owner_revision' is distinct from to_jsonb(new.owner_revision)
   or op.receipt->'accepted_generation' is distinct from to_jsonb(old.reset_generation)
   or op.accepted_generation<>old.reset_generation or
   (op.receipt->>'action'='reset' and (new.reset_generation<>old.reset_generation+1 or op.receipt->'records'<>'[]'::jsonb or op.receipt->>'reset_to'<>new.reset_generation::text)) or
   (op.receipt->>'action'='commit' and (new.reset_generation<>old.reset_generation or op.receipt->'reset_to'<>'null'::jsonb)) or
   op.receipt->>'action' is null or op.receipt->>'action' not in ('reset','commit') then
   raise exception using errcode='23514',message='Journal owner receipt invariant'; end if;
 select count(*),coalesce(sum(octet_length(a.value::text)),0) into ac,charge from private.learning_journal_attempts a
   where a.incarnation_id=old.incarnation_id and a.operation_id=op.operation_id;
 select count(*),count(*) filter(where v.record_revision=1),charge+coalesce(sum(octet_length(v.value::text)),0) into vc,hc,charge
   from private.learning_journal_versions v where v.incarnation_id=old.incarnation_id and v.operation_id=op.operation_id;
 charge:=charge+octet_length(op.request_text)+octet_length(op.receipt::text);
 if (new.operation_count,new.attempt_count,new.version_count,new.head_count,new.charged_bytes) is distinct from
   (old.operation_count+1,old.attempt_count+ac,old.version_count+vc,old.head_count+hc,old.charged_bytes+charge) then
   raise exception using errcode='23514',message='Journal owner usage invariant'; end if;
 return new;
end $$;
create trigger journal_owners_transition before insert or update on private.learning_journal_owners
 for each row execute function private.learning_journal_owner_transition();

create function private.learning_journal_head_transition() returns trigger
language plpgsql set search_path=pg_catalog,pg_temp as $$
begin
 if tg_op='UPDATE' then
   if (new.organization_id,new.account_id,new.incarnation_id,new.adoption_epoch,new.record_generation,new.kind,new.record_id) is distinct from
     (old.organization_id,old.account_id,old.incarnation_id,old.adoption_epoch,old.record_generation,old.kind,old.record_id)
     or new.record_revision<>old.record_revision+1 then
     raise exception using errcode='23514',message='Journal head transition invariant'; end if;
 elsif new.record_revision<>1 then raise exception using errcode='23514',message='Journal head initial revision invariant'; end if;
 if not exists(select 1 from private.learning_journal_versions v join private.learning_journal_operations o
   on (o.incarnation_id,o.operation_id)=(v.incarnation_id,v.operation_id)
   join private.learning_journal_owners s on s.incarnation_id=o.incarnation_id
   where (v.organization_id,v.account_id,v.incarnation_id,v.adoption_epoch,v.record_generation,v.kind,v.record_id,v.record_revision)=
     (new.organization_id,new.account_id,new.incarnation_id,new.adoption_epoch,new.record_generation,new.kind,new.record_id,new.record_revision)
   and v.record_generation=s.reset_generation and o.owner_revision=s.owner_revision+1) then
   raise exception using errcode='23514',message='Journal head version invariant'; end if;
 return new;
end $$;
create trigger journal_heads_transition before insert or update on private.learning_journal_heads
 for each row execute function private.learning_journal_head_transition();

create function private.learning_journal_limits() returns jsonb
language sql immutable set search_path=pg_catalog,pg_temp as $$
 select '{"record_operations":128,"row_bytes":65536,"normalized_request_bytes":1048576,"heads_per_read":8,"read_response_bytes":1048576,"depth":24,"nodes":100000,"retained_operations":50000,"retained_attempts":50000,"retained_versions":200000,"retained_heads":50000,"retained_normalized_bytes":268435456,"integer_max":9007199254740991}'::jsonb
$$;

create function private.learning_journal_closed(v jsonb,keys text[]) returns void
language plpgsql immutable set search_path=pg_catalog,pg_temp as $$
begin
 if v is null or jsonb_typeof(v)<>'object' or
    (select count(*) from jsonb_object_keys(v))<>cardinality(keys) or not(v ?& keys) then
   raise exception using errcode='22023',message='Invalid journal object';
 end if;
end $$;

create function private.learning_journal_integer(v jsonb,minimum bigint default 0) returns bigint
language plpgsql immutable set search_path=pg_catalog,pg_temp as $$
begin
 if v is null or jsonb_typeof(v)<>'number' or v::text collate "C" !~ '^(0|[1-9][0-9]{0,15})$' then
   raise exception using errcode='22023',message='Invalid journal integer'; end if;
 if (v::text)::numeric<minimum or (v::text)::numeric>9007199254740991 then
   raise exception using errcode='22023',message='Invalid journal integer'; end if;
 return (v::text)::bigint;
end $$;

create function private.learning_journal_uuid(v jsonb) returns uuid
language plpgsql immutable set search_path=pg_catalog,pg_temp as $$
begin
 if v is null or jsonb_typeof(v)<>'string' or (v#>>'{}') collate "C" !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
   raise exception using errcode='22023',message='Invalid journal identity'; end if;
 return (v#>>'{}')::uuid;
end $$;

create function private.learning_journal_id(v jsonb) returns text
language plpgsql immutable set search_path=pg_catalog,pg_temp as $$
declare s text; units integer;
begin
 if v is null or jsonb_typeof(v)<>'string' then
   raise exception using errcode='22023',message='Invalid journal record ID'; end if;
 s:=v#>>'{}';
 if length(s)=0 or octet_length(s)>1024 or exists(select 1 from generate_series(1,length(s)) i where ascii(substr(s,i,1)) between 0 and 31 or ascii(substr(s,i,1)) between 127 and 159) then
   raise exception using errcode='22023',message='Invalid journal record ID'; end if;
 select sum(case when ascii(substr(s,i,1))>65535 then 2 else 1 end) into units from generate_series(1,length(s)) i;
 if units>256 then raise exception using errcode='54000',message='Journal record ID limit'; end if;
 return s;
end $$;

-- JSONB has already parsed the wire. A future HTTP decoder must independently
-- bound it. Depth-limited SQL traversal avoids repeatedly copying a growing
-- PL/pgSQL array. The parent reads at most100001 nodes and rejects the excess.
create function private.learning_journal_bounded(v jsonb) returns void
language plpgsql immutable set search_path=pg_catalog,pg_temp as $$
declare total integer:=0; item record;
begin
 if v is null then raise exception using errcode='22023',message='Invalid journal input'; end if;
 if octet_length(v::text)>1048576 then raise exception using errcode='54000',message='Journal request limit'; end if;
 for item in
   with recursive walk(node,level,key) as (
     select v,1,null::text
     union all
     select child.value,parent.level+1,child.key from walk parent
     cross join lateral (
       select e.value,e.key from jsonb_each(case when jsonb_typeof(parent.node)='object' then parent.node else '{}'::jsonb end) e
       union all
       select a.value,null::text from jsonb_array_elements(case when jsonb_typeof(parent.node)='array' then parent.node else '[]'::jsonb end) a
     ) child where parent.level<=24
   ) select node,level,key from walk limit 100001
 loop
   total:=total+1;
   if total>100000 then raise exception using errcode='54000',message='Journal node limit'; end if;
   if item.level>24 then raise exception using errcode='54000',message='Journal depth limit'; end if;
   if item.key=any(array['__proto__','prototype','constructor','token','access_token','refresh_token','authorization','serviceKey','service_key','password']) then
     raise exception using errcode='22023',message='Forbidden journal field'; end if;
 end loop;
end $$;

create function private.learning_journal_value(kind text,id text,v jsonb) returns void
language plpgsql immutable set search_path=pg_catalog,pg_temp as $$
declare aliases text[]; alias text; present boolean:=false;
begin
 if v is null or jsonb_typeof(v)<>'object' then raise exception using errcode='22023',message='Invalid journal value'; end if;
 if octet_length(v::text)>65536 then raise exception using errcode='54000',message='Journal value limit'; end if;
 aliases:=case kind when 'attempts' then array['event_id','client_event_id','id']
   when 'sessions' then array['client_session_id','clientSessionId','id'] when 'review' then array['question_id','questionId','id']
   when 'lessons' then array['access_key'] when 'mastery' then array['skill_key','key'] else null end;
 if aliases is null then raise exception using errcode='22023',message='Invalid journal kind'; end if;
 foreach alias in array aliases loop
   if v ? alias then
     present:=true;
     if jsonb_typeof(v->alias)<>'string' or v->>alias<>id then
       raise exception using errcode='22023',message='Journal record identity mismatch'; end if;
   end if;
 end loop;
 if not present then raise exception using errcode='22023',message='Journal record identity missing'; end if;
end $$;

create function private.learning_journal_hash(v text) returns text
language sql immutable set search_path=pg_catalog,pg_temp as $$
 select private.bank_snapshot_hash(convert_to(v,'UTF8'))
$$;

-- Each call is VOLATILE under READ COMMITTED, so each SQL statement after a
-- wait obtains a fresh snapshot. Account/session locks are acquired only AFTER
-- owner serialization. Helpers are private and have no client EXECUTE grants.
create function private.learning_journal_authorize(p_hash text,p_binding jsonb,p_write boolean,p_started timestamptz)
returns private.learning_journal_owners
language plpgsql volatile security definer set search_path=pg_catalog,pg_temp as $$
declare sid uuid; aid uuid; org uuid; role_now text; status_now text;
 session_now private.sessions%rowtype; state private.learning_journal_owners%rowtype;
begin
 if current_setting('transaction_isolation')<>'read committed' then raise exception using errcode='0A000',message='Journal requires read committed'; end if;
 if p_hash is null or p_hash collate "C" !~ '^[0-9a-f]{64}$' then raise exception using errcode='28000',message='Journal session unavailable'; end if;
 select s.id,a.id,a.organization_id,a.role::text,a.status::text into sid,aid,org,role_now,status_now
   from private.sessions s join public.accounts a on a.id=s.account_id
   where s.token_hash=p_hash and s.revoked_at is null and s.expires_at>clock_timestamp();
 if not found or status_now<>'active' then raise exception using errcode='28000',message='Journal session unavailable'; end if;
 if role_now<>'student' then raise exception using errcode='42501',message='Journal actor unavailable'; end if;
 if p_write then
   select j.* into state from private.learning_journal_owners j
     join private.learning_owner_routes r on (r.organization_id,r.account_id,r.fence_id,r.epoch)=(j.organization_id,j.account_id,j.incarnation_id,j.adoption_epoch)
     where j.account_id=aid and j.organization_id=org for update of j;
 else
   select j.* into state from private.learning_journal_owners j
     join private.learning_owner_routes r on (r.organization_id,r.account_id,r.fence_id,r.epoch)=(j.organization_id,j.account_id,j.incarnation_id,j.adoption_epoch)
     where j.account_id=aid and j.organization_id=org for share of j;
 end if;
 if not found then raise exception using errcode='55000',message='Journal owner unavailable'; end if;
 if clock_timestamp()-p_started>interval '5 seconds' then raise exception using errcode='57014',message='Journal deadline'; end if;
 select a.role::text,a.status::text into role_now,status_now from public.accounts a
   where a.id=aid and a.organization_id=org for share;
 if not found or status_now<>'active' then raise exception using errcode='28000',message='Journal session unavailable'; end if;
 if role_now<>'student' then raise exception using errcode='42501',message='Journal actor unavailable'; end if;
 if clock_timestamp()-p_started>interval '5 seconds' then raise exception using errcode='57014',message='Journal deadline'; end if;
 select s.* into session_now from private.sessions s where s.id=sid and s.account_id=aid and s.token_hash=p_hash for share;
 if not found or session_now.revoked_at is not null or session_now.expires_at<=clock_timestamp() then
   raise exception using errcode='28000',message='Journal session unavailable'; end if;
 if not exists(select 1 from private.learning_owner_routes r join private.learning_owner_fences f on f.id=r.fence_id
   where (r.organization_id,r.account_id,r.fence_id,r.epoch)=(org,aid,state.incarnation_id,state.adoption_epoch)
   and f.live_account_id=aid and f.account_id=aid and f.epoch=1) then
   raise exception using errcode='55000',message='Journal owner unavailable'; end if;
 if p_binding is not null and (private.learning_journal_uuid(p_binding->'incarnation_id')<>state.incarnation_id
   or private.learning_journal_integer(p_binding->'adoption_epoch')<>state.adoption_epoch) then
   raise exception using errcode='55000',message='Journal owner unavailable'; end if;
 if clock_timestamp()-p_started>interval '5 seconds' then raise exception using errcode='57014',message='Journal deadline'; end if;
 return state;
end $$;

create function private.learning_journal_finish(p_hash text,p_owner uuid,p_started timestamptz,v jsonb) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog,pg_temp as $$
begin
 if not exists(select 1 from private.sessions s join public.accounts a on a.id=s.account_id
    where s.token_hash=p_hash and s.account_id=p_owner and s.revoked_at is null and s.expires_at>clock_timestamp()
    and a.status='active' and a.role='student') then
   raise exception using errcode='28000',message='Journal session unavailable'; end if;
 if clock_timestamp()-p_started>interval '5 seconds' then raise exception using errcode='57014',message='Journal deadline'; end if;
 if octet_length(v::text)>1048576 then raise exception using errcode='54000',message='Journal response limit'; end if;
 return v;
end $$;

create function private.learning_journal_binding(v jsonb) returns void
language plpgsql immutable set search_path=pg_catalog,pg_temp as $$
begin
 if v->>'contract' is distinct from 'echs.learning.server-journal.v1' or jsonb_typeof(v->'contract')<>'string' then
   raise exception using errcode='22023',message='Invalid journal contract'; end if;
 perform private.learning_journal_uuid(v->'incarnation_id');
 if private.learning_journal_integer(v->'adoption_epoch')<>1 then raise exception using errcode='55000',message='Journal owner unavailable'; end if;
end $$;

create function public.learning_journal_state(p_token_hash text,p_payload jsonb) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog,pg_temp as $$
declare started timestamptz:=clock_timestamp(); s private.learning_journal_owners%rowtype;
begin
 perform private.learning_journal_closed(p_payload,array[]::text[]);
 s:=private.learning_journal_authorize(p_token_hash,null,false,started);
 return private.learning_journal_finish(p_token_hash,s.account_id,started,jsonb_build_object('ok',true,'contract','echs.learning.server-journal.v1',
   'organization_id',s.organization_id,'account_id',s.account_id,'incarnation_id',s.incarnation_id,'adoption_epoch',s.adoption_epoch,
   'reset_generation',s.reset_generation,'owner_revision',s.owner_revision,'limits',private.learning_journal_limits(),'grading_authoritative',false));
end $$;

create function public.learning_journal_operation(p_token_hash text,p_payload jsonb) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog,pg_temp as $$
declare started timestamptz:=clock_timestamp(); s private.learning_journal_owners%rowtype; id uuid; receipt jsonb;
begin
 perform private.learning_journal_bounded(p_payload);
 perform private.learning_journal_closed(p_payload,array['contract','incarnation_id','adoption_epoch','operation_id']);
 perform private.learning_journal_binding(p_payload);id:=private.learning_journal_uuid(p_payload->'operation_id');
 s:=private.learning_journal_authorize(p_token_hash,p_payload,false,started);
 select o.receipt into receipt from private.learning_journal_operations o where o.incarnation_id=s.incarnation_id and o.operation_id=id;
 return private.learning_journal_finish(p_token_hash,s.account_id,started,jsonb_build_object('ok',true,'contract','echs.learning.server-journal.v1',
   'found',receipt is not null,'receipt',receipt,'current',jsonb_build_object('reset_generation',s.reset_generation,'owner_revision',s.owner_revision)));
end $$;

create function public.learning_journal_heads(p_token_hash text,p_payload jsonb) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog,pg_temp as $$
declare started timestamptz:=clock_timestamp(); s private.learning_journal_owners%rowtype;
 item jsonb; k text; id text; seen jsonb:='[]'; result jsonb:='[]'; v private.learning_journal_versions%rowtype; generation bigint;
begin
 perform private.learning_journal_bounded(p_payload);
 perform private.learning_journal_closed(p_payload,array['contract','incarnation_id','adoption_epoch','reset_generation','keys']);
 perform private.learning_journal_binding(p_payload);generation:=private.learning_journal_integer(p_payload->'reset_generation');
 if jsonb_typeof(p_payload->'keys')<>'array' or jsonb_array_length(p_payload->'keys') not between 1 and 8 then
   raise exception using errcode='22023',message='Invalid journal keys'; end if;
 for item in select value from jsonb_array_elements(p_payload->'keys') loop
   perform private.learning_journal_closed(item,array['kind','record_id']);id:=private.learning_journal_id(item->'record_id');k:=item->>'kind';
   if k not in ('sessions','review','lessons','mastery') or jsonb_typeof(item->'kind')<>'string' or seen @> jsonb_build_array(item) then
     raise exception using errcode='22023',message='Invalid journal keys'; end if;
   seen:=seen||jsonb_build_array(item);
 end loop;
 s:=private.learning_journal_authorize(p_token_hash,p_payload,false,started);
 if generation<>s.reset_generation then raise exception using errcode='40001',message='Journal generation conflict'; end if;
 for item in select value from jsonb_array_elements(p_payload->'keys') loop
   k:=item->>'kind';id:=item->>'record_id';
   select j.* into v from private.learning_journal_heads h join private.learning_journal_versions j
     on (j.incarnation_id,j.record_generation,j.kind,j.record_id,j.record_revision)=(h.incarnation_id,h.record_generation,h.kind,h.record_id,h.record_revision)
     where h.incarnation_id=s.incarnation_id and h.record_generation=generation and h.kind=k and h.record_id=id;
   if found then result:=result||jsonb_build_array(jsonb_build_object('kind',k,'record_id',id,'revision',v.record_revision,'deleted',v.deleted,'value',v.value,'value_sha256',v.value_sha256));
   else result:=result||jsonb_build_array(jsonb_build_object('kind',k,'record_id',id,'revision',0,'deleted',false,'value',null,'value_sha256',null)); end if;
 end loop;
 return private.learning_journal_finish(p_token_hash,s.account_id,started,jsonb_build_object('ok',true,'contract','echs.learning.server-journal.v1',
   'current',jsonb_build_object('reset_generation',s.reset_generation,'owner_revision',s.owner_revision),'records',result));
end $$;

create function public.learning_journal_apply(p_token_hash text,p_payload jsonb) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog,pg_temp as $$
declare started timestamptz:=clock_timestamp(); accepted timestamptz; s private.learning_journal_owners%rowtype;
 oldop private.learning_journal_operations%rowtype; oldattempt private.learning_journal_attempts%rowtype;
 op uuid; generation bigint; expected bigint; revision bigint; local_rev bigint; recgen bigint;
 item jsonb; metadata jsonb; receipt jsonb; records jsonb:='[]'; seen jsonb:='[]'; plans jsonb:='[]'; plan jsonb;
 id text; k text; action text; disposition text; val jsonb; vh text; normalized text; request_hash text;
 rowcount bigint; new_attempts bigint:=0; new_versions bigint:=0; new_heads bigint:=0; charge bigint:=0;
 reset_to bigint; idx integer:=0;
begin
 perform private.learning_journal_bounded(p_payload);
 action:=p_payload->>'action';
 if action='commit' then
   perform private.learning_journal_closed(p_payload,array['contract','action','operation_id','incarnation_id','adoption_epoch','reset_generation','records']);
   if jsonb_typeof(p_payload->'records')<>'array' or jsonb_array_length(p_payload->'records') not between 1 and 128 then
     raise exception using errcode='22023',message='Invalid journal records'; end if;
 elsif action='reset' then
   perform private.learning_journal_closed(p_payload,array['contract','action','operation_id','incarnation_id','adoption_epoch','reset_generation','expected_owner_revision']);
   perform private.learning_journal_integer(p_payload->'expected_owner_revision');
 else raise exception using errcode='22023',message='Invalid journal action'; end if;
 perform private.learning_journal_binding(p_payload);op:=private.learning_journal_uuid(p_payload->'operation_id');
 generation:=private.learning_journal_integer(p_payload->'reset_generation');
 -- Validate the entire closed body before any owner lock or durable write.
 for item in select value from jsonb_array_elements(coalesce(p_payload->'records','[]'::jsonb)) loop
   k:=item->>'kind';id:=private.learning_journal_id(item->'record_id');
   local_rev:=private.learning_journal_integer(item->'local_revision',1);
   if k='attempts' and item->>'action'='append' then
     perform private.learning_journal_closed(item,array['kind','record_id','local_revision','action','value']);
     perform private.learning_journal_value(k,id,item->'value');
   elsif k in ('sessions','review','lessons','mastery') and item->>'action'='put' then
     perform private.learning_journal_closed(item,array['kind','record_id','local_revision','action','expected_revision','value']);
     perform private.learning_journal_integer(item->'expected_revision');perform private.learning_journal_value(k,id,item->'value');
   elsif k in ('sessions','review','lessons','mastery') and item->>'action'='delete' then
     perform private.learning_journal_closed(item,array['kind','record_id','local_revision','action','expected_revision']);
     perform private.learning_journal_integer(item->'expected_revision',1);
   else raise exception using errcode='22023',message='Invalid journal record'; end if;
   if seen @> jsonb_build_array(jsonb_build_array(k,id)) then raise exception using errcode='22023',message='Duplicate journal record'; end if;
   seen:=seen||jsonb_build_array(jsonb_build_array(k,id));
 end loop;
 normalized:=p_payload::text;request_hash:=private.learning_journal_hash(normalized);
 s:=private.learning_journal_authorize(p_token_hash,p_payload,true,started);
 select o.* into oldop from private.learning_journal_operations o where o.incarnation_id=s.incarnation_id and o.operation_id=op;
 if found then
   if oldop.request_text<>normalized or oldop.request_sha256<>request_hash then raise exception using errcode='40001',message='Journal operation conflict'; end if;
   return private.learning_journal_finish(p_token_hash,s.account_id,started,jsonb_build_object('ok',true,'contract','echs.learning.server-journal.v1','replayed',true,
     'receipt',oldop.receipt,'current',jsonb_build_object('reset_generation',s.reset_generation,'owner_revision',s.owner_revision)));
 end if;
 if generation<>s.reset_generation then raise exception using errcode='40001',message='Journal generation conflict'; end if;
 if s.owner_revision=9007199254740991 then raise exception using errcode='54000',message='Journal revision limit'; end if;
 if action='reset' then
   if private.learning_journal_integer(p_payload->'expected_owner_revision')<>s.owner_revision then raise exception using errcode='40001',message='Journal owner revision conflict'; end if;
   if generation=9007199254740991 then raise exception using errcode='54000',message='Journal generation limit'; end if;
   reset_to:=generation+1;
 else
   for item in select value from jsonb_array_elements(p_payload->'records') loop
     k:=item->>'kind';id:=item->>'record_id';local_rev:=private.learning_journal_integer(item->'local_revision',1);
     val:=coalesce(item->'value','null'::jsonb);vh:=private.learning_journal_hash(val::text);recgen:=generation;
     if k='attempts' then
       select a.* into oldattempt from private.learning_journal_attempts a where a.incarnation_id=s.incarnation_id and a.record_id=id;
       if found then
         if oldattempt.value::text<>val::text or oldattempt.value_sha256<>vh then raise exception using errcode='23514',message='Immutable journal attempt conflict'; end if;
         disposition:='existing';recgen:=oldattempt.record_generation;
       else disposition:='appended';new_attempts:=new_attempts+1;charge:=charge+octet_length(val::text); end if;
       revision:=1;
     else
       select h.record_revision into revision from private.learning_journal_heads h where h.incarnation_id=s.incarnation_id
         and h.record_generation=generation and h.kind=k and h.record_id=id;
       revision:=coalesce(revision,0);expected:=private.learning_journal_integer(item->'expected_revision');
       if revision<>expected then raise exception using errcode='40001',message='Journal record revision conflict'; end if;
       if revision=9007199254740991 then raise exception using errcode='54000',message='Journal record revision limit'; end if;
       if revision=0 then new_heads:=new_heads+1; end if;
       revision:=revision+1;disposition:=case when item->>'action'='delete' then 'deleted' else 'put' end;
       new_versions:=new_versions+1;charge:=charge+octet_length(val::text);
     end if;
     metadata:=jsonb_build_object('request_index',idx,'kind',k,'record_id',id,'local_revision',local_rev,'record_revision',revision,
       'record_generation',recgen,'value_sha256',vh,'disposition',disposition);
     records:=records||jsonb_build_array(metadata);plans:=plans||jsonb_build_array(metadata||jsonb_build_object('value',val));idx:=idx+1;
   end loop;
 end if;
 accepted:=clock_timestamp();
 receipt:=jsonb_build_object('contract','echs.learning.server-receipt.v1','operation_id',op,'incarnation_id',s.incarnation_id,'adoption_epoch',s.adoption_epoch,
   'accepted_generation',generation,'owner_revision',s.owner_revision+1,'request_sha256',request_hash,
   'accepted_at',to_char(accepted at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
   'durability','committed','grading_authoritative',false,'action',action,'records',records,'reset_to',reset_to);
 -- Charge exactly retained normalized request text + immutable receipt text +
 -- newly retained value text. This is logical payload accounting, not disk size.
 charge:=charge+octet_length(normalized)+octet_length(receipt::text);
 if s.operation_count+1>50000 or s.attempt_count+new_attempts>50000 or s.version_count+new_versions>200000
   or s.head_count+new_heads>50000 or s.charged_bytes+charge>268435456 then
   raise exception using errcode='54000',message='Journal retained history limit'; end if;
 insert into private.learning_journal_operations values(s.organization_id,s.account_id,s.incarnation_id,s.adoption_epoch,op,generation,s.owner_revision+1,normalized,request_hash,receipt,accepted);
 get diagnostics rowcount=row_count;
 if rowcount<>1 or not exists(select 1 from private.learning_journal_operations o where o.incarnation_id=s.incarnation_id and o.operation_id=op
   and (o.organization_id,o.account_id,o.adoption_epoch,o.accepted_generation,o.owner_revision,o.request_text,o.request_sha256,o.receipt::text,o.accepted_at)
    =(s.organization_id,s.account_id,s.adoption_epoch,generation,s.owner_revision+1,normalized,request_hash,receipt::text,accepted)) then
   raise exception using errcode='23514',message='Journal operation invariant'; end if;
 for plan in select value from jsonb_array_elements(plans) loop
   k:=plan->>'kind';id:=plan->>'record_id';val:=plan->'value';vh:=plan->>'value_sha256';revision:=(plan->>'record_revision')::bigint;
   disposition:=plan->>'disposition';
   if disposition='appended' then
     insert into private.learning_journal_attempts values(s.organization_id,s.account_id,s.incarnation_id,s.adoption_epoch,id,generation,op,val,vh);
     get diagnostics rowcount=row_count;
     if rowcount<>1 or not exists(select 1 from private.learning_journal_attempts a where a.incarnation_id=s.incarnation_id and a.record_id=id
       and (a.organization_id,a.account_id,a.adoption_epoch,a.record_generation,a.operation_id,a.value::text,a.value_sha256)=(s.organization_id,s.account_id,s.adoption_epoch,generation,op,val::text,vh)) then
       raise exception using errcode='23514',message='Journal attempt invariant'; end if;
   elsif k<>'attempts' then
     insert into private.learning_journal_versions values(s.organization_id,s.account_id,s.incarnation_id,s.adoption_epoch,generation,k,id,revision,op,disposition='deleted',val,vh);
     get diagnostics rowcount=row_count;
     if rowcount<>1 or not exists(select 1 from private.learning_journal_versions v where (v.incarnation_id,v.record_generation,v.kind,v.record_id,v.record_revision)=(s.incarnation_id,generation,k,id,revision)
       and (v.organization_id,v.account_id,v.adoption_epoch,v.operation_id,v.deleted,v.value::text,v.value_sha256)=(s.organization_id,s.account_id,s.adoption_epoch,op,disposition='deleted',val::text,vh)) then
       raise exception using errcode='23514',message='Journal version invariant'; end if;
     if revision=1 then
       insert into private.learning_journal_heads values(s.organization_id,s.account_id,s.incarnation_id,s.adoption_epoch,generation,k,id,revision);
     else
       update private.learning_journal_heads h set record_revision=revision where h.incarnation_id=s.incarnation_id and h.record_generation=generation
         and h.kind=k and h.record_id=id and h.record_revision=revision-1;
     end if;
     get diagnostics rowcount=row_count;
     if rowcount<>1 or not exists(select 1 from private.learning_journal_heads h where (h.incarnation_id,h.record_generation,h.kind,h.record_id)=(s.incarnation_id,generation,k,id)
       and (h.organization_id,h.account_id,h.adoption_epoch,h.record_revision)=(s.organization_id,s.account_id,s.adoption_epoch,revision)) then
       raise exception using errcode='23514',message='Journal head invariant'; end if;
   end if;
 end loop;
 update private.learning_journal_owners j set reset_generation=coalesce(reset_to,generation),owner_revision=s.owner_revision+1,
   operation_count=s.operation_count+1,attempt_count=s.attempt_count+new_attempts,version_count=s.version_count+new_versions,
   head_count=s.head_count+new_heads,charged_bytes=s.charged_bytes+charge where j.incarnation_id=s.incarnation_id;
 get diagnostics rowcount=row_count;
 if rowcount<>1 or not exists(select 1 from private.learning_journal_owners j where j.incarnation_id=s.incarnation_id and
   (j.organization_id,j.account_id,j.adoption_epoch,j.reset_generation,j.owner_revision,j.operation_count,j.attempt_count,j.version_count,j.head_count,j.charged_bytes)=
   (s.organization_id,s.account_id,s.adoption_epoch,coalesce(reset_to,generation),s.owner_revision+1,s.operation_count+1,s.attempt_count+new_attempts,s.version_count+new_versions,s.head_count+new_heads,s.charged_bytes+charge)) then
   raise exception using errcode='23514',message='Journal owner invariant'; end if;
 return private.learning_journal_finish(p_token_hash,s.account_id,started,jsonb_build_object('ok',true,'contract','echs.learning.server-journal.v1','replayed',false,
   'receipt',receipt,'current',jsonb_build_object('reset_generation',coalesce(reset_to,generation),'owner_revision',s.owner_revision+1)));
end $$;

revoke all on function private.learning_journal_immutable(),private.learning_journal_owner_transition(),private.learning_journal_head_transition(),private.learning_journal_limits(),
 private.learning_journal_closed(jsonb,text[]),private.learning_journal_integer(jsonb,bigint),private.learning_journal_uuid(jsonb),
 private.learning_journal_id(jsonb),private.learning_journal_bounded(jsonb),private.learning_journal_value(text,text,jsonb),
 private.learning_journal_hash(text),private.learning_journal_authorize(text,jsonb,boolean,timestamptz),
 private.learning_journal_finish(text,uuid,timestamptz,jsonb),private.learning_journal_binding(jsonb)
 from public,anon,authenticated,service_role;
revoke all on function public.learning_journal_state(text,jsonb),public.learning_journal_apply(text,jsonb),
 public.learning_journal_operation(text,jsonb),public.learning_journal_heads(text,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.learning_journal_state(text,jsonb),public.learning_journal_apply(text,jsonb),
 public.learning_journal_operation(text,jsonb),public.learning_journal_heads(text,jsonb) to service_role;
commit;
