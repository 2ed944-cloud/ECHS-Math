"""Disposable GitHub-hosted Linux service runner. Default is source preflight only.

Execution resolves only reviewed image tags; no raw corpus, hosted project,
production DSN, arbitrary Docker context, broad cleanup, or service-log collection.
"""
from pathlib import Path
import argparse
import importlib.metadata
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
        ports={}
        for service,target in [('db','5432'),('rest','3000'),('storage','5000')]:
            value=checked(compose+['port',service,target],'loopback-port').decode().strip()
            need(re.fullmatch(r'127\.0\.0\.1:[1-9][0-9]{0,4}',value),'loopback-port')
            ports[service]=int(value.split(':')[1]);need(ports[service]<=65535,'loopback-port')
        control={'project':project,'db_port':ports['db'],'rest_port':ports['rest'],'storage_port':ports['storage'],
            'python':sys.executable,'repo':str(repo),'expected_head':head,'expected_tree':tree,'source_manifest_sha256':args.source_manifest_sha256}
        (run_dir/'control.json').write_text(json.dumps(control))
        metadata={'contract':'echs.c08.storage-service-run.v1','status':'RUNNING','run_id':run_id,'head':head,'tree':tree,
            'source_manifest_sha256':args.source_manifest_sha256,'source_pins_sha256':digest((HERE/'source-pins.json').read_bytes()),
            'migration_files':migrations,'image_receipt_sha256':digest(image_raw),'running_image_ids':{r['service']:r['config_digest'] for r in images},
            'managed_schema_probed':True,'migrations_applied':27,'tls':tls_receipt,'services_executed':True,'hosted_edge_executed':False,'corpus_imported':False,
            'tool_versions':{'python':sys.version.split()[0],'node':checked([paths['node'],'--version'],'node-version').decode().strip(),
                'docker':docker('version','--format','{{.Server.Version}}',stage='docker-version').decode().strip(),
                'compose':docker('compose','version','--short',stage='compose-version').decode().strip(),'cryptography':'50.0.1','psycopg':'3.2.9'}}
        stage='actual-service-cases'
        # The fixed runtime origin has no alternate port. Privilege is limited to
        # this ephemeral job's test child binding loopback443; no hosts/trust-store edits.
        checked([paths['sudo'],'-n',paths['timeout'],'--signal=TERM','--kill-after=5s','900s',paths['node'],str(HERE/'test_service.mjs'),str(run_dir)],'actual-service-cases',timeout=915)
        metadata['status']='PASS'
    except Exception as error:
        failure={'stage':getattr(error,'stage',stage),'type':type(error).__name__,'code':getattr(error,'code',None),
            'exit_code':getattr(error,'exit_code',None),'reason':getattr(error,'reason',None)}
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
