"""Disposable GitHub-hosted Linux service runner. Default is source preflight only.

Execution resolves only reviewed image tags; no raw corpus, hosted project,
production DSN, arbitrary Docker context, broad cleanup, or service-log collection.
"""
from pathlib import Path
import argparse
import importlib.metadata
import ipaddress
import json
import os
import re
import shutil
import subprocess
import sys
import uuid
from fixture_config import compose_fixture,mint_credentials
from generate_tls import generate_tls
from seed_synthetic import load_fixture
from service_contract import HERE,IMAGE_TAGS,UPSTREAM_COMMIT,ContractError,clean_environment,digest,need,strict_json,verify_sources

class RunnerError(RuntimeError):
    def __init__(self,stage,*,exit_code=None,reason='nonzero_exit'):
        self.stage=stage;self.exit_code=exit_code;self.reason=reason
        super().__init__('Isolated service stage failed: '+stage)

SOURCE_FILES=tuple(sorted(('PLAN.md','README.md','source-pins.json','upstream-observation.json',
    'service_contract.py','test_service_contract.py','run_service.py','generate_tls.py','tls-gateway.mjs',
    'test_tls_gateway.mjs','run_tls_test.py','fixture_config.py','run_actual_service.py','seed_synthetic.py',
    'fixture-source-pin.json','runtime/handler.mjs','runtime/transport.mjs','requirements.txt',
    'service-cases.json','test_service.mjs','collect_service.py','test_actual_contract.py')))

def command(args,stage,env,*,data=None,timeout=60):
    try:
        r=subprocess.run(args,input=data,capture_output=True,env=env,timeout=timeout,check=False)
    except subprocess.TimeoutExpired:raise RunnerError(stage,reason='timeout') from None
    except OSError:raise RunnerError(stage,reason='spawn_failed') from None
    if r.returncode:raise RunnerError(stage,exit_code=r.returncode)
    return r.stdout

CHILD_PHASES={'entry','runtime-check','control-config','private-config','tls-trust','resolver-install','gateway-listen','seed-start','seed-ready','runtime-handler','case-source','schema-readiness','service-cases','report-write','cleanup'}
CHILD_CODES={'ENOTFOUND','EAI_AGAIN','EADDRINUSE','EACCES','EPERM','ECONNREFUSED','ECONNRESET','ETIMEDOUT','EPIPE','ENOENT','ERR_TLS_CERT_ALTNAME_INVALID','DEPTH_ZERO_SELF_SIGNED_CERT','UNABLE_TO_VERIFY_LEAF_SIGNATURE','CERT_HAS_EXPIRED','ERR_DLOPEN_FAILED','MODULE_NOT_FOUND','ERR_MODULE_NOT_FOUND','ERR_INVALID_ARG_TYPE','ERR_ASSERTION','CHILD_EXIT'}
CHILD_TYPES={'Error','TypeError','RangeError','SyntaxError','AssertionError','AggregateError','SystemError'}
SEED_PHASES={'entry','configuration','network-validation','fixture-source','driver-import','database-connect','database-identity','controls-ready'}
SEED_TYPES={'Exception','ModuleNotFoundError','ImportError','OperationalError','ProgrammingError','IntegrityError','DataError','InterfaceError','InternalError','NotSupportedError','ContractError','ValueError','KeyError','TypeError','FileNotFoundError','PermissionError','JSONDecodeError'}
def validate_child_failure(value):
    need(type(value) is dict and set(value)=={'contract','status','phase','error_type','code','sqlstate','seed_phase','seed_error_type','seed_exit_code'},'child-diagnostic-shape')
    need(value['contract']=='echs.c08.service-child-failure.v1' and value['status']=='FAIL' and type(value['phase']) is str and value['phase'] in CHILD_PHASES
         and type(value['error_type']) is str and value['error_type'] in CHILD_TYPES,'child-diagnostic-type')
    need(value['code'] is None or type(value['code']) is str and value['code'] in CHILD_CODES,'child-diagnostic-code')
    need(value['sqlstate'] is None or type(value['sqlstate']) is str and re.fullmatch('[0-9A-Z]{5}',value['sqlstate']),'child-diagnostic-sqlstate')
    need(value['seed_phase'] is None or type(value['seed_phase']) is str and value['seed_phase'] in SEED_PHASES,'child-diagnostic-seed')
    need(value['seed_error_type'] is None or type(value['seed_error_type']) is str and value['seed_error_type'] in SEED_TYPES,'child-diagnostic-seed-type')
    need(value['seed_exit_code'] is None or type(value['seed_exit_code']) is int and 0<=value['seed_exit_code']<=255,'child-diagnostic-exit')
    return value

