"""Local-only source and connection boundaries; no I/O on import."""
from pathlib import Path
import ast,hashlib,json,re,subprocess
HERE=Path(__file__).resolve().parent
REPO=HERE.parent.parent
WORKFLOW='.github/workflows/private-learning-owner-fence.yml'
NAMES=('owner-fence.sql','contract.py','test_fence.py','run_integration.py','input-pins.json','source-audit.json','test_local.py','README.md','checkout.py','assemble.py','test_actions.py')
OWN_PATHS=tuple('tools/private-learning-owner-fence/'+p for p in NAMES)+(WORKFLOW,)
REPOSITORY_INPUTS=('supabase/migrations/202607260001_institutional_platform.sql', 'supabase/migrations/202607260002_bootstrap_function_repair.sql', 'supabase/migrations/202607260003_login_authentication_repair.sql', 'supabase/migrations/202607270001_session_lookup_repair.sql', 'supabase/migrations/202607272001_mastery_evidence_foundation.sql', 'supabase/migrations/202607272002_mastery_authority_guard.sql', 'supabase/migrations/202607272003_attempt_trust_guard.sql', 'supabase/migrations/202607272004_atomic_skill_mapping.sql', 'supabase/migrations/202607272101_private_bank_foundation.sql', 'supabase/migrations/202607272102_private_attempt_trust_bridge.sql', 'supabase/migrations/202607272201_teacher_upload_manager.sql', 'supabase/migrations/202607282330_verified_private_bank_import.sql', 'supabase/migrations/202607290001_raise_teacher_upload_bucket_limit.sql', 'supabase/migrations/202607291900_resumable_private_bank_course_purge.sql', 'supabase/migrations/202607300020_sync_private_bank_mapping_indexes.sql', 'supabase/migrations/202607301500_private_bank_practice_inventory.sql', 'supabase/migrations/202607312230_restore_ib_current_bank_practice_visibility.sql', 'supabase/migrations/202608020002_assignment_routes_and_timetables.sql', 'supabase/migrations/202608300001_lesson_visibility_progression.sql', 'supabase/migrations/202609050100_ib_readiness_pathway_engine.sql', 'supabase/migrations/202609080001_curriculum_versions.sql', 'supabase/migrations/202609080002_lesson_persistence.sql', 'supabase/migrations/202609080003_lesson_content_v2.sql', 'supabase/migrations/202609080004_lesson_media.sql', 'supabase/migrations/202609090001_lesson_draft_recovery.sql', 'supabase/migrations/202609090002_membership_authorization.sql', 'supabase/migrations/202609090003_private_bank_snapshots.sql', 'supabase/functions/mastery-evidence/index.ts', 'supabase/functions/institution-api/index.ts', 'supabase/functions/learning-sync/index.ts', 'tools/test_membership_authorization_database.py', 'tools/test_private_snapshot_database.py', 'tools/private_snapshot_fixture.py')
TABLES=('assignment_results','learning_attempts','learning_sessions','lesson_completions','mastery_records','review_items')
def digest(raw):return hashlib.sha256(raw).hexdigest()
def sources(repo=REPO):
    pins=json.loads((HERE/'input-pins.json').read_text())
    assert pins['contract']=='echs.c04.owner-fence-inputs.v1' and len(pins['files'])==33
    assert len({r['path'] for r in pins['files']})==33 and {r['path'] for r in pins['files']}==set(REPOSITORY_INPUTS)
    assert re.fullmatch('[0-9a-f]{40}',pins['base_sha']) and re.fullmatch('[0-9a-f]{40}',pins['base_tree'])
    for row in pins['files']:
        assert re.fullmatch(r'[A-Za-z0-9._/-]+',row['path']) and '..' not in row['path'].split('/')
        raw=(repo/row['path']).read_bytes();assert len(raw)==row['bytes'] and digest(raw)==row['sha256'],'Pinned source changed'
    migrations=[r for r in pins['files'] if r['path'].startswith('supabase/migrations/')]
    assert len(migrations)==27 and migrations[-1]['path'].endswith('202609090003_private_bank_snapshots.sql')
    assert sorted(p.name for p in (repo/'supabase/migrations').glob('*.sql'))==[r['path'].split('/')[-1] for r in migrations]
    return pins,migrations

def labels_from_source(source):
    """Read only literal report-label control flow; never eval or execute SQL tests."""
    module=ast.parse(source);functions=[n for n in module.body if isinstance(n,ast.FunctionDef) and n.name=='exercise'];assert len(functions)==1
    labels=[]
    def value(node,scope):
        if isinstance(node,ast.Constant) and isinstance(node.value,(str,int)):return node.value
        if isinstance(node,(ast.List,ast.Tuple)):return [value(n,scope) for n in node.elts]
        if isinstance(node,ast.Name):return scope[node.id]
        if isinstance(node,ast.BinOp) and isinstance(node.op,ast.Add):return value(node.left,scope)+value(node.right,scope)
        if isinstance(node,ast.Subscript):return value(node.value,scope)[value(node.slice,scope)]
        if isinstance(node,ast.Call) and isinstance(node.func,ast.Attribute) and node.func.attr=='split' and not node.args and not node.keywords:return value(node.func.value,scope).split()
        raise AssertionError('Unsupported report-label expression')
    def reports(nodes):
        for node in nodes:
            if isinstance(node,(ast.FunctionDef,ast.ClassDef)):continue
            if isinstance(node,ast.Expr) and isinstance(node.value,ast.Call) and isinstance(node.value.func,ast.Name) and node.value.func.id in ('passed','rejected'):return True
            for field in ('body','orelse','finalbody'):
                if reports(getattr(node,field,[])):return True
        return False
    def walk(nodes,scope):
        for node in nodes:
            if isinstance(node,(ast.FunctionDef,ast.ClassDef)):continue
            if isinstance(node,ast.Expr) and isinstance(node.value,ast.Call) and isinstance(node.value.func,ast.Name) and node.value.func.id in ('passed','rejected'):
                labels.append(value(node.value.args[0],scope))
            elif isinstance(node,ast.For) and reports(node.body):
                assert isinstance(node.target,ast.Name) and not node.orelse
                for item in value(node.iter,scope):walk(node.body,{**scope,node.target.id:item})
            elif isinstance(node,ast.With):walk(node.body,scope)
            elif isinstance(node,(ast.If,ast.Try,ast.While)) and reports([node]):raise AssertionError('Conditional report labels require review')
    walk(functions[0].body,{'TABLES':TABLES})
    assert 50<=len(labels)<=250 and len(set(labels))==len(labels) and all(isinstance(s,str) and 0<len(s)<=1000 for s in labels)
    return labels

