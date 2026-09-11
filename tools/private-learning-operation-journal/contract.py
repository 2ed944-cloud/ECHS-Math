"""Portable journal source/checkout boundaries; no import-time I/O or driver."""
import ast,hashlib,importlib.util,json,re,subprocess,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
REPO=HERE.parent.parent
FENCE=REPO/'tools/private-learning-owner-fence'
WORKFLOW='.github/workflows/private-learning-operation-journal.yml'
REVIEWED_SHA='3ed2b46e791ea79d94fd4e186acec3afa8075b6967ae2b9bae5414ce2a1b3537'
INPUT_SHA='d50db08d63bf85fdec0cf030e01f9695d637b06569ad6a3fdfd2304f4d472ee2'
NAMES=('operation-journal.sql','contract.py','test_journal.py','run_integration.py','test_local.py','input-pins.json','README.md',
       'checkout.py','assemble.py','test_actions.py','reviewed-checks.json')
OWN_PATHS=tuple('tools/private-learning-operation-journal/'+p for p in NAMES)+(WORKFLOW,)
CHECKOUT_KEYS={'contract','status','event','tested_sha','tested_tree','parents','base_sha','base_tree','pr_head_sha','pr_number',
              'owned_paths','source_files','input_pins_sha256','reviewed_checks_sha256','postgres_image','sql_location','production_migration','production_calls'}

def digest(raw):return hashlib.sha256(raw).hexdigest()

def reviewed():
    raw=(HERE/'reviewed-checks.json').read_bytes();assert digest(raw)==REVIEWED_SHA,'Reviewed source contract changed'
    value=json.loads(raw);assert value['contract']=='echs.c04.operation-journal-reviewed-checks.v1'
    assert value['frozen_candidate_manifest_sha256']=='f777e16014893bff212019e919b8c6783d010b0fc44e15d365271cf4fcc7f9f0'
    assert value['design_manifest_sha256']=='dd02c3fa2a7114f0e81afcd3b0e6de931119d9991e993f0c8c721b7117db422d'
    return value

def sources(repo=None):
    repo=REPO if repo is None else Path(repo)
    raw=(HERE/'input-pins.json').read_bytes();assert digest(raw)==INPUT_SHA,'Journal prerequisite manifest changed'
    pins=json.loads(raw);reference=reviewed()
    assert set(pins)=={'contract','status','base_sha','base_tree','files','reviewed_checks_sha256','original_migrations','unchanged_owner_fence_sources','production_calls'}
    assert pins['contract']=='echs.c04.operation-journal-inputs.v2' and pins['status']=='EXACT POST-PR373 BASE PINNED'
    assert type(pins['base_sha']) is str and re.fullmatch('[0-9a-f]{40}',pins['base_sha'])
    assert type(pins['base_tree']) is str and re.fullmatch('[0-9a-f]{40}',pins['base_tree'])
    assert pins['reviewed_checks_sha256']==REVIEWED_SHA
    assert type(pins['original_migrations']) is int and pins['original_migrations']==27
    assert type(pins['unchanged_owner_fence_sources']) is int and pins['unchanged_owner_fence_sources']==12
    assert type(pins['production_calls']) is int and pins['production_calls']==0
    rows=pins['files'];assert rows==reference['inputs'] and len(rows)==45 and len({r['path'] for r in rows})==45
    assert sum(r['kind']=='owner_fence' for r in rows)==12
    for row in rows:
        assert set(row)=={'path','bytes','sha256','kind'} and type(row['bytes']) is int and row['bytes']>0
        assert re.fullmatch('[A-Za-z0-9._/-]+',row['path']) and '..' not in row['path'].split('/')
        assert re.fullmatch('[0-9a-f]{64}',row['sha256'])
        data=(repo/row['path']).read_bytes()
        assert len(data)==row['bytes'] and digest(data)==row['sha256'],'Prerequisite source changed: '+row['path']
    migrations=[r for r in rows if r['path'].startswith('supabase/migrations/')]
    assert len(migrations)==27 and migrations[-1]['path'].endswith('202609090003_private_bank_snapshots.sql')
    assert sorted(p.name for p in (repo/'supabase/migrations').glob('*.sql'))==[r['path'].split('/')[-1] for r in migrations]
    repair=reference['sql_repair']
    original=next(r for r in reference['frozen_candidate_files'] if r['path']=='operation-journal.sql')
    assert repair['original_sql']=={key:original[key] for key in ('bytes','sha256')}
    assert repair['fixture_unchanged'] is True and repair['first_ci']['accepted'] is False
    assert repair['successor_actual_sql_acceptance'] is False
    for name in ('operation-journal.sql','test_journal.py'):
        pin=repair['repaired_sql'] if name=='operation-journal.sql' else next(r for r in reference['frozen_candidate_files'] if r['path']==name)
        raw=(HERE/name).read_bytes()
        assert len(raw)==pin['bytes'] and digest(raw)==pin['sha256'],'Frozen SQL repair or test fixture changed'
    return pins,migrations

