"""Offline source/report/collector contract probes; no service evidence is made.

All execution-shaped objects below are synthetic counterexample fixtures. The
collector tests inject its source and Git observations; they exercise only local
member closure. They cannot establish browser, HTTP, PostgreSQL or deployment.
"""
import argparse
import ast
import base64
import copy
from fnmatch import fnmatchcase
import hashlib
import io
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import MagicMock, Mock, patch
import yaml

import assemble
import contract
import run as runner

HERE = Path(__file__).resolve().parent
REPO = None
WORK_DIR = None
OWNED = ['contract.py','run.py','assemble.py','test_contract.py']
HTTP = ['runtime/wire.mjs','runtime/contract.mjs','runtime/handler.mjs','runtime/pending-intent.mjs','bridge.mjs','controls.py','fixture.py','test_http.mjs']
BROWSER = ['runtime/handler.mjs','runtime/wire.mjs','runtime/contract.mjs','runtime/pending-intent.mjs','bridge.mjs','https-bridge.mjs','browser-page.mjs','controls.py','fixture.py','control-client.mjs','test_http.mjs','test_browser_http.mjs','browser-cases.mjs','browser-dependency.json'] + ['retained/c04-learning-ack-candidate/source/'+name for name in ['js/owned-learning-store.mjs','js/wire-binding-model.mjs','js/journal/wire.mjs','js/journal/contract.mjs','js/journal/pending-intent.mjs','question-bank/js/learning-transition.mjs','question-bank/js/practice-flow.mjs']]


def rows(names):
    return [{key:contract.info(HERE/name,name,HERE)[key] for key in ('path','bytes','sha256')} for name in names]


def source_labels(name):
    return re.findall(r"^ '([^']+)'",(HERE/name).read_text(encoding='utf-8'),re.MULTILINE)


def checkout():
    return {'contract':'echs.c04.browser-http-checkout.v1','event':'pull_request',
            'tested_commit':'c'*40,'tested_tree':'d'*40,'parents':['a'*40,'b'*40],
            'head':'b'*40,'base':'a'*40}


def tls_metadata():
    def leaf(digit):
        return {'der_sha256':digit*64,'spki_sha256':digit*64,
                'spki_sha256_base64':base64.b64encode(bytes.fromhex(digit*64)).decode(),
                'san_ip_addresses':['127.0.0.1'],'ca':False,'extended_key_usage':['serverAuth'],
                'key_algorithm':'EC','key_curve':'P-256','not_before':'2026-09-12T00:00:00+00:00',
                'not_after':'2026-09-13T00:00:00+00:00'}
    return {'openssl_version':'OpenSSL 3.0.16','positive':leaf('a'),'negative':leaf('b')}


DETAILS = [
 {'cleared':3,'sql_receipt_equal':True,'raw_forwarding_equal':True,'learning_effects_unchanged':True},
 {'committed_before_pause':True,'preserved_newer_rows':3,'predecessor_revisions':[1,1],'operations':2},
 {'pages':2,'operations':1,'first_acknowledgements':1,'duplicate_acknowledgements':1},
 {'commit_observed':True,'lookup_was_informational':True,'page_store_reopened_same_context':True,'browser_restart_tested':False,'operation_uuid_preserved':True},
 {'subcases':[{'mode':mode,'native_status':status,'committed':True,'pending_preserved':True,'exact_replay_acknowledged':True} for mode,status in [('207',207),('partial',200)]]},
 {'denial_status':401,'pending_preserved':True,'same_owner_fresh_session_retry':True},
 {'actual_lock_wait_observed':True,'denial_status':401,'server_unchanged':True,'native_pending_unchanged':True},
 {'old_receipt_retained':True,'current_generation_blocked':True,'old_context_materialization_blocked':True,'pending_newer_rows':3},
 {'conflict_status':409,'whole_source_unchanged':True,'attempt_preserved':True,'server_unchanged_after_conflict':True},
 {'commit_observed':True,'fetch_aborted':True,'socket_abort_observed':True,'late_ack_refused':True,'native_intent_preserved':True,'exact_replay_acknowledged':True},
 {'native_request_success':True,'native_abort_invoked':True,'native_abort_observed':True,'unchanged_stores':11,'sql_committed':True,'exact_retry_acknowledged':True},
 {'duplicate_acknowledgement':True,'first_raw_reply_unchanged':True,'immutable_receipt_unchanged':True,'new_generation_blocks_materialization':True},
]


def browser_fixture():
    pin=json.loads((HERE/'browser-dependency.json').read_bytes());tls=tls_metadata()
    dependencies={'playwright':pin['playwright'],'playwright_core':pin['playwright'],
                  'descriptor_sha256':pin['browsers_json_sha256'],'descriptor_bytes':pin['browsers_json_bytes'],
                  'browser_revision':pin['revision'],'browser_version':pin['version'],
                  'actual_browser_version':'Chromium '+pin['version'],'browser_executable_sha256':'e'*64,
                  'node':'v24.1.0','python':'3.12.9','driver':'3.2.9'}
    names=source_labels('browser-cases.mjs')
    value={'contract':'echs.c04.browser-journal-http-actual.v1','status':'ACTUAL BROWSER HTTPS POSTGREST SQL PASS',
           'planned_groups':names,'checks':[{'name':name,'status':'PASS','elapsed_ms':1,'details':copy.deepcopy(detail)} for name,detail in zip(names,DETAILS)],
           'production_calls':0,'hosted_edge_executed':False,'hosted_tls_executed':False,'production_authority_accepted':False,
           'native_browser_executed':True,'real_https_executed':True,'postgrest_executed':True,'database_executed':True,'cleanup_complete':True,
           'source_files':rows(BROWSER),'static_routes':10,'served_t3_modules':7,'held_transport_served':False,
           'unexpected_requests':[],'page_errors':[],'rpc_observations':[],'http_observations':[],
           'browser':{'product':'Chrome/'+pin['version'],'revision':'@'+'e'*40,'playwright':pin['playwright'],
                      'descriptor_revision':pin['revision'],'executable_sha256':'e'*64},
           'tls':{'accepted_leaf':True,'served_der_sha256':tls['positive']['der_sha256'],
                  'served_spki_sha256':tls['positive']['spki_sha256'],'narrow_spki_exception':True,
                  'fresh_explicit_profile':True,'unrelated_leaf_rejected':True,'negative_application_requests':0,'broad_tls_flags':False},
           'cleanup':{'contexts_closed':True,'browser_connection_closed':True,'control_reaped':True,'listeners_closed':True,'response_tasks_remaining':0}}
    return value,tls,dependencies


def encoded(value):
    return (json.dumps(value,sort_keys=True)+'\n').encode()


def member(name,value):
    raw=encoded(value)
    return {'path':name,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}


def actual_fixture(major=15):
    browser,tls,dependencies=browser_fixture();check=checkout()
    source={'manifest_sha256':'f'*64,'source_files':rows(OWNED),'inputs':[]}
    tags=runner.image_tags(major)
    images={name:{'reference':tag,'repository_digest':tag,'image_id':runner.IMAGE_IDS[tag]} for name,tag in tags.items()}
    proof={'subreaper_enabled':True,'registered_roots':3,'registered_roots_reaped_by_registry':0,
           'descendants_observed':5,'adopted_descendants_reaped':2,'pidfd_signals_sent':2,'complete_scans':4,'descendants_remaining':0}
    version=str(major)+'.1 (Debian 1.0-1)'
    run={'contract':'echs.c04.browser-journal-service-run.v1','status':'ACTUAL BROWSER JOURNAL SERVICES PASS',
         'run_id':'1'*32,'tested_sha':check['tested_commit'],'tested_tree':check['tested_tree'],
         'postgres_version_after':version,'postgres_major':major,'production_calls':0,'groups':20,'browser_groups':12,
         'hosted_edge_executed':False,'hosted_tls_executed':False,
         **{name:True for name in ('tls_executed','browser_persistence_executed','service_start_attempted','cleanup_complete','fresh_sql_denial_observed','cdp_listener_absent','tls_listeners_absent','process_cleanup_complete','secrets_removed')},
         'installation':{'migrations':27,'journal_owners_initial':0,'postgres_version':version,'storage_service_executed':False},
         'network':{'name':'echs-journal-http-'+'1'*32,'network_id':'1'*64,'internal':True,'published_ports':False,
                    'services':{name:{'container_id':str(i)*64,'ipv4':'172.20.0.'+str(i),'image_id':images[name]['image_id']} for i,name in [(2,'db'),(3,'rest')]}},
         'readiness':{'http_status':403,'code':'28000','ready':True},'browser_cdp':{'loopback':True,'owned_browser_listener':True},
         'process_cleanup':[{'role':role,'reaped':True,'group_members_remaining':0} for role in ('http','driver','browser')],
         'descendant_cleanup':copy.deepcopy(proof),'descendant_absence':copy.deepcopy(proof),'child_executions':[]}
    labels=source_labels('test_http.mjs')
    http={'contract':'echs.c04.journal-http-actual.v1','status':'ACTUAL HTTP POSTGREST SQL PASS','planned_groups':labels,'checks':list(labels),
          'real_http_executed':True,'postgrest_executed':True,'database_executed':True,'hosted_edge_executed':False,
          'tls_executed':False,'browser_persistence_executed':False,'http_attempted':True,'control_reaped':True,'production_calls':0,
          'http_metrics':{'requests':30,'responses':29,'dropped':1},'rpc_observations':[],'source_files':rows(HTTP)}
    reports={'checkout.json':check,'source-receipt.json':copy.deepcopy(source),'image-receipt.json':images,
             'http-results.json':http,'browser-results.json':browser,'dependency-receipt.json':dependencies,
             'tls-material.json':tls,'final-source-receipt.json':copy.deepcopy(source),'run-report.json':run}
    run['child_executions']=[{'role':role,'run_id':run['run_id'],'postgres_major':major,'source_manifest_sha256':source['manifest_sha256'],
                            'exit_code':0,'output':member(name,reports[name])} for role,name in [('http','http-results.json'),('driver','browser-results.json')]]
    return reports,source


def local_fixture(source):
    reports={'contract-tests.json':{'contract':'echs.c04.browser-http-contract-tests.v1','status':'PASS','tests':20,'failed':0,'source_files':rows(OWNED)}}
    for is_cert in (True,False):
        name='cert' if is_cert else 'supervisor';files=['certs.py','test_certs.py'] if is_cert else ['processes.py','test_supervisor.py']
        value={'contract':'echs.browser-journal.'+('certificate' if is_cert else name)+'-tests.v1','status':'PASS','tests':14 if is_cert else 17,
               'failures':0,'errors':0,'skipped':0,'actual_openssl_available' if is_cert else 'actual_linux_available':True,
               'required_actual':True,'skip_reasons':[],'sources':[{key:row[key] for key in ('path','sha256')} for row in rows(files)],
               'scope':'Local guards plus actual OpenSSL generation and Python TLS only when executed; no browser or hosted TLS claim.' if is_cert else 'Ownership guards and direct Linux child/group/socket tests only; no escaped-descendant, Chromium, browser, SQL or production acceptance.'}
        if not is_cert:value['failed_identifiers']=[]
        reports[name+'-tests.json']=value
    reports['descendant-tests.json']={'status':'PASS','tests':20,'require_linux':True,'native_linux_available':True,'failures':0,'errors':0,'skipped':0}
    reports['https-tests.json']={'status':'NODE LOOPBACK TLS PASS; NO BROWSER OR SQL ACCEPTANCE','groups':10,
                                 'checks':re.findall(r"^ await test\('([^']+)'",(HERE/'test_https_bridge.mjs').read_text(),re.MULTILINE)}
    reports['bridge-tests.json']={'contract':'echs.c04.journal-http-loopback-adapter.v1','status':'PASS','groups':9,
                                  'outcomes':[{'name':name,'status':'PASS'} for name in re.findall(r"^test\('([^']+)'",(HERE/'test_bridge.mjs').read_text(),re.MULTILINE)],
                                  'real_loopback_http':True,'postgrest_executed':False,'database_executed':False,'production_calls':0}
    reports['local-executions.json']={'contract':'echs.c04.browser-http-local-executions.v1','status':'PASS',
                                    'source_manifest_sha256':source['manifest_sha256'],'source_before':copy.deepcopy(source),'source_after':copy.deepcopy(source),
                                    'executions':[{'suite':suite,'exit_code':0,'output':member(name,reports[name])} for suite,name in zip(['contract','cert','supervisor','descendant','https','bridge'],assemble.TEST_NAMES)]}
    return reports


