"""Bind real Actions checkout and service image; standard library only."""
import hashlib,json,os,re,subprocess
from pathlib import Path
from contract import HERE,REPO,OWN_PATHS,sources,git,checkout_sources,digest,checkout_event

def main():
    pins,_=sources();tested=git('rev-parse','HEAD');tree=git('rev-parse','HEAD^{tree}')
    assert tested==os.environ['GITHUB_SHA'] and re.fullmatch('[0-9a-f]{40}',tested)
    assert os.environ['GITHUB_REPOSITORY']=='2ed944-cloud/ECHS-Math'
    assert git('rev-parse',pins['base_sha']+'^{tree}')==pins['base_tree']
    assert git('merge-base',pins['base_sha'],tested)==pins['base_sha'],'Historical source baseline is not an ancestor'
    event=json.loads(Path(os.environ['GITHUB_EVENT_PATH']).read_text())
    context=checkout_event(os.environ['GITHUB_EVENT_NAME'],event,tested,tree,git)
    rows=[]
    for name in sorted(set(OWN_PATHS)|{r['path'] for r in pins['files']}):
        raw=(REPO/name).read_bytes();blob=git('rev-parse',tested+':'+name)
        assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==blob
        rows.append({'path':name,'bytes':len(raw),'sha256':digest(raw),'git_blob_sha':blob})
    assert len(rows)==45
    container=os.environ['TEST_POSTGRES_CONTAINER'];assert re.fullmatch('[0-9a-f]{12,64}',container)
    image=subprocess.check_output(['docker','inspect','--format','{{.Image}}',container],text=True).strip()
    assert re.fullmatch('sha256:[0-9a-f]{64}',image)
    digests=json.loads(subprocess.check_output(['docker','image','inspect','--format','{{json .RepoDigests}}',image],text=True))
    assert isinstance(digests,list) and digests and all(isinstance(v,str) and re.fullmatch('[A-Za-z0-9./_-]+@sha256:[0-9a-f]{64}',v) for v in digests)
    receipt={'status':'EXACT OWNER-FENCE SOURCE CHECKOUT VERIFIED',**context,'source_baseline_sha':pins['base_sha'],'source_baseline_tree':pins['base_tree'],'owned_paths':list(OWN_PATHS),'source_files':rows,
             'input_pins_sha256':digest((HERE/'input-pins.json').read_bytes()),'postgres_image':{'configured':'postgres:15','image_id':image,'repo_digests':digests},
             'sql_location':'tools/private-learning-owner-fence/owner-fence.sql','production_migration':False,'production_calls':0}
    checkout_sources(receipt)
    target=HERE/'results';target.mkdir(exist_ok=True)
    with (target/'checkout.json').open('x',encoding='utf-8') as output:output.write(json.dumps(receipt,indent=2)+'\n')
    print(json.dumps({'status':receipt['status'],'source_files':45,'changed_paths':len(context['changed_paths'])}))

if __name__=='__main__':main()
