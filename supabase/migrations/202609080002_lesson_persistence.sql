-- ECHS-007. Additive, session-authenticated lesson storage. No lesson/catalog/evidence seeds.
-- The Edge endpoint additionally runs the canonical schema, semantic and KaTeX validators.
-- SQL enforces a closed bounded document shape, identities, authorization and transitions.
begin;

create function private.lesson_keys(value jsonb, allowed text[], required text[])
returns boolean language sql immutable set search_path = pg_catalog as $$
  select case when jsonb_typeof(value)='object' then value ?& required
    and not exists (select 1 from jsonb_object_keys(value) k where not k=any(allowed)) else false end;
$$;

create function private.lesson_json_valid(value jsonb, kind text, depth integer default 0)
returns boolean language plpgsql immutable set search_path = pg_catalog as $$
declare item jsonb; child jsonb; field text; text_value text; allowed text[];
begin
  if value is null or depth>12 then return false; end if;
  if kind in ('uuid','id','scoped','title','plain','tex') then
    if jsonb_typeof(value)<>'string' then return false; end if;
    text_value := value#>>'{}';
    if kind='uuid' then return text_value ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'; end if;
    if kind='id' then return length(text_value) between 1 and 128 and text_value ~ '^[A-Za-z][A-Za-z0-9_-]*$'; end if;
    if kind='scoped' then return length(text_value) between 1 and 160 and text_value ~ '^[A-Za-z0-9][A-Za-z0-9._:-]*$'; end if;
    if length(text_value) not between 1 and case when kind='title' then 240 else 4000 end
      or text_value !~ '[^[:space:]]' then return false; end if;
    if kind<>'tex' and text_value ~ '[<>]' then return false; end if;
    if kind='title' then return text_value !~ '[[:cntrl:]]'; end if;
    return translate(text_value,chr(9)||chr(10)||chr(13),'') !~ '[[:cntrl:]]';
  end if;
  if kind='rich' then
    if not private.lesson_keys(value,array['paragraphs'],array['paragraphs'])
      or jsonb_typeof(value->'paragraphs')<>'array' then return false; end if;
    if jsonb_array_length(value->'paragraphs') not between 1 and 50 then return false; end if;
    for item in select * from jsonb_array_elements(value->'paragraphs') loop
      if not private.lesson_json_valid(item,'paragraph',depth+1) then return false; end if;
    end loop;
    return true;
  elsif kind='paragraph' then
    if not private.lesson_keys(value,array['type','children'],array['type','children'])
      or value->>'type' is distinct from 'paragraph' or jsonb_typeof(value->'children')<>'array' then return false; end if;
    if jsonb_array_length(value->'children') not between 1 and 100 then return false; end if;
    for item in select * from jsonb_array_elements(value->'children') loop
      if item->>'type'='text' then
        if not private.lesson_keys(item,array['type','text','marks'],array['type','text'])
          or not private.lesson_json_valid(item->'text','plain',depth+1) then return false; end if;
        if item ? 'marks' then
          if jsonb_typeof(item->'marks')<>'array' then return false; end if;
          if jsonb_array_length(item->'marks')>2 then return false; end if;
          for child in select * from jsonb_array_elements(item->'marks') loop
            if child not in ('"strong"'::jsonb,'"em"'::jsonb) then return false; end if;
          end loop;
        end if;
      elsif item->>'type'='math' then
        if not private.lesson_keys(item,array['type','tex','spoken'],array['type','tex','spoken'])
          or not private.lesson_json_valid(item->'tex','tex',depth+1)
          or not private.lesson_json_valid(item->'spoken','plain',depth+1) then return false; end if;
      else return false;
      end if;
    end loop;
    return true;
  elsif kind='block' then
    if not private.lesson_keys(value,array['id','type','version','content'],array['id','type','version','content'])
      or not private.lesson_json_valid(value->'id','id',depth+1) or value->'version'<>'1'::jsonb then return false; end if;
    item := value->'content';
    case value->>'type'
      when 'rich-text' then return private.lesson_json_valid(item,'rich',depth+1);
      when 'math' then return private.lesson_keys(item,array['tex','spoken','display'],array['tex','spoken','display'])
        and private.lesson_json_valid(item->'tex','tex',depth+1) and private.lesson_json_valid(item->'spoken','plain',depth+1)
        and jsonb_typeof(item->'display')='boolean';
      when 'callout' then return private.lesson_keys(item,array['kind','title','body'],array['kind','title','body'])
        and coalesce(item->>'kind','') in ('note','definition','warning','example')
        and private.lesson_json_valid(item->'title','title',depth+1) and private.lesson_json_valid(item->'body','rich',depth+1);
      when 'legacy-embedded' then return private.lesson_keys(item,array['source','anchor','sha256','summary'],array['source','anchor','sha256','summary'])
        and jsonb_typeof(item->'source')='string' and length(item->>'source') between 14 and 400
        and item->>'source' ~ '^lessons/([A-Za-z0-9][A-Za-z0-9._-]*/)*[A-Za-z0-9][A-Za-z0-9._-]*\.html$'
        and jsonb_typeof(item->'anchor')='string' and length(item->>'anchor')<=128
        and item->>'anchor' ~ '^([A-Za-z][A-Za-z0-9_-]*)?$'
        and jsonb_typeof(item->'sha256')='string' and item->>'sha256' ~ '^[0-9a-f]{64}$'
        and private.lesson_json_valid(item->'summary','plain',depth+1);
      else return false;
    end case;
  elsif kind='slide' then
    if not private.lesson_keys(value,array['id','title','layout','blocks'],array['id','title','layout','blocks'])
      or not private.lesson_json_valid(value->'id','id',depth+1) or not private.lesson_json_valid(value->'title','title',depth+1)
      or coalesce(value->>'layout','') not in ('single','two-column','three-panel') or jsonb_typeof(value->'blocks')<>'array' then return false; end if;
    if jsonb_array_length(value->'blocks') not between 1 and 40 then return false; end if;
    for item in select * from jsonb_array_elements(value->'blocks') loop
      if not private.lesson_json_valid(item,'block',depth+1) then return false; end if;
    end loop;
    return true;
  elsif kind='document' then
    allowed := array['schema_version','document_version','lesson_id','course_version_id','unit_id','topic_id','slug','title','objectives','skills','slides','publication','accessibility','variants'];
    -- Secondary SQL serialization budget. The trusted Edge persistence validator
    -- enforces <=1 MiB compact JSON UTF-8; jsonb::text inserts structural whitespace.
    -- This 2 MiB defense cap accommodates that expansion without relaxing Edge input.
    if not private.lesson_keys(value,allowed,allowed) or octet_length(value::text)>2097152
      or value->>'schema_version' is distinct from 'echs.lesson.v1'
      or jsonb_typeof(value->'document_version')<>'number' or value->>'document_version' !~ '^[1-9][0-9]{0,9}$'
      or (value->>'document_version')::numeric>2147483647 then return false; end if;
    foreach field in array array['lesson_id','course_version_id'] loop
      if not private.lesson_json_valid(value->field,'uuid',depth+1) then return false; end if;
    end loop;
    foreach field in array array['unit_id','topic_id'] loop
      if not private.lesson_json_valid(value->field,'scoped',depth+1) then return false; end if;
    end loop;
    if jsonb_typeof(value->'slug')<>'string' or length(value->>'slug') not between 1 and 160
      or value->>'slug' !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or not private.lesson_json_valid(value->'title','title',depth+1) then return false; end if;
    foreach field in array array['objectives','skills','slides'] loop
      if jsonb_typeof(value->field)<>'array' then return false; end if;
      if jsonb_array_length(value->field) not between 1 and case when field='slides' then 120 else 40 end then return false; end if;
      for item in select * from jsonb_array_elements(value->field) loop
        if field='slides' then
          if not private.lesson_json_valid(item,'slide',depth+1) then return false; end if;
        elsif field='skills' then
          if not private.lesson_json_valid(item,'scoped',depth+1) then return false; end if;
        else
          if not private.lesson_keys(item,array['id','text'],array['id','text'])
            or not private.lesson_json_valid(item->'id','scoped',depth+1)
            or not private.lesson_json_valid(item->'text','plain',depth+1) then return false; end if;
        end if;
      end loop;
    end loop;
    item := value->'publication';
    if not private.lesson_keys(item,array['status','audience','revision'],array['status','audience','revision'])
      or coalesce(item->>'status','') not in ('draft','published') or item->>'audience' is distinct from 'institutional'
      or jsonb_typeof(item->'revision')<>'number' or item->>'revision' !~ '^[1-9][0-9]{0,9}$'
      or (item->>'revision')::numeric>2147483647 then return false; end if;
    item := value->'accessibility';
    if not private.lesson_keys(item,array['language','summary'],array['language','summary'])
      or jsonb_typeof(item->'language')<>'string' or length(item->>'language') not between 2 and 35
      or item->>'language' !~ '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$'
      or not private.lesson_json_valid(item->'summary','plain',depth+1) then return false; end if;
    item := value->'variants';
    if not private.lesson_keys(item,array['contexts'],array['contexts']) or jsonb_typeof(item->'contexts')<>'array' then return false; end if;
    if jsonb_array_length(item->'contexts') not between 1 and 2 then return false; end if;
    for child in select * from jsonb_array_elements(item->'contexts') loop
      if child not in ('"neutral"'::jsonb,'"qatar"'::jsonb) then return false; end if;
    end loop;
    return true;
  end if;
  return false;
