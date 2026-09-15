"""Offline execution of the exact Pages workflow verifier, with independent fixtures."""
import argparse
import ast
import hashlib
import json
import os
from pathlib import Path
import textwrap
import unittest
from unittest.mock import patch

CURRENT = 'unit-1-gdc-integration-lesson-quality-v1.js'
RETIRED = 'unit-1-gdc-integration-v7.js'
LESSON = 'lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.6_technology_equations_ECHS.html'
FILES = dict(zip(['deployment','assets','control','runtime','client','index','landing','practice','lesson','finance','technology','worker'],
 ['echs-deployment.json','echs-school-control-assets.json','echs-school-control.html','echs-school-control.js','echs-institution-client.js','echs-index.html','echs-landing.css','echs-practice.html','echs-lesson.html','echs-finance.html','echs-technology.html','echs-sw.js']))

def verifier(path):
    source = path.read_text(encoding='utf8')
    marker = "            if python - <<'PY'\n"
    assert source.count(marker) == 1, 'Expected exactly one live verifier.'
    body = source.split(marker, 1)[1].split('\n          PY\n', 1)[0]
    code = textwrap.dedent(body)
    tree = ast.parse(code)
    nodes = [n for n in tree.body if isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'checks' for t in n.targets)]
    assert len(nodes) == 1 and isinstance(nodes[0].value, ast.List) and len(nodes[0].value.elts) == 36
    return compile(code, str(path), 'exec')

def execute(code, documents, sha):
    """Inject only file reads and GITHUB_SHA; execute all original statements."""
    data = {'/tmp/'+FILES[k]: v for k, v in documents.items()}
    class FixturePath:
        def __init__(self, value): self.value = value
        def is_file(self): return self.value in data
        def read_text(self, encoding='utf8', errors='strict'):
            return data[self.value].decode(encoding, errors)
    namespace = {}
    with patch('pathlib.Path', FixturePath), patch.dict(os.environ, {'GITHUB_SHA': sha}):
        try:
            exec(code, namespace)
        except SystemExit as error:
            return {'exit_code': error.code, 'checks': namespace.get('checks')}
    raise AssertionError('Verifier failed to terminate explicitly.')

def fixture(sha):
    token = sha[:12]
    raw = {
      'deployment': json.dumps({'sha':sha}),
      'assets': json.dumps({'sha':sha,'token':token,'runtime':f'question-bank/js/school-control.{token}.js'}),
      'control': 'School Control Center\n'+f'js/school-control.{token}.js\n../js/institution-client.{token}.js\n'+'x'*13000,
      'runtime': 'requireAuth(["admin","teacher"])',
      'client': 'dataset.institutionAccessRole=current.role\nnode===document.documentElement',
      'index': 'Lessons appear after sign-in.\nLearn with purpose.\nMohammad Abu Ghuwaleh\nschoolIdentityCard\ncss/landing-premium.css',
      'landing': '.premiumLandingHero\n.identityLogoPlate',
      'practice': 'data-require-account="student teacher admin"',
      'lesson': 'data-echs-lesson-guard="1"\nlesson-access-guard.js',
      'finance': 'lesson-1.4-finance-v8.css\ndata-merged-sections="SL 1.4 + SL 1.7"\nlesson-1.4-finance-model-v8.js\nlesson-1.4-finance-core-v8.js',
      'technology': 'lesson-1.6-multiplicity-2-fix-v6-3-3.js\nunit-1-gdc-integration-v7.css\n'+CURRENT,
      'worker': 'const VERSION = "echs-platform-school-control-v3-'
    }
    return {k:v.encode() for k,v in raw.items()}

