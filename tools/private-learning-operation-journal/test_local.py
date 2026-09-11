"""Offline source/runner guards. Never opens PostgreSQL or imports test execution."""
import contextlib,hashlib,importlib,json,io,sys,unittest
from pathlib import Path
from unittest.mock import patch
import contract

class Guards(unittest.TestCase):
    def test_01_exact_prerequisites_and_design(self):
        pins,migrations=contract.sources()
        self.assertEqual((len(pins['files']),len(migrations)),(45,27))
        self.assertEqual(sum(r['kind']=='owner_fence' for r in pins['files']),12)

    def test_02_manifest_drift_refused(self):
        read=Path.read_bytes;target=contract.HERE/'input-pins.json'
        with patch.object(Path,'read_bytes',lambda p:read(p)+b'\n' if p==target else read(p)):
            with self.assertRaisesRegex(AssertionError,'prerequisite manifest'):contract.sources()

    def test_03_each_prerequisite_byte_change_refused(self):
        pins,_=contract.sources();read=Path.read_bytes
        for row in pins['files']:
            with self.subTest(path=row['path']):
                target=contract.REPO/row['path']
                with patch.object(Path,'read_bytes',lambda p:read(p)+b'\n' if p==target else read(p)):
                    with self.assertRaisesRegex(AssertionError,'Prerequisite source changed'):contract.sources()

    def test_04_design_mutation_refused(self):
        read=Path.read_bytes;target=contract.HERE/'reviewed-checks.json'
        with patch.object(Path,'read_bytes',lambda p:read(p)+b'\n' if p==target else read(p)):
            with self.assertRaises(AssertionError):contract.sources()

    def test_05_loopback_and_database_names(self):
        for prefix in ('echs_membership_test_journal_','echs_bank_test_journal_'):
            for host,address in [('127.0.0.1','127.0.0.1'),('localhost','127.0.0.1'),('::1','::1')]:
                self.assertEqual(contract.connection_guard({'host':host,'dbname':prefix+'synthetic','port':'5432'},prefix),address)

    def test_06_no_external_or_ambient_connection_options(self):
        prefix='echs_bank_test_journal_';base={'host':'127.0.0.1','dbname':prefix+'synthetic','port':'5432'}
        changes=[{'host':'192.168.0.1'},{'host':'db.example'},{'host':'127.0.0.1,db.example'},{'host':'/tmp'},
                 {'host':'127.1'},{'host':'127.0.0.1.'},{'hostaddr':'127.0.0.1'},{'service':'fixture'},
                 {'options':'-c role=postgres'},{'dbname':'production'},{'dbname':prefix+'../x'},
                 {'dbname':prefix+'x'*33},{'port':'0'},{'port':'65536'},{'port':'5432,5433'},
                 {'passfile':'ignored'},{'sslrootcert':'file'},{'dbname':None}]
        for changed in changes:
            with self.subTest(changed=changed):
                with self.assertRaises(AssertionError):contract.connection_guard({**base,**changed},prefix)
        with self.assertRaises(AssertionError):contract.connection_guard(base,'echs_bank_test_')

    def test_07_connected_peer_and_version_checked(self):
        from types import SimpleNamespace
        class DB:
            def __init__(self,address='127.0.0.1',name='echs_bank_test_journal_synthetic',version=150019):
                self.info=SimpleNamespace(hostaddr=address,dbname=name);self.version=version
            def execute(self,statement):
                assert statement=='show server_version_num'
                return SimpleNamespace(fetchone=lambda:(self.version,))
        info={'dbname':'echs_bank_test_journal_synthetic'}
        contract.connected(DB(),info,'127.0.0.1')
        for changed in ({'address':'192.0.2.1'},{'name':'production'},{'version':160001}):
            with self.assertRaises(AssertionError):contract.connected(DB(**changed),info,'127.0.0.1')

    def test_08_candidate_postphase_drift_refused(self):
        expected=contract.snapshot();read=Path.read_bytes;target=contract.HERE/'operation-journal.sql'
        with patch.object(Path,'read_bytes',lambda p:read(p)+b'\n' if p==target else read(p)):
            with self.assertRaisesRegex(AssertionError,'candidate changed|Frozen SQL'):contract.unchanged(expected)
        pins,_=contract.sources()
        for target in (contract.FENCE/'owner-fence.sql',contract.HERE/'operation-journal.sql'):
            with patch.object(Path,'read_bytes',lambda p:read(p)+b'\n' if p==target else read(p)):
                with self.assertRaisesRegex(AssertionError,'Executed SQL buffer'):contract.sql_buffers(expected,pins)

    def test_09_default_preflight_never_imports_or_connects_driver(self):
        import builtins,run_integration
        original=builtins.__import__
        def guarded(name,*args,**kwargs):
            if name.startswith('psycopg'):raise AssertionError('Default preflight tried database driver')
            return original(name,*args,**kwargs)
        output=io.StringIO()
        with patch.object(sys,'argv',['run_integration.py']),patch('builtins.__import__',guarded),patch('subprocess.run',side_effect=AssertionError('Default started process')),contextlib.redirect_stdout(output):
            run_integration.main()
        result=json.loads(output.getvalue())
        self.assertIs(result['database_executed'],False);self.assertEqual(result['production_calls'],0)
        self.assertEqual(result['prerequisites'],45)

    def test_10_original_fence_fixture_labels_unchanged(self):
        before=sys.modules.get('contract');fixture,labels=contract.load_fence()
        self.assertIs(sys.modules.get('contract'),before);self.assertEqual(len(labels),123)
        self.assertTrue(callable(fixture.exercise));self.assertEqual(len(set(labels)),123)

    def test_11_journal_case_inventory_is_literal_and_not_executed(self):
        before=set(sys.modules);labels=contract.planned_labels()
        self.assertGreaterEqual(len(labels),20);self.assertNotIn('test_journal',set(sys.modules)-before)
        self.assertFalse(any('J049' in x for x in labels))

    def test_12_python_syntax_no_execution(self):
        for name in contract.NAMES:
            if name.endswith('.py'):compile((contract.HERE/name).read_text(encoding='utf-8'),name,'exec')

    def test_13_sql_and_procedural_syntax(self):
        try:from pglast import parse_sql,parse_plpgsql
        except ImportError:self.skipTest('Install reviewed pglast7.7 for offline syntax parsing')
        import pglast
        self.assertEqual(pglast.__version__,'v7.7')
        source=(contract.HERE/'operation-journal.sql').read_text(encoding='utf-8')
        tree=parse_sql(source);functions=[row.stmt for row in tree if type(row.stmt).__name__=='CreateFunctionStmt']
        tables=[row.stmt for row in tree if type(row.stmt).__name__=='CreateStmt']
        self.assertEqual(len(tables),5);self.assertEqual(len(functions),18);self.assertEqual(len(parse_plpgsql(source)),18)
        public=[f for f in functions if f.funcname[0].sval=='public'];self.assertEqual(len(public),4)
        for f in public:
            options={o.defname:o.arg for o in f.options}
            self.assertEqual(options['volatility'].sval,'volatile');self.assertTrue(options['security'].boolval)
            self.assertFalse(f.replace)

    def test_14_no_legacy_sql_mutation_or_lazy_initialization(self):
        # Static containment only; the real-PG suite proves behavior separately.
        import re
        source=(contract.HERE/'operation-journal.sql').read_text(encoding='utf-8')
        targets=re.findall(r'(?im)^\s*(?:insert\s+into|update|delete\s+from|truncate(?:\s+table)?)\s+([a-z_.]+)',source)
        self.assertTrue(targets);self.assertTrue(all(t.startswith('private.learning_journal_') for t in targets),targets)
        self.assertNotIn('private.learning_journal_owners',[t for t in re.findall(r'(?i)insert\s+into\s+([a-z_.]+)',source)])
        self.assertNotRegex(source,r'(?i)create\s+or\s+replace')
        self.assertNotRegex(source,r'(?i)grant\s+(?:all|insert|update|delete|select)\s')

