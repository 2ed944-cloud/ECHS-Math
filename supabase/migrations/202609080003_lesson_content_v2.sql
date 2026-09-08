-- ECHS-009. Additive content versions; all v1 definitions and stored snapshots remain valid.
-- No lesson, review, publication, curriculum assignment or learner evidence is seeded/rewritten.
-- Edge still supplies canonical semantics, strict pinned KaTeX and the primary 1 MiB budget.
begin;

create function private.lesson_v2_text_valid(value jsonb, require_meaningful boolean default false)
returns boolean language plpgsql immutable set search_path=pg_catalog as $$
declare t text;
begin
  if value is null or jsonb_typeof(value)<>'string' then return false; end if;
  t:=value#>>'{}';
  if length(t) not between 1 and 4000 or t ~ '[<>]' or translate(t,chr(9)||chr(10)||chr(13),'') collate "C" ~ '[[:cntrl:]]' then return false; end if;
  if require_meaningful then
    return length(translate(t,chr(9)||chr(10)||chr(11)||chr(12)||chr(13)||chr(32)||chr(160)||chr(5760)||
      chr(8192)||chr(8193)||chr(8194)||chr(8195)||chr(8196)||chr(8197)||chr(8198)||chr(8199)||chr(8200)||chr(8201)||chr(8202)||
      chr(8232)||chr(8233)||chr(8239)||chr(8287)||chr(12288)||chr(65279),''))>0;
  end if;
  return true;
end;
$$;

create function private.lesson_v2_href_valid(value jsonb)
returns boolean language plpgsql immutable set search_path=pg_catalog as $fn$
declare t text;
begin
  if value is null or jsonb_typeof(value)<>'string' then return false; end if;
  t:=value#>>'{}';
  -- ASCII URL grammar must not expand with the database's locale/collation.
  return length(t)<=2048 and octet_length(t)=length(t) and
    t collate "C" ~ $url$^https://(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}(?:/[A-Za-z0-9._~!$&'()*+,;=:@%/-]*)?(?:\?[A-Za-z0-9._~!$&'()*+,;=:@%/?-]*)?(?:#[A-Za-z0-9._~!$&'()*+,;=:@%/?-]*)?$$url$ and
    length(split_part(split_part(split_part(substr(t,9),'/',1),'?',1),'#',1))<=253 and
    position('%' in regexp_replace(t collate "C",'%[0-9a-fA-F]{2}','','g'))=0 and
    t collate "C" !~* '%(0[0-9a-f]|1[0-9a-f]|7f|5c)';
end;
$fn$;

-- Return a bounded node count or -1. Depth is measured within the AST, independently
-- of the unchanged v1 document helper's depth defense.
create function private.lesson_math_expression_nodes(value jsonb, level integer default 1)
returns integer language plpgsql immutable set search_path=pg_catalog as $$
declare k text; allowed text[]; children text[]:=array[]::text[]; field text; count_nodes integer:=1; n integer;
begin
  if value is null or jsonb_typeof(value)<>'object' or level not between 1 and 5 then return -1; end if;
  k:=value->>'kind';
  case k
    when 'number' then
      if private.lesson_keys(value,array['kind','value'],array['kind','value']) is not true or jsonb_typeof(value->'value')<>'string'
        or (value->>'value') collate "C" !~ '^(0|[1-9][0-9]{0,15})(\.[0-9]{1,12})?$' then return -1; end if;
      return 1;
    when 'symbol' then
      if private.lesson_keys(value,array['kind','name'],array['kind','name']) is not true or jsonb_typeof(value->'name')<>'string'
        or not ((value->>'name') collate "C" ~ '^[A-Za-z]$' or value->>'name'=any(array['pi','theta','alpha','beta','gamma','delta','epsilon','infinity'])) then return -1; end if;
      return 1;
    when 'group','negate' then allowed:=array['kind','body']; children:=array['body'];
    when 'binary' then
      allowed:=array['kind','operator','left','right']; children:=array['left','right'];
      if coalesce(value->>'operator','')<>all(array['add','subtract','multiply','equals','less','lessEqual','greater','greaterEqual']) then return -1; end if;
    when 'fraction' then allowed:=array['kind','numerator','denominator']; children:=array['numerator','denominator'];
    when 'power' then allowed:=array['kind','base','exponent']; children:=array['base','exponent'];
    when 'root' then
      allowed:=array['kind','radicand','index']; children:=array['radicand'];
      if value->'index' is distinct from 'null'::jsonb then children:=array_append(children,'index'); end if;
    when 'function' then
      allowed:=array['kind','name','argument']; children:=array['argument'];
      if coalesce(value->>'name','')<>all(array['sin','cos','tan','arcsin','arccos','arctan','ln','log','exp','abs','f','g','h']) then return -1; end if;
    when 'sum' then allowed:=array['kind','variable','lower','upper','body']; children:=array['lower','upper','body'];
    when 'integral' then
      allowed:=array['kind','variable','lower','upper','body']; children:=array['body'];
      if (value->'lower'='null'::jsonb) is distinct from (value->'upper'='null'::jsonb) then return -1; end if;
      if value->'lower' is distinct from 'null'::jsonb then children:=children||array['lower','upper']; end if;
    when 'limit' then
      allowed:=array['kind','variable','target','side','body']; children:=array['target','body'];
      if coalesce(value->>'side','')<>all(array['both','left','right']) then return -1; end if;
    else return -1;
  end case;
  if private.lesson_keys(value,allowed,allowed) is not true then return -1; end if;
  if k=any(array['sum','integral','limit']) and (jsonb_typeof(value->'variable')<>'string' or (value->>'variable') collate "C" !~ '^[A-Za-z]$') then return -1; end if;
  foreach field in array children loop
    n:=private.lesson_math_expression_nodes(value->field,level+1);
    if n<1 then return -1; end if;
    count_nodes:=count_nodes+n;
    if count_nodes>128 then return -1; end if;
  end loop;
  return count_nodes;