class ContractTests(unittest.TestCase):
    def temporary(self):
        parent=WORK_DIR.resolve() if WORK_DIR else Path(tempfile.gettempdir()).resolve()
        value=tempfile.TemporaryDirectory(prefix='echs-contract-',dir=parent)
        resolved=Path(value.name).resolve()
        self.assertEqual(resolved.parent,parent)
        self.addCleanup(value.cleanup)
        return resolved

    def rejects(self,call,code=None):
        if code is None:
            with self.assertRaises((ValueError,TypeError,KeyError)):
                call()
        else:
            with self.assertRaisesRegex(ValueError,'^'+re.escape(code)+'$'):
                call()

    def test_01_relative_paths_and_lexical_containment(self):
        root=self.temporary();(root/'plain.txt').write_text('source')
        self.assertEqual(contract.safe_relative('tools/a-b/file.mjs'),'tools/a-b/file.mjs')
        for bad in ['../a','/a','a//b','a/./b','a/../b','C:/a','a\\b','a b',True,None]:
            with self.subTest(path=bad): self.rejects(lambda:contract.safe_relative(bad),'source-path')
        self.assertEqual(contract.guarded_path(root/'plain.txt',root),contract.file_path(root/'plain.txt').resolve())
        self.rejects(lambda:contract.guarded_path(root.parent/'escape.txt',root),'source-lexical-containment')

    def test_02_linked_ancestor_is_rejected_before_resolving(self):
        root=self.temporary();outside=self.temporary();(outside/'file').write_text('outside')
        link=root/'linked'
        try:
            link.symlink_to(outside,target_is_directory=True)
        except OSError:
            # Explicit Windows path-observation fault probe; no claim that this
            # platform actually created a symlink. The containment probe above
            # and normal-path control still use the real filesystem.
            link.mkdir();(link/'file').write_text('fixture')
            original=Path.is_symlink
            with patch.object(Path,'is_symlink',lambda value:str(value).removeprefix('\\\\?\\')==str(link) or original(value)):
                self.rejects(lambda:contract.guarded_path(link/'file',root),'source-linked-component')
        else:
            self.rejects(lambda:contract.guarded_path(link/'file',root),'source-linked-component')

    def test_03_source_rows_reject_duplicates_bool_counts_and_stale_bytes(self):
        root=self.temporary();(root/'a.txt').write_bytes(b'a\r\nb\n')
        valid=contract.info(root/'a.txt','a.txt',root)
        self.assertEqual(contract.check_rows(root,[valid],1),[valid])
        for change in [{'bytes':True},{'sha256':'0'*64},{'git_blob_sha':'0'*40},{'extra':'hidden'}]:
            bad={**valid,**change}
            with self.subTest(change=change): self.rejects(lambda:contract.check_rows(root,[bad],1))
        self.rejects(lambda:contract.check_rows(root,[valid,valid],2),'source-duplicate')
        (root/'a.txt').write_bytes(b'a\nb\n')
        self.rejects(lambda:contract.check_rows(root,[valid],1),'source-byte-identity')

    def test_04_case_labels_read_real_multiline_sources_and_reject_omissions(self):
        for name,count,prefix in [('browser-cases.mjs',12,'B'),('test_http.mjs',20,'S')]:
            value=assemble.labels(HERE/name,r"^ '([^']+)'",count)
            self.assertEqual([row.split(' ',1)[0] for row in value],[prefix+str(i).zfill(2) for i in range(1,count+1)])
        root=self.temporary();path=root/'labels.mjs'
        for raw in ["header\n 'B01 repeated'\n 'B01 repeated'\n","header\n 'B01 only'\n"]:
            path.write_text(raw)
            self.rejects(lambda:assemble.labels(path,r"^ '([^']+)'",2),'source-case-labels')

    def test_05_member_json_rejects_duplicates_nonfinite_hardlinks_and_oversize(self):
        root=self.temporary();path=root/'checkout.json'
        path.write_bytes(b'{"x":1}')
        self.assertEqual(assemble.read_member(root,'checkout.json')[0],{'x':1})
        for raw in [b'{"x":1,"x":2}',b'{"x":NaN}',b'{"x":Infinity}',b'',b' '*1048577]:
            path.write_bytes(raw)
            self.rejects(lambda:assemble.read_member(root,'checkout.json'))
        # Prove the production member reader caps allocation before rejecting;
        # a post-read length check alone would still load an unbounded file.
        fake=Mock();fake.is_file.return_value=True;fake.stat.return_value=SimpleNamespace(st_nlink=1)
        stream=Mock();stream.read.return_value=b'x'*1048577
        context=MagicMock();context.__enter__.return_value=stream;fake.open.return_value=context
        with patch.object(assemble.contract,'guarded_path',return_value=fake):
            self.rejects(lambda:assemble.read_member(root,'checkout.json'),'member-size')
        fake.open.assert_called_once_with('rb');stream.read.assert_called_once_with(1048577)
        fake.read_bytes.assert_not_called();context.__exit__.assert_called_once()
        path.write_bytes(b'{}');other=root/'hardlink.json'
        try: os.link(path,other)
        except OSError:
            original=Path.stat
            def linked(value,*args,**kwargs):
                result=original(value,*args,**kwargs)
                if value.name=='checkout.json':
                    return SimpleNamespace(st_nlink=2,st_mode=result.st_mode,st_size=result.st_size)
                return result
            with patch.object(Path,'stat',linked): self.rejects(lambda:assemble.read_member(root,'checkout.json'),'member-file')
        else: self.rejects(lambda:assemble.read_member(root,'checkout.json'),'member-file')
        self.rejects(lambda:assemble.read_member(root,'private-config.json'),'member-name')

    def test_06_checkout_exact_event_parent_and_run_binding(self):
        value=checkout();run={'tested_sha':value['tested_commit'],'tested_tree':value['tested_tree']}
        assemble.validate_checkout(value,run)
        for change in [{'parents':list(reversed(value['parents']))},{'head':'e'*40},{'base':'e'*40},{'tested_tree':'e'*40},{'extra':True}]:
            with self.subTest(change=change): self.rejects(lambda:assemble.validate_checkout({**value,**change},run))
        direct={**value,'event':'push','parents':['a'*40],'head':value['tested_commit'],'base':None}
        assemble.validate_checkout(direct,run)
        self.rejects(lambda:assemble.validate_checkout({**direct,'base':'a'*40},run))

    def test_07_runner_default_preflight_cannot_launch_services(self):
        fake={'source_files':[{}],'inputs':[{}]}
        with patch.object(sys,'argv',['run.py','--repo',str(REPO),'--postgres-major','15']), patch.object(runner,'verify',return_value=fake), patch.object(runner,'execution_guard') as guard, patch.object(runner.subprocess,'run',side_effect=AssertionError('unexpected process')), patch('sys.stdout',new_callable=io.StringIO) as output:
            self.assertEqual(runner.main(),0)
        guard.assert_not_called()
        value=json.loads(output.getvalue());self.assertIs(value['actual_http'],False)
        self.assertEqual(value['postgres_major'],15)
        workflow_path=HERE.parents[1]/'.github/workflows/private-learning-browser-journal-http.yml'
        raw=workflow_path.read_text(encoding='utf-8')
        workflow=yaml.load(raw,Loader=yaml.BaseLoader)
        self.assertEqual(set(workflow),{'name','on','permissions','concurrency','jobs'})
        self.assertEqual(set(workflow['on']),{'pull_request','push','workflow_dispatch'})
        self.assertEqual(workflow['on']['push']['branches'],['main'])
        self.assertEqual(workflow['on']['pull_request']['paths'],workflow['on']['push']['paths'])
        self.assertIn('tools/private-learning-browser-journal-http/**',workflow['on']['push']['paths'])
        pinned_raw=(HERE/'input-pins.json').read_bytes()
        self.assertEqual(hashlib.sha256(pinned_raw).hexdigest(),contract.INPUT_SHA)
        pinned=json.loads(pinned_raw)['files'];self.assertEqual(len(pinned),98)
        for event in ('pull_request','push'):
            patterns=workflow['on'][event]['paths']
            uncovered=[row['path'] for row in pinned if not any(fnmatchcase(row['path'],pattern) for pattern in patterns)]
            self.assertEqual(uncovered,[],event+' must trigger for all retained inputs')
        self.assertEqual(workflow['permissions'],{'contents':'read'})
        self.assertEqual(set(workflow['jobs']),{'browser'});job=workflow['jobs']['browser']
        self.assertNotIn('services',job);self.assertNotIn('container',job)
        self.assertEqual(job['strategy'],{'fail-fast':'false','max-parallel':'2','matrix':{'postgres_major':['15','17']}})
        self.assertEqual(job['runs-on'],'ubuntu-latest');self.assertEqual(job['timeout-minutes'],'30')
        # GitHub permits runner context in steps.env, but not jobs.<id>.env.
        # Keep this focused guard executable against the original invalid form.
        def validate_browser_cache_environment(candidate):
            self.assertEqual(candidate['env'],{'PYTHONDONTWRITEBYTECODE':'1'})
            cache={'PLAYWRIGHT_BROWSERS_PATH':'${{ runner.temp }}/echs-browser-bin'}
            self.assertEqual(len(candidate['steps']),9)
            for index,step in enumerate(candidate['steps']):
                if index in (3,5):self.assertEqual(step.get('env'),cache)
                else:self.assertNotIn('env',step)
        validate_browser_cache_environment(job)
        original=copy.deepcopy(job)
        original['env']['PLAYWRIGHT_BROWSERS_PATH']='${{ runner.temp }}/echs-browser-bin'
        for index in (3,5):original['steps'][index].pop('env')
        with self.assertRaises(AssertionError):validate_browser_cache_environment(original)
        for index in (3,5):
            missing=copy.deepcopy(job);missing['steps'][index].pop('env')
            with self.assertRaises(AssertionError):validate_browser_cache_environment(missing)
        wrong=copy.deepcopy(job);wrong['steps'][5]['env']['PLAYWRIGHT_BROWSERS_PATH']='unbound-cache'
        with self.assertRaises(AssertionError):validate_browser_cache_environment(wrong)
        self.assertNotIn('secrets.',raw);self.assertNotIn('pull_request_target',raw)
        steps=job['steps'];self.assertEqual(len(steps),9)
        self.assertEqual([step['uses'] for step in steps if 'uses' in step],[
            'actions/checkout@11d5960a326750d5838078e36cf38b85af677262',
            'actions/setup-python@a26af69be951a213d495a4c3e4e4022e16d87065',
            'actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020',
            *['actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02']*2])
        self.assertEqual(steps[0]['with'],{'fetch-depth':'0','persist-credentials':'false'})
        self.assertEqual(steps[1]['with'],{'python-version':'3.12'});self.assertEqual(steps[2]['with'],{'node-version':'24'})
        self.assertEqual(steps[3]['run'].splitlines(),[
            "python -m pip install 'psycopg[binary]==3.2.9' pglast==7.7 PyYAML==6.0.2",
            'npm ci --prefix question-bank/official/tools',
            'node question-bank/official/tools/node_modules/playwright/cli.js install --with-deps chromium --no-shell'])
        prefix='python -B tools/private-learning-browser-journal-http/'
        self.assertEqual(steps[4]['run'],prefix+'local_tests.py --repo . --output "$RUNNER_TEMP/browser-journal-local-tests" --execute')
        self.assertEqual(steps[5]['run'],prefix+'run.py --repo . --postgres-major ${{ matrix.postgres_major }} --execute')
        self.assertEqual(steps[6]['run'],prefix+'assemble.py --repo . --postgres-major ${{ matrix.postgres_major }} --directory "$RUNNER_TEMP/private-learning-browser-journal-http-${{ matrix.postgres_major }}" --tests "$RUNNER_TEMP/browser-journal-local-tests" --output "$RUNNER_TEMP/private-learning-browser-journal-http-evidence-${{ matrix.postgres_major }}"')
        self.assertEqual([step['if'] for step in steps[6:]],['always()']*3)
        for step in steps[7:]:
            self.assertEqual(step['with']['if-no-files-found'],'error');self.assertEqual(step['with']['retention-days'],'14')
        self.assertEqual(steps[7]['with']['path'],'${{ runner.temp }}/private-learning-browser-journal-http-evidence-${{ matrix.postgres_major }}')
        self.assertEqual(steps[8]['with']['path'],'${{ runner.temp }}/browser-journal-local-tests')

    def test_08_browser_launch_uses_fresh_profile_and_narrow_spki(self):
        root=self.temporary();profile=root/'new-profile';spki=base64.b64encode(b'a'*32).decode()
        args=runner.browser_arguments(root/'chrome',profile,spki)
        self.assertEqual([arg for arg in args if arg.startswith('--ignore-certificate-errors')],['--ignore-certificate-errors-spki-list='+spki])
        self.assertIn('--remote-debugging-address=127.0.0.1',args)
        self.assertNotIn('--allow-insecure-localhost',args)
        self.assertEqual([arg for arg in args if 'proxy' in arg],['--no-proxy-server'])
        self.assertEqual([arg for arg in args if re.match(r'^--(?:enable-features|disable-features|single-process)(?:=|$)',arg)],['--enable-features=NetworkServiceInProcess2'])
        proxy_script=r"""
import assert from 'node:assert/strict';
const {assertLoopbackProxyArgs,assertNetworkServiceArgs}=await import(process.argv[2]),actual=JSON.parse(process.argv[3]);
assertLoopbackProxyArgs(actual);
assertLoopbackProxyArgs(['chrome','--no-proxy-server','--user-data-dir=owned-fixture']);
for(const invalid of [null,{},['chrome',null],[],actual.filter(x=>x!=='--no-proxy-server'),[...actual,'--no-proxy-server'],actual.map(x=>x==='--no-proxy-server'?x+'=true':x)])assert.throws(()=>assertLoopbackProxyArgs(invalid));
for(const flag of ['--proxy-server','--proxy-pac-url','--proxy-auto-detect','--proxy-bypass-list']){
 for(const value of [flag,flag+'=synthetic-local-fixture'])assert.throws(()=>assertLoopbackProxyArgs([...actual,value]));
}
// This fixture uses an explicitly different process layout; these checks do
// not assert repair of Chromium's original out-of-process network service.
const feature='--enable-features=NetworkServiceInProcess2';
assertNetworkServiceArgs(actual);
assertNetworkServiceArgs(['chrome',feature,'--headless=new']);
for(const invalid of [null,{},true,'chrome',[],[true],['chrome',null],actual.filter(x=>x!==feature),[...actual,feature]]){
 assert.throws(()=>assertNetworkServiceArgs(invalid));
}
for(const replacement of ['--enable-features','--enable-features=',
 '--enable-features=NetworkServiceInProcess','--enable-features=networkserviceinprocess2',
 '--enable-features=NetworkServiceInProcess2,Other','--enable-features=Other,NetworkServiceInProcess2',
 '--enable-features=NetworkServiceInProcess2,NetworkServiceInProcess2','--enable-features=NetworkServiceInProcess2<Trial']){
 assert.throws(()=>assertNetworkServiceArgs(actual.map(x=>x===feature?replacement:x)));
}
for(const conflict of ['--disable-features','--disable-features=NetworkServiceInProcess2','--disable-features=Other',
 '--single-process','--single-process=true','--single-process=false','--enable-features=Other']){
 assert.throws(()=>assertNetworkServiceArgs([...actual,conflict]));
}
assert.throws(()=>assertNetworkServiceArgs([...actual.filter(x=>x!==feature),'--enable-features','NetworkServiceInProcess2']));
process.stdout.write('fixed-loopback-proxy-argv-pass');
"""
        checked=subprocess.run(['node','--input-type=module','-',(HERE/'test_browser_http.mjs').as_uri(),json.dumps(args)],input=proxy_script,text=True,capture_output=True,timeout=15,check=True)
        self.assertEqual(checked.stdout,'fixed-loopback-proxy-argv-pass');self.assertEqual(checked.stderr,'')
        profile.mkdir();self.rejects(lambda:runner.browser_arguments(root/'chrome',profile,spki),'fresh-browser-profile')
        self.rejects(lambda:runner.browser_arguments(root/'chrome',root/'fresh','bad'),'browser-spki')

    def test_09_readiness_requires_exact_fresh_sql_denial(self):
        self.assertEqual(runner.readiness_observation(403,b'{"code":"28000"}'),{'http_status':403,'code':'28000','ready':True})
        for status,raw in [(401,b'{"code":"28000"}'),(403,b'{"code":"PGRST202"}'),(200,b'{"code":"28000"}'),(403,b'x'*1025),(403,b'null')]:
            self.assertIs(runner.readiness_observation(status,raw)['ready'],False)
        for status in [True,0,600,301,302,307,308]: self.rejects(lambda:runner.readiness_observation(status,b'{}'))

    def test_10_browser_positive_control_and_required_outcome_details(self):
        value,tls,dependencies=browser_fixture();assemble.validate_browser(value,tls,dependencies)
        for index in range(12):
            bad=copy.deepcopy(value);bad['checks'][index]['details']['unexpected']='fixture'
            with self.subTest(index=index): self.rejects(lambda:assemble.validate_browser(bad,tls,dependencies))
        bad=copy.deepcopy(value);bad['checks'][1]['details']['predecessor_revisions']=[True,True]
        self.rejects(lambda:assemble.validate_browser(bad,tls,dependencies))

    def test_11_browser_closed_shapes_reject_hidden_fields(self):
        value,tls,dependencies=browser_fixture();assemble.validate_browser(value,tls,dependencies)
        for location in [(),('browser',),('cleanup',),('tls',),('checks',0)]:
            bad=copy.deepcopy(value);target=bad
            for key in location: target=target[key]
            target['private_material']='synthetic-do-not-publish'
            with self.subTest(location=location): self.rejects(lambda:assemble.validate_browser(bad,tls,dependencies))

    def test_12_browser_flags_numeric_types_and_leaf_identity_are_strict(self):
        value,tls,dependencies=browser_fixture();assemble.validate_browser(value,tls,dependencies)
        for location,key,replacement in [((),'production_calls',False),((),'native_browser_executed',1),
             ((),'hosted_edge_executed',0),(('checks',0),'elapsed_ms',True),(('tls',),'negative_application_requests',False),
             (('tls',),'served_der_sha256','0'*64),(('tls',),'broad_tls_flags',True),(('cleanup',),'response_tasks_remaining',False)]:
            bad=copy.deepcopy(value);target=bad
            for part in location: target=target[part]
            target[key]=replacement
            with self.subTest(location=location,key=key): self.rejects(lambda:assemble.validate_browser(bad,tls,dependencies))

    def test_13_actual_positive_controls_select_both_majors(self):
        self.assertEqual(BROWSER,assemble.BROWSER_SOURCES);self.assertEqual(HTTP,assemble.HTTP_SOURCES)
        for major in (15,17):
            reports,source=actual_fixture(major)
            with self.subTest(major=major):assemble.validate_actual(reports,source,major)
            self.rejects(lambda:assemble.validate_actual(reports,source,17 if major==15 else 15),'run-major-groups')
            bad=copy.deepcopy(reports);bad['run-report.json']['postgres_version_after']='14.1 (Debian 1.0-1)'
            self.rejects(lambda:assemble.validate_actual(bad,source,major),'actual-postgres-version')

    def test_14_exact_sources_reject_valid_hash_substitutions_and_stale_sweeps(self):
        reports,source=actual_fixture();assemble.validate_actual(reports,source,15)
        for name in ['http-results.json','browser-results.json']:
            bad=copy.deepcopy(reports);bad[name]['source_files'][-1]=rows(['contract.py'])[0]
            with self.subTest(name=name):self.rejects(lambda:assemble.validate_actual(bad,source,15), 'http-runtime-binding' if name.startswith('http-') else 'browser-runtime-binding')
        for name in ['source-receipt.json','final-source-receipt.json']:
            bad=copy.deepcopy(reports);bad[name]['manifest_sha256']='0'*64
            with self.subTest(name=name):self.rejects(lambda:assemble.validate_actual(bad,source,15),'exact-source-sweeps')

    def test_15_run_counts_cleanup_and_hidden_fields_fail_closed(self):
        reports,source=actual_fixture();assemble.validate_actual(reports,source,15)
        changes=[((),'production_calls',False),((),'cleanup_complete',False),((),'service_start_attempted',False),
                 (('installation',),'journal_owners_initial',False),(('installation',),'migrations',26),
                 (('descendant_absence',),'descendants_remaining',1),(('descendant_cleanup',),'registered_roots_reaped_by_registry',1),
                 (('process_cleanup',0),'group_members_remaining',False),(('network',),'published_ports',True)]
        for path,key,replacement in changes:
            bad=copy.deepcopy(reports);target=bad['run-report.json']
            for item in path:target=target[item]
            target[key]=replacement
            with self.subTest(path=path,key=key):self.rejects(lambda:assemble.validate_actual(bad,source,15))
        for name,path in [('run-report.json',()),('run-report.json',('network','services','db')),('http-results.json',()),('dependency-receipt.json',())]:
            bad=copy.deepcopy(reports);target=bad[name]
            for item in path:target=target[item]
            target['private_material']='synthetic'
            with self.subTest(name=name,path=path):self.rejects(lambda:assemble.validate_actual(bad,source,15))

    def test_16_local_evidence_binds_real_sources_exact_counts_and_no_skips(self):
        _,source=actual_fixture();reports=local_fixture(source);assemble.validate_local(reports)
        for name,key,replacement in [('contract-tests.json','failed',False),('contract-tests.json','tests',19),
             ('cert-tests.json','skipped',1),('supervisor-tests.json','required_actual',False),
             ('descendant-tests.json','native_linux_available',False),('bridge-tests.json','production_calls',False),
             ('https-tests.json','groups',True)]:
            bad=copy.deepcopy(reports);bad[name][key]=replacement
            with self.subTest(name=name,key=key):self.rejects(lambda:assemble.validate_local(bad))
        bad=copy.deepcopy(reports);bad['contract-tests.json']['source_files'][0]['sha256']='0'*64
        self.rejects(lambda:assemble.validate_local(bad),'local-contract-sources')
        bad=copy.deepcopy(reports);bad['https-tests.json']['checks'].reverse()
        self.rejects(lambda:assemble.validate_local(bad),'local-https-tests')
        bad=copy.deepcopy(reports);bad['local-executions.json']['executions'][0]['exit_code']=False
        self.rejects(lambda:assemble.validate_local(bad),'local-index-shape')

    def test_17_child_execution_receipts_require_waited_output_and_current_scope(self):
        reports,source=actual_fixture();run=reports['run-report.json'];members=[member(name,reports[name]) for name in assemble.RUN_NAMES]
        assemble.validate_actual(reports,source,15);assemble.validate_child_executions(run,members,source,15)
        for key,replacement in [('run_id','2'*32),('postgres_major',17),('source_manifest_sha256','0'*64),('exit_code',1)]:
            bad=copy.deepcopy(run);bad['child_executions'][0][key]=replacement
            with self.subTest(key=key):self.rejects(lambda:assemble.validate_child_executions(bad,members,source,15),'child-execution-binding')
        bad=copy.deepcopy(run);bad['child_executions'][0]['output']['sha256']='0'*64
        self.rejects(lambda:assemble.validate_child_executions(bad,members,source,15),'child-execution-binding')
        bad=copy.deepcopy(reports);bad['run-report.json']['child_executions'][0]['exit_code']=False
        self.rejects(lambda:assemble.validate_actual(bad,source,15),'run-report-shape')

    def test_18_collector_checks_current_git_tree_parents_and_actual_event(self):
        root=self.temporary();path=root/'event.json';value=checkout()
        event={'pull_request':{'base':{'sha':value['base']},'head':{'sha':value['head']}}};path.write_bytes(encoded(event))
        results={('rev-parse','HEAD'):value['tested_commit'],('rev-parse','HEAD^{tree}'):value['tested_tree'],('show','-s','--format=%P','HEAD'):' '.join(value['parents'])}
        def git(argv,**kwargs):
            self.assertEqual(argv[:3],['git','-C',str(REPO)])
            return SimpleNamespace(stdout=results[tuple(argv[3:])]+'\n')
        with patch.object(assemble.subprocess,'run',side_effect=git),patch.dict(os.environ,{'GITHUB_SHA':value['tested_commit'],'GITHUB_EVENT_NAME':'pull_request','GITHUB_EVENT_PATH':str(path)}):
            assemble.validate_current_checkout(REPO,value)
            for key in results:
                old=results[key];results[key]='0'*40
                self.rejects(lambda:assemble.validate_current_checkout(REPO,value));results[key]=old
            event['pull_request']['base']['sha']='e'*40;path.write_bytes(encoded(event))
            self.rejects(lambda:assemble.validate_current_checkout(REPO,value),'collector-event-head-base')

    def collector_fixture(self):
        root=self.temporary();directory=root/'run';directory.mkdir();tests=root/'tests';tests.mkdir()
        reports,source=actual_fixture();local=local_fixture(source)
        for name in assemble.RUN_NAMES:(directory/name).write_bytes(encoded(reports[name]))
        members=[member(name,reports[name]) for name in assemble.RUN_NAMES]
        (directory/'run-members.json').write_bytes(encoded({'status':'ACTUAL BROWSER JOURNAL SERVICES PASS','cleanup_complete':True,'members':members}))
        for name,value in local.items():(tests/name).write_bytes(encoded(value))
        return directory,tests,source

    def test_19_collector_closes_exact_artifact_members_and_refuses_extra_input(self):
        directory,tests,source=self.collector_fixture()
        with patch.object(assemble.contract,'sources',return_value=source),patch.object(assemble,'validate_current_checkout') as checkout_probe:
            value=assemble.assemble(directory,tests,REPO,15)
        checkout_probe.assert_called_once();self.assertEqual(value['actual_total_groups'],32)
        self.assertIs(value['historical_groups_rerun_here'],False);self.assertIs(value['charter_c04_complete'],False)
        index=json.loads((directory/'artifact-index.json').read_bytes())
        self.assertEqual({p.name for p in directory.iterdir()},{row['path'] for row in index['members']}|{'artifact-index.json'})
        self.assertEqual(len(index['members']),18)
        for row in index['members']:self.assertEqual(assemble.read_member(directory,row['path'])[1],row)
        for extra_target in ('run','tests'):
            directory,tests,source=self.collector_fixture();((directory if extra_target=='run' else tests)/'private.json').write_bytes(b'{}')
            with patch.object(assemble.contract,'sources',return_value=source),patch.object(assemble,'validate_current_checkout'):
                self.rejects(lambda:assemble.assemble(directory,tests,REPO,15))
            self.assertFalse((directory/'artifact-index.json').exists())
        for major in [True,False,14,16,'15']:
            self.rejects(lambda:assemble.assemble(directory,tests,REPO,major),'matrix-major')
        # Exercise the actual publication boundary against separate real temp
        # folders. Only source verification/Git observations are injected.
        directory,tests,source=self.collector_fixture();temporary=self.temporary()
        output=temporary/'private-learning-browser-journal-http-evidence-15'
        with patch.dict(os.environ,{'RUNNER_TEMP':str(temporary)}),patch.object(assemble.contract,'sources',return_value=source),patch.object(assemble,'validate_current_checkout'):
            published=assemble.publish(directory,tests,REPO,15,output)
            self.assertEqual(published['status'],'PASS FOR ISOLATED ACTUAL BROWSER HTTPS SQL SCOPE')
            self.assertEqual(len(list(output.iterdir())),19)
            published_index=json.loads((output/'artifact-index.json').read_bytes())
            self.assertEqual({p.name for p in output.iterdir()},{r['path'] for r in published_index['members']}|{'artifact-index.json'})
            for row in published_index['members']:self.assertEqual(assemble.read_member(output,row['path'])[1],row)
            before={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in output.iterdir()}
            self.rejects(lambda:assemble.publish(directory,tests,REPO,15,output),'fresh-published-evidence')
            self.assertEqual(before,{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in output.iterdir()})
            for wrong in [temporary/'wrong-name',temporary/'private-learning-browser-journal-http-evidence-17',temporary/'nested'/'private-learning-browser-journal-http-evidence-15']:
                self.rejects(lambda:assemble.publish(directory,tests,REPO,15,wrong),'fresh-published-evidence')
                self.assertFalse(wrong.exists())

    def test_20_collector_final_drift_and_report_substitution_leave_no_index(self):
        for kind in ['source','member','local-output']:
            directory,tests,source=self.collector_fixture();calls=0
            if kind=='local-output':
                path=tests/'local-executions.json';value=json.loads(path.read_bytes());value['executions'][0]['output']['sha256']='0'*64;path.write_bytes(encoded(value))
            def verify(*args):
                nonlocal calls
                calls+=1
                if calls==2:
                    if kind=='source':return {**source,'manifest_sha256':'0'*64}
                    if kind=='member':(directory/'http-results.json').write_bytes(b'{}')
                return source
            with patch.object(assemble.contract,'sources',side_effect=verify),patch.object(assemble,'validate_current_checkout'):
                self.rejects(lambda:assemble.assemble(directory,tests,REPO,15))
            self.assertFalse((directory/'artifact-index.json').exists())
        secret='SYNTHETIC_PRIVATE_VALUE_DO_NOT_UPLOAD_9741'
        # Import only the fixture's pure diagnostics: its main guard prevents
        # browser/service execution. Private messages and paths never leave.
        diagnostic_script=r"""
import assert from 'node:assert/strict';
const {browserDiagnostic,failedBrowserGroup,BROWSER_FAILURE_STAGES,BROWSER_NETWORK_ERRORS}=await import(process.argv[2]);
const secret='SYNTHETIC_PRIVATE_VALUE_DO_NOT_UPLOAD_9741';
const error={name:'TimeoutError',constructor:{name:'RenamedBrowserError'},message:secret+' net::ERR_CERT_AUTHORITY_INVALID at https://private.invalid/'+secret,stack:'at goto (/private/'+secret+'/test_browser_http.mjs:141:52)'};
assert.deepEqual(browserDiagnostic(error,'positive-navigation'),{type:'TimeoutError',stage:'positive-navigation',network_error:'ERR_CERT_AUTHORITY_INVALID',location:{file:'test_browser_http.mjs',line:141,column:52}});
for(const name of ['Error','TimeoutError','TargetClosedError','AssertionError','TypeError','RangeError','ReferenceError'])assert.equal(browserDiagnostic({name}).type,name);
for(const network of BROWSER_NETWORK_ERRORS)assert.equal(browserDiagnostic({message:'net::'+network}).network_error,network);
for(const stage of BROWSER_FAILURE_STAGES)assert.equal(browserDiagnostic({},stage).stage,stage);
for(const invalid of [secret,[secret],{secret},null,true,1]){
 const value=browserDiagnostic({name:invalid,constructor:{name:invalid},message:invalid,stack:invalid},invalid);
 assert.deepEqual(value,{type:'OtherError'});assert.equal(JSON.stringify(value).includes(secret),false);
}
for(const message of ['net::ERR_'+secret,'net::ERR_FAILED_SUFFIX',secret.repeat(300)+' net::ERR_FAILED'])assert.equal('network_error' in browserDiagnostic({message}),false);
for(const stack of ['x'.repeat(32769)+' test_browser_http.mjs:1:2','other-test_browser_http.mjs:1:2','test_http.mjs:999999999:2','test_browser_http.mjs:0:2','browser-cases.mjs:1000001:2'])assert.equal('location' in browserDiagnostic({stack}),false);
const getters={};for(const key of ['name','constructor','message','stack','sqlstate','code','cause','operator','actual','expected'])Object.defineProperty(getters,key,{get(){throw new Error(secret)}});
assert.deepEqual(browserDiagnostic(getters,secret),{type:'OtherError'});
for(const value of [null,undefined,true,false,-1,12,1.5,secret])assert.equal(failedBrowserGroup(value),'setup');
for(let i=0;i<12;i++)assert.equal(failedBrowserGroup(i).slice(0,3),'B'+String(i+1).padStart(2,'0'));
process.stdout.write(JSON.stringify({stages:BROWSER_FAILURE_STAGES,network_errors:BROWSER_NETWORK_ERRORS}));
"""
        checked=subprocess.run(['node','--input-type=module','-',(HERE/'test_browser_http.mjs').as_uri()],input=diagnostic_script,text=True,capture_output=True,timeout=15,check=True)
        declared=json.loads(checked.stdout)
        self.assertEqual(set(declared['stages']),assemble.BROWSER_FAILURE_STAGES)
        self.assertEqual(set(declared['network_errors']),assemble.BROWSER_NETWORK_ERRORS)
        self.assertNotIn(secret,checked.stdout+checked.stderr)
        self.assertEqual(runner.FAILURE_STAGES,assemble.RUN_FAILURE_STAGES)
        self.assertEqual(set(runner.FAILURE_SOURCE_NAMES),assemble.RUN_FAILURE_SOURCE_NAMES)
        # Exercise the real exported passive observers with injected event
        # emitters. This makes no browser, socket, TLS or SQL execution claim.
        observer_script=r"""
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
const {observeSetupBrowser}=await import(process.argv[2]);
const {observeSetupTransport,SETUP_TRANSPORT_CODES}=await import(process.argv[3]);
const secret='SYNTHETIC_PRIVATE_VALUE_DO_NOT_UPLOAD_9741';
const hostile=key=>Object.defineProperty({},key,{get(){throw new Error(secret)}});
const server=new EventEmitter(),emit=server.emit;let outsideRequests=0;
const foreign=()=>outsideRequests++;server.on('request',foreign);
assert.equal(server.listenerCount('clientError'),0);
const transport=observeSetupTransport(server);
assert.equal(server.emit,emit);assert.equal(server.listenerCount('clientError'),0);
assert.deepEqual(transport.snapshot(),{counts:{tcp_connections:0,tls_connections:0,tls_errors:0,http_requests:0},saturated:false,last_tls_error:null});
const socket=new Proxy({},{get(){throw new Error(secret)}});
assert.doesNotThrow(()=>server.emit('connection',socket));assert.doesNotThrow(()=>server.emit('secureConnection',socket));
assert.doesNotThrow(()=>server.emit('request',socket,socket));assert.equal(outsideRequests,1);
for(const code of SETUP_TRANSPORT_CODES){server.emit('tlsClientError',{code,message:secret},socket);assert.equal(transport.snapshot().last_tls_error,code)}
for(const value of [secret,true,1,[],{},null]){server.emit('tlsClientError',{code:value});assert.equal(transport.snapshot().last_tls_error,'OTHER')}
assert.doesNotThrow(()=>server.emit('tlsClientError',hostile('code')));
const copied=transport.snapshot();copied.counts.tcp_connections=999;assert.equal(transport.snapshot().counts.tcp_connections,1);
for(let i=0;i<300;i++)for(const event of ['connection','secureConnection','tlsClientError','request'])server.emit(event,{code:secret},socket);
const cappedTransport=transport.snapshot();assert.ok(Object.values(cappedTransport.counts).every(n=>n===255));assert.equal(cappedTransport.saturated,true);
transport.dispose();transport.dispose();assert.equal(server.emit,emit);assert.equal(server.listenerCount('clientError'),0);
assert.equal(server.listenerCount('connection'),0);assert.equal(server.listenerCount('secureConnection'),0);assert.equal(server.listenerCount('tlsClientError'),0);assert.deepEqual(server.listeners('request'),[foreign]);
for(const event of ['connection','secureConnection','tlsClientError','request'])server.emit(event,{code:'ECONNRESET'},socket);
assert.deepEqual(transport.snapshot(),cappedTransport);

const page=new EventEmitter(),cdp=new EventEmitter(),browser=observeSetupBrowser();let outsideLoads=0;
const outside=()=>outsideLoads++;page.on('load',outside);browser.attach(page,cdp);
const first=browser.snapshot();assert.equal(Object.keys(first.counts).length,15);assert.ok(Object.values(first.counts).every(n=>n===0));
assert.equal(first.identity_verified,false);assert.equal(first.document_status,null);assert.equal(first.network_error,null);assert.equal(first.saturated,false);
const navigation={isNavigationRequest:()=>true},subresource={isNavigationRequest:()=>false};
for(const key of ['url','headers','postData','body'])Object.defineProperty(navigation,key,{get(){throw new Error(secret)}});
page.emit('request',navigation);page.emit('request',subresource);
page.emit('response',{request:()=>navigation,status:()=>200});page.emit('response',{request:()=>subresource,status:()=>500});
assert.equal(browser.snapshot().document_status,200);
for(const value of [true,false,0,99,600,1.5,secret,null])page.emit('response',{request:()=>navigation,status:()=>value});
assert.equal(browser.snapshot().document_status,200);
for(const status of [100,599]){page.emit('response',{request:()=>navigation,status:()=>status});assert.equal(browser.snapshot().document_status,status)}
page.emit('requestfailed',{failure:()=>({errorText:secret+' net::ERR_CONNECTION_RESET'})});assert.equal(browser.snapshot().network_error,'ERR_CONNECTION_RESET');
cdp.emit('Network.requestWillBeSent',socket);cdp.emit('Network.responseReceived',socket);
cdp.emit('Network.loadingFailed',{errorText:secret});assert.equal(browser.snapshot().network_error,'OTHER');
const badStatus=Object.defineProperty({request:()=>navigation},'status',{get(){throw new Error(secret)}});
for(const [emitter,event,value] of [[page,'request',hostile('isNavigationRequest')],[page,'response',hostile('request')],[page,'response',badStatus],[page,'requestfailed',hostile('failure')],[cdp,'Network.loadingFailed',hostile('errorText')]])assert.doesNotThrow(()=>emitter.emit(event,value));
assert.equal(browser.snapshot().counts.observer_errors,5);
let calls=0,finish;const result={private:secret},pending=new Promise(resolve=>finish=resolve);
assert.equal(browser.continueRoute(()=>{calls++;return pending}),pending);
assert.equal(browser.snapshot().counts.route_attempted,1);assert.equal(browser.snapshot().counts.route_continued,0);assert.equal(browser.snapshot().counts.route_failed,0);
finish(result);assert.equal(await pending,result);assert.equal(browser.snapshot().counts.route_continued,1);
const originalError=new Error(secret),rejected=Promise.reject(originalError);
assert.equal(browser.continueRoute(()=>{calls++;return rejected}),rejected);
await assert.rejects(rejected,error=>error===originalError);assert.equal(browser.snapshot().counts.route_failed,1);
assert.throws(()=>browser.continueRoute(()=>{calls++;throw originalError}),error=>error===originalError);
assert.equal(browser.continueRoute(()=>{calls++;return result}),result);await Promise.resolve();
assert.equal(calls,4);assert.equal(browser.snapshot().counts.route_attempted,4);assert.equal(browser.snapshot().counts.route_continued,2);assert.equal(browser.snapshot().counts.route_failed,2);
browser.abortRoute();browser.identityVerified();page.emit('domcontentloaded');page.emit('load');
assert.equal(outsideLoads,1);assert.equal(browser.snapshot().identity_verified,true);
const copy=browser.snapshot();copy.counts.requests=999;assert.notEqual(browser.snapshot().counts.requests,999);
for(let i=0;i<300;i++){
 page.emit('request',navigation);page.emit('response',{request:()=>navigation,status:()=>200});page.emit('requestfailed',{failure:()=>({errorText:secret})});
 page.emit('request',hostile('isNavigationRequest'));page.emit('domcontentloaded');page.emit('load');browser.continueRoute(()=>Promise.resolve(null));browser.abortRoute();
 assert.throws(()=>browser.continueRoute(()=>{throw originalError}),error=>error===originalError);
 cdp.emit('Network.requestWillBeSent',socket);cdp.emit('Network.responseReceived',socket);cdp.emit('Network.loadingFailed',{errorText:secret});
}
await Promise.resolve();const cappedBrowser=browser.snapshot();assert.ok(Object.values(cappedBrowser.counts).every(n=>n===255));assert.equal(cappedBrowser.saturated,true);
browser.dispose();browser.dispose();for(const event of ['request','response','requestfailed','domcontentloaded','load'])page.emit(event,hostile('isNavigationRequest'));
for(const event of ['Network.requestWillBeSent','Network.responseReceived','Network.loadingFailed'])cdp.emit(event,hostile('errorText'));
assert.deepEqual(browser.snapshot(),cappedBrowser);assert.deepEqual(page.listeners('load'),[outside]);
for(const event of ['request','response','requestfailed','domcontentloaded'])assert.equal(page.listenerCount(event),0);
assert.equal(cdp.eventNames().length,0);assert.equal(JSON.stringify({cappedBrowser,cappedTransport}).includes(secret),false);
process.stdout.write(JSON.stringify({contract:'echs.c04.browser-setup-observation.v1',browser:cappedBrowser,transport:cappedTransport}));
"""
        observed=subprocess.run(['node','--input-type=module','-',(HERE/'test_browser_http.mjs').as_uri(),(HERE/'https-bridge.mjs').as_uri()],input=observer_script,text=True,capture_output=True,timeout=15,check=True)
        observation=json.loads(observed.stdout);self.assertNotIn(secret,observed.stdout+observed.stderr)
        self.assertEqual(tuple(observation['browser']['counts']),assemble.SETUP_BROWSER_COUNTS)
        self.assertEqual(tuple(observation['transport']['counts']),assemble.SETUP_TRANSPORT_COUNTS)
        assemble.validate_setup_observation(observation)
        directory=self.temporary()
        def project_setup(value,status='FAIL; NO ACCEPTANCE',group='setup',name='browser-results.json'):
            (directory/name).write_bytes(encoded({'status':status,'failed_group':group,'setup_observation':value,'service_key':secret,'failure':{'type':'TimeoutError','message':secret}}))
            with patch.object(assemble,'labels',side_effect=AssertionError('setup projection must not read rejected source labels')):
                projected=assemble.failure_projection(directory,15,ValueError(secret))
            self.assertNotIn(secret,json.dumps(projected));return projected['reports'][name]
        for transport in [observation['transport'],None]:
            valid={**observation,'transport':transport};assemble.validate_setup_observation(valid)
            self.assertEqual(project_setup(valid)['setup_observation'],valid)
        for network in [None,'OTHER',*assemble.BROWSER_NETWORK_ERRORS]:
            valid=copy.deepcopy(observation);valid['browser']['network_error']=network;assemble.validate_setup_observation(valid)
            self.assertEqual(project_setup(valid)['setup_observation'],valid)
        for code in [None,*assemble.SETUP_TRANSPORT_CODES]:
            valid=copy.deepcopy(observation);valid['transport']['last_tls_error']=code;assemble.validate_setup_observation(valid)
        for status in ['RUNNING; NOT ACCEPTED','ACTUAL BROWSER HTTPS POSTGREST SQL PASS',True,None]:
            self.assertNotIn('setup_observation',project_setup(observation,status=status))
        for group in ['B01', 'B01 '+secret, None,True,[],{}]:
            self.assertNotIn('setup_observation',project_setup(observation,group=group))
        for name in ['run-report.json','http-results.json']:
            self.assertNotIn('setup_observation',project_setup(observation,name=name))
        for branch in [(),('browser',),('browser','counts'),('transport',),('transport','counts')]:
            invalid=copy.deepcopy(observation);target=invalid
            for key in branch:target=target[key]
            target['private_url']=secret;self.rejects(lambda:assemble.validate_setup_observation(invalid))
            self.assertNotIn('setup_observation',project_setup(invalid))
        for side,names in [('browser',assemble.SETUP_BROWSER_COUNTS),('transport',assemble.SETUP_TRANSPORT_COUNTS)]:
            for name in names:
                for number in [True,False,-1,256,1.5,None,secret]:
                    invalid=copy.deepcopy(observation);invalid[side]['counts'][name]=number
                    self.rejects(lambda:assemble.validate_setup_observation(invalid));self.assertNotIn('setup_observation',project_setup(invalid))
            for key in ['saturated']+(['identity_verified'] if side=='browser' else []):
                for value in [0,1,None,secret]:
                    invalid=copy.deepcopy(observation);invalid[side][key]=value
                    self.rejects(lambda:assemble.validate_setup_observation(invalid));self.assertNotIn('setup_observation',project_setup(invalid))
        for key,values in [('network_error',[True,[],{},secret,'ERR_FAILED_SUFFIX']),('document_status',[True,False,99,600,1.5,secret])]:
            for value in values:
                invalid=copy.deepcopy(observation);invalid['browser'][key]=value
                self.rejects(lambda:assemble.validate_setup_observation(invalid));self.assertNotIn('setup_observation',project_setup(invalid))
        for value in [True,[],{},secret,'ECONNRESET_SUFFIX']:
            invalid=copy.deepcopy(observation);invalid['transport']['last_tls_error']=value
            self.rejects(lambda:assemble.validate_setup_observation(invalid));self.assertNotIn('setup_observation',project_setup(invalid))
        for value in [None,True,[],secret,{}, {'contract':'wrong','browser':observation['browser'],'transport':None}]:
            self.rejects(lambda:assemble.validate_setup_observation(value));self.assertNotIn('setup_observation',project_setup(value))
        # Execute the exact wrapper body with injected resource/os modules;
        # actual Linux exec and file-limit evidence belongs to the existing
        # native supervisor group, which is explicitly skipped on Windows.
        argv=[sys.executable,'-B','-c','pass','literal spaces;$(not-a-command)']
        wrapped=runner.protocol_driver_arguments(argv)
        self.assertEqual(wrapped,[sys.executable,'-c',runner.PROTOCOL_EXEC,*argv])
        self.assertEqual(runner.PROTOCOL_LOG_LIMIT,2097152)
        for invalid in [None,[],[True],['relative-python'],[sys.executable,''],[sys.executable,'bad\0argument']]:
            self.rejects(lambda:runner.protocol_driver_arguments(invalid))
        for hard,expected in [(-1,2097152),(4194304,2097152),(4096,4096),(0,0)]:
            resource=SimpleNamespace(RLIMIT_FSIZE=19,RLIM_INFINITY=-1,getrlimit=Mock(return_value=(0,hard)),setrlimit=Mock())
            operating=SimpleNamespace(execv=Mock());arguments=SimpleNamespace(argv=['-c',*argv])
            with patch.dict(sys.modules,{'resource':resource,'os':operating,'sys':arguments}):
                exec(compile(runner.PROTOCOL_EXEC,'<owned-protocol-wrapper>','exec'),{})
            resource.getrlimit.assert_called_once_with(19);resource.setrlimit.assert_called_once_with(19,(expected,expected))
            operating.execv.assert_called_once_with(argv[0],argv)
        failure=OSError(secret);resource.setrlimit=Mock(side_effect=failure);operating.execv.reset_mock()
        with patch.dict(sys.modules,{'resource':resource,'os':operating,'sys':arguments}):
            with self.assertRaises(OSError) as raised:exec(compile(runner.PROTOCOL_EXEC,'<owned-protocol-wrapper>','exec'),{})
        self.assertIs(raised.exception,failure);operating.execv.assert_not_called()
        boundary_script=r"""
import assert from 'node:assert/strict';
const {protocolBoundary}=await import(process.argv[2]);
const runId='a'.repeat(32),events=[],lines=[];
const stop=protocolBoundary({disable(){events.push('disable');return 'pw:protocol'}},runId,line=>{events.push('write');lines.push(line);return Buffer.byteLength(line)});
stop();stop();assert.deepEqual(events,['disable','write']);assert.equal(lines.length,1);
assert.equal(lines[0],'ECHS_PROTOCOL_BOUNDARY '+JSON.stringify({contract:'echs.c04.browser-protocol-boundary.v1',run_id:runId,phase:'setup'})+'\n');
for(const invalid of ['',true,null,'a'.repeat(31),'SYNTHETIC_PRIVATE_VALUE_DO_NOT_UPLOAD_9741']){
 let touched=0;assert.throws(()=>protocolBoundary({disable(){touched++;return 'pw:protocol'}},invalid,()=>touched++));assert.equal(touched,0);
}
for(const mode of ['wrong-channel','short-write','throw-write']){
 let disables=0,writes=0;const error=new Error('synthetic write failure');
 const boundary=protocolBoundary({disable(){disables++;return mode==='wrong-channel'||disables>1?'':'pw:protocol'}},runId,line=>{writes++;if(mode==='throw-write')throw error;return Buffer.byteLength(line)-1});
 if(mode==='throw-write')assert.throws(boundary,e=>e===error);else assert.throws(boundary);
 assert.throws(boundary);assert.equal(writes,mode==='wrong-channel'?0:1);
}
process.stdout.write(JSON.stringify({boundary:'PASS',run_bound:true,disable_precedes_marker:true}));
"""
        boundary=subprocess.run(['node','--input-type=module','-',(HERE/'test_browser_http.mjs').as_uri()],input=boundary_script,text=True,capture_output=True,timeout=15,check=True)
        self.assertEqual(json.loads(boundary.stdout),{'boundary':'PASS','run_bound':True,'disable_precedes_marker':True})
        self.assertNotIn(secret,boundary.stdout+boundary.stderr)
        run_id='a'*32;origin='https://127.0.0.1:45678';session=secret+'-session'
        def send(identifier,method,params=None,selected=session):
            return True,{'id':identifier,'method':method,'params':params or {},'sessionId':selected}
        def reply(identifier,error=False,selected=session):
            return False,{'id':identifier,'error' if error else 'result':{'private':secret},'sessionId':selected}
        def event(method,params,selected=session):return False,{'method':method,'params':params,'sessionId':selected}
        def network(identifier,url=origin):return event('Network.requestWillBeSent',{'requestId':identifier,'request':{'url':url,'headers':{'private':secret},'postData':secret}})
        def paused(identifier,network_id=None,url=origin):
            params={'requestId':identifier,'request':{'url':url,'headers':{'private':secret}}}
            if network_id is not None:params['networkId']=network_id
            return event('Fetch.requestPaused',params)
        records=[send(1,'Network.enable'),reply(1),send(2,'Fetch.enable'),reply(2,True),
                 send(3,'Page.navigate',{'url':origin+'/'}),reply(3),network(secret+'-n1'),paused(secret+'-p1',secret+'-n1'),
                 send(4,'Fetch.continueRequest',{'requestId':secret+'-p1'}),reply(4),network(secret+'-n2'),
                 paused(secret+'-p3',secret+'-n3'),paused(secret+'-p4'),
                 event('Network.responseReceived',{'requestId':secret+'-n1'}),event('Network.loadingFailed',{'requestId':secret+'-n2','errorText':secret}),
                 network(secret+'-asset',origin+'/browser-page.mjs'),paused(secret+'-asset-p',secret+'-asset',origin+'/browser-page.mjs')]
        def line(record):
            outgoing,value=record
            return '2026-09-12T00:00:00.000Z pw:protocol '+('SEND \u25ba ' if outgoing else '\u25c0 RECV ')+json.dumps(value,separators=(',',':'))+'\n'
        marker=assemble.PROTOCOL_MARKER+json.dumps({'contract':'echs.c04.browser-protocol-boundary.v1','run_id':run_id,'phase':'setup'})+'\n'
        def trace(values=records,tail=marker):return (''.join(map(line,values))+tail).encode()
        def parsed(raw,**kwargs):return assemble.parse_protocol_setup(raw,run_id,origin,driver_waited=kwargs.pop('driver_waited',True),**kwargs)
        def incomplete(raw,reason=None,**kwargs):
            result=parsed(raw,**kwargs);assemble.validate_protocol_setup(result)
            self.assertIs(result['complete'],False);self.assertIsNone(result['counts']);self.assertIs(result['saturated'],False)
            if reason:self.assertEqual(result['reason'],reason)
            self.assertNotIn(secret,json.dumps(result));return result
        complete=parsed(trace());assemble.validate_protocol_setup(complete)
        expected=dict.fromkeys(assemble.PROTOCOL_COUNTS,0)
        expected.update(network_enable_sent=1,network_enable_ack=1,fetch_enable_sent=1,fetch_enable_error=1,navigate_sent=1,navigate_ack=1,
                        fetch_continue_sent=1,fetch_continue_ack=1,root_network_requests=2,root_fetch_paused=3,root_paused_without_network_id=1,
                        matched_pairs=1,network_without_pause=1,pause_without_network_event=1,root_responses=1,root_loading_failed=1)
        self.assertEqual(complete['counts'],expected);self.assertTrue(complete['complete']);self.assertNotIn(secret,json.dumps(complete))
        self.assertEqual(parsed(trace(tail=marker+secret+' trailing non-protocol error\n')),complete)
        self.assertEqual(parsed(trace(records+[send(1,'Runtime.enable',selected='other-session'),reply(1,selected='other-session')])),complete)
        extra=records+[send(50,'Runtime.enable'),reply(50)];self.assertEqual(parsed(trace(extra)),complete)
        wrong_reply=copy.deepcopy(records);wrong_reply[1][1]['sessionId']='other-session'
        self.assertEqual(parsed(trace(wrong_reply))['counts']['network_enable_ack'],0)
        slash=copy.deepcopy(records);slash[4][1]['params']['url']=origin;self.assertEqual(parsed(trace(slash)),complete)
        for changed in [records+[send(1,'Runtime.enable')],records+[send(50,'Runtime.enable'),send(50,'Network.enable')],
                        extra+[reply(50)],records+[reply(999)],records+[reply(1)],records+[send(True,'Runtime.enable')]]:
            incomplete(trace(changed),'command-ambiguous')
        both=copy.deepcopy(records);both[1][1]['error']={'private':secret};incomplete(trace(both),'command-ambiguous')
        incomplete(trace(records+[send(99,'Page.navigate',{'url':origin},selected='other-session')]),'session-ambiguous')
        incomplete(trace(records+[send(99,'Page.navigate',{'url':'https://private.invalid/'+secret})]),'session-ambiguous')
        for bad in ['https://127.0.0.1:45679/','https://localhost:45678/','http://127.0.0.1:45678/',origin+'?private='+secret,origin+'/other',origin+'/#private',origin.replace('127.0.0.1','user@127.0.0.1')]:
            changed=copy.deepcopy(records);changed[4][1]['params']['url']=bad;incomplete(trace(changed),'session-missing')
        for bad in ['http://127.0.0.1:45678','https://localhost:45678',origin+'?x=1',origin+'/other','https://127.0.0.1']:
            result=assemble.parse_protocol_setup(trace(),run_id,bad,driver_waited=True);self.assertFalse(result['complete']);self.assertIsNone(result['counts'])
        for raw,reason in [(trace(tail=''),'marker-missing'),(trace(tail=marker.replace(run_id,'b'*32)),'marker-invalid'),
                           (trace(tail=marker+marker),'marker-invalid'),(trace(tail=marker+line(send(99,'Network.enable'))),'marker-invalid'),
                           (trace()[:-1],'log-malformed'),(b'\xff\n','log-utf8'),(b'bad prefix\n','log-malformed'),
                           ((('x'*32769)+'\n').encode(),'log-malformed'),(b' <<<<<( LOG TRUNCATED )>>>>> \n','log-truncated'),
                           (b'x'*2097152,'log-capped')]:incomplete(raw,reason)
        incomplete(trace(),'log-capped',capped=True)
        for waited in [False,None,1]:incomplete(trace(),'driver-not-waited',driver_waited=waited)
        for raw in [trace().replace(b'"id":1',b'"id":1,"id":1',1),trace().replace(b'"id":1',b'"id":NaN',1),
                    trace([*records,event('Fetch.requestPaused',{'request':{'url':origin},'requestId':True})])]:incomplete(raw)
        saturated=parsed(trace(records+[item for i in range(100,370) for item in (send(i,'Network.enable'),reply(i))]))
        self.assertIs(saturated['saturated'],True);self.assertEqual(saturated['counts']['network_enable_sent'],255);self.assertEqual(saturated['counts']['network_enable_ack'],255)
        for reason in assemble.PROTOCOL_REASONS-{'complete'}:assemble.validate_protocol_setup(assemble.protocol_incomplete(reason))
        for key in assemble.PROTOCOL_COUNTS:
            for value in [True,-1,256,1.5]:
                invalid=copy.deepcopy(complete);invalid['counts'][key]=value;self.rejects(lambda:assemble.validate_protocol_setup(invalid))
        for branch in [(),('counts',)]:
            invalid=copy.deepcopy(complete);target=invalid
            for key in branch:target=target[key]
            target['private']=secret;self.rejects(lambda:assemble.validate_protocol_setup(invalid))
        for key in ['driver_waited','marker_valid','session_selected']:
            invalid={**complete,key:False};self.rejects(lambda:assemble.validate_protocol_setup(invalid))
        invalid=assemble.protocol_incomplete('driver-not-waited');invalid['counts']=expected;self.rejects(lambda:assemble.validate_protocol_setup(invalid))
        # A stopped log read is bounded and requires exclusive private ownership;
        # a failed wait cannot yield a complete diagnostic or read live bytes.
        private=self.temporary();raw_path=private/'driver-protocol.log';stream=MagicMock();stream.__enter__.return_value=stream;stream.read.return_value=trace()
        checked=SimpleNamespace(parent=private,stat=Mock(return_value=SimpleNamespace(st_mode=runner.stat.S_IFREG|0o600,st_nlink=1,st_uid=1234)),open=Mock(return_value=stream))
        listener=Mock();listener.open.side_effect=lambda *a,**k:io.BytesIO(b'[45678,45679]')
        def guarded(path,parent):return listener if Path(path).name=='listener-private.json' else checked
        with patch.object(contract,'guarded_path',side_effect=guarded),patch.object(runner.os,'getuid',return_value=1234,create=True):
            self.assertEqual(runner.read_protocol_setup(raw_path,private,run_id,True),complete);stream.read.assert_called_once_with(2097153)
            checked.open.reset_mock();unwaited=runner.read_protocol_setup(raw_path,private,run_id,False)
            self.assertFalse(unwaited['complete']);self.assertIsNone(unwaited['counts']);checked.open.assert_not_called()
            for field,value in [('st_nlink',2),('st_uid',9876),('st_mode',runner.stat.S_IFREG|0o644)]:
                original=getattr(checked.stat.return_value,field);setattr(checked.stat.return_value,field,value)
                self.assertIsNone(runner.read_protocol_setup(raw_path,private,run_id,True)['counts']);setattr(checked.stat.return_value,field,original)
        directory=self.temporary()
        def project_protocol(value,status='FAIL; NO ACCEPTANCE',name='run-report.json'):
            (directory/name).write_bytes(encoded({'status':status,'protocol_setup':value,'rawbody':secret,'failure':{'type':'Error','message':secret}}))
            with patch.object(assemble,'labels',side_effect=AssertionError('must not read rejected source')):safe=assemble.failure_projection(directory,15,ValueError(secret))
            self.assertNotIn(secret,json.dumps(safe));return safe['reports'][name]
        for value in [complete,saturated,assemble.protocol_incomplete('driver-not-waited')]:self.assertEqual(project_protocol(value)['protocol_setup'],value)
        for status in ['ACTUAL BROWSER JOURNAL SERVICES PASS','RUNNING; NOT ACCEPTED',True,None]:self.assertNotIn('protocol_setup',project_protocol(complete,status=status))
        for name in ['browser-results.json','http-results.json']:self.assertNotIn('protocol_setup',project_protocol(complete,name=name))
        for value in [None,[],secret,{**complete,'raw_url':secret},{**complete,'counts':{**expected,'raw':secret}},{**complete,'driver_waited':False}]:
            self.assertNotIn('protocol_setup',project_protocol(value))
        # Actual exported setup-control helper with injected browser operations:
        # no network/browser/service execution is claimed by these probes.
        control_script=r"""
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {readFileSync} from 'node:fs';
const moduleUrl=process.argv[2],{runSetupControls,SETUP_CONTROL_IDS,closeContext}=await import(moduleUrl);
const secret='SYNTHETIC_PRIVATE_VALUE_DO_NOT_UPLOAD_9741',paths=['/',...Array.from({length:8},(_,i)=>'/asset-'+i+'.mjs')];
async function probe(options={}){
 const events=[],metrics={requests:0,static:0,api:0},transport={tcp_connections:0,tls_connections:0,tls_errors:0,http_requests:0};
 const pages=[],created=[],contexts=new Set();let index=0;
 const original={pages:()=>[],async close(){events.push('original-close');if(options.originalClose)throw new Error(secret)}};contexts.add(original);
 const server={origin:'https://127.0.0.1:45678',metrics,setupObservation:()=>({counts:{...transport},saturated:!!options.transportSaturated,last_tls_error:null})};
 const browser={async newContext(value){
  const i=index++;events.push(i+':context');assert.deepEqual(value,{serviceWorkers:'block',ignoreHTTPSErrors:false});
  assert.ok(events.includes('original-close'));if(i===1)assert.ok(events.includes('0:close')||options.contextFailure);
  if(i===0&&options.contextFailure)throw new TypeError(secret);
  let routeCallback,loaded=false;const page=new EventEmitter();pages.push(page);
  const recordStatic=async path=>{
   const request={url:()=>server.origin+path,method:()=>'GET'};
   if(routeCallback)await routeCallback({request:()=>request,continue(){events.push(i+':continue');return Promise.resolve()},abort(){throw new Error('unexpected abort')}});
   page.emit('request',request);metrics.requests++;metrics.static++;transport.http_requests++;
  };
  page.evaluate=async fn=>{
   if(String(fn).includes('disposeAll')){events.push(i+':dispose');return}
   assert.ok(loaded&&events.includes(i+':enable'));const previous=globalThis.fetch;let calls=0,drains=0;
   globalThis.fetch=async(url,args)=>{
    calls++;assert.equal(url,'/');assert.deepEqual(args,{cache:'no-store'});events.push(i+':static-fetch');
    if(options.fetchFailure&&i===0)throw new TypeError(secret);
    await recordStatic('/');return {status:options.fetchStatus&&i===0?503:200,async arrayBuffer(){drains++;events.push(i+':drained');if(options.drainFailure&&i===0)throw new TypeError(secret);return new ArrayBuffer(0)}};
   };
   try{const status=await fn();assert.equal(calls,1);assert.equal(drains,1);return status}finally{globalThis.fetch=previous}
  };
  page.goto=async(url,args)=>{
   events.push(i+':goto');assert.equal(url,server.origin);assert.deepEqual(args,{waitUntil:'load',timeout:10000});
   assert.ok(!events.includes(i+':cdp'));assert.equal(!!routeCallback,i===0);
   for(let j=0;j<(options.saturate?300:9);j++){
    await recordStatic(paths[j%paths.length]);
   }
   if(options.hostile&&i===0)page.emit('request',{url(){throw new Error(secret)},method:()=>'GET'});
   if(options.api&&i===0){metrics.requests++;metrics.api++}
   transport.tcp_connections++;transport.tls_connections++;
   if(options.navigationFailure&&i===0){const error=new Error('net::ERR_CONNECTION_REFUSED '+secret);error.name='TimeoutError';throw error}
   loaded=true;events.push(i+':loaded');return {status:()=>options.statusFailure&&i===0?503:200};
  };
  const context={pages:()=>[page],async route(pattern,callback){assert.equal(i,0);assert.equal(pattern,'**/*');events.push(i+':route');routeCallback=callback},
   async newPage(){events.push(i+':page');return page},async newCDPSession(value){assert.equal(value,page);assert.ok(loaded);events.push(i+':cdp');return {i,async send(method){assert.equal(method,'Network.enable');assert.ok(loaded);events.push(i+':enable');if(options.enableFailure&&i===0)throw new TypeError(secret);return {}},async detach(){events.push(i+':detach');if(options.detachFailure&&i===0)throw new Error(secret)}}},
   async close(){events.push(i+':close');if(options.closeFailure&&i===0)throw new Error(secret)}};
  created.push(context);return context;
 }};
 const parameters={browser,server,contexts,entryPaths:paths,verifyLeaf:async(session,origin)=>{
  assert.equal(origin,server.origin);assert.ok(events.indexOf(session.i+':loaded')<events.indexOf(session.i+':cdp'));assert.ok(events.includes(session.i+':drained'));events.push(session.i+':leaf');
  if(options.certificateFailure&&session.i===0)throw new TypeError(secret);
 }};
 if(options.originalClose){await assert.rejects(runSetupControls(parameters));assert.equal(index,0);assert.ok(contexts.has(original));return}
 const value=await runSetupControls(parameters);
 assert.equal(index,value.controls[0].cleanup_complete?2:1);assert.deepEqual(value.controls.map(x=>x.id),SETUP_CONTROL_IDS);assert.equal(value.same_browser,true);assert.equal(value.after_failure,true);
 assert.ok(!events.includes('1:route'));assert.ok(!JSON.stringify(value).includes(secret));
 for(const page of pages){assert.equal(page.listenerCount('request'),0);assert.equal(page.listenerCount('pageerror'),0)}
 assert.equal(contexts.has(original),!!options.originalClose);assert.equal(value.original_contexts_closed,!options.originalClose);
 for(let i=0;i<created.length;i++)assert.equal(contexts.has(created[i]),!!options.closeFailure&&i===0);
 return {value,events};
}
const observed=await probe();assert.ok(observed.value.controls.every(x=>x.status==='OBSERVED'&&x.cleanup_complete));
assert.deepEqual(observed.value.controls.map(x=>x.counts.route_continued),[10,0]);
assert.deepEqual(observed.value.controls.map(x=>x.server_delta),[{requests:10,static:10,api:0},{requests:10,static:10,api:0}]);
for(const row of observed.value.controls){
 assert.deepEqual(row.navigation_snapshot.server_delta,{requests:9,static:9,api:0});assert.equal(row.navigation_snapshot.counts.static_requests,9);
 assert.equal(row.counts.requests-row.navigation_snapshot.counts.requests,1);assert.equal(row.counts.static_requests-row.navigation_snapshot.counts.static_requests,1);
 assert.deepEqual(row.certificate_probe,{attempted:true,completed:true,http_status:200});
}
assert.deepEqual(observed.value.controls.map(x=>x.navigation_snapshot.counts.route_continued),[9,0]);
await probe({originalClose:true});
const failed=await probe({navigationFailure:true});
assert.equal(failed.value.controls[0].failure.type,'TimeoutError');assert.equal(failed.value.controls[0].failure.network_error,'ERR_CONNECTION_REFUSED');
assert.equal(failed.value.controls[0].stage,'navigation');assert.equal(failed.value.controls[0].cleanup_complete,true);assert.equal(failed.value.controls[1].status,'OBSERVED');
assert.ok(!failed.events.includes('0:cdp'));assert.ok(failed.events.includes('1:leaf'));
const held=await probe({navigationFailure:true,closeFailure:true});
assert.equal(held.value.controls[0].failure.type,'TimeoutError');assert.equal(held.value.controls[0].cleanup_failed,true);assert.ok(!held.events.includes('1:context'));
const untouched=held.value.controls[1];assert.equal(untouched.status,'FAILED');assert.equal(untouched.stage,'context');assert.equal(untouched.context_created,false);
assert.equal(untouched.transport_delta,null);assert.equal(untouched.server_delta,null);assert.equal(untouched.failure,null);assert.equal(untouched.navigation_snapshot,null);assert.deepEqual(untouched.certificate_probe,{attempted:false,completed:false,http_status:null});assert.ok(Object.values(untouched.counts).every(x=>x===0));
for(const option of ['contextFailure','statusFailure','certificateFailure','enableFailure','fetchFailure','fetchStatus','drainFailure','detachFailure','hostile','api']){
 const tested=await probe({[option]:true}),first=tested.value.controls[0];assert.equal(first.status,'FAILED');assert.equal(tested.value.controls[1].status,first.cleanup_complete?'OBSERVED':'FAILED');
 if(!first.cleanup_complete){assert.ok(!tested.events.includes('1:context'));assert.equal(tested.value.controls[1].context_created,false);assert.equal(tested.value.controls[1].server_delta,null)}
 if(option==='contextFailure')assert.equal(first.context_created,false);
 if(option==='statusFailure')assert.ok(!tested.events.includes('0:cdp'));
 if(['certificateFailure','enableFailure','fetchFailure','fetchStatus','drainFailure'].includes(option))assert.equal(first.stage,'certificate');
 if(['enableFailure','fetchFailure','fetchStatus','drainFailure'].includes(option))assert.ok(!tested.events.includes('0:leaf'));
 if(option==='enableFailure')assert.ok(!tested.events.includes('0:static-fetch'));
 if(option==='fetchStatus')assert.ok(tested.events.includes('0:drained'));
 if(option==='hostile')assert.equal(first.counts.observer_errors,1);
}
const saturated=await probe({saturate:true});assert.ok(saturated.value.controls.every(x=>x.saturated&&x.counts.static_requests===255&&x.server_delta.static===255));
const nullable=await probe({transportSaturated:true});assert.ok(nullable.value.controls.every(x=>x.saturated&&x.transport_delta===null));
const primary=new Error(secret),cleanup=new Error('cleanup'),owned=new Set();const context={pages:()=>[],close:async()=>{throw cleanup}};owned.add(context);
await assert.rejects(closeContext(context,owned,primary),error=>error===primary);assert.ok(owned.has(context));
// Source relationship guard: original failure/snapshot and protocol cutoff
// precede diagnostics, which cannot overwrite the original status or failure.
const source=readFileSync(new URL(moduleUrl),'utf8').replaceAll('\r\n','\n'),start=source.indexOf(" }catch(error){\n  report.status='FAIL; NO ACCEPTANCE';report.failure=browserDiagnostic"),end=source.indexOf('\n finally{',start);
assert.ok(start>0&&end>start);const handling=source.slice(start,end);
assert.equal((handling.match(/report\.failure=/g)||[]).length,1);assert.equal((handling.match(/report\.status=/g)||[]).length,1);
assert.ok(handling.indexOf('report.setup_observation=')<handling.indexOf('endProtocol();setup.dispose();'));
assert.ok(handling.indexOf('endProtocol();setup.dispose();')<handling.indexOf('await runSetupControls('));
assert.ok(handling.includes("report.failure.stage==='positive-navigation'&&report.failure.type==='TimeoutError'"));
assert.ok(handling.includes('report.setup_observation?.browser.identity_verified===true'));
process.stdout.write(JSON.stringify({observed:observed.value,failed:failed.value,held:held.value,nullable:nullable.value}));
"""
        controls_run=subprocess.run(['node','--input-type=module','-',(HERE/'test_browser_http.mjs').as_uri()],input=control_script,text=True,capture_output=True,timeout=20,check=False)
        self.assertEqual(controls_run.returncode,0,controls_run.stderr)
        self.assertNotIn(secret,controls_run.stdout+controls_run.stderr)
        controls_results=json.loads(controls_run.stdout);directory=self.temporary()
        def project_controls(value,**overrides):
            payload={'status':'FAIL; NO ACCEPTANCE','failed_group':'setup','checks':[],
                     'failure':{'type':'TimeoutError','stage':'positive-navigation','message':secret},
                     'setup_observation':observation,'setup_controls':value,'rawbody':secret,**overrides}
            name=payload.pop('name','browser-results.json');(directory/name).write_bytes(encoded(payload))
            with patch.object(assemble,'labels',side_effect=AssertionError('must not read rejected source')):safe=assemble.failure_projection(directory,15,ValueError(secret))
            self.assertNotIn(secret,json.dumps(safe));return safe['reports'][name]
        for value in controls_results.values():
            assemble.validate_setup_controls(value);self.assertEqual(project_controls(value)['setup_controls'],value)
        valid=controls_results['observed']
        for overrides in [{'status':'ACTUAL BROWSER HTTPS POSTGREST SQL PASS'},{'status':'RUNNING; NOT ACCEPTED'},
                          {'failed_group':'B01'},{'failure':{'type':'Error','stage':'positive-navigation'}},
                          {'failure':{'type':'TimeoutError','stage':'positive-fixture'}},
                          {'setup_observation':{**observation,'browser':{**observation['browser'],'identity_verified':False}}},
                          {'setup_observation':None},{'name':'run-report.json'},{'name':'http-results.json'}]:
            self.assertNotIn('setup_controls',project_controls(valid,**overrides))
        for branch in [(),('controls',0),('controls',0,'counts'),('controls',0,'transport_delta'),('controls',0,'server_delta'),('controls',0,'navigation_snapshot'),('controls',0,'navigation_snapshot','counts'),('controls',0,'navigation_snapshot','transport_delta'),('controls',0,'navigation_snapshot','server_delta'),('controls',0,'certificate_probe')]:
            invalid=copy.deepcopy(valid);target=invalid
            for key in branch:target=target[key]
            target['private']=secret;self.rejects(lambda:assemble.validate_setup_controls(invalid));self.assertNotIn('setup_controls',project_controls(invalid))
        for path,values in [(('same_browser',),[False,1]),(('after_failure',),[False,1]),(('original_contexts_closed',),[False,1]),
                            (('controls',),[[],valid['controls'][:1],list(reversed(valid['controls'])),valid['controls']*2]),
                            (('controls',0,'status'),['PASS',secret]),(('controls',0,'stage'),[secret]),
                            (('controls',0,'http_status'),[True,99,600,'200']),
                            (('controls',0,'cleanup_complete'),[False,1]),(('controls',0,'certificate_verified'),[False,1]),
                            (('controls',0,'counts','static_requests'),[True,-1,256,8]),
                            (('controls',0,'counts','unexpected_requests'),[1]),(('controls',0,'server_delta','api'),[1,True]),
                            (('controls',0,'server_delta','requests'),[11]),(('controls',0,'transport_delta','http_requests'),[-1,256,False]),
                            (('controls',0,'navigation_snapshot'),[None]),(('controls',0,'navigation_snapshot','saturated'),[1]),
                            (('controls',0,'navigation_snapshot','counts','static_requests'),[True,8,10]),
                            (('controls',0,'navigation_snapshot','server_delta','api'),[1,False]),
                            (('controls',0,'navigation_snapshot','transport_delta','http_requests'),[-1,256,False]),
                            (('controls',0,'certificate_probe','attempted'),[False,1]),(('controls',0,'certificate_probe','completed'),[False,1]),
                            (('controls',0,'certificate_probe','http_status'),[True,None,99,201,600])]:
            for value in values:
                invalid=copy.deepcopy(valid);target=invalid
                for key in path[:-1]:target=target[key]
                target[path[-1]]=value;self.rejects(lambda:assemble.validate_setup_controls(invalid));self.assertNotIn('setup_controls',project_controls(invalid))
        for key,values in [('type',[secret,True]),('network_error',[secret,True]),('private',[secret])]:
            for value in values:
                invalid=copy.deepcopy(controls_results['failed']);invalid['controls'][0]['failure'][key]=value
                self.rejects(lambda:assemble.validate_setup_controls(invalid));self.assertNotIn('setup_controls',project_controls(invalid))
        for value in [None,True,[],secret,{}, {**valid,'contract':'wrong'}]:
            self.rejects(lambda:assemble.validate_setup_controls(value));self.assertNotIn('setup_controls',project_controls(value))
        # Chromium149's exact source-path/colon-line prefix is projected to
        # bounded category counts; raw messages, URLs and process IDs stay private.
        def chrome_line(source,message,severity='ERROR'):
            return f'[123:456:0912/113000.123456:{severity}:{source}:722] {message}\n'.replace('\\n','\n').encode()
        restart=chrome_line('content/browser/network_service_instance_impl.cc','Network service crashed or was terminated, restarting service. '+secret)
        raw_stderr=b''.join([restart,chrome_line('content/browser/network_service_instance_impl.cc',secret,'INFO'),
            chrome_line('base/memory/platform_shared_memory_region_posix.cc','Creating shared memory in /dev/shm/'+secret+' failed'),
            chrome_line('base/memory/platform_shared_memory_region_posix.cc','Insufficient space on /dev/shm '+secret,'FATAL'),
            chrome_line('dbus/bus.cc',secret,'WARNING'),chrome_line('other/source.cc','https://private.invalid/'+secret),
            b'\xff\n',b'x'*32769+b'\n',b'[123:456:0912/113000.123456:ERROR:network_service_instance_impl.cc(722)] old format\n',secret.encode()+b'\n'])
        metadata={name:name in ('driver_waited','snapshot_taken','reader_joined','owned_children_reaped','eof_observed') for name in assemble.STDERR_FLAGS}
        metadata['cutoff']=len(raw_stderr)
        parsed_stderr=assemble.parse_browser_stderr(raw_stderr,metadata);assemble.validate_browser_stderr(parsed_stderr)
        expected_counts=dict.fromkeys(assemble.STDERR_COUNTS,0)
        expected_counts.update(lines=10,unknown_lines=2,malformed_lines=2,info=1,warning=1,error=3,fatal=1,
            other_source=1,network_service_lines=2,network_service_restart=1,shared_memory_lines=2,shared_memory_failure=2,dbus_lines=1)
        self.assertEqual(parsed_stderr['counts'],expected_counts);self.assertIs(parsed_stderr['absence_claimed'],False)
        self.assertNotIn(secret,json.dumps(parsed_stderr));self.assertNotIn('123',json.dumps(parsed_stderr));self.assertNotIn('cutoff',parsed_stderr)
        for flag in ('capped','storage_capped','partial_line','reader_error'):
            observed=assemble.parse_browser_stderr(raw_stderr,{**metadata,flag:True});self.assertEqual(observed['counts'],expected_counts);self.assertTrue(observed[flag])
        # Joined lower-bound positive observations survive missing EOF/ownership
        # proof; those flags cannot become a complete-run or absence claim.
        for flag in ('owned_children_reaped','eof_observed'):
            observed=assemble.parse_browser_stderr(restart,{**metadata,flag:False});self.assertEqual(observed['counts']['network_service_restart'],1);self.assertFalse(observed[flag])
        for flag in ('driver_waited','snapshot_taken','reader_joined'):
            for value in (False,None,1):self.assertIsNone(assemble.parse_browser_stderr(raw_stderr,{**metadata,flag:value})['counts'])
        for raw in (None,'not bytes',b'x'*2097153,raw_stderr[:-1]):self.assertIsNone(assemble.parse_browser_stderr(raw,metadata)['counts'])
        self.assertEqual(assemble.parse_browser_stderr(b'',metadata)['counts'],dict.fromkeys(assemble.STDERR_COUNTS,0))
        saturated_stderr=assemble.parse_browser_stderr(restart*300,metadata);self.assertTrue(saturated_stderr['saturated']);self.assertEqual(saturated_stderr['counts']['network_service_restart'],255)
        near=chrome_line('content/browser/network_service_instance_impl.cc','Network service crashed, restarting service. '+secret)
        self.assertEqual(assemble.parse_browser_stderr(near,metadata)['counts']['network_service_restart'],0)
        for changed in (restart.replace(b'.123456:',b'.123:'),restart.replace(b'impl.cc:722]',b'impl.cc(722)]'),restart.replace(b':ERROR:',b':ERR:')):
            self.assertEqual(assemble.parse_browser_stderr(changed,metadata)['counts']['unknown_lines'],1)
        directory=self.temporary()
        def project_stderr(value,status='FAIL; NO ACCEPTANCE',name='run-report.json'):
            (directory/name).write_bytes(encoded({'status':status,'browser_stderr':value,'raw_url':secret}))
            safe=assemble.failure_projection(directory,15,ValueError(secret));self.assertNotIn(secret,json.dumps(safe));return safe['reports'][name]
        self.assertEqual(project_stderr(parsed_stderr)['browser_stderr'],parsed_stderr)
        for status in ('ACTUAL BROWSER JOURNAL SERVICES PASS','RUNNING; NOT ACCEPTED',True):self.assertNotIn('browser_stderr',project_stderr(parsed_stderr,status))
        for name in ('http-results.json','browser-results.json'):self.assertNotIn('browser_stderr',project_stderr(parsed_stderr,name=name))
        for path,value in [(('counts','error'),True),(('counts','lines'),256),(('counts','network_service_restart'),3),
            (('counts','lines'),11),(('counts','private'),secret),(('raw_url',),secret),(('absence_claimed',),True),
            (('counts_are_lower_bounds',),False),(('scope',),secret),(('prefix_parsed',),False),(('reader_joined',),False)]:
            invalid=copy.deepcopy(parsed_stderr);target=invalid
            for key in path[:-1]:target=target[key]
            target[path[-1]]=value;self.rejects(lambda:assemble.validate_browser_stderr(invalid));self.assertNotIn('browser_stderr',project_stderr(invalid))
        # Portable lifecycle controls inject thread/lock/file operations only.
        # The separate existing Linux group proves real pipe draining.
        def capture_fixture():
            capture=runner.BrowserStderrCapture.__new__(runner.BrowserStderrCapture)
            capture.lock=Mock();capture.lock.acquire.return_value=True;capture.stop=Mock();capture.thread=Mock();capture.thread.is_alive.return_value=False
            capture.writer=SimpleNamespace(closed=False);capture.writer.close=Mock(side_effect=lambda:setattr(capture.writer,'closed',True))
            capture.stream=SimpleNamespace(closed=False,flush=Mock());capture.read_fd=17
            capture.stored=8;capture.cutoff=6;capture.capped=False;capture.reader_error=False;capture.snapshot_failed=False;capture.eof=True;capture.frozen=None
            return capture
        capture=capture_fixture();frozen=capture.snapshot(True);self.assertTrue(frozen['partial_line']);self.assertEqual(frozen['cutoff'],6)
        frozen['cutoff']=999;capture.stored=100;capture.cutoff=99;capture.capped=True
        self.assertEqual(capture.snapshot(False)['cutoff'],6);self.assertTrue(capture.snapshot(False)['driver_waited']);capture.stream.flush.assert_called_once()
        for bad in (1,None,'true'):self.rejects(lambda:capture.snapshot(bad))
        capture=capture_fixture();capture.stream.flush.side_effect=OSError(secret);self.assertTrue(capture.snapshot(True)['reader_error'])
        capture=capture_fixture();capture.lock.acquire.return_value=False
        self.rejects(lambda:capture.snapshot(True));capture.lock.acquire.assert_called_with(timeout=1);capture.stream.flush.assert_not_called()
        for alive in (False,True):
            capture=capture_fixture();capture.thread.is_alive.return_value=alive;capture.snapshot(True)
            result=capture.finish(True,timeout=.01);self.assertEqual(result['reader_joined'],not alive);self.assertTrue(capture.writer.closed)
            self.assertEqual([call.args for call in capture.thread.join.call_args_list],[(.01,),(1,)] if alive else [(.01,)])
            self.assertEqual(capture.stop.set.call_count,int(alive));capture.lock.acquire.assert_called_with(timeout=1)
        capture=capture_fixture();capture.lock.acquire.return_value=False;result=capture.finish(False,timeout=.01)
        self.assertTrue(result['reader_error']);self.assertFalse(result['snapshot_taken']);self.assertFalse(result['owned_children_reaped'])
        for owned_value,timeout in ((1,1),(True,0),(True,4),(True,float('nan')),(True,True)):
            capture=capture_fixture();self.rejects(lambda:capture.finish(owned_value,timeout));capture.thread.join.assert_not_called()
        # Read only a joined, identity-bound prefix; never perform an unbounded
        # read, or touch a file while its reader remains live.
        raw_path=self.temporary()/'browser-stderr.log';capture=SimpleNamespace(path=raw_path,identity=SimpleNamespace(st_dev=1,st_ino=2))
        info=SimpleNamespace(st_mode=runner.stat.S_IFREG|0o600,st_nlink=1,st_uid=1234,st_dev=1,st_ino=2,st_size=len(restart)+100)
        file=SimpleNamespace(stat=Mock(return_value=info),open=Mock(side_effect=lambda *a,**k:io.BytesIO(restart+b'PRIVATE_LATER_BYTES')))
        with patch.object(contract,'guarded_path',return_value=file) as guard,patch.object(runner.os,'getuid',return_value=1234,create=True):
            result=runner.read_browser_stderr(capture,{**metadata,'cutoff':len(restart)});self.assertEqual(result['counts']['network_service_restart'],1)
            guard.reset_mock();file.open.reset_mock();self.assertIsNone(runner.read_browser_stderr(capture,{**metadata,'reader_joined':False})['counts']);guard.assert_not_called();file.open.assert_not_called()
            for key,value in [('st_ino',3),('st_nlink',2),('st_uid',9),('st_mode',runner.stat.S_IFREG|0o644),('st_size',2097153)]:
                before=getattr(info,key);setattr(info,key,value);self.assertIsNone(runner.read_browser_stderr(capture,metadata)['counts']);setattr(info,key,before)
        # Execute the actual private-cleanup guard extracted from main, with all
        # filesystem operations injected. A live/unclosed/no-EOF reader retains
        # the directory and cannot overwrite the original failure object.
        run_source=(HERE/'run.py').read_text(encoding='utf-8');tree=ast.parse(run_source)
        cleanup_nodes=[node for node in ast.walk(tree) if isinstance(node,ast.Try) and any(isinstance(item,ast.Expr) and isinstance(item.value,ast.Call) and ast.unparse(item.value.func)=='shutil.rmtree' for item in node.body)]
        self.assertEqual(len(cleanup_nodes),1);cleanup_text=ast.unparse(cleanup_nodes[0])
        code='def cleanup_probe():\n    cleanup_ok=True\n'+''.join('    '+line+'\n' for line in cleanup_text.splitlines())+'    return cleanup_ok\n'
        code=code.replace('\\n','\n')
        root=self.temporary()
        for failure in ('live','stream','writer','fd','eof',None):
            primary={'type':'TimeoutError','stage':'positive-navigation'};report={'status':'FAIL; NO ACCEPTANCE','failure':primary}
            current=SimpleNamespace(thread=Mock(),stream=SimpleNamespace(closed=failure!='stream'),writer=SimpleNamespace(closed=failure!='writer'),read_fd=1 if failure=='fd' else None)
            current.thread.is_alive.return_value=failure=='live';remove=Mock()
            namespace={'browser_stderr':current,'browser_stderr_metadata':{'eof_observed':failure!='eof'},'report':report,'need':runner.need,
                'require_private_directory':Mock(),'shutil':SimpleNamespace(rmtree=remove),'secrets_dir':SimpleNamespace(exists=lambda:False),'run_dir':root/'runs'/'owned','HERE':root}
            exec(compile(code,'<actual-private-cleanup-guard>','exec'),namespace)
            self.assertEqual(namespace['cleanup_probe'](),failure is None);self.assertIs(report['failure'],primary)
            self.assertEqual(remove.call_count,int(failure is None))
        self.assertLess(run_source.index("report['descendant_absence']=registry.assert_empty()"),run_source.index('browser_stderr.finish(reaped)'))
        self.assertLess(run_source.index('browser_stderr.snapshot(waited)'),run_source.index('protocol_setup=read_protocol_setup('))
        logging_script=r"""
import assert from 'node:assert/strict';
const {assertBrowserLoggingArgs}=await import(process.argv[2]);
assertBrowserLoggingArgs(['chrome','--headless=new','--enable-logging=stderr']);
for(const flags of [[],['--enable-logging'],['--enable-logging=stderr','--enable-logging=stderr'],['--enable-logging=file'],
 ['--enable-logging=stderr','--disable-logging'],['--enable-logging=stderr','--log-file=private'],['--enable-logging=stderr','--log-level=0'],
 ['--enable-logging=stderr','--v=1'],['--enable-logging=stderr','--vmodule=*'],[true]])assert.throws(()=>assertBrowserLoggingArgs(flags));
process.stdout.write('PASS');
"""
        logging=subprocess.run(['node','--input-type=module','-',(HERE/'test_browser_http.mjs').as_uri()],input=logging_script,text=True,capture_output=True,timeout=10,check=True)
        self.assertEqual(logging.stdout,'PASS')
        # Actual exported absence helper, injected page/handle only: Playwright
        # remains responsible for waiting through navigation-context replacement.
        absence_script=r"""
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const moduleUrl=process.argv[2],{requireFixtureAbsent}=await import(moduleUrl);
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject}};
const tick=async()=>{await Promise.resolve();await Promise.resolve()};
const originalWindow=globalThis.window;
try{
 const wait=deferred(),dispose=deferred();let waits=0,disposals=0,settled=false;
 const result=requireFixtureAbsent({waitForFunction(predicate,arg,options){
  waits++;assert.equal(arg,undefined);assert.deepEqual(options,{timeout:5000});
  for(const fixture of [undefined,null,false,0,'',{},()=>{}]){globalThis.window={fixture};assert.equal(predicate(),!fixture)}
  return wait.promise;
 }}).then(()=>{settled=true});
 await tick();assert.equal(waits,1);assert.equal(disposals,0);assert.equal(settled,false);
 wait.resolve({dispose(){disposals++;return dispose.promise}});
 await tick();assert.equal(disposals,1);assert.equal(settled,false);
 dispose.resolve();await result;assert.equal(settled,true);assert.equal(disposals,1);
 for(const name of ['TimeoutError','TargetClosedError','EvaluationError']){
  for(const sync of [false,true]){
   const error=Object.assign(new Error('synthetic-private-error'),{name});let calls=0;
   await assert.rejects(requireFixtureAbsent({waitForFunction(){calls++;if(sync)throw error;return Promise.reject(error)}}),caught=>caught===error);
   assert.equal(calls,1);
  }
 }
 for(const sync of [false,true]){
  const error=new Error('synthetic-disposal-error');let disposals=0;
  await assert.rejects(requireFixtureAbsent({waitForFunction:async()=>({dispose(){disposals++;if(sync)throw error;return Promise.reject(error)}})}),caught=>caught===error);
  assert.equal(disposals,1);
 }
 // Timer seam exercises the actual bounded disposal without a two-second sleep.
 const set=globalThis.setTimeout,clear=globalThis.clearTimeout;let fire,clears=0,timerDisposals=0;
 const token={};
 try{
  globalThis.setTimeout=(callback,ms)=>{assert.equal(ms,2000);assert.equal(fire,undefined);fire=callback;return token};
  globalThis.clearTimeout=value=>{assert.equal(value,token);clears++};
  const pending=requireFixtureAbsent({waitForFunction:async()=>({dispose(){timerDisposals++;return new Promise(()=>{})}})});
  const rejected=assert.rejects(pending,error=>error.message==='negative-absence-handle-dispose');
  await tick();assert.equal(timerDisposals,1);assert.equal(typeof fire,'function');fire();await rejected;
  assert.equal(clears,1);assert.equal(timerDisposals,1);
 }finally{globalThis.setTimeout=set;globalThis.clearTimeout=clear}
 const source=await readFile(new URL(moduleUrl),'utf8');
 const start=source.indexOf("  stage='negative-page';"),end=source.indexOf('  report.tls=',start);
 assert.ok(start>=0&&end>start);const caller=source.slice(start,end);
 assert.ok(caller.includes('certificateRejected=/net::ERR_CERT_AUTHORITY_INVALID/.test(error.message)'));
 assert.match(caller,/stage='negative-verification';assert\.equal\(certificateRejected,true\);assert\.equal\(negative\.metrics\.requests,0\);await requireFixtureAbsent\(bad\);/);
 assert.ok(!caller.includes('bad.evaluate'));
}finally{if(originalWindow===undefined)delete globalThis.window;else globalThis.window=originalWindow}
process.stdout.write('PASS');
"""
        absence=subprocess.run(['node','--input-type=module','-',(HERE/'test_browser_http.mjs').as_uri()],input=absence_script,text=True,capture_output=True,timeout=10,check=True)
        self.assertEqual(absence.stdout,'PASS')
        # Python traceback projection accepts exact known source paths only,
        # selects the deepest allowed frame, and ignores hostile properties.
        namespace={}
        exec(compile('def inner():\n raise PermissionError(13,"'+secret+'")\n',str(HERE/'processes.py'),'exec'),namespace)
        exec(compile('def outer():\n inner()\n',str(HERE/'run.py'),'exec'),namespace)
        try:namespace['outer']()
        except PermissionError as error:
            metadata=runner.failure_metadata(error,'browser-cdp-recheck')
        self.assertEqual(metadata,{'type':'PermissionError','sqlstate':None,'errno':13,'stage':'browser-cdp-recheck','location':{'file':'processes.py','line':2}})
        foreign={}
        exec(compile('def fail():\n raise PermissionError(13,"'+secret+'")\n',str(HERE/'foreign'/ 'processes.py'),'exec'),foreign)
        try:foreign['fail']()
        except PermissionError as error:self.assertNotIn('location',runner.failure_metadata(error,secret))
        class UnknownDiagnosticError(Exception):
            @property
            def sqlstate(self):raise ValueError(secret)
            @property
            def errno(self):raise ValueError(secret)
        self.assertEqual(runner.failure_metadata(UnknownDiagnosticError(secret),secret),{'type':'OtherError','sqlstate':None})
        for invalid in [True,False,0,-1,4096,1.5,secret,[13]]:
            error=Exception(secret);error.errno=invalid;error.sqlstate=invalid
            metadata=runner.failure_metadata(error,secret)
            self.assertNotIn('errno',metadata);self.assertNotIn('stage',metadata);self.assertIsNone(metadata['sqlstate']);self.assertNotIn(secret,json.dumps(metadata))
        directory=self.temporary()
        for stage in assemble.BROWSER_FAILURE_STAGES:
            value={'status':'FAIL; NO ACCEPTANCE','failed_group':'setup','checks':[],
                   'failure':{'type':'TimeoutError','stage':stage,'network_error':'ERR_CERT_AUTHORITY_INVALID','message':secret,'url':secret,'location':{'file':'test_browser_http.mjs','line':141,'column':52}}}
            (directory/'browser-results.json').write_bytes(encoded(value))
            projected=assemble.failure_projection(directory,15,ValueError(secret))['reports']['browser-results.json']
            self.assertEqual(projected['failure'],{key:value['failure'][key] for key in ('type','stage','network_error','location')})
            self.assertEqual(projected['failed_group'],'setup');self.assertNotIn(secret,json.dumps(projected))
        for stage in assemble.RUN_FAILURE_STAGES:
            value={'failure':{'type':'PermissionError','stage':stage,'errno':13,'location':{'file':'processes.py','line':2},'message':secret,'filename':secret}}
            (directory/'run-report.json').write_bytes(encoded(value))
            projected=assemble.failure_projection(directory,15,ValueError(secret))['reports']['run-report.json']
            self.assertEqual(projected['failure'],{key:value['failure'][key] for key in ('type','stage','errno','location')})
            self.assertNotIn(secret,json.dumps(projected))
        for invalid in [secret,[secret],{'hidden':secret},None,True,0,4096,1.5]:
            for name in ['run-report.json','browser-results.json']:
                value={'failure':{'type':'Error','stage':invalid,'network_error':invalid,'errno':invalid,'location':{'file':invalid,'line':True,'column':0},'message':secret}}
                (directory/name).write_bytes(encoded(value))
            projected=assemble.failure_projection(directory,15,ValueError(secret))
            self.assertEqual(projected['reports']['run-report.json']['failure'],{'type':'Error'})
            self.assertEqual(projected['reports']['browser-results.json']['failure'],{'type':'Error'})
            self.assertNotIn(secret,json.dumps(projected))
        for name in ['run-report.json','http-results.json','browser-results.json']:
            directory,tests,source=self.collector_fixture();temporary=self.temporary()
            output=temporary/'private-learning-browser-journal-http-evidence-15'
            path=directory/name;value=json.loads(path.read_bytes());value.update(service_key=secret,rawbody=secret)
            path.write_bytes(encoded(value))
            # Rebind the inner index to adversarial bytes so this is rejected
            # by closed report validation rather than a stale byte count.
            inner=json.loads((directory/'run-members.json').read_bytes())
            inner['members']=[assemble.read_member(directory,item)[1] for item in assemble.RUN_NAMES]
            (directory/'run-members.json').write_bytes(encoded(inner))
            with patch.dict(os.environ,{'RUNNER_TEMP':str(temporary)}),patch.object(assemble.contract,'sources',return_value=source),patch.object(assemble,'validate_current_checkout'):
                rejected=assemble.publish(directory,tests,REPO,15,output)
            self.assertEqual(rejected['status'],'FAIL; NO ACCEPTANCE');self.assertIs(rejected['raw_reports_uploaded'],False)
            self.assertEqual({p.name for p in output.iterdir()},{'failure.json'})
            raw=(output/'failure.json').read_text();self.assertNotIn(secret,raw);self.assertNotIn('service_key',raw);self.assertNotIn('rawbody',raw)
            self.assertEqual(set(rejected),{'contract','status','postgres_major','collector_error','raw_reports_uploaded','reports'})
        # Diagnostic projection treats malformed scalar/list fields as data,
        # never as an exception message, path, or substitute acceptance flag.
        directory=self.temporary()
        for invalid in [secret,[secret],{'hidden':secret},None,True]:
            value={'status':invalid,'cleanup_complete':invalid,'service_key':secret,'rawbody':secret,
                   'failure':{'type':invalid,'sqlstate':invalid,'stage':invalid,'actual':[secret],'expected':invalid,
                              'code':invalid,'operator':invalid,'location':{'line':True,'column':invalid}},
                   'checks':[invalid],'failed_group':invalid,'rpc_observations':[{'route':secret,'status':200}],
                   'http_observations':[{'route':'state','status':True,'code':secret}]}
            (directory/'browser-results.json').write_bytes(encoded(value))
            safe=assemble.failure_projection(directory,15,ValueError(secret));projected=safe['reports']['browser-results.json']
            self.assertNotIn(secret,json.dumps(safe));self.assertNotIn('status',projected)
            self.assertEqual(projected['failure'],{'type':'OtherError'})
            self.assertNotIn('failed_group',projected);self.assertNotIn('completed_groups',projected)
            self.assertEqual(projected['rpc_observations'],[]);self.assertEqual(projected['http_observations'],[])
        # Failure diagnostics cannot read or echo labels from a source tree
        # that may itself be the reason preflight was rejected.
        for name,prefix in [('http-results.json','S'),('browser-results.json','B')]:
            directory=self.temporary()
            (directory/name).write_bytes(encoded({'status':'FAIL; NO ACCEPTANCE',
                'checks':[prefix+'01 '+secret],'failed_group':prefix+'02 '+secret,
                'failure':{'type':'AssertionError','actual':200,'expected':409}}))
            with patch.object(assemble,'labels',side_effect=AssertionError('must not read rejected source labels')):
                safe=assemble.failure_projection(directory,15,ValueError(secret))
            self.assertEqual(safe['reports'][name]['completed_groups'],[prefix+'01'])
            self.assertEqual(safe['reports'][name]['failed_group'],prefix+'02')
            self.assertNotIn(secret,json.dumps(safe))
        for when in (3,4):
            directory,tests,source=self.collector_fixture();temporary=self.temporary();calls=0
            output=temporary/'private-learning-browser-journal-http-evidence-15'
            def drift(*args):
                nonlocal calls
                calls+=1
                return {**source,'manifest_sha256':'0'*64} if calls==when else source
            with patch.dict(os.environ,{'RUNNER_TEMP':str(temporary)}),patch.object(assemble.contract,'sources',side_effect=drift),patch.object(assemble,'validate_current_checkout'):
                failed=assemble.publish(directory,tests,REPO,15,output)
            self.assertEqual(failed['status'],'FAIL; NO ACCEPTANCE')
            self.assertTrue((output/'failure.json').is_file());self.assertFalse((output/'artifact-index.json').exists())
            self.assertNotIn(secret,(output/'failure.json').read_text())
        for corruption in ('contract','commit','order','member','report-rehash'):
            directory,tests,source=self.collector_fixture();temporary=self.temporary()
            output=temporary/'private-learning-browser-journal-http-evidence-15';real_assemble=assemble.assemble
            def alter_index(*args):
                accepted=real_assemble(*args);path=directory/'artifact-index.json';index=json.loads(path.read_bytes())
                if corruption=='contract':index['contract']='echs.unrelated-index.v1'
                elif corruption=='commit':index['tested_commit']='0'*40
                elif corruption=='order':index['members'].reverse()
                elif corruption=='member':index['members'][0]=copy.deepcopy(index['members'][1])
                else:
                    # Simulate substitution after successful validation and
                    # make every public byte/index/child-output link agree.
                    # Closed report shapes must still reject the new payload.
                    report_path=directory/'browser-results.json'
                    browser=json.loads(report_path.read_bytes());browser['rawbody']=secret
                    report_path.write_bytes(encoded(browser))
                    run_path=directory/'run-report.json';run=json.loads(run_path.read_bytes())
                    run['child_executions'][1]['output']=assemble.read_member(directory,'browser-results.json')[1]
                    run_path.write_bytes(encoded(run))
                    inner_path=directory/'run-members.json';inner=json.loads(inner_path.read_bytes())
                    inner['members']=[assemble.read_member(directory,name)[1] for name in assemble.RUN_NAMES]
                    inner_path.write_bytes(encoded(inner))
                    index['members']=[assemble.read_member(directory,row['path'])[1] for row in index['members']]
                path.write_bytes(encoded(index));return accepted
            with patch.dict(os.environ,{'RUNNER_TEMP':str(temporary)}),patch.object(assemble.contract,'sources',return_value=source),patch.object(assemble,'validate_current_checkout'),patch.object(assemble,'assemble',side_effect=alter_index):
                failed=assemble.publish(directory,tests,REPO,15,output)
            self.assertEqual(failed['status'],'FAIL; NO ACCEPTANCE')
            self.assertEqual({p.name for p in output.iterdir()},{'failure.json'})
            self.assertNotIn(secret,(output/'failure.json').read_text())


