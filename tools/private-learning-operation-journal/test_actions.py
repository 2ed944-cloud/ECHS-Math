"""Offline adversarial tests. Synthetic success fixtures never prove SQL execution."""
import copy,hashlib,io,json,os,subprocess,sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
import contract
import assemble
import run_integration
import test_local

EXPECTED_LABELS=(
 'test_01_stdlib_imports_and_default_preflight',
 'test_02_complete_source_checkout',
 'test_03_checkout_source_mutations',
 'test_04_checkout_identity_and_image_mutations',
 'test_05_all_actual_outcomes_required',
 'test_06_old_label_multiplicity_preserved',
 'test_07_partial_or_skipped_local_results_rejected',
 'test_08_typed_scope_flags_and_counters',
 'test_09_report_receipt_and_installation_binding',
 'test_10_closed_metadata_and_unsafe_payloads',
 'test_11_bounded_json_decoder',
 'test_12_exact_eight_synthetic_artifacts',
 'test_13_partial_and_multiple_run_directories',
 'test_14_report_changes_during_copy',
 'test_15_source_changes_during_copy',
 'test_16_transient_input_manifest_buffer',
 'test_17_late_extra_entry_removes_accepting_index',
 'test_18_late_fsync_failure_removes_partial_index',
 'test_19_late_source_drift_removes_accepting_index',
 'test_20_late_report_drift_removes_accepting_index',
 'test_21_existing_output_is_preserved',
 'test_22_linked_output_components_rejected',
 'test_23_missing_parser_report_serializes_failclosed',
 'test_24_exact_sql_text_preservation',
 'test_25_workflow_closed_execution_contract',
 'test_26_frozen_sql_fixture_and_case_mapping',
)

def raw(value):return (json.dumps(value,indent=2)+'\n').encode('utf-8')
def check_checkout(value):contract.checkout_sources(value,verify_git=False)

def fixtures():
    pins,migrations=contract.sources();owned=contract.snapshot();reference=contract.reviewed()
    rows=[{'file':r['path'].split('/')[-1],'sha256':r['sha256']} for r in migrations]
    checkout={'contract':'echs.c04.operation-journal-checkout.v1','status':'EXACT JOURNAL SOURCE CHECKOUT VERIFIED',
        'event':'pull_request','tested_sha':'a'*40,'tested_tree':'b'*40,'parents':[pins['base_sha'],'c'*40],
        'base_sha':pins['base_sha'],'base_tree':pins['base_tree'],'pr_head_sha':'c'*40,'pr_number':999999,
        'owned_paths':list(contract.OWN_PATHS),'source_files':[],'input_pins_sha256':contract.INPUT_SHA,
        'reviewed_checks_sha256':contract.REVIEWED_SHA,'postgres_image':{'configured':'postgres:15','image_id':'sha256:'+'d'*64,'repo_digests':['postgres@sha256:'+'e'*64]},
        'sql_location':'tools/private-learning-operation-journal/operation-journal.sql','production_migration':False,'production_calls':0}
    for name in sorted(set(contract.OWN_PATHS)|{r['path'] for r in pins['files']}):
        data=(contract.REPO/name).read_bytes()
        checkout['source_files'].append({'path':name,'bytes':len(data),'sha256':contract.digest(data),
            'git_blob_sha':hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()})
    common={'database_executed':False,'production_calls':0,'source_unchanged':True,'source_files':owned}
    local=dict(common,contract='echs.c04.journal-local-guards.v1',status='LOCAL JOURNAL GUARDS PASS; POSTGRESQL NOT EXECUTED',
        checks=contract.local_labels(),check_count=14,groups_run=14,skipped=[],failures=0,errors=0)
    actions=dict(common,contract='echs.c04.journal-actions-guards.v1',status='LOCAL JOURNAL ACTIONS GUARDS PASS; POSTGRESQL NOT EXECUTED',
        checks=list(EXPECTED_LABELS),check_count=len(EXPECTED_LABELS))
    member={'contract':'echs.membership-database-tests.v1','status':'PASS','production_calls':0,'postgres_required':15,
        'migration_count':26,'migrations':rows[:-1],'checks':reference['checks']['membership-baseline.json'],
        'postgres_version':'15.19 (synthetic offline fixture)','limits':assemble.MEMBER_LIMITS}
    archive={'contract':'echs.private-snapshot-database-test.v1','status':'PASS','production_calls':False,'postgres_required':15,
        'migration_count':27,'migrations':rows,'checks':reference['checks']['archive-with-fence-and-journal.json'],
        'postgres_version':member['postgres_version'],'limits':assemble.ARCHIVE_LIMITS,'connection_isolation_vectors':16,'external_network':False}
    accepted={'contract':'echs.c04.operation-journal-acceptance.v1','status':'ACTUAL POSTGRESQL JOURNAL PASS; NO ACTIVE API OR ADOPTION',
        'source_files':owned,'migrations':rows,'checks':contract.planned_labels(),'fence_checks':reference['checks']['fence'],
        'production_calls':0,'database_executed':True,'production_migration':False,'active_api':False,'http_executed':False,
        'owner_adoption_api':False,'browser_bridge':False,'grading_authoritative':False,'checkout_report_sha256':contract.digest(raw(checkout)),
        'tested_sha':checkout['tested_sha'],'tested_tree':checkout['tested_tree'],'membership_baseline_checks':55,'archive_baseline_checks':222,
        'candidate_installation':{'after_migration':rows[-1],
            'unchanged_fence_sha256':next(r['sha256'] for r in pins['files'] if r['path']=='tools/private-learning-owner-fence/owner-fence.sql'),
            'journal_sha256':owned['operation-journal.sql']['sha256'],'existing_public_rows_preserved':True,
            'existing_function_acl_rls_triggers_preserved':True,'row_representation':'postgres-jsonb-text-length-prefixed-v1','initial_routes':0,'initial_journal_owners':0},
        'postgres_version':member['postgres_version'],'journal_check_count':48,'fence_check_count':123,
        'details':{'executed_case_ids':[x.split()[0] for x in contract.planned_labels()],'deferred_case_ids':['J049'],
            'deferred_reason':'HTTP status/body/receipt and browser acknowledgement acceptance need the later transport; SQL does not claim those tests.',
            'network_scope':'guarded disposable PostgreSQL connections only; no production or Storage calls'},
        'reports':[{'file':name,'bytes':len(raw(value)),'sha256':contract.digest(raw(value))} for name,value in [('membership-baseline.json',member),('archive-with-fence-and-journal.json',archive)]]}
    return {'checkout.json':checkout,'input-pins.json':pins,'local-results.json':local,'actions-results.json':actions,
        'membership-baseline.json':member,'archive-with-fence-and-journal.json':archive,'acceptance.json':accepted}

