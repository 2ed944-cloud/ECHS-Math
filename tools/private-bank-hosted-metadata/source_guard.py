"""Fixed-source offline/one-GET wrapper. No dependency install or default network."""
import argparse, hashlib, json, os, re, stat, subprocess, sys, types
from pathlib import Path

HERE=Path(__file__).resolve().parent
REPO=HERE.parent.parent
PREFIX='tools/private-bank-hosted-metadata/'
WORKFLOW='.github/workflows/private-bank-hosted-metadata.yml'
FILES=('hosted_contract.py','management_preflight.py','test_management_preflight.py','source_guard.py','README.md')
PATHS=tuple(PREFIX+x for x in FILES)+(WORKFLOW,)
PINNED={
 'hosted_contract.py':(9499,'0aabfd8ecbd0d17ee8fc4165c322112cef4251a39d0044212400349d6df5429a'),
 'management_preflight.py':(6784,'e13ed6cbf9319ba6eb00e49c61b593321498fe566638ef4fc3778573484c59fb'),
 'test_management_preflight.py':(9637,'458bfb109fa512ceb2ae4369a8e26c45e7d69eb87a420c1faa4554f7624e7cc0')}
GROUPS=(
 'production metadata projection excludes names hosts added fields and credentials',
 'wrong project or malformed metadata cannot identify the approved target',
 'database-major match remains distinct from actual schema compatibility',
 'duplicate and oversized or nonobject raw management responses reject',
 'missing malformed and header-injecting tokens reject before HTTP construction',
 'one fixed GET retains verified TLS and sends no body or dynamic endpoint',
 'redirect and denied responses produce only closed status and no second request',
 'content encoding MIME declared and streaming byte budgets reject',
 'transport exceptions are closed codes without arbitrary upstream text',
 'read-loop deadline rejects a late response and closes the connection')
REF='wkqadnfloiohqfnesmyq'

class GuardError(ValueError):pass
def need(value,code):
    if not value:raise GuardError(code)
def sha(raw):return hashlib.sha256(raw).hexdigest()
def strict(raw):
    need(type(raw) is bytes and len(raw)<=262144,'json-budget')
    def pairs(items):
        result={}
        for k,v in items:need(k not in result,'json-duplicate');result[k]=v
        return result
    def invalid(_):raise GuardError('json-nonfinite')
    try:return json.loads(raw.decode('utf-8'),object_pairs_hook=pairs,parse_constant=invalid)
    except (ValueError,UnicodeError):raise GuardError('json-invalid') from None
def write(path,value):
    with path.open('x',encoding='utf-8',newline='\n') as stream:json.dump(value,stream,indent=2);stream.write('\n')
def bounded_file(path,cap):
    need(path.is_file() and not path.is_symlink(),'artifact-file')
    need(0<=path.stat().st_size<=cap,'artifact-budget')
    with path.open('rb') as stream:raw=stream.read(cap+1)
    need(len(raw)<=cap,'artifact-budget');return raw
def git(*args):
    try:return subprocess.check_output(['git',*args],cwd=REPO,stderr=subprocess.DEVNULL,timeout=10)
    except Exception:raise GuardError('git-unavailable') from None
def hex40(v):return type(v) is str and re.fullmatch('[0-9a-f]{40}',v) is not None

def source_snapshot():
    need(Path(git('rev-parse','--show-toplevel').decode().strip()).resolve()==REPO.resolve(),'checkout-root')
    tracked=git('ls-tree','-r','--name-only','HEAD','--',PREFIX).decode().splitlines()
    need(set(tracked)=={PREFIX+x for x in FILES} and len(tracked)==len(FILES),'source-directory-closure')
    result={};buffers={}
    for path in PATHS:
        target=REPO/path
        need(target.is_file() and not target.is_symlink(),'source-file')
        for parent in (target.parent,*target.parent.parents):
            if parent==REPO.parent:break
            need(not parent.is_symlink() and not getattr(parent,'is_junction',lambda:False)(),'source-link')
        raw=target.read_bytes();need(len(raw)<=131072,'source-budget')
        staged=git('ls-tree','HEAD','--',path).decode().strip().split(None,3)
        need(len(staged)==4 and staged[0]=='100644' and staged[1]=='blob','source-mode')
        blob=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
        need(staged[2]==blob and git('cat-file','blob','HEAD:'+path)==raw,'source-checkout-drift')
        name=target.name
        if name in PINNED:need((len(raw),sha(raw))==PINNED[name],'reviewed-reader-drift')
        result[path]={'bytes':len(raw),'sha256':sha(raw),'git_blob_sha':blob};buffers[name]=raw
    return result,buffers

