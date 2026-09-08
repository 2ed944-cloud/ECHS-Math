-- ECHS-010. Additive typed media and private, session-authorized lesson assets.
-- No current lesson, curriculum pin, publication or learner evidence is rewritten.
-- Storage object bytes are written/deleted only through the supported Storage API.
-- Trusted storage/database administrators remain outside the application boundary.
begin;

create function private.lesson_media_text_valid(value jsonb, allow_empty boolean default false)
returns boolean language sql immutable set search_path=pg_catalog as $$
  select case when allow_empty and value='""'::jsonb then true
    else private.lesson_v2_text_valid(value,true) is true end;
$$;

create function private.lesson_media_block_valid(value jsonb)
returns boolean language plpgsql immutable set search_path=pg_catalog as $$
declare c jsonb; item jsonb; cell jsonb; column_count integer; column_ids text[]:='{}'; row_ids text[]:='{}';
begin
  if private.lesson_keys(value,array['id','type','version','content'],array['id','type','version','content']) is not true
    or private.lesson_json_valid(value->'id','id') is not true or value->'version' is distinct from '1'::jsonb then return false; end if;
  c:=value->'content';
  if value->>'type'='image' then
    if private.lesson_keys(c,array['asset_id','alt','decorative','caption','description'],array['asset_id','alt','decorative','caption','description']) is not true
      or private.lesson_json_valid(c->'asset_id','uuid') is not true or jsonb_typeof(c->'decorative') is distinct from 'boolean'
      or private.lesson_media_text_valid(c->'alt',true) is not true or private.lesson_media_text_valid(c->'caption',true) is not true
      or private.lesson_media_text_valid(c->'description',true) is not true then return false; end if;
    return case when c->'decorative'='true'::jsonb then c->'alt'='""'::jsonb else private.lesson_media_text_valid(c->'alt') is true end;
  elsif value->>'type'='video' then
    return coalesce(private.lesson_keys(c,array['provider','video_id','title','start_seconds','transcript'],array['provider','video_id','title','start_seconds','transcript']) is true
      and c->>'provider'='youtube' and jsonb_typeof(c->'video_id')='string' and c->>'video_id' collate "C" ~ '^[A-Za-z0-9_-]{11}$'
      and private.lesson_json_valid(c->'title','title') is true and private.lesson_media_text_valid(c->'transcript') is true
      and jsonb_typeof(c->'start_seconds')='number' and c->>'start_seconds' collate "C" ~ '^(0|[1-9][0-9]{0,4})$'
      and (c->>'start_seconds')::numeric<=86400,false);
  elsif value->>'type'='resource' then
    return coalesce(private.lesson_keys(c,array['asset_id','title','description'],array['asset_id','title','description']) is true
      and private.lesson_json_valid(c->'asset_id','uuid') is true and private.lesson_json_valid(c->'title','title') is true
      and private.lesson_media_text_valid(c->'description') is true,false);
  elsif value->>'type'='table' then
    if private.lesson_keys(c,array['caption','columns','rows','row_header'],array['caption','columns','rows','row_header']) is not true
      or private.lesson_json_valid(c->'caption','title') is not true or jsonb_typeof(c->'row_header') is distinct from 'boolean'
      or jsonb_typeof(c->'columns') is distinct from 'array' or jsonb_typeof(c->'rows') is distinct from 'array' then return false; end if;
    column_count:=jsonb_array_length(c->'columns');
    if column_count not between 1 and 12 or jsonb_array_length(c->'rows') not between 1 and 100 then return false; end if;
    for item in select * from jsonb_array_elements(c->'columns') loop
      if private.lesson_keys(item,array['id','label'],array['id','label']) is not true or private.lesson_json_valid(item->'id','id') is not true
        or private.lesson_json_valid(item->'label','title') is not true or item->>'id'=any(column_ids) then return false; end if;
      column_ids:=array_append(column_ids,item->>'id');
    end loop;
    for item in select * from jsonb_array_elements(c->'rows') loop
      if private.lesson_keys(item,array['id','cells'],array['id','cells']) is not true or private.lesson_json_valid(item->'id','id') is not true
        or item->>'id'=any(row_ids) or jsonb_typeof(item->'cells') is distinct from 'array' then return false; end if;
      if jsonb_array_length(item->'cells')<>column_count then return false; end if;
      row_ids:=array_append(row_ids,item->>'id');
      for cell in select * from jsonb_array_elements(item->'cells') loop
        if jsonb_typeof(cell) is distinct from 'array' then return false; end if;
        if jsonb_array_length(cell) not between 1 and 32 or private.lesson_v2_inlines_valid(cell) is not true then return false; end if;
      end loop;
    end loop;
    return true;
  end if;
  return false;