def snapshot():
    sources()
    return {name:{'bytes':len(raw),'sha256':digest(raw)} for name in NAMES+(WORKFLOW,)
            for raw in [((REPO/name) if name==WORKFLOW else (HERE/name)).read_bytes()]}

def unchanged(expected):assert snapshot()==expected,'Journal candidate changed during execution'

def sql_buffers(expected,pins):
    fence_pin=next(r for r in pins['files'] if r['path']=='tools/private-learning-owner-fence/owner-fence.sql')
    result=[]
    for path,pin in ((FENCE/'owner-fence.sql',fence_pin),(HERE/'operation-journal.sql',expected['operation-journal.sql'])):
        raw=path.read_bytes();assert len(raw)==pin['bytes'] and digest(raw)==pin['sha256'],'Executed SQL buffer differs from pin'
        result.append(raw.decode('utf-8'))
    return tuple(result)

def connection_guard(info,prefix):
    assert prefix in ('echs_membership_test_journal_','echs_bank_test_journal_')
    assert set(info)<={'host','port','dbname','user','password','sslmode','connect_timeout','application_name'}
    assert info.get('host') in ('127.0.0.1','localhost','::1')
    assert type(info.get('dbname')) is str and re.fullmatch(re.escape(prefix)+'[a-z0-9_]{1,32}',info['dbname']) and len(info['dbname'])<=63
    assert re.fullmatch('[1-9][0-9]{0,4}',info.get('port','5432')) and int(info.get('port','5432'))<=65535
    return '::1' if info['host']=='::1' else '127.0.0.1'

def connected(db,info,address):
    assert db.info.hostaddr==address and db.info.dbname==info['dbname']
    assert int(db.execute('show server_version_num').fetchone()[0])//10000==15

def load_fence():
    old=sys.modules.get('contract')
    try:
        spec=importlib.util.spec_from_file_location('contract',FENCE/'contract.py');companion=importlib.util.module_from_spec(spec)
        sys.modules['contract']=companion;spec.loader.exec_module(companion)
        spec=importlib.util.spec_from_file_location('unchanged_journal_fence_fixture',FENCE/'test_fence.py')
        module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
        labels=companion.expected_labels();assert len(labels)==123 and labels==reviewed()['checks']['fence']
        return module,labels
    finally:
        if old is None:sys.modules.pop('contract',None)
        else:sys.modules['contract']=old

def planned_labels():
    tree=ast.parse((HERE/'test_journal.py').read_text(encoding='utf-8'))
    values=[n.value for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='EXPECTED_LABELS' for t in n.targets)]
    assert len(values)==1;labels=ast.literal_eval(values[0])
    assert type(labels) is tuple and len(labels)==48 and len(labels)==len(set(labels))
    expected=[r['label'] for r in reviewed()['design_case_map'] if r['id']!='J049']
    assert list(labels)==expected
    return list(labels)

def local_labels():
    tree=ast.parse((HERE/'test_local.py').read_text(encoding='utf-8'))
    classes=[n for n in tree.body if isinstance(n,ast.ClassDef) and n.name=='Guards'];assert len(classes)==1
    names=sorted(n.name for n in classes[0].body if isinstance(n,ast.FunctionDef) and n.name.startswith('test_'))
    assert len(names)==14 and len(set(names))==14
    return names

def actions_labels():
    tree=ast.parse((HERE/'test_actions.py').read_text(encoding='utf-8'))
    values=[n.value for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='EXPECTED_LABELS' for t in n.targets)]
    assert len(values)==1;labels=ast.literal_eval(values[0])
    assert type(labels) in (tuple,list) and 10<=len(labels)<=40 and len(labels)==len(set(labels))
    assert all(type(x) is str and 0<len(x)<=250 for x in labels)
    return list(labels)

