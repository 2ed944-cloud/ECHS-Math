#!/usr/bin/env python3
"""Apply ECHS009 after the unchanged 007 PostgreSQL suite in its disposable DB.

The prior suite must have executed the exact 22 inputs and all 235 assertions.
This stage creates original fixtures, preserves a real v1 publication across the
new migration, and executes the same 120 content cases as JavaScript through SQL.
No production credentials, external network or mocked authorization outcomes.
"""
from __future__ import annotations
import argparse
import copy
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import os
from pathlib import Path
import uuid

NEW = '202609080003_lesson_content_v2.sql'
CAPABILITY = {'contract':'echs.lesson.authoring.v1','content_version':2,'blocks':{'rich-text':[1,2],'math':[1,2],'callout':[1,2],'legacy-embedded':[1]},'math_expression_version':1}
CHECKS = {name:True for name in ('curriculum','mathematics','accessibility','rights','student_safe')}
CANARY = 'PRIVATE_CONTENT_V2_NOTES_MUST_NEVER_REACH_STUDENT'
TABLES = ('authored_lessons','lesson_versions','lesson_reviews','lesson_publications')

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--repo-root',type=Path,default=Path(__file__).resolve().parents[1])
    parser.add_argument('--baseline-report',type=Path,default=Path('reports/lesson-persistence-database.json'))
    parser.add_argument('--report',type=Path,default=Path('reports/lesson-content-v2-database.json'))
    parser.add_argument('--static-only',action='store_true')
    args=parser.parse_args()
    root=args.repo_root.resolve()
    report={'status':'RUNNING; NOT PASS','production_calls':False,'postgres_required':15,'checks':[]}
    def save():
        args.report.parent.mkdir(parents=True,exist_ok=True)
        args.report.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    def passed(label):
        report['checks'].append(label);print('PASS '+label,flush=True);save()
    try:
        paths=sorted(p for p in (root/'supabase/migrations').glob('*.sql') if p.name<=NEW)
        assert len(paths)==23 and paths[-1].name==NEW
        report['migrations']=[{'file':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in paths]
        report['migration_count']=23
        fixtures=json.loads((root/'tools/lesson-runtime/fixtures/content-v2-cases.json').read_text())
        cases=fixtures['cases'];locale_cases=fixtures['locale_cases']
        assert len(cases)==120
        assert len(locale_cases)==17
        assert 'octet_length(t)=length(t)' in paths[-1].read_text()
        assert 'collate "C"' in paths[-1].read_text()
        # Replacing the helper preserves the original v1 source exactly except
        # for its explicit new version dispatch. Never widen the v1 branches.
        old=paths[-2].read_text();new=paths[-1].read_text()
        old_func=old[old.index('create function private.lesson_json_valid('):old.index('create function private.lesson_course_family(')]
        expected=old_func.replace('create function private.lesson_json_valid(', 'create or replace function private.lesson_json_valid(',1)
        expected=expected.replace("  if kind in ('uuid'", "  if kind='block' and value->'version'='2'::jsonb then return private.lesson_v2_block_valid(value); end if;\n  if kind in ('uuid'",1)
        assert expected in new,'Original v1 SQL helper was altered beyond explicit v2 dispatch'
        passed('23 exact migration inputs; original v1 helper branches preserved; 120 shared cases')
        if args.static_only:
            report['status']='STATIC INPUTS PASS; DATABASE NOT RUN';save();return

        import psycopg
        from psycopg import sql
        from psycopg.conninfo import conninfo_to_dict
        from psycopg.types.json import Jsonb
        baseline=json.loads(args.baseline_report.read_text())
        assert baseline['status']=='PASS' and len(baseline['checks'])==235 and baseline['migration_count']==22
        assert baseline['migrations']==report['migrations'][:-1], 'Baseline must have tested these exact 22 migration inputs'
        dsn=os.environ.get('ECHS_LESSON_TEST_DSN','');assert dsn
        info=conninfo_to_dict(dsn)
        assert info.get('host') in ('127.0.0.1','localhost','::1')
        assert info.get('dbname','').startswith('echs_lesson_test')
        assert not info.get('hostaddr') and not info.get('service')
        hostaddr='::1' if info['host']=='::1' else '127.0.0.1'
        def connect():
            db=psycopg.connect(dsn,hostaddr=hostaddr,autocommit=True);db.execute("set statement_timeout='10s'");return db
        with connect() as conn:
            assert int(conn.execute('show server_version_num').fetchone()[0])//10000==15
            assert conn.execute('select current_database()').fetchone()[0].startswith('echs_lesson_test')
            report['postgres_version']=conn.execute('show server_version').fetchone()[0]
            assert conn.execute("select to_regprocedure('public.lesson_content_capabilities()')").fetchone()[0] is None, 'Refusing a DB already migrated to content v2'
            assert conn.execute('select public.lesson_store_health()').fetchone()[0]=={'ok':True,'contract':'echs.lesson.store.v1'}
            def snapshot():
                tables=[r[0] for r in conn.execute("select tablename from pg_tables where schemaname='public' order by tablename")]
                return {name:sorted(json.dumps(r[0],sort_keys=True,default=str) for r in conn.execute(sql.SQL('select to_jsonb(t) from public.{} t').format(sql.Identifier(name)))) for name in tables}
            prior_rows=snapshot()
            names=('organization','foreign_organization','class','foreign_class','admin','teacher','reviewer','student','parent','foreign_teacher','unassigned_teacher')
            ids={name:uuid.uuid4() for name in names};nonce=uuid.uuid4().hex
            tokens={name:hashlib.sha256(('isolated-content-v2-'+name+'-'+nonce).encode()).hexdigest() for name in names if name not in ('organization','foreign_organization','class','foreign_class')}
            for org in ('organization','foreign_organization'):
                conn.execute('insert into organizations(id,name,slug) values(%s,%s,%s)',(ids[org],'Original content-v2 fixture','content-v2-'+org+'-'+nonce))
            for name,token in tokens.items():
                org=ids['foreign_organization'] if name=='foreign_teacher' else ids['organization']
                role='teacher' if name in ('teacher','reviewer','foreign_teacher','unassigned_teacher') else name
                conn.execute("insert into accounts(id,organization_id,username,display_name,role,status) values(%s,%s,%s,%s,%s,'active')",(ids[name],org,'v2-'+name+'-'+nonce,name,role))
                conn.execute("select public.api_create_session(%s,%s,now()+interval '1 hour','fixture','loopback')",(ids[name],token))
            for name,org,creator in (('class','organization','admin'),('foreign_class','foreign_organization','foreign_teacher')):
                conn.execute("insert into classes(id,organization_id,name,course_key,status,created_by) values(%s,%s,%s,'ap-calculus','active',%s)",(ids[name],ids[org],'Original content-v2 class',ids[creator]))
            for name in ('teacher','reviewer','student'):
                conn.execute('insert into class_memberships(class_id,account_id,membership_role) values(%s,%s,%s)',(ids['class'],ids[name],'student' if name=='student' else 'teacher'))
            # Deliberately malformed cross-tenant legacy membership remains denied.
            conn.execute("insert into class_memberships(class_id,account_id,membership_role) values(%s,%s,'teacher')",(ids['class'],ids['foreign_teacher']))
            conn.execute("insert into lesson_catalog(organization_id,access_key,course_key,unit_index,unit_title,topic,title,position,url,is_ready) values(%s,'ap-calculus::0::1.7','ap-calculus',0,'Unit 1','1.7','Original content-v2 fixture',0,'lessons/ap-calculus/unit-1/1-7-selecting-limit-procedures.html',true)",(ids['organization'],))
            courses=conn.execute("select id from course_versions where course_code='ap-calculus-ab' and status='active' and not is_placeholder").fetchall();assert len(courses)==1
            course=str(courses[0][0])
            def execute(statement,params=(),role='service_role',connection=None):
                db=connection or conn
                with db.transaction():
                    before=db.execute('select current_user').fetchone()[0]
                    db.execute(sql.SQL('set local role {}').format(sql.Identifier(role)))
                    result=db.execute(statement,params);rows=result.fetchall() if result.description else None
                    db.execute(sql.SQL('set local role {}').format(sql.Identifier(before)))
                    return rows
            def rpc(actor,action,payload=None,connection=None):
                result=execute('select public.lesson_store(%s,%s,%s)',(tokens.get(actor,actor),action,Jsonb(payload or {})),connection=connection)[0][0]
                assert result['ok'] is True and result['contract']=='echs.lesson.store.v1';return result
            def rejects(label,action,codes):
                try:
                    with conn.transaction():action()
                except psycopg.Error as exc:
                    assert exc.sqlstate in ((codes,) if isinstance(codes,str) else codes),(label,exc.sqlstate)
                    passed(label);return
                raise AssertionError(label+' unexpectedly succeeded')
            pin=rpc('admin','pin_course',{'class_id':str(ids['class']),'course_version_id':course,'expected_assignment_id':None,'reason':'Explicit isolated curriculum pin'})
            doc=json.loads((root/'tools/lesson-runtime/fixtures/published-original.lesson.json').read_text())
            doc.update(lesson_id=str(uuid.uuid4()),course_version_id=course,unit_id='legacy:ap-calculus:unit:1',topic_id='legacy:ap-calculus:topic:1.7',document_version=1)
            doc['publication']={'status':'draft','audience':'institutional','revision':1}
            record=rpc('teacher','create',{'class_id':str(ids['class']),'course_version_id':course,'access_key':'ap-calculus::0::1.7','document':doc,'private_notes':CANARY,'expected_revision':0})
            lesson_id=record['lesson']['id'];v1_id=record['head']['id'];v1_doc=copy.deepcopy(record['head']['document'])
            def mutate(action,actor='teacher',**extra):
                return rpc(actor,action,{'lesson_id':lesson_id,'expected_revision':record['lesson']['head_revision'],**extra})
            record=mutate('request_review');record=mutate('approve','reviewer',validated_version_id=record['head']['id'],checks=CHECKS,comment='Independent original v1 review')
            record=mutate('publish',validated_version_id=record['head']['id'])
            deliver=lambda:rpc('student','deliver',{'lesson_id':lesson_id,'class_id':str(ids['class'])})
            v1_live=deliver()['document'];before_migration=snapshot()
            conn.execute(paths[-1].read_text(),prepare=False)
            assert snapshot()==before_migration
            assert deliver()['document']==v1_live
            assert rpc('teacher','version',{'lesson_id':lesson_id,'version_id':v1_id})['version']['document']==v1_doc
            passed('migration 23 preserves all existing rows plus real immutable v1 version/publication byte values')
            assert execute('select public.lesson_content_capabilities()')[0][0]==CAPABILITY
            passed('service-only capability probes the actual installed v2 SQL validators')
            for role in ('anon','authenticated','fixture_unprivileged'):
                rejects(role+' cannot call content capability RPC',lambda role=role:execute('select public.lesson_content_capabilities()',role=role),'42501')
            helpers=[('lesson_v2_text_valid','jsonb,boolean',("'\"text\"'::jsonb,false")),('lesson_v2_href_valid','jsonb',"'\"https://example.org/\"'::jsonb"),
                ('lesson_math_expression_nodes','jsonb,integer',"'{}'::jsonb,1"),('lesson_math_source_valid','jsonb',"'{}'::jsonb"),('lesson_v2_inlines_valid','jsonb,boolean',"'[]'::jsonb,false"),('lesson_v2_rich_valid','jsonb',"'{}'::jsonb"),('lesson_v2_block_valid','jsonb',"'{}'::jsonb")]
            for role in ('anon','authenticated','service_role'):
                for name,signature,arguments in helpers:
                    rejects(role+' denied private helper '+name,lambda role=role,name=name,arguments=arguments:execute('select private.'+name+'('+arguments+')',role=role),'42501')
                for table in TABLES:
                    rejects(role+' still denied direct table '+table,lambda role=role,table=table:execute(sql.SQL('select * from public.{} limit 1').format(sql.Identifier(table)),role=role),'42501')
            for item in cases:
                value=conn.execute("select private.lesson_json_valid(%s,'block')",(Jsonb(item['block']),)).fetchone()[0]
                assert value is item['valid'],(item['label'],value,item['valid'])
                changed=copy.deepcopy(record['head']['document']);changed['slides']=[{'id':'v2-fixture','title':'Original fixture','layout':'single','blocks':[item['block']]}]
                if item['valid']:
                    record=mutate('save',document=changed,private_notes=CANARY)
                    assert record['head']['document']['slides']==changed['slides'];passed('SQL/RPC accepts '+item['label'])
                else:
                    revision=record['lesson']['head_revision']
                    rejects('SQL/RPC rejects '+item['label'],lambda changed=changed:mutate('save',document=changed,private_notes=CANARY),'22023')
                    assert rpc('teacher','get',{'lesson_id':lesson_id})['lesson']['head_revision']==revision
            assert deliver()['document']==v1_live
            passed('all 120 shared JS/SQL cases enforce atomic saves; newer v2 drafts leave exact v1 publication live')
            for item in locale_cases:
                value=conn.execute("select private.lesson_json_valid(%s,'block')",(Jsonb(item['block']),)).fetchone()[0]
                assert value is item['valid'],(item['label'],value,item['valid'])
                changed=copy.deepcopy(record['head']['document']);changed['slides'][0]['blocks']=[item['block']]
                if item['valid']:
                    record=mutate('save',document=changed,private_notes=CANARY);passed('SQL/RPC accepts '+item['label'])
                else:rejects('SQL/RPC rejects '+item['label'],lambda changed=changed:mutate('save',document=changed,private_notes=CANARY),'22023')
            for tex in (r'\href{https://example.org}{x}',r'\url{https://example.org}',r'\htmlClass{hidden}{x}',r'\newcommand{\x}{y}','<img src=x>'):
                bad=copy.deepcopy(cases[1]['block']);bad['content']['source']={'mode':'tex','tex':tex}
                assert conn.execute("select private.lesson_json_valid(%s,'block')",(Jsonb(bad),)).fetchone()[0] is False
                changed=copy.deepcopy(record['head']['document']);changed['slides'][0]['blocks']=[bad]
                rejects('v2-only SQL lexical TeX defense rejects '+tex,lambda changed=changed:mutate('save',document=changed,private_notes=CANARY),'22023')
            # SQL deliberately does not claim KaTeX syntax parity. The HTTP
            # integration rejects this balanced-JSON, malformed-TeX source.
            syntax_only=copy.deepcopy(cases[1]['block']);syntax_only['content']['source']={'mode':'tex','tex':r'\frac{1}{'}
            assert conn.execute("select private.lesson_json_valid(%s,'block')",(Jsonb(syntax_only),)).fetchone()[0] is True
            passed('SQL syntax boundary is explicit: actual malformed-TeX parsing remains pinned KaTeX at the Edge')
            # Publish a mixed document with each explicit content version.
            mixed=copy.deepcopy(record['head']['document']);mixed['slides']=copy.deepcopy(v1_doc['slides'])+[{'id':'mixed-v2','title':'Mixed versions','layout':'single','blocks':[cases[i]['block'] for i in range(3)]}]
            record=mutate('save',document=mixed,private_notes=CANARY)
            for actor in ('student','parent','unassigned_teacher','foreign_teacher'):
                rejects(actor+' cannot save v2 into another authorized staff scope',lambda actor=actor:mutate('save',actor,document=record['head']['document'],private_notes=CANARY),('42501','P0002'))
            rejects('publication still requires independent current-head review',lambda:mutate('publish',validated_version_id=record['head']['id']),'23514')
            record=mutate('request_review')
            rejects('author cannot self-approve v2',lambda:mutate('approve',validated_version_id=record['head']['id'],checks=CHECKS,comment='Self review'),'42501')
            record=mutate('approve','reviewer',validated_version_id=record['head']['id'],checks=CHECKS,comment='Independent mixed-v2 review')
            record=mutate('publish',validated_version_id=record['head']['id']);v2_live=deliver()['document']
            assert v2_live['slides']==mixed['slides'] and CANARY not in json.dumps(deliver())
            passed('mixed v1/v2 publication retains review, class binding and private-note exclusion')
            for table in ('lesson_versions','lesson_reviews','lesson_publications'):
                rejects('immutable '+table+' cannot be updated by owner',lambda table=table:conn.execute(sql.SQL('update public.{} set lesson_id=lesson_id where lesson_id=%s').format(sql.Identifier(table)),(lesson_id,)),'23514')
            record=mutate('restore',version_id=v1_id)
            assert record['head']['id']!=v1_id and record['head']['document']['slides']==v1_doc['slides']
            assert deliver()['document']==v2_live
            assert rpc('teacher','version',{'lesson_id':lesson_id,'version_id':v1_id})['version']['document']==v1_doc
            passed('restoring v1 creates a new draft without rewriting history or replacing live v2')
            # Real two-connection CAS: one save commits, the other observes 40001.
            expected=record['lesson']['head_revision'];saved_doc=copy.deepcopy(record['head']['document'])
            def concurrent_save():
                with connect() as db:
                    try:
                        rpc('teacher','save',{'lesson_id':lesson_id,'expected_revision':expected,'document':saved_doc,'private_notes':CANARY},connection=db);return 'saved'
                    except psycopg.Error as exc:return exc.sqlstate
            with ThreadPoolExecutor(max_workers=2) as pool:outcomes=list(pool.map(lambda _:concurrent_save(),range(2)))
            assert sorted(outcomes)==['40001','saved'],outcomes
            record=rpc('teacher','get',{'lesson_id':lesson_id});passed('real two-connection CAS still permits exactly one concurrent save')
            for statement,params in [("update classes set status='archived' where id=%s",(ids['class'],)),("update accounts set status='suspended' where id=%s",(ids['student'],)),("delete from class_memberships where class_id=%s and account_id=%s",(ids['class'],ids['student']))]:
                with conn.transaction(force_rollback=True):
                    conn.execute(statement,params);rejects('v2 delivery fails under '+statement.split(' set')[0],deliver,('28000','42501','P0002'))
            with conn.transaction(force_rollback=True):
                conn.execute('select public.api_revoke_session(%s)',(tokens['student'],));rejects('revoked student session cannot deliver v2',deliver,'28000')
            rejects('failed explicit pin replacement rolls back',lambda:rpc('admin','pin_course',{'class_id':str(ids['class']),'course_version_id':str(uuid.uuid4()),'expected_assignment_id':pin['assignment']['id'],'reason':'Invalid replacement fixture'}),'23514')
            assert rpc('teacher','context',{'class_id':str(ids['class'])})['current_assignment']['id']==pin['assignment']['id']
            record=mutate('unpublish',reason='Explicit content-v2 fixture withdrawal')
            rejects('unpublish withdraws old and new snapshots from student delivery',deliver,'P0002')
            rejects('student cannot read private old-version history',lambda:rpc('student','version',{'lesson_id':lesson_id,'version_id':v1_id}),'42501')
            after=snapshot()
            assert all(set(rows).issubset(set(after[table])) for table,rows in prior_rows.items()),'Pre-existing fixture/legacy rows changed'
            for table in ('learning_attempts','learning_sessions','lesson_completions','mastery_records'):assert after[table]==prior_rows[table]
            passed('original classes, pins and all learner evidence remain unchanged; no mastery writes')
            report['status']='PASS';save();print(f"Lesson content v2 PostgreSQL: PASS; {len(report['checks'])} checks",flush=True)
    except BaseException as exc:
        report['status']='FAIL';report['error_type']=type(exc).__name__;report['error']=str(exc)
        if getattr(exc,'sqlstate',None):report['sqlstate']=exc.sqlstate
        save();raise

if __name__=='__main__':main()