class Guards(unittest.TestCase):
    def setUp(self):
        self.env=patch.dict(os.environ,{'GITHUB_ACTIONS':'false'});self.env.start();self.addCleanup(self.env.stop)
        self.parsed=fixtures()

    def reject(self,fn):
        with self.assertRaises((AssertionError,KeyError,ValueError,TypeError,FileNotFoundError)):fn()

    def validate(self,parsed=None):
        values=self.parsed if parsed is None else parsed
        return assemble.validate(values,{name:raw(value) for name,value in values.items()},check_checkout)

    def mutate(self,fn):
        value=copy.deepcopy(self.parsed);fn(value);self.reject(lambda:self.validate(value))

    def tree(self,root):
        results=root/'results';results.mkdir();run=results/('run-'+'f'*32);run.mkdir()
        for name,value in self.parsed.items():
            if name=='input-pins.json':continue
            path=(run if name in ('acceptance.json','membership-baseline.json','archive-with-fence-and-journal.json') else results)/name
            path.write_bytes(raw(value))
        return results,root/'artifact',run

    def test_01_stdlib_imports_and_default_preflight(self):
        probe="import sys;sys.modules['psycopg']=None;import contract,checkout,assemble,run_integration;print('stdlib-only')"
        done=subprocess.run([sys.executable,'-B','-c',probe],cwd=contract.HERE,capture_output=True,text=True,timeout=20)
        self.assertEqual((done.returncode,done.stdout.strip()),(0,'stdlib-only'))
        done=subprocess.run([sys.executable,'-B',str(contract.HERE/'run_integration.py')],capture_output=True,text=True,timeout=30)
        self.assertEqual(done.returncode,0,done.stderr);value=json.loads(done.stdout)
        self.assertIs(value['database_executed'],False);self.assertEqual(value['production_calls'],0);self.assertEqual(value['planned_sql_groups'],48)

    def test_02_complete_source_checkout(self):
        check_checkout(self.parsed['checkout.json']);self.validate()
        self.assertEqual(len(self.parsed['checkout.json']['source_files']),57);self.assertEqual(len(contract.OWN_PATHS),12)

    def test_03_checkout_source_mutations(self):
        for kind in ('missing','duplicate','bytes','hash','blob','extra','wrongpath'):
            value=copy.deepcopy(self.parsed['checkout.json']);rows=value['source_files']
            if kind=='missing':rows.pop()
            elif kind=='duplicate':rows[-1]=rows[0]
            elif kind=='bytes':rows[0]['bytes']=float(rows[0]['bytes'])
            elif kind=='hash':rows[0]['sha256']='0'*64
            elif kind=='blob':rows[0]['git_blob_sha']='0'*40
            elif kind=='extra':rows[0]['unknown']=True
            else:rows[0]['path']='tools/not-in-closure.py'
            self.reject(lambda:check_checkout(value))

    def test_04_checkout_identity_and_image_mutations(self):
        edits=[('base_sha','0'*40),('base_tree','0'*40),('parents',['0'*40,'c'*40]),('pr_number',True),('pr_head_sha',None),
            ('production_migration',0),('production_calls',False),('owned_paths',[]),('input_pins_sha256','0'*64),('reviewed_checks_sha256','0'*64)]
        for key,value in edits:
            bad=copy.deepcopy(self.parsed['checkout.json']);bad[key]=value;self.reject(lambda:check_checkout(bad))
        for key,value in [('configured','postgres:latest'),('image_id','d'*64),('repo_digests',[]),('repo_digests',['postgres@sha256:'+'e'*64]*2)]:
            bad=copy.deepcopy(self.parsed['checkout.json']);bad['postgres_image'][key]=value;self.reject(lambda:check_checkout(bad))

    def test_05_all_actual_outcomes_required(self):
        for name,key in [('membership-baseline.json','checks'),('archive-with-fence-and-journal.json','checks'),('acceptance.json','fence_checks'),('acceptance.json','checks')]:
            for variant in ('missing','samecount','expected_only'):
                def alter(p,name=name,key=key,variant=variant):
                    if variant=='missing':p[name][key].pop()
                    elif variant=='samecount':p[name][key][-1]='Unexecuted replacement'
                    else:p[name]['status']='EXPECTED LABEL SET ONLY'
                self.mutate(alter)

    def test_06_old_label_multiplicity_preserved(self):
        for name in ('membership-baseline.json','archive-with-fence-and-journal.json'):
            expected=contract.reviewed()['checks'][name]
            self.assertGreater(len(expected),len(set(expected)))
            self.mutate(lambda p,name=name,expected=expected:p[name].update(checks=list(dict.fromkeys(expected))))

    def test_07_partial_or_skipped_local_results_rejected(self):
        for name in ('local-results.json','actions-results.json'):
            self.mutate(lambda p,name=name:p[name]['checks'].pop())
            self.mutate(lambda p,name=name:p[name].update(source_unchanged=False))
        self.mutate(lambda p:p['local-results.json'].update(skipped=[{'test':'missing_parser','reason':'unavailable'}]))
        self.mutate(lambda p:p['local-results.json'].update(errors=1))
        self.mutate(lambda p:p['actions-results.json'].update(check_count=len(EXPECTED_LABELS)-1))

    def test_08_typed_scope_flags_and_counters(self):
        for name in ('local-results.json','actions-results.json','acceptance.json'):
            for key in ('database_executed','source_unchanged','production_migration','active_api','http_executed','owner_adoption_api','browser_bridge','grading_authoritative'):
                if key in self.parsed[name]:self.mutate(lambda p,name=name,key=key:p[name].update({key:int(p[name][key])}))
            self.mutate(lambda p,name=name:p[name].update(production_calls=False))
            first=next(iter(self.parsed[name]['source_files']))
            self.mutate(lambda p,name=name,first=first:p[name]['source_files'][first].update(bytes=float(p[name]['source_files'][first]['bytes'])))
        for name,key in [('membership-baseline.json','migration_count'),('archive-with-fence-and-journal.json','connection_isolation_vectors'),('acceptance.json','journal_check_count')]:
            self.mutate(lambda p,name=name,key=key:p[name].update({key:float(p[name][key])}))
        self.mutate(lambda p:p['archive-with-fence-and-journal.json'].update(production_calls=0))

    def test_09_report_receipt_and_installation_binding(self):
        for key,value in [('sha256','0'*64),('bytes',True)]:
            self.mutate(lambda p,key=key,value=value:p['acceptance.json']['reports'][0].update({key:value}))
        for key,value in [('journal_sha256','0'*64),('unchanged_fence_sha256','0'*64),('existing_public_rows_preserved',1),
                ('existing_function_acl_rls_triggers_preserved',1),('row_representation','decoded-float'),('initial_routes',1),('initial_journal_owners',False)]:
            self.mutate(lambda p,key=key,value=value:p['acceptance.json']['candidate_installation'].update({key:value}))
        self.mutate(lambda p:p['acceptance.json'].update(checkout_report_sha256='0'*64))
        self.mutate(lambda p:p['acceptance.json']['details'].update(deferred_case_ids=[]))

    def test_10_closed_metadata_and_unsafe_payloads(self):
        for name in self.parsed:
            self.mutate(lambda p,name=name:p[name].update(unexpected=True))
        for key in ('token','password','payload','private_notes','bytes_base64'):
            self.reject(lambda key=key:assemble.decode(raw({'nested':{key:'synthetic forbidden value'}})))

    def test_11_bounded_json_decoder(self):
        for data in (b'{"x":1,"x":2}',b'{"x":NaN}',b'{"x":1e9999}',b'"\\u0000"',b'\xff',b' '*2097153,
                raw('x'*20001),b'['*25+b'0'+b']'*25,raw([0]*50001)):
            self.reject(lambda data=data:assemble.decode(data))
        self.assertEqual(assemble.decode(raw({'safe':[None,True,1,'metadata']})),{'safe':[None,True,1,'metadata']})

    def test_12_exact_eight_synthetic_artifacts(self):
        with tempfile.TemporaryDirectory() as folder:
            results,target,_=self.tree(Path(folder));index=assemble.assemble(results,target,check_checkout)
            self.assertIs(index['complete'],True);self.assertEqual(index['actual_counts']['total'],448)
            self.assertEqual({p.name for p in target.iterdir()},assemble.REPORTS|{'artifact-index.json'})
            for row in index['files']:
                data=(target/row['file']).read_bytes();self.assertEqual(len(data),row['bytes']);self.assertEqual(contract.digest(data),row['sha256'])

    def test_13_partial_and_multiple_run_directories(self):
        for mode in ('missing','multiple'):
            with tempfile.TemporaryDirectory() as folder:
                results,target,run=self.tree(Path(folder))
                if mode=='missing':(run/'acceptance.json').unlink()
                else:(results/('run-'+'1'*32)).mkdir()
                index=assemble.assemble(results,target,check_checkout)
                self.assertIs(index['complete'],False);self.assertIsNone(index['actual_counts']);self.assertIs(index['database_accepted'],False)

    def test_14_report_changes_during_copy(self):
        with tempfile.TemporaryDirectory() as folder:
            results,target,_=self.tree(Path(folder));original=assemble.write_exclusive
            def changed(path,data):
                original(path,data)
                if path.name=='checkout.json':(results/'checkout.json').write_bytes(data+b'\n')
            with patch.object(assemble,'write_exclusive',changed):index=assemble.assemble(results,target,check_checkout)
            self.assertIs(index['complete'],False)

    def test_15_source_changes_during_copy(self):
        with tempfile.TemporaryDirectory() as folder:
            results,target,_=self.tree(Path(folder));original=assemble.snapshot;calls=[0]
            def changed():
                calls[0]+=1;value=original()
                if calls[0]>1:value['contract.py']['sha256']='0'*64
                return value
            with patch.object(assemble,'snapshot',changed):index=assemble.assemble(results,target,check_checkout)
            self.assertIs(index['complete'],False)

    def test_16_transient_input_manifest_buffer(self):
        with tempfile.TemporaryDirectory() as folder:
            results,target,_=self.tree(Path(folder));original=Path.read_bytes;write=assemble.write_exclusive;armed=[False];injected=[False]
            def copied(path,data):
                write(path,data)
                if path.name=='checkout.json':armed[0]=True
            def changed(path):
                data=original(path)
                if path==contract.HERE/'input-pins.json' and armed[0] and not injected[0]:
                    injected[0]=True;return data+b'\n'
                return data
            with patch.object(Path,'read_bytes',changed),patch.object(assemble,'write_exclusive',copied):index=assemble.assemble(results,target,check_checkout)
            self.assertTrue(injected[0])
            self.assertIs(index['complete'],False);self.assertFalse((target/'input-pins.json').exists())

    def test_17_late_extra_entry_removes_accepting_index(self):
        with tempfile.TemporaryDirectory() as folder:
            results,target,_=self.tree(Path(folder));original=Path.open
            def changed(path,*args,**kwargs):
                out=original(path,*args,**kwargs)
                if path==target/'artifact-index.json' and args and args[0]=='xb':
                    with original(target/'late-extra.json','wb') as extra:extra.write(b'{}')
                return out
            with patch.object(Path,'open',changed):self.reject(lambda:assemble.assemble(results,target,check_checkout))
            self.assertTrue((target/'late-extra.json').exists());self.assertFalse((target/'artifact-index.json').exists())

    def test_18_late_fsync_failure_removes_partial_index(self):
        with tempfile.TemporaryDirectory() as folder:
            results,target,_=self.tree(Path(folder));original=os.fsync
            def changed(fd):
                if (target/'artifact-index.json').exists():raise OSError('Synthetic index fsync failure')
                return original(fd)
            with patch.object(os,'fsync',changed),self.assertRaises(OSError):assemble.assemble(results,target,check_checkout)
            self.assertFalse((target/'artifact-index.json').exists())

    def test_19_late_source_drift_removes_accepting_index(self):
        with tempfile.TemporaryDirectory() as folder:
            results,target,_=self.tree(Path(folder));original=assemble.snapshot
            def changed():
                value=original()
                if (target/'artifact-index.json').exists():value['contract.py']['sha256']='0'*64
                return value
            with patch.object(assemble,'snapshot',changed):self.reject(lambda:assemble.assemble(results,target,check_checkout))
            self.assertFalse((target/'artifact-index.json').exists())

    def test_20_late_report_drift_removes_accepting_index(self):
        with tempfile.TemporaryDirectory() as folder:
            results,target,_=self.tree(Path(folder));original=os.fsync
            def changed(fd):
                result=original(fd)
                if (target/'artifact-index.json').exists():
                    p=target/'checkout.json';p.write_bytes(p.read_bytes()+b'\n')
                return result
            with patch.object(os,'fsync',changed):self.reject(lambda:assemble.assemble(results,target,check_checkout))
            self.assertFalse((target/'artifact-index.json').exists())

    def test_21_existing_output_is_preserved(self):
        with tempfile.TemporaryDirectory() as folder:
            results,target,_=self.tree(Path(folder));target.mkdir();marker=target/'artifact-index.json';marker.write_bytes(b'preserve-existing')
            self.reject(lambda:assemble.assemble(results,target,check_checkout));self.assertEqual(marker.read_bytes(),b'preserve-existing')
        with tempfile.TemporaryDirectory() as folder:
            results,target,_=self.tree(Path(folder));original=assemble.write_exclusive;marker=target/'artifact-index.json'
            def changed(path,data):
                original(path,data)
                if not marker.exists():marker.write_bytes(b'competing-index')
            with patch.object(assemble,'write_exclusive',changed),self.assertRaises(FileExistsError):assemble.assemble(results,target,check_checkout)
            self.assertEqual(marker.read_bytes(),b'competing-index')

    def test_22_linked_output_components_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            results,target,_=self.tree(Path(folder));original=Path.is_symlink
            def linked(path):return path==target.parent or original(path)
            with patch.object(Path,'is_symlink',linked):self.reject(lambda:assemble.assemble(results,target,check_checkout))
            self.assertFalse(target.exists())

    def test_23_missing_parser_report_serializes_failclosed(self):
        result=test_local.RecordingResult(unittest.runner._WritelnDecorator(io.StringIO()),True,0)
        result.testsRun=14;result.successes=contract.local_labels()[:-1]
        case=unittest.FunctionTestCase(lambda:None);result.addSkip(case,'pglast unavailable')
        report=test_local.make_report(result,contract.snapshot(),True)
        json.dumps(report);self.assertEqual(report['status'],'INCOMPLETE OR FAILED');self.assertEqual(report['check_count'],13)
        self.assertEqual(report['skipped'],[{'test':case.id(),'reason':'pglast unavailable'}])
        self.reject(lambda:assemble.validate(dict(self.parsed,**{'local-results.json':report}),{name:raw(value) for name,value in dict(self.parsed,**{'local-results.json':report}).items()},check_checkout))

    def test_24_exact_sql_text_preservation(self):
        digest=run_integration.row_digest
        for a,b in [(['{"x":1.0}'],['{"x":1.00}']),(['{"x":9007199254740992}'],['{"x":9007199254740993}']),
                (['a'],['a','a']),(['a','bc'],['ab','c'])]:self.assertNotEqual(digest(a),digest(b))
        self.assertEqual(digest(['a','b','a']),digest(['b','a','a']))
        self.reject(lambda:digest([{'x':1.0}]))
        self.assertIn('select to_jsonb(t)::text from public.{} t',(contract.HERE/'run_integration.py').read_text())

    def test_25_workflow_closed_execution_contract(self):
        import fnmatch,yaml
        text=(contract.REPO/contract.WORKFLOW).read_text();workflow=yaml.load(text,Loader=yaml.BaseLoader)
        self.assertEqual(workflow['permissions'],{'contents':'read'});self.assertEqual(set(workflow['jobs']),{'postgres15'})
        job=workflow['jobs']['postgres15'];self.assertEqual(job['runs-on'],'ubuntu-latest');self.assertEqual(job['defaults']['run']['shell'],'bash')
        self.assertLessEqual(int(job['timeout-minutes']),30);self.assertEqual(set(job['services']),{'postgres'})
        service=job['services']['postgres'];self.assertEqual(service['image'],'postgres:15');self.assertEqual(service['ports'],['5432:5432'])
        self.assertEqual(service['env']['POSTGRES_DB'],'echs_membership_test_journal_ci')
        self.assertNotIn('secrets.',text);self.assertNotIn('continue-on-error',text);self.assertNotIn('supabase db',text)
        steps=job['steps'];self.assertEqual(len(steps),9)
        self.assertEqual(steps[0]['with'],{'fetch-depth':'0','persist-credentials':'false'})
        self.assertEqual(steps[2]['run'],'python tools/private-learning-operation-journal/checkout.py')
        self.assertEqual(steps[3]['run'],'python -m pip install pglast==7.7 PyYAML==6.0.2')
        self.assertEqual(steps[4]['run'].splitlines(),['python tools/private-learning-operation-journal/test_local.py','python tools/private-learning-operation-journal/test_actions.py'])
        self.assertIn('psycopg[binary]==3.2.9',steps[5]['run']);self.assertIn('--execute --checkout-report tools/private-learning-operation-journal/results/checkout.json',steps[6]['run'])
        self.assertEqual(steps[7]['if'],'always()');self.assertEqual(steps[8]['if'],'always()')
        self.assertEqual(steps[8]['uses'],'actions/upload-artifact@v4');self.assertEqual(steps[8]['with']['if-no-files-found'],'error')
        patterns=workflow['on']['pull_request']['paths']
        for name in set(contract.OWN_PATHS)|{r['path'] for r in contract.sources()[0]['files']}:
            self.assertTrue(any(fnmatch.fnmatchcase(name,p) for p in patterns),name)

    def test_26_frozen_sql_fixture_and_case_mapping(self):
        reference=contract.reviewed();pins,migrations=contract.sources()
        self.assertEqual((len(pins['files']),len(migrations)),(45,27))
        self.assertEqual(len(reference['design_case_map']),49);self.assertEqual(len(contract.planned_labels()),48)
        self.assertEqual(contract.planned_labels()[-1].split()[0],'J002')
        for name in ('operation-journal.sql','test_journal.py'):
            expected=next(r for r in reference['frozen_candidate_files'] if r['path']==name)
            self.assertEqual(contract.digest((contract.HERE/name).read_bytes()),expected['sha256'])