def main():
    global REPO,WORK_DIR
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo',type=Path,required=True)
    parser.add_argument('--work-dir',type=Path)
    parser.add_argument('--report',type=Path,required=True)
    args=parser.parse_args();REPO=args.repo.resolve();WORK_DIR=args.work_dir.resolve() if args.work_dir else None
    if not REPO.is_dir() or WORK_DIR is not None and not WORK_DIR.is_dir():raise ValueError('owned-existing-test-paths')
    before=rows(OWNED);stream=io.StringIO()
    suite=unittest.defaultTestLoader.loadTestsFromTestCase(ContractTests)
    result=unittest.TextTestRunner(stream=stream,verbosity=2).run(suite)
    failed=len(result.failures)+len(result.errors)
    if rows(OWNED)!=before or result.testsRun!=20 or result.skipped: failed+=1
    report={'contract':'echs.c04.browser-http-contract-tests.v1','status':'FAIL' if failed else 'PASS',
            'tests':result.testsRun,'failed':failed,'source_files':before}
    with args.report.open('x',encoding='utf-8',newline='\n') as output:
        json.dump(report,output,indent=2);output.write('\n')
    sys.stderr.write(stream.getvalue());print(json.dumps(report))
    return 1 if failed else 0


if __name__=='__main__': raise SystemExit(main())