exception when invalid_text_representation or numeric_value_out_of_range then return false;
end;
$$;

create function private.lesson_course_family(course_code text, class_course_key text)
returns text language sql immutable set search_path = pg_catalog as $$
  select case
    when course_code='ap-calculus-ab' and class_course_key=any(array['ap-calculus','ap-calculus-ab','g12-ap-calculus-ab']) then 'ap-calculus'
    when course_code='ap-calculus-bc' and class_course_key=any(array['ap-calculus','ap-calculus-bc']) then 'ap-calculus'
    when course_code='ap-precalculus' and class_course_key=any(array['ap-precalculus','ap-precalculus-g10-g11']) then 'ap-precalculus'
    when course_code='ib-math-ai-sl' and class_course_key=any(array['ib-math-ai','ib-math-ai-sl','g11-ib-ai','ib-mathematics-ai']) then 'ib-math-ai'
    else null end;
$$;

create function private.lesson_topic_id(course_key text, topic text)
returns text language sql immutable set search_path = pg_catalog as $$
  select 'legacy:'||course_key||case when topic ~ '^[A-Za-z0-9][A-Za-z0-9._:-]*$'
    and length('legacy:'||course_key||':topic:'||topic)<=160 then ':topic:'||topic
    else ':topic-sha256:'||encode(sha256(convert_to(topic,'UTF8')),'hex') end;
$$;

create table public.authored_lessons (
  id uuid primary key,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  class_id uuid not null,
  course_version_id uuid not null references public.course_versions(id) on delete restrict,
  access_key text not null check (length(access_key) between 1 and 400),
  legacy_course_key text not null,
  route_path text not null check (length(route_path)<=400 and route_path ~ '^lessons/([A-Za-z0-9][A-Za-z0-9._-]*/)*[A-Za-z0-9][A-Za-z0-9._-]*\.html$'),
  unit_id text not null,
  topic_id text not null,
  slug text not null,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  head_revision integer not null check (head_revision>0),
  head_version_id uuid not null,
  workflow_state text not null check (workflow_state in ('draft','review','approved','published')),
  approved_version_id uuid,
  approved_review_id uuid,
  active_publication_id uuid,
  unique (organization_id,id),
  unique (class_id,course_version_id,access_key),
  constraint authored_lesson_class_tenant foreign key (organization_id,class_id) references public.classes(organization_id,id) on delete restrict,
  constraint authored_lesson_author_tenant foreign key (organization_id,created_by) references public.accounts(organization_id,id) on delete restrict,
  constraint authored_lesson_approval_state check ((workflow_state in ('approved','published'))=(approved_version_id is not null and approved_review_id is not null)),
  constraint authored_lesson_approval_pair check ((approved_version_id is null)=(approved_review_id is null))
);

