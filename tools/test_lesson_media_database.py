#!/usr/bin/env python3
"""Actual PostgreSQL 15 media contracts after the unchanged 22+23 baselines.

The minimal storage.objects fixture represents supported metadata/RLS only.
No Storage provider, object-byte transport or authentication result is simulated
by this database test. Byte transport is tested separately at its HTTP boundary.
"""
import argparse,copy,hashlib,json,os,time,uuid
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

NEW='202609080004_lesson_media.sql'
def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--repo-root',type=Path,default=Path(__file__).resolve().parents[1])
    parser.add_argument('--baseline-report',type=Path,default=Path('reports/lesson-content-v2-database.json'))
    parser.add_argument('--report',type=Path,default=Path('reports/lesson-media-database.json'))
    parser.add_argument('--static-only',action='store_true')
    args=parser.parse_args();root=args.repo_root.resolve()
    report={'status':'RUNNING; NOT PASS','production_calls':False,'postgres_required':15,'checks':[]}
    def save():
        args.report.parent.mkdir(parents=True,exist_ok=True);args.report.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    def passed(label):report['checks'].append(label);print('PASS '+label,flush=True);save()
    try:
        paths=sorted(p for p in (root/'supabase/migrations').glob('*.sql') if p.name<=NEW)
        assert len(paths)==24 and paths[-1].name==NEW
        report['migration_count']=24;report['migrations']=[{'file':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in paths]
        old=paths[-2].read_text();new=paths[-1].read_text();start=old.index('create or replace function private.lesson_json_valid(');end=old.index('\n$$;',start)+len('\n$$;')
        needle="  if kind='block' and value->'version'='2'::jsonb"
        expected=old[start:end].replace(needle,"  if kind='block' and value->>'type' in ('image','video','table','resource') then return private.lesson_media_block_valid(value); end if;\n"+needle,1)
        assert expected in new,'Existing v1/v2 JSON validator changed beyond one media dispatch'
        assert 'trigger' not in new[new.index('create policy lesson_assets_objects_closed'):new.index('create table public.lesson_assets')].lower()
        cases=json.loads((root/'tools/lesson-runtime/fixtures/media-cases.json').read_text(encoding='utf-8'))['cases'];assert len(cases)==92
        passed('24 exact migration inputs preserve all v1/v2 branches; 92 shared media cases')
        if args.static_only:report['status']='STATIC INPUTS PASS; DATABASE NOT RUN';save();return
        import psycopg
        from psycopg import sql
        from psycopg.conninfo import conninfo_to_dict
        from psycopg.types.json import Jsonb
        baseline=json.loads(args.baseline_report.read_text());assert baseline['status']=='PASS' and baseline['migration_count']==23 and len(baseline['checks'])==203
        assert baseline['migrations']==report['migrations'][:-1]
        dsn=os.environ.get('ECHS_LESSON_TEST_DSN','');assert dsn
        info=conninfo_to_dict(dsn);assert info.get('host') in ('127.0.0.1','localhost','::1') and info.get('dbname','').startswith('echs_lesson_test')
        assert not info.get('hostaddr') and not info.get('service')
        def connect():
            db=psycopg.connect(dsn,hostaddr='::1' if info['host']=='::1' else '127.0.0.1',autocommit=True);db.execute("set statement_timeout='10s'");return db
        with connect() as conn:
            assert int(conn.execute('show server_version_num').fetchone()[0])//10000==15
            assert conn.execute('select current_database()').fetchone()[0].startswith('echs_lesson_test')
            report['postgres_version']=conn.execute('show server_version').fetchone()[0]
            assert conn.execute("select to_regprocedure('public.lesson_media_capabilities()')").fetchone()[0] is None
            def snapshot():
                tables=[r[0] for r in conn.execute("select tablename from pg_tables where schemaname='public' order by tablename")]
                return {t:sorted(json.dumps(r[0],sort_keys=True,default=str) for r in conn.execute(sql.SQL('select to_jsonb(t) from public.{} t').format(sql.Identifier(t)))) for t in tables}
            before=snapshot()
            buckets_before=conn.execute('select jsonb_agg(to_jsonb(b) order by id) from storage.buckets b').fetchone()[0]
            # Infrastructure normally supplied by Supabase. Existing baseline only
            # needed buckets. Policies operate on actual PG roles/RLS, not mocks.
            assert conn.execute("select to_regclass('storage.objects')").fetchone()[0] is None
            conn.execute('create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text not null references storage.buckets(id),name text not null,metadata jsonb,unique(bucket_id,name))')
            conn.execute('alter table storage.objects enable row level security');conn.execute('alter table storage.buckets enable row level security')
            conn.execute(new,prepare=False)
            after=snapshot();assert all(after[t]==rows for t,rows in before.items())
            assert conn.execute("select jsonb_agg(to_jsonb(b) order by id) from storage.buckets b where id<>'lesson-assets'").fetchone()[0]==buckets_before
            passed('migration24 adds only media infrastructure and preserves every existing public row and other bucket')
            def code(statement,params=(),role=None):
                try:
                    with conn.transaction():
                        if role:conn.execute(sql.SQL('set local role {}').format(sql.Identifier(role)))
                        conn.execute(statement,params)
                        if role:conn.execute('reset role')
                    return None
                except psycopg.Error as exc:return exc.sqlstate
            for role in ('anon','authenticated','service_role','fixture_unprivileged'):
                for table in ('lesson_assets','lesson_version_assets'):
                    for action in ('select * from','delete from','truncate'):
                        assert code(f'{action} public.{table}',role=role)=='42501';passed(f'{role} direct {action} {table} denied')
                    assert code(f'insert into public.{table} default values',role=role)=='42501';passed(f'{role} direct insert {table} denied')
                    assert code(f'update public.{table} set lesson_id=lesson_id',role=role)=='42501';passed(f'{role} direct update {table} denied')
                for function in ('lesson_asset_store(null,\'list\',\'{}\')','lesson_media_capabilities()'):
                    if role!='service_role':assert code('select public.'+function,role=role)=='42501';passed(f'{role} direct {function.split("(")[0]} denied')
                assert code('select private.lesson_asset_bucket_ready()',role=role)=='42501';passed(f'{role} private bucket helper denied')
            cap={'contract':'echs.lesson.media.v1','blocks':{'image':[1],'video':[1],'table':[1],'resource':[1]},'asset_delivery':'authenticated-bytes','mime_types':['image/png','image/jpeg','image/webp','application/pdf'],'max_image_bytes':4194304,'max_resource_bytes':8388608}
            with conn.transaction():
                conn.execute('set local role service_role');assert conn.execute('select public.lesson_media_capabilities()').fetchone()[0]==cap
                authoring=conn.execute('select public.lesson_content_capabilities()').fetchone()[0];assert authoring['contract']=='echs.lesson.authoring.v1' and authoring['content_version']==2
            passed('service-only media readiness probes exact real SQL validator/private bucket while original authoring capability stays available')
            for item in cases:
                actual=conn.execute("select private.lesson_json_valid(%s,'block')",(Jsonb(item['block']),)).fetchone()[0]
                assert actual is item['valid'],(item['label'],actual);passed('SQL media structure: '+item['label'])
            # A broad unrelated policy cannot turn this private bucket public.
            with conn.transaction(force_rollback=True):
                conn.execute('grant select,insert,update,delete on storage.objects,storage.buckets to anon,authenticated')
                conn.execute('create policy fixture_allow_objects on storage.objects for all to anon,authenticated using(true) with check(true)')
                conn.execute('create policy fixture_allow_buckets on storage.buckets for all to anon,authenticated using(true) with check(true)')
                conn.execute("insert into storage.objects(bucket_id,name,metadata) values('lesson-assets','fixture-private','{}')")
                for role in ('anon','authenticated'):
                    with conn.transaction():
                        conn.execute(sql.SQL('set local role {}').format(sql.Identifier(role)))
                        assert conn.execute("select count(*) from storage.objects where bucket_id='lesson-assets'").fetchone()[0]==0
                        assert conn.execute("select count(*) from storage.buckets where id='lesson-assets'").fetchone()[0]==0
                        conn.execute('reset role')
                    assert code("insert into storage.objects(bucket_id,name) values('lesson-assets','forbidden')",role=role)=='42501'
                passed('restrictive Storage policies deny direct anon/authenticated objects and bucket even with broad permissive policies')
            for change in ("update storage.buckets set public=true where id='lesson-assets'","update storage.buckets set file_size_limit=9999999 where id='lesson-assets'",'alter table storage.objects disable row level security',"alter policy lesson_assets_objects_closed on storage.objects using(true) with check(true)"):
                with conn.transaction(force_rollback=True):
                    conn.execute(change);assert conn.execute('select public.lesson_media_capabilities()').fetchone()[0] is None
                    assert code("select public.lesson_asset_store(null,'list','{}')")=='55000'
                passed('bucket/configuration guard fails closed: '+change.split(' set ')[0])
            names=('organization','foreign_organization','class','foreign_class','admin','teacher','reviewer','student','parent','foreign_teacher','unassigned_teacher')
            ids={name:uuid.uuid4() for name in names};nonce=uuid.uuid4().hex
            tokens={name:hashlib.sha256(('media-'+name+'-'+nonce).encode()).hexdigest() for name in names if name not in ('organization','foreign_organization','class','foreign_class')}
            for org in ('organization','foreign_organization'):conn.execute('insert into organizations(id,name,slug) values(%s,%s,%s)',(ids[org],'Original media fixture','media-'+org+'-'+nonce))
            for name,token in tokens.items():
                org=ids['foreign_organization'] if name=='foreign_teacher' else ids['organization'];role='teacher' if name in ('teacher','reviewer','foreign_teacher','unassigned_teacher') else name
                conn.execute("insert into accounts(id,organization_id,username,display_name,role,status) values(%s,%s,%s,%s,%s,'active')",(ids[name],org,'media-'+name+'-'+nonce,name,role))
                conn.execute("select public.api_create_session(%s,%s,now()+interval '1 hour','fixture','loopback')",(ids[name],token))
            for name,org,creator in (('class','organization','admin'),('foreign_class','foreign_organization','foreign_teacher')):
                conn.execute("insert into classes(id,organization_id,name,course_key,status,created_by) values(%s,%s,%s,'ap-calculus','active',%s)",(ids[name],ids[org],'Original media class',ids[creator]))
            for name in ('teacher','reviewer','student'):conn.execute('insert into class_memberships(class_id,account_id,membership_role) values(%s,%s,%s)',(ids['class'],ids[name],'student' if name=='student' else 'teacher'))
            conn.execute("insert into class_memberships(class_id,account_id,membership_role) values(%s,%s,'teacher')",(ids['class'],ids['foreign_teacher']))
            route='lessons/ap-calculus/unit-1/1-7-selecting-limit-procedures.html'
            conn.execute("insert into lesson_catalog(organization_id,access_key,course_key,unit_index,unit_title,topic,title,position,url,is_ready) values(%s,'ap-calculus::0::1.7','ap-calculus',0,'Unit 1','1.7','Original media fixture',0,%s,true)",(ids['organization'],route))
            course=conn.execute("select id from course_versions where course_code='ap-calculus-ab' and status='active' and not is_placeholder").fetchall();assert len(course)==1;course_id=course[0][0]
            def rpc(actor,action,payload,asset=False,db=conn):
                with db.transaction():
                    db.execute('set local role service_role')
                    result=db.execute('select public.'+('lesson_asset_store' if asset else 'lesson_store')+'(%s,%s,%s)',(tokens.get(actor,actor),action,Jsonb(payload))).fetchone()[0]
                    db.execute('reset role');return result
            def denied(actor,action,payload,expected,asset=True):
                try:rpc(actor,action,payload,asset)
                except psycopg.Error as exc:assert exc.sqlstate==expected,(action,actor,exc.sqlstate,expected);return
                raise AssertionError('Unexpected authorized '+action+' '+actor)
            rpc('admin','pin_course',{'class_id':str(ids['class']),'course_version_id':str(course_id),'expected_assignment_id':None,'reason':'Explicit original media fixture'})
            document=json.loads((root/'tools/lesson-runtime/fixtures/published-original.lesson.json').read_text());document.update(lesson_id=str(uuid.uuid4()),course_version_id=str(course_id),unit_id='legacy:ap-calculus:unit:1',topic_id='legacy:ap-calculus:topic:1.7',document_version=1)
            document['publication']={'status':'draft','audience':'institutional','revision':1}
            record=rpc('teacher','create',{'class_id':str(ids['class']),'course_version_id':str(course_id),'access_key':'ap-calculus::0::1.7','expected_revision':0,'document':document,'private_notes':'PRIVATE_MEDIA_CANARY'})
            lesson_id=record['lesson']['id'];first_version=record['head']['id']
            def reserve(mime='image/png',asset_id=None):return {'lesson_id':lesson_id,'asset_id':str(asset_id or uuid.uuid4()),'original_name':'Original asset.png' if mime!='application/pdf' else 'Original asset.pdf','mime_type':mime,'byte_length':80,'width':2 if mime!='application/pdf' else None,'height':3 if mime!='application/pdf' else None,'sha256':'a'*64}
            request=reserve();pending=rpc('teacher','reserve',request,True);assert pending['asset']['state']=='pending'
            assert rpc('teacher','reserve',request,True)['asset']['id']==request['asset_id'];passed('same owner/scope/hash upload ID reservation is idempotent')
            for field,value in (('sha256','b'*64),('original_name','Different.png'),('byte_length',81)):
                changed={**request,field:value};denied('teacher','reserve',changed,'40001')
            denied('reviewer','reserve',request,'40001');passed('same upload ID rejects different owner or metadata without adoption')
            for actor,expected in (('student','42501'),('parent','42501'),('foreign_teacher','P0002'),('unassigned_teacher','42501')):
                denied(actor,'list',{'lesson_id':lesson_id},expected)
            denied('not-a-token','list',{'lesson_id':lesson_id},'28000');passed('actual session/class/tenant scopes deny student authoring, parent, foreign and malformed membership')
            asset_payload={'lesson_id':lesson_id,'asset_id':request['asset_id']}
            denied('teacher','finalize',asset_payload,'23514')
            def storage_record(payload):
                # Simulated completed Storage API metadata only, unique fixture
                # objects. This does not authorize the lesson or mock RPC results.
                conn.execute('insert into storage.objects(bucket_id,name,metadata) values(%s,%s,%s)',('lesson-assets',str(ids['organization'])+'/'+lesson_id+'/'+payload['asset_id'],Jsonb({'mimetype':payload['mime_type'],'size':payload['byte_length']})))
            storage_record(request);ready=rpc('teacher','finalize',asset_payload,True);assert ready['asset']['state']=='ready'
            assert rpc('teacher','reserve',request,True)['asset']['state']=='ready';assert rpc('teacher','finalize',asset_payload,True)['reused'] is True
            passed('finalize requires completed exact object metadata and ready replay keeps immutable upload identity')
            pdf_request=reserve('application/pdf');rpc('teacher','reserve',pdf_request,True);storage_record(pdf_request);rpc('teacher','finalize',{'lesson_id':lesson_id,'asset_id':pdf_request['asset_id']},True)
            def media_document():
                doc=copy.deepcopy(record['head']['document']);blocks=[copy.deepcopy(item['block']) for item in cases[:4]]
                blocks[0]['content']['asset_id']=request['asset_id'];blocks[3]['content']['asset_id']=pdf_request['asset_id'];doc['slides']=[{'id':'media','title':'Original media','layout':'single','blocks':blocks}];return doc
            for bad_id in (str(uuid.uuid4()),pdf_request['asset_id']):
                doc=media_document();doc['slides'][0]['blocks'][0]['content']['asset_id']=bad_id
                denied('teacher','save',{'lesson_id':lesson_id,'expected_revision':record['lesson']['head_revision'],'document':doc,'private_notes':'PRIVATE_MEDIA_CANARY'},'23514',False)
            assert rpc('teacher','get',{'lesson_id':lesson_id})['head']['id']==first_version
            record=rpc('teacher','save',{'lesson_id':lesson_id,'expected_revision':record['lesson']['head_revision'],'document':media_document(),'private_notes':'PRIVATE_MEDIA_CANARY'})
            assert conn.execute('select count(*) from lesson_version_assets where lesson_id=%s',(lesson_id,)).fetchone()[0]==2
            passed('save rejects foreign/missing/wrong-type assets transactionally and records immutable version attachments')
            for table,column in (('lesson_assets','id'),('lesson_version_assets','asset_id')):
                assert code('delete from '+table+' where '+column+'=%s',(request['asset_id'],))=='23514'
            # PostgreSQL refuses a standalone FK-parent TRUNCATE before firing
            # its trigger. Include both related tables to exercise our actual
            # append-only trigger independently of that built-in FK refusal.
            assert code('truncate lesson_assets')=='0A000'
            assert code('truncate lesson_version_assets')=='23514'
            assert code('truncate lesson_assets,lesson_version_assets')=='23514'
            assert code("update lesson_assets set sha256=%s where id=%s",('b'*64,request['asset_id']))=='23514'
            denied('teacher','cleanup',asset_payload,'23514');passed('ready metadata and historical attachments are immutable including deletes/truncates')
            def mutate(action,actor='teacher',**extra):return rpc(actor,action,{'lesson_id':lesson_id,'expected_revision':record['lesson']['head_revision'],**extra})
            record=mutate('request_review');record=mutate('approve','reviewer',validated_version_id=record['head']['id'],checks={key:True for key in ('curriculum','mathematics','accessibility','rights','student_safe')},comment='PRIVATE_MEDIA_REVIEW');record=mutate('publish',validated_version_id=record['head']['id'])
            student_payload={**asset_payload,'class_id':str(ids['class'])}
            assert rpc('student','read',student_payload,True)['asset']['id']==request['asset_id']
            denied('student','read',asset_payload,'42501');denied('student','read',{**student_payload,'class_id':str(ids['foreign_class'])},'42501')
            unreferenced=reserve();rpc('teacher','reserve',unreferenced,True);storage_record(unreferenced);rpc('teacher','finalize',{'lesson_id':lesson_id,'asset_id':unreferenced['asset_id']},True)
            denied('student','read',{**student_payload,'asset_id':unreferenced['asset_id']},'P0002');passed('student asset delivery requires exact current published reference and original class release gates')
            for change,params,expected in (("update accounts set status='suspended' where id=%s",(ids['teacher'],),'28000'),("update classes set status='archived' where id=%s",(ids['class'],),'42501'),('delete from class_memberships where class_id=%s and account_id=%s',(ids['class'],ids['teacher']),'42501'),('update private.sessions set revoked_at=now() where token_hash=%s',(tokens['teacher'],),'28000')):
                with conn.transaction(force_rollback=True):conn.execute(change,params);denied('teacher','list',{'lesson_id':lesson_id},expected)
                passed('current authority is rechecked: '+change.split(' where ')[0])
            with conn.transaction(force_rollback=True):
                conn.execute('update lesson_catalog set is_ready=false where organization_id=%s',(ids['organization'],));denied('student','read',student_payload,'42501')
            passed('student bytes metadata uses real catalog ready gate rather than asset readiness alone')
            with conn.transaction(force_rollback=True):
                conn.execute("update class_course_version_assignments set state='superseded' where class_id=%s and state='active'",(ids['class'],))
                denied('teacher','reserve',reserve(),'23514');denied('teacher','finalize',asset_payload,'23514');denied('student','read',student_payload,'42501')
                assert rpc('teacher','read',asset_payload,True)['asset']['id']==request['asset_id']
            passed('lost active pin blocks uploads/finalization/student delivery while existing authorized staff recovery remains available')
            def suspend_after_lock():
                with connect() as db:db.execute("update accounts set status='suspended' where id=%s",(ids['teacher'],))
            with ThreadPoolExecutor(1) as pool:
                with conn.transaction():
                    rpc('teacher','list',{'lesson_id':lesson_id},True)
                    suspended=pool.submit(suspend_after_lock);time.sleep(0.1);assert not suspended.done()
                suspended.result(timeout=5)
            denied('teacher','list',{'lesson_id':lesson_id},'28000')
            conn.execute("update accounts set status='active' where id=%s",(ids['teacher'],))
            passed('separate connection account revocation waits for transaction locks then blocks the next asset request')
            short_token=hashlib.sha256(('media-short-session-'+nonce).encode()).hexdigest();expiring_request=reserve()
            # Hold the exact upload-ID lock after original session authorization.
            # This proves expiry is rechecked after the additional asset wait,
            # rather than merely rejecting an already-expired initial request.
            with connect() as waiting_db,ThreadPoolExecutor(1) as pool:
                waiting_pid=waiting_db.execute('select pg_backend_pid()').fetchone()[0]
                conn.execute("select public.api_create_session(%s,%s,clock_timestamp()+interval '5 seconds','fixture','loopback')",(ids['teacher'],short_token))
                def reserve_after_wait():
                    try:return rpc(short_token,'reserve',expiring_request,True,waiting_db)
                    except psycopg.Error as exc:return exc.sqlstate
                with conn.transaction():
                    conn.execute('select pg_advisory_xact_lock(hashtextextended(%s,710))',(expiring_request['asset_id'],))
                    pending_expiry=pool.submit(reserve_after_wait);deadline=time.monotonic()+3
                    while True:
                        conn.execute('select pg_stat_clear_snapshot()')
                        wait_event=conn.execute('select wait_event from pg_stat_activity where pid=%s',(waiting_pid,)).fetchone()[0]
                        if wait_event=='advisory':break
                        assert not pending_expiry.done() and time.monotonic()<deadline,'Request did not reach the actual upload lock'
                        time.sleep(0.02)
                    conn.execute("select pg_sleep(greatest(extract(epoch from expires_at-clock_timestamp()),0)::double precision+0.05) from private.sessions where token_hash=%s",(short_token,))
                assert pending_expiry.result(timeout=5)=='28000'
            assert conn.execute('select count(*) from lesson_assets where id=%s',(expiring_request['asset_id'],)).fetchone()[0]==0
            passed('session expiring during a real upload advisory-lock wait rejects and rolls back the asset reservation')
            # Expired pending fixture records model retention; never rewrite a
            # stored immutable asset timestamp just to manufacture the condition.
            expired=reserve();conn.execute('insert into lesson_assets(id,organization_id,class_id,lesson_id,uploaded_by,original_name,mime_type,byte_length,width,height,sha256,state,created_at) values(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,\'pending\',now()-interval \'2 days\')',(expired['asset_id'],ids['organization'],ids['class'],lesson_id,ids['teacher'],expired['original_name'],expired['mime_type'],expired['byte_length'],expired['width'],expired['height'],expired['sha256']))
            expired_payload={'lesson_id':lesson_id,'asset_id':expired['asset_id']};storage_record(expired)
            closed=rpc('admin','cleanup_expired',expired_payload,True);assert closed['asset']['state']=='cleanup'
            assert rpc('admin','cleanup_expired',expired_payload,True)['asset']['state']=='cleanup'
            denied('teacher','finalize',expired_payload,'23514');denied('teacher','reserve',expired,'40001')
            passed('expired pending cleanup is authorized, terminal and idempotent; it cannot race back to ready')
            race=reserve();rpc('teacher','reserve',race,True);storage_record(race);race_payload={'lesson_id':lesson_id,'asset_id':race['asset_id']}
            def parallel(action):
                try:
                    with connect() as db:return rpc('teacher',action,race_payload,True,db)['asset']['state']
                except psycopg.Error as exc:return exc.sqlstate
            with ThreadPoolExecutor(2) as pool:outcomes=list(pool.map(parallel,['finalize','cleanup']))
            assert sorted(outcomes) in (sorted(['ready','23514']),sorted(['23514','cleanup'])),outcomes
            passed('separate PostgreSQL connections serialize finalize/cleanup; exactly one terminal state wins')
            with conn.transaction(force_rollback=True):
                current_count=conn.execute("select count(*) from lesson_assets where lesson_id=%s and state in ('pending','ready')",(lesson_id,)).fetchone()[0]
                for _ in range(128-current_count):
                    small=reserve();small['byte_length']=1;rpc('teacher','reserve',small,True)
                denied('teacher','reserve',reserve(),'23514')
                assert rpc('teacher','reserve',request,True)['asset']['id']==request['asset_id']
            passed('128 pending+ready asset quota includes reservations while same-ID replay remains available')
            with conn.transaction(force_rollback=True):
                current_bytes=conn.execute("select coalesce(sum(byte_length),0) from lesson_assets where lesson_id=%s and state in ('pending','ready')",(lesson_id,)).fetchone()[0]
                remaining=134217728-current_bytes
                while remaining:
                    large=reserve('application/pdf');large['byte_length']=min(8388608,remaining);rpc('teacher','reserve',large,True);remaining-=large['byte_length']
                denied('teacher','reserve',reserve(),'23514')
            passed('128MiB aggregate quota counts pending bytes and refuses excess transactionally')
            record=mutate('restore',version_id=first_version)
            assert rpc('student','read',student_payload,True)['asset']['id']==request['asset_id']
            record=mutate('unpublish',reason='Explicit media fixture withdrawal')
            denied('student','read',student_payload,'P0002');assert conn.execute('select count(*) from lesson_version_assets where lesson_id=%s',(lesson_id,)).fetchone()[0]==2
            passed('restore preserves old publication access until explicit unpublish; old version attachments remain')
            final=snapshot();assert all(set(rows).issubset(set(final[t])) for t,rows in before.items())
            passed('all preexisting legacy rows and learner evidence remain unchanged after the full media lifecycle')
        report['status']='PASS';save();print(f'Lesson media PostgreSQL: PASS; {len(report["checks"])} checks',flush=True)
    except BaseException as exc:
        report['status']='FAIL';report['error_type']=type(exc).__name__;save();raise
if __name__=='__main__':main()