def checkout(mode):
    need(mode in ('offline','metadata'),'mode')
    need(os.environ.get('GITHUB_ACTIONS')=='true','actions-required')
    need(os.environ.get('GITHUB_REPOSITORY')=='2ed944-cloud/ECHS-Math','repository')
    event=os.environ.get('GITHUB_EVENT_NAME');need(event in ('pull_request','push'),'event')
    current=os.environ.get('GITHUB_SHA');need(hex40(current),'head-sha')
    actual=git('rev-parse','HEAD').decode().strip();need(actual==current,'checkout-head')
    tree=git('rev-parse','HEAD^{tree}').decode().strip();need(hex40(tree),'checkout-tree')
    parents=git('show','-s','--format=%P','HEAD').decode().strip().split();need(all(hex40(p) for p in parents),'checkout-parents')
    payload_path=os.environ.get('GITHUB_EVENT_PATH');need(type(payload_path) is str,'event-file')
    payload=strict(Path(payload_path).read_bytes())
    need(type(payload) is dict and payload.get('repository',{}).get('full_name')=='2ed944-cloud/ECHS-Math','event-repository')
    if event=='push':
        need(os.environ.get('GITHUB_REF')=='refs/heads/main' and payload.get('ref')=='refs/heads/main','main-only')
        need(payload.get('after')==current and payload.get('deleted') is False,'push-head')
        base=payload.get('before');need(hex40(base) and base in parents,'push-base')
    else:
        pr=payload.get('pull_request');need(type(pr) is dict,'pr-event')
        base=pr.get('base',{}).get('sha');head=pr.get('head',{}).get('sha')
        need(hex40(base) and hex40(head) and parents==[base,head],'pr-merge-parents')
    changed=git('diff','--name-only',base,'HEAD').decode().splitlines()
    need(changed and len(changed)==len(set(changed)) and set(changed)<=set(PATHS),'change-scope')
    run=os.environ.get('GITHUB_RUN_ID');attempt=os.environ.get('GITHUB_RUN_ATTEMPT')
    need(type(run) is str and re.fullmatch('[1-9][0-9]{0,15}',run),'run-id')
    need(type(attempt) is str and re.fullmatch('[1-9][0-9]{0,3}',attempt),'run-attempt')
    if mode=='metadata':need(event=='push' and attempt=='1','first-main-attempt-only')
    else:need('SUPABASE_ACCESS_TOKEN' not in os.environ,'offline-token-scope')
    sources,buffers=source_snapshot()
    return {'contract':'echs.c08.hosted-metadata-checkout.v1','mode':mode,'repository':'2ed944-cloud/ECHS-Math',
            'event':event,'run_id':int(run),'run_attempt':int(attempt),'tested_sha':actual,'tree_sha':tree,
            'base_sha':base,'parents':parents,'changed_paths':changed,'source_files':sources,
            'frozen_reader_manifest_sha256':'939fadba0557ccb2a4664ca3bf33579fbe3f21c09d044e92e0e5d5a510c11c6e'},buffers

def load(name,raw):
    filename=name+'.py';need(filename in PINNED and (len(raw),sha(raw))==PINNED[filename],'module-pin')
    # These are three fixed, independently reviewed Python source buffers.
    # No response, caller string or repository search path is executable input.
    module=types.ModuleType(name);module.__file__=str(HERE/filename)
    sys.modules[name]=module
    exec(compile(raw,module.__file__,'exec'),module.__dict__)
    return module

