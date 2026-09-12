"""Actual PostgreSQL assertions; imported by the isolated baseline runner only."""
import json,time,uuid
from concurrent.futures import ThreadPoolExecutor
from contract import TABLES

def exercise(db,connect,passed):
 import psycopg
 from psycopg import sql
 from psycopg.types.json import Jsonb
 nonce=uuid.uuid4().hex
 def rejected(label,fn,code='55000'):
  try:
   with db.transaction():fn()
  except psycopg.Error as e:assert e.sqlstate in ((code,) if isinstance(code,str) else code),(label,e.sqlstate,code)
  else:raise AssertionError(label+' was accepted')
  passed(label)
 def organization():
  value=uuid.uuid4();db.execute("insert into organizations(id,name,slug) values(%s,'Synthetic owner-fence organization',%s)",(value,'fence-'+uuid.uuid4().hex));return value
 org=organization();other_org=organization()
 def account(scope=org,value=None):
  value=value or uuid.uuid4();db.execute("insert into accounts(id,organization_id,username,display_name,role) values(%s,%s,%s,'Synthetic owner','student')",(value,scope,'fence-'+uuid.uuid4().hex));return value
 def values(table,owner,scope=org,key=None):
  key=key or uuid.uuid4().hex
  base={'account_id':owner,'organization_id':scope}
  if table=='learning_attempts':return {**base,'client_event_id':key,'question_id':'SYNTHETIC-FENCE','correct':False,'occurred_at':'2026-01-01T00:00:00Z','payload':Jsonb({'synthetic':True})}
  if table=='learning_sessions':return {**base,'client_session_id':key,'mode':'practice','started_at':'2026-01-01T00:00:00Z','payload':Jsonb({'synthetic':True})}
  if table=='review_items':return {**base,'question_id':key,'payload':Jsonb({'synthetic':True})}
  if table=='lesson_completions':return {**base,'access_key':key,'course_key':'synthetic','unit_index':0,'topic':'1.1','completed_at':'2026-01-01T00:00:00Z','payload':Jsonb({'synthetic':True})}
  if table=='mastery_records':return {**base,'skill_key':key,'source':'server','score':20,'payload':Jsonb({'algorithm':'echs-mastery-2.0-foundation','synthetic':True})}
  return {'assignment_id':assignment,'student_id':owner,'status':'in_progress','payload':Jsonb({'synthetic':True})}
 assignment=uuid.uuid4();admin=account()
 db.execute("update accounts set role='admin' where id=%s",(admin,))
 db.execute("insert into assignments(id,organization_id,created_by,title,activity_type) values(%s,%s,%s,'Synthetic fence assignment','practice')",(assignment,org,admin))
 conflict={'learning_attempts':'account_id,client_event_id','learning_sessions':'account_id,client_session_id','review_items':'account_id,question_id','lesson_completions':'account_id,access_key','mastery_records':'account_id,skill_key','assignment_results':'assignment_id,student_id'}
 def insert(table,row,conn=db,suffix=''):
  query=sql.SQL('insert into public.{} ({}) values ({}) ').format(sql.Identifier(table),sql.SQL(',').join(map(sql.Identifier,row)),sql.SQL(',').join(sql.Placeholder() for _ in row))+sql.SQL(suffix)
  conn.execute(query,tuple(row.values()))
 def owner_column(table):return 'student_id' if table=='assignment_results' else 'account_id'
 def count(table,owner,conn=db):return conn.execute(sql.SQL('select count(*) from public.{} where {}=%s').format(sql.Identifier(table),sql.Identifier(owner_column(table))),(owner,)).fetchone()[0]
 def adopt(owner,scope=org,conn=db):
  conn.execute('insert into private.learning_owner_routes(organization_id,account_id) values(%s,%s)',(scope,owner))
 def fence(owner,conn=db):return conn.execute('select id,epoch,live_account_id from private.learning_owner_fences where live_account_id=%s',(owner,)).fetchone()
 def waiting(pid,timeout=4):
  end=time.monotonic()+timeout
  while time.monotonic()<end:
   db.execute('select pg_stat_clear_snapshot()')
   row=db.execute('select wait_event_type from pg_stat_activity where pid=%s',(pid,)).fetchone()
   if row and row[0]=='Lock':return
   time.sleep(.02)
  raise AssertionError('Expected SQL lock wait was not observed')
 def async_sql(conn,statement,args=()):
  try:conn.execute(statement,args);return 'ok'
  except psycopg.Error as e:return e.sqlstate
 def state(owner):
  return {t:[r[0] for r in db.execute(sql.SQL('select to_jsonb(t) from public.{} t where {}=%s order by to_jsonb(t)::text').format(sql.Identifier(t),sql.Identifier(owner_column(t))),(owner,))] for t in TABLES}
 assert db.execute('select count(*) from private.learning_owner_routes').fetchone()[0]==0
 assert db.execute('select epoch from private.learning_owner_barrier where id=1').fetchone()[0]==0
 assert db.execute('select count(*) from accounts').fetchone()[0]==db.execute('select count(*) from private.learning_owner_fences where live_account_id is not null').fetchone()[0]
 passed('Existing and new accounts have private epoch0 fences with zero adopted routes')
 for table in ['learning_owner_fences','learning_owner_routes','learning_owner_barrier']:
  assert db.execute('select relrowsecurity from pg_class where oid=%s::regclass',('private.'+table,)).fetchone()[0]
  for role in ['anon','authenticated','service_role','fixture_unprivileged']:
   for privilege in ['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']:
    assert not db.execute('select has_table_privilege(%s,%s,%s)',(role,'private.'+table,privilege)).fetchone()[0]
 passed('All three private tables enforce RLS and expose no table privileges to client/service roles')
 new_functions=['learning_fence_record_guard','learning_fence_provision','learning_owner_retained','learning_barrier_guard','learning_adoption_relations','learning_owner_route_insert','learning_legacy_owner_guard','learning_legacy_truncate_guard']
 for name in new_functions:
  for role in ['anon','authenticated','service_role','fixture_unprivileged']:
   assert not db.execute('select has_function_privilege(%s,%s,%s)',(role,'private.'+name+'()','EXECUTE')).fetchone()[0]
 passed('No trigger function is a client or service-role adoption API')
 role_owner=account()
 def legacy_acls():return db.execute('select relname,relacl,relrowsecurity from pg_class where oid=any(%s::regclass[]) order by relname',(['public.'+t for t in TABLES],)).fetchall()
 original_acls=legacy_acls()
 privileges=['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']
 actual_privileges={t:{p:db.execute('select has_table_privilege(%s,%s,%s)',('service_role','public.'+t,p)).fetchone()[0] for p in privileges} for t in TABLES}
 assert actual_privileges=={t:{p:t!='lesson_completions' for p in privileges} for t in TABLES}
 passed('Existing six-table service-role privilege profile matches the frozen thin-PostgreSQL grants')
 for table in ['assignment_results','learning_attempts','learning_sessions','mastery_records','review_items']:
  with db.transaction(force_rollback=True):
   db.execute('set local role service_role');insert(table,values(table,role_owner));db.execute('reset role')
   assert count(table,role_owner)==1
  passed('Existing '+table+' service-role INSERT remains allowed without a fixture grant')
 def missing_lesson_grant():
  db.execute('set local role service_role');insert('lesson_completions',values('lesson_completions',role_owner))
 rejected('Existing lesson_completions service-role INSERT remains denied without a fixture grant',missing_lesson_grant,'42501')
 # The first migration grants then-existing tables. lesson_completions is
 # created later with no explicit grant in this thin PG fixture. Do not repair
 # that historical/managed-default difference in production or baseline SQL.
 # Grant only INSERT, inside an explicitly rolled-back synthetic transaction,
 # to prove the private trigger path for a privileged writer on all six tables.
 with db.transaction(force_rollback=True):
  db.execute(sql.SQL('grant insert on {} to service_role').format(sql.SQL(',').join(sql.Identifier('public',t) for t in TABLES)))
  db.execute('set local role service_role')
  for table in TABLES:insert(table,values(table,role_owner))
  db.execute('reset role')
  assert all(count(t,role_owner)==1 for t in TABLES)
 assert legacy_acls()==original_acls and all(count(t,role_owner)==0 for t in TABLES)
 passed('Fixture-granted all-six service-role INSERT uses definer fences and rolls back exact original ACLs')
 for role in ['anon','authenticated','service_role','fixture_unprivileged']:
  def private_adoption(role=role):
   db.execute(sql.SQL('set local role {}').format(sql.Identifier(role)))
   adopt(role_owner)
  rejected(role+' has no direct private adoption authority',private_adoption,'42501')
 for isolation in ['read committed','repeatable read','serializable']:
  owner=account()
  with connect() as conn:
   with conn.transaction():
    conn.execute('set transaction isolation level '+isolation)
    for table in TABLES:
     row=values(table,owner);insert(table,row,conn)
     insert(table,row,conn,'on conflict('+conflict[table]+') do nothing')
     insert(table,row,conn,'on conflict('+conflict[table]+') do update set payload=excluded.payload')
     conn.execute(sql.SQL('update public.{} set payload=payload where {}=%s').format(sql.Identifier(table),sql.Identifier(owner_column(table))),(owner,))
     conn.execute(sql.SQL('delete from public.{} where {}=%s').format(sql.Identifier(table),sql.Identifier(owner_column(table))),(owner,))
  assert all(count(t,owner)==0 for t in TABLES)
  passed('Never-adopted all-six insert/upsert/update/delete retain '+isolation+' compatibility')
 with db.transaction(force_rollback=True):
  for table in TABLES:db.execute(sql.SQL('truncate public.{}').format(sql.Identifier(table)))
 passed('All-six legacy TRUNCATE succeeds and rolls back while adoption count is zero')
 # Both relation-lock orders are tested before any committed adoption. The
 # successful TRUNCATE is rolled back, preserving the original baseline rows.
 with ThreadPoolExecutor(max_workers=1) as pool:
  target=account()
  with connect() as truncator,connect() as adopter:
   truncator.execute('begin');truncator.execute('truncate public.learning_sessions')
   adopter.execute('begin')
   future=pool.submit(async_sql,adopter,'insert into private.learning_owner_routes(organization_id,account_id) values(%s,%s)',(org,target))
   waiting(adopter.info.backend_pid);truncator.execute('rollback')
   assert future.result(timeout=6)=='ok';adopter.execute('rollback')
  assert fence(target)[1]==0 and db.execute('select epoch from private.learning_owner_barrier').fetchone()[0]==0
  passed('TRUNCATE-first relation lock serializes adoption and rollback retains zero routing state')
  target=account()
  with connect() as truncator,connect() as adopter:
   adopter.execute('begin');adopt(target,conn=adopter)
   future=pool.submit(async_sql,truncator,'truncate public.learning_sessions')
   waiting(truncator.info.backend_pid);adopter.execute('commit')
   assert future.result(timeout=6)=='55000'
  passed('Adoption-first relation lock blocks TRUNCATE until the protected route is visible')
 # The singleton's key version also covers accounts and routes absent from a
 # fixed snapshot. Merely scanning the visible owner rows would miss this.
 for isolation in ['repeatable read','serializable']:
  with connect() as stale:
   stale.execute('begin isolation level '+isolation);stale.execute('select epoch from private.learning_owner_barrier')
   target=account();adopt(target)
   try:stale.execute('truncate public.learning_sessions')
   except psycopg.Error as e:assert e.sqlstate=='40001'
   else:raise AssertionError('Stale TRUNCATE missed an invisible newly adopted owner')
   stale.execute('rollback')
  passed('Versioned singleton rejects '+isolation+' TRUNCATE predating creation and adoption')
 owner=account();rows={t:values(t,owner) for t in TABLES}
 for table,row in rows.items():insert(table,row)
 before=state(owner);adopt(owner);assert state(owner)==before and fence(owner)[1]==1
 passed('Synthetic adoption changes private routing only and retains every legacy byte value')
 for table in TABLES:
  rejected('Adopted '+table+' INSERT is denied',lambda table=table:insert(table,rows[table]))
  rejected('Adopted '+table+' duplicate-ignore upsert is denied',lambda table=table:insert(table,rows[table],suffix='on conflict('+conflict[table]+') do nothing'))
  rejected('Adopted '+table+' updating upsert is denied',lambda table=table:insert(table,rows[table],suffix='on conflict('+conflict[table]+') do update set payload=excluded.payload'))
  rejected('Adopted '+table+' UPDATE is denied',lambda table=table:db.execute(sql.SQL('update public.{} set payload=payload where {}=%s').format(sql.Identifier(table),sql.Identifier(owner_column(table))),(owner,)))
  rejected('Adopted '+table+' DELETE is denied',lambda table=table:db.execute(sql.SQL('delete from public.{} where {}=%s').format(sql.Identifier(table),sql.Identifier(owner_column(table))),(owner,)))
  rejected('Adopted '+table+' TRUNCATE is denied',lambda table=table:db.execute(sql.SQL('truncate public.{}').format(sql.Identifier(table))))
 assert state(owner)==before
 receiver=account()
 for table in TABLES:
  rejected('OLD adopted owner cannot move '+table+' to a legacy owner',lambda table=table:db.execute(sql.SQL('update public.{} set {}=%s where {}=%s').format(sql.Identifier(table),sql.Identifier(owner_column(table)),sql.Identifier(owner_column(table))),(receiver,owner)))
  insert(table,values(table,receiver))
  rejected('NEW adopted owner cannot receive '+table+' from a legacy owner',lambda table=table:db.execute(sql.SQL('update public.{} set {}=%s where {}=%s').format(sql.Identifier(table),sql.Identifier(owner_column(table)),sql.Identifier(owner_column(table))),(owner,receiver)))
  baseline=state(receiver)
  rejected('Mixed-owner bulk '+table+' update rolls back every row',lambda table=table:db.execute(sql.SQL("update public.{} set payload=payload || '{{\"changed\":true}}'::jsonb where {}=any(%s)").format(sql.Identifier(table),sql.Identifier(owner_column(table))),([receiver,owner],)))
  assert state(receiver)==baseline
  rejected('Mixed-owner bulk '+table+' delete rolls back every row',lambda table=table:db.execute(sql.SQL('delete from public.{} where {}=any(%s)').format(sql.Identifier(table),sql.Identifier(owner_column(table))),([receiver,owner],)))
  assert state(receiver)==baseline and state(owner)==before
  fresh=account();bulk=[values(table,fresh),values(table,owner)]
  columns=list(bulk[0]);assert list(bulk[1])==columns
  query=sql.SQL('insert into public.{} ({}) values ({}) , ({})').format(sql.Identifier(table),sql.SQL(',').join(map(sql.Identifier,columns)),sql.SQL(',').join(sql.Placeholder() for _ in columns),sql.SQL(',').join(sql.Placeholder() for _ in columns))
  rejected('Mixed-owner bulk '+table+' insert rolls back every row',lambda query=query,bulk=bulk:db.execute(query,tuple(bulk[0].values())+tuple(bulk[1].values())))
  assert count(table,fresh)==0 and state(owner)==before
 for operation in ['update private.learning_owner_routes set epoch=epoch where account_id=%s','delete from private.learning_owner_routes where account_id=%s']:
  rejected('Adopted route is immutable: '+operation.split()[0],lambda operation=operation:db.execute(operation,(owner,)),'23514')
 # PostgreSQL can execute an existing cascade trigger before the new RESTRICT
 # constraint. Both exact boundaries must reject atomically; no timeout passes.
 rejected('Adopted account deletion is restricted',lambda:db.execute('delete from accounts where id=%s',(owner,)),code=('23503','55000','23514'))
 assert state(owner)==before and fence(owner)[1]==1
 rejected('Adopted tenant move is restricted',lambda:db.execute('update accounts set organization_id=%s where id=%s',(other_org,owner)),code='23503')
 moving=account();old_fence=fence(moving)[0];db.execute('update accounts set organization_id=%s where id=%s',(other_org,moving))
 insert('learning_sessions',values('learning_sessions',moving,other_org));adopt(moving,other_org)
 assert fence(moving)[0]==old_fence and db.execute('select organization_id from private.learning_owner_routes where account_id=%s',(moving,)).fetchone()[0]==other_org
 passed('Never-adopted tenant move remains valid and later adoption binds current tenant')
 moved_id=account();old_id_fence=fence(moved_id)[0];replacement_id=uuid.uuid4()
 db.execute('update accounts set id=%s where id=%s',(replacement_id,moved_id))
 assert fence(replacement_id)[0]!=old_id_fence and fence(replacement_id)[1]==0
 assert db.execute('select live_account_id,epoch from private.learning_owner_fences where id=%s',(old_id_fence,)).fetchone()==(None,0)
 passed('Never-adopted empty account ID update retains the old tombstone and provisions a new incarnation')
 disposable=account();old_fence=fence(disposable)[0]
 for table in TABLES:insert(table,values(table,disposable))
 db.execute('delete from accounts where id=%s',(disposable,));assert all(count(t,disposable)==0 for t in TABLES)
 assert db.execute('select live_account_id,epoch from private.learning_owner_fences where id=%s',(old_fence,)).fetchone()==(None,0)
 account(value=disposable);assert fence(disposable)[0]!=old_fence and fence(disposable)[1]==0
 passed('Unadopted deletion cascades retain payload-free tombstone and reused UUID gets a fresh incarnation')
 disposable_org=organization();disposable_owner=account(disposable_org)
 insert('learning_sessions',values('learning_sessions',disposable_owner,disposable_org))
 db.execute('delete from organizations where id=%s',(disposable_org,));assert count('learning_sessions',disposable_owner)==0
 passed('Never-adopted organization deletion keeps existing cascade behavior')

 # An after-row test-only failure proves route, barrier and owner epoch are a
 # single transaction. The temporary trigger and function are rolled back.
 target=account();epoch=db.execute('select epoch from private.learning_owner_barrier').fetchone()[0]
 with db.transaction(force_rollback=True):
  db.execute("create function private.fixture_reject_owner_route() returns trigger language plpgsql as $$begin raise exception 'Synthetic route failure' using errcode='P0001';end$$")
  db.execute('create trigger fixture_reject_owner_route after insert on private.learning_owner_routes for each row execute function private.fixture_reject_owner_route()')
  rejected('Failed route insertion rolls back the epoch and singleton transition',lambda:adopt(target),'P0001')
  assert fence(target)[1]==0 and db.execute('select epoch from private.learning_owner_barrier').fetchone()[0]==epoch
  assert db.execute('select count(*) from private.learning_owner_routes where account_id=%s',(target,)).fetchone()[0]==0
 rejected('Synthetic adoption rejects a foreign tenant',lambda:adopt(target,other_org),'23503')
 rejected('Synthetic adoption rejects a supplied foreign fence',lambda:db.execute('insert into private.learning_owner_routes(organization_id,account_id,fence_id) values(%s,%s,%s)',(org,target,fence(owner)[0])),'23514')
 epoch=db.execute('select epoch from private.learning_owner_barrier').fetchone()[0]
 db.execute('insert into private.learning_owner_routes(organization_id,account_id) values(%s,%s) on conflict(account_id) do nothing',(org,owner))
 assert db.execute('select epoch from private.learning_owner_barrier').fetchone()[0]==epoch and state(owner)==before
 passed('Exact synthetic adoption duplicate-ignore does not change the retained route or epoch')
 with db.transaction(force_rollback=True):
  db.execute(sql.SQL('grant insert on {} to service_role').format(sql.SQL(',').join(sql.Identifier('public',t) for t in TABLES)))
  db.execute('set local role service_role')
  for table in TABLES:
   rejected('Adopted '+table+' fixture-granted service-role writer remains fenced',lambda table=table:insert(table,rows[table]))
  db.execute('reset role')
 assert legacy_acls()==original_acls and state(owner)==before
 passed('Fixture-granted adopted-writer tests restore exact original ACLs and retained owner rows')
 with db.transaction(force_rollback=True):
  # Corruption vector uses a trusted fixture-only trigger disable, never a
  # runtime API. Both changes are rolled back and cannot enter the candidate.
  db.execute('alter table private.learning_owner_fences disable trigger learning_fence_record_guard')
  db.execute('delete from private.learning_owner_fences where live_account_id=%s',(target,))
  db.execute('alter table private.learning_owner_fences enable trigger learning_fence_record_guard')
  rejected('Missing current companion fails closed for ordinary read committed writes',lambda:insert('learning_sessions',values('learning_sessions',target)),'55000')
 assert fence(target)[1]==0
 untrusted=values('mastery_records',target);untrusted['source']='legacy'
 rejected('Original server mastery authority rejects a legacy claim for an unadopted owner',lambda:insert('mastery_records',untrusted),'P0001')

 # Actual concurrent connections. Waiting is established from PostgreSQL locks,
 # not inferred from an arbitrary delay. Each future has a bounded timeout.
 with ThreadPoolExecutor(max_workers=2) as pool:
  target=account()
  with connect() as one,connect() as two:
   one.execute('begin');insert('learning_sessions',values('learning_sessions',target),one)
   def parallel_insert():
    try:insert('learning_sessions',values('learning_sessions',target),two);return 'ok'
    except psycopg.Error as e:return e.sqlstate
   assert pool.submit(parallel_insert).result(timeout=4)=='ok';one.execute('commit')
  assert count('learning_sessions',target)==2
  passed('Two different legacy records for one unadopted owner retain shared-lock concurrency')
  for isolation in ['read committed','repeatable read','serializable']:
   target=account()
   with connect() as legacy,connect() as adopter:
    legacy.execute('begin isolation level '+isolation);insert('learning_sessions',values('learning_sessions',target),legacy)
    future=pool.submit(async_sql,adopter,'insert into private.learning_owner_routes(organization_id,account_id) values(%s,%s)',(org,target));waiting(adopter.info.backend_pid)
    legacy.execute('commit');assert future.result(timeout=6)=='ok' and count('learning_sessions',target)==1
   passed('Legacy-first '+isolation+' owner lock completes before adoption')
   target=account()
   with connect() as legacy,connect() as adopter:
    legacy.execute('begin isolation level '+isolation);legacy.execute('select count(*) from accounts')
    adopter.execute('begin');adopt(target,conn=adopter)
    row=values('learning_sessions',target)
    def late_insert():
     try:insert('learning_sessions',row,legacy);return 'ok'
     except psycopg.Error as e:return e.sqlstate
    future=pool.submit(late_insert);waiting(legacy.info.backend_pid);adopter.execute('commit')
    assert future.result(timeout=6)==('55000' if isolation=='read committed' else '40001');legacy.execute('rollback')
   assert count('learning_sessions',target)==0
   passed('Adoption-first '+isolation+' blocks or serializes the stale legacy writer')
  # Inspect lock-mode behavior directly: non-key SET NULL must proceed while
  # a legacy key-share fence lock is held; epoch's unique key must conflict.
  target=account();fid=fence(target)[0]
  with connect() as holder,connect() as remover:
   holder.execute('begin');holder.execute('select id from private.learning_owner_fences where id=%s for key share',(fid,))
   future=pool.submit(async_sql,remover,'delete from accounts where id=%s',(target,))
   assert future.result(timeout=4)=='ok';holder.execute('commit')
  assert db.execute('select live_account_id from private.learning_owner_fences where id=%s',(fid,)).fetchone()[0] is None
  passed('Actual FK SET NULL is a non-key update compatible with an outstanding legacy key-share lock')
  target=account()
  with connect() as legacy,connect() as deleter:
   legacy.execute('begin');insert('learning_sessions',values('learning_sessions',target),legacy)
   future=pool.submit(async_sql,deleter,'delete from accounts where id=%s',(target,))
   waiting(deleter.info.backend_pid);legacy.execute('commit');assert future.result(timeout=6)=='ok'
  assert count('learning_sessions',target)==0
  passed('Legacy INSERT-first completes before parent deletion and original cascade removes its row')
  target=account()
  with connect() as deleter,connect() as legacy:
   deleter.execute('begin');deleter.execute('delete from accounts where id=%s',(target,))
   row=values('learning_sessions',target)
   def late_deleted_insert():
    try:insert('learning_sessions',row,legacy);return 'ok'
    except psycopg.Error as e:return e.sqlstate
   future=pool.submit(late_deleted_insert)
   # Prove overlap before commit. The only permitted early completion is a
   # fail-closed missing-fence rejection; success must wait for the parent FK.
   end=time.monotonic()+4;observed=False
   while time.monotonic()<end:
    db.execute('select pg_stat_clear_snapshot()')
    event=db.execute('select wait_event_type from pg_stat_activity where pid=%s',(legacy.info.backend_pid,)).fetchone()
    if event and event[0]=='Lock':observed=True;break
    if future.done():assert future.result()=='55000';observed=True;break
    time.sleep(.02)
   assert observed,'Concurrent parent-delete overlap was not observed'
   deleter.execute('commit');assert future.result(timeout=6) in ('23503','55000')
  assert count('learning_sessions',target)==0
  passed('Parent deletion and a late legacy INSERT cannot deadlock or resurrect the deleted owner')

 # Fixed snapshots predating provisioning may not infer legacy from absence.
 target=uuid.uuid4()
 with connect() as stale:
  stale.execute('begin isolation level repeatable read');stale.execute('select count(*) from private.learning_owner_fences');account(value=target)
  try:insert('learning_sessions',values('learning_sessions',target),stale)
  except psycopg.Error as e:assert e.sqlstate=='55000'
  else:raise AssertionError('Invisible fence was treated as legacy')
  stale.execute('rollback')
 passed('A missing fence in an older fixed snapshot fails closed instead of implying nonadoption')
 assert not db.execute("select exists(select 1 from information_schema.columns where table_schema='private' and table_name like 'learning_owner_%' and column_name in ('payload','name','token','token_hash','response'))").fetchone()[0]
 passed('Private owner metadata contains no learning payload, name, response or session token')