exception when invalid_text_representation or numeric_value_out_of_range then return false;
end;
$$;

create or replace function private.lesson_json_valid(value jsonb, kind text, depth integer default 0)
returns boolean language plpgsql immutable set search_path = pg_catalog as $$
declare item jsonb; child jsonb; field text; text_value text; allowed text[];
begin
  if value is null or depth>12 then return false; end if;
  if kind='block' and value->>'type' in ('image','video','table','resource') then return private.lesson_media_block_valid(value); end if;
  if kind='block' and value->'version'='2'::jsonb then return private.lesson_v2_block_valid(value); end if;
  if kind in ('uuid','id','scoped','title','plain','tex') then
    if jsonb_typeof(value)<>'string' then return false; end if;
    text_value := value#>>'{}';
    if kind='uuid' then return text_value ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'; end if;
    if kind='id' then return length(text_value) between 1 and 128 and text_value ~ '^[A-Za-z][A-Za-z0-9_-]*$'; end if;
    if kind='scoped' then return length(text_value) between 1 and 160 and text_value ~ '^[A-Za-z0-9][A-Za-z0-9._:-]*$'; end if;
    if length(text_value) not between 1 and (case when kind='title' then 240 else 4000 end)
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
      if jsonb_array_length(value->field) not between 1 and (case when field='slides' then 120 else 40 end) then return false; end if;
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

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
  values('lesson-assets','lesson-assets',false,8388608,array['image/png','image/jpeg','image/webp','application/pdf'])
  on conflict(id) do nothing;

-- Restrictive policies remain effective even if another app has a broad permissive
-- policy. They do not grant any access and do not alter other bucket behavior.
create policy lesson_assets_objects_closed on storage.objects as restrictive for all to anon,authenticated
  using (bucket_id<>'lesson-assets') with check (bucket_id<>'lesson-assets');
create policy lesson_assets_bucket_closed on storage.buckets as restrictive for all to anon,authenticated
  using (id<>'lesson-assets') with check (id<>'lesson-assets');

create function private.lesson_asset_bucket_ready()
returns boolean language sql stable set search_path=pg_catalog as $$
  select exists(select 1 from storage.buckets where id='lesson-assets' and name='lesson-assets' and public=false
    and file_size_limit=8388608 and allowed_mime_types=array['image/png','image/jpeg','image/webp','application/pdf'])
    and exists(select 1 from pg_class t join pg_namespace n on n.oid=t.relnamespace where n.nspname='storage' and t.relname='objects' and t.relrowsecurity)
    and exists(select 1 from pg_class t join pg_namespace n on n.oid=t.relnamespace where n.nspname='storage' and t.relname='buckets' and t.relrowsecurity)
    and exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='lesson_assets_objects_closed' and permissive='RESTRICTIVE' and cmd='ALL' and roles @> array['anon','authenticated']::name[]
      and qual='(bucket_id <> ''lesson-assets''::text)' and with_check='(bucket_id <> ''lesson-assets''::text)')
    and exists(select 1 from pg_policies where schemaname='storage' and tablename='buckets' and policyname='lesson_assets_bucket_closed' and permissive='RESTRICTIVE' and cmd='ALL' and roles @> array['anon','authenticated']::name[]
      and qual='(id <> ''lesson-assets''::text)' and with_check='(id <> ''lesson-assets''::text)');