def validate_result(value,mode):
    need(type(value) is dict,'result-shape')
    if mode=='offline':
        need(set(value)=={'status','evidence_origin','group_count','groups','real_http_requests','credentials_read','production_requests','production_writes','hosted_execution','module_sha256','test_sha256'},'offline-shape')
        need(value['status']=='PASS' and value['evidence_origin']=='synthetic-mocked-management-only','offline-status')
        need(type(value['group_count']) is int and value['group_count']==10,'offline-count')
        need(value['groups']==[{'name':x,'status':'PASS'} for x in GROUPS],'offline-groups')
        for key in ('real_http_requests','production_requests','production_writes'):need(type(value[key]) is int and value[key]==0,'offline-network')
        for key in ('credentials_read','hosted_execution'):need(value[key] is False,'offline-authority')
        need(value['module_sha256']==PINNED['management_preflight.py'][1] and value['test_sha256']==PINNED['test_management_preflight.py'][1],'offline-source')
        return
    need(mode=='metadata','mode')
    need(set(value)=={'contract','status','evidence_origin','request','source_response_sha256','projection','write_requests','production_metadata_gets','function_invocations','learner_queries','secret_values_persisted','hosted_execution'},'metadata-shape')
    need(value['contract']=='echs.c08.readonly-project-preflight.v1' and value['status']=='READ_ONLY_METADATA_PROJECTED' and value['evidence_origin']=='actual-fixed-management-get','metadata-status')
    need(value['request']=={'method':'GET','host':'api.supabase.com','path':'/v1/projects/'+REF},'metadata-request')
    need(type(value['source_response_sha256']) is str and re.fullmatch('[0-9a-f]{64}',value['source_response_sha256']),'metadata-response-hash')
    for key in ('write_requests','function_invocations','learner_queries'):need(type(value[key]) is int and value[key]==0,'metadata-write')
    need(type(value['production_metadata_gets']) is int and value['production_metadata_gets']==1,'metadata-get')
    for key in ('secret_values_persisted','hosted_execution'):need(value[key] is False,'metadata-authority')
    p=value['projection'];need(type(p) is dict and set(p)=={'project_ref','management_project_id','organization_id','region','status','active_healthy','database_version','database_major_version','matches_tested_pg15_major','database_compatibility_verified','matches_configured_production_project','eligible_for_hosted_fixture_writes'},'projection-shape')
    need(p['project_ref']==REF,'projection-ref')
    for key in ('management_project_id','organization_id'):need(type(p[key]) is str and re.fullmatch('[A-Za-z0-9_-]{1,80}',p[key]),'projection-identity')
    need(type(p['region']) is str and re.fullmatch(r'[a-z]{2}(?:-[a-z]+){1,2}-[1-9]',p['region']),'projection-region')
    need(type(p['status']) is str and re.fullmatch('[A-Z_]{1,40}',p['status']),'projection-status')
    need(type(p['database_version']) is str and re.fullmatch(r'\d{1,2}(?:\.\d{1,9}){1,5}',p['database_version']),'projection-version')
    major=int(p['database_version'].split('.')[0]);need(type(p['database_major_version']) is int and p['database_major_version']==major,'projection-major')
    need(type(p['active_healthy']) is bool and p['active_healthy']==(p['status']=='ACTIVE_HEALTHY'),'projection-health')
    need(type(p['matches_tested_pg15_major']) is bool and p['matches_tested_pg15_major']==(major==15),'projection-match')
    need(p['matches_configured_production_project'] is True,'projection-target')
    for key in ('database_compatibility_verified','eligible_for_hosted_fixture_writes'):need(p[key] is False,'projection-authority')

