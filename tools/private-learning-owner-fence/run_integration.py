"""Isolated real-PG runner. No database import, connect or execution by default."""
import argparse,contextlib,json,os,runpy,subprocess,sys,uuid
from pathlib import Path
from contract import HERE,REPO,NAMES,sources,connection_guard,connected,digest,checkout_sources,expected_labels

OWNED=NAMES

def source_snapshot():
    sources()
    return {p:{'bytes':(HERE/p).stat().st_size,'sha256':digest((HERE/p).read_bytes())} for p in OWNED}

def assert_snapshot(expected):
    assert source_snapshot()==expected,'Candidate or dependencies changed during execution'

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--execute',action='store_true');parser.add_argument('--checkout-report',type=Path);args=parser.parse_args()
    inputs,migrations=sources();expected=source_snapshot()
    migration_rows=[{'file':r['path'].split('/')[-1],'sha256':r['sha256']} for r in migrations]
    if not args.execute:
        print(json.dumps({'status':'INPUTS CHECKED; POSTGRESQL NOT EXECUTED','migration_count':27,'pinned_inputs':33,'database_executed':False,'production_calls':0}));return
    checkout=None;checkout_hash=None
    if os.environ.get('GITHUB_ACTIONS')=='true':assert args.checkout_report,'CI requires exact checkout evidence'
    if args.checkout_report:
        checkout_hash=digest(args.checkout_report.read_bytes());checkout=json.loads(args.checkout_report.read_text())
    def verified():
        assert_snapshot(expected)
        if checkout is not None:
            assert digest(args.checkout_report.read_bytes())==checkout_hash,'Checkout receipt changed'
            checkout_sources(checkout)
    verified()
    # Environment values are never printed, copied into reports or inherited
    # by child processes except the two explicitly checked loopback DSNs.
    import psycopg
    from psycopg import sql
    from psycopg.conninfo import conninfo_to_dict
    assert psycopg.__version__=='3.2.9','Use the reviewed pinned database driver'
    assert not any(k.startswith('PG') for k in os.environ),'Ambient libpq overrides are not permitted'
    member_dsn=os.environ.get('ECHS_MEMBERSHIP_TEST_DSN','');bank_dsn=os.environ.get('ECHS_BANK_TEST_DSN','')
    assert member_dsn and bank_dsn
    member_info=conninfo_to_dict(member_dsn);bank_info=conninfo_to_dict(bank_dsn)
    address=connection_guard(member_info,'echs_membership_test_owner_fence_')
    assert connection_guard(bank_info,'echs_bank_test_owner_fence_')==address
    assert {k:v for k,v in member_info.items() if k!='dbname'}=={k:v for k,v in bank_info.items() if k!='dbname'}
    with psycopg.connect(member_dsn,hostaddr=address,autocommit=True,connect_timeout=5) as db:
        connected(db,member_info,address)
        assert db.execute("select count(*) from pg_tables where schemaname in ('public','private','storage')").fetchone()[0]==0,'Fresh membership DB required'
        assert db.execute("select count(*) from pg_roles where rolname in ('anon','authenticated','service_role','fixture_unprivileged')").fetchone()[0]==0,'Fresh isolated cluster required'
        assert db.execute('select 1 from pg_database where datname=%s',(bank_info['dbname'],)).fetchone() is None,'Refusing an existing bank DB'
    result_dir=HERE/'results'/('run-'+uuid.uuid4().hex);result_dir.mkdir(parents=True)
    report={'contract':'echs.c04.owner-fence-acceptance.v1','status':'RUNNING; NOT PASS','production_calls':0,
            'database_executed':False,'migrations':migration_rows,'source_files':expected,'checks':[],
            'real_storage_executed':False,'http_executed':False,'owner_adoption_api':False}
    if checkout:report.update(checkout_report_sha256=checkout_hash,tested_sha=checkout['tested_sha'],tested_tree=checkout['tested_tree'])
    def save():(result_dir/'acceptance.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    def passed(label):
        assert isinstance(label,str) and label not in report['checks'];report['checks'].append(label);save()
    env={k:v for k,v in os.environ.items() if not k.startswith(('PG','ECHS_'))}
    env.update(PYTHONUTF8='1',ECHS_MEMBERSHIP_TEST_DSN=member_dsn,ECHS_BANK_TEST_DSN=bank_dsn)
    save()
    try:
        verified()
        member=result_dir/'membership-baseline.json'
        with (result_dir/'membership-baseline.log').open('w',encoding='utf-8') as log:
            done=subprocess.run([sys.executable,str(REPO/'tools/test_membership_authorization_database.py'),'--repo-root',str(REPO),'--report',str(member)],cwd=REPO,env=env,stdout=log,stderr=subprocess.STDOUT,timeout=180)
        verified();assert done.returncode==0,'Unchanged membership baseline failed'
        baseline=json.loads(member.read_text());assert baseline['status']=='PASS' and len(baseline['checks'])==55 and baseline['migrations']==migration_rows[:-1]
        report['membership_baseline_checks']=55;save()
        with psycopg.connect(member_dsn,hostaddr=address,autocommit=True,connect_timeout=5) as db:
            connected(db,member_info,address)
            assert db.execute('select 1 from pg_database where datname=%s',(bank_info['dbname'],)).fetchone() is None
            db.execute(sql.SQL('create database {}').format(sql.Identifier(bank_info['dbname'])))

        # The unchanged archive suite owns its own setup and connection. A
        # transparent actual psycopg Connection subclass adds candidate SQL
        # exactly once, immediately AFTER the byte-pinned migration003 call.
        # No SQL result is mocked, filtered, skipped or rewritten. The baseline
        # report itself lists its original27; this outer report records the
        # additive candidate and insertion point explicitly.
        trigger=(REPO/migrations[-1]['path']).read_text(encoding='utf-8')
        candidate=(HERE/'owner-fence.sql').read_text(encoding='utf-8')
        original_connect=psycopg.connect;injections=[]
        def preservation(conn):
            rows={}
            for table, in conn.execute("select tablename from pg_tables where schemaname='public' order by tablename"):
                values=[json.dumps(r[0],sort_keys=True,default=str) for r in conn.execute(sql.SQL('select to_jsonb(t) from public.{} t').format(sql.Identifier(table)))]
                rows[table]=digest('\n'.join(sorted(values)).encode())
            return {'public_rows':rows,
                'table_acl':conn.execute("select oid,relacl,relrowsecurity from pg_class where relnamespace in ('public'::regnamespace,'private'::regnamespace) and relkind='r' order by oid").fetchall(),
                'functions':conn.execute("select p.oid,md5(pg_get_functiondef(p.oid)),p.proacl from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.prokind='f' order by p.oid").fetchall(),
                'triggers':conn.execute("select oid,md5(pg_get_triggerdef(oid)) from pg_trigger where not tgisinternal order by oid").fetchall()}
        class CandidateConnection(psycopg.Connection):
            def execute(self,query,*args,**kwargs):
                cursor=super().execute(query,*args,**kwargs)
                if type(query) is str and query==trigger:
                    assert not injections,'Candidate insertion occurred more than once'
                    verified();connected(self,bank_info,address)
                    before=preservation(self)
                    super().execute(candidate,prepare=False)
                    after=preservation(self)
                    assert after['public_rows']==before['public_rows']
                    for key in ('table_acl','functions','triggers'):
                        # Existing object IDs, grants, RLS and definitions stay
                        # exact. Only newly created private objects/triggers add.
                        assert all(row in after[key] for row in before[key]),key+' changed'
                    assert self.execute('select count(*) from private.learning_owner_routes').fetchone()[0]==0
                    injections.append({'after_migration':migration_rows[-1],'candidate_sha256':expected['owner-fence.sql']['sha256'],
                        'public_table_count':len(before['public_rows']),'old_function_count':len(before['functions']),
                        'old_trigger_count':len(before['triggers']),'existing_objects_preserved':True})
                    # Returning the original cursor is faithful to the original
                    # execute operation. Its migration call consumes no rows.
                return cursor
        archive=result_dir/'archive-with-fence.json';old_argv=sys.argv[:];old_path=sys.path[:]
        old_env={k:os.environ.get(k) for k in ('ECHS_BANK_TEST_DSN',)}
        try:
            psycopg.connect=CandidateConnection.connect
            os.environ['ECHS_BANK_TEST_DSN']=bank_dsn
            sys.path.insert(0,str(REPO/'tools'))
            sys.argv=[str(REPO/'tools/test_private_snapshot_database.py'),'--repo-root',str(REPO),'--baseline-report',str(member),'--report',str(archive)]
            with (result_dir/'archive-with-fence.log').open('w',encoding='utf-8') as log,contextlib.redirect_stdout(log),contextlib.redirect_stderr(log):
                runpy.run_path(sys.argv[0],run_name='__main__')
        finally:
            psycopg.connect=original_connect;sys.argv=old_argv;sys.path[:]=old_path
            for key,value in old_env.items():
                if value is None:os.environ.pop(key,None)
                else:os.environ[key]=value
        assert len(injections)==1;verified()
        baseline=json.loads(archive.read_text());assert baseline['status']=='PASS' and len(baseline['checks'])==222 and baseline['migrations']==migration_rows
        report.update(archive_baseline_checks=222,candidate_installation=injections[0]);save()
        def connect():
            db=original_connect(bank_dsn,hostaddr=address,autocommit=True,connect_timeout=5)
            try:
                connected(db,bank_info,address);db.execute("set statement_timeout='10s'")
                return db
            except BaseException:db.close();raise
        from test_fence import exercise
        with connect() as db:
            report['postgres_version']=db.execute('show server_version').fetchone()[0]
            exercise(db,connect,passed)
        verified();assert report['checks']==expected_labels(),'Fence assertion sequence is incomplete'
        report.update(status='ACTUAL POSTGRESQL OWNER FENCE PASS; HTTP AND ADOPTION API NOT IMPLEMENTED',database_executed=True,
                      check_count=len(report['checks']),reports=[{'file':p.name,'sha256':digest(p.read_bytes()),'bytes':p.stat().st_size} for p in (member,archive)])
        save();print(json.dumps({'status':report['status'],'report':str(result_dir/'acceptance.json')}))
    except BaseException as error:
        report.update(status='FAIL; NO ACCEPTANCE',error_type=type(error).__name__);save();raise

if __name__=='__main__':main()
