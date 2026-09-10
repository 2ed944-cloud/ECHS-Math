-- Isolated C04 owner-fence candidate. Apply only after the exact27 pinned migrations.
-- No public RPC, adoption API, learning payload, real-owner adoption or v2 journal.
begin;

create table private.learning_owner_fences (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  initial_organization_id uuid not null,
  live_account_id uuid references public.accounts(id) on delete set null on update set null,
  epoch smallint not null default 0 check (epoch in (0,1)),
  created_at timestamptz not null default clock_timestamp(),
  constraint learning_fence_live_identity check (live_account_id is null or live_account_id=account_id),
  constraint learning_fence_version_key unique(id,epoch)
);
-- A partial unique index is intentional: clearing the live reference must not
-- be a key-changing update that conflicts with a legacy FOR KEY SHARE holder.
create unique index learning_fence_one_live_account
  on private.learning_owner_fences(live_account_id) where live_account_id is not null;
create index learning_fence_retained_owner on private.learning_owner_fences(account_id);

create table private.learning_owner_barrier (
  id smallint primary key check (id=1),
  epoch bigint not null check (epoch>=0),
  constraint learning_barrier_version_key unique(id,epoch)
);
insert into private.learning_owner_barrier(id,epoch) values(1,0);

create table private.learning_owner_routes (
  organization_id uuid not null,
  account_id uuid primary key,
  fence_id uuid not null unique,
  epoch smallint not null default 1 check (epoch=1),
  contract text not null default 'echs.learning.owner-route.v1'
    check (contract='echs.learning.owner-route.v1'),
  adopted_at timestamptz not null default clock_timestamp(),
  constraint learning_route_current_owner foreign key(organization_id,account_id)
    references public.accounts(organization_id,id) on update restrict on delete restrict,
  constraint learning_route_version foreign key(fence_id,epoch)
    references private.learning_owner_fences(id,epoch) on update restrict on delete restrict
);

alter table private.learning_owner_fences enable row level security;
alter table private.learning_owner_barrier enable row level security;
alter table private.learning_owner_routes enable row level security;
revoke all on private.learning_owner_fences,private.learning_owner_barrier,private.learning_owner_routes
  from public,anon,authenticated,service_role;

create function private.learning_fence_record_guard()
returns trigger language plpgsql volatile security definer set search_path=pg_catalog as $$
declare current_org uuid;
begin
  if tg_op='INSERT' then
    select a.organization_id into current_org from public.accounts a
      where a.id=new.live_account_id for key share;
    if not found or new.account_id is distinct from new.live_account_id
      or new.initial_organization_id is distinct from current_org or new.epoch is distinct from 0 then
      raise exception 'Invalid initial owner fence' using errcode='23514';
    end if;
    return new;
  end if;
  if tg_op='DELETE' then
    if old.live_account_id is not null or old.epoch<>0 then
      raise exception 'Live or adopted owner fence is retained' using errcode='23514';
    end if;
    return old;
  end if;
  if (new.id,new.account_id,new.initial_organization_id,new.created_at)
    is distinct from (old.id,old.account_id,old.initial_organization_id,old.created_at) then
    raise exception 'Owner fence identity is immutable' using errcode='23514';
  end if;
  if new.live_account_id is distinct from old.live_account_id then
    if new.live_account_id is not null or old.epoch<>0 or new.epoch<>old.epoch
      or exists(select 1 from public.accounts a where a.id=old.live_account_id) then
      raise exception 'Only a removed unadopted account reference may clear' using errcode='23514';
    end if;
  end if;
  if new.epoch is distinct from old.epoch and not
    (old.epoch=0 and new.epoch=1 and new.live_account_id is not null
      and new.live_account_id is not distinct from old.live_account_id) then
    raise exception 'Owner fence cannot reset' using errcode='23514';
  end if;
  return new;
end $$;

create function private.learning_fence_provision()
returns trigger language plpgsql volatile security definer set search_path=pg_catalog as $$
begin
  if tg_op='INSERT' or new.id is distinct from old.id then
    insert into private.learning_owner_fences(account_id,initial_organization_id,live_account_id)
      values(new.id,new.organization_id,new.id)
      on conflict(live_account_id) where live_account_id is not null do nothing;
  end if;
  return new;
end $$;