def child_failure(run_dir):
    target=run_dir/'service-child-failure.json'
    if not target.exists():return None
    need(not target.is_symlink() and not target.is_junction(),'linked-child-diagnostic')
    with target.open('rb') as stream:raw=stream.read(1025)
    need(len(raw)<=1024,'child-diagnostic-size')
    return validate_child_failure(strict_json(raw))

def resource_candidates(kind,custom,compose_project,named):
    need(kind in ('container','network','volume'),'resource-kind')
    for values in (custom,compose_project,named):
        need(type(values) is list and len(values)<=256 and all(type(v) is str and re.fullmatch('[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}',v) for v in values),'resource-identifiers')
    # Compose acts on its project label and explicit volume/network names, so a
    # narrower custom-label inventory cannot authorize cleanup.
    return sorted(set(custom)|set(compose_project)|set(named))

def assert_resource_owner(kind,identifier,labels,project,run_id):
    need(type(labels) is dict and labels.get('echs.fixture')==project and labels.get('echs.run_id')==run_id
         and labels.get('com.docker.compose.project')==project,'cleanup-ownership')
    if kind=='network':need(identifier==project+'_internal','cleanup-network')
    elif kind=='volume':need(identifier in {project+'_'+n for n in ('db-data','db-config','storage-data')},'cleanup-volume')
    elif kind=='container':need(labels.get('com.docker.compose.service') in IMAGE_TAGS,'cleanup-container')
    else:raise ContractError('resource-kind')

PORTS={'db':5432,'auth':9999,'rest':3000,'storage':5000,'imgproxy':5001}
PRIVATE_NETS=tuple(ipaddress.IPv4Network(v) for v in ('10.0.0.0/8','172.16.0.0/12','192.168.0.0/16'))
def private_ipv4(value):
    need(type(value) is str,'private-ipv4')
    try:address=ipaddress.IPv4Address(value)
    except ipaddress.AddressValueError:raise ContractError('private-ipv4') from None
    need(str(address)==value and any(address in n for n in PRIVATE_NETS),'private-ipv4');return address

def validate_network_receipt(receipt,run_id):
    need(type(receipt) is dict and set(receipt)=={'contract','connection_mode','network_id','network_name','driver','internal','ipv6','subnet','gateway','containers','published_ports'},'network-receipt')
    need(receipt['contract']=='echs.c08.owned-bridge-network.v1' and receipt['connection_mode']=='owned-internal-bridge'
         and receipt['network_name']=='echs-c08-service-'+run_id+'_internal' and receipt['driver']=='bridge'
         and receipt['internal'] is True and receipt['ipv6'] is False and receipt['published_ports'] is False,'network-receipt')
    need(type(receipt['network_id']) is str and re.fullmatch('[0-9a-f]{64}',receipt['network_id']),'network-id')
    try:subnet=ipaddress.IPv4Network(receipt['subnet'],strict=True)
    except (ValueError,TypeError):raise ContractError('private-subnet') from None
    need(str(subnet)==receipt['subnet'] and 8<=subnet.prefixlen<=29 and any(subnet.subnet_of(n) for n in PRIVATE_NETS),'private-subnet')
    gateway=private_ipv4(receipt['gateway']);need(gateway in subnet and gateway not in (subnet.network_address,subnet.broadcast_address),'network-gateway')
    need(type(receipt['containers']) is list and len(receipt['containers'])==5,'five-network-members')
    seen=set();ips=set();ids=set();result={}
    for row in receipt['containers']:
        need(type(row) is dict and set(row)=={'service','container_id','ipv4','prefix_length','port'},'network-member')
        n=row['service'];need(type(n) is str and n in PORTS and n not in seen,'network-service')
        need(type(row['container_id']) is str and re.fullmatch('[0-9a-f]{64}',row['container_id']) and row['container_id'] not in ids,'network-container')
        ip=private_ipv4(row['ipv4']);need(ip in subnet and ip not in (subnet.network_address,subnet.broadcast_address,gateway) and ip not in ips,'network-member-ip')
        need(type(row['prefix_length']) is int and row['prefix_length']==subnet.prefixlen and type(row['port']) is int and row['port']==PORTS[n],'network-fixed-port')
        seen.add(n);ips.add(ip);ids.add(row['container_id']);result[n]=row
    need([r['service'] for r in receipt['containers']]==list(PORTS),'network-service-order');return result