class RecordingResult(unittest.TextTestResult):
    def __init__(self,*args,**kwargs):super().__init__(*args,**kwargs);self.successes=[]
    def addSuccess(self,test):
        super().addSuccess(test);self.successes.append(test._testMethodName)

def make_report(result,before,stable):
    complete=result.wasSuccessful() and not result.skipped and stable and result.testsRun==14 and result.successes==contract.local_labels()
    return {'contract':'echs.c04.journal-local-guards.v1','status':'LOCAL JOURNAL GUARDS PASS; POSTGRESQL NOT EXECUTED' if complete else 'INCOMPLETE OR FAILED',
        'checks':list(result.successes),'check_count':len(result.successes),'groups_run':result.testsRun,
        'skipped':[{'test':test.id(),'reason':str(reason)} for test,reason in result.skipped],
        'failures':len(result.failures),'errors':len(result.errors),'database_executed':False,'production_calls':0,'source_unchanged':stable,'source_files':before}

if __name__=='__main__':
    before=contract.snapshot();stream=io.StringIO()
    result=unittest.TextTestRunner(stream=stream,verbosity=2,resultclass=RecordingResult).run(unittest.defaultTestLoader.loadTestsFromTestCase(Guards))
    print(stream.getvalue());report=make_report(result,before,contract.snapshot()==before)
    target=contract.HERE/'results';target.mkdir(exist_ok=True)
    (target/'local-results.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:v for k,v in report.items() if k!='source_files'}))
    sys.exit(0 if report['status']=='LOCAL JOURNAL GUARDS PASS; POSTGRESQL NOT EXECUTED' else 1)