create function private.learning_owner_retained()
returns trigger language plpgsql volatile security definer set search_path=pg_catalog as $$
begin
  raise exception 'Owner routing metadata is retained' using errcode='23514';
end $$;

create function private.learning_barrier_guard()
returns trigger language plpgsql volatile security definer set search_path=pg_catalog as $$
begin
  if new.id is distinct from old.id or new.epoch is distinct from old.epoch+1 then
    raise exception 'Owner barrier cannot reset or skip' using errcode='23514';
  end if;
  return new;
end $$;

create function private.learning_adoption_relations()
returns trigger language plpgsql volatile security definer set search_path=pg_catalog as $$
begin
  -- Held until transaction end. A legacy TRUNCATE cannot pass adoption and
  -- then erase that owner's retained baseline. Ordinary DML remains concurrent.
  lock table public.assignment_results,public.learning_attempts,public.learning_sessions,
    public.lesson_completions,public.mastery_records,public.review_items in access share mode;
  return null;
end $$;

create function private.learning_owner_route_insert()
returns trigger language plpgsql volatile security definer set search_path=pg_catalog as $$
declare current_org uuid; selected_fence private.learning_owner_fences%rowtype;
  previous private.learning_owner_routes%rowtype; barrier_epoch bigint;
begin
  -- Fixed order: relation locks in statement trigger; singleton; organization;
  -- account; private owner row. No browser/session authority is inferred here.
  select b.epoch into barrier_epoch from private.learning_owner_barrier b where b.id=1 for update;
  if not found then raise exception 'Owner barrier unavailable' using errcode='40001';end if;
  perform 1 from public.organizations o where o.id=new.organization_id for key share;
  if not found then raise exception 'Owner organization unavailable' using errcode='23503';end if;
  select a.organization_id into current_org from public.accounts a where a.id=new.account_id for key share;
  if not found or current_org is distinct from new.organization_id then
    raise exception 'Owner tenant does not match' using errcode='23503';
  end if;
  select f.* into selected_fence from private.learning_owner_fences f
    where f.live_account_id=new.account_id and f.account_id=new.account_id for update;
  if not found then raise exception 'Fresh owner fence required' using errcode='40001';end if;
  if new.fence_id is not null and new.fence_id is distinct from selected_fence.id then
    raise exception 'Owner fence does not match' using errcode='23514';
  end if;
  if new.epoch is distinct from 1 or new.contract is distinct from 'echs.learning.owner-route.v1' then
    raise exception 'Unsupported owner route' using errcode='23514';
  end if;
  new.fence_id:=selected_fence.id;
  if selected_fence.epoch=1 then
    select r.* into previous from private.learning_owner_routes r where r.account_id=new.account_id;
    if not found or previous.organization_id is distinct from new.organization_id
      or previous.fence_id is distinct from selected_fence.id then
      raise exception 'Owner route requires reconciliation' using errcode='23514';
    end if;
    new.adopted_at:=previous.adopted_at;
    return new; -- An exact INSERT ON CONFLICT DO NOTHING can remain a no-op.
  end if;
  update private.learning_owner_fences set epoch=1 where id=selected_fence.id;
  update private.learning_owner_barrier set epoch=barrier_epoch+1 where id=1;
  new.adopted_at:=clock_timestamp();
  return new;
end $$;

create function private.learning_legacy_owner_guard()
returns trigger language plpgsql volatile security definer set search_path=pg_catalog as $$
declare old_owner uuid;new_owner uuid;owner_id uuid;selected_fence record;seen boolean;
begin
  if tg_table_schema<>'public' or tg_table_name not in
    ('assignment_results','learning_attempts','learning_sessions','lesson_completions','mastery_records','review_items') then
    raise exception 'Unsupported owner fence target' using errcode='23514';
  end if;
  if tg_table_name='assignment_results' then
    if tg_op<>'INSERT' then old_owner:=old.student_id;end if;
    if tg_op<>'DELETE' then new_owner:=new.student_id;end if;
  else
    if tg_op<>'INSERT' then old_owner:=old.account_id;end if;
    if tg_op<>'DELETE' then new_owner:=new.account_id;end if;
  end if;
  for owner_id in select distinct value from unnest(array[old_owner,new_owner]) value where value is not null order by value loop
    seen:=false;
    for selected_fence in select f.id,f.epoch from private.learning_owner_fences f
      where f.live_account_id=owner_id order by f.id for key share loop
      seen:=true;
      if selected_fence.epoch<>0 then
        raise exception 'Versioned owner cannot write legacy learning records' using errcode='55000';
      end if;
    end loop;
    if not seen then
      -- FK cascades may have already nulled the live reference. Only deletion
      -- of an actually removed unadopted parent can use retained metadata.
      if tg_op='DELETE' and not exists(select 1 from public.accounts a where a.id=owner_id) then
        for selected_fence in select f.id,f.epoch from private.learning_owner_fences f
          where f.account_id=owner_id order by f.id for key share loop
          seen:=true;
          if selected_fence.epoch<>0 then raise exception 'Adopted history is retained' using errcode='55000';end if;
        end loop;
      end if;
      if not seen then raise exception 'Fresh owner fence required' using errcode='40001';end if;
    end if;
  end loop;
  if tg_op='DELETE' then return old;end if;
  return new;