create table public.lesson_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  lesson_id uuid not null,
  version_number integer not null check (version_number>0),
  document jsonb not null,
  private_notes text not null default '' check (length(private_notes)<=20000),
  created_by uuid not null,
  created_at timestamptz not null default now(),
  restored_from_version_id uuid,
  unique (lesson_id,id),
  unique (lesson_id,version_number),
  constraint lesson_version_tenant foreign key (organization_id,lesson_id) references public.authored_lessons(organization_id,id) on delete restrict,
  constraint lesson_version_author_tenant foreign key (organization_id,created_by) references public.accounts(organization_id,id) on delete restrict,
  constraint lesson_version_restore_source foreign key (lesson_id,restored_from_version_id) references public.lesson_versions(lesson_id,id) on delete restrict,
  constraint lesson_version_document check (private.lesson_json_valid(document,'document') is true
    and document->>'lesson_id'=lesson_id::text and document->>'document_version'=version_number::text
    and document#>>'{publication,status}'='draft' and document#>>'{publication,revision}'=version_number::text)
);

create table public.lesson_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  lesson_id uuid not null,
  version_id uuid not null,
  revision integer not null check (revision>0),
  event_type text not null check (event_type in ('requested','approved')),
  actor_id uuid not null,
  checks jsonb,
  comment text not null default '' check (length(comment)<=4000),
  created_at timestamptz not null default now(),
  unique (lesson_id,id),
  unique (lesson_id,revision),
  constraint lesson_review_tenant foreign key (organization_id,lesson_id) references public.authored_lessons(organization_id,id) on delete restrict,
  constraint lesson_review_version foreign key (lesson_id,version_id) references public.lesson_versions(lesson_id,id) on delete restrict,
  constraint lesson_review_actor_tenant foreign key (organization_id,actor_id) references public.accounts(organization_id,id) on delete restrict,
  constraint lesson_review_checks check ((event_type='requested' and checks is null) or (event_type='approved' and checks is not null
    and checks='{"curriculum":true,"mathematics":true,"accessibility":true,"rights":true,"student_safe":true}'::jsonb))
);

create table public.lesson_publications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  lesson_id uuid not null,
  source_version_id uuid not null,
  revision integer not null check (revision>0),
  event_type text not null check (event_type in ('published','unpublished')),
  actor_id uuid not null,
  document jsonb,
  reason text not null default '' check (length(reason)<=1000),
  created_at timestamptz not null default now(),
  unique (lesson_id,id),
  unique (lesson_id,revision),
  constraint lesson_publication_tenant foreign key (organization_id,lesson_id) references public.authored_lessons(organization_id,id) on delete restrict,
  constraint lesson_publication_version foreign key (lesson_id,source_version_id) references public.lesson_versions(lesson_id,id) on delete restrict,
  constraint lesson_publication_actor_tenant foreign key (organization_id,actor_id) references public.accounts(organization_id,id) on delete restrict,
  constraint lesson_publication_snapshot check ((event_type='unpublished' and document is null) or (event_type='published'
    and private.lesson_json_valid(document,'document') is true and document->>'lesson_id'=lesson_id::text
    and document#>>'{publication,status}'='published' and document#>>'{publication,revision}'=revision::text
    and not jsonb_path_exists(document,'$.slides[*].blocks[*] ? (@.type == "legacy-embedded")')))
);

alter table public.authored_lessons
  add constraint authored_lesson_head foreign key (id,head_version_id) references public.lesson_versions(lesson_id,id) deferrable initially deferred,
  add constraint authored_lesson_approved_version foreign key (id,approved_version_id) references public.lesson_versions(lesson_id,id) deferrable initially deferred,
  add constraint authored_lesson_approved_review foreign key (id,approved_review_id) references public.lesson_reviews(lesson_id,id) deferrable initially deferred,
  add constraint authored_lesson_publication foreign key (id,active_publication_id) references public.lesson_publications(lesson_id,id) deferrable initially deferred;

create function private.lesson_append_only()
returns trigger language plpgsql set search_path = pg_catalog as $$
begin raise exception 'Lesson history is append-only' using errcode='23514'; end;
$$;
create function private.lesson_identity_immutable()
returns trigger language plpgsql set search_path = pg_catalog as $$
begin
  if tg_op='DELETE' then raise exception 'Lesson identity cannot be deleted' using errcode='23514'; end if;
  if row(new.id,new.organization_id,new.class_id,new.course_version_id,new.access_key,new.legacy_course_key,new.route_path,new.unit_id,new.topic_id,new.slug,new.created_by,new.created_at)
    is distinct from row(old.id,old.organization_id,old.class_id,old.course_version_id,old.access_key,old.legacy_course_key,old.route_path,old.unit_id,old.topic_id,old.slug,old.created_by,old.created_at)
    or new.head_revision<>old.head_revision+1 then
    raise exception 'Lesson identity is immutable and revisions advance once' using errcode='23514';
  end if;
  return new;
end;
$$;
create trigger authored_lessons_identity before update or delete on public.authored_lessons for each row execute function private.lesson_identity_immutable();
create trigger authored_lessons_no_truncate before truncate on public.authored_lessons for each statement execute function private.lesson_append_only();
create trigger lesson_versions_append_only before update or delete on public.lesson_versions for each row execute function private.lesson_append_only();
create trigger lesson_versions_no_truncate before truncate on public.lesson_versions for each statement execute function private.lesson_append_only();
create trigger lesson_reviews_append_only before update or delete on public.lesson_reviews for each row execute function private.lesson_append_only();
create trigger lesson_reviews_no_truncate before truncate on public.lesson_reviews for each statement execute function private.lesson_append_only();
create trigger lesson_publications_append_only before update or delete on public.lesson_publications for each row execute function private.lesson_append_only();
create trigger lesson_publications_no_truncate before truncate on public.lesson_publications for each statement execute function private.lesson_append_only();