def negative_vectors(sha):
    token = sha[:12]
    # Independent inputs, in the historical gate's order; no expression rewriting.
    vectors = [('json','deployment','sha'),('json','assets','sha'),('json','assets','token'),('json','assets','runtime'),('short','control','x'*13000)]
    vectors += [('remove',k,s) for k,s in [
      ('control','School Control Center'),('control',f'js/school-control.{token}.js'),('control',f'../js/institution-client.{token}.js'),('runtime','requireAuth(["admin","teacher"])')]]
    vectors += [('append','runtime','document.body.textContent'),('remove','client','dataset.institutionAccessRole=current.role'),('append','client','dataset.institutionRole=current.role'),('remove','client','node===document.documentElement')]
    vectors += [('remove','index',s) for s in ['Lessons appear after sign-in.','Learn with purpose.','Mohammad Abu Ghuwaleh','schoolIdentityCard','css/landing-premium.css']]
    vectors += [('remove','landing','.premiumLandingHero'),('remove','landing','.identityLogoPlate'),('append','index','Explore courses')]
    vectors += [('remove',k,s) for k,s in [('practice','data-require-account="student teacher admin"'),('lesson','data-echs-lesson-guard="1"'),('lesson','lesson-access-guard.js'),('finance','lesson-1.4-finance-v8.css'),('finance','data-merged-sections="SL 1.4 + SL 1.7"'),('finance','lesson-1.4-finance-model-v8.js'),('finance','lesson-1.4-finance-core-v8.js')]]
    vectors += [('append','finance',s) for s in ['lesson-1.4-ti84-finance-classroom-v6-3.js','lesson-1.4-ti84-finance-inline-v6-3.js']]
    vectors += [('remove','technology',s) for s in ['lesson-1.6-multiplicity-2-fix-v6-3-3.js','unit-1-gdc-integration-v7.css',CURRENT]]
    vectors += [('append','technology',s) for s in ['lesson-1.6-ti84-classroom-runtime-v6-2-1.js','lesson-1.6-ti84-inline-dock-v6-3.js']]
    vectors += [('remove','worker','const VERSION = "echs-platform-school-control-v3-')]
    return vectors

class ContractTests(unittest.TestCase):
    def test_01_complete_synthetic_fixture(self):
        result = execute(self.code, fixture(self.sha), self.sha)
        self.assertEqual(result, {'exit_code':0,'checks':[True]*36})

    def test_02_actual_lesson_requires_scoped_script(self):
        raw = (self.lesson_root/LESSON).read_bytes()
        self.assertIn(('src="../data/'+CURRENT+'"').encode(),raw)
        self.assertNotIn(('src="../data/'+RETIRED+'"').encode(),raw)
        docs = fixture(self.sha); docs['technology'] = raw
        self.assertEqual(execute(self.code,docs,self.sha)['exit_code'],0)
        docs['technology'] = raw.replace(CURRENT.encode(),RETIRED.encode())
        result = execute(self.code,docs,self.sha)
        self.assertEqual(result['exit_code'],1)
        self.assertEqual([i+1 for i,v in enumerate(result['checks']) if not v],[33])

    def test_03_each_of_36_conditions_still_rejects(self):
        vectors = negative_vectors(self.sha); self.assertEqual(len(vectors),36)
        for index,(action,key,value) in enumerate(vectors,1):
            with self.subTest(condition=index):
                docs=fixture(self.sha)
                if action=='json':
                    obj=json.loads(docs[key]);obj[value]='wrong';docs[key]=json.dumps(obj).encode()
                elif action=='append': docs[key]+=('\n'+value).encode()
                else:
                    self.assertEqual(docs[key].count(value.encode()),1)
                    docs[key]=docs[key].replace(value.encode(),b'')
                result=execute(self.code,docs,self.sha)
                self.assertEqual(result['exit_code'],1)
                self.assertEqual([i+1 for i,v in enumerate(result['checks']) if not v],[index])

    def test_04_every_missing_download_rejects(self):
        for key in FILES:
            with self.subTest(file=key):
                docs=fixture(self.sha);del docs[key]
                self.assertEqual(execute(self.code,docs,self.sha),{'exit_code':1,'checks':None})

    def test_05_bad_metadata_json_or_encoding_rejects(self):
        for key in ['deployment','assets']:
            for raw in [b'{',b'\xff']:
                with self.subTest(file=key,raw=raw):
                    docs=fixture(self.sha);docs[key]=raw
                    self.assertEqual(execute(self.code,docs,self.sha),{'exit_code':1,'checks':None})

    def test_06_wrong_release_is_not_current(self):
        for sha in ['b'*40,'a'*12+'b'*28]:
            self.assertEqual(execute(self.code,fixture(self.sha),sha)['exit_code'],1)

    def test_07_workflow_triggers_and_runs_this_regression(self):
        source = self.workflow.read_text(encoding='utf8')
        triggers = source.split('  pull_request:\n',1)[1].split('  workflow_dispatch:',1)[0]
        self.assertEqual(triggers.count('      - "tools/test_pages_live_contract.py"\n'),1)
        step = '      - name: Verify live Pages contract regressions\n        run: python tools/test_pages_live_contract.py --repo .\n'
        self.assertEqual(source.count(step),1)
        self.assertLess(source.index('      - name: Set up Python\n'),source.index(step))
        self.assertLess(source.index(step),source.index('      - name: Verify platform search, sign-in, sync, and practice regressions\n'))

