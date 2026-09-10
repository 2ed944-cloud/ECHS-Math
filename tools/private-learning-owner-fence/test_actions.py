"""Synthetic offline checker vectors, never actual SQL/Actions acceptance."""
import copy,hashlib,json,os,subprocess,sys,tempfile
from pathlib import Path
import contract
import assemble
from run_integration import source_snapshot

checks=[]
def passed(label):checks.append(label)
def rejected(fn):
    try:fn()
    except (AssertionError,KeyError,ValueError,TypeError):return
    raise AssertionError('Malformed metadata was accepted')
def raw(value):return (json.dumps(value,indent=2)+'\n').encode()

probe="import sys;sys.modules['psycopg']=None;import contract,checkout,assemble,run_integration;print('stdlib-only')"
done=subprocess.run([sys.executable,'-B','-c',probe],cwd=contract.HERE,capture_output=True,text=True,timeout=15)
assert done.returncode==0 and done.stdout.strip()=='stdlib-only'
passed('Checkout, contract and assembler import before database driver installation')
labels=contract.expected_labels()
assert len(set(labels))==len(labels) and all(any(table in s for s in labels) for table in contract.TABLES)
assert any('SET NULL' in s for s in labels) and any('TRUNCATE predating' in s for s in labels)
rejected(lambda:contract.labels_from_source('def exercise():\n if unavailable:\n  passed("skipped")\n'))
passed('Fence acceptance labels derive from actual test control flow without running SQL')

pins,migrations=contract.sources();snapshot=source_snapshot()
receipt={'status':'EXACT OWNER-FENCE SOURCE CHECKOUT VERIFIED','base_sha':pins['base_sha'],'base_tree':pins['base_tree'],
    'tested_sha':'a'*40,'tested_tree':'b'*40,'owned_paths':list(contract.OWN_PATHS),'input_pins_sha256':contract.digest((contract.HERE/'input-pins.json').read_bytes()),'source_files':[]}
for name in sorted(set(contract.OWN_PATHS)|set(contract.REPOSITORY_INPUTS)):
    data=(contract.REPO/name).read_bytes();receipt['source_files'].append({'path':name,'bytes':len(data),'sha256':contract.digest(data),
        'git_blob_sha':hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()})