create function private.lesson_staff_snapshot(selected_lesson_id uuid)
returns jsonb language sql volatile set search_path = pg_catalog as $$
  select jsonb_build_object('ok',true,'contract','echs.lesson.store.v1','lesson',to_jsonb(l),
    'head',to_jsonb(v),
    'versions',coalesce((select jsonb_agg(to_jsonb(h)-'document'-'private_notes' order by h.version_number desc)
      from (select * from public.lesson_versions where lesson_id=l.id order by version_number desc limit 25) h),'[]'::jsonb),
    'reviews',coalesce((select jsonb_agg(to_jsonb(h) order by h.revision desc)
      from (select * from public.lesson_reviews where lesson_id=l.id order by revision desc limit 25) h),'[]'::jsonb),
    'publications',coalesce((select jsonb_agg(to_jsonb(h)-'document' order by h.revision desc)
      from (select * from public.lesson_publications where lesson_id=l.id order by revision desc limit 25) h),'[]'::jsonb))
  from public.authored_lessons l join public.lesson_versions v on v.lesson_id=l.id and v.id=l.head_version_id where l.id=selected_lesson_id;
$$;

create function public.lesson_store(p_token_hash text, p_action text, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = pg_catalog as $$
#variable_conflict use_variable
declare
  actor public.accounts%rowtype;
  authenticated_session private.sessions%rowtype;
  selected_class public.classes%rowtype;
  selected_course public.course_versions%rowtype;
  selected_pin public.class_course_version_assignments%rowtype;
  selected_lesson public.authored_lessons%rowtype;
  head public.lesson_versions%rowtype;
  source_version public.lesson_versions%rowtype;
  active_publication public.lesson_publications%rowtype;
  catalog public.lesson_catalog%rowtype;
  predecessor public.lesson_catalog%rowtype;
  actor_id uuid; class_id uuid; lesson_id uuid; course_id uuid; version_id uuid; event_id uuid; expected_pin uuid;
  requested_revision integer; next_revision integer; limit_count integer :=25; before_number integer;
  document jsonb; notes text; family text; member_role text; override_state text; reason text; result jsonb;
  allowed text[]; required text[]; field text; actor_json jsonb;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then raise exception 'Valid school session required' using errcode='28000'; end if;
  -- Read the account id, then lock account before session (matches account suspension flows).
  select s.account_id into actor_id from private.sessions s where s.token_hash=p_token_hash;
  if not found then raise exception 'Valid school session required' using errcode='28000'; end if;
  select * into actor from public.accounts a where a.id=actor_id for share;
  select * into authenticated_session from private.sessions s where s.token_hash=p_token_hash and s.account_id=actor.id for share;
  if not found or actor.status is distinct from 'active' or authenticated_session.revoked_at is not null
    or authenticated_session.expires_at<=clock_timestamp() then raise exception 'Valid school session required' using errcode='28000'; end if;
  -- The HTTP body is <=1 MiB+128 KiB. This secondary jsonb::text cap allows
  -- PostgreSQL structural whitespace plus the separately bounded private notes.
  if jsonb_typeof(p_payload) is distinct from 'object' or octet_length(p_payload::text)>2228224 then
    raise exception 'Bounded object payload required' using errcode='22023'; end if;
  case p_action
    when 'context' then allowed:=array['class_id']; required:='{}';
    when 'list' then allowed:=array['class_id']; required:=allowed;
    when 'get' then allowed:=array['lesson_id']; required:=allowed;
    when 'version' then allowed:=array['lesson_id','version_id']; required:=allowed;
    when 'history' then allowed:=array['lesson_id','before_version','limit']; required:=array['lesson_id'];
    when 'create' then allowed:=array['class_id','course_version_id','access_key','document','private_notes','expected_revision']; required:=allowed;
    when 'save' then allowed:=array['lesson_id','expected_revision','document','private_notes']; required:=allowed;
    when 'restore' then allowed:=array['lesson_id','expected_revision','version_id']; required:=allowed;
    when 'request_review' then allowed:=array['lesson_id','expected_revision']; required:=allowed;
    when 'approve' then allowed:=array['lesson_id','expected_revision','validated_version_id','checks','comment']; required:=array['lesson_id','expected_revision','validated_version_id','checks'];
    when 'publish' then allowed:=array['lesson_id','expected_revision','validated_version_id']; required:=allowed;
    when 'unpublish' then allowed:=array['lesson_id','expected_revision','reason']; required:=allowed;
    when 'deliver' then allowed:=array['lesson_id','class_id']; required:=allowed;
    when 'pin_course' then allowed:=array['class_id','course_version_id','expected_assignment_id','reason']; required:=allowed;
    else raise exception 'Unknown lesson action' using errcode='22023';
  end case;
  if p_action<>'deliver' and actor.role not in ('admin','teacher') then raise exception 'Staff scope required' using errcode='42501'; end if;
  if p_action='deliver' and actor.role not in ('admin','teacher','student') then raise exception 'Lesson membership required' using errcode='42501'; end if;
  if private.lesson_keys(p_payload,allowed,required) is not true then raise exception 'Unexpected or missing payload fields' using errcode='22023'; end if;
  foreach field in array array['class_id','lesson_id','course_version_id','version_id','validated_version_id','expected_assignment_id'] loop
    if p_payload ? field and not (field='expected_assignment_id' and p_payload->field='null'::jsonb)
      and private.lesson_json_valid(p_payload->field,'uuid') is not true then raise exception 'Invalid identifier' using errcode='22023'; end if;
  end loop;
  foreach field in array array['expected_revision','before_version','limit'] loop
    if p_payload ? field then
      if jsonb_typeof(p_payload->field) is distinct from 'number' or p_payload->>field !~ '^(0|[1-9][0-9]{0,9})$'
        or (p_payload->>field)::numeric>2147483647 then raise exception 'Invalid revision or page bound' using errcode='22023'; end if;
    end if;
  end loop;
  requested_revision:=(p_payload->>'expected_revision')::integer;
  actor_json:=jsonb_build_object('id',actor.id,'role',actor.role,'organization_id',actor.organization_id);

  if p_action='context' and not p_payload ? 'class_id' then
    select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'course_key',c.course_key,
      'current_assignment',(select to_jsonb(p) from public.class_course_version_assignments p where p.organization_id=c.organization_id and p.class_id=c.id and p.state='active'),
      'course_versions',(select coalesce(jsonb_agg(to_jsonb(v) order by v.version_key),'[]'::jsonb) from public.course_versions v
        join public.curriculum_versions cv on cv.id=v.curriculum_version_id where v.status='active' and not v.is_placeholder and cv.status='active'
        and private.lesson_course_family(v.course_code,c.course_key) is not null)) order by c.name,c.id),'[]'::jsonb)
    into result from public.classes c where c.organization_id=actor.organization_id and c.status='active'
      and (actor.role='admin' or exists(select 1 from public.class_memberships m where m.class_id=c.id and m.account_id=actor.id and m.membership_role='teacher'));
    if authenticated_session.expires_at<=clock_timestamp() then raise exception 'School session expired' using errcode='28000'; end if;
    return jsonb_build_object('ok',true,'contract','echs.lesson.store.v1','actor',actor_json,'classes',result);
  end if;
  lesson_id:=(p_payload->>'lesson_id')::uuid;
  if lesson_id is not null then
    select * into selected_lesson from public.authored_lessons l where l.id=lesson_id and l.organization_id=actor.organization_id;
    if not found then raise exception 'Lesson not found in authorized scope' using errcode='P0002'; end if;
    class_id:=selected_lesson.class_id;
    if p_payload ? 'class_id' and (p_payload->>'class_id')::uuid<>class_id then raise exception 'Exact lesson class required' using errcode='42501'; end if;
  else class_id:=(p_payload->>'class_id')::uuid;
  end if;
  -- Every scoped store action locks the class. This serializes pin creation/replacement,
  -- including the missing-pin case, with all lesson mutations and deliveries.
  select * into selected_class from public.classes c where c.id=class_id and c.organization_id=actor.organization_id and c.status='active' for update;
  if not found then raise exception 'Active class in this organization required' using errcode='42501'; end if;
  if actor.role<>'admin' then
    select m.membership_role into member_role from public.class_memberships m where m.class_id=class_id and m.account_id=actor.id for share;
    if not found or member_role is distinct from actor.role then raise exception 'Exact current class membership required' using errcode='42501'; end if;
  end if;
  if authenticated_session.expires_at<=clock_timestamp() then raise exception 'School session expired' using errcode='28000'; end if;
  select * into selected_pin from public.class_course_version_assignments p
    where p.organization_id=actor.organization_id and p.class_id=class_id and p.state='active' for share;

  if p_action='pin_course' then
    if actor.role<>'admin' then raise exception 'Administrator required to pin a course' using errcode='42501'; end if;
    expected_pin:=(p_payload->>'expected_assignment_id')::uuid;
    if expected_pin is distinct from selected_pin.id then raise exception 'Course assignment changed' using errcode='40001'; end if;
    if jsonb_typeof(p_payload->'reason') is distinct from 'string' or length(btrim(p_payload->>'reason')) not between 1 and 1000 then
      raise exception 'Explicit pin reason required' using errcode='22023'; end if;
    course_id:=(p_payload->>'course_version_id')::uuid;
    select * into selected_course from public.course_versions v where v.id=course_id for share;
    if not found or selected_course.status<>'active' or selected_course.is_placeholder
      or not exists(select 1 from public.curriculum_versions cv where cv.id=selected_course.curriculum_version_id and cv.status='active')
      or private.lesson_course_family(selected_course.course_code,selected_class.course_key) is null then
      raise exception 'Explicit compatible active course version required' using errcode='23514'; end if;
    if selected_pin.course_version_id=course_id then raise exception 'Class already has this active course pin' using errcode='23514'; end if;
    if selected_pin.id is not null then update public.class_course_version_assignments set state='superseded' where id=selected_pin.id; end if;
    insert into public.class_course_version_assignments(organization_id,class_id,course_version_id,assigned_by,state,reason)
      values(actor.organization_id,class_id,course_id,actor.id,'active',btrim(p_payload->>'reason')) returning * into selected_pin;
    -- Pin history itself is the append-only audit: actor, reason, time and superseded row.
    if authenticated_session.expires_at<=clock_timestamp() then raise exception 'School session expired' using errcode='28000'; end if;
    return jsonb_build_object('ok',true,'contract','echs.lesson.store.v1','assignment',to_jsonb(selected_pin));
  end if;

  if p_action='context' then
    family:=null;
    if selected_pin.id is not null then
      select * into selected_course from public.course_versions v where v.id=selected_pin.course_version_id;
      family:=private.lesson_course_family(selected_course.course_code,selected_class.course_key);
    end if;
    select coalesce(jsonb_agg(jsonb_build_object('access_key',c.access_key,'course_key',c.course_key,'title',c.title,
      'route_path',c.url,'unit_id','legacy:'||c.course_key||':unit:'||(c.unit_index+1)::text,
      'topic_id',private.lesson_topic_id(c.course_key,c.topic),'topic',c.topic,'unit_index',c.unit_index,'is_ready',c.is_ready)
      order by c.position,c.access_key),'[]'::jsonb) into result from public.lesson_catalog c
      where c.organization_id=actor.organization_id and c.course_key=family and c.url ~ '^lessons/([A-Za-z0-9][A-Za-z0-9._-]*/)*[A-Za-z0-9][A-Za-z0-9._-]*\.html$' and length(c.url)<=400;
    if authenticated_session.expires_at<=clock_timestamp() then raise exception 'School session expired' using errcode='28000'; end if;
    return jsonb_build_object('ok',true,'contract','echs.lesson.store.v1','actor',actor_json,'class',to_jsonb(selected_class),
      'current_assignment',case when selected_pin.id is null then null else to_jsonb(selected_pin) end,'catalog',result,
      'course_versions',(select coalesce(jsonb_agg(to_jsonb(v) order by v.version_key),'[]'::jsonb) from public.course_versions v
        join public.curriculum_versions cv on cv.id=v.curriculum_version_id where v.status='active' and not v.is_placeholder and cv.status='active'
        and private.lesson_course_family(v.course_code,selected_class.course_key) is not null));
  end if;
  if p_action='list' then
    select coalesce(jsonb_agg(to_jsonb(l) order by l.created_at,l.id),'[]'::jsonb) into result from public.authored_lessons l
      where l.organization_id=actor.organization_id and l.class_id=class_id;
    if authenticated_session.expires_at<=clock_timestamp() then raise exception 'School session expired' using errcode='28000'; end if;
    return jsonb_build_object('ok',true,'contract','echs.lesson.store.v1','lessons',result);
  end if;

  if p_action in ('create','publish','deliver') then
    course_id:=case when p_action='create' then (p_payload->>'course_version_id')::uuid else selected_lesson.course_version_id end;
    if selected_pin.id is null or selected_pin.course_version_id<>course_id then raise exception 'Exact active class course pin required' using errcode='42501'; end if;
    select * into selected_course from public.course_versions v where v.id=course_id for share;
    if not found or selected_course.status<>'active' or selected_course.is_placeholder
      or not exists(select 1 from public.curriculum_versions cv where cv.id=selected_course.curriculum_version_id and cv.status='active') then
      raise exception 'Active non-placeholder course required' using errcode='42501'; end if;
    family:=private.lesson_course_family(selected_course.course_code,selected_class.course_key);
    if family is null then raise exception 'Class course identity does not match' using errcode='42501'; end if;
    -- Legacy catalog/override writers do not share the class mutex. SHARE locks close
    -- both existing-row changes and absent-row insert races until this RPC commits.
    lock table public.lesson_catalog in share mode;
    select * into catalog from public.lesson_catalog c where c.organization_id=actor.organization_id
      and c.access_key=case when p_action='create' then p_payload->>'access_key' else selected_lesson.access_key end for share;
    if not found or catalog.course_key<>family or catalog.access_key<>family||'::'||catalog.unit_index::text||'::'||catalog.topic
      or length(catalog.url)>400 or catalog.url !~ '^lessons/([A-Za-z0-9][A-Za-z0-9._-]*/)*[A-Za-z0-9][A-Za-z0-9._-]*\.html$' then
      raise exception 'Exact local lesson catalog binding required' using errcode='42501'; end if;
    if p_action<>'create' and (catalog.url<>selected_lesson.route_path or catalog.course_key<>selected_lesson.legacy_course_key
      or selected_lesson.unit_id<>'legacy:'||catalog.course_key||':unit:'||(catalog.unit_index+1)::text
      or selected_lesson.topic_id<>private.lesson_topic_id(catalog.course_key,catalog.topic)) then
      raise exception 'Stored catalog binding changed' using errcode='42501'; end if;
  end if;

  if p_action='create' then
    if requested_revision<>0 then raise exception 'New lesson requires expected revision zero' using errcode='40001'; end if;
    document:=p_payload->'document';
    if private.lesson_json_valid(document,'document') is not true or document#>>'{publication,status}'<>'draft'
      or document->>'course_version_id'<>course_id::text
      or document->>'unit_id'<>'legacy:'||catalog.course_key||':unit:'||(catalog.unit_index+1)::text
      or document->>'topic_id'<>private.lesson_topic_id(catalog.course_key,catalog.topic)
      or jsonb_typeof(p_payload->'private_notes') is distinct from 'string' or length(p_payload->>'private_notes')>20000 then
      raise exception 'Invalid scoped draft document or private notes' using errcode='22023'; end if;
    lesson_id:=(document->>'lesson_id')::uuid;
    if exists(select 1 from public.authored_lessons l where l.id=lesson_id or (l.class_id=class_id and l.course_version_id=course_id and l.access_key=catalog.access_key)) then
      raise exception 'Lesson identity already exists' using errcode='40001'; end if;
    version_id:=gen_random_uuid();
    document:=jsonb_set(jsonb_set(document,'{document_version}','1'::jsonb),'{publication}',jsonb_build_object('status','draft','audience','institutional','revision',1));
    insert into public.authored_lessons(id,organization_id,class_id,course_version_id,access_key,legacy_course_key,route_path,unit_id,topic_id,slug,created_by,head_revision,head_version_id,workflow_state)
      values(lesson_id,actor.organization_id,class_id,course_id,catalog.access_key,catalog.course_key,catalog.url,document->>'unit_id',document->>'topic_id',document->>'slug',actor.id,1,version_id,'draft');
    insert into public.lesson_versions(id,organization_id,lesson_id,version_number,document,private_notes,created_by)
      values(version_id,actor.organization_id,lesson_id,1,document,p_payload->>'private_notes',actor.id);
    if authenticated_session.expires_at<=clock_timestamp() then raise exception 'School session expired' using errcode='28000'; end if;
    return private.lesson_staff_snapshot(lesson_id);
  end if;

  select * into selected_lesson from public.authored_lessons l where l.id=lesson_id and l.organization_id=actor.organization_id and l.class_id=class_id for update;
  if not found then raise exception 'Lesson not found in authorized scope' using errcode='P0002'; end if;
  select * into head from public.lesson_versions v where v.lesson_id=lesson_id and v.id=selected_lesson.head_version_id;
  if p_action='get' then
    if authenticated_session.expires_at<=clock_timestamp() then raise exception 'School session expired' using errcode='28000'; end if;
    return private.lesson_staff_snapshot(lesson_id);
  end if;
  if p_action='version' then
    select * into source_version from public.lesson_versions v where v.lesson_id=lesson_id and v.id=(p_payload->>'version_id')::uuid;
    if not found then raise exception 'Version not found in this lesson' using errcode='P0002'; end if;
    if authenticated_session.expires_at<=clock_timestamp() then raise exception 'School session expired' using errcode='28000'; end if;
    return jsonb_build_object('ok',true,'contract','echs.lesson.store.v1','lesson',to_jsonb(selected_lesson),'version',to_jsonb(source_version));
  end if;
  if p_action='history' then
    before_number:=(p_payload->>'before_version')::integer;
    limit_count:=coalesce((p_payload->>'limit')::integer,25);
    if limit_count not between 1 and 100 or before_number<1 then raise exception 'Invalid history page bounds' using errcode='22023'; end if;
    select coalesce(jsonb_agg(to_jsonb(v)-'document'-'private_notes' order by v.version_number desc),'[]'::jsonb) into result
      from (select * from public.lesson_versions v where v.lesson_id=lesson_id and (before_number is null or v.version_number<before_number) order by v.version_number desc limit limit_count) v;
    before_number:=case when jsonb_array_length(result)=limit_count then (result->(limit_count-1)->>'version_number')::integer else null end;
    if before_number is not null and not exists(select 1 from public.lesson_versions v where v.lesson_id=lesson_id and v.version_number<before_number) then before_number:=null; end if;
    if authenticated_session.expires_at<=clock_timestamp() then raise exception 'School session expired' using errcode='28000'; end if;
    return jsonb_build_object('ok',true,'contract','echs.lesson.store.v1','versions',result,'next_before_version',before_number);
  end if;

  if p_action='deliver' then
    if selected_lesson.active_publication_id is null then raise exception 'Lesson has no active publication' using errcode='P0002'; end if;
    select * into active_publication from public.lesson_publications p where p.lesson_id=lesson_id and p.id=selected_lesson.active_publication_id and p.event_type='published';
    if not found or active_publication.document is null then raise exception 'Published snapshot unavailable' using errcode='P0002'; end if;
    -- Existing route progression is a compatibility gate, not version-scoped mastery.
    -- The exact selected class's hidden/shown override applies; another class cannot win.
    lock table public.lesson_access_overrides in share mode;
    select o.state into override_state from public.lesson_access_overrides o where o.organization_id=actor.organization_id and o.class_id=class_id and o.access_key=catalog.access_key for share;
    if not catalog.is_ready or override_state='hidden' then raise exception 'Lesson is not released for this class' using errcode='42501'; end if;
    if actor.role='student' and override_state is distinct from 'shown' and catalog.position>=2 then
      select * into predecessor from public.lesson_catalog c where c.organization_id=actor.organization_id and c.course_key=catalog.course_key and c.is_ready
        and (c.position,c.access_key)<(catalog.position,catalog.access_key) order by c.position desc,c.access_key desc limit 1 for share;
      if not found then raise exception 'Previous ready lesson required' using errcode='42501'; end if;
      perform 1 from public.lesson_completions c where c.organization_id=actor.organization_id and c.account_id=actor.id and c.access_key=predecessor.access_key
        and c.course_key=predecessor.course_key and c.unit_index=predecessor.unit_index and c.topic=predecessor.topic and c.completed_at is not null for share;
      if not found then raise exception 'Previous lesson completion required' using errcode='42501'; end if;
      perform 1 from public.learning_sessions s where s.organization_id=actor.organization_id and s.account_id=actor.id and s.course=predecessor.course_key
        and s.unit=(predecessor.unit_index+1)::text and s.topic=predecessor.topic and s.total>0 and s.completed_at is not null for share;
      if not found then raise exception 'Previous completed practice required' using errcode='42501'; end if;
    end if;
    if authenticated_session.expires_at<=clock_timestamp() then raise exception 'School session expired' using errcode='28000'; end if;
    document:=active_publication.document;
    return jsonb_build_object('ok',true,'contract','echs.lesson.store.v1','lesson_id',lesson_id,'class_id',class_id,
      'publication_id',active_publication.id,'revision',active_publication.revision,'document',document,
      'binding',jsonb_build_object('account_id',actor.id,'organization_id',actor.organization_id,'class_id',class_id,
        'course_key',selected_lesson.legacy_course_key,'access_key',selected_lesson.access_key,'route_path',selected_lesson.route_path,
        'document',jsonb_build_object('lesson_id',lesson_id,'course_version_id',selected_lesson.course_version_id,'unit_id',selected_lesson.unit_id,
          'topic_id',selected_lesson.topic_id,'document_version',(document->>'document_version')::integer,
          'publication_revision',active_publication.revision)));
  end if;

  if requested_revision is distinct from selected_lesson.head_revision then raise exception 'Lesson revision changed' using errcode='40001'; end if;
  if selected_lesson.head_revision>=2147483647 then raise exception 'Lesson revision limit reached' using errcode='23514'; end if;
  next_revision:=selected_lesson.head_revision+1;
  if p_action in ('save','restore') then
    if p_action='restore' then
      select * into source_version from public.lesson_versions v where v.lesson_id=lesson_id and v.id=(p_payload->>'version_id')::uuid;
      if not found then raise exception 'Restore version not found in this lesson' using errcode='P0002'; end if;
      document:=source_version.document; notes:=source_version.private_notes;
    else
      document:=p_payload->'document';
      if jsonb_typeof(p_payload->'private_notes') is distinct from 'string' or length(p_payload->>'private_notes')>20000 then
        raise exception 'Private notes must be a bounded string' using errcode='22023'; end if;
      notes:=p_payload->>'private_notes';
    end if;
    if private.lesson_json_valid(document,'document') is not true or document#>>'{publication,status}'<>'draft'
      or document->>'lesson_id'<>lesson_id::text or document->>'course_version_id'<>selected_lesson.course_version_id::text
      or document->>'unit_id'<>selected_lesson.unit_id or document->>'topic_id'<>selected_lesson.topic_id or document->>'slug'<>selected_lesson.slug then
      raise exception 'Draft identity is immutable and document must be valid' using errcode='22023'; end if;
    document:=jsonb_set(jsonb_set(document,'{document_version}',to_jsonb(next_revision)),'{publication}',jsonb_build_object('status','draft','audience','institutional','revision',next_revision));
    version_id:=gen_random_uuid();
    insert into public.lesson_versions(id,organization_id,lesson_id,version_number,document,private_notes,created_by,restored_from_version_id)
      values(version_id,actor.organization_id,lesson_id,next_revision,document,notes,actor.id,case when p_action='restore' then source_version.id else null end);
    update public.authored_lessons set head_revision=next_revision,head_version_id=version_id,workflow_state='draft',approved_version_id=null,approved_review_id=null,updated_at=clock_timestamp() where id=lesson_id;
  elsif p_action='request_review' then
    if selected_lesson.workflow_state<>'draft' then raise exception 'Only a draft can enter review' using errcode='23514'; end if;
    insert into public.lesson_reviews(organization_id,lesson_id,version_id,revision,event_type,actor_id)
      values(actor.organization_id,lesson_id,head.id,next_revision,'requested',actor.id);
    update public.authored_lessons set head_revision=next_revision,workflow_state='review',updated_at=clock_timestamp() where id=lesson_id;
  elsif p_action='approve' then
    if (p_payload->>'validated_version_id')::uuid<>head.id then raise exception 'Validated head version changed' using errcode='40001'; end if;
    if selected_lesson.workflow_state<>'review' then raise exception 'Only a submitted head can be approved' using errcode='23514'; end if;
    if actor.id in (head.created_by,selected_lesson.created_by) then raise exception 'A different staff reviewer is required' using errcode='42501'; end if;
    if p_payload->'checks' is distinct from '{"curriculum":true,"mathematics":true,"accessibility":true,"rights":true,"student_safe":true}'::jsonb
      or (p_payload ? 'comment' and (jsonb_typeof(p_payload->'comment') is distinct from 'string' or length(p_payload->>'comment')>4000)) then
      raise exception 'All five explicit review checks are required' using errcode='22023'; end if;
    if jsonb_path_exists(head.document,'$.slides[*].blocks[*] ? (@.type == "legacy-embedded")') then raise exception 'Legacy references cannot be approved for student publication' using errcode='23514'; end if;
    insert into public.lesson_reviews(organization_id,lesson_id,version_id,revision,event_type,actor_id,checks,comment)
      values(actor.organization_id,lesson_id,head.id,next_revision,'approved',actor.id,p_payload->'checks',coalesce(p_payload->>'comment','')) returning id into event_id;
    update public.authored_lessons set head_revision=next_revision,workflow_state='approved',approved_version_id=head.id,approved_review_id=event_id,updated_at=clock_timestamp() where id=lesson_id;
  elsif p_action='publish' then
    if (p_payload->>'validated_version_id')::uuid<>head.id then raise exception 'Validated head version changed' using errcode='40001'; end if;
    if selected_lesson.workflow_state<>'approved' or selected_lesson.approved_version_id<>head.id
      or not exists(select 1 from public.lesson_reviews r where r.id=selected_lesson.approved_review_id and r.lesson_id=lesson_id and r.version_id=head.id and r.event_type='approved') then
      raise exception 'Only the approved head can be published' using errcode='23514'; end if;
    if jsonb_path_exists(head.document,'$.slides[*].blocks[*] ? (@.type == "legacy-embedded")') then raise exception 'Legacy references cannot be published' using errcode='23514'; end if;
    document:=jsonb_set(head.document,'{publication}',jsonb_build_object('status','published','audience','institutional','revision',next_revision));
    insert into public.lesson_publications(organization_id,lesson_id,source_version_id,revision,event_type,actor_id,document)
      values(actor.organization_id,lesson_id,head.id,next_revision,'published',actor.id,document) returning id into event_id;
    update public.authored_lessons set head_revision=next_revision,workflow_state='published',active_publication_id=event_id,updated_at=clock_timestamp() where id=lesson_id;
  elsif p_action='unpublish' then
    if selected_lesson.active_publication_id is null then raise exception 'There is no active publication to withdraw' using errcode='23514'; end if;
    if jsonb_typeof(p_payload->'reason') is distinct from 'string' or length(btrim(p_payload->>'reason')) not between 1 and 1000 then raise exception 'Unpublish reason required' using errcode='22023'; end if;
    select * into active_publication from public.lesson_publications p where p.id=selected_lesson.active_publication_id and p.lesson_id=lesson_id;
    insert into public.lesson_publications(organization_id,lesson_id,source_version_id,revision,event_type,actor_id,reason)
      values(actor.organization_id,lesson_id,active_publication.source_version_id,next_revision,'unpublished',actor.id,btrim(p_payload->>'reason'));
    update public.authored_lessons set head_revision=next_revision,workflow_state='draft',active_publication_id=null,approved_version_id=null,approved_review_id=null,updated_at=clock_timestamp() where id=lesson_id;
  else raise exception 'Unhandled lesson action' using errcode='22023';
  end if;
  if authenticated_session.expires_at<=clock_timestamp() then raise exception 'School session expired' using errcode='28000'; end if;
  return private.lesson_staff_snapshot(lesson_id);