$$;

create table public.lesson_assets (
  id uuid primary key,
  organization_id uuid not null,
  class_id uuid not null,
  lesson_id uuid not null,
  uploaded_by uuid not null,
  original_name text not null check (length(original_name) between 1 and 160 and original_name not in ('.','..')
    and original_name collate "C" !~ '[/\\<>[:cntrl:]]' and private.lesson_v2_text_valid(to_jsonb(original_name),true) is true),
  mime_type text not null check (mime_type in ('image/png','image/jpeg','image/webp','application/pdf')),
  byte_length integer not null check (byte_length>0),
  width integer,
  height integer,
  sha256 text not null check (sha256 collate "C" ~ '^[0-9a-f]{64}$'),
  state text not null check (state in ('pending','ready','cleanup')),
  created_at timestamptz not null default clock_timestamp(),
  ready_at timestamptz,
  cleanup_at timestamptz,
  unique (organization_id,lesson_id,id),
  constraint lesson_asset_lesson_tenant foreign key (organization_id,lesson_id) references public.authored_lessons(organization_id,id) on delete restrict,
  constraint lesson_asset_class_tenant foreign key (organization_id,class_id) references public.classes(organization_id,id) on delete restrict,
  constraint lesson_asset_uploader_tenant foreign key (organization_id,uploaded_by) references public.accounts(organization_id,id) on delete restrict,
  constraint lesson_asset_size check ((mime_type='application/pdf' and byte_length<=8388608 and width is null and height is null)
    or (mime_type in ('image/png','image/jpeg','image/webp') and byte_length<=4194304 and width is not null and height is not null
      and width between 1 and 4096 and height between 1 and 4096 and width::bigint*height<=16777216)),
  constraint lesson_asset_lifecycle check ((state='pending' and ready_at is null and cleanup_at is null)
    or (state='ready' and ready_at is not null and cleanup_at is null) or (state='cleanup' and ready_at is null and cleanup_at is not null))
);

create table public.lesson_version_assets (
  organization_id uuid not null,
  lesson_id uuid not null,
  version_id uuid not null,
  asset_id uuid not null,
  block_type text not null check (block_type in ('image','resource')),
  primary key(version_id,asset_id,block_type),
  constraint lesson_attachment_version foreign key (lesson_id,version_id) references public.lesson_versions(lesson_id,id) on delete restrict,
  constraint lesson_attachment_asset_tenant foreign key (organization_id,lesson_id,asset_id) references public.lesson_assets(organization_id,lesson_id,id) on delete restrict
);

create function private.lesson_asset_immutable()
returns trigger language plpgsql set search_path=pg_catalog as $$
begin
  if tg_op='DELETE' then raise exception 'Lesson assets cannot be deleted' using errcode='23514'; end if;
  if row(new.id,new.organization_id,new.class_id,new.lesson_id,new.uploaded_by,new.original_name,new.mime_type,new.byte_length,new.width,new.height,new.sha256,new.created_at)
    is distinct from row(old.id,old.organization_id,old.class_id,old.lesson_id,old.uploaded_by,old.original_name,old.mime_type,old.byte_length,old.width,old.height,old.sha256,old.created_at)
    or old.state<>'pending' or new.state not in ('ready','cleanup') then raise exception 'Immutable lesson asset identity and terminal states' using errcode='23514'; end if;
  return new;
end;
$$;
create trigger lesson_assets_identity before update or delete on public.lesson_assets for each row execute function private.lesson_asset_immutable();
create trigger lesson_assets_no_truncate before truncate on public.lesson_assets for each statement execute function private.lesson_append_only();
create trigger lesson_version_assets_immutable before update or delete on public.lesson_version_assets for each row execute function private.lesson_append_only();
create trigger lesson_version_assets_no_truncate before truncate on public.lesson_version_assets for each statement execute function private.lesson_append_only();

