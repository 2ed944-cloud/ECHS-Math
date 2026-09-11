"""Offline tests for executable fixture configuration and closed evidence shapes.

Receipt fixtures are synthetic test data, removed before exit. They do not prove
that Docker, PostgREST, Storage, PostgreSQL or hosted Edge ran.
"""
from pathlib import Path
import argparse
import base64
import copy
import hashlib
import hmac
import json
import os
import shutil
import sys
import uuid
from fixture_config import compose_fixture,mint_credentials
from service_contract import HERE,IMAGE_TAGS,UPSTREAM_COMMIT,RUNTIME_HASHES,PIN_SHA256,ContractError,digest,strict_json,write_report_exclusive,image_tags
from run_actual_service import SOURCE_FILES,RunnerError,command,execution_guard,image_result,verify_manifest,resource_candidates,assert_resource_owner,inspect_owned_network,validate_network_receipt,validate_child_failure,child_failure,PORTS
from collect_service import accept,collect,RAW_FILES

def rejects(fn):
    try:fn()
    except (ContractError,RunnerError):return
    raise AssertionError('Expected closed rejection')

def encoded(v):return (json.dumps(v,indent=2)+'\n').encode()

def network_fixture(run_id):
    project='echs-c08-service-'+run_id;name=project+'_internal';network_id='f'*64
    containers={s:format(i+1,'x')*64 for i,s in enumerate(PORTS)}
    network={'Id':network_id,'Name':name,'Driver':'bridge','Scope':'local','Internal':True,'EnableIPv6':False,
        'Labels':{'echs.fixture':project,'echs.run_id':run_id,'com.docker.compose.project':project},
        'IPAM':{'Driver':'default','Config':[{'Subnet':'172.18.0.0/16','Gateway':'172.18.0.1'}]},'Containers':{}}
    attachments={}
    for i,(s,identifier) in enumerate(containers.items()):
        address='172.18.0.'+str(i+2)
        network['Containers'][identifier]={'IPv4Address':address+'/16','IPv6Address':''}
        attachments[s]={'id':identifier,'network_mode':name,'port_bindings':{},'networks':{name:{'NetworkID':network_id,
            'GlobalIPv6Address':'','Gateway':'172.18.0.1','IPAddress':address,'IPPrefixLen':16}}}
    return network,attachments,containers,project