def inspect_owned_network(network,attachments,containers,project,run_id):
    need(type(network) is dict and network['Name']==project+'_internal' and network['Driver']=='bridge' and network['Scope']=='local'
         and network['Internal'] is True and network['EnableIPv6'] is False,'owned-internal-network')
    assert_resource_owner('network',network['Name'],network['Labels'],project,run_id)
    need(type(network['Id']) is str and re.fullmatch('[0-9a-f]{64}',network['Id']),'network-id')
    need(type(network['IPAM']) is dict and network['IPAM']['Driver']=='default' and type(network['IPAM']['Config']) is list and len(network['IPAM']['Config'])==1,'network-ipam')
    need(type(network['Containers']) is dict and set(network['Containers'])==set(containers.values()) and set(containers)==set(PORTS)
         and type(attachments) is dict and set(attachments)==set(PORTS),'exact-five-network-members')
    config=network['IPAM']['Config'][0];receipt={'contract':'echs.c08.owned-bridge-network.v1','connection_mode':'owned-internal-bridge',
        'network_id':network['Id'],'network_name':network['Name'],'driver':'bridge','internal':True,'ipv6':False,
        'subnet':config['Subnet'],'gateway':config['Gateway'],'containers':[],'published_ports':False}
    for name in PORTS:
        detail=attachments[name]
        need(type(detail) is dict and set(detail)=={'id','network_mode','port_bindings','networks'} and detail['id']==containers[name]
             and detail['network_mode']==network['Name'] and (detail['port_bindings'] is None or type(detail['port_bindings']) is dict and not detail['port_bindings'])
             and type(detail['networks']) is dict and set(detail['networks'])=={network['Name']},'sole-owned-attachment')
        attached=detail['networks'][network['Name']];member=network['Containers'][containers[name]]
        need(attached['NetworkID']==network['Id'] and attached['GlobalIPv6Address']=='' and member['IPv6Address']==''
             and attached['Gateway'] in ('',config['Gateway']),'network-address-family')
        need(type(attached['IPPrefixLen']) is int and member['IPv4Address']==attached['IPAddress']+'/'+str(attached['IPPrefixLen']),'matching-network-address')
        receipt['containers'].append({'service':name,'container_id':containers[name],'ipv4':attached['IPAddress'],'prefix_length':attached['IPPrefixLen'],'port':PORTS[name]})
    validate_network_receipt(receipt,run_id);return receipt

def execution_guard(environ,platform,workspace,expected_head):
    clean_environment(dict(environ))
    need(platform=='linux' and environ.get('GITHUB_ACTIONS')=='true'
         and environ.get('RUNNER_ENVIRONMENT')=='github-hosted','disposable-hosted-runner-only')
    need(re.fullmatch('[0-9a-f]{40}',expected_head or '') and environ.get('GITHUB_SHA')==expected_head,'expected-checkout')
    need(Path(environ.get('GITHUB_WORKSPACE','/not-a-workspace')).resolve()==Path(workspace).resolve(),'runner-workspace')

def image_result(service,tag,repo_digests,config_id,os_name,architecture):
    need(service in IMAGE_TAGS and tag==IMAGE_TAGS[service] and os_name=='linux' and architecture=='amd64','image-platform')
    need(type(repo_digests) is list and type(config_id) is str and re.fullmatch('sha256:[0-9a-f]{64}',config_id),'image-resolution')
    repository=tag.rsplit(':',1)[0]
    matches=[r.split('@')[1] for r in repo_digests if type(r) is str and re.fullmatch(re.escape(repository)+'@sha256:[0-9a-f]{64}',r)]
    need(len(set(matches))==1,'image-repository')
    return {'service':service,'tag':tag,'manifest_digest':matches[0],'config_digest':config_id}