end;
$$;

create function private.lesson_math_source_valid(value jsonb)
returns boolean language plpgsql immutable set search_path=pg_catalog as $$
begin
  if value is null or jsonb_typeof(value)<>'object' then return false; end if;
  if value->>'mode'='visual' then
    return private.lesson_keys(value,array['mode','expression'],array['mode','expression']) is true
      and private.lesson_math_expression_nodes(value->'expression') between 1 and 128;
  elsif value->>'mode'='tex' then
    return private.lesson_keys(value,array['mode','tex'],array['mode','tex']) is true
      and private.lesson_json_valid(value->'tex','tex') is true
      -- V2-only lexical defense. Actual TeX syntax is still checked by pinned
      -- KaTeX at the Edge; the unchanged v1 helper is not a TeX parser.
      and (value->>'tex') collate "C" !~* $tex$\\(href|url|html[A-Za-z]*|includegraphics|def|gdef|edef|xdef|newcommand|renewcommand|providecommand|let|futurelet|global|catcode|csname|require)($|[^A-Za-z0-9_])$tex$
      and (value->>'tex') collate "C" !~ '<[[:space:]]*(/?[A-Za-z][^>]*|![^>]*)>';
  end if;
  return false;
end;
$$;

create function private.lesson_v2_inlines_valid(value jsonb, text_only boolean default false)
returns boolean language plpgsql immutable set search_path=pg_catalog as $$
declare item jsonb; mark jsonb; visible boolean:=false;
begin
  if value is null or jsonb_typeof(value)<>'array' then return false; end if;
  if jsonb_array_length(value) not between 1 and (case when text_only then 20 else 100 end) then return false; end if;
  for item in select * from jsonb_array_elements(value) loop
    if item->>'type'='text' then
      if private.lesson_keys(item,array['type','text','marks'],array['type','text']) is not true
        or private.lesson_v2_text_valid(item->'text') is not true then return false; end if;
      if item ? 'marks' then
        if jsonb_typeof(item->'marks')<>'array' then return false; end if;
        if jsonb_array_length(item->'marks')>2 or
          (select count(distinct m) from jsonb_array_elements(item->'marks') m)<>jsonb_array_length(item->'marks') then return false; end if;
        for mark in select * from jsonb_array_elements(item->'marks') loop
          if mark not in ('"strong"'::jsonb,'"em"'::jsonb) then return false; end if;
        end loop;
      end if;
      visible:=visible or private.lesson_v2_text_valid(item->'text',true);
    elsif not text_only and item->>'type'='math' then
      if private.lesson_keys(item,array['type','source','spoken'],array['type','source','spoken']) is not true
        or private.lesson_math_source_valid(item->'source') is not true
        or private.lesson_json_valid(item->'spoken','plain') is not true then return false; end if;
      visible:=true;
    elsif not text_only and item->>'type'='link' then
      if private.lesson_keys(item,array['type','href','children'],array['type','href','children']) is not true
        or private.lesson_v2_href_valid(item->'href') is not true
        or private.lesson_v2_inlines_valid(item->'children',true) is not true then return false; end if;
      visible:=true;
    else return false;
    end if;
  end loop;
  return visible;
end;
$$;

create function private.lesson_v2_rich_valid(value jsonb)
returns boolean language plpgsql immutable set search_path=pg_catalog as $$
declare item jsonb; child jsonb;
begin
  if private.lesson_keys(value,array['nodes'],array['nodes']) is not true or jsonb_typeof(value->'nodes')<>'array' then return false; end if;
  if jsonb_array_length(value->'nodes') not between 1 and 50 then return false; end if;
  for item in select * from jsonb_array_elements(value->'nodes') loop
    if item->>'type'='paragraph' then
      if private.lesson_keys(item,array['type','children'],array['type','children']) is not true
        or private.lesson_v2_inlines_valid(item->'children') is not true then return false; end if;
    elsif item->>'type'='list' then
      if private.lesson_keys(item,array['type','style','items'],array['type','style','items']) is not true
        or coalesce(item->>'style','') not in ('ordered','unordered') or jsonb_typeof(item->'items')<>'array' then return false; end if;
      if jsonb_array_length(item->'items') not between 1 and 50 then return false; end if;
      for child in select * from jsonb_array_elements(item->'items') loop
        if private.lesson_keys(child,array['type','children'],array['type','children']) is not true
          or child->>'type' is distinct from 'list-item' or private.lesson_v2_inlines_valid(child->'children') is not true then return false; end if;
      end loop;
    else return false;
    end if;
  end loop;
  return true;