end $$;

create function private.learning_legacy_truncate_guard()
returns trigger language plpgsql volatile security definer set search_path=pg_catalog as $$
declare barrier_epoch bigint;
begin
  -- A single key-versioned row catches even owners provisioned outside a fixed
  -- RR/serializable snapshot. A stale key locker must serialize or fail.
  select b.epoch into barrier_epoch from private.learning_owner_barrier b where b.id=1 for key share;
  if not found then raise exception 'Fresh owner barrier required' using errcode='40001';end if;
  if barrier_epoch<>0 then raise exception 'Adopted learning history cannot be truncated' using errcode='55000';end if;
  return null;
end $$;

create trigger learning_fence_record_guard before insert or update or delete
  on private.learning_owner_fences for each row execute function private.learning_fence_record_guard();
create trigger learning_fences_no_truncate before truncate on private.learning_owner_fences
  for each statement execute function private.learning_owner_retained();
create trigger learning_barrier_update before update on private.learning_owner_barrier
  for each row execute function private.learning_barrier_guard();
create trigger learning_barrier_delete before delete on private.learning_owner_barrier
  for each row execute function private.learning_owner_retained();
create trigger learning_barrier_truncate before truncate on private.learning_owner_barrier
  for each statement execute function private.learning_owner_retained();
create trigger learning_route_relations before insert on private.learning_owner_routes
  for each statement execute function private.learning_adoption_relations();
create trigger learning_route_insert before insert on private.learning_owner_routes
  for each row execute function private.learning_owner_route_insert();
create trigger learning_route_retained before update or delete on private.learning_owner_routes
  for each row execute function private.learning_owner_retained();
create trigger learning_route_no_truncate before truncate on private.learning_owner_routes
  for each statement execute function private.learning_owner_retained();
create trigger learning_fence_provision after insert or update of id on public.accounts
  for each row execute function private.learning_fence_provision();

insert into private.learning_owner_fences(account_id,initial_organization_id,live_account_id)
  select id,organization_id,id from public.accounts order by id;

do $$declare target text;begin
  foreach target in array array['assignment_results','learning_attempts','learning_sessions','lesson_completions','mastery_records','review_items'] loop
    execute format('create trigger learning_owner_fence before insert or update or delete on public.%I for each row execute function private.learning_legacy_owner_guard()',target);
    execute format('create trigger learning_owner_no_truncate before truncate on public.%I for each statement execute function private.learning_legacy_truncate_guard()',target);
  end loop;
end $$;

revoke all on function private.learning_fence_record_guard(),private.learning_fence_provision(),
  private.learning_owner_retained(),private.learning_barrier_guard(),private.learning_adoption_relations(),
  private.learning_owner_route_insert(),private.learning_legacy_owner_guard(),private.learning_legacy_truncate_guard()
  from public,anon,authenticated,service_role;

comment on table private.learning_owner_fences is 'Private metadata only; null live references retain unadopted account incarnations until explicitly reviewed maintenance. No payload, name or token.';
comment on table private.learning_owner_routes is 'Zero rows on installation. Database-owner synthetic adoption only in isolated tests; no public or service-role adoption API.';
comment on table private.learning_owner_barrier is 'Private adoption counter; key-versioned lock protects legacy TRUNCATE across fixed snapshots.';
commit;