def expected_labels():return labels_from_source((HERE/'test_fence.py').read_text(encoding='utf-8'))

def git(*args):return subprocess.check_output(['git',*args],cwd=REPO,text=True).strip()

def checkout_sources(checkout):
    pins,_=sources();expected=set(OWN_PATHS)|{r['path'] for r in pins['files']}
    assert len(expected)==45 and checkout['status']=='EXACT OWNER-FENCE SOURCE CHECKOUT VERIFIED'
    assert checkout['source_baseline_sha']==pins['base_sha'] and checkout['source_baseline_tree']==pins['base_tree']
    validate_checkout_event(checkout,git)
    assert checkout['owned_paths']==list(OWN_PATHS)
    assert checkout['input_pins_sha256']==digest((HERE/'input-pins.json').read_bytes())
    rows=checkout['source_files'];assert isinstance(rows,list) and len(rows)==45 and {r['path'] for r in rows}==expected
    for row in rows:
        assert set(row)=={'path','bytes','sha256','git_blob_sha'} and type(row['bytes']) is int and 0<=row['bytes']<=16777216
        assert re.fullmatch('[0-9a-f]{64}',row['sha256']) and re.fullmatch('[0-9a-f]{40}',row['git_blob_sha'])
        raw=(REPO/row['path']).read_bytes();assert len(raw)==row['bytes'] and digest(raw)==row['sha256'],'Checkout source bytes changed'
        assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==row['git_blob_sha'],'Checkout blob changed'
    assert re.fullmatch('[0-9a-f]{40}',checkout['tested_sha']) and re.fullmatch('[0-9a-f]{40}',checkout['tested_tree'])
    assert git('rev-parse','HEAD')==checkout['tested_sha'] and git('rev-parse','HEAD^{tree}')==checkout['tested_tree']

def checkout_event(kind,event,tested,tree,read_git):
    """Bind this actual event, including a PR whose head predates its base."""
    valid=lambda value:type(value) is str and re.fullmatch('[0-9a-f]{40}',value)
    assert valid(tested) and valid(tree)
    assert read_git('rev-parse','HEAD')==tested and read_git('rev-parse','HEAD^{tree}')==tree
    parents=read_git('rev-list','--parents','-n','1','HEAD').split()[1:]
    assert parents and all(valid(value) for value in parents)
    head=number=None
    if kind=='pull_request':
        pr=event['pull_request'];base=pr['base']['sha'];head=pr['head']['sha'];number=event['number']
        assert valid(base) and valid(head) and type(number) is int and number>0
        assert pr['base']['repo']['full_name']=='2ed944-cloud/ECHS-Math' and parents==[base,head]
        assert read_git('rev-parse',head)==head
    else:
        assert kind=='workflow_dispatch';base=parents[0]
    base_tree=read_git('rev-parse',base+'^{tree}');assert valid(base_tree)
    changed=read_git('diff','--name-only',base,tested).splitlines()
    assert len(changed)==len(set(changed)) and len(changed)<=10000
    assert all(type(path) is str and re.fullmatch(r'[A-Za-z0-9._ /()-]+',path) and not path.startswith('/') and '..' not in path.split('/') for path in changed)
    return {'event':kind,'tested_sha':tested,'tested_tree':tree,'parents':parents,'base_sha':base,'base_tree':base_tree,'pr_head_sha':head,'pr_number':number,'changed_paths':changed}

def validate_checkout_event(receipt,read_git):
    if receipt['event']=='pull_request':
        event={'number':receipt['pr_number'],'pull_request':{'base':{'sha':receipt['base_sha'],'repo':{'full_name':'2ed944-cloud/ECHS-Math'}},'head':{'sha':receipt['pr_head_sha']}}}
    else:event={}
    expected=checkout_event(receipt['event'],event,receipt['tested_sha'],receipt['tested_tree'],read_git)
    assert all(receipt.get(key)==value for key,value in expected.items()),'Checkout event identity changed'
    return expected

def connection_guard(info,prefix):
    assert prefix in ('echs_membership_test_owner_fence_','echs_bank_test_owner_fence_')
    assert set(info)<= {'host','port','dbname','user','password','sslmode','connect_timeout','application_name'}
    assert info.get('host') in ('127.0.0.1','localhost','::1')
    assert type(info.get('dbname')) is str and re.fullmatch(re.escape(prefix)+r'[a-z0-9_]{1,32}',info['dbname']) and len(info['dbname'])<=63
    assert re.fullmatch(r'[1-9][0-9]{0,4}',info.get('port','5432')) and int(info.get('port','5432'))<=65535
    return '::1' if info['host']=='::1' else '127.0.0.1'
def connected(db,info,address):
    assert db.info.hostaddr==address and db.info.dbname==info['dbname']
    assert int(db.execute('show server_version_num').fetchone()[0])//10000==15