class RecordingResult(unittest.TextTestResult):
    def __init__(self,*args,**kwargs):super().__init__(*args,**kwargs);self.successes=[]
    def addSuccess(self,test):super().addSuccess(test);self.successes.append(test._testMethodName)

def main():
    before=contract.snapshot();assert contract.actions_labels()==list(EXPECTED_LABELS)
    result=unittest.TextTestRunner(verbosity=2,resultclass=RecordingResult).run(unittest.defaultTestLoader.loadTestsFromTestCase(Guards))
    stable=contract.snapshot()==before
    complete=result.wasSuccessful() and not result.skipped and stable and result.testsRun==len(EXPECTED_LABELS) and result.successes==list(EXPECTED_LABELS)
    report={'contract':'echs.c04.journal-actions-guards.v1','status':'LOCAL JOURNAL ACTIONS GUARDS PASS; POSTGRESQL NOT EXECUTED' if complete else 'INCOMPLETE OR FAILED',
        'checks':result.successes,'check_count':len(result.successes),'database_executed':False,'production_calls':0,'source_unchanged':stable,'source_files':before}
    output=contract.HERE/'results';output.mkdir(exist_ok=True);(output/'actions-results.json').write_bytes(raw(report))
    print(json.dumps({'status':report['status'],'checks':report['check_count']}))
    if not complete:raise SystemExit(1)

if __name__=='__main__':main()
