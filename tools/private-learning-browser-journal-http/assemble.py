"""Close actual browser/HTTP/SQL evidence; no implicit or inherited acceptance."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import os
import ipaddress
import contract
from certs import public_metadata

RUN_NAMES=('checkout.json','source-receipt.json','image-receipt.json','http-results.json','browser-results.json','dependency-receipt.json','tls-material.json','final-source-receipt.json','run-report.json')
TEST_NAMES=('contract-tests.json','cert-tests.json','supervisor-tests.json','descendant-tests.json','https-tests.json','bridge-tests.json')
LOCAL_INDEX='local-executions.json'
BROWSER_FAILURE_STAGES={'control-start','listener-start','listener-metadata','cdp-connect','positive-context','positive-page','positive-navigation','positive-fixture','browser-identity','positive-certificate','negative-page','negative-navigation','negative-verification','tls-cleanup','group-account','group-context','group-route','group-page','group-navigation','group-fixture','group-configure','group-body','group-verification','group-cleanup','final-verification'}
BROWSER_NETWORK_ERRORS={'ERR_CERT_AUTHORITY_INVALID','ERR_CERT_COMMON_NAME_INVALID','ERR_CERT_DATE_INVALID','ERR_CERT_INVALID','ERR_SSL_PROTOCOL_ERROR','ERR_CONNECTION_CLOSED','ERR_CONNECTION_REFUSED','ERR_CONNECTION_RESET','ERR_CONNECTION_TIMED_OUT','ERR_TIMED_OUT','ERR_ABORTED','ERR_FAILED','ERR_BLOCKED_BY_CLIENT','ERR_BLOCKED_BY_RESPONSE','ERR_NAME_NOT_RESOLVED','ERR_ADDRESS_UNREACHABLE','ERR_NETWORK_ACCESS_DENIED','ERR_EMPTY_RESPONSE'}
RUN_FAILURE_STAGES={'checkout','dependency-identity','ephemeral-tls','image-resolution','network-create','postgres-start','install-exact-schema','postgrest-start','postgrest-readiness','browser-launch','actual-http-cases','actual-browser-cases','post-execution-identity','browser-cdp-recheck','actual-browser-driver-start','actual-browser-driver-wait','actual-browser-driver-output','actual-browser-driver-cleanup','actual-browser-report-check'}
RUN_FAILURE_SOURCE_NAMES={'run.py','processes.py','owned_children.py','fixture.py','certs.py','contract.py'}
SOURCE=contract.HERE
HTTP_SOURCES=['runtime/wire.mjs','runtime/contract.mjs','runtime/handler.mjs','runtime/pending-intent.mjs','bridge.mjs','controls.py','fixture.py','test_http.mjs']
BROWSER_SOURCES=['runtime/handler.mjs','runtime/wire.mjs','runtime/contract.mjs','runtime/pending-intent.mjs','bridge.mjs','https-bridge.mjs','browser-page.mjs','controls.py','fixture.py','control-client.mjs','test_http.mjs','test_browser_http.mjs','browser-cases.mjs','browser-dependency.json']+['retained/c04-learning-ack-candidate/source/'+name for name in ['js/owned-learning-store.mjs','js/wire-binding-model.mjs','js/journal/wire.mjs','js/journal/contract.mjs','js/journal/pending-intent.mjs','question-bank/js/learning-transition.mjs','question-bank/js/practice-flow.mjs']]
ROW={'path':str,'bytes':int,'sha256':str}
RPC={'route':str,'status':int}
NATIVE={'route':str,'status':int,'code':(str,type(None))}
DESCENDANTS={'subreaper_enabled':bool,'registered_roots':int,'registered_roots_reaped_by_registry':int,'descendants_observed':int,'adopted_descendants_reaped':int,'pidfd_signals_sent':int,'complete_scans':int,'descendants_remaining':int}
CHILD_EXECUTION={'role':str,'run_id':str,'postgres_major':int,'source_manifest_sha256':str,'exit_code':int,'output':ROW}
RUN_SHAPE={**dict.fromkeys(('contract','status','run_id','tested_sha','tested_tree','postgres_version_after'),str),
 **dict.fromkeys(('postgres_major','production_calls','groups','browser_groups'),int),
 **dict.fromkeys(('hosted_edge_executed','hosted_tls_executed','tls_executed','browser_persistence_executed','service_start_attempted','cleanup_complete','fresh_sql_denial_observed','cdp_listener_absent','tls_listeners_absent','process_cleanup_complete','secrets_removed'),bool),
 'installation':{'migrations':int,'journal_owners_initial':int,'postgres_version':str,'storage_service_executed':bool},
 'network':{'name':str,'network_id':str,'internal':bool,'published_ports':bool,'services':{name:{'container_id':str,'ipv4':str,'image_id':str} for name in ('db','rest')}},
 'readiness':{'http_status':int,'code':str,'ready':bool},'browser_cdp':{'loopback':bool,'owned_browser_listener':bool},
 'process_cleanup':[{'role':str,'reaped':bool,'group_members_remaining':int}],
 'child_executions':[CHILD_EXECUTION],'descendant_cleanup':DESCENDANTS,'descendant_absence':DESCENDANTS}
HTTP_SHAPE={**dict.fromkeys(('contract','status'),str),'planned_groups':[str],'checks':[str],
 **dict.fromkeys(('real_http_executed','postgrest_executed','database_executed','hosted_edge_executed','tls_executed','browser_persistence_executed','http_attempted','control_reaped'),bool),
 'production_calls':int,'http_metrics':{'requests':int,'responses':int,'dropped':int},'rpc_observations':[RPC],'source_files':[ROW]}
BROWSER_SHAPE={**dict.fromkeys(('contract','status'),str),'planned_groups':[str],
 'checks':[{'name':str,'status':str,'elapsed_ms':int,'details':dict}],
 'production_calls':int,**dict.fromkeys(('hosted_edge_executed','hosted_tls_executed','production_authority_accepted','native_browser_executed','real_https_executed','postgrest_executed','database_executed','cleanup_complete','held_transport_served'),bool),
 'tls':{'accepted_leaf':bool,'served_der_sha256':str,'served_spki_sha256':str,'narrow_spki_exception':bool,'fresh_explicit_profile':bool,'unrelated_leaf_rejected':bool,'negative_application_requests':int,'broad_tls_flags':bool},
 'browser':{'product':str,'revision':str,'playwright':str,'descriptor_revision':str,'executable_sha256':str},
 'source_files':[ROW],'static_routes':int,'served_t3_modules':int,
 'cleanup':{'contexts_closed':bool,'browser_connection_closed':bool,'control_reaped':bool,'listeners_closed':bool,'response_tasks_remaining':int},
 'unexpected_requests':[],'page_errors':[],'rpc_observations':[RPC],'http_observations':[NATIVE]}


def need(value,code):
    if not value:
        raise ValueError(code)


def exact_keys(value,keys,code):
    need(type(value) is dict and set(value)==set(keys),code)


def closed(value,template,code):
    """Reject unknown fields at every level before an artifact is accepted."""
    if type(template) is dict:
        exact_keys(value,template,code)
        for key,child in template.items():closed(value[key],child,code)
    elif type(template) is list:
        need(type(value) is list,code)
        if not template:need(not value,code)
        else:
            need(len(template)==1,code)
            for child in value:closed(child,template[0],code)
    elif type(template) is tuple:
        need(type(value) in template,code)
    elif isinstance(template,type):
        need(type(value) is template,code)
    else:
        need(type(value) is type(template) and value==template,code)


def local_rows(names):
    return [{key:contract.info(SOURCE/name,name,SOURCE)[key] for key in ROW} for name in names]


def validate_observations(rows,native=False,limit=1000):
    closed(rows,[NATIVE if native else RPC],'observation-shape');need(len(rows)<=limit,'observation-limit')
    codes={'session-unavailable','actor-unavailable','owner-unavailable','invalid-request','journal-conflict','journal-limit','journal-deadline','journal-busy','journal-unavailable','upstream-rejected','invalid-upstream','content-type','content-encoding','content-length','deadline','cancelled'}
    for row in rows:
        routes={'state','apply','operation','heads'} if native else {'learning_journal_'+name for name in ('state','apply','operation','heads')}
        need(row['route'] in routes and integer(row['status'],100,599),'observation-value')
        if native:need(row['code'] is None or row['code'] in codes,'observation-code')


def integer(value,minimum=0,maximum=1000000):
    return type(value) is int and minimum<=value<=maximum


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def no_duplicates(pairs):
    value={}
    for key,item in pairs:
        need(key not in value,'duplicate-json-key');value[key]=item
    return value


def bounded_bytes(path):
    with path.open('rb') as stream:raw=stream.read(1048577)
    need(0<len(raw)<=1048576,'member-size')
    return raw


def read_member(directory,name):
    need(name in (*RUN_NAMES,*TEST_NAMES,LOCAL_INDEX,'run-members.json','acceptance.json','artifact-index.json'),'member-name')
    path=contract.guarded_path(directory/name,directory)
    need(path.is_file() and path.stat().st_nlink==1,'member-file')
    raw=bounded_bytes(path)
    return json.loads(raw,object_pairs_hook=no_duplicates,parse_constant=lambda _value:(_ for _ in ()).throw(ValueError('nonfinite-json'))),{'path':name,'bytes':len(raw),'sha256':digest(raw)}


def labels(path,pattern,count):
    value=re.findall(pattern,path.read_text(encoding='utf-8'),re.MULTILINE)
    need(len(value)==len(set(value))==count,'source-case-labels')
    return value


def validate_checkout(value,run):
    exact_keys(value,['contract','event','tested_commit','tested_tree','parents','head','base'],'checkout-shape')
    need(value['contract']=='echs.c04.browser-http-checkout.v1' and value['event'] in ('pull_request','push','workflow_dispatch'),'checkout-contract')
    need(type(value['parents']) is list and 1<=len(value['parents'])<=2,'checkout-parents')
    for key in ('tested_commit','tested_tree','head'):
        need(type(value[key]) is str and re.fullmatch('[a-f0-9]{40}',value[key]),'checkout-sha')
    need(all(type(x) is str and re.fullmatch('[a-f0-9]{40}',x) for x in value['parents']),'checkout-parent-sha')
    if value['event']=='pull_request':
        need(value['parents']==[value['base'],value['head']],'checkout-merge-parents')
    else:
        need(value['base'] is None and value['head']==value['tested_commit'],'checkout-direct-head')
    need(run['tested_sha']==value['tested_commit'] and run['tested_tree']==value['tested_tree'],'checkout-run-binding')


def validate_local(reports):
    if LOCAL_INDEX in reports:
        index=reports[LOCAL_INDEX]
        closed(index,{'contract':str,'status':str,'source_manifest_sha256':str,'source_before':dict,'source_after':dict,'executions':[{'suite':str,'exit_code':int,'output':ROW}]},'local-index-shape')
        need(index['contract']=='echs.c04.browser-http-local-executions.v1' and index['status']=='PASS','local-index-status')
        need(index['source_before']==index['source_after'] and index['source_before']['manifest_sha256']==index['source_manifest_sha256'],'local-source-sweeps')
        need([row['suite'] for row in index['executions']]==['contract','cert','supervisor','descendant','https','bridge'],'local-execution-order')
        need(all(row['exit_code']==0 for row in index['executions']),'local-exit-codes')
        need([row['output']['path'] for row in index['executions']]==list(TEST_NAMES),'local-execution-reports')
        for row in index['executions']:
            need(integer(row['output']['bytes'],1,1048576) and re.fullmatch('[a-f0-9]{64}',row['output']['sha256']),'local-output-shape')
    value=reports['contract-tests.json']
    closed(value,{'contract':str,'status':str,'tests':int,'failed':int,'source_files':[ROW]},'contract-tests-shape')
    need(value['contract']=='echs.c04.browser-http-contract-tests.v1' and value['status']=='PASS' and value['tests']==20 and value['failed']==0,'local-contract-tests')
    need(value['source_files']==local_rows(['contract.py','run.py','assemble.py','test_contract.py']),'local-contract-sources')
    for name,count,contract_name in [('cert-tests.json',14,'echs.browser-journal.certificate-tests.v1'),('supervisor-tests.json',17,'echs.browser-journal.supervisor-tests.v1')]:
        value=reports[name]
        is_cert=name=='cert-tests.json';available='actual_openssl_available' if is_cert else 'actual_linux_available'
        template={'contract':str,'status':str,'tests':int,'failures':int,'errors':int,'skipped':int,available:bool,'required_actual':bool,'skip_reasons':[],'sources':[{'path':str,'sha256':str}],'scope':str}
        if not is_cert:template['failed_identifiers']=[]
        closed(value,template,'required-native-shape')
        need(value['contract']==contract_name and value['status']=='PASS' and value['tests']==count and all(type(value[key]) is int and value[key]==0 for key in ('failures','errors','skipped')),'required-native-local-tests')
        need(value[available] is True and value['required_actual'] is True,'required-native-executed')
        names=['certs.py','test_certs.py'] if is_cert else ['processes.py','test_supervisor.py']
        need(value['sources']==[{key:row[key] for key in ('path','sha256')} for row in local_rows(names)],'required-native-sources')
        expected_scope='Local guards plus actual OpenSSL generation and Python TLS only when executed; no browser or hosted TLS claim.' if is_cert else 'Ownership guards and direct Linux child/group/socket tests only; no escaped-descendant, Chromium, browser, SQL or production acceptance.'
        need(value['scope']==expected_scope,'native-tests-scope')
    value=reports['descendant-tests.json']
    closed(value,{'status':str,'tests':int,'require_linux':bool,'native_linux_available':bool,'failures':int,'errors':int,'skipped':int},'descendant-tests-shape')
    need(value['status']=='PASS' and value['tests']==20 and value['require_linux'] is True and value['native_linux_available'] is True and all(type(value[key]) is int and value[key]==0 for key in ('failures','errors','skipped')),'required-descendant-tests')
    value=reports['https-tests.json']
    closed(value,{'status':str,'groups':int,'checks':[str]},'https-tests-shape')
    expected=labels(SOURCE/'test_https_bridge.mjs',r"^ await test\('([^']+)'",10)
    need(value['status']=='NODE LOOPBACK TLS PASS; NO BROWSER OR SQL ACCEPTANCE' and value['groups']==10 and value['checks']==expected,'local-https-tests')
    value=reports['bridge-tests.json']
    closed(value,{'contract':str,'status':str,'groups':int,'outcomes':[{'name':str,'status':str}],'real_loopback_http':bool,'postgrest_executed':bool,'database_executed':bool,'production_calls':int},'bridge-tests-shape')
    expected=labels(SOURCE/'test_bridge.mjs',r"^test\('([^']+)'",9)
    need(value['contract']=='echs.c04.journal-http-loopback-adapter.v1' and value['status']=='PASS' and value['groups']==9 and value['outcomes']==[{'name':name,'status':'PASS'} for name in expected],'retained-bridge-tests')
    need(value['real_loopback_http'] is True and value['postgrest_executed'] is False and value['database_executed'] is False and value['production_calls']==0,'bridge-tests-scope')


def validate_browser(value,tls,dependencies):
    closed(value,BROWSER_SHAPE,'browser-report-shape')
    validate_observations(value['rpc_observations'],limit=12)
    validate_observations(value['http_observations'],native=True,limit=12)
    expected=labels(SOURCE/'browser-cases.mjs',r"^ '([^']+)'",12)
    need(value['contract']=='echs.c04.browser-journal-http-actual.v1' and value['status']=='ACTUAL BROWSER HTTPS POSTGREST SQL PASS','browser-status')
    need(value['planned_groups']==expected and type(value['checks']) is list and len(value['checks'])==12,'browser-groups')
    need([row['name'] for row in value['checks']]==expected and all(row['status']=='PASS' and integer(row['elapsed_ms'],0,45000) for row in value['checks']),'browser-exact-outcomes')
    for key in ('native_browser_executed','real_https_executed','postgrest_executed','database_executed','cleanup_complete'):
        need(value[key] is True,'browser-execution-flag')
    for key in ('hosted_edge_executed','hosted_tls_executed','production_authority_accepted'):
        need(value[key] is False,'browser-scope')
    need(type(value['production_calls']) is int and value['production_calls']==0 and value['unexpected_requests']==value['page_errors']==[],'browser-network')
    need(value['static_routes']==10 and value['served_t3_modules']==7 and value['held_transport_served'] is False,'browser-served-boundary')
    projected=public_metadata({'openssl_version':tls['openssl_version'],**{name:{'certificate_path':'not-read','key_path':'not-read','metadata':tls[name]} for name in ('positive','negative')}})
    need(projected==tls,'tls-closed-metadata')
    actual=value['tls'];exact_keys(actual,['accepted_leaf','served_der_sha256','served_spki_sha256','narrow_spki_exception','fresh_explicit_profile','unrelated_leaf_rejected','negative_application_requests','broad_tls_flags'],'browser-tls-shape')
    need(all(actual[key] is True for key in ('accepted_leaf','narrow_spki_exception','fresh_explicit_profile','unrelated_leaf_rejected')) and actual['broad_tls_flags'] is False and type(actual['negative_application_requests']) is int and actual['negative_application_requests']==0,'browser-tls-guards')
    need(actual['served_der_sha256']==tls['positive']['der_sha256'] and actual['served_spki_sha256']==tls['positive']['spki_sha256'],'browser-leaf-identity')
    pin=json.loads((SOURCE/'browser-dependency.json').read_bytes());browser=value['browser']
    need(browser['product'] in ('Chrome/'+pin['version'],'HeadlessChrome/'+pin['version']) and browser['playwright']==pin['playwright'] and browser['descriptor_revision']==pin['revision'] and re.fullmatch('@[a-f0-9]{40}',browser['revision']),'browser-version')
    need(browser['executable_sha256']==dependencies['browser_executable_sha256'] and re.fullmatch('[a-f0-9]{64}',browser['executable_sha256']),'browser-binary-binding')
    details=[row['details'] for row in value['checks']]
    expected_details=[
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
    # JSON canonical encodings retain the distinction between true and integer1.
    need(json.dumps(details,sort_keys=True)==json.dumps(expected_details,sort_keys=True),'browser-required-assertions')
    clean=value['cleanup'];need(all(clean[key] is True for key in ('contexts_closed','browser_connection_closed','control_reaped','listeners_closed')) and type(clean['response_tasks_remaining']) is int and clean['response_tasks_remaining']==0,'browser-cleanup')


def validate_actual(reports,source,major):
    run=reports['run-report.json'];closed(run,RUN_SHAPE,'run-report-shape')
    need(run['contract']=='echs.c04.browser-journal-service-run.v1' and run['status']=='ACTUAL BROWSER JOURNAL SERVICES PASS','run-status')
    need(type(run['postgres_major']) is int and run['postgres_major']==major and run['groups']==20 and run['browser_groups']==12,'run-major-groups')
    need(re.fullmatch('[a-f0-9]{32}',run['run_id']) and type(run['production_calls']) is int and run['production_calls']==0,'run-scope')
    for key in ('tls_executed','browser_persistence_executed','cleanup_complete','process_cleanup_complete','secrets_removed','cdp_listener_absent','tls_listeners_absent','fresh_sql_denial_observed'):
        need(run[key] is True,'run-required-boundary')
    need(run['hosted_edge_executed'] is False and run['hosted_tls_executed'] is False,'run-hosted-scope')
    need(run['service_start_attempted'] is True and run['readiness']=={'http_status':403,'code':'28000','ready':True} and run['browser_cdp']=={'loopback':True,'owned_browser_listener':True},'run-positive-controls')
    installation=run['installation'];need(installation['migrations']==27 and installation['journal_owners_initial']==0 and installation['storage_service_executed'] is False,'install-boundary')
    need(installation['postgres_version']==run['postgres_version_after'] and re.fullmatch(str(major)+r'\.\d+ \(Debian [0-9.a-z+-]+\)',installation['postgres_version']),'actual-postgres-version')
    network=run['network'];need(network['internal'] is True and network['published_ports'] is False and set(network['services'])=={'db','rest'},'network-boundary')
    need(network['name']=='echs-journal-http-'+run['run_id'],'network-run-binding')
    need(re.fullmatch('[a-f0-9]{64}',network['network_id']),'network-identity')
    for row in network['services'].values():
        need(re.fullmatch('[a-f0-9]{64}',row['container_id']) and re.fullmatch('sha256:[a-f0-9]{64}',row['image_id']),'container-identity')
        address=ipaddress.IPv4Address(row['ipv4'])
        need(any(address in ipaddress.IPv4Network(cidr) for cidr in ('10.0.0.0/8','172.16.0.0/12','192.168.0.0/16')),'container-private-address')
    need(network['services']['db']['container_id']!=network['services']['rest']['container_id'] and network['services']['db']['ipv4']!=network['services']['rest']['ipv4'],'service-distinct-identities')
    closed(reports['image-receipt.json'],{service:{'reference':str,'image_id':str,'repository_digest':str} for service in ('db','rest')},'image-receipt-shape')
    expected_images={15:('postgres@sha256:9b1d34adbce1dd07ee6e94b4a2cf698884b89bd44a6c9c12f5da8f3acbfe4957','sha256:40710ae201396ad27dfd01526815d5ad83c83850e7cb16dce9f0012da66f4689'),17:('postgres@sha256:67f41722b7a8cbdb868a44a4995c846eddfdc2973bccb291ce937dce88ad5675','sha256:7296f210ae81031ec955dbad9a67a84fe958572a2153b8d0826a647522904dc1')}
    for service,(reference,image) in {'db':expected_images[major],'rest':('postgrest/postgrest@sha256:c9dc201e555f5d8e37e7f39cdd4df0229774996e213bfd7de8d10ac609030f2c','sha256:fc3d286fec899d5a5bebbb98eac771ced1ccaa44deac8ce2fc23fe5d262eb3d9')}.items():
        need(reports['image-receipt.json'][service]=={'reference':reference,'image_id':image,'repository_digest':reference} and network['services'][service]['image_id']==image,'image-identity')
    processes=run['process_cleanup'];need(len(processes)==3 and {row['role'] for row in processes}=={'browser','driver','http'},'process-root-count')
    need(all(row=={'role':row['role'],'reaped':True,'group_members_remaining':0} for row in processes),'process-root-cleanup')
    for key in ('descendant_cleanup','descendant_absence'):
        row=run[key];need(row['subreaper_enabled'] is True and row['registered_roots']==3 and type(row['registered_roots_reaped_by_registry']) is int and row['registered_roots_reaped_by_registry']==0 and type(row['descendants_remaining']) is int and row['descendants_remaining']==0 and integer(row['complete_scans'],2),'descendant-cleanup')
        need(all(integer(row[field]) for field in DESCENDANTS if field!='subreaper_enabled'),'descendant-counts')
        need(row['descendants_observed']>=3 and row['adopted_descendants_reaped']<=row['descendants_observed'],'descendant-count-relation')
    validate_checkout(reports['checkout.json'],run)
    need(reports['source-receipt.json']==reports['final-source-receipt.json']==source,'exact-source-sweeps')
    http=reports['http-results.json'];closed(http,HTTP_SHAPE,'http-report-shape');expected=labels(SOURCE/'test_http.mjs',r"^ '([^']+)'",20)
    need(http['contract']=='echs.c04.journal-http-actual.v1' and http['status']=='ACTUAL HTTP POSTGREST SQL PASS' and http['checks']==http['planned_groups']==expected,'original20-http-groups')
    need(all(http[key] is True for key in ('real_http_executed','postgrest_executed','database_executed','control_reaped')) and http['hosted_edge_executed'] is False and http['tls_executed'] is False and http['browser_persistence_executed'] is False,'original-http-boundary')
    need(http['http_attempted'] is True and http['production_calls']==0 and all(integer(value) for value in http['http_metrics'].values()),'http-metrics')
    validate_observations(http['rpc_observations'])
    need(http['source_files']==local_rows(HTTP_SOURCES),'http-runtime-binding')
    browser=reports['browser-results.json']
    need(browser['source_files']==local_rows(BROWSER_SOURCES),'browser-runtime-binding')
    dependencies=reports['dependency-receipt.json'];pin=json.loads((SOURCE/'browser-dependency.json').read_bytes())
    closed(dependencies,{**dict.fromkeys(('playwright','playwright_core','descriptor_sha256','browser_revision','browser_version','actual_browser_version','browser_executable_sha256','node','python','driver'),str),'descriptor_bytes':int},'dependency-shape')
    need(dependencies['playwright']==dependencies['playwright_core']==pin['playwright'] and dependencies['descriptor_sha256']==pin['browsers_json_sha256'] and dependencies['descriptor_bytes']==pin['browsers_json_bytes'] and dependencies['browser_revision']==pin['revision'] and dependencies['browser_version']==pin['version'] and dependencies['actual_browser_version'].endswith(pin['version']),'dependency-identity')
    need(re.fullmatch(r'v24\.\d+\.\d+',dependencies['node']) and re.fullmatch(r'3\.12\.\d+',dependencies['python']) and dependencies['driver']=='3.2.9','runtime-version')
    validate_browser(browser,reports['tls-material.json'],dependencies)


def validate_child_executions(run,rows,source,major):
    expected=[]
    for role,name in [('http','http-results.json'),('driver','browser-results.json')]:
        expected.append({'role':role,'run_id':run['run_id'],'postgres_major':major,'source_manifest_sha256':source['manifest_sha256'],'exit_code':0,'output':next(row for row in rows if row['path']==name)})
    need(run['child_executions']==expected,'child-execution-binding')


def validate_current_checkout(repo,value):
    def git(*args):
        return subprocess.run(['git','-C',str(repo),*args],capture_output=True,text=True,check=True,timeout=10).stdout.strip()
    need(git('rev-parse','HEAD')==value['tested_commit']==os.environ.get('GITHUB_SHA'),'collector-checkout')
    need(git('rev-parse','HEAD^{tree}')==value['tested_tree'] and git('show','-s','--format=%P','HEAD').split()==value['parents'],'collector-tree-parents')
    need(os.environ.get('GITHUB_EVENT_NAME')==value['event'],'collector-event')
    event=json.loads(Path(os.environ['GITHUB_EVENT_PATH']).read_bytes(),object_pairs_hook=no_duplicates)
    if value['event']=='pull_request':
        need(value['head']==event['pull_request']['head']['sha'] and value['base']==event['pull_request']['base']['sha'],'collector-event-head-base')
    else:
        need(value['head']==value['tested_commit'] and value['base'] is None,'collector-direct-event')


def assemble(directory,tests,repo,major):
    need(type(major) is int and major in (15,17),'matrix-major')
    source=contract.sources(repo,True)
    need({p.name for p in directory.iterdir()}==set(RUN_NAMES)|{'run-members.json'},'initial-run-member-set')
    need({p.name for p in tests.iterdir()}==set(TEST_NAMES)|{LOCAL_INDEX},'local-test-member-set')
    reports={};rows=[]
    for name in RUN_NAMES:
        value,row=read_member(directory,name);reports[name]=value;rows.append(row)
    members,index_row=read_member(directory,'run-members.json');rows.append(index_row)
    closed(members,{'status':str,'cleanup_complete':bool,'members':[ROW]},'run-inner-shape')
    need(members['status']=='ACTUAL BROWSER JOURNAL SERVICES PASS' and members['cleanup_complete'] is True and members['members']==rows[:-1],'run-inner-index')
    for name in (*TEST_NAMES,LOCAL_INDEX):
        value,row=read_member(tests,name);reports[name]=value;rows.append(row)
    validate_local(reports);validate_actual(reports,source,major)
    local=reports[LOCAL_INDEX]
    need(local['source_before']==local['source_after']==source and local['source_manifest_sha256']==source['manifest_sha256'],'local-actual-source-binding')
    need([value['output'] for value in local['executions']]==[row for row in rows if row['path'] in TEST_NAMES],'local-actual-output-binding')
    validate_child_executions(reports['run-report.json'],rows,source,major)
    checkout=reports['checkout.json']
    validate_current_checkout(repo,checkout)
    for name in (*TEST_NAMES,LOCAL_INDEX):
        with (directory/name).open('xb') as stream:
            stream.write(bounded_bytes(tests/name))
    acceptance={'contract':'echs.c04.browser-journal-http-acceptance.v1','status':'PASS FOR ISOLATED ACTUAL BROWSER HTTPS SQL SCOPE','postgres_major':major,'tested_commit':checkout['tested_commit'],'tested_tree':checkout['tested_tree'],'source_manifest_sha256':source['manifest_sha256'],'actual_http_groups':20,'actual_browser_groups':12,'actual_total_groups':32,'historical_native_prerequisite_groups':[84,14],'historical_server_prerequisite_groups':479,'historical_groups_rerun_here':False,'cleanup_complete':True,'production_calls':0,'production_authority_accepted':False,'hosted_tls_accepted':False,'active_adoption_accepted':False,'charter_c04_complete':False}
    with (directory/'acceptance.json').open('x',encoding='utf-8',newline='\n') as stream:
        json.dump(acceptance,stream,indent=2);stream.write('\n')
    _,acceptance_row=read_member(directory,'acceptance.json');rows.append(acceptance_row)
    need(contract.sources(repo,True)==source,'collector-final-source')
    for row in rows:
        need(read_member(directory,row['path'])[1]==row,'collector-final-member')
    need({p.name for p in directory.iterdir()}=={row['path'] for row in rows},'collector-final-closure')
    with (directory/'artifact-index.json').open('x',encoding='utf-8',newline='\n') as stream:
        json.dump({'contract':'echs.c04.browser-journal-http-index.v1','status':'PASS','postgres_major':major,'tested_commit':checkout['tested_commit'],'members':rows},stream,indent=2);stream.write('\n')
    return acceptance


def failure_projection(directory,major,error):
    """Fixed failure metadata only; never copy a rejected raw report."""
    types={'ValueError','TypeError','KeyError','AssertionError','Error','TimeoutError','TargetClosedError','RangeError','ReferenceError','TimeoutExpired','PermissionError','FileNotFoundError','OSError','CalledProcessError','OperationalError','InterfaceError','DatabaseError','CertificateError'}
    def error_type(value):return value if type(value) is str and value in types else 'OtherError'
    location=None;trace=error.__traceback__
    while trace:
        if trace.tb_frame.f_code.co_filename==__file__:location=trace.tb_lineno
        trace=trace.tb_next
    result={'contract':'echs.c04.browser-journal-http-failure.v1','status':'FAIL; NO ACCEPTANCE',
            'postgres_major':major,'collector_error':{'type':error_type(type(error).__name__),'line':location},
            'raw_reports_uploaded':False,'reports':{}}
    for name in ('run-report.json','http-results.json','browser-results.json'):
        try:value,_=read_member(directory,name)
        except Exception:continue
        if type(value) is not dict:continue
        projected={}
        statuses={'RUNNING; NOT ACCEPTED','FAIL; NO ACCEPTANCE','ACTUAL BROWSER JOURNAL SERVICES PASS','ACTUAL HTTP POSTGREST SQL PASS','ACTUAL BROWSER HTTPS POSTGREST SQL PASS'}
        if type(value.get('status')) is str and value['status'] in statuses:projected['status']=value['status']
        for field in ('cleanup_complete','process_cleanup_complete','secrets_removed','cdp_listener_absent','tls_listeners_absent','control_reaped','real_http_executed','postgrest_executed','database_executed','native_browser_executed','real_https_executed'):
            if type(value.get(field)) is bool:projected[field]=value[field]
        for field in ('process_initial_scan_failure_type','descendant_cleanup_failure_type','process_cleanup_failure_type','network_cleanup_failure_type','cleanup_failure_type','final_source_failure_type','private_cleanup_failure_type'):
            if type(value.get(field)) is str:projected[field]=error_type(value[field])
        for field,key,allowed in [('process_cleanup_errors','role',{'browser','driver','http'}),('container_cleanup_errors','service',{'db','rest'})]:
            if type(value.get(field)) is list:
                projected[field]=[{key:row[key],'type':error_type(row.get('type'))} for row in value[field][:8] if type(row) is dict and type(row.get(key)) is str and row[key] in allowed]
        if type(value.get('cleanup_failure')) is dict:projected['cleanup_failure_type']=error_type(value['cleanup_failure'].get('type'))
        failure=value.get('failure')
        if type(failure) is dict:
            safe={'type':error_type(failure.get('type'))}
            if type(failure.get('sqlstate')) is str and re.fullmatch('[A-Z0-9]{5}',failure['sqlstate']):safe['sqlstate']=failure['sqlstate']
            stages=BROWSER_FAILURE_STAGES if name=='browser-results.json' else RUN_FAILURE_STAGES
            if type(failure.get('stage')) is str and failure['stage'] in stages:safe['stage']=failure['stage']
            if name=='browser-results.json' and type(failure.get('network_error')) is str and failure['network_error'] in BROWSER_NETWORK_ERRORS:safe['network_error']=failure['network_error']
            if name=='run-report.json' and integer(failure.get('errno'),1,4095):safe['errno']=failure['errno']
            for key in ('actual','expected'):
                item=failure.get(key)
                if type(item) is int and -1000000<=item<=1000000:safe[key]=item
                elif type(item) is list and len(item)<=8 and all(type(x) is int and -1000000<=x<=1000000 for x in item):safe[key]=item
            for key,allowed in [('code',{'ERR_ASSERTION','ECONNRESET','ECONNREFUSED','EPIPE','ETIMEDOUT','UND_ERR_SOCKET','UND_ERR_CONNECT_TIMEOUT'}),('operator',{'strictEqual','deepStrictEqual','match','notStrictEqual','=='})]:
                if type(failure.get(key)) is str and failure[key] in allowed:safe[key]=failure[key]
            point=failure.get('location')
            if name=='run-report.json':
                if type(point) is dict and type(point.get('file')) is str and point['file'] in RUN_FAILURE_SOURCE_NAMES and integer(point.get('line'),1,1000000):safe['location']={'file':point['file'],'line':point['line']}
            elif type(point) is dict and integer(point.get('line'),1,1000000) and integer(point.get('column'),1,1000000):
                safe['location']={'line':point['line'],'column':point['column']}
                if name=='browser-results.json' and type(point.get('file')) is str and point['file'] in {'test_browser_http.mjs','browser-cases.mjs'}:safe['location']['file']=point['file']
            projected['failure']=safe
        if name!='run-report.json':
            # Failure diagnostics do not trust source text after a failed
            # source sweep. Retain only fixed identifiers, never descriptions.
            prefix,count=('S',20) if name=='http-results.json' else ('B',12)
            expected=[prefix+str(index).zfill(2) for index in range(1,count+1)]
            def case_id(text):
                match=re.match(r'^('+prefix+r'\d{2})(?: |$)',text) if type(text) is str else None
                return match[1] if match and match[1] in expected else None
            checks=value.get('checks')
            if type(checks) is list:
                names=[case_id(row if type(row) is str else row.get('name') if type(row) is dict else None) for row in checks]
                if names==expected[:len(names)]:projected['completed_groups']=names
            failed=case_id(value.get('failed_group'))
            if failed is not None:projected['failed_group']=failed
            elif value.get('failed_group')=='setup':projected['failed_group']='setup'
            for field,native in [('rpc_observations',False),('http_observations',True)]:
                observed=value.get(field)
                if type(observed) is list:
                    safe=[]
                    for row in observed[-12:]:
                        try:validate_observations([row],native=native,limit=1)
                        except Exception:continue
                        safe.append(row)
                    projected[field]=safe
        result['reports'][name]=projected
    return result


def publish(directory,tests,repo,major,output):
    """Only this fresh output directory is eligible for artifact upload."""
    need(type(major) is int and major in (15,17),'matrix-major')
    temporary=Path(os.environ['RUNNER_TEMP'])
    target=contract.guarded_path(output,temporary)
    need(target.parent==contract.guarded_path(temporary,temporary) and target.name=='private-learning-browser-journal-http-evidence-'+str(major) and not target.exists(),'fresh-published-evidence')
    target.mkdir(mode=0o700)
    try:
        source=contract.sources(repo,True)
        acceptance=assemble(directory,tests,repo,major)
        index,index_row=read_member(directory,'artifact-index.json')
        closed(index,{'contract':str,'status':str,'postgres_major':int,'tested_commit':str,'members':[ROW]},'publish-index-shape')
        need(index['contract']=='echs.c04.browser-journal-http-index.v1' and index['status']=='PASS' and index['postgres_major']==major and index['tested_commit']==acceptance['tested_commit'],'publish-index-identity')
        expected=[*RUN_NAMES,'run-members.json',*TEST_NAMES,LOCAL_INDEX,'acceptance.json']
        need([row['path'] for row in index['members']]==expected,'publish-index-members')
        need(acceptance['source_manifest_sha256']==source['manifest_sha256'],'publish-source-binding')
        # Revalidate the exact bytes selected for upload. A changed report and
        # rehashed index after assemble() cannot bypass closed metadata checks.
        selected={}
        for row in index['members']:
            value,actual=read_member(directory,row['path']);need(actual==row,'publish-selected-member')
            selected[row['path']]=value
        validate_local(selected);validate_actual(selected,source,major)
        validate_child_executions(selected['run-report.json'],index['members'],source,major)
        need(selected['acceptance.json']==acceptance,'publish-acceptance-identity')
        inner=selected['run-members.json']
        closed(inner,{'status':str,'cleanup_complete':bool,'members':[ROW]},'publish-inner-shape')
        need(inner['status']=='ACTUAL BROWSER JOURNAL SERVICES PASS' and inner['cleanup_complete'] is True and inner['members']==index['members'][:9],'publish-inner-binding')
        local=selected[LOCAL_INDEX]
        need(local['source_before']==local['source_after']==source and [value['output'] for value in local['executions']]==[row for row in index['members'] if row['path'] in TEST_NAMES],'publish-local-binding')
        for row in index['members']:
            _,actual=read_member(directory,row['path']);need(actual==row,'publish-member-drift')
            raw=bounded_bytes(contract.guarded_path(directory/row['path'],directory))
            need(len(raw)==row['bytes'] and digest(raw)==row['sha256'],'publish-copy-drift')
            with (target/row['path']).open('xb') as stream:stream.write(raw)
        need(contract.sources(repo,True)==source,'publish-final-source')
        validate_current_checkout(repo,read_member(directory,'checkout.json')[0])
        for row in index['members']:need(read_member(target,row['path'])[1]==row,'publish-final-member')
        need({path.name for path in target.iterdir()}=={row['path'] for row in index['members']},'publish-final-closure')
        raw=bounded_bytes(directory/'artifact-index.json')
        need(len(raw)==index_row['bytes'] and digest(raw)==index_row['sha256'],'publish-final-index')
        with (target/'artifact-index.json').open('xb') as stream:stream.write(raw)
        return acceptance
    except Exception as error:
        failure=failure_projection(directory,major,error)
        with (target/'failure.json').open('x',encoding='utf-8',newline='\n') as stream:
            json.dump(failure,stream,indent=2);stream.write('\n')
        return failure


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--directory',required=True,type=Path);parser.add_argument('--tests',required=True,type=Path);parser.add_argument('--repo',required=True,type=Path);parser.add_argument('--postgres-major',required=True,type=int,choices=(15,17))
    parser.add_argument('--output',required=True,type=Path)
    args=parser.parse_args()
    try:
        result=publish(args.directory,args.tests,args.repo,args.postgres_major,args.output)
        print(json.dumps({'status':result['status'],'postgres_major':args.postgres_major}))
        if result['status']!='PASS FOR ISOLATED ACTUAL BROWSER HTTPS SQL SCOPE':raise SystemExit(1)
    except Exception as error:
        print(json.dumps({'status':'FAIL; NO ACCEPTANCE INDEX','type':type(error).__name__}));raise SystemExit(1)