def git(*args):return subprocess.check_output(['git',*args],cwd=REPO,text=True).strip()

def checkout_sources(value,verify_git=True):
    pins,_=sources();assert type(value) is dict and set(value)==CHECKOUT_KEYS
    assert value['contract']=='echs.c04.operation-journal-checkout.v1' and value['status']=='EXACT JOURNAL SOURCE CHECKOUT VERIFIED'
    assert value['base_sha']==pins['base_sha'] and value['base_tree']==pins['base_tree']
    for key in ('tested_sha','tested_tree'):assert type(value[key]) is str and re.fullmatch('[0-9a-f]{40}',value[key])
    assert value['event'] in ('pull_request','workflow_dispatch') and type(value['parents']) is list and 1<=len(value['parents'])<=2
    assert all(type(x) is str and re.fullmatch('[0-9a-f]{40}',x) for x in value['parents'])
    if value['event']=='pull_request':
        assert type(value['pr_number']) is int and value['pr_number']>0
        assert type(value['pr_head_sha']) is str and re.fullmatch('[0-9a-f]{40}',value['pr_head_sha'])
        assert value['parents']==[pins['base_sha'],value['pr_head_sha']]
    else:assert value['pr_number'] is None and value['pr_head_sha'] is None
    assert value['owned_paths']==list(OWN_PATHS) and len(OWN_PATHS)==12
    assert value['input_pins_sha256']==digest((HERE/'input-pins.json').read_bytes()) and value['reviewed_checks_sha256']==REVIEWED_SHA
    assert value['sql_location']=='tools/private-learning-operation-journal/operation-journal.sql'
    assert value['production_migration'] is False and type(value['production_calls']) is int and value['production_calls']==0
    image=value['postgres_image'];assert type(image) is dict and set(image)=={'configured','image_id','repo_digests'} and image['configured']=='postgres:15'
    assert type(image['image_id']) is str and re.fullmatch('sha256:[0-9a-f]{64}',image['image_id'])
    assert type(image['repo_digests']) is list and 1<=len(image['repo_digests'])<=8 and len(set(image['repo_digests']))==len(image['repo_digests'])
    assert all(type(x) is str and re.fullmatch('[A-Za-z0-9./_-]+@sha256:[0-9a-f]{64}',x) for x in image['repo_digests'])
    expected=set(OWN_PATHS)|{r['path'] for r in pins['files']};assert len(expected)==57
    rows=value['source_files'];assert type(rows) is list and len(rows)==57
    assert all(type(r) is dict and set(r)=={'path','bytes','sha256','git_blob_sha'} for r in rows)
    assert {r['path'] for r in rows}==expected
    for row in rows:
        assert type(row['bytes']) is int and 0<row['bytes']<=16777216
        assert type(row['sha256']) is str and re.fullmatch('[0-9a-f]{64}',row['sha256'])
        assert type(row['git_blob_sha']) is str and re.fullmatch('[0-9a-f]{40}',row['git_blob_sha'])
        raw=(REPO/row['path']).read_bytes();assert len(raw)==row['bytes'] and digest(raw)==row['sha256'],'Checkout source bytes changed'
        assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==row['git_blob_sha'],'Checkout source blob changed'
    if verify_git:
        assert git('rev-parse','HEAD')==value['tested_sha'] and git('rev-parse','HEAD^{tree}')==value['tested_tree']
        assert git('rev-parse',pins['base_sha']+'^{tree}')==pins['base_tree']
        assert git('rev-list','--parents','-n','1','HEAD').split()[1:]==value['parents']
        assert set(git('diff','--name-only',pins['base_sha'],value['tested_sha']).splitlines())==set(OWN_PATHS)
        if value['event']=='pull_request':assert git('rev-parse',value['pr_head_sha']+'^{tree}')==value['tested_tree']
        for row in rows:
            assert git('rev-parse',value['tested_sha']+':'+row['path'])==row['git_blob_sha']
            if row['path'] not in OWN_PATHS:assert git('rev-parse',pins['base_sha']+':'+row['path'])==row['git_blob_sha']
