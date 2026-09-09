#!/usr/bin/env python3
"""Actual isolated PostgreSQL25 recovery grants, key scope and lock regressions.

Existing 235+203+171 database checks must have passed first. No key values are
logged or written to the report; no production database or credentials allowed.
"""
import argparse,base64,copy,hashlib,json,os,time,uuid
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
NEW='202609090001_lesson_draft_recovery.sql'
def main():
    p=argparse.ArgumentParser();p.add_argument('--repo-root',type=Path,default=Path(__file__).resolve().parents[1]);p.add_argument('--baseline-report',type=Path,default=Path('reports/lesson-media-database.json'));p.add_argument('--report',type=Path,default=Path('reports/lesson-recovery-database.json'));p.add_argument('--static-only',action='store_true');args=p.parse_args();root=args.repo_root.resolve()
    report={'status':'RUNNING; NOT PASS','production_calls':False,'postgres_required':15,'checks':[]}
    def save():args.report.parent.mkdir(parents=True,exist_ok=True);args.report.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    def passed(label):report['checks'].append(label);print('PASS '+label,flush=True);save()
    try:
        paths=sorted(x for x in (root/'supabase/migrations').glob('*.sql') if x.name<=NEW);assert len(paths)==25 and paths[-1].name==NEW
        report['migration_count']=25;report['migrations']=[{'file':x.name,'sha256':hashlib.sha256(x.read_bytes()).hexdigest()} for x in paths]
        source=paths[-1].read_text();assert 'create or replace' not in source.lower() and 'alter table public.' not in source.lower()
        assert source.count('create function public.')==2 and 'key_material bytea not null check(octet_length(key_material)=32)' in source
        passed('migration25 is additive; existing lesson/media functions and schemas are preserved')
        if args.static_only:report['status']='STATIC INPUTS PASS; DATABASE NOT RUN';save();return
        import psycopg
        from psycopg import sql
        from psycopg.conninfo import conninfo_to_dict
        from psycopg.types.json import Jsonb
        baseline=json.loads(args.baseline_report.read_text());assert baseline['status']=='PASS' and baseline['migration_count']==24 and len(baseline['checks'])==171 and baseline['migrations']==report['migrations'][:-1]
        dsn=os.environ.get('ECHS_LESSON_TEST_DSN','');assert dsn
        info=conninfo_to_dict(dsn);assert info.get('host') in ('127.0.0.1','localhost','::1') and info.get('dbname','').startswith('echs_lesson_test') and not info.get('hostaddr') and not info.get('service')
        def connect():
            db=psycopg.connect(dsn,hostaddr='::1' if info['host']=='::1' else '127.0.0.1',autocommit=True);db.execute("set statement_timeout='10s'");return db
        with connect() as conn:
            assert int(conn.execute('show server_version_num').fetchone()[0])//10000==15;report['postgres_version']=conn.execute('show server_version').fetchone()[0]
            assert conn.execute('select current_database()').fetchone()[0].startswith('echs_lesson_test')
            assert conn.execute("select to_regprocedure('public.lesson_recovery_capabilities()')").fetchone()[0] is None
            def snapshot():
                tables=[x[0] for x in conn.execute("select tablename from pg_tables where schemaname='public' order by tablename")]
                return {t:sorted(json.dumps(x[0],sort_keys=True,default=str) for x in conn.execute(sql.SQL('select to_jsonb(t) from public.{} t').format(sql.Identifier(t)))) for t in tables}
            before=snapshot();cap_before=conn.execute('select public.lesson_content_capabilities(),public.lesson_media_capabilities()').fetchone()
            conn.execute(source,prepare=False);assert snapshot()==before;assert conn.execute('select public.lesson_content_capabilities(),public.lesson_media_capabilities()').fetchone()==cap_before
            passed('migration25 preserves every existing public row, original authoring capability and media readiness')
            def code(statement,params=(),role=None):
                try:
                    with conn.transaction():
                        if role:conn.execute(sql.SQL('set local role {}').format(sql.Identifier(role)))
                        conn.execute(statement,params)
                        if role:conn.execute('reset role')
                    return None
                except psycopg.Error as exc:return exc.sqlstate
            cap={'contract':'echs.lesson.recovery.v1','cipher':'AES-256-GCM','checkpoint_version':1,'max_plaintext_bytes':4194304}
            for role in ('anon','authenticated','service_role','fixture_unprivileged'):
                for statement in ('select * from private.lesson_draft_recovery_keys','insert into private.lesson_draft_recovery_keys default values','update private.lesson_draft_recovery_keys set key_id=key_id','delete from private.lesson_draft_recovery_keys','truncate private.lesson_draft_recovery_keys'):
                    assert code(statement,role=role)=='42501';passed(role+' denied direct '+statement.split()[0]+' recovery keys')
                assert code('select private.lesson_recovery_random_key()',role=role)=='42501';passed(role+' denied private random material helper')
                if role!='service_role':
                    for statement in ("select public.lesson_draft_recovery_key(null,'{}')",'select public.lesson_recovery_capabilities()'):
                        assert code(statement,role=role)=='42501';passed(role+' denied '+statement.split('public.')[1].split('(')[0])
            with conn.transaction():
                conn.execute('set local role service_role');assert conn.execute('select public.lesson_recovery_capabilities()').fetchone()[0]==cap
            assert conn.execute('select count(*) from private.lesson_draft_recovery_keys').fetchone()[0]==0
            passed('service-only data-free health proves random32 support without generating a durable key record')
            for change in ('alter table private.lesson_draft_recovery_keys disable row level security','grant select on private.lesson_draft_recovery_keys to service_role','grant select(key_material) on private.lesson_draft_recovery_keys to authenticated'):
                with conn.transaction(force_rollback=True):conn.execute(change);assert conn.execute('select public.lesson_recovery_capabilities()').fetchone()[0] is None
                passed('capability fails closed on '+change.split(' on ')[0])
            names=('org','foreign_org','class','second_class','foreign_class','admin','teacher','reviewer','student','parent','foreign_teacher','unassigned_teacher')
            ids={name:uuid.uuid4() for name in names};nonce=uuid.uuid4().hex
            tokens={name:hashlib.sha256(('recovery-'+name+'-'+nonce).encode()).hexdigest() for name in names if name not in ('org','foreign_org','class','second_class','foreign_class')}
            for name in ('org','foreign_org'):conn.execute('insert into organizations(id,name,slug) values(%s,%s,%s)',(ids[name],'Original recovery fixture','recovery-'+name+'-'+nonce))
            for name,token in tokens.items():
                org=ids['foreign_org'] if name=='foreign_teacher' else ids['org'];role='teacher' if 'teacher' in name or name=='reviewer' else name
                conn.execute("insert into accounts(id,organization_id,username,display_name,role,status) values(%s,%s,%s,%s,%s,'active')",(ids[name],org,'recovery-'+name+'-'+nonce,name,role));conn.execute("select public.api_create_session(%s,%s,now()+interval '1 hour','fixture','loopback')",(ids[name],token))
            for name in ('class','second_class','foreign_class'):
                foreign=name=='foreign_class';conn.execute("insert into classes(id,organization_id,name,course_key,status,created_by) values(%s,%s,'Original recovery class','ap-calculus','active',%s)",(ids[name],ids['foreign_org'] if foreign else ids['org'],ids['foreign_teacher'] if foreign else ids['admin']))
            for cls in ('class','second_class'):
                for name in ('teacher','reviewer','student'):conn.execute('insert into class_memberships(class_id,account_id,membership_role) values(%s,%s,%s)',(ids[cls],ids[name],'student' if name=='student' else 'teacher'))
            conn.execute("insert into class_memberships(class_id,account_id,membership_role) values(%s,%s,'teacher')",(ids['class'],ids['foreign_teacher']))
            conn.execute("insert into lesson_catalog(organization_id,access_key,course_key,unit_index,unit_title,topic,title,position,url,is_ready) values(%s,'ap-calculus::0::1.7','ap-calculus',0,'Unit 1','1.7','Original recovery',0,'lessons/ap-calculus/unit-1/1-7-selecting-limit-procedures.html',true)",(ids['org'],))
            course=conn.execute("select id from course_versions where course_code='ap-calculus-ab' and status='active' and not is_placeholder").fetchall();assert len(course)==1;course_id=str(course[0][0])
            def rpc(actor,action,payload,db=conn):
                with db.transaction():
                    db.execute('set local role service_role')
                    query='select public.lesson_draft_recovery_key(%s,%s)' if action=='key' else 'select public.lesson_store(%s,%s,%s)'
                    params=(tokens.get(actor,actor),Jsonb(payload)) if action=='key' else (tokens.get(actor,actor),action,Jsonb(payload))
                    value=db.execute(query,params).fetchone()[0];db.execute('reset role');return value
            def denied(actor,payload,expected):
                try:rpc(actor,'key',payload)
                except psycopg.Error as exc:assert exc.sqlstate==expected;return
                raise AssertionError('Recovery key authorization unexpectedly succeeded')
            def create(cls):
                rpc('admin','pin_course',{'class_id':str(ids[cls]),'course_version_id':course_id,'expected_assignment_id':None,'reason':'Explicit recovery fixture'})
                doc=json.loads((root/'tools/lesson-runtime/fixtures/published-original.lesson.json').read_text());doc.update(lesson_id=str(uuid.uuid4()),course_version_id=course_id,unit_id='legacy:ap-calculus:unit:1',topic_id='legacy:ap-calculus:topic:1.7',document_version=1);doc['publication']={'status':'draft','audience':'institutional','revision':1}
                return rpc('teacher','create',{'class_id':str(ids[cls]),'course_version_id':course_id,'access_key':'ap-calculus::0::1.7','document':doc,'private_notes':'PRIVATE_RECOVERY_CANARY','expected_revision':0})
            record=create('class');second=create('second_class');lesson=record['lesson']['id'];payload={'lesson_id':lesson}
            initial=rpc('teacher','key',payload);again=rpc('teacher','key',payload)
            assert set(initial)=={'ok','contract','account_id','organization_id','class_id','lesson_id','key_id','key_base64'} and initial==again
            assert initial['contract']==cap['contract'] and initial['account_id']==str(ids['teacher']) and initial['organization_id']==str(ids['org']) and initial['class_id']==str(ids['class']) and initial['lesson_id']==lesson
            assert len(base64.b64decode(initial['key_base64'],validate=True))==32 and base64.b64encode(base64.b64decode(initial['key_base64'])).decode()==initial['key_base64']
            assert rpc('teacher','get',payload)==record
            passed('stable canonical32 key release binds exact account/org/class/lesson without changing document or revision')
            other_actor=rpc('reviewer','key',payload);admin=rpc('admin','key',payload);other_lesson=rpc('teacher','key',{'lesson_id':second['lesson']['id']})
            assert len({r['key_id'] for r in (initial,other_actor,admin,other_lesson)})==4 and len({r['key_base64'] for r in (initial,other_actor,admin,other_lesson)})==4
            passed('different staff accounts and lessons/classes receive distinct keys; admins cannot select another owner')
            for actor,expected in (('student','42501'),('parent','42501'),('foreign_teacher','P0002'),('unassigned_teacher','42501'),('bad-token','28000')):denied(actor,payload,expected);passed(actor+' cannot obtain this recovery key')
            for malformed in ({},{'lesson_id':None},{'lesson_id':'bad'},{'lesson_id':lesson,'account_id':str(ids['teacher'])},{'lesson_id':lesson,'key_id':initial['key_id']},[],None):denied('teacher',malformed,'22023');passed('closed payload denies malformed type or client scope override')
            for change,params,actor,expected in (("update accounts set status='suspended' where id=%s",(ids['teacher'],),'teacher','28000'),("update accounts set role='student' where id=%s",(ids['teacher'],),'teacher','42501'),("update classes set status='archived' where id=%s",(ids['class'],),'teacher','42501'),('delete from class_memberships where class_id=%s and account_id=%s',(ids['class'],ids['teacher']),'teacher','42501'),("update class_memberships set membership_role='student' where class_id=%s and account_id=%s",(ids['class'],ids['teacher']),'teacher','42501'),('update private.sessions set revoked_at=clock_timestamp() where token_hash=%s',(tokens['teacher'],),'teacher','28000'),("update private.sessions set expires_at=clock_timestamp()-interval '1 second' where token_hash=%s",(tokens['teacher'],),'teacher','28000')):
                with conn.transaction(force_rollback=True):conn.execute(change,params);denied(actor,payload,expected)
                passed('key release rechecks '+change.split(' where ')[0])
            with conn.transaction(force_rollback=True):
                conn.execute("update class_course_version_assignments set state='superseded' where class_id=%s and state='active'",(ids['class'],));assert rpc('teacher','key',payload)==initial
            passed('original authorized staff history recovery survives ended course pin without granting save or publication')
            for statement,params in (('update private.lesson_draft_recovery_keys set key_id=gen_random_uuid() where key_id=%s',(initial['key_id'],)),('delete from private.lesson_draft_recovery_keys where key_id=%s',(initial['key_id'],)),('truncate private.lesson_draft_recovery_keys',())):
                assert code(statement,params)=='23514';passed('immutable recovery material rejects '+statement.split()[0])
            assert conn.execute("select count(*) from pg_constraint where conrelid='private.lesson_draft_recovery_keys'::regclass and contype='f'").fetchone()[0]==3
            insert='insert into private.lesson_draft_recovery_keys(account_id,organization_id,class_id,lesson_id,key_material) values(%s,%s,%s,%s,%s)'
            assert code(insert,(ids['teacher'],ids['org'],ids['second_class'],lesson,bytes(32)))=='23514'
            assert code(insert,(ids['foreign_teacher'],ids['org'],ids['class'],lesson,bytes(32)))=='23503'
            assert code(insert,(ids['unassigned_teacher'],ids['org'],ids['class'],lesson,bytes(31)))=='23514'
            passed('actual tenant FKs, exact lesson/class guard and byte length constraints reject invalid owner-level fixture inserts')
            with conn.transaction(force_rollback=True):
                conn.execute("update lesson_catalog set is_ready=false where organization_id=%s",(ids['org'],));assert rpc('teacher','key',payload)==initial
            passed('unreleased lesson recovery remains staff-only and does not depend on student publication readiness')
            def simultaneous():
                with connect() as db:return rpc('reviewer','key',{'lesson_id':second['lesson']['id']},db)
            with ThreadPoolExecutor(2) as pool:values=list(pool.map(lambda _:simultaneous(),range(2)))
            assert values[0]==values[1] and conn.execute('select count(*) from private.lesson_draft_recovery_keys where account_id=%s and lesson_id=%s',(ids['reviewer'],second['lesson']['id'])).fetchone()[0]==1
            passed('two real connections racing initial release converge on one stable key without duplicates')
            def revoke():
                with connect() as db:db.execute('delete from class_memberships where class_id=%s and account_id=%s',(ids['class'],ids['teacher']))
            with ThreadPoolExecutor(1) as pool:
                with conn.transaction():
                    assert rpc('teacher','key',payload)==initial;pending=pool.submit(revoke);time.sleep(0.1);assert not pending.done()
                pending.result(timeout=5)
            denied('teacher',payload,'42501');conn.execute("insert into class_memberships(class_id,account_id,membership_role) values(%s,%s,'teacher')",(ids['class'],ids['teacher']))
            passed('membership revocation waits for current transaction then denies every subsequent key release')
            short=hashlib.sha256(('short-recovery-'+nonce).encode()).hexdigest()
            with connect() as waiting,ThreadPoolExecutor(1) as pool:
                pid=waiting.execute('select pg_backend_pid()').fetchone()[0];conn.execute("select public.api_create_session(%s,%s,clock_timestamp()+interval '5 seconds','fixture','loopback')",(ids['teacher'],short))
                def expire_wait():
                    try:rpc(short,'key',payload,waiting);return 'unexpected-key'
                    except psycopg.Error as exc:return exc.sqlstate
                with conn.transaction():
                    conn.execute('select key_id from private.lesson_draft_recovery_keys where key_id=%s for update',(initial['key_id'],));future=pool.submit(expire_wait);deadline=time.monotonic()+3
                    while True:
                        conn.execute('select pg_stat_clear_snapshot()');event=conn.execute('select wait_event_type from pg_stat_activity where pid=%s',(pid,)).fetchone()[0]
                        if event=='Lock':break
                        assert not future.done() and time.monotonic()<deadline;time.sleep(0.02)
                    conn.execute("select pg_sleep(greatest(extract(epoch from expires_at-clock_timestamp()),0)::double precision+0.05) from private.sessions where token_hash=%s",(short,))
                assert future.result(timeout=5)=='28000'
            assert rpc('teacher','key',payload)==initial
            passed('session expiring during an actual recovery-key row lock cannot release material after the wait')
            final=snapshot();assert all(set(rows).issubset(set(final[t])) for t,rows in before.items());assert rpc('teacher','get',payload)==record
            passed('all prior lessons, assets, evidence and current document/revision remain unchanged')
        report['status']='PASS';save();print(f'Lesson recovery PostgreSQL: PASS; {len(report["checks"])} checks',flush=True)
    except BaseException as exc:report['status']='FAIL';report['error_type']=type(exc).__name__;save();raise
if __name__=='__main__':main()