create function private.lesson_document_asset_refs(document jsonb)
returns table(asset_id uuid,block_type text) language sql immutable set search_path=pg_catalog as $$
  select distinct (b->'content'->>'asset_id')::uuid,b->>'type'
    from jsonb_array_elements(document->'slides') s cross join lateral jsonb_array_elements(s->'blocks') b
    where b->>'type' in ('image','resource');
$$;
create function private.lesson_assert_document_assets(selected_lesson uuid,document jsonb)
returns void language plpgsql set search_path=pg_catalog as $$
declare ref record; asset public.lesson_assets%rowtype; lesson public.authored_lessons%rowtype;
begin
  select * into strict lesson from public.authored_lessons where id=selected_lesson;
  for ref in select * from private.lesson_document_asset_refs(document) loop
    if private.lesson_asset_bucket_ready() is not true then raise exception 'Lesson asset service unavailable' using errcode='55000'; end if;
    select * into asset from public.lesson_assets where id=ref.asset_id and organization_id=lesson.organization_id
      and class_id=lesson.class_id and lesson_id=lesson.id and state='ready' for share;
    if not found or (ref.block_type='image' and asset.mime_type not in ('image/png','image/jpeg','image/webp'))
      or (ref.block_type='resource' and asset.mime_type<>'application/pdf') then raise exception 'Ready asset in exact lesson scope required' using errcode='23514'; end if;
  end loop;
end;
$$;
create function private.lesson_check_asset_refs()
returns trigger language plpgsql set search_path=pg_catalog as $$
declare document jsonb;
begin
  if tg_table_name='lesson_reviews' then
    select v.document into strict document from public.lesson_versions v where v.lesson_id=new.lesson_id and v.id=new.version_id;
  else document:=new.document; end if;
  if document is not null then perform private.lesson_assert_document_assets(new.lesson_id,document); end if;
  return new;
end;
$$;
create function private.lesson_attach_version_assets()
returns trigger language plpgsql set search_path=pg_catalog as $$
begin
  insert into public.lesson_version_assets(organization_id,lesson_id,version_id,asset_id,block_type)
    select new.organization_id,new.lesson_id,new.id,r.asset_id,r.block_type from private.lesson_document_asset_refs(new.document) r;
  return new;
end;
$$;
create trigger lesson_versions_check_assets before insert on public.lesson_versions for each row execute function private.lesson_check_asset_refs();
create trigger lesson_versions_attach_assets after insert on public.lesson_versions for each row execute function private.lesson_attach_version_assets();
create trigger lesson_reviews_check_assets before insert on public.lesson_reviews for each row execute function private.lesson_check_asset_refs();
create trigger lesson_publications_check_assets before insert on public.lesson_publications for each row execute function private.lesson_check_asset_refs();

alter table public.lesson_assets enable row level security;
alter table public.lesson_version_assets enable row level security;
revoke all on public.lesson_assets,public.lesson_version_assets from public,anon,authenticated,service_role;