end;
$$;

create function public.lesson_store_health()
returns jsonb language sql security definer set search_path = pg_catalog as $$
  select jsonb_build_object('ok',to_regclass('public.authored_lessons') is not null
    and to_regclass('public.lesson_versions') is not null and to_regclass('public.lesson_reviews') is not null
    and to_regclass('public.lesson_publications') is not null,'contract','echs.lesson.store.v1');
$$;

alter table public.authored_lessons enable row level security;
alter table public.lesson_versions enable row level security;
alter table public.lesson_reviews enable row level security;
alter table public.lesson_publications enable row level security;
revoke all on public.authored_lessons,public.lesson_versions,public.lesson_reviews,public.lesson_publications from public,anon,authenticated,service_role;
revoke all on function private.lesson_keys(jsonb,text[],text[]),private.lesson_json_valid(jsonb,text,integer),
  private.lesson_course_family(text,text),private.lesson_topic_id(text,text),private.lesson_append_only(),
  private.lesson_identity_immutable(),private.lesson_staff_snapshot(uuid) from public,anon,authenticated,service_role;
revoke all on function public.lesson_store(text,text,jsonb),public.lesson_store_health() from public,anon,authenticated,service_role;
grant execute on function public.lesson_store(text,text,jsonb),public.lesson_store_health() to service_role;
comment on table public.authored_lessons is 'Private class-scoped authored lessons. No direct API role privileges; access only through session-authenticated lesson_store. No legacy route replacement or evidence backfill.';
comment on table public.lesson_versions is 'Append-only draft documents and separate private notes. Canonical Edge validation remains mandatory. Restore appends a new version.';
comment on table public.lesson_publications is 'Append-only institutional publication/withdrawal events. Published snapshots contain controlled document data only; never private notes.';
comment on function public.lesson_store(text,text,jsonb) is 'ECHS lesson store v1. Only service_role can execute; every action independently authenticates a custom school session and current account/class role. Legacy route progression is not class- or curriculum-version-scoped mastery.';
commit;