def verify_manifest(raw,expected_hash):
    need(type(expected_hash) is str and re.fullmatch('[0-9a-f]{64}',expected_hash) and digest(raw)==expected_hash,'service-source-manifest')
    manifest=strict_json(raw)
    need(set(manifest)=={'contract','files'} and manifest['contract']=='echs.c08.storage-service-candidate.v1','service-source-manifest')
    names=[]
    for row in manifest['files']:
        need(set(row)=={'path','bytes','sha256'} and type(row['path']) is str and not row['path'].startswith(('runs/','results/')),'service-source-manifest')
        from service_contract import local_file,row_hash
        row_hash(row,local_file(HERE,row['path']));names.append(row['path'])
    need(tuple(names)==SOURCE_FILES,'service-source-manifest')
    return manifest

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--execute',action='store_true');parser.add_argument('--repo',type=Path,default=HERE.parents[1]/'foundations')
    parser.add_argument('--expected-head');parser.add_argument('--source-manifest-sha256')
    args=parser.parse_args();repo=args.repo.resolve()
    verify_sources(repo,HERE/'runtime');load_fixture(repo)
    if not args.execute:
        print(json.dumps({'status':'NOT_EXECUTED','mode':'SOURCE_PREFLIGHT_ONLY','services_executed':False,'migrations_verified':27,'runtime_verified':2,'synthetic_fixture_verified':True}))
        return 0
    execution_guard(os.environ,sys.platform,repo,args.expected_head)
    manifest_raw=(HERE/'source-manifest.json').read_bytes();verify_manifest(manifest_raw,args.source_manifest_sha256)
    need(importlib.metadata.version('cryptography')=='50.0.1' and importlib.metadata.version('psycopg')=='3.2.9','runner-python-dependencies')
    paths={name:shutil.which(name) for name in ('docker','node','git','sudo','timeout')};need(all(paths.values()),'runner-tools')
    run_id=uuid.uuid4().hex;run_dir=HERE/'runs'/run_id;project='echs-c08-service-'+run_id
    for p in (HERE/'runs',HERE,*HERE.parents):
        need(not p.is_symlink() and not p.is_junction(),'linked-run-directory')
    need((HERE/'runs').resolve().parent==HERE.resolve(),'run-directory')
    (HERE/'runs').mkdir(exist_ok=True);need(not run_dir.exists(),'fresh-run-directory');run_dir.mkdir(mode=0o700)
    secret_dir=run_dir/'secrets';secret_dir.mkdir(mode=0o700);(secret_dir/'home').mkdir();(secret_dir/'docker').mkdir()
    env={'PATH':os.environ.get('PATH',''),'HOME':str(secret_dir/'home'),'DOCKER_CONFIG':str(secret_dir/'docker'),'LANG':'C.UTF-8','PYTHONDONTWRITEBYTECODE':'1'}
    stage='preflight';started=False;observed_services=False;cleanup_complete=False;failure=None
    image_receipt=None;metadata=None
    compose=[paths['docker'],'--context','default','compose','--project-name',project,'--env-file',str(secret_dir/'compose.env'),'-f',str(run_dir/'compose.fixture.json')]
    def checked(command_args,label,**kw):
        verify_sources(repo,HERE/'runtime');load_fixture(repo);verify_manifest(manifest_raw,args.source_manifest_sha256)
        result=command(command_args,label,env,**kw)
        verify_sources(repo,HERE/'runtime');verify_manifest(manifest_raw,args.source_manifest_sha256)
        return result
    def docker(*argv,stage='docker',**kw):return checked([paths['docker'],'--context','default',*argv],stage,**kw)
    def rows_for(kind):
        def matching(label):
            if kind=='container':b=docker('ps','-a','--filter','label='+label,'--format','{{.ID}}',stage='cleanup-list')
            else:b=docker(kind,'ls','--filter','label='+label,'--format','{{.Name}}',stage='cleanup-list')
            return [v for v in b.decode().splitlines() if v]
        named=[]
        if kind in ('network','volume'):
            expected={project+'_internal'} if kind=='network' else {project+'_'+n for n in ('db-data','db-config','storage-data')}
            names=docker(kind,'ls','--format','{{.Name}}',stage='cleanup-names').decode().splitlines()
            named=[v for v in names if v in expected]
        return resource_candidates(kind,matching('echs.fixture='+project),matching('com.docker.compose.project='+project),named)
    def assert_owned():
        for kind in ('container','network','volume'):
            for identifier in rows_for(kind):
                if kind=='container':selector='{{json .Config.Labels}}';cmd=['inspect',identifier,'--format',selector]
                else:cmd=[kind,'inspect',identifier,'--format','{{json .Labels}}']
                labels=json.loads(docker(*cmd,stage='cleanup-labels'))
                assert_resource_owner(kind,identifier,labels,project,run_id)
    try:
        stage='checkout'
        head=checked([paths['git'],'-C',str(repo),'rev-parse','HEAD'],'git-head').decode().strip()
        tree=checked([paths['git'],'-C',str(repo),'rev-parse','HEAD^{tree}'],'git-tree').decode().strip()
        need(head==args.expected_head and re.fullmatch('[0-9a-f]{40}',tree),'expected-checkout')
        context=json.loads(docker('context','inspect','default','--format','{{json .Endpoints.docker.Host}}',stage='local-docker-context'))
        need(context=='unix:///var/run/docker.sock','local-docker-socket')
        for kind in ('container','network','volume'):need(not rows_for(kind),'existing-fixture-resource')
        stage='resolve-images';images=[]
        for service,tag in IMAGE_TAGS.items():
            docker('pull','--platform','linux/amd64',tag,stage='pull-'+service,timeout=240)
            values=[]
            for field in ('RepoDigests','Id','Os','Architecture'):
                values.append(json.loads(docker('image','inspect',tag,'--format','{{json .'+field+'}}',stage='image-'+service)))
            images.append(image_result(service,tag,*values))
        image_receipt={'contract':'echs.c08.storage-image-receipt.v1','upstream_commit':UPSTREAM_COMMIT,'platform':'linux/amd64','images':images}
        image_raw=(json.dumps(image_receipt,indent=2)+'\n').encode();(run_dir/'image-receipt.json').write_bytes(image_raw)
        credentials=mint_credentials()
        with (secret_dir/'credentials.json').open('x') as f:json.dump(credentials,f)
        (secret_dir/'credentials.json').chmod(0o600)
        with (secret_dir/'compose.env').open('x') as f:
            for name,value in credentials.items():
                need(re.fullmatch('[A-Z][A-Z0-9_]+',name) and re.fullmatch('[A-Za-z0-9._-]+',value),'generated-environment')
                f.write(name+'='+value+'\n')
        (secret_dir/'compose.env').chmod(0o600)
        tls_receipt=generate_tls(secret_dir/'tls')
        observation=strict_json((HERE/'upstream-observation.json').read_bytes())
        for row in observation['files']:
            dest=run_dir/'upstream'/row['path'];dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(row['content'].encode())
        configuration=compose_fixture(run_id,run_dir,image_raw,digest(image_raw))
        (run_dir/'compose.fixture.json').write_text(json.dumps(configuration,indent=2)+'\n')
        stage='start-services';started=True
        checked(compose+['up','-d','--wait','--wait-timeout','240','--no-build','--pull','never'],'compose-up',timeout=300)
        containers={}
        for name in IMAGE_TAGS:
            identifier=checked(compose+['ps','-q',name],'service-id').decode().strip();need(re.fullmatch('[0-9a-f]{12,64}',identifier),'service-container')
            image_id=json.loads(docker('inspect',identifier,'--format','{{json .Image}}',stage='running-image'))
            need(image_id==next(r['config_digest'] for r in images if r['service']==name),'running-image')
            state=json.loads(docker('inspect',identifier,'--format','{{json .State.Health.Status}}',stage='running-health'))
            need(state=='healthy','managed-service-health');containers[name]=identifier
        observed_services=True;stage='managed-schema'
        psql=[paths['docker'],'--context','default','exec','-i',containers['db'],'psql','-X','-qAt','-v','ON_ERROR_STOP=1','-U','postgres','-d','postgres']
        query="select current_user='postgres' and current_setting('server_version_num')::int/10000=15 and to_regclass('auth.users') is not null and to_regclass('auth.identities') is not null and to_regclass('storage.objects') is not null and to_regclass('storage.buckets') is not null and to_regclass('public.accounts') is null;"
        need(checked(psql,'managed-schema',data=query.encode()).strip()==b't','actual-managed-schema')
        migrations=strict_json((HERE/'source-pins.json').read_bytes())['migrations']
        stage='apply-migrations'
        for row in migrations:checked(psql,'migration-'+row['path'].split('/')[-1],data=(repo/row['path']).read_bytes(),timeout=90)
        sql=("comment on database postgres is '"+project+"'; notify pgrst,'reload schema'; select public.private_bank_snapshot_capabilities()->>'immutable_ready';").encode()
        need(checked(psql,'actual-capability',data=sql).strip()==b'true','actual-sql-capability')
        stage='owned-network';assert_owned()
        network=json.loads(docker('network','inspect',project+'_internal',stage='owned-network-inspect'))
        need(type(network) is list and len(network)==1,'single-owned-network');attachments={}
        for service,identifier in containers.items():
            values=[json.loads(docker('inspect',identifier,'--format','{{json .'+field+'}}',stage='owned-network-'+service))
                for field in ('Id','HostConfig.NetworkMode','HostConfig.PortBindings','NetworkSettings.Networks')]
            attachments[service]=dict(zip(('id','network_mode','port_bindings','networks'),values))
        network_receipt=inspect_owned_network(network[0],attachments,containers,project,run_id)
        control={'project':project,'network':network_receipt,
            'python':sys.executable,'repo':str(repo),'expected_head':head,'expected_tree':tree,'source_manifest_sha256':args.source_manifest_sha256}
        (run_dir/'control.json').write_text(json.dumps(control))
        metadata={'contract':'echs.c08.storage-service-run.v1','status':'RUNNING','run_id':run_id,'head':head,'tree':tree,
            'source_manifest_sha256':args.source_manifest_sha256,'source_pins_sha256':digest((HERE/'source-pins.json').read_bytes()),
            'migration_files':migrations,'image_receipt_sha256':digest(image_raw),'running_image_ids':{r['service']:r['config_digest'] for r in images},
            'managed_schema_probed':True,'migrations_applied':27,'tls':tls_receipt,'network':network_receipt,'services_executed':True,'hosted_edge_executed':False,'corpus_imported':False,
            'tool_versions':{'python':sys.version.split()[0],'node':checked([paths['node'],'--version'],'node-version').decode().strip(),
                'docker':docker('version','--format','{{.Server.Version}}',stage='docker-version').decode().strip(),
                'compose':docker('compose','version','--short',stage='compose-version').decode().strip(),'cryptography':'50.0.1','psycopg':'3.2.9'}}
        stage='actual-service-cases'
        # The fixed runtime origin has no alternate port. Privilege is limited to
        # this ephemeral job's test child binding loopback443; no hosts/trust-store edits.
        checked([paths['sudo'],'-n',paths['timeout'],'--signal=TERM','--kill-after=5s','900s',paths['node'],str(HERE/'test_service.mjs'),str(run_dir)],'actual-service-cases',timeout=915)
        need(child_failure(run_dir) is None,'unexpected-child-failure')
        metadata['status']='PASS'
    except Exception as error:
        failure={'stage':getattr(error,'stage',stage),'type':type(error).__name__,'code':getattr(error,'code',None),
            'exit_code':getattr(error,'exit_code',None),'reason':getattr(error,'reason',None)}
        if stage=='actual-service-cases':
            try:
                child=child_failure(run_dir)
                if child is not None:failure['child']=child
            except Exception:failure['child_diagnostic']='INVALID_OR_UNAVAILABLE'
    finally:
        if started:
            try:
                assert_owned();checked(compose+['down','--volumes','--remove-orphans','--timeout','10'],'owned-cleanup',timeout=90)
                need(all(not rows_for(k) for k in ('container','network','volume')),'cleanup-remnant');cleanup_complete=True
            except Exception as error:failure={'stage':getattr(error,'stage','owned-cleanup'),'type':'CleanupIncomplete','code':getattr(error,'code',None),
                'exit_code':getattr(error,'exit_code',None),'reason':getattr(error,'reason',None)}
        else:cleanup_complete=True
        report=metadata or {'contract':'echs.c08.storage-service-run.v1','run_id':run_id,'services_executed':observed_services,'hosted_edge_executed':False,'corpus_imported':False}
        report['service_start_attempted']=started
        report['status']='FAIL' if failure else 'PASS';report['failure']=failure;report['cleanup_complete']=cleanup_complete
        (run_dir/'service-run-report.json').write_text(json.dumps(report,indent=2)+'\n')
        # Private configuration is never an artifact. Remove only this newly
        # created secret directory after checking its resolved owner path.
        need(secret_dir.resolve().parent==run_dir.resolve() and run_dir.resolve().parent==(HERE/'runs').resolve(),'secret-cleanup-path')
        shutil.rmtree(secret_dir)
    print(json.dumps({'status':report['status'],'run_id':run_id,'services_executed':report['services_executed'],'cleanup_complete':cleanup_complete,'failure':failure}))
    return 1 if failure else 0

if __name__=='__main__':
    try:raise SystemExit(main())
    except (ContractError,RunnerError) as error:
        print(json.dumps({'status':'REJECTED','code':getattr(error,'code',None),'stage':getattr(error,'stage',None),'services_executed':False}));raise SystemExit(1)
