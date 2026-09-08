-- ECHS-003: additive reviewed snapshots; no legacy assignment or evidence backfill.
-- School identities are public.accounts UUIDs, not auth.uid() identities.
begin;

create function private.curriculum_snapshot_valid(document jsonb, kind text)
returns boolean language plpgsql immutable set search_path = pg_catalog as $$
declare
  field text;
  fields text[];
  source jsonb;
  sources text[] := '{}';
begin
  if jsonb_typeof(document) is distinct from 'object' then return false; end if;
  fields := case kind
    when 'curriculum' then array['id','key','family','name','status','first_assessment','edition','verified_at','verified_by','verification_kind']
    when 'course' then array['id','key','curriculum_version_id','course_code','title','status','verified_at']
    else null end;
  if fields is null then return false; end if;
  foreach field in array fields loop
    if jsonb_typeof(document->field) is distinct from 'string' or nullif(btrim(document->>field),'') is null then return false; end if;
  end loop;
  if (document->>'verified_at') !~ '^\d{4}-\d{2}-\d{2}$' then return false; end if;
  perform (document->>'verified_at')::date;
  if jsonb_typeof(document->'source_references') is distinct from 'array' then return false; end if;
  if jsonb_array_length(document->'source_references')=0 then return false; end if;
  for source in select * from jsonb_array_elements(document->'source_references') loop
    if jsonb_typeof(source) is distinct from 'string' or nullif(btrim(source#>>'{}'),'') is null or (source#>>'{}')=any(sources) then return false; end if;
    sources := array_append(sources,source#>>'{}');
  end loop;
  if kind='curriculum' then
    if not (document ?& array['last_assessment','effective_from','effective_to']) then return false; end if;
    if (document->>'first_assessment') !~ '^\d{4}-(0[1-9]|1[0-2])$' then return false; end if;
    foreach field in array array['last_assessment','effective_from','effective_to'] loop
      if document->field <> 'null'::jsonb then
        if jsonb_typeof(document->field) is distinct from 'string' or (document->>field) !~ '^\d{4}-(0[1-9]|1[0-2])(-\d{2})?$' then return false; end if;
        if length(document->>field)=10 then perform (document->>field)::date; end if;
      end if;
    end loop;
  else
    if not (document ?& array['school_year','is_placeholder','assessment_profile','scope']) then return false; end if;
    if jsonb_typeof(document->'is_placeholder') is distinct from 'boolean' or jsonb_typeof(document->'scope') is distinct from 'object' or document->'scope'='{}'::jsonb then return false; end if;
    if document->>'status'='active' and ((document#>'{scope,current_cohort_use}')='false'::jsonb or (document#>>'{scope,objective_mapping_status}')='not_imported') then return false; end if;
    if (document->>'is_placeholder')::boolean then
      if document->>'status'<>'future' or document->'assessment_profile'<>'null'::jsonb or document->'school_year'<>'null'::jsonb
         or (document#>>'{scope,objective_mapping_status}') is distinct from 'not_imported'
         or (document#>'{scope,current_cohort_use}') is distinct from 'false'::jsonb then return false; end if;
    else
      if jsonb_typeof(document->'school_year') is distinct from 'string' or nullif(btrim(document->>'school_year'),'') is null
         or jsonb_typeof(document->'assessment_profile') is distinct from 'object'
         or jsonb_typeof(document#>'{assessment_profile,sections}') is distinct from 'array' then return false; end if;
      if jsonb_array_length(document#>'{assessment_profile,sections}')=0 then return false; end if;
    end if;
  end if;
  return true;
exception when invalid_datetime_format or datetime_field_overflow then return false;
end;
$$;

create table public.curriculum_versions (
  id uuid primary key,
  version_key text not null unique check (length(btrim(version_key))>0),
  family text not null check (family in ('college-board-ap','ib-dp')),
  status text not null check (status in ('active','future','retired')),
  record jsonb not null,
  created_at timestamptz not null default now(),
  constraint curriculum_record_required check (private.curriculum_snapshot_valid(record,'curriculum') is true),
  constraint curriculum_record_identity check ((record->>'id'=id::text and record->>'key'=version_key and record->>'family'=family and record->>'status'=status) is true)
);
create table public.course_versions (
  id uuid primary key,
  version_key text not null unique check (length(btrim(version_key))>0),
  curriculum_version_id uuid not null constraint course_curriculum_version_fk references public.curriculum_versions(id) on delete restrict,
  course_code text not null check (length(btrim(course_code))>0),
  status text not null check (status in ('active','future','retired')),
  is_placeholder boolean not null default false,
  record jsonb not null,
  created_at timestamptz not null default now(),
  constraint course_placeholder_future check (not is_placeholder or status='future'),
  constraint course_record_required check (private.curriculum_snapshot_valid(record,'course') is true),
  constraint course_record_identity check ((record->>'id'=id::text and record->>'key'=version_key and record->>'curriculum_version_id'=curriculum_version_id::text and record->>'course_code'=course_code and record->>'status'=status and record->'is_placeholder'=to_jsonb(is_placeholder)) is true)
);

-- Existing UUID identifiers and rows are unchanged. Composite indexes permit tenant FKs.
create unique index classes_curriculum_org_id on public.classes(organization_id,id);
create unique index accounts_curriculum_org_id on public.accounts(organization_id,id);
create table public.class_course_version_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null constraint curriculum_assignment_org_fk references public.organizations(id) on delete restrict,
  class_id uuid not null,
  course_version_id uuid not null constraint curriculum_assignment_course_fk references public.course_versions(id) on delete restrict,
  assigned_by uuid not null,
  state text not null check (state in ('planned','active','superseded')),
  reason text not null check (length(btrim(reason)) between 1 and 1000),
  created_at timestamptz not null default now(),
  constraint curriculum_assignment_class_tenant foreign key (organization_id,class_id) references public.classes(organization_id,id) on delete restrict,
  constraint curriculum_assignment_actor_tenant foreign key (organization_id,assigned_by) references public.accounts(organization_id,id) on delete restrict
);
create unique index one_active_curriculum_version_per_class on public.class_course_version_assignments(organization_id,class_id) where state='active';

create function private.curriculum_version_immutable()
returns trigger language plpgsql set search_path = pg_catalog, public, private as $$
begin
  raise exception 'Curriculum snapshots are immutable; insert a reviewed new version' using errcode='23514';
end;
$$;
create trigger curriculum_versions_immutable before update or delete on public.curriculum_versions for each row execute function private.curriculum_version_immutable();
create trigger course_versions_immutable before update or delete on public.course_versions for each row execute function private.curriculum_version_immutable();

create function private.guard_course_curriculum()
returns trigger language plpgsql set search_path = pg_catalog, public, private as $$
declare parent_status text;
begin
  select status into parent_status from public.curriculum_versions where id=new.curriculum_version_id for key share;
  if found and new.status='active' and parent_status<>'active' then
    raise exception 'An active course requires an active curriculum snapshot' using errcode='23514';
  end if;
  return new;
end;
$$;
create trigger course_curriculum_guard before insert on public.course_versions for each row execute function private.guard_course_curriculum();

create function private.guard_curriculum_assignment()
returns trigger language plpgsql set search_path = pg_catalog, public, private as $$
declare selected public.course_versions%rowtype; parent_status text; class_status text;
begin
  if tg_op='DELETE' then raise exception 'Keep assignment history; supersede the assignment' using errcode='23514'; end if;
  if tg_op='UPDATE' then
    if row(new.id,new.organization_id,new.class_id,new.course_version_id,new.assigned_by,new.reason,new.created_at)
       is distinct from row(old.id,old.organization_id,old.class_id,old.course_version_id,old.assigned_by,old.reason,old.created_at)
       or old.state='superseded' or new.state<>'superseded' then
      raise exception 'Assignment identity is immutable; supersede and insert a new pin' using errcode='23514';
    end if;
    return new;
  end if;
  if new.state='superseded' then raise exception 'New assignments must be explicit planned or active pins' using errcode='23514'; end if;
  -- This validates the stored actor. A future Edge API must derive it from its verified
  -- session; a service-role connection is not proof of a browser user's identity.
  if not exists (select 1 from public.accounts where id=new.assigned_by and organization_id=new.organization_id and role='admin' and status='active') then
    raise exception 'An active administrator in this organization is required' using errcode='42501';
  end if;
  select * into selected from public.course_versions where id=new.course_version_id for key share;
  if found and new.state='active' then
    select status into parent_status from public.curriculum_versions where id=selected.curriculum_version_id for key share;
    if selected.status<>'active' or selected.is_placeholder or parent_status is distinct from 'active' then
      raise exception 'Future/placeholder/retired curricula cannot be active assignments' using errcode='23514';
    end if;
    select status into class_status from public.classes where id=new.class_id and organization_id=new.organization_id for key share;
    if found and class_status<>'active' then raise exception 'An active pin requires an active class' using errcode='23514'; end if;
  end if;
  return new;
end;
$$;
create trigger curriculum_assignment_guard before insert or update or delete on public.class_course_version_assignments for each row execute function private.guard_curriculum_assignment();

alter table public.curriculum_versions enable row level security;
alter table public.course_versions enable row level security;
alter table public.class_course_version_assignments enable row level security;
revoke all on public.curriculum_versions,public.course_versions,public.class_course_version_assignments from public,anon,authenticated;
grant select,insert,update,delete on public.curriculum_versions,public.course_versions,public.class_course_version_assignments to service_role;
revoke all on function private.curriculum_snapshot_valid(jsonb,text),private.curriculum_version_immutable(),private.guard_course_curriculum(),private.guard_curriculum_assignment() from public,anon,authenticated;
grant execute on function private.curriculum_snapshot_valid(jsonb,text),private.curriculum_version_immutable(),private.guard_course_curriculum(),private.guard_curriculum_assignment() to service_role;
comment on table public.class_course_version_assignments is 'Explicit reviewed class pins; no current runtime integration. Future API derives organization_id/assigned_by from verified custom school session, never caller JSON. No automatic calendar/cohort migration.';

-- SOURCE_VERIFIED_SEEDS: exact snapshots from curriculum/registry/course-versions.v1.json
insert into public.curriculum_versions(id,version_key,family,status,record)
select (v->>'id')::uuid,v->>'key',v->>'family',v->>'status',v
from jsonb_array_elements($curriculum$[{"id": "ae9b2f3b-18a8-57d4-9589-9476dbcd1fee", "key": "ap-calculus-2026-27", "family": "college-board-ap", "name": "AP Calculus AB/BC 2026–27", "status": "active", "first_assessment": "2027-05", "last_assessment": null, "effective_from": null, "effective_to": null, "edition": "Fall 2020 CED with Fall 2026 amendment", "source_references": ["calc-ced", "calc-amendment"], "verified_at": "2026-09-08", "verified_by": "Codex official-source review", "verification_kind": "source_check; not publisher endorsement"}, {"id": "124a0935-930a-5610-b32f-a216998aa9af", "key": "ap-precalculus-2026-27", "family": "college-board-ap", "name": "AP Precalculus 2026–27", "status": "active", "first_assessment": "2027-05", "last_assessment": null, "effective_from": null, "effective_to": null, "edition": "Fall 2026 CED and amendment", "source_references": ["precalc-ced", "precalc-amendment"], "verified_at": "2026-09-08", "verified_by": "Codex official-source review", "verification_kind": "source_check; not publisher endorsement"}, {"id": "88329b13-7b6e-52f2-a525-10c84b86ac73", "key": "ib-ai-first-assessment-2021", "family": "ib-dp", "name": "IB Mathematics AI, first assessment 2021", "status": "active", "first_assessment": "2021-05", "last_assessment": null, "effective_from": null, "effective_to": null, "edition": "First teaching August 2019; first assessment May 2021", "source_references": ["ib-current-guide"], "verified_at": "2026-09-08", "verified_by": "Codex official-source review", "verification_kind": "source_check; not publisher endorsement"}, {"id": "dbf149b7-4dd5-5bb6-a64f-4370fec807ca", "key": "ib-ai-first-assessment-2029", "family": "ib-dp", "name": "IB Mathematics AI, first assessment 2029", "status": "future", "first_assessment": "2029-05", "last_assessment": null, "effective_from": null, "effective_to": null, "edition": "Future placeholder; full objective mapping not verified", "source_references": ["ib-transition", "ib-future-brief"], "verified_at": "2026-09-08", "verified_by": "Codex official-source review", "verification_kind": "source_check; not publisher endorsement"}]$curriculum$::jsonb) as v;
insert into public.course_versions(id,version_key,curriculum_version_id,course_code,status,is_placeholder,record)
select (v->>'id')::uuid,v->>'key',(v->>'curriculum_version_id')::uuid,v->>'course_code',v->>'status',(v->>'is_placeholder')::boolean,v
from jsonb_array_elements($courses$[{"id": "c7109cf8-abb4-5541-b431-c2ef17f6dffb", "key": "ap-calculus-ab-2026-27", "curriculum_version_id": "ae9b2f3b-18a8-57d4-9589-9476dbcd1fee", "course_code": "ap-calculus-ab", "title": "AP Calculus AB", "school_year": "2026-27", "status": "active", "is_placeholder": false, "assessment_profile": {"effective_exam_period": "2027-05", "delivery": "hybrid_digital", "response_modes": ["digital_mcq", "handwritten_frq"], "sections": [{"id": "mcq", "question_count": 42, "duration_minutes": 100, "weight_percent": 50, "parts": [{"id": "A", "question_count": 29, "duration_minutes": 62, "calculator_policy": "not_permitted", "weight_percent": null}, {"id": "B", "question_count": 13, "duration_minutes": 38, "calculator_policy": "graphing_required", "weight_percent": null}]}, {"id": "frq", "question_count": 6, "duration_minutes": 90, "weight_percent": 50, "parts": [{"id": "A", "question_count": 2, "duration_minutes": 30, "calculator_policy": "graphing_required", "weight_percent": null}, {"id": "B", "question_count": 4, "duration_minutes": 60, "calculator_policy": "not_permitted", "weight_percent": null}]}]}, "scope": {"units": [1, 2, 3, 4, 5, 6, 7, 8], "requires_ab_objective_scope": true}, "source_references": ["calc-ced", "calc-amendment", "calc-ab-exam"], "verified_at": "2026-09-08"}, {"id": "41495438-31bb-54ad-a8e3-02a17c5e0d39", "key": "ap-calculus-bc-2026-27", "curriculum_version_id": "ae9b2f3b-18a8-57d4-9589-9476dbcd1fee", "course_code": "ap-calculus-bc", "title": "AP Calculus BC", "school_year": "2026-27", "status": "active", "is_placeholder": false, "assessment_profile": {"effective_exam_period": "2027-05", "delivery": "hybrid_digital", "response_modes": ["digital_mcq", "handwritten_frq"], "sections": [{"id": "mcq", "question_count": 42, "duration_minutes": 100, "weight_percent": 50, "parts": [{"id": "A", "question_count": 29, "duration_minutes": 62, "calculator_policy": "not_permitted", "weight_percent": null}, {"id": "B", "question_count": 13, "duration_minutes": 38, "calculator_policy": "graphing_required", "weight_percent": null}]}, {"id": "frq", "question_count": 6, "duration_minutes": 90, "weight_percent": 50, "parts": [{"id": "A", "question_count": 2, "duration_minutes": 30, "calculator_policy": "graphing_required", "weight_percent": null}, {"id": "B", "question_count": 4, "duration_minutes": 60, "calculator_policy": "not_permitted", "weight_percent": null}]}]}, "scope": {"units": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], "includes_bc_extensions": true}, "source_references": ["calc-ced", "calc-amendment", "calc-bc-exam"], "verified_at": "2026-09-08"}, {"id": "2448f920-c167-57f3-99e6-4b9fc1dec34a", "key": "ap-precalculus-2026-27", "curriculum_version_id": "124a0935-930a-5610-b32f-a216998aa9af", "course_code": "ap-precalculus", "title": "AP Precalculus", "school_year": "2026-27", "status": "active", "is_placeholder": false, "assessment_profile": {"effective_exam_period": "2027-05", "delivery": "hybrid_digital", "response_modes": ["digital_mcq", "handwritten_frq"], "sections": [{"id": "mcq", "question_count": 42, "duration_minutes": 105, "weight_percent": 62.5, "parts": [{"id": "A", "question_count": 29, "duration_minutes": 65, "calculator_policy": "not_permitted", "weight_percent": 43.75}, {"id": "B", "question_count": 13, "duration_minutes": 40, "calculator_policy": "graphing_required", "weight_percent": 18.75}]}, {"id": "frq", "question_count": 4, "duration_minutes": 70, "weight_percent": 37.5, "parts": [{"id": "A", "question_count": 2, "duration_minutes": 35, "calculator_policy": "graphing_required", "weight_percent": 18.75}, {"id": "B", "question_count": 2, "duration_minutes": 35, "calculator_policy": "not_permitted", "weight_percent": 18.75}], "question_categories": ["Function Concepts", "Modeling a Non-Periodic Context", "Modeling a Periodic Context", "Symbolic Manipulations"]}]}, "scope": {"exam_assessed_units": [1, 2, 3], "non_exam_units": [4]}, "source_references": ["precalc-ced", "precalc-amendment", "precalc-exam"], "verified_at": "2026-09-08"}, {"id": "9a875b4c-61af-5001-9f31-a22044f6f58d", "key": "ib-ai-sl-first-assessment-2021", "curriculum_version_id": "88329b13-7b6e-52f2-a525-10c84b86ac73", "course_code": "ib-math-ai-sl", "title": "IB Mathematics: Applications and Interpretation SL", "school_year": "2026-27", "status": "active", "is_placeholder": false, "assessment_profile": {"effective_exam_period": "2021-05", "delivery": null, "response_modes": null, "sections": [{"id": "paper1", "question_count": null, "duration_minutes": 90, "marks": 80, "weight_percent": 40, "calculator_policy": "technology_required", "response_format": "compulsory_short_response"}, {"id": "paper2", "question_count": null, "duration_minutes": 90, "marks": 80, "weight_percent": 40, "calculator_policy": "technology_required", "response_format": "compulsory_extended_response"}, {"id": "exploration", "question_count": null, "duration_minutes": null, "marks": 20, "weight_percent": 20, "calculator_policy": null, "response_format": "internal_exploration"}]}, "scope": {"content_areas": ["Number and algebra", "Functions", "Geometry and trigonometry", "Statistics and probability", "Calculus"]}, "source_references": ["ib-current-guide"], "verified_at": "2026-09-08"}, {"id": "56880c32-495b-5f31-a0aa-b04efa1b34b7", "key": "ib-ai-sl-first-assessment-2029", "curriculum_version_id": "dbf149b7-4dd5-5bb6-a64f-4370fec807ca", "course_code": "ib-math-ai-sl", "title": "IB Mathematics AI SL (future 2029)", "school_year": null, "status": "future", "is_placeholder": true, "assessment_profile": null, "scope": {"objective_mapping_status": "not_imported", "current_cohort_use": false}, "source_references": ["ib-transition", "ib-future-brief"], "verified_at": "2026-09-08"}]$courses$::jsonb) as v;
commit;