end;
$$;

create function private.lesson_v2_block_valid(value jsonb)
returns boolean language plpgsql immutable set search_path=pg_catalog as $$
declare c jsonb;
begin
  if private.lesson_keys(value,array['id','type','version','content'],array['id','type','version','content']) is not true
    or private.lesson_json_valid(value->'id','id') is not true or value->'version' is distinct from '2'::jsonb then return false; end if;
  c:=value->'content';
  if value->>'type'='rich-text' then return private.lesson_v2_rich_valid(c);
  elsif value->>'type'='math' then
    return private.lesson_keys(c,array['source','spoken','display'],array['source','spoken','display']) is true
      and private.lesson_math_source_valid(c->'source') is true and private.lesson_json_valid(c->'spoken','plain') is true and jsonb_typeof(c->'display')='boolean';
  elsif value->>'type'='callout' then
    return private.lesson_keys(c,array['kind','title','body'],array['kind','title','body']) is true
      and coalesce(c->>'kind','') in ('note','definition','warning','example') and private.lesson_json_valid(c->'title','title') is true
      and private.lesson_v2_rich_valid(c->'body') is true;
  end if;
  return false;
end;
$$;

create or replace function private.lesson_json_valid(value jsonb, kind text, depth integer default 0)
returns boolean language plpgsql immutable set search_path = pg_catalog as $$
declare item jsonb; child jsonb; field text; text_value text; allowed text[];
begin
  if value is null or depth>12 then return false; end if;
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


-- Only this data-free, read-only RPC is new. The existing school-session RPC,
-- table grants/RLS, immutable snapshots, review and release transitions are unchanged.
create function public.lesson_content_capabilities()
returns jsonb language plpgsql stable security definer set search_path=pg_catalog as $$
declare rich jsonb; math_block jsonb; callout jsonb; bad jsonb;
begin
  rich:='{"id":"probe-rich","type":"rich-text","version":2,"content":{"nodes":[{"type":"paragraph","children":[{"type":"text","text":"Verified ","marks":["strong"]},{"type":"link","href":"https://example.org/","children":[{"type":"text","text":"source"}]}]},{"type":"list","style":"ordered","items":[{"type":"list-item","children":[{"type":"math","source":{"mode":"visual","expression":{"kind":"symbol","name":"x"}},"spoken":"x"}]}]}]}}'::jsonb;
  math_block:='{"id":"probe-math","type":"math","version":2,"content":{"source":{"mode":"visual","expression":{"kind":"fraction","numerator":{"kind":"number","value":"1"},"denominator":{"kind":"symbol","name":"x"}}},"spoken":"one over x","display":true}}'::jsonb;
  callout:=jsonb_build_object('id','probe-callout','type','callout','version',2,'content',jsonb_build_object('kind','note','title','Probe','body',rich->'content'));
  if private.lesson_json_valid(rich,'block') is not true or private.lesson_json_valid(math_block,'block') is not true
    or private.lesson_json_valid(callout,'block') is not true then return null; end if;
  bad:=jsonb_set(rich,'{content,nodes,0,children,1,href}','"javascript:alert(1)"');
  if private.lesson_json_valid(bad,'block') is not false then return null; end if;
  bad:=jsonb_set(math_block,'{content,source,expression,denominator,name}','"invalid_symbol"');
  if private.lesson_json_valid(bad,'block') is not false then return null; end if;
  bad:=jsonb_set(math_block,'{content,source}',jsonb_build_object('mode','tex','tex',chr(92)||'href{https://example.org}{x}'));
  if private.lesson_json_valid(bad,'block') is not false then return null; end if;
  bad:=jsonb_set(callout,'{content,body,nodes,1,items,0,children}','null');
  if private.lesson_json_valid(bad,'block') is not false then return null; end if;
  return '{"contract":"echs.lesson.authoring.v1","content_version":2,"blocks":{"rich-text":[1,2],"math":[1,2],"callout":[1,2],"legacy-embedded":[1]},"math_expression_version":1}'::jsonb;
end;
$$;

revoke all on function private.lesson_v2_text_valid(jsonb,boolean),private.lesson_v2_href_valid(jsonb),
  private.lesson_math_expression_nodes(jsonb,integer),private.lesson_math_source_valid(jsonb),
  private.lesson_v2_inlines_valid(jsonb,boolean),private.lesson_v2_rich_valid(jsonb),private.lesson_v2_block_valid(jsonb)
  from public,anon,authenticated,service_role;
revoke all on function public.lesson_content_capabilities() from public,anon,authenticated;
grant execute on function public.lesson_content_capabilities() to service_role;

commit;