def pin(path):
    raw=path.read_bytes()
    return {'path':str(path),'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo',type=Path,default=Path(__file__).resolve().parents[1])
    parser.add_argument('--lesson-root',type=Path)
    parser.add_argument('--report',type=Path)
    parser.add_argument('--responses',type=Path,help='Optional exact saved public verifier inputs; no network reads.')
    parser.add_argument('--expected-sha')
    parser.add_argument('--original-workflow',type=Path,help='Optional retained original for red/green replay.')
    args=parser.parse_args()
    if args.responses and (not args.expected_sha or len(args.expected_sha)!=40 or any(c not in '0123456789abcdef' for c in args.expected_sha)):
        parser.error('--responses requires --expected-sha with 40 lowercase hexadecimal characters')
    workflow=args.repo/'.github/workflows/deploy-pages.yml'
    ContractTests.workflow=workflow
    ContractTests.code=verifier(workflow)
    ContractTests.sha='a'*40
    ContractTests.lesson_root=args.lesson_root or args.repo
    sources=[workflow,Path(__file__),ContractTests.lesson_root/LESSON]
    before=[pin(p) for p in sources]
    result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(ContractTests))
    replay=None
    if args.responses:
        docs={k:(args.responses/name).read_bytes() for k,name in FILES.items()}
        current=execute(ContractTests.code,docs,args.expected_sha)
        assert current=={'exit_code':0,'checks':[True]*36},current
        replay={'scope':'Saved public response bytes; not a new CI deployment or authenticated UI test','sha':args.expected_sha,'current':current,'input_files':[pin(args.responses/name) for name in FILES.values()]}
        if args.original_workflow:
            original=execute(verifier(args.original_workflow),docs,args.expected_sha)
            assert original['exit_code']==1 and [i+1 for i,v in enumerate(original['checks']) if not v]==[33],original
            replay['original']=original
            replay['original_workflow']=pin(args.original_workflow)
    after=[pin(p) for p in sources]; assert before==after
    report={'contract':'echs.pages-live-contract-tests.v1','status':'PASS' if result.wasSuccessful() else 'FAIL','tests':result.testsRun,'failures':len(result.failures),'errors':len(result.errors),'skipped':len(result.skipped),'condition_negatives':36,'missing_download_negatives':12,'metadata_negatives':4,'source_before':before,'source_after':after,'replay':replay}
    if args.report:
        with args.report.open('x',encoding='utf8') as stream: stream.write(json.dumps(report,indent=2)+'\n')
    raise SystemExit(0 if result.wasSuccessful() else 1)

if __name__=='__main__': main()
