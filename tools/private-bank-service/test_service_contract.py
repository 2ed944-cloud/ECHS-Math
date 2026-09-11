"""Offline synthetic safety tests; no Docker, service sockets, DSN or production data."""
from pathlib import Path
import argparse
import copy
import json
import subprocess
import sys
import tempfile
from service_contract import (HERE, PIN_SHA256, OBSERVATION_SHA256, ContractError,
    IMAGE_TAGS, UPSTREAM_COMMIT, RUNTIME_HASHES, UNSAFE_ENVIRONMENT, digest, strict_json,
    relative_path, verify_sources, fixture_plan, validate_fixture_plan, clean_environment,
    validate_image_receipt, cleanup_targets, write_report_exclusive, image_tags, postgres_major, postgres_observation)
from run_service import preflight

RUNTIME=HERE/'runtime'

def rejects(fn,code=None):
    try:
        fn()
    except ContractError as error:
        assert code is None or error.code==code
        return error
    raise AssertionError('Expected a closed rejection')

def raw(value):
    return json.dumps(value,separators=(',',':')).encode()

def tests(source_repo):
    results=[]
    def group(name,fn):
        try:
            fn()
            results.append({'name':name,'status':'PASS'})
        except Exception as error:
            # Fixed test labels and exception types only; never stringify values.
            results.append({'name':name,'status':'FAIL','error_type':type(error).__name__})
    before=verify_sources(source_repo,RUNTIME)
    pins=strict_json((HERE/'source-pins.json').read_bytes())
    with tempfile.TemporaryDirectory(prefix='safety-',dir=HERE) as temporary:
        temp=Path(temporary).absolute()
        assert temp.resolve().parent==HERE.resolve() and temp.name.startswith('safety-')
        repo=temp/'repo'; runtime=temp/'runtime'; candidate=temp/'candidate'
        for row in pins['migrations']:
            dest=repo/row['path'];dest.parent.mkdir(parents=True,exist_ok=True)
            dest.write_bytes((source_repo/row['path']).read_bytes())
        runtime.mkdir();candidate.mkdir()
        for name in RUNTIME_HASHES:
            (runtime/name).write_bytes((RUNTIME/name).read_bytes())
        for name in ('source-pins.json','upstream-observation.json'):
            (candidate/name).write_bytes((HERE/name).read_bytes())

        def all_sources():
            result=verify_sources(repo,runtime,candidate)
            assert result==before and result['migration_files_verified']==27
            assert result['runtime_files_verified']==2 and result['upstream_files_verified']==10
            assert digest((candidate/'source-pins.json').read_bytes())==PIN_SHA256
            assert digest((candidate/'upstream-observation.json').read_bytes())==OBSERVATION_SHA256
        group('exact27 migration, runtime2 and upstream10 source closure',all_sources)

        def changed_source():
            p=repo/pins['migrations'][0]['path']; b=p.read_bytes()
            try:
                p.write_bytes(b+b'\n');rejects(lambda:verify_sources(repo,runtime,candidate),'source-hash')
            finally:p.write_bytes(b)
        group('one changed migration byte fails before service planning',changed_source)

        def missing_source():
            p=repo/pins['migrations'][-1]['path'];b=p.read_bytes();p.unlink()
            try:rejects(lambda:verify_sources(repo,runtime,candidate),'source-file')
            finally:p.write_bytes(b)
        group('missing final migration cannot shorten the accepted prefix',missing_source)

        def forged_pins():
            p=candidate/'source-pins.json';b=p.read_bytes();v=strict_json(b)
            try:
                v['migrations'].pop();p.write_bytes(raw(v))
                rejects(lambda:verify_sources(repo,runtime,candidate),'unapproved-source-pins')
            finally:p.write_bytes(b)
        group('self-rehashed stale manifest cannot replace approved source pins',forged_pins)

        def upstream_change():
            p=candidate/'upstream-observation.json';b=p.read_bytes();v=strict_json(b)
            try:
                v['files'][0]['content']+='\n';p.write_bytes(raw(v))
                rejects(lambda:verify_sources(repo,runtime,candidate),'upstream-observation')
            finally:p.write_bytes(b)
        group('altered official initialization bytes fail upstream binding',upstream_change)

        def runtime_change():
            for name in RUNTIME_HASHES:
                p=runtime/name;b=p.read_bytes()
                try:
                    p.write_bytes(b+b'\n');rejects(lambda:verify_sources(repo,runtime,candidate),'source-hash')
                finally:p.write_bytes(b)
        group('both reviewed runtime files remain byte-exact dependencies',runtime_change)

        def malformed_json():
            for b in (b'{"x":1,"x":2}',b'{"x":NaN}',b'{"x":Infinity}',b'{"x":1e999}',b'\xff',b'{} trailing',b''):
                rejects(lambda:strict_json(b))
            rejects(lambda:strict_json(b' '*262145),'metadata-size')
            for p in ('../secrets','/etc/passwd','C:/Windows/x','x//y','x/./y','x/../y','x\\y','x\x00y'):
                rejects(lambda:relative_path(p),'relative-path')
        group('metadata duplicate keys, nonfinite values and path escapes rejected',malformed_json)

        def namespace():
            a=fixture_plan('1'*32);b=fixture_plan('2'*32)
            assert a['project']!=b['project'] and a['network']['name']!=b['network']['name']
            assert not {v['name'] for v in a['volumes']} & {v['name'] for v in b['volumes']}
            validate_fixture_plan(a)
            for x in ('main','A'*32,'1'*31,'1'*33,True,None,'../existing'):
                rejects(lambda:fixture_plan(x),'run-id')
        group('exact unique fixture namespace, no existing project adoption',namespace)

        def unsafe_origins():
            for origin in ('https://production.supabase.co','https://echsc08servicetest.supabase.co:443',
                'http://echsc08servicetest.supabase.co','https://127.0.0.1','https://user:pass@echsc08servicetest.supabase.co'):
                plan=fixture_plan('1'*32);plan['origin']=origin
                rejects(lambda:validate_fixture_plan(plan),'fixture-policy')
            plan=fixture_plan('1'*32);plan['bind_address']='0.0.0.0'
            rejects(lambda:validate_fixture_plan(plan),'fixture-policy')
        group('production/arbitrary origins and public listeners rejected',unsafe_origins)

        def isolation():
            for field in ('verify_certificate','verify_hostname'):
                for value in (False,1,0,None):
                    plan=fixture_plan('1'*32);plan['tls'][field]=value
                    rejects(lambda:validate_fixture_plan(plan),'fixture-policy')
            for change in ('network','volume','service','execution','secret'):
                plan=fixture_plan('1'*32)
                if change=='network':plan['network']['internal']=False
                if change=='volume':plan['volumes'][0]['external']=True
                if change=='service':plan['services']['db']='postgres:latest'
                if change=='execution':plan['services_executed']=0
                if change=='secret':plan['authorization']='Bearer fixed-synthetic-canary'
                rejects(lambda:validate_fixture_plan(plan),'fixture-policy')
        group('TLS, private network, image set and type-exact false claims enforced',isolation)

        def ambient():
            clean_environment({'PATH':'unread','CI':'true'})
            for key in UNSAFE_ENVIRONMENT:
                error=rejects(lambda:clean_environment({key:'sensitive-test-sentinel'}),'ambient-service-configuration')
                assert 'sensitive-test-sentinel' not in str(error)
        group('ambient Docker, DSN, proxy and TLS overrides fail with sanitized errors',ambient)

        receipt={'contract':'echs.c08.storage-image-receipt.v1','upstream_commit':UPSTREAM_COMMIT,
            'platform':'linux/amd64','postgres_required':15,'images':[{'service':s,'tag':tag,'manifest_digest':'sha256:'+'1'*64,
                'config_digest':'sha256:'+'2'*64} for s,tag in IMAGE_TAGS.items()]}
        def image_binding():
            b=raw(receipt); refs=validate_image_receipt(b,digest(b))
            assert len(refs)==5 and all('@sha256:' in r for r in refs.values())
            rejects(lambda:validate_image_receipt(b,'0'*64),'unapproved-image-receipt')
            for key,value in (('platform','linux/arm64'),('upstream_commit','0'*40)):
                x=copy.deepcopy(receipt);x[key]=value;b=raw(x)
                rejects(lambda:validate_image_receipt(b,digest(b)),'image-receipt-contract')
        group('explicit approved image receipt hash and platform binding',image_binding)

        def image_shape():
            for change in ('missing','duplicate','floating','short','extra','nested-service'):
                x=copy.deepcopy(receipt)
                if change=='missing':x['images'].pop()
                if change=='duplicate':x['images'][-1]=x['images'][0]
                if change=='floating':x['images'][0]['tag']='supabase/postgres:latest'
                if change=='short':x['images'][0]['manifest_digest']='sha256:abc'
                if change=='extra':x['images'][0]['credential']='synthetic-canary'
                if change=='nested-service':x['images'][0]['service']=['db']
                b=raw(x);error=rejects(lambda:validate_image_receipt(b,digest(b)))
                assert 'synthetic-canary' not in str(error)
        group('missing, duplicate, floating and secret-bearing image rows rejected',image_shape)

        def cleanup():
            plan=fixture_plan('1'*32)
            rows=[{'kind':'network','name':plan['network']['name'],'labels':plan['ownership_labels'].copy(),'external':False}]
            rows += [{'kind':'volume','name':v['name'],'labels':plan['ownership_labels'].copy(),'external':False} for v in plan['volumes']]
            assert len(cleanup_targets(plan,rows))==4
            for change in ('foreign','extra','missing','external','duplicate'):
                x=copy.deepcopy(rows)
                if change=='foreign':x[0]['labels']['echs.run_id']='2'*32
                if change=='extra':x.append(copy.deepcopy(x[0]))
                if change=='missing':x.pop()
                if change=='external':x[0]['external']=True
                if change=='duplicate':x[-1]=copy.deepcopy(x[0])
                rejects(lambda:cleanup_targets(plan,x))
        group('cleanup observations require exact project resource ownership',cleanup)

        def exclusive_report():
            report_root=temp/'reports';report_root.mkdir();p=report_root/'proof.json'
            write_report_exclusive(p,{'synthetic':True},report_root);b=p.read_bytes()
            rejects(lambda:write_report_exclusive(p,{'replacement':True},report_root),'report-exists')
            assert p.read_bytes()==b
            q=temp/'outside.json'
            rejects(lambda:write_report_exclusive(q,{},report_root),'report-path')
            assert not q.exists()
        group('report creation is bounded and cannot overwrite prior evidence',exclusive_report)

        def plan_not_service():
            result=preflight(source_repo,RUNTIME,'1'*32)
            assert result['status']=='PREFLIGHT_PASS' and result['mode']=='OFFLINE_PLAN_ONLY'
            for key in ('services_executed','hosted_edge_executed','corpus_imported','image_registry_verified','service_acceptance'):
                assert result[key] is False
            assert len(result['remaining'])==7
        group('successful source preflight cannot claim service acceptance',plan_not_service)

        def no_execute():
            r=subprocess.run([sys.executable,'-B',str(HERE/'run_service.py'),'--execute'],
                capture_output=True,text=True,timeout=15,check=False)
            assert r.returncode==2 and 'unrecognized arguments: --execute' in r.stderr
            assert not r.stdout
            accepted=subprocess.run([sys.executable,'-B',str(HERE/'run_service.py'),'--repo',str(source_repo),'--run-id','1'*32],
                capture_output=True,text=True,timeout=15,check=False)
            assert accepted.returncode==0
            assert json.loads(accepted.stdout)=={'status':'PREFLIGHT_PASS','services_executed':False,
                'migration_files_verified':27,'runtime_files_verified':2,'upstream_files_verified':10}
        group('runner CLI has no service-start or execution switch',no_execute)

        def selected_major():
            assert fixture_plan('1'*32)==fixture_plan('1'*32,15)
            for major in (15,17):
                plan=fixture_plan('1'*32,major);validate_fixture_plan(plan,major)
                assert plan['postgres_required']==major and plan['services']==image_tags(major)
                rejects(lambda:validate_fixture_plan(plan,17 if major==15 else 15))
                result=preflight(source_repo,RUNTIME,'1'*32,major)
                assert result['fixture_plan']==plan and result['services_executed'] is False
            for invalid in (True,False,'15',15.0,16,18,None):
                rejects(lambda:postgres_major(invalid),'configured-postgres-major')
                rejects(lambda:fixture_plan('1'*32,invalid),'configured-postgres-major')
        group('explicit typed PostgreSQL major selects one exact image set and retains default15',selected_major)

        def observed_major():
            for major in (15,17):
                observed={'server_version_num':major*10000+6,'server_version':str(major)+'.6 (synthetic)'}
                assert postgres_observation(observed,major)==observed
                for actual in (14,15,16,17,18):
                    if actual!=major:rejects(lambda:postgres_observation({'server_version_num':actual*10000+6,'server_version':str(actual)+'.6'},major))
                for key,value in [('server_version_num',True),('server_version_num',float(major*10000+6)),('server_version','17.6.1.136'),('server_version',str(major)+'.7'),('server_version',str(major)+'.06')]:
                    wrong=dict(observed);wrong[key]=value;rejects(lambda:postgres_observation(wrong,major))
        group('actual PostgreSQL major and full version observation must agree with the configured job',observed_major)

        def unchanged():
            assert verify_sources(source_repo,RUNTIME)==before
        group('all actual source inputs unchanged after reversible local tests',unchanged)
    return results

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--report',type=Path,default=HERE/'results'/'safety-test-results.json')
    parser.add_argument('--repo',type=Path,default=HERE.parents[1]/'foundations')
    args=parser.parse_args()
    # Refuse existing evidence before executing this suite.
    if args.report.exists():
        raise SystemExit('Report already exists; select a new candidate results filename')
    groups=tests(args.repo.resolve())
    report={'contract':'echs.c08.storage-service-safety-tests.v1',
        'status':'PASS' if all(g['status']=='PASS' for g in groups) else 'FAIL',
        'passed':sum(g['status']=='PASS' for g in groups),'total':len(groups),'groups':groups,
        'source_sha256':{n:digest((HERE/n).read_bytes()) for n in
            ('service_contract.py','run_service.py','test_service_contract.py','source-pins.json','upstream-observation.json')},
        'services_executed':False,'hosted_edge_executed':False,'corpus_imported':False}
    write_report_exclusive(args.report,report)
    print(json.dumps({'status':report['status'],'passed':report['passed'],'total':report['total'],'services_executed':False}))
    return 0 if report['status']=='PASS' else 1

if __name__=='__main__':
    raise SystemExit(main())