def assemble(folder,checkout_value,mode):
    need(folder.is_dir() and not folder.is_symlink() and not getattr(folder,'is_junction',lambda:False)(),'artifact-folder')
    need({p.name for p in folder.iterdir()}=={'checkout.json','result.json'},'artifact-input-closure')
    original={p.name:bounded_file(p,262144) for p in folder.iterdir()}
    need(strict(original['checkout.json'])==checkout_value,'artifact-checkout')
    validate_result(strict(original['result.json']),mode)
    need(source_snapshot()[0]==checkout_value['source_files'],'final-source-drift')
    index={'contract':'echs.c08.hosted-metadata-artifact.v1','status':'PASS','mode':mode,
           'tested_sha':checkout_value['tested_sha'],'tree_sha':checkout_value['tree_sha'],
           'files':{name:{'bytes':len(raw),'sha256':sha(raw)} for name,raw in sorted(original.items())},
           'raw_response_persisted':False,'secret_values_persisted':False,'database_hostname_persisted':False,
           'production_writes':0,'hosted_execution':False}
    for name,raw in original.items():need(bounded_file(folder/name,262144)==raw,'artifact-readback-drift')
    index_path=folder/'artifact-index.json'
    index_raw=(json.dumps(index,indent=2)+'\n').encode('utf-8')
    owned=None
    try:
        # Exclusive creation never adopts or overwrites another run's receipt.
        with index_path.open('xb') as stream:
            info=os.fstat(stream.fileno());owned=(info.st_dev,info.st_ino)
            stream.write(index_raw);stream.flush();os.fsync(stream.fileno())
        expected_names={'checkout.json','result.json','artifact-index.json'}
        need({p.name for p in folder.iterdir()}==expected_names,'artifact-final-closure')
        final={name:bounded_file(folder/name,262144) for name in original}
        need(final==original,'artifact-final-report-drift')
        need(strict(final['checkout.json'])==checkout_value,'artifact-final-checkout')
        validate_result(strict(final['result.json']),mode)
        need(source_snapshot()[0]==checkout_value['source_files'],'artifact-final-source-drift')
        # Source checks must not hide a concurrent change to a saved report.
        for name,raw in original.items():need(bounded_file(folder/name,262144)==raw,'artifact-final-report-drift')
        need(bounded_file(index_path,262144)==index_raw,'artifact-index-drift')
        need({p.name for p in folder.iterdir()}==expected_names,'artifact-final-closure')
        need(bounded_file(index_path,262144)==index_raw,'artifact-index-drift')
    except BaseException:
        # Preserve a pre-existing/replacement index and all diagnostic reports.
        # Only this invocation's newly created regular inode may be removed.
        if owned is not None:
            try:
                safe_parents=all(not p.is_symlink() and not getattr(p,'is_junction',lambda:False)() for p in (folder,*folder.parents))
                info=index_path.lstat()
                if safe_parents and stat.S_ISREG(info.st_mode) and (info.st_dev,info.st_ino)==owned:index_path.unlink()
            except FileNotFoundError:pass
        raise
    return index

def output_folder(mode):
    need(mode in ('offline','metadata'),'mode')
    folder=REPO/'artifacts/private-bank-hosted-metadata'/mode
    probe=REPO
    for part in ('artifacts','private-bank-hosted-metadata',mode):
        probe=probe/part
        need(not probe.is_symlink() and not getattr(probe,'is_junction',lambda:False)(),'artifact-parent-link')
    need(folder.resolve().is_relative_to(REPO.resolve()),'artifact-containment')
    need(not folder.exists(),'artifact-directory-exists')
    folder.mkdir(parents=True);return folder

def main():
    parser=argparse.ArgumentParser(description=__doc__);modes=parser.add_mutually_exclusive_group(required=True)
    modes.add_argument('--offline',action='store_true');modes.add_argument('--metadata',action='store_true');args=parser.parse_args()
    need(sys.flags.isolated==1,'isolated-python-required')
    mode='metadata' if args.metadata else 'offline'
    checked,buffers=checkout(mode)
    folder=output_folder(mode)
    write(folder/'checkout.json',checked)
    previous={name:sys.modules.get(name) for name in ('hosted_contract','management_preflight','test_management_preflight')};argv=sys.argv[:]
    try:
        load('hosted_contract',buffers['hosted_contract.py'])
        reader=load('management_preflight',buffers['management_preflight.py'])
        if mode=='offline':
            test=load('test_management_preflight',buffers['test_management_preflight.py'])
            sys.argv=['test_management_preflight.py','--report',str(folder/'result.json')];test.main()
        else:
            sys.argv=['management_preflight.py','--fetch-supplied-project','--report',str(folder/'result.json')];reader.main()
        need(source_snapshot()[0]==checked['source_files'],'post-execution-source-drift')
        assemble(folder,checked,mode)
        print('PASS closed metadata artifact; no writes, deployment or hosted workload')
    finally:
        sys.argv=argv
        for name,old in previous.items():
            if old is None:sys.modules.pop(name,None)
            else:sys.modules[name]=old

if __name__=='__main__':
    try:main()
    except Exception as error:
        # Never include arbitrary exceptions, upstream response text or tokens.
        code=str(error) if type(error).__name__ in ('GuardError','PlanError') and re.fullmatch('[a-z0-9-]{1,80}',str(error)) else 'guard-failed'
        print('FAIL '+code,file=sys.stderr);raise SystemExit(1) from None
