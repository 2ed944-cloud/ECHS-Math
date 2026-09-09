#!/usr/bin/env python3
"""Execute 26 migrations and C09 real PostgreSQL15 authorization/atomicity tests.

Explicit disposable loopback database only. No production calls or credentials.
Existing public rows and table grants are retained; only the two new RPC grants
are intentionally added. Synthetic state and table triggers are fixture-only.
"""
import argparse,hashlib,json,os,time,uuid
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
NEW='202609090002_membership_authorization.sql'
CAP={'contract':'echs.membership.v1','atomic_replacement':True,'tenant_scoped':True}
def main():
    p=argparse.ArgumentParser();p.add_argument('--repo-root',type=Path,default=Path(__file__).resolve().parents[1]);p.add_argument('--legacy-root',type=Path);p.add_argument('--report',type=Path,default=Path('reports/membership-authorization-database.json'));p.add_argument('--static-only',action='store_true');args=p.parse_args()
    root=args.repo_root.resolve();legacy=(args.legacy_root or root).resolve();paths=sorted(x for x in (legacy/'supabase/migrations').glob('*.sql') if x.name<NEW);assert len(paths)==25
    new=root/'supabase/migrations'/NEW;paths.append(new);source=new.read_text(encoding='utf-8')
    report={'status':'RUNNING; NOT PASS','contract':'echs.membership-database-tests.v1','production_calls':0,'postgres_required':15,'migration_count':26,'migrations':[{'file':x.name,'sha256':hashlib.sha256(x.read_bytes()).hexdigest()} for x in paths],'checks':[]}
    def save():args.report.parent.mkdir(parents=True,exist_ok=True);args.report.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    def passed(label):report['checks'].append(label);print('PASS '+label,flush=True);save()
    try:
        assert source.count('create function public.')==2 and 'create table' not in source.lower() and 'alter table' not in source.lower()
        assert 'p_token_hash text,p_class_id uuid,p_student_ids uuid[],p_teacher_ids uuid[]' in source
        passed('exact25 prior migrations plus additive26 RPC-only membership input')
        if args.static_only:report['status']='STATIC INPUTS PASS; DATABASE NOT RUN';save();return
        import psycopg
        from psycopg import sql
        from psycopg.conninfo import conninfo_to_dict
        dsn=os.environ.get('ECHS_MEMBERSHIP_TEST_DSN','');assert dsn
        info=conninfo_to_dict(dsn);assert info.get('host') in ('127.0.0.1','localhost','::1') and info.get('dbname','').startswith('echs_membership_test') and not info.get('hostaddr') and not info.get('service')
        def connect():
            db=psycopg.connect(dsn,hostaddr='::1' if info['host']=='::1' else '127.0.0.1',autocommit=True);db.execute("set statement_timeout='12s'");return db
        with connect() as db:
            assert int(db.execute('show server_version_num').fetchone()[0])//10000==15;report['postgres_version']=db.execute('show server_version').fetchone()[0]
            assert db.execute('select current_database()').fetchone()[0].startswith('echs_membership_test')
            assert db.execute("select count(*) from pg_tables where schemaname='public'").fetchone()[0]==0,'Refusing nonempty database'
            db.execute("""
              create role anon nologin noinherit nobypassrls;
              create role authenticated nologin noinherit nobypassrls;
              create role service_role nologin noinherit bypassrls;
              create role fixture_unprivileged nologin noinherit nobypassrls;
              create schema storage;create schema extensions;create extension pgcrypto with schema extensions;
              create table storage.buckets(id text primary key,name text not null,public boolean not null default false,file_size_limit bigint,allowed_mime_types text[]);
              create table storage.objects(id uuid primary key default extensions.gen_random_uuid(),bucket_id text references storage.buckets(id),name text,owner uuid,metadata jsonb);
              grant usage on schema public,storage,extensions to anon,authenticated,service_role,fixture_unprivileged;
              set search_path=public,extensions;
            """)
            for path in paths[:-1]:db.execute(path.read_text(encoding='utf-8'),prepare=False)
            passed('all25 existing migrations executed on real PostgreSQL15')
            names=['org','foreign_org','admin','foreign_admin','teacher','other_teacher','unassigned_teacher','student','second_student','third_student','inactive_student','parent','foreign_teacher','foreign_student','class','second_class','foreign_class','archived_class']
            ids={name:uuid.uuid4() for name in names};nonce=uuid.uuid4().hex;tokens={}
            for name in ['org','foreign_org']:db.execute('insert into organizations(id,name,slug) values(%s,%s,%s)',(ids[name],'C09 synthetic organization','c09-'+name+'-'+nonce))
            for name in names:
                if name in ['org','foreign_org'] or name.endswith('class'):continue
                role='admin' if 'admin' in name else 'teacher' if 'teacher' in name else 'student' if 'student' in name else 'parent'
                org=ids['foreign_org'] if name.startswith('foreign') else ids['org'];status='suspended' if name=='inactive_student' else 'active'
                db.execute('insert into accounts(id,organization_id,username,display_name,role,status) values(%s,%s,%s,%s,%s,%s)',(ids[name],org,'c09-'+name+'-'+nonce,'C09 synthetic '+name,role,status))
                token=hashlib.sha256((name+'-'+nonce).encode()).hexdigest();tokens[name]=token
                db.execute("select public.api_create_session(%s,%s,now()+interval '1 hour','fixture','loopback')",(ids[name],token))
            for name in ['class','second_class','foreign_class','archived_class']:
                foreign=name=='foreign_class';db.execute("insert into classes(id,organization_id,name,course_key,status,created_by) values(%s,%s,'C09 synthetic class','ap-calculus',%s,%s)",(ids[name],ids['foreign_org'] if foreign else ids['org'],'archived' if name=='archived_class' else 'active',ids['foreign_admin'] if foreign else ids['admin']))
            def seed_roster(cls='class'):
                db.execute('delete from class_memberships where class_id=%s',(ids[cls],))
                for who,role in [('teacher','teacher'),('other_teacher','teacher'),('student','student')]:db.execute('insert into class_memberships(class_id,account_id,membership_role) values(%s,%s,%s)',(ids[cls],ids[who],role))
            seed_roster();seed_roster('archived_class')
            db.execute("insert into learning_attempts(organization_id,account_id,client_event_id,question_id,correct,occurred_at,course,payload) values(%s,%s,'c09-preserved','c09-synthetic',false,now(),'ap-calculus','{}')",(ids['org'],ids['student']))
            def public_rows():
                return {t:sorted(json.dumps(row[0],sort_keys=True,default=str) for row in db.execute(sql.SQL('select to_jsonb(t) from public.{} t').format(sql.Identifier(t)))) for t, in db.execute("select tablename from pg_tables where schemaname='public' order by tablename")}
            before=public_rows();grants=db.execute("select oid,relacl from pg_class where oid='public.class_memberships'::regclass").fetchone();old_caps=db.execute('select public.lesson_content_capabilities(),public.lesson_media_capabilities(),public.lesson_recovery_capabilities()').fetchone()
            db.execute(source,prepare=False)
            assert public_rows()==before and db.execute("select oid,relacl from pg_class where oid='public.class_memberships'::regclass").fetchone()==grants
            assert db.execute('select public.lesson_content_capabilities(),public.lesson_media_capabilities(),public.lesson_recovery_capabilities()').fetchone()==old_caps
            passed('migration26 preserves every public row, existing membership table grants and lesson capabilities')
            def rpc(actor,students=(),teachers=(),cls='class',conn=db):
                with conn.transaction():
                    conn.execute('set local role service_role')
                    result=conn.execute('select public.api_replace_class_memberships(%s,%s,%s,%s)',(tokens.get(actor,actor),ids.get(cls,cls),[ids.get(x,x) for x in students] if students is not None else None,[ids.get(x,x) for x in teachers] if teachers is not None else None)).fetchone()[0]
                    conn.execute('reset role');return result
            def roster(cls='class'):
                return db.execute('select account_id,membership_role,joined_at from class_memberships where class_id=%s order by account_id',(ids[cls],)).fetchall()
            def denied(actor,students=(),teachers=(),cls='class',code='42501'):
                prior=roster(cls) if cls in ids else roster()
                try:rpc(actor,students,teachers,cls)
                except psycopg.Error as error:assert error.sqlstate==code,(error.sqlstate,code)
                else:raise AssertionError('Unauthorized membership replacement succeeded')
                assert (roster(cls) if cls in ids else roster())==prior
            for role in ['anon','authenticated','fixture_unprivileged']:
                for statement in ['select public.api_membership_capabilities()',"select public.api_replace_class_memberships(null,null,'{}','{}')"]:
                    try:
                        with db.transaction():db.execute(sql.SQL('set local role {}').format(sql.Identifier(role)));db.execute(statement)
                    except psycopg.Error as error:assert error.sqlstate=='42501'
                    else:raise AssertionError('RPC grant widened')
                    passed(role+' denied '+statement.split('public.')[1].split('(')[0])
            with db.transaction():db.execute('set local role service_role');assert db.execute('select public.api_membership_capabilities()').fetchone()[0]==CAP
            passed('service-only data-free capability confirms supported private RPC grants')
            for role in ['anon','authenticated','public']:
                with db.transaction(force_rollback=True):db.execute(sql.SQL('grant execute on function public.api_replace_class_memberships(text,uuid,uuid[],uuid[]) to {}').format(sql.SQL(role)));assert db.execute('select public.api_membership_capabilities()').fetchone()[0] is None
                passed('capability fails closed when replacement execute is widened to '+role)
            for actor in ['missing','',None,'inactive_student']:
                denied(actor,code='28000');passed('invalid/inactive session denied without roster mutation: '+str(actor))
            for actor in ['student','parent','unassigned_teacher','foreign_admin','foreign_teacher']:
                denied(actor);passed('unauthorized role/class/tenant denied without roster mutation: '+actor)
            for target in ['foreign_student','parent','other_teacher','inactive_student',str(uuid.uuid4())]:
                denied('teacher',[target]);passed('student target org/role/activity/existence rejected atomically: '+('unknown' if target not in ids else target))
            for target in ['foreign_teacher','parent','student']:
                denied('teacher',[],[target]);passed('teacher target org/role rejected atomically: '+target)
            for students,teachers in [(None,[]),([],None),([None],[]),(['student'],['student'])]:
                denied('admin',students,teachers,code='22023');passed('invalid null/overlapping member arrays rejected atomically')
            denied('admin',['student']*10001,code='22023')
            prior=roster()
            try:
                with db.transaction():
                    db.execute('set local role service_role')
                    db.execute('select public.api_replace_class_memberships(%s,%s,%s,%s)',(tokens['admin'],ids['class'],[[ids['student']]],[]))
            except psycopg.Error as error:assert error.sqlstate=='22023'
            else:raise AssertionError('Two-dimensional membership array was accepted')
            assert roster()==prior
            passed('oversized and multidimensional member arrays are rejected before replacement')
            # Intentionally malformed fixture rows demonstrate schema-permitted
            # inherited state; the new RPC must not use them as tenant authority.
            db.execute("insert into class_memberships values(%s,%s,'teacher',now())",(ids['foreign_class'],ids['teacher']))
            denied('teacher',cls='foreign_class');passed('foreign class membership cannot grant tenant access')
            db.execute("insert into class_memberships values(%s,%s,'teacher',now())",(ids['second_class'],ids['parent']))
            denied('parent',cls='second_class');passed('parent mislabeled as teacher cannot acquire staff authority')
            result=rpc('teacher',['second_student','second_student'],['teacher','teacher']);assert result=={'ok':True,'contract':CAP['contract'],'class_id':str(ids['class']),'members':2}
            prior=roster();assert rpc('teacher',['second_student'],[])==result and roster()==prior
            passed('teacher self retention, deduplication and no-op retries preserve exact joined timestamps')
            result=rpc('admin');assert result['members']==0 and roster()==[]
            passed('administrator can explicitly set an empty roster without a forced teacher membership')
            assert rpc('admin',['student'],['teacher'])['members']==2
            denied('teacher',['student'],[],'archived_class')
            denied('admin',['student'],[],'archived_class')
            passed('valid administrator/teacher access remains; archived-class roster mutations fail closed')
            # Trigger is fixture-only and rolls back on exit. A failure occurs
            # after the differential DELETE and proves full transactional rollback.
            with db.transaction(force_rollback=True):
                db.execute(sql.SQL("create function private.c09_fixture_fail() returns trigger language plpgsql as $$begin if new.account_id={}::uuid then raise exception 'Synthetic insert failure' using errcode='23514';end if;return new;end$$").format(sql.Literal(str(ids['third_student']))))
                db.execute('create trigger c09_fixture_failure before insert on class_memberships for each row execute function private.c09_fixture_fail()')
                prior=roster()
                try:rpc('teacher',['third_student'])
                except psycopg.Error as error:assert error.sqlstate=='23514'
                else:raise AssertionError('Fixture insert failure was ignored')
                assert roster()==prior
            passed('actual insert failure rolls back all removals and preserves the prior roster byte values')
            with db.transaction(force_rollback=True):
                db.execute(sql.SQL("create function private.c09_fixture_skip() returns trigger language plpgsql as $$begin if new.account_id={}::uuid then return null;end if;return new;end$$").format(sql.Literal(str(ids['third_student']))))
                db.execute('create trigger c09_fixture_skipped_insert before insert on class_memberships for each row execute function private.c09_fixture_skip()')
                prior=roster()
                try:rpc('teacher',['third_student'])
                except psycopg.Error as error:assert error.sqlstate=='23514'
                else:raise AssertionError('Incomplete replacement was acknowledged as successful')
                assert roster()==prior
            passed('silently skipped insert fails final roster verification and rolls back prior deletions')
            # Waiting helper observes the actual PostgreSQL lock state instead of
            # assuming that elapsed time means the second connection started.
            def wait_for_lock(pid):
                deadline=time.monotonic()+5
                while time.monotonic()<deadline:
                    row=db.execute('select wait_event_type from pg_stat_activity where pid=%s',(pid,)).fetchone()
                    if row and row[0]=='Lock':return
                    time.sleep(.025)
                raise AssertionError('Expected database lock wait not observed')
            for field,value,expected in [('status','suspended','28000'),('role','parent','42501'),('organization_id',ids['foreign_org'],'42501'),('revoked_at',True,'28000')]:
                seed_roster();prior=roster()
                with connect() as locker,connect() as worker,ThreadPoolExecutor(max_workers=1) as pool:
                    locker.execute('begin')
                    # Same account->session order as the real suspension flow.
                    if field=='revoked_at':
                        locker.execute('select id from accounts where id=%s for update',(ids['teacher'],));locker.execute('update private.sessions set revoked_at=now() where token_hash=%s',(tokens['teacher'],))
                    else:locker.execute(sql.SQL('update accounts set {}=%s where id=%s').format(sql.Identifier(field)),(value,ids['teacher']))
                    future=pool.submit(rpc,'teacher',['second_student'],[],'class',worker);wait_for_lock(worker.info.backend_pid);locker.execute('commit')
                    try:future.result(timeout=6)
                    except psycopg.Error as error:assert error.sqlstate==expected
                    else:raise AssertionError('Concurrent actor/session mutation was not revalidated')
                assert roster()==prior;db.execute("update accounts set status='active',role='teacher',organization_id=%s where id=%s",(ids['org'],ids['teacher']));db.execute('update private.sessions set revoked_at=null where token_hash=%s',(tokens['teacher'],))
                passed('concurrent actor/session '+field+' change is revalidated without deadlock or partial roster')
            for field,value in [('status','archived'),('organization_id',ids['foreign_org'])]:
                seed_roster();prior=roster()
                with connect() as locker,connect() as worker,ThreadPoolExecutor(max_workers=1) as pool:
                    locker.execute('begin');locker.execute(sql.SQL('update classes set {}=%s where id=%s').format(sql.Identifier(field)),(value,ids['class']))
                    future=pool.submit(rpc,'teacher',['second_student'],[],'class',worker);wait_for_lock(worker.info.backend_pid);locker.execute('commit')
                    try:future.result(timeout=6)
                    except psycopg.Error as error:assert error.sqlstate=='42501'
                    else:raise AssertionError('Concurrent class mutation was not revalidated')
                assert roster()==prior;db.execute("update classes set status='active',organization_id=%s where id=%s",(ids['org'],ids['class']))
                passed('concurrent class '+field+' change fails closed after its lock wait')
            for field,value in [('status','suspended'),('role','parent'),('organization_id',ids['foreign_org'])]:
                seed_roster();prior=roster()
                with connect() as locker,connect() as worker,ThreadPoolExecutor(max_workers=1) as pool:
                    locker.execute('begin');locker.execute(sql.SQL('update accounts set {}=%s where id=%s').format(sql.Identifier(field)),(value,ids['second_student']))
                    future=pool.submit(rpc,'teacher',['second_student'],[],'class',worker);wait_for_lock(worker.info.backend_pid);locker.execute('commit')
                    try:future.result(timeout=6)
                    except psycopg.Error as error:assert error.sqlstate=='42501'
                    else:raise AssertionError('Concurrent target mutation was not revalidated')
                assert roster()==prior;db.execute("update accounts set status='active',role='student',organization_id=%s where id=%s",(ids['org'],ids['second_student']))
                passed('concurrent requested account '+field+' change rejects after waiting and preserves roster')
            seed_roster();prior=roster()
            with connect() as locker,connect() as worker,ThreadPoolExecutor(max_workers=1) as pool:
                db.execute("update private.sessions set expires_at=clock_timestamp()+interval '2 seconds' where token_hash=%s",(tokens['teacher'],))
                locker.execute('begin');locker.execute('select id from classes where id=%s for update',(ids['class'],))
                future=pool.submit(rpc,'teacher',['second_student'],[],'class',worker);wait_for_lock(worker.info.backend_pid)
                remaining=db.execute('select greatest(0,extract(epoch from expires_at-clock_timestamp())) from private.sessions where token_hash=%s',(tokens['teacher'],)).fetchone()[0];time.sleep(float(remaining)+.1);locker.execute('commit')
                try:future.result(timeout=6)
                except psycopg.Error as error:assert error.sqlstate=='28000'
                else:raise AssertionError('Expired waiting session succeeded')
            assert roster()==prior;db.execute("update private.sessions set expires_at=now()+interval '1 hour' where token_hash=%s",(tokens['teacher'],))
            passed('session expiry while waiting for class lock rolls back without changing roster')
            db.execute('update private.sessions set revoked_at=now() where token_hash=%s',(tokens['other_teacher'],));denied('other_teacher',code='28000')
            passed('revoked current session cannot use a retained teacher membership')
            with connect() as a,connect() as b,ThreadPoolExecutor(max_workers=2) as pool:
                jobs=[pool.submit(rpc,'teacher',['second_student'],[],'class',a),pool.submit(rpc,'admin',['third_student'],['teacher'],'class',b)];results=[f.result(timeout=8) for f in jobs]
            assert all(r['members']==2 for r in results)
            assert {(str(x[0]),x[1]) for x in roster()} in [{(str(ids['teacher']),'teacher'),(str(ids['second_student']),'student')},{(str(ids['teacher']),'teacher'),(str(ids['third_student']),'student')}]
            passed('concurrent valid replacements serialize to one exact complete roster')
            assert db.execute("select correct from learning_attempts where client_event_id='c09-preserved'").fetchone()[0] is False
            passed('legacy learning evidence and numeric grading data remain unchanged')
            report['status']='PASS';report['limits']=['Isolated PostgreSQL15 only; no production fixtures or data.','Existing membership table grants and other membership-writing APIs are unchanged. New RPC atomicity does not assert control over a trusted direct service-role/database administrator.','Historical same-org inactive student reports are preserved; roster mutations require an active class and active target accounts.'];save()
    except Exception as error:
        report['status']='FAIL';report['error']={'type':type(error).__name__,'sqlstate':getattr(error,'sqlstate',None),'message':str(error)[:500] if isinstance(error,AssertionError) else 'See sanitized SQL state and failing check position'};save();raise
if __name__=='__main__':main()