def suite():
    rows=[]
    def group(name,fn):
        try:fn();rows.append({'name':name,'status':'PASS'})
        except Exception as error:rows.append({'name':name,'status':'FAIL','error_type':type(error).__name__})
    raw_manifest=(HERE/'source-manifest.json').read_bytes();manifest_hash=digest(raw_manifest)
    manifest=verify_manifest(raw_manifest,manifest_hash)
    source_before={r['path']:digest((HERE/r['path']).read_bytes()) for r in manifest['files']}
    run_id=uuid.uuid4().hex;run_dir=HERE/'runs'/run_id;output=HERE/'results'/('synthetic-collector-'+run_id)
    for directory in (HERE/'runs',HERE/'results'):
        assert not directory.is_symlink() and not directory.is_junction();directory.mkdir(exist_ok=True)
    assert not run_dir.exists() and not output.exists();run_dir.mkdir()
    head='a'*40;tree='b'*40
    image_receipt={'contract':'echs.c08.storage-image-receipt.v1','upstream_commit':UPSTREAM_COMMIT,'platform':'linux/amd64','postgres_required':15,
        'images':[{'service':s,'tag':tag,'manifest_digest':'sha256:'+str(i+1)*64,'config_digest':'sha256:'+str(i+1)*64} for i,(s,tag) in enumerate(IMAGE_TAGS.items())]}
    image_raw=encoded(image_receipt)
    names=strict_json((HERE/'service-cases.json').read_bytes())
    run={'contract':'echs.c08.storage-service-run.v1','status':'PASS','run_id':run_id,'head':head,'tree':tree,
        'source_manifest_sha256':manifest_hash,'source_pins_sha256':PIN_SHA256,
        'postgres_required':15,'postgres_observation':{'server_version_num':150006,'server_version':'15.6 (synthetic)'},
        'migration_files':strict_json((HERE/'source-pins.json').read_bytes())['migrations'],
        'image_receipt_sha256':digest(image_raw),'running_image_ids':{r['service']:r['config_digest'] for r in image_receipt['images']},
        'managed_schema_probed':True,'migrations_applied':27,'tls':{'hostname':'echsc08servicetest.supabase.co','ca_fingerprint_sha256':'1'*64,'leaf_fingerprint_sha256':'2'*64},
        'services_executed':True,'hosted_edge_executed':False,'corpus_imported':False,'tool_versions':{'python':'3.12.12','node':'v24.19.0','docker':'28.0.0','compose':'2.39.0','cryptography':'50.0.1','psycopg':'3.2.9'},
        'service_start_attempted':True,'failure':None,'cleanup_complete':True,
        'network':inspect_owned_network(*network_fixture(run_id),run_id)}
    tests={'contract':'echs.c08.actual-storage-service-tests.v1','status':'PASS','passed':19,'total':19,
        'groups':[{'name':n,'status':'PASS','elapsed_ms':1} for n in names],'head':head,'tree':tree,'source_manifest_sha256':manifest_hash,
        'services_executed':True,'actual_postgrest':True,'actual_storage':True,'actual_managed_postgres':True,'verified_tls':True,'synthetic_only':True,
        'production_calls':False,'hosted_edge_executed':False,'runtime_sha256':dict(RUNTIME_HASHES),
        'explicit_fault_cases':[names[i] for i in (8,9,10,11)],'opaque_mime_fixtures_not_decoder_tests':True,'storage_metadata_dml':False,'control_error':False,
        'gateway_counts':{'rest_requests':100,'storage_requests':20,'denied':0,'upstream_errors':0,'request_bytes':1000,'response_bytes':1000},
        'readiness':{'status':'PASS','probes':1,'elapsed_ms':1}}
    records={'service-run-report.json':run,'service-test-results.json':tests,'image-receipt.json':image_receipt}
    def restore():
        for name,value in records.items():(run_dir/name).write_bytes(encoded(value))
    restore()
    def current():return accept(run_dir,head,tree,manifest_hash)
    try:
        def source_closure():
            assert tuple(r['path'] for r in manifest['files'])==SOURCE_FILES
            bad=copy.deepcopy(manifest);bad['files']=[r for r in bad['files'] if r['path']!='fixture_config.py'];b=encoded(bad)
            rejects(lambda:verify_manifest(b,digest(b)))
        group('source manifest cannot omit a safety/configuration dependency',source_closure)

        def environment():
            env={'GITHUB_ACTIONS':'true','RUNNER_ENVIRONMENT':'github-hosted','GITHUB_SHA':head,'GITHUB_WORKSPACE':str(HERE)}
            execution_guard(env,'linux',HERE,head)
            for change in ('local','self-hosted','head','workspace','remote-docker','proxy','credentials'):
                x=env.copy();platform='linux'
                if change=='local':platform='win32'
                if change=='self-hosted':x['RUNNER_ENVIRONMENT']='self-hosted'
                if change=='head':x['GITHUB_SHA']='c'*40
                if change=='workspace':x['GITHUB_WORKSPACE']=str(HERE.parent)
                if change=='remote-docker':x['DOCKER_HOST']='tcp://forbidden.invalid:2375'
                if change=='proxy':x['HTTPS_PROXY']='http://forbidden.invalid/'
                if change=='credentials':x['SUPABASE_SERVICE_ROLE_KEY']='synthetic-secret'
                rejects(lambda:execution_guard(x,platform,HERE,head))
        group('executable runner rejects local/non-hosted/foreign source and ambient configuration',environment)

        def registry():
            tag=IMAGE_TAGS['db'];repo=tag.rsplit(':',1)[0]
            r=image_result('db',tag,[repo+'@sha256:'+'1'*64],'sha256:'+'2'*64,'linux','amd64')
            assert r['manifest_digest']=='sha256:'+'1'*64
            for args in [('db',tag,[],r['config_digest'],'linux','amd64'),
                ('db',tag,['foreign/image@sha256:'+'1'*64],r['config_digest'],'linux','amd64'),
                ('db',tag,[repo+'@sha256:'+'1'*64],r['config_digest'],'linux','arm64'),
                ('db','supabase/postgres:latest',[repo+'@sha256:'+'1'*64],r['config_digest'],'linux','amd64')]:
                rejects(lambda:image_result(*args))
        group('image resolution accepts only reviewed repository/tag and linux-amd64 content',registry)

        def config():
            value=compose_fixture(run_id,run_dir,image_raw,digest(image_raw))
            assert set(value['services'])==set(IMAGE_TAGS)
            assert value['networks']['isolated']['internal'] is True and value['networks']['isolated']['external'] is False
            for service in value['services'].values():
                assert '@sha256:' in service['image'] and service['platform']=='linux/amd64' and service['restart']=='no'
                assert service['networks']==['isolated'] and 'network_mode' not in service and 'privileged' not in service
                assert 'ports' not in service
            assert value['networks']['isolated']['driver']=='bridge' and value['networks']['isolated']['enable_ipv6'] is False
            mounts=[r for r in value['services']['db']['volumes'] if type(r) is dict]
            assert len(mounts)==7 and all(r['read_only'] is True for r in mounts)
            assert len(value['volumes'])==3 and all(v['external'] is False for v in value['volumes'].values())
            assert 'auth' in value['services'] and 'storage' in value['services']
        group('compose retains seven official init mounts, real services and private fresh resources',config)

        def ownership_union():
            project='echs-c08-service-'+run_id
            owned='a'*64;orphan='b'*64
            assert resource_candidates('container',[owned],[owned,orphan],[])==[owned,orphan]
            labels={'echs.fixture':project,'echs.run_id':run_id,'com.docker.compose.project':project,'com.docker.compose.service':'db'}
            assert_resource_owner('container',owned,labels,project,run_id)
            rejects(lambda:assert_resource_owner('container',orphan,{'com.docker.compose.project':project,'com.docker.compose.service':'foreign'},project,run_id))
            volume=project+'_db-data'
            assert resource_candidates('volume',[],[],[volume])==[volume]
            rejects(lambda:assert_resource_owner('volume',volume,{},project,run_id))
            rejects(lambda:assert_resource_owner('volume',project+'_foreign',labels,project,run_id))
            rejects(lambda:resource_candidates('container',[],['--unsafe'],[]))
        group('cleanup includes project-only orphans and named unlabelled resources before ownership checks',ownership_union)

        def network_identity():
            n,a,c,p=network_fixture(run_id);receipt=inspect_owned_network(n,a,c,p,run_id)
            result=validate_network_receipt(receipt,run_id)
            assert set(result)==set(PORTS) and result['db']['ipv4']=='172.18.0.2' and result['storage']['port']==5000
            assert receipt['connection_mode']=='owned-internal-bridge' and receipt['published_ports'] is False
        group('exact owned internal bridge and five private addresses produce fixed service endpoints',network_identity)

        def foreign_network():
            for change in ('external','integer','driver','owner','ipv6','public-subnet','outside-subnet','bad-mask','foreign-ip','gateway-ip','extra-member','network-id','second-network','port-binding','host-network'):
                n,a,c,p=network_fixture(run_id);name=n['Name'];member=n['Containers'][c['db']];attached=a['db']['networks'][name]
                if change=='external':n['Internal']=False
                elif change=='integer':n['Internal']=1
                elif change=='driver':n['Driver']='host'
                elif change=='owner':n['Labels']['echs.run_id']='0'*32
                elif change=='ipv6':n['EnableIPv6']=True
                elif change=='public-subnet':n['IPAM']['Config'][0]={'Subnet':'8.8.0.0/16','Gateway':'8.8.0.1'}
                elif change=='outside-subnet':attached['IPAddress']='172.19.0.2';member['IPv4Address']='172.19.0.2/16'
                elif change=='bad-mask':n['IPAM']['Config'][0]['Subnet']='172.18.0.2/16'
                elif change=='foreign-ip':attached['IPAddress']='169.254.169.254';member['IPv4Address']='169.254.169.254/16'
                elif change=='gateway-ip':attached['IPAddress']='172.18.0.1';member['IPv4Address']='172.18.0.1/16'
                elif change=='extra-member':n['Containers']['a'*64]={'IPv4Address':'172.18.0.9/16','IPv6Address':''}
                elif change=='network-id':attached['NetworkID']='e'*64
                elif change=='second-network':a['db']['networks']['foreign']={}
                elif change=='port-binding':a['db']['port_bindings']={'5432/tcp':[{'HostIp':'0.0.0.0','HostPort':'5432'}]}
                else:a['db']['network_mode']='host'
                rejects(lambda:inspect_owned_network(n,a,c,p,run_id))
            bad=copy.deepcopy(run['network']);bad['containers'][0]['port']=5433;rejects(lambda:validate_network_receipt(bad,run_id))
        group('foreign ownership addresses attachments or published ports cannot authorize service access',foreign_network)

        def credentials():
            a=mint_credentials();b=mint_credentials();assert a['JWT_SECRET']!=b['JWT_SECRET'] and a['POSTGRES_PASSWORD']!=b['POSTGRES_PASSWORD']
            for key,role in [('SERVICE_ROLE_KEY','service_role'),('ANON_KEY','anon'),('AUTHENTICATED_KEY','authenticated')]:
                token=a[key];header,payload,signature=token.split('.')
                decode=lambda s:base64.urlsafe_b64decode(s+'='*((-len(s))%4))
                assert json.loads(decode(header))=={'alg':'HS256','typ':'JWT'}
                claims=json.loads(decode(payload));assert claims['role']==role and claims['exp']>claims['iat']
                assert hmac.compare_digest(decode(signature),hmac.new(a['JWT_SECRET'].encode(),(header+'.'+payload).encode(),hashlib.sha256).digest())
            configuration=encoded(compose_fixture(run_id,run_dir,image_raw,digest(image_raw)))
            assert all(value.encode() not in configuration for value in a.values())
        group('generated test JWT roles are signed distinctly and secret values stay outside compose',credentials)

        def safe_command_error():
            try:command([sys.executable,'-c',"raise SystemExit('synthetic-sensitive-sentinel')"],'fixed-stage',{'PATH':os.environ.get('PATH','')},timeout=10)
            except RunnerError as error:assert str(error)=='Isolated service stage failed: fixed-stage' and error.exit_code==1 and error.reason=='nonzero_exit'
            else:raise AssertionError('Expected failing child')
        group('subprocess failure never exposes captured credential-like stderr',safe_command_error)

        def safe_deadline():
            try:command([sys.executable,'-c','import time; time.sleep(2)'],'bounded-stage',{'PATH':os.environ.get('PATH','')},timeout=0.05)
            except RunnerError as error:assert error.exit_code is None and error.reason=='timeout' and error.stage=='bounded-stage'
            else:raise AssertionError('Expected bounded child')
            node=shutil.which('node');assert node
            script="import {safeChildDiagnostic} from "+json.dumps((HERE/'test_service.mjs').as_uri())+"; const e=Object.assign(new Error('synthetic-sensitive-sentinel'),{code:'ENOTFOUND',safeCode:'42501',seedPhase:'database-connect',seedType:'OperationalError',seedExitCode:1,body:'synthetic-sensitive-sentinel'}); console.log(JSON.stringify([safeChildDiagnostic('gateway-listen',e),safeChildDiagnostic('synthetic-sensitive-sentinel',{code:'synthetic-sensitive-sentinel',message:'synthetic-sensitive-sentinel',constructor:{name:'synthetic-sensitive-sentinel'}})]));"
            node_env={'PATH':os.environ.get('PATH','')}
            if sys.platform=='win32':node_env['SystemRoot']=os.environ['SystemRoot']
            result=command([node,'--input-type=module','-e',script],'closed-child-diagnostic',node_env,timeout=10)
            assert b'synthetic-sensitive-sentinel' not in result
            observed=json.loads(result);assert len(observed)==2
            first=validate_child_failure(observed[0]);assert first['phase']=='gateway-listen' and first['code']=='ENOTFOUND' and first['sqlstate']=='42501' and first['seed_error_type']=='OperationalError'
            second=validate_child_failure(observed[1]);assert second['phase']=='entry' and second['code'] is None and second['error_type']=='Error'
            target=run_dir/'service-child-failure.json';target.write_bytes(encoded(first));assert child_failure(run_dir)==first
            for key,value in [('phase','unreviewed'),('error_type','private-body'),('code','arbitrary-value'),('seed_error_type','private-body'),('seed_exit_code',True),('body','synthetic-sensitive-sentinel')]:
                wrong=copy.deepcopy(first);wrong[key]=value;rejects(lambda:validate_child_failure(wrong))
            target.write_bytes(b' '*1025);rejects(lambda:child_failure(run_dir));target.unlink()
        group('stage and timeout diagnostics remain useful without raw child output',safe_deadline)

        def positive_schema():
            index,raw,_=current();assert index['service_groups']==19 and len(raw)==3
            assert index['github_ci_accepted'] is False and index['requires_independent_workflow_metadata'] is True
        group('synthetic execution receipt schema remains separate from GitHub CI acceptance',positive_schema)

        def stale():
            for file,key,value in [('service-run-report.json','head','c'*40),('service-test-results.json','tree','c'*40),
                ('service-test-results.json','source_manifest_sha256','0'*64),('service-run-report.json','source_pins_sha256','0'*64)]:
                x=copy.deepcopy(records[file]);x[key]=value;(run_dir/file).write_bytes(encoded(x));rejects(current);restore()
        group('stale head/tree/runtime source evidence is rejected',stale)

        def false_claims():
            for file,key,value in [('service-run-report.json','services_executed',1),('service-run-report.json','cleanup_complete',False),
                ('service-run-report.json','migrations_applied',True),('service-test-results.json','actual_storage',1),
                ('service-test-results.json','production_calls',0),('service-test-results.json','hosted_edge_executed',True),
                ('service-test-results.json','readiness',{'status':'FAIL','probes':1,'elapsed_ms':1}),
                ('service-run-report.json','network',{})]:
                x=copy.deepcopy(records[file]);x[key]=value;(run_dir/file).write_bytes(encoded(x));rejects(current);restore()
        group('numeric boolean substitutes and incomplete cleanup cannot pass acceptance',false_claims)

        def weakened_cases():
            for change in ('count','missing','failure','name','extra'):
                x=copy.deepcopy(tests)
                if change=='count':x['passed']=18
                if change=='missing':x['groups'].pop()
                if change=='failure':x['groups'][0]['status']='FAIL'
                if change=='name':x['groups'][0]['name']='Different easier case'
                if change=='extra':x['groups'][0]['body']='synthetic-sensitive-sentinel'
                (run_dir/'service-test-results.json').write_bytes(encoded(x));rejects(current);restore()
        group('missing/failing/renamed cases and body-bearing report fields rejected',weakened_cases)

        def image_and_private():
            x=copy.deepcopy(run);x['running_image_ids']['db']='sha256:'+'f'*64
            (run_dir/'service-run-report.json').write_bytes(encoded(x));rejects(current);restore()
            x=copy.deepcopy(run);x['migration_files'][0]['sha256']='0'*64
            (run_dir/'service-run-report.json').write_bytes(encoded(x));rejects(current);restore()
            (run_dir/'secrets').mkdir();rejects(current);(run_dir/'secrets').rmdir()
            (run_dir/'service-run-report.json').write_bytes(b'{"status":"PASS","status":"FAIL"}');rejects(current);restore()
        group('changed image/migration identities, duplicate JSON keys and retained secrets rejected',image_and_private)

        def missing():
            (run_dir/'image-receipt.json').unlink();rejects(current);restore()
        group('missing real image provenance cannot be inferred from test success',missing)

        def artifact():
            index=collect(run_dir,output,head,tree,manifest_hash)
            assert set(p.name for p in output.iterdir())==set(RAW_FILES)|{'source-manifest.json','service-evidence-index.json'}
            assert index['github_ci_accepted'] is False
            before={p.name:p.read_bytes() for p in output.iterdir()}
            rejects(lambda:collect(run_dir,output,head,tree,manifest_hash))
            assert before=={p.name:p.read_bytes() for p in output.iterdir()}
        group('collector copies exactly five safe members and refuses overwrites',artifact)

        def selected_config():
            original=compose_fixture(run_id,run_dir,image_raw,digest(image_raw))
            for major in (15,17):
                receipt=copy.deepcopy(image_receipt);receipt['postgres_required']=major
                for row in receipt['images']:row['tag']=image_tags(major)[row['service']]
                data=encoded(receipt);value=compose_fixture(run_id,run_dir,data,digest(data),major)
                expected=copy.deepcopy(original);expected['services']['db']['image']=image_tags(major)['db']+'@'+receipt['images'][0]['manifest_digest']
                assert value==expected
                rejects(lambda:compose_fixture(run_id,run_dir,data,digest(data),17 if major==15 else 15))
                tag=image_tags(major)['db'];repo=tag.rsplit(':',1)[0]
                assert image_result('db',tag,[repo+'@sha256:'+'1'*64],'sha256:'+'2'*64,'linux','amd64',major)['tag']==tag
                rejects(lambda:image_result('db',tag,[repo+'@sha256:'+'1'*64],'sha256:'+'2'*64,'linux','amd64',17 if major==15 else 15))
        group('both exact managed image variants preserve identical initialization and isolation configuration',selected_config)

        def selected_receipts():
            for major in (15,17):
                receipt=copy.deepcopy(image_receipt);receipt['postgres_required']=major
                for row in receipt['images']:row['tag']=image_tags(major)[row['service']]
                selected=copy.deepcopy(run);selected['postgres_required']=major
                selected['postgres_observation']={'server_version_num':major*10000+6,'server_version':str(major)+'.6 (synthetic)'}
                selected['image_receipt_sha256']=digest(encoded(receipt))
                (run_dir/'image-receipt.json').write_bytes(encoded(receipt));(run_dir/'service-run-report.json').write_bytes(encoded(selected))
                result=accept(run_dir,head,tree,manifest_hash,major)[0]
                assert result['postgres_required']==major and result['postgres_observation']==selected['postgres_observation']
                rejects(lambda:accept(run_dir,head,tree,manifest_hash,17 if major==15 else 15))
                for key,value in [('postgres_required',True),('postgres_required',17 if major==15 else 15),('postgres_observation',{'server_version_num':major*10000+6,'server_version':str(major)+'.7'})]:
                    bad=copy.deepcopy(selected);bad[key]=value;(run_dir/'service-run-report.json').write_bytes(encoded(bad))
                    rejects(lambda:accept(run_dir,head,tree,manifest_hash,major))
                restore()
        group('collector rejects cross-major image runner and observed-version evidence for each configured job',selected_receipts)

        def source_unchanged():assert source_before=={r['path']:digest((HERE/r['path']).read_bytes()) for r in manifest['files']}
        group('all candidate source files remain unchanged after offline tests',source_unchanged)
    finally:
        for directory,parent in ((run_dir,HERE/'runs'),(output,HERE/'results')):
            if directory.exists():
                assert directory.resolve().parent==parent.resolve() and not directory.is_symlink() and not directory.is_junction()
                shutil.rmtree(directory)
    return rows,manifest_hash

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--report',type=Path,default=HERE/'results'/'actual-contract-results.json');args=parser.parse_args()
    assert not args.report.exists(),'Report already exists'
    rows,manifest_hash=suite()
    report={'contract':'echs.c08.actual-service-offline-tests.v1','status':'PASS' if all(r['status']=='PASS' for r in rows) else 'FAIL',
        'passed':sum(r['status']=='PASS' for r in rows),'total':len(rows),'groups':rows,'source_manifest_sha256':manifest_hash,
        'services_executed':False,'hosted_edge_executed':False,'synthetic_receipts_removed':True,
        'source_sha256':{name:digest((HERE/name).read_bytes()) for name in SOURCE_FILES}}
    write_report_exclusive(args.report,report)
    print(json.dumps({'status':report['status'],'passed':report['passed'],'total':report['total'],'services_executed':False}));return 0 if report['status']=='PASS' else 1

if __name__=='__main__':raise SystemExit(main())
