"""Explicit fresh-cluster acceptance runner. Default mode validates inputs only."""
import argparse,json,os,subprocess,sys,uuid
from pathlib import Path
from contract import HERE,REPO,sources,connection_guard,check_connection,digest,checkout_sources

def main():
    p=argparse.ArgumentParser();p.add_argument('--execute',action='store_true');p.add_argument('--checkout-report',type=Path);args=p.parse_args()
    manifest,migrations=sources()
    if not args.execute:
        print(json.dumps({'status':'INPUTS CHECKED; POSTGRESQL NOT EXECUTED','migrations':len(migrations),'source_files':len(manifest['files']),'production_calls':0}));return
    checkout=None;checkout_hash=None
    if os.environ.get('GITHUB_ACTIONS')=='true':assert args.checkout_report,'CI requires exact tested checkout evidence'
    if args.checkout_report:
        raw=args.checkout_report.read_bytes();checkout_hash=digest(raw);checkout=json.loads(raw)
    def verify_checkout():
        if checkout is None:return
        assert digest(args.checkout_report.read_bytes())==checkout_hash,'Checkout receipt changed'
        checkout_sources(checkout,manifest)
        actual=subprocess.check_output(['git','rev-parse','HEAD'],cwd=REPO,text=True).strip()
        tree=subprocess.check_output(['git','rev-parse','HEAD^{tree}'],cwd=REPO,text=True).strip()
        assert checkout['tested_sha']==actual and checkout['tested_tree']==tree
    verify_checkout()
    import psycopg
    from psycopg import sql
    from psycopg.conninfo import conninfo_to_dict
    assert psycopg.__version__=='3.2.9','Use the reviewed pinned database driver'
    member_dsn=os.environ.get('ECHS_MEMBERSHIP_TEST_DSN','');bank_dsn=os.environ.get('ECHS_BANK_TEST_DSN','');assert member_dsn and bank_dsn
    member_info=conninfo_to_dict(member_dsn);bank_info=conninfo_to_dict(bank_dsn)
    address=connection_guard(member_info,'echs_membership_test_transport_');assert connection_guard(bank_info,'echs_bank_test_transport_')==address
    assert {k:v for k,v in member_info.items() if k!='dbname'}=={k:v for k,v in bank_info.items() if k!='dbname'},'Both fresh databases must use the same isolated cluster'
    with psycopg.connect(member_dsn,hostaddr=address,autocommit=True,connect_timeout=5) as db:
        check_connection(db,member_info,address)
        assert db.execute("select count(*) from pg_tables where schemaname in ('public','private','storage')").fetchone()[0]==0,'Fresh membership database required'
        assert db.execute("select count(*) from pg_roles where rolname in ('anon','authenticated','service_role','fixture_unprivileged')").fetchone()[0]==0,'Fresh isolated cluster roles required'
        assert db.execute('select 1 from pg_database where datname=%s',(bank_info['dbname'],)).fetchone() is None,'Refusing an existing archive database'
    run_dir=HERE/'results'/('run-'+uuid.uuid4().hex);run_dir.mkdir(parents=True)
    summary={'status':'RUNNING; NOT PASS','production_calls':0,'real_storage_executed':False,'hosted_edge_executed':False,
             'source_pins_sha256':digest((HERE/'source-pins.json').read_bytes()),'steps':[]}
    if checkout:
        summary['checkout_report_sha256']=checkout_hash
        summary['tested_sha']=checkout['tested_sha'];summary['tested_tree']=checkout['tested_tree'];summary['pr_head_sha']=checkout['pr_head_sha']
    def save():(run_dir/'acceptance.json').write_text(json.dumps(summary,indent=2)+'\n')
    env={k:v for k,v in os.environ.items() if not k.startswith(('PG','ECHS_'))};env.update(PYTHON=sys.executable,PYTHONUTF8='1',ECHS_MEMBERSHIP_TEST_DSN=member_dsn,ECHS_BANK_TEST_DSN=bank_dsn)
    node=os.environ.get('ECHS_TEST_NODE','node')
    def execute(label,command,timeout=180):
        sources();verify_checkout();log=run_dir/(label+'.log')
        with log.open('w',encoding='utf-8') as output:
            result=subprocess.run(command,cwd=REPO,env=env,stdout=output,stderr=subprocess.STDOUT,text=True,timeout=timeout)
        sources();verify_checkout();summary['steps'].append({'name':label,'exit_code':result.returncode,'log_sha256':digest(log.read_bytes())});save()
        assert result.returncode==0,'An isolated integration step failed; inspect its local log'
    try:
        member=run_dir/'membership-database.json'
        execute('membership-database',[sys.executable,str(REPO/'tools/test_membership_authorization_database.py'),'--report',str(member)])
        proof=json.loads(member.read_text());assert proof['status']=='PASS' and proof['migrations']==migrations[:-1] and len(proof['checks'])==55
        env['ECHS_MEMBERSHIP_DATABASE_REPORT']=str(member);env['ECHS_MEMBERSHIP_E2E_REPORT']=str(run_dir/'membership-http.json')
        execute('membership-http',[node,str(REPO/'tools/test_membership_authorization_e2e.mjs')])
        http=json.loads((run_dir/'membership-http.json').read_text());assert http['status']=='PASS' and len(http['checks'])==7
        with psycopg.connect(member_dsn,hostaddr=address,autocommit=True,connect_timeout=5) as db:
            check_connection(db,member_info,address)
            assert db.execute('select 1 from pg_database where datname=%s',(bank_info['dbname'],)).fetchone() is None
            db.execute(sql.SQL('create database {}').format(sql.Identifier(bank_info['dbname'])))
        archive=run_dir/'archive-database.json'
        execute('archive-database',[sys.executable,str(REPO/'tools/test_private_snapshot_database.py'),'--baseline-report',str(member),'--report',str(archive)],240)
        proof=json.loads(archive.read_text());assert proof['status']=='PASS' and proof['migrations']==migrations and len(proof['checks'])==222
        env['ECHS_TRANSPORT_DATABASE_REPORT']=str(archive);env['ECHS_TRANSPORT_INTEGRATION_REPORT']=str(run_dir/'transport-http-sql.json')
        execute('transport-http-sql',[node,str(HERE/'test-http-sql.mjs')],240)
        final=json.loads((run_dir/'transport-http-sql.json').read_text())
        assert final['status']=='ACTUAL POSTGRESQL AND ROUTE PASS; STORAGE SERVICE AND EDGE NOT RUN'
        assert final['database_executed'] is True and final['real_storage_executed'] is False and len(final['checks'])==15 and final['migrations']==migrations
        sources();verify_checkout();summary.update(status='ACTUAL POSTGRESQL/HTTP PASS; STORAGE SERVICE AND HOSTED EDGE PENDING',migrations=27,checks={'membership_database':55,'membership_http':7,'archive_database':222,'transport_http_sql':15},database_executed=True)
        summary['reports']=[{'file':f.name,'sha256':digest(f.read_bytes()),'bytes':f.stat().st_size} for f in [member,run_dir/'membership-http.json',archive,run_dir/'transport-http-sql.json']]
        save();print(json.dumps({'status':summary['status'],'acceptance':str(run_dir/'acceptance.json')}))
    except BaseException as e:
        summary.update(status='FAIL; NO ACCEPTANCE',error_type=type(e).__name__);save();raise
if __name__=='__main__':main()