create function public.lesson_asset_store(p_token_hash text,p_action text,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
#variable_conflict use_variable
declare
  context jsonb; lesson public.authored_lessons%rowtype; asset public.lesson_assets%rowtype;
  actor_id uuid; actor_org uuid; lesson_id uuid; requested_asset uuid; allowed text[]; required text[]; session_expires_at timestamptz;
  item text; count_assets integer; total_bytes bigint; result jsonb; reused boolean:=false;
begin
  if private.lesson_asset_bucket_ready() is not true then raise exception 'Lesson asset service unavailable' using errcode='55000'; end if;
  if jsonb_typeof(p_payload) is distinct from 'object' or octet_length(p_payload::text)>8192 then raise exception 'Bounded asset payload required' using errcode='22023'; end if;
  case p_action
    when 'reserve' then allowed:=array['lesson_id','asset_id','original_name','mime_type','byte_length','width','height','sha256']; required:=allowed;
    when 'list' then allowed:=array['lesson_id']; required:=allowed;
    when 'read' then allowed:=array['lesson_id','asset_id','class_id']; required:=array['lesson_id','asset_id'];
    when 'status','finalize','cleanup','cleanup_expired' then allowed:=array['lesson_id','asset_id']; required:=allowed;
    else raise exception 'Unknown asset action' using errcode='22023';
  end case;
  if private.lesson_keys(p_payload,allowed,required) is not true then raise exception 'Unexpected asset fields' using errcode='22023'; end if;
  foreach item in array array['lesson_id','asset_id','class_id'] loop
    if p_payload ? item and private.lesson_json_valid(p_payload->item,'uuid') is not true then raise exception 'Invalid asset identifier' using errcode='22023'; end if;
  end loop;
  lesson_id:=(p_payload->>'lesson_id')::uuid; requested_asset:=(p_payload->>'asset_id')::uuid;
  -- Reuse original authorization and its locks within this same transaction.
  -- Supplying class_id deliberately selects original published/student gates.
  if p_action='read' and p_payload ? 'class_id' then
    context:=public.lesson_store(p_token_hash,'deliver',jsonb_build_object('lesson_id',lesson_id,'class_id',p_payload->'class_id'));
    if not exists(select 1 from private.lesson_document_asset_refs(context->'document') where asset_id=requested_asset) then
      raise exception 'Asset unavailable in current publication' using errcode='P0002'; end if;
  else context:=public.lesson_store(p_token_hash,'get',jsonb_build_object('lesson_id',lesson_id)); end if;
  select * into strict lesson from public.authored_lessons where id=lesson_id;
  select s.account_id,s.expires_at into strict actor_id,session_expires_at from private.sessions s where s.token_hash=p_token_hash;
  actor_org:=lesson.organization_id;
  if p_action in ('reserve','finalize') and not exists(select 1 from public.class_course_version_assignments a
    join public.course_versions v on v.id=a.course_version_id join public.curriculum_versions c on c.id=v.curriculum_version_id
    where a.organization_id=actor_org and a.class_id=lesson.class_id and a.state='active' and a.course_version_id=lesson.course_version_id
      and v.status='active' and not v.is_placeholder and c.status='active') then raise exception 'Exact active course assignment required' using errcode='23514'; end if;
  if p_action='list' then
    select coalesce(jsonb_agg(to_jsonb(a) order by a.created_at,a.id),'[]'::jsonb) into result from public.lesson_assets a
      where a.organization_id=actor_org and a.lesson_id=lesson_id and a.class_id=lesson.class_id and a.state='ready';
    if session_expires_at<=clock_timestamp() then raise exception 'School session expired' using errcode='28000'; end if;
    return jsonb_build_object('ok',true,'contract','echs.lesson.assets.v1','lesson_id',lesson_id,'organization_id',actor_org,'class_id',lesson.class_id,'account_id',actor_id,'assets',result);
  end if;
  if p_action='reserve' then
    if private.lesson_media_text_valid(p_payload->'original_name') is not true or length(p_payload->>'original_name')>160
      or p_payload->>'original_name' in ('.','..') or p_payload->>'original_name' collate "C" ~ '[/\\<>[:cntrl:]]'
      or coalesce(p_payload->>'mime_type','') not in ('image/png','image/jpeg','image/webp','application/pdf')
      or jsonb_typeof(p_payload->'sha256') is distinct from 'string' or p_payload->>'sha256' collate "C" !~ '^[0-9a-f]{64}$'
      or jsonb_typeof(p_payload->'byte_length') is distinct from 'number' or p_payload->>'byte_length' collate "C" !~ '^[1-9][0-9]{0,6}$' then raise exception 'Invalid asset metadata' using errcode='22023'; end if;
    if p_payload->>'mime_type'='application/pdf' then
      if (p_payload->>'byte_length')::integer>8388608 or p_payload->'width' is distinct from 'null'::jsonb or p_payload->'height' is distinct from 'null'::jsonb then raise exception 'Invalid PDF metadata' using errcode='22023'; end if;
    else
      foreach item in array array['width','height'] loop
        if jsonb_typeof(p_payload->item) is distinct from 'number' or p_payload->>item collate "C" !~ '^[1-9][0-9]{0,3}$'
          or (p_payload->>item)::integer>4096 then raise exception 'Invalid image dimensions' using errcode='22023'; end if;
      end loop;
      if (p_payload->>'byte_length')::integer>4194304 or (p_payload->>'width')::bigint*(p_payload->>'height')::bigint>16777216 then raise exception 'Invalid image size' using errcode='22023'; end if;
    end if;
    -- Serialize globally unique caller upload IDs even across unrelated classes.
    perform pg_advisory_xact_lock(hashtextextended(requested_asset::text,710));
    select * into asset from public.lesson_assets where id=requested_asset for update;
    if found then
      if row(asset.organization_id,asset.class_id,asset.lesson_id,asset.uploaded_by,asset.original_name,asset.mime_type,asset.byte_length,asset.width,asset.height,asset.sha256)
        is distinct from row(actor_org,lesson.class_id,lesson_id,actor_id,p_payload->>'original_name',p_payload->>'mime_type',(p_payload->>'byte_length')::integer,
          (p_payload->>'width')::integer,(p_payload->>'height')::integer,p_payload->>'sha256') or asset.state='cleanup' then raise exception 'Upload identifier conflict' using errcode='40001'; end if;
      reused:=true;
    else
      select count(*),coalesce(sum(a.byte_length),0) into count_assets,total_bytes from public.lesson_assets a where a.lesson_id=lesson.id and a.state in ('pending','ready');
      if count_assets>=128 or total_bytes+(p_payload->>'byte_length')::integer>134217728 then raise exception 'Lesson asset allowance exceeded' using errcode='23514'; end if;
      insert into public.lesson_assets(id,organization_id,class_id,lesson_id,uploaded_by,original_name,mime_type,byte_length,width,height,sha256,state)
        values(requested_asset,actor_org,lesson.class_id,lesson.id,actor_id,p_payload->>'original_name',p_payload->>'mime_type',(p_payload->>'byte_length')::integer,
          (p_payload->>'width')::integer,(p_payload->>'height')::integer,p_payload->>'sha256','pending') returning * into asset;
    end if;
  else
    select a.* into asset from public.lesson_assets a where a.id=requested_asset and a.organization_id=actor_org and a.lesson_id=lesson.id and a.class_id=lesson.class_id for update;
    if not found then raise exception 'Asset unavailable' using errcode='P0002'; end if;
    if p_action in ('status','finalize','cleanup') and asset.uploaded_by<>actor_id then raise exception 'Original upload owner required' using errcode='42501'; end if;
    if p_action='cleanup_expired' and asset.uploaded_by<>actor_id and not exists(select 1 from public.accounts where id=actor_id and organization_id=actor_org and role='admin') then
      raise exception 'Original upload owner or administrator required' using errcode='42501'; end if;
    if p_action='read' and asset.state<>'ready' then raise exception 'Ready asset unavailable' using errcode='P0002'; end if;
    if p_action='finalize' then
      if asset.state='cleanup' then raise exception 'Upload is closed for cleanup' using errcode='23514'; end if;
      if not exists(select 1 from storage.objects o where o.bucket_id='lesson-assets'
        and o.name=asset.organization_id::text||'/'||asset.lesson_id::text||'/'||asset.id::text
        and o.metadata->>'mimetype'=asset.mime_type and o.metadata->>'size'=asset.byte_length::text) then raise exception 'Stored object metadata is not ready' using errcode='23514'; end if;
      if asset.state='pending' then update public.lesson_assets set state='ready',ready_at=clock_timestamp() where id=asset.id returning * into asset; else reused:=true; end if;
    elsif p_action in ('cleanup','cleanup_expired') then
      if asset.state='ready' then raise exception 'Ready assets cannot be cleaned up' using errcode='23514'; end if;
      if p_action='cleanup_expired' and asset.state='pending' and asset.created_at>clock_timestamp()-interval '24 hours' then
        raise exception 'Pending upload has not expired' using errcode='23514'; end if;
      if asset.state='pending' then update public.lesson_assets set state='cleanup',cleanup_at=clock_timestamp() where id=asset.id returning * into asset; end if;
    end if;
  end if;
  -- Original lesson_store retains session/account/class locks. Clock expiry can
  -- still pass while waiting on the upload advisory lock or asset row lock.
  -- Recheck at the return boundary so any mutation is rolled back on expiry.
  if session_expires_at<=clock_timestamp() then raise exception 'School session expired' using errcode='28000'; end if;
  return jsonb_build_object('ok',true,'contract','echs.lesson.assets.v1','lesson_id',lesson_id,'organization_id',actor_org,'class_id',lesson.class_id,
    'account_id',actor_id,'asset',to_jsonb(asset),'reused',reused);
end;
$$;

create function public.lesson_media_capabilities()
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
declare img jsonb:='{"id":"media-probe","type":"image","version":1,"content":{"asset_id":"10000000-0000-4000-8000-000000000001","alt":"A test image","decorative":false,"caption":"","description":""}}';
  video jsonb:='{"id":"media-probe","type":"video","version":1,"content":{"provider":"youtube","video_id":"abcdefghijk","title":"Video","start_seconds":0,"transcript":"Accessible transcript"}}';
  tab jsonb:='{"id":"media-probe","type":"table","version":1,"content":{"caption":"Table","columns":[{"id":"x","label":"x"}],"rows":[{"id":"r","cells":[[{"type":"text","text":"1"}]]}],"row_header":true}}';
  resource jsonb:='{"id":"media-probe","type":"resource","version":1,"content":{"asset_id":"10000000-0000-4000-8000-000000000001","title":"Resource","description":"Accessible resource description"}}';
begin
  if private.lesson_asset_bucket_ready() is not true then return null; end if;
  if private.lesson_json_valid(img,'block') is not true or private.lesson_json_valid(video,'block') is not true
    or private.lesson_json_valid(tab,'block') is not true or private.lesson_json_valid(resource,'block') is not true then return null; end if;
  if private.lesson_json_valid(jsonb_set(img,'{content,asset_id}','"https://attacker.example"'),'block') is not false
    or private.lesson_json_valid(jsonb_set(tab,'{content,rows,0,cells}','[]'),'block') is not false then return null; end if;
  return '{"contract":"echs.lesson.media.v1","blocks":{"image":[1],"video":[1],"table":[1],"resource":[1]},"asset_delivery":"authenticated-bytes","mime_types":["image/png","image/jpeg","image/webp","application/pdf"],"max_image_bytes":4194304,"max_resource_bytes":8388608}'::jsonb;
end;
$$;

revoke all on function private.lesson_media_text_valid(jsonb,boolean),private.lesson_media_block_valid(jsonb),private.lesson_asset_bucket_ready(),
  private.lesson_asset_immutable(),private.lesson_document_asset_refs(jsonb),private.lesson_assert_document_assets(uuid,jsonb),private.lesson_check_asset_refs(),private.lesson_attach_version_assets()
  from public,anon,authenticated,service_role;
revoke all on function public.lesson_asset_store(text,text,jsonb),public.lesson_media_capabilities() from public,anon,authenticated,service_role;
grant execute on function public.lesson_asset_store(text,text,jsonb),public.lesson_media_capabilities() to service_role;

comment on table public.lesson_assets is 'Private immutable lesson-bound asset metadata. Ready bytes use the supported private Storage API; admin/service credentials remain trusted.';
comment on table public.lesson_version_assets is 'Append-only immutable version attachments. Removing a block never deletes its historical attachment or ready object.';
comment on function public.lesson_asset_store(text,text,jsonb) is 'Service-only asset transaction. Original lesson_store supplies current school session/class/student-publication authorization; never client actor or tenant claims.';
commit;
