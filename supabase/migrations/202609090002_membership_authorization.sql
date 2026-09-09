-- ECHS-C09: authenticated, tenant-scoped, atomic class roster replacement.
-- No existing rows, table grants, lesson releases or grading rules are changed.
create function public.api_replace_class_memberships(
  p_token_hash text,p_class_id uuid,p_student_ids uuid[],p_teacher_ids uuid[]
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  current_session private.sessions;
  actor public.accounts;
  selected_class public.classes;
  students uuid[];
  teachers uuid[];
  requested uuid[];
  account_row public.accounts;
  found_count integer := 0;
  actor_member_role text;
begin
  if p_token_hash is null or p_token_hash collate "C" !~ '^[0-9a-f]{64}$' then
    raise exception 'Current school session required' using errcode='28000';
  end if;
  -- Match account-suspension and lesson-store lock ordering: discover the actor,
  -- lock their current account, then re-read and lock the exact live session.
  select * into current_session from private.sessions s
    where s.token_hash=p_token_hash and s.revoked_at is null and s.expires_at>clock_timestamp();
  if not found then raise exception 'Current school session required' using errcode='28000'; end if;
  select * into actor from public.accounts a where a.id=current_session.account_id and a.status='active' for share;
  if not found then raise exception 'Current school session required' using errcode='28000'; end if;
  select * into current_session from private.sessions s where s.token_hash=p_token_hash and s.account_id=actor.id
    and s.revoked_at is null and s.expires_at>clock_timestamp() for share;
  if not found then raise exception 'Current school session required' using errcode='28000'; end if;
  if actor.role not in ('teacher','admin') then raise exception 'Class staff required' using errcode='42501'; end if;
  select * into selected_class from public.classes c where c.id=p_class_id and c.organization_id=actor.organization_id and c.status='active' for update;
  if not found then raise exception 'Class access is not permitted' using errcode='42501'; end if;
  if actor.role='teacher' then
    select m.membership_role into actor_member_role from public.class_memberships m
      where m.class_id=p_class_id and m.account_id=actor.id for share;
    if not found or actor_member_role is distinct from 'teacher' then
      raise exception 'Class access is not permitted' using errcode='42501';
    end if;
  end if;
  -- Empty rosters are valid for administrators. Teacher callers retain their own
  -- exact teacher membership, matching the existing HTTP replacement behavior.
  if p_student_ids is null or p_teacher_ids is null
    or coalesce(array_ndims(p_student_ids),1)<>1 or coalesce(array_ndims(p_teacher_ids),1)<>1
    or cardinality(p_student_ids)+cardinality(p_teacher_ids)>10000
    or exists(select 1 from unnest(p_student_ids||p_teacher_ids) x(id) where id is null) then
    raise exception 'Invalid class member list' using errcode='22023';
  end if;
  select coalesce(array_agg(distinct x order by x),'{}'::uuid[]) into students from unnest(p_student_ids) x;
  select coalesce(array_agg(distinct x order by x),'{}'::uuid[]) into teachers
    from unnest(p_teacher_ids||case when actor.role='teacher' then array[actor.id] else '{}'::uuid[] end) x;
  if students&&teachers then raise exception 'An account cannot have two class roles' using errcode='22023'; end if;
  requested:=students||teachers;
  -- Lock every requested account in deterministic UUID order. Recheck predicates
  -- after any concurrent role/organization/activity change has committed.
  for account_row in select * from public.accounts a where a.id=any(requested) order by a.id for share loop
    found_count:=found_count+1;
    if account_row.organization_id<>actor.organization_id or account_row.status<>'active'
      or (account_row.id=any(students) and account_row.role<>'student')
      or (account_row.id=any(teachers) and account_row.role<>'teacher') then
      raise exception 'Class members must be active accounts with the requested role in this organization' using errcode='42501';
    end if;
  end loop;
  if found_count<>cardinality(requested) then
    raise exception 'Class members must be active accounts with the requested role in this organization' using errcode='42501';
  end if;
  if current_session.expires_at<=clock_timestamp() then raise exception 'School session expired' using errcode='28000'; end if;
  -- One transaction: an insert/constraint failure rolls back every deletion.
  -- No-op retries preserve joined_at for unchanged members.
  delete from public.class_memberships m where m.class_id=p_class_id and not
    ((m.membership_role='student' and m.account_id=any(students)) or (m.membership_role='teacher' and m.account_id=any(teachers)));
  insert into public.class_memberships(class_id,account_id,membership_role)
    select p_class_id,x,'student' from unnest(students) x
    union all select p_class_id,x,'teacher' from unnest(teachers) x
    on conflict(class_id,account_id) do update set membership_role=excluded.membership_role
      where class_memberships.membership_role is distinct from excluded.membership_role;
  if (select count(*) from public.class_memberships m where m.class_id=p_class_id)<>cardinality(requested)
    or exists(select 1 from public.class_memberships m where m.class_id=p_class_id and not
      ((m.membership_role='student' and m.account_id=any(students)) or (m.membership_role='teacher' and m.account_id=any(teachers)))) then
    raise exception 'Membership replacement did not complete' using errcode='23514';
  end if;
  if current_session.expires_at<=clock_timestamp() then raise exception 'School session expired' using errcode='28000'; end if;
  return jsonb_build_object('ok',true,'contract','echs.membership.v1','class_id',p_class_id,'members',cardinality(requested));
end;
$$;
revoke all on function public.api_replace_class_memberships(text,uuid,uuid[],uuid[]) from public,anon,authenticated;
grant execute on function public.api_replace_class_memberships(text,uuid,uuid[],uuid[]) to service_role;

create function public.api_membership_capabilities() returns jsonb
language sql stable security definer set search_path = ''
as $$
  select case when exists(select 1 from pg_catalog.pg_proc p
    where p.oid='public.api_replace_class_memberships(text,uuid,uuid[],uuid[])'::regprocedure and p.prosecdef)
    and pg_catalog.has_function_privilege('service_role','public.api_replace_class_memberships(text,uuid,uuid[],uuid[])','execute')
    and not pg_catalog.has_function_privilege('anon','public.api_replace_class_memberships(text,uuid,uuid[],uuid[])','execute')
    and not pg_catalog.has_function_privilege('authenticated','public.api_replace_class_memberships(text,uuid,uuid[],uuid[])','execute')
    then jsonb_build_object('contract','echs.membership.v1','atomic_replacement',true,'tenant_scoped',true) else null end;
$$;
revoke all on function public.api_membership_capabilities() from public,anon,authenticated;
grant execute on function public.api_membership_capabilities() to service_role;
