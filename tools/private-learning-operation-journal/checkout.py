"""Bind the actual Actions checkout and its synthetic PostgreSQL service."""
import hashlib,json,os,re,subprocess
from pathlib import Path
from contract import HERE,REPO,OWN_PATHS,REVIEWED_SHA,sources,git,checkout_sources,digest

def main():
    pins,_=sources();tested=git('rev-parse','HEAD');tree=git('rev-parse','HEAD^{tree}')
    assert tested==os.environ['GITHUB_SHA'] and re.fullmatch('[0-9a-f]{40}',tested)
    assert os.environ['GITHUB_REPOSITORY']=='2ed944-cloud/ECHS-Math'
    base=pins['base_sha'];assert git('rev-parse',base+'^{tree}')==pins['base_tree']
    changed=git('diff','--name-only',base,tested).splitlines()
    assert len(changed)==len(OWN_PATHS)==12 and set(changed)==set(OWN_PATHS),'Unexpected changed source path'
    parents=git('rev-list','--parents','-n','1','HEAD').split()[1:]
    event=json.loads(Path(os.environ['GITHUB_EVENT_PATH']).read_text());kind=os.environ['GITHUB_EVENT_NAME'];head=None;number=None
    if kind=='pull_request':
        pr=event['pull_request'];head=pr['head']['sha'];number=event['number']
        assert type(number) is int and number>0 and pr['base']['sha']==base
        assert pr['base']['repo']['full_name']==os.environ['GITHUB_REPOSITORY']
        assert parents==[base,head] and git('rev-parse',head+'^{tree}')==tree
    else:
        assert kind=='workflow_dispatch';subprocess.run(['git','merge-base','--is-ancestor',base,tested],cwd=REPO,check=True)
    rows=[]
    for name in sorted(set(OWN_PATHS)|{r['path'] for r in pins['files']}):
        raw=(REPO/name).read_bytes();blob=git('rev-parse',tested+':'+name)
        assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==blob
        if name not in OWN_PATHS:assert git('rev-parse',base+':'+name)==blob,'Existing prerequisite changed'
        rows.append({'path':name,'bytes':len(raw),'sha256':digest(raw),'git_blob_sha':blob})
    assert len(rows)==57
    container=os.environ['TEST_POSTGRES_CONTAINER'];assert re.fullmatch('[0-9a-f]{12,64}',container)
    inspected=json.loads(subprocess.check_output(['docker','inspect','--type','container',container],text=True))
    assert type(inspected) is list and len(inspected)==1
    actual=inspected[0];assert actual['Config']['Image']=='postgres:15' and actual['State']['Running'] is True
    image=actual['Image'];assert type(image) is str and re.fullmatch('sha256:[0-9a-f]{64}',image)
    digests=json.loads(subprocess.check_output(['docker','image','inspect','--format','{{json .RepoDigests}}',image],text=True))
    receipt={'contract':'echs.c04.operation-journal-checkout.v1','status':'EXACT JOURNAL SOURCE CHECKOUT VERIFIED',
        'event':kind,'tested_sha':tested,'tested_tree':tree,'parents':parents,'base_sha':base,'base_tree':pins['base_tree'],
        'pr_head_sha':head,'pr_number':number,'owned_paths':list(OWN_PATHS),'source_files':rows,
        'input_pins_sha256':digest((HERE/'input-pins.json').read_bytes()),'reviewed_checks_sha256':REVIEWED_SHA,
        'postgres_image':{'configured':'postgres:15','image_id':image,'repo_digests':digests},
        'sql_location':'tools/private-learning-operation-journal/operation-journal.sql','production_migration':False,'production_calls':0}
    checkout_sources(receipt)
    target=HERE/'results';target.mkdir(exist_ok=True)
    with (target/'checkout.json').open('x',encoding='utf-8') as output:output.write(json.dumps(receipt,indent=2)+'\n')
    print(json.dumps({'status':receipt['status'],'source_files':57,'changed_paths':12}))

if __name__=='__main__':main()
