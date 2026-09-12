"""Offline source/report/collector contract probes; no service evidence is made.

All execution-shaped objects below are synthetic counterexample fixtures. The
collector tests inject its source and Git observations; they exercise only local
member closure. They cannot establish browser, HTTP, PostgreSQL or deployment.
"""
import argparse
import base64
import copy
from fnmatch import fnmatchcase
import hashlib
import io
import json
import os
from pathlib import Path
import re
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
