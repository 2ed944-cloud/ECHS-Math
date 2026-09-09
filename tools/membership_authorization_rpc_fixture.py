#!/usr/bin/env python3
"""Test-only JSON-lines bridge to the three real C09 service-role RPCs.

Requires an already-tested, disposable loopback PostgreSQL15 database. All test
controls are fixed statements restricted to this process's fresh synthetic IDs.
No storage, network service, arbitrary SQL, production credentials or logging of
tokens, account payloads, RPC arguments or upstream exception messages.
"""
import argparse,hashlib,json,os,sys,uuid
from pathlib import Path
def main():
    p=argparse.ArgumentParser();p.add_argument('--database-report',type=Path,default=Path('reports/membership-authorization-database.json'));args=p.parse_args()
    root=Path(__file__).resolve().parents[1]
    legacy=Path(os.environ.get('ECHS_MEMBERSHIP_BASELINE_ROOT',str(root))).resolve()
    migration_name='202609090002_membership_authorization.sql'
    migration_paths=sorted(x for x in (legacy/'supabase/migrations').glob('*.sql') if x.name<migration_name)
    assert len(migration_paths)==25
    migration_paths.append(root/'supabase/migrations'/migration_name)
    expected_migrations=[{'file':x.name,'sha256':hashlib.sha256(x.read_bytes()).hexdigest()} for x in migration_paths]
    accepted=json.loads(args.database_report.read_text());assert accepted['status']=='PASS' and accepted['migration_count']==26 and len(accepted['migrations'])==26
    assert accepted['migrations']==expected_migrations,'Database report does not match the exact current migration chain'
    import psycopg
    from psycopg import sql
    from psycopg.conninfo import conninfo_to_dict
    dsn=os.environ.get('ECHS_MEMBERSHIP_TEST_DSN','');assert dsn;info=conninfo_to_dict(dsn)
    assert info.get('host') in ('localhost','127.0.0.1','::1') and info.get('dbname','').startswith('echs_membership_test') and not info.get('service') and not info.get('hostaddr')
    with psycopg.connect(dsn,hostaddr='::1' if info['host']=='::1' else '127.0.0.1',autocommit=True) as db:
        db.execute("set statement_timeout='12s'");assert int(db.execute('show server_version_num').fetchone()[0])//10000==15
        assert db.execute('select current_database()').fetchone()[0].startswith('echs_membership_test')
        assert db.execute('select public.api_membership_capabilities()').fetchone()[0]=={'contract':'echs.membership.v1','atomic_replacement':True,'tenant_scoped':True}
        nonce=uuid.uuid4().hex
        names=['org','foreign_org','class','foreign_class','archived_class','teacher','admin','student','second_student','third_student','inactive_student','parent','foreign_teacher','foreign_student','unassigned_teacher']
        ids={n:uuid.uuid4() for n in names};tokens={}
        for n in ['org','foreign_org']:db.execute('insert into organizations(id,name,slug) values(%s,%s,%s)',(ids[n],'Synthetic membership HTTP fixture','c09-http-'+n+'-'+nonce))
        for n in names:
            if n in ['org','foreign_org'] or n.endswith('class'):continue
            role='teacher' if 'teacher' in n else 'student' if 'student' in n else n
            db.execute('insert into accounts(id,organization_id,username,display_name,role,status) values(%s,%s,%s,%s,%s,%s)',(ids[n],ids['foreign_org'] if n.startswith('foreign') else ids['org'],'c09-http-'+n+'-'+nonce,'Synthetic '+n,role,'suspended' if n=='inactive_student' else 'active'))
            token='synthetic-c09-'+n+'-'+nonce;tokens[n]=token
            db.execute("select public.api_create_session(%s,%s,now()+interval '1 hour','fixture','loopback')",(ids[n],hashlib.sha256(token.encode()).hexdigest()))
        for n in ['class','foreign_class','archived_class']:
            foreign=n=='foreign_class';db.execute("insert into classes(id,organization_id,name,course_key,status,created_by) values(%s,%s,'Synthetic HTTP class','ap-calculus',%s,%s)",(ids[n],ids['foreign_org'] if foreign else ids['org'],'archived' if n=='archived_class' else 'active',ids['foreign_teacher'] if foreign else ids['admin']))
        for who,role in [('teacher','teacher'),('student','student')]:db.execute('insert into class_memberships(class_id,account_id,membership_role) values(%s,%s,%s)',(ids['class'],ids[who],role))
        # Actual malformed legacy data is possible with the existing independent
        # FKs. It is inserted only into the isolated fixture, never into production.
        db.execute("insert into class_memberships(class_id,account_id,membership_role) values(%s,%s,'teacher')",(ids['foreign_class'],ids['teacher']))
        trigger='c09_http_fail_'+nonce;function='c09_http_fail_'+nonce
        def emit(value):print(json.dumps(value,default=str,separators=(',',':')),flush=True)
        emit({'ready':True,'ids':{k:str(v) for k,v in ids.items()},'tokens':tokens,'postgres_version':db.execute('show server_version').fetchone()[0]})
        for line in sys.stdin:
            request_id=None
            try:
                assert len(line.encode())<=1048576;request=json.loads(line);request_id=request['id']
                if request.get('control'):
                    control=request['control']
                    if control=='roster':
                        result=[{'account_id':str(a),'membership_role':r,'joined_at':t.isoformat()} for a,r,t in db.execute('select account_id,membership_role,joined_at from class_memberships where class_id=%s order by account_id',(ids['class'],))]
                    elif control=='revoke_teacher':
                        db.execute('update private.sessions set revoked_at=now() where account_id=%s',(ids['teacher'],));result=True
                    elif control=='fail_insert':
                        db.execute(sql.SQL("create function private.{}() returns trigger language plpgsql as $$begin if new.class_id={}::uuid and new.account_id={}::uuid then raise exception 'Synthetic failure' using errcode='23514';end if;return new;end$$").format(sql.Identifier(function),sql.Literal(str(ids['class'])),sql.Literal(str(ids['third_student']))))
                        db.execute(sql.SQL('create trigger {} before insert on public.class_memberships for each row execute function private.{}()').format(sql.Identifier(trigger),sql.Identifier(function)));result=True
                    elif control=='clear_failure':
                        db.execute(sql.SQL('drop trigger if exists {} on public.class_memberships').format(sql.Identifier(trigger)));db.execute(sql.SQL('drop function if exists private.{}()').format(sql.Identifier(function)));result=True
                    else:raise ValueError('Unsupported fixture control')
                    emit({'id':request_id,'data':result,'error':None});continue
                name=request['name'];params=request.get('args') or {}
                allowed={'api_session_lookup':{'p_token_hash'},'api_membership_capabilities':set(),'api_replace_class_memberships':{'p_token_hash','p_class_id','p_student_ids','p_teacher_ids'}}
                assert name in allowed and set(params)==allowed[name]
                with db.transaction():
                    db.execute('set local role service_role')
                    if name=='api_session_lookup':result=[r[0] for r in db.execute('select to_jsonb(x) from public.api_session_lookup(%s) x',(params['p_token_hash'],))]
                    elif name=='api_membership_capabilities':result=db.execute('select public.api_membership_capabilities()').fetchone()[0]
                    else:result=db.execute('select public.api_replace_class_memberships(%s,%s,%s,%s)',(params['p_token_hash'],params['p_class_id'],params['p_student_ids'],params['p_teacher_ids'])).fetchone()[0]
                    db.execute('reset role')
                emit({'id':request_id,'data':result,'error':None})
            except psycopg.Error as error:emit({'id':request_id,'data':None,'error':{'code':error.sqlstate}})
            except Exception as error:emit({'id':request_id,'data':None,'error':{'code':'fixture_invalid_request','type':type(error).__name__}})
if __name__=='__main__':
    try:main()
    except Exception as error:print(json.dumps({'ready':False,'error':{'type':type(error).__name__,'code':getattr(error,'sqlstate',None)}}),flush=True);sys.exit(1)