original_git=contract.git;original_actions=os.environ.pop('GITHUB_ACTIONS',None)
# This in-memory Git answer is only a checker unit fixture. checkout.py uses
# real Git in Actions, and no successful fixture receipt is persisted here.
contract.git=lambda *args:receipt['tested_tree'] if args==('rev-parse','HEAD^{tree}') else receipt['tested_sha']
try:
    contract.checkout_sources(receipt);assert len(receipt['source_files'])==45
    passed('Exact12 owned and33 unchanged source paths form the closed45-file checker fixture')
    for change in ['missing','duplicate','hash','boolean','extra']:
        bad=copy.deepcopy(receipt)
        if change=='missing':bad['source_files'].pop()
        elif change=='duplicate':bad['source_files'][-1]=bad['source_files'][0]
        elif change=='hash':bad['source_files'][0]['sha256']='0'*64
        elif change=='boolean':bad['source_files'][0]['bytes']=True
        else:bad['source_files'][0]['unexpected']=True
        rejected(lambda bad=bad:contract.checkout_sources(bad))
    passed('Missing, duplicate, altered and mistyped checkout source rows are rejected')
    with tempfile.TemporaryDirectory(prefix='owner-fence-checkout-') as scratch:
        root=Path(scratch)
        for row in receipt['source_files']:
            target=root/row['path'];target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes((contract.REPO/row['path']).read_bytes())
        original_repo=contract.REPO
        try:
            contract.REPO=root;contract.checkout_sources(receipt)
            target=root/'tools/private-learning-owner-fence/run_integration.py';target.write_bytes(target.read_bytes()+b'\n')
            rejected(lambda:contract.checkout_sources(receipt))
        finally:contract.REPO=original_repo
    passed('An altered copied harness is detected before acceptance or artifact assembly')

    def legacy(count,duplicates):
        repeated=[label for label,n in duplicates.items() for _ in range(n)]
        return {'status':'PASS','checks':['synthetic-label-'+str(n) for n in range(count-len(repeated))]+repeated}
    member=legacy(55,assemble.MEMBER_DUPLICATES);archive=legacy(222,assemble.ARCHIVE_DUPLICATES)
    assemble.checks(member,55,'PASS',assemble.MEMBER_DUPLICATES);assemble.checks(archive,222,'PASS',assemble.ARCHIVE_DUPLICATES)
    for fixture,count,duplicates in [(member,55,assemble.MEMBER_DUPLICATES),(archive,222,assemble.ARCHIVE_DUPLICATES)]:
        bad=copy.deepcopy(fixture);bad['checks'][-1]='unexpected-repeat';rejected(lambda:assemble.checks(bad,count,'PASS',duplicates))
        bad=copy.deepcopy(fixture);bad['checks'].pop();rejected(lambda:assemble.checks(bad,count,'PASS',duplicates))
    passed('Known legacy repeated labels are retained while changed multiplicities and missing checks fail')
    for data in [b'{"x":1,"x":2}',b'{"x":NaN}',b'{"x":1e400}',b'{"password":"synthetic"}',b'{"payload":{}}',b'{"x":"\\u0000"}',b'',b' '*2097153]:
        rejected(lambda data=data:assemble.decode(data))
    assert assemble.decode(b'{"status":"synthetic-only"}')=={'status':'synthetic-only'}
    passed('Closed JSON rejects duplicate keys, nonfinite values, private payload keys and excessive bytes')

    rows=[{'file':r['path'].split('/')[-1],'sha256':r['sha256']} for r in migrations]
    member.update(migrations=rows[:-1],migration_count=26,production_calls=0)
    archive.update(migrations=rows,migration_count=27,production_calls=False,external_network=False)
    parsed={'checkout.json':receipt,'input-pins.json':pins,'membership-baseline.json':member,'archive-with-fence.json':archive}
    for name,count,status in [('local-results.json',6,'LOCAL HARNESS GUARDS PASS; POSTGRESQL NOT EXECUTED'),('actions-results.json',10,'LOCAL ACTIONS GUARDS PASS; POSTGRESQL NOT EXECUTED')]:
        parsed[name]={'status':status,'checks':['synthetic-local-'+str(i) for i in range(count)],'check_count':count,'database_executed':False,'production_calls':0,'source_files':snapshot}
    parsed['acceptance.json']={'status':'ACTUAL POSTGRESQL OWNER FENCE PASS; HTTP AND ADOPTION API NOT IMPLEMENTED','checks':labels,'check_count':len(labels),
        'migrations':rows,'source_files':snapshot,'database_executed':True,'real_storage_executed':False,'http_executed':False,'owner_adoption_api':False,'production_calls':0,
        'checkout_report_sha256':contract.digest(raw(receipt)),'tested_sha':receipt['tested_sha'],'tested_tree':receipt['tested_tree'],
        'membership_baseline_checks':55,'archive_baseline_checks':222,'candidate_installation':{'after_migration':rows[-1],'candidate_sha256':snapshot['owner-fence.sql']['sha256'],
        'existing_objects_preserved':True,'public_table_count':1,'old_function_count':1,'old_trigger_count':1},
        'reports':[{'file':n,'bytes':len(raw(parsed[n])),'sha256':contract.digest(raw(parsed[n]))} for n in ('membership-baseline.json','archive-with-fence.json')]}
    encoded={name:raw(value) for name,value in parsed.items()};encoded['input-pins.json']=(contract.HERE/'input-pins.json').read_bytes()
    assemble.validate(parsed,encoded)
    passed('Synthetic in-memory metadata grammar passes without creating an actual database receipt')
    for key,value in [('database_executed',1),('real_storage_executed',0),('owner_adoption_api',0),('check_count',True),('membership_baseline_checks',True),('archive_baseline_checks','222')]:
        bad=copy.deepcopy(parsed);bad['acceptance.json'][key]=value;rejected(lambda bad=bad:assemble.validate(bad,encoded))
    bad=copy.deepcopy(parsed);bad['acceptance.json']['checks'].pop();rejected(lambda:assemble.validate(bad,encoded))
    bad=copy.deepcopy(parsed);bad['acceptance.json']['candidate_installation']['existing_objects_preserved']=1;rejected(lambda:assemble.validate(bad,encoded))
    passed('False acceptance, numeric booleans and incomplete actual race sequences are rejected')
    with tempfile.TemporaryDirectory(prefix='owner-fence-failure-') as scratch:
        root=Path(scratch);results=root/'results';results.mkdir()
        (results/'local-results.json').write_bytes(b'{"status":"FAIL","checks":[]}')
        target=root/'artifact';index=assemble.assemble(results,target)
        assert index['complete'] is False and index['database_accepted'] is False and index['actual_counts'] is None
        assert 'NO ACCEPTANCE' in index['status'] and (target/'local-results.json').read_bytes()==(results/'local-results.json').read_bytes()
        assert {p.name for p in target.iterdir()}<=assemble.REPORTS|{'artifact-index.json'}
    passed('Failed or incomplete runs retain closed diagnostics and never gain an acceptance status')
finally:
    contract.git=original_git
    if original_actions is not None:os.environ['GITHUB_ACTIONS']=original_actions

assert len(checks)==10
report={'status':'LOCAL ACTIONS GUARDS PASS; POSTGRESQL NOT EXECUTED','checks':checks,'check_count':len(checks),
        'database_executed':False,'production_calls':0,'source_files':source_snapshot()}
target=contract.HERE/'results';target.mkdir(exist_ok=True)
(target/'actions-results.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'status':report['status'],'check_count':len(checks),'planned_fence_assertions':len(labels)}))
