"""Explicit opt-in disposable PostgreSQL runner. Default is source-only preflight."""
import argparse,contextlib,json,os,runpy,subprocess,sys,uuid
from pathlib import Path
from contract import HERE,REPO,FENCE,sources,snapshot,unchanged,digest,connection_guard,connected,load_fence,planned_labels,sql_buffers,checkout_sources

def row_digest(values):
    """Exact PostgreSQL JSONB text, with unambiguous lengths and duplicate rows."""
    import hashlib
    assert all(type(v) is str for v in values)
    result=hashlib.sha256()
    for raw in sorted(v.encode('utf-8') for v in values):
        result.update(len(raw).to_bytes(8,'big'));result.update(raw)
    return result.hexdigest()

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--execute',action='store_true');parser.add_argument('--checkout-report',type=Path);args=parser.parse_args()
    pins,migrations=sources();expected=snapshot();labels=planned_labels()
    migration_rows=[{'file':r['path'].split('/')[-1],'sha256':r['sha256']} for r in migrations]
    if not args.execute:
        print(json.dumps({'status':'SOURCE PREFLIGHT ONLY; POSTGRESQL NOT EXECUTED','prerequisites':45,'original_migrations':27,'unchanged_owner_fence_sources':12,
            'planned_sql_groups':len(labels),'source_files':expected,'database_executed':False,'production_calls':0}));return
    checkout=None;checkout_hash=None
    if os.environ.get('GITHUB_ACTIONS')=='true':assert args.checkout_report,'Actions requires exact checkout evidence'
    if args.checkout_report:
        raw=args.checkout_report.read_bytes();checkout_hash=digest(raw);checkout=json.loads(raw)
        checkout_sources(checkout)
    def verified():
        unchanged(expected)
        if checkout is not None:
            assert digest(args.checkout_report.read_bytes())==checkout_hash,'Checkout receipt changed'
            checkout_sources(checkout)
    verified()
    # Only explicitly supplied disposable loopback databases. Never log DSNs.
    import psycopg
    from psycopg import sql
    from psycopg.conninfo import conninfo_to_dict
    assert psycopg.__version__=='3.2.9','Use the reviewed pinned driver'
    assert not any(k.startswith('PG') for k in os.environ),'Ambient libpq overrides forbidden'
    member_dsn=os.environ.get('ECHS_JOURNAL_MEMBERSHIP_DSN','');bank_dsn=os.environ.get('ECHS_JOURNAL_BANK_DSN','')
    assert member_dsn and bank_dsn
    member_info=conninfo_to_dict(member_dsn);bank_info=conninfo_to_dict(bank_dsn)
    address=connection_guard(member_info,'echs_membership_test_journal_')
    assert connection_guard(bank_info,'echs_bank_test_journal_')==address
    assert {k:v for k,v in member_info.items() if k!='dbname'}=={k:v for k,v in bank_info.items() if k!='dbname'}
    with psycopg.connect(member_dsn,hostaddr=address,autocommit=True,connect_timeout=5) as db:
        connected(db,member_info,address)
        assert db.execute("select count(*) from pg_tables where schemaname in ('public','private','storage')").fetchone()[0]==0
        assert db.execute("select count(*) from pg_roles where rolname in ('anon','authenticated','service_role','fixture_unprivileged')").fetchone()[0]==0
        assert db.execute('select 1 from pg_database where datname=%s',(bank_info['dbname'],)).fetchone() is None
    output=HERE/'results'/('run-'+uuid.uuid4().hex);output.mkdir(parents=True)
    report={'contract':'echs.c04.operation-journal-acceptance.v1','status':'RUNNING; NOT ACCEPTED','source_files':expected,'migrations':migration_rows,
        'checks':[],'fence_checks':[],'production_calls':0,'database_executed':False,'production_migration':False,
        'active_api':False,'http_executed':False,'owner_adoption_api':False,'browser_bridge':False,'grading_authoritative':False}
    if checkout is not None:report.update(checkout_report_sha256=checkout_hash,tested_sha=checkout['tested_sha'],tested_tree=checkout['tested_tree'])
    def save():(output/'acceptance.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    def passed(label):
        assert type(label) is str and label not in report['checks'];report['checks'].append(label);save()
    def fence_passed(label):
        assert type(label) is str and label not in report['fence_checks'];report['fence_checks'].append(label);save()
    env={k:v for k,v in os.environ.items() if not k.startswith(('PG','ECHS_'))}
    env.update(PYTHONUTF8='1',ECHS_MEMBERSHIP_TEST_DSN=member_dsn,ECHS_BANK_TEST_DSN=bank_dsn)
    save()
    try:
        verified()
        member=output/'membership-baseline.json'
        with (output/'membership-baseline.log').open('w',encoding='utf-8') as log:
            done=subprocess.run([sys.executable,str(REPO/'tools/test_membership_authorization_database.py'),'--repo-root',str(REPO),'--report',str(member)],cwd=REPO,env=env,stdout=log,stderr=subprocess.STDOUT,timeout=180)
        verified();assert done.returncode==0,'Unchanged membership baseline failed'
        baseline=json.loads(member.read_text());assert baseline['status']=='PASS' and len(baseline['checks'])==55 and baseline['migrations']==migration_rows[:-1]
        report['membership_baseline_checks']=55;save()
        with psycopg.connect(member_dsn,hostaddr=address,autocommit=True,connect_timeout=5) as db:
            connected(db,member_info,address)
            assert db.execute('select 1 from pg_database where datname=%s',(bank_info['dbname'],)).fetchone() is None
            db.execute(sql.SQL('create database {}').format(sql.Identifier(bank_info['dbname'])))
        trigger=(REPO/migrations[-1]['path']).read_text(encoding='utf-8')
        fence_sql,journal_sql=sql_buffers(expected,pins)
        original_connect=psycopg.connect;injections=[]
        def preservation(conn):
            rows={}
            for table, in conn.execute("select tablename from pg_tables where schemaname='public' order by tablename"):
                values=[r[0] for r in conn.execute(sql.SQL('select to_jsonb(t)::text from public.{} t').format(sql.Identifier(table)))]
                rows[table]=row_digest(values)
            return {'public_rows':rows,
                'table_acl':conn.execute("select oid,relacl,relrowsecurity from pg_class where relnamespace in ('public'::regnamespace,'private'::regnamespace) and relkind='r' order by oid").fetchall(),
                'functions':conn.execute("select p.oid,md5(pg_get_functiondef(p.oid)),p.proacl from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.prokind='f' order by p.oid").fetchall(),
                'triggers':conn.execute("select oid,md5(pg_get_triggerdef(oid)) from pg_trigger where not tgisinternal order by oid").fetchall()}
        class CandidateConnection(psycopg.Connection):
            def execute(self,query,*args,**kwargs):
                cursor=super().execute(query,*args,**kwargs)
                if type(query) is str and query==trigger:
                    assert not injections;verified();connected(self,bank_info,address)
                    original=preservation(self)
                    super().execute(fence_sql,prepare=False)
                    before=preservation(self)
                    super().execute(journal_sql,prepare=False)
                    after=preservation(self)
                    assert after['public_rows']==before['public_rows']==original['public_rows']
                    for key in ('table_acl','functions','triggers'):
                        assert all(row in before[key] for row in original[key]),key+' altered by fence'
                        assert all(row in after[key] for row in before[key]),key+' altered by journal'
                    assert self.execute('select count(*) from private.learning_owner_routes').fetchone()[0]==0
                    assert self.execute('select count(*) from private.learning_journal_owners').fetchone()[0]==0
                    injections.append({'after_migration':migration_rows[-1],'unchanged_fence_sha256':digest(fence_sql.encode()),'journal_sha256':expected['operation-journal.sql']['sha256'],
                        'existing_public_rows_preserved':True,'existing_function_acl_rls_triggers_preserved':True,'row_representation':'postgres-jsonb-text-length-prefixed-v1','initial_routes':0,'initial_journal_owners':0})
                return cursor
        archive=output/'archive-with-fence-and-journal.json';old_argv=sys.argv[:];old_path=sys.path[:]
        old_env=os.environ.get('ECHS_BANK_TEST_DSN')
        try:
            psycopg.connect=CandidateConnection.connect;os.environ['ECHS_BANK_TEST_DSN']=bank_dsn
            sys.path.insert(0,str(REPO/'tools'))
            sys.argv=[str(REPO/'tools/test_private_snapshot_database.py'),'--repo-root',str(REPO),'--baseline-report',str(member),'--report',str(archive)]
            with (output/'archive-with-fence-and-journal.log').open('w',encoding='utf-8') as log,contextlib.redirect_stdout(log),contextlib.redirect_stderr(log):
                runpy.run_path(sys.argv[0],run_name='__main__')
        finally:
            psycopg.connect=original_connect;sys.argv=old_argv;sys.path[:]=old_path
            if old_env is None:os.environ.pop('ECHS_BANK_TEST_DSN',None)
            else:os.environ['ECHS_BANK_TEST_DSN']=old_env
        assert len(injections)==1;verified()
        baseline=json.loads(archive.read_text());assert baseline['status']=='PASS' and len(baseline['checks'])==222 and baseline['migrations']==migration_rows
        report.update(archive_baseline_checks=222,candidate_installation=injections[0]);save()
        def connect():
            db=original_connect(bank_dsn,hostaddr=address,autocommit=True,connect_timeout=5)
            try:
                connected(db,bank_info,address);db.execute("set statement_timeout='10s'");db.execute("set lock_timeout='8s'");return db
            except BaseException:db.close();raise
        fence,fence_labels=load_fence()
        with connect() as db:
            report['postgres_version']=db.execute('show server_version').fetchone()[0]
            fence.exercise(db,connect,fence_passed)
            assert report['fence_checks']==fence_labels
            assert db.execute('select count(*) from private.learning_journal_owners').fetchone()[0]==0
        verified()
        from test_journal import exercise
        with connect() as db:
            details=exercise(db,connect,passed)
        verified();assert report['checks']==labels,'Journal assertion sequence incomplete'
        assert details is None or type(details) is dict
        report.update(status='ACTUAL POSTGRESQL JOURNAL PASS; NO ACTIVE API OR ADOPTION',database_executed=True,
            journal_check_count=len(labels),fence_check_count=123,details=details,
            reports=[{'file':p.name,'bytes':p.stat().st_size,'sha256':digest(p.read_bytes())} for p in (member,archive)])
        save();print(json.dumps({'status':report['status'],'report':str(output/'acceptance.json')}))
    except BaseException as error:
        report.update(status='FAIL; NO ACCEPTANCE',error_type=type(error).__name__);save();raise

if __name__=='__main__':main()
