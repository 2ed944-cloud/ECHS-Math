"""Closed additive current-session evidence over unchanged baseline validators."""
import sys
from pathlib import Path
SESSION_HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(SESSION_HERE.parent/'private-learning-browser-journal-http'))
import assemble as prior
from assemble import *
import session_contract
import session_report_review as current_review

SERVICE_SUCCESS='ACTUAL CURRENT SESSION JOURNAL SERVICES PASS'
RUN_NAMES=('checkout.json','source-receipt.json','image-receipt.json','http-results.json','browser-results.json','current-session-results.json','dependency-receipt.json','tls-material.json','current-session-source-receipt.json','final-source-receipt.json','final-current-session-source-receipt.json','run-report.json')
ALL_NAMES=(*RUN_NAMES,'run-members.json',*TEST_NAMES,LOCAL_INDEX,'acceptance.json','artifact-index.json')
SOURCE_ROW={**ROW,'git_blob_sha':str}
BINDING={'kind':str,'role':str,'run_id':str,'postgres_major':int,'source_manifest_sha256':str,'source':SOURCE_ROW,
 'argv_template':[str],'argv_sha256':str,'root':dict.fromkeys(('pid','pgrp','session','start','uid'),int),
 'waited':bool,'exit_code':int,'output':ROW,'protocol_log':(str,type(None)),'listener_file':(str,type(None)),
 'cleanup':{'role':str,'reaped':bool,'group_members_remaining':int}}
RUN_SHAPE={**prior.RUN_SHAPE,'current_session_executed':bool,'current_session_groups':int,'production_auth_executed':bool,
 'active_adoption':bool,'current_session_tls_listeners_absent':bool,'child_bindings':[BINDING]}

def read_member(directory,name):
 need(name in ALL_NAMES,'current-session-member-name');path=contract.guarded_path(directory/name,directory)
 need(path.is_file() and path.stat().st_nlink==1,'member-file');raw=bounded_bytes(path)
 value=json.loads(raw,object_pairs_hook=no_duplicates,parse_constant=lambda _value:(_ for _ in ()).throw(ValueError('nonfinite-json')))
 return value,{'path':name,'bytes':len(raw),'sha256':digest(raw)}

def validate_actual(reports,source,major):
    run=reports['run-report.json'];closed(run,RUN_SHAPE,'run-report-shape')
    need(run['contract']=='echs.c04.current-session-journal-service-run.v1' and run['status']=='ACTUAL CURRENT SESSION JOURNAL SERVICES PASS','run-status')
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
    processes=run['process_cleanup'];need(len(processes)==4 and sorted(row['role'] for row in processes)==['browser','driver','driver','http'],'process-root-count')
    need(all(row=={'role':row['role'],'reaped':True,'group_members_remaining':0} for row in processes),'process-root-cleanup')
    for key in ('descendant_cleanup','descendant_absence'):
        row=run[key];need(row['subreaper_enabled'] is True and row['registered_roots']==4 and type(row['registered_roots_reaped_by_registry']) is int and row['registered_roots_reaped_by_registry']==0 and type(row['descendants_remaining']) is int and row['descendants_remaining']==0 and integer(row['complete_scans'],2),'descendant-cleanup')
        need(all(integer(row[field]) for field in DESCENDANTS if field!='subreaper_enabled'),'descendant-counts')
        need(row['descendants_observed']>=4 and row['adopted_descendants_reaped']<=row['descendants_observed'],'descendant-count-relation')
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


def validate_children(run,records,baseline,session,major):
 specs=[('http','http','http-results.json',contract.PREFIX+'test_http.mjs',None,None,baseline),
  ('baseline-browser','driver','browser-results.json',contract.PREFIX+'test_browser_http.mjs','driver-protocol.log','listener-private.json',baseline),
  ('current-session','driver','current-session-results.json',session_contract.PREFIX+'test_current_session_http.mjs','current-session-driver-protocol.log','current-session-listener-private.json',session)]
 expected=[];need(len(run['child_bindings'])==3,'child-binding-count');roots=[]
 for binding,(kind,role,name,path,trace,listener,source) in zip(run['child_bindings'],specs):
  output=next(row for row in records if row['path']==name);selected=[row for row in source['source_files'] if row['path']==path];need(len(selected)==1,'child-selected-source')
  need(binding['kind']==kind and binding['role']==role and binding['run_id']==run['run_id'] and binding['postgres_major']==major,'child-identity')
  need(binding['source']==selected[0] and binding['source_manifest_sha256']==source['manifest_sha256'],'child-source-binding')
  need(binding['argv_template']==['node',path,'owned-private-config','python',name] and re.fullmatch('[a-f0-9]{64}',binding['argv_sha256']),'child-exact-vector')
  root=binding['root'];need(all(type(value) is int for value in root.values()) and root['pid']>1 and root['pid']==root['pgrp']==root['session'] and root['start']>0 and root['uid']>=0,'child-root-values');roots.append(root)
  need(binding['waited'] is True and type(binding['exit_code']) is int and binding['exit_code']==0 and binding['output']==output,'child-wait-output')
  need(binding['protocol_log']==trace and binding['listener_file']==listener and binding['cleanup']=={'role':role,'reaped':True,'group_members_remaining':0},'child-private-cleanup')
  expected.append({'role':role,'run_id':run['run_id'],'postgres_major':major,'source_manifest_sha256':source['manifest_sha256'],'exit_code':0,'output':output})
 need(len({row['pid'] for row in roots})==len({(row['pid'],row['start']) for row in roots})==3 and len({row['uid'] for row in roots})==1,'distinct-owned-child-roots')
 need(run['child_executions']==expected,'three-child-execution-binding')

def validate_reports(docs,records,baseline,session,major):
 need(type(major) is int and major in (15,17),'matrix-major')
 validate_local(docs);validate_actual(docs,baseline,major)
 run=docs['run-report.json'];need(run['current_session_executed'] is True and type(run['current_session_groups']) is int and run['current_session_groups']==12 and run['current_session_tls_listeners_absent'] is True,'current-session-execution')
 need(run['production_auth_executed'] is False and run['active_adoption'] is False,'current-session-scope')
 need(docs['current-session-source-receipt.json']==docs['final-current-session-source-receipt.json']==session,'current-session-source-sweeps')
 lookup={row['path']:row for row in session['source_files']};expected_rows=[]
 for path in current_review.SOURCE_PATHS:
  row=lookup[session_contract.PREFIX+path];expected_rows.append({'path':path,'bytes':row['bytes'],'sha256':row['sha256']})
 current_review.validate_current_session(docs['current-session-results.json'],expected={'run_id':run['run_id'],'source_files':expected_rows,'browser':docs['browser-results.json']['browser'],'der_sha256':docs['tls-material.json']['positive']['der_sha256'],'spki_sha256':docs['tls-material.json']['positive']['spki_sha256']})
 validate_children(run,records,baseline,session,major)
 inner=docs['run-members.json'];closed(inner,{'status':str,'cleanup_complete':bool,'members':[ROW]},'current-run-members')
 need(inner['status']==SERVICE_SUCCESS and inner['cleanup_complete'] is True and inner['members']==records[:12],'current-run-member-binding')
 local=docs[LOCAL_INDEX];need(local['source_before']==local['source_after']==baseline and local['source_manifest_sha256']==baseline['manifest_sha256'],'baseline-local-source-binding')
 need([row['output'] for row in local['executions']]==[row for row in records if row['path'] in TEST_NAMES],'baseline-local-output-binding')

def acceptance_for(docs,session,baseline,major):
 checkout=docs['checkout.json']
 return {'contract':'echs.c04.current-session-journal-http-acceptance.v1','status':'PASS FOR ISOLATED CURRENT SESSION HTTPS SQL SCOPE','postgres_major':major,
  'tested_commit':checkout['tested_commit'],'tested_tree':checkout['tested_tree'],'source_manifest_sha256':session['manifest_sha256'],'baseline_manifest_sha256':baseline['manifest_sha256'],
  'actual_http_groups':20,'actual_browser_groups':12,'current_session_groups':12,'actual_total_groups':44,'local_fixture_groups':90,
  'cleanup_complete':True,'synthetic_account_api':True,'production_calls':0,'production_authority_accepted':False,'hosted_tls_accepted':False,'active_adoption_accepted':False,'charter_c04_complete':False}

def validate_documents(docs,records,baseline_source,session_source,major):
 """Artifact bytes and externally authenticated source receipts are caller-owned."""
 need(type(docs) is dict and set(docs)==set(ALL_NAMES),'exact22-documents')
 need(type(records) is list and len(records)==22,'exact22-records')
 for row in records:
  closed(row,ROW,'record-shape');need(integer(row['bytes'],1,1048576) and re.fullmatch('[a-f0-9]{64}',row['sha256']),'record-values')
 need([row['path'] for row in records]==list(ALL_NAMES),'ordered22-records')
 validate_reports(docs,records,baseline_source,session_source,major)
 acceptance=acceptance_for(docs,session_source,baseline_source,major);need(current_review.same(docs['acceptance.json'],acceptance),'current-acceptance-binding')
 index=docs['artifact-index.json'];closed(index,{'contract':str,'status':str,'postgres_major':int,'tested_commit':str,'members':[ROW]},'current-index-shape')
 need(index['contract']=='echs.c04.current-session-journal-http-index.v1' and index['status']=='PASS' and index['postgres_major']==major and index['tested_commit']==acceptance['tested_commit'] and index['members']==records[:-1],'current-index-binding')
 return acceptance

def assemble(directory,tests,repo,major):
 baseline=contract.sources(repo,True);session=session_contract.sources(repo,True)
 need({path.name for path in directory.iterdir()}==set(RUN_NAMES)|{'run-members.json'},'current-initial-members')
 need({path.name for path in tests.iterdir()}==set(TEST_NAMES)|{LOCAL_INDEX},'baseline-local-members')
 docs={};records=[]
 for name in (*RUN_NAMES,'run-members.json',*TEST_NAMES,LOCAL_INDEX):
  value,row=read_member(tests if name in (*TEST_NAMES,LOCAL_INDEX) else directory,name);docs[name]=value;records.append(row)
 validate_reports(docs,records,baseline,session,major);validate_current_checkout(repo,docs['checkout.json'])
 for name in (*TEST_NAMES,LOCAL_INDEX):
  with (directory/name).open('xb') as stream:stream.write(bounded_bytes(tests/name))
 acceptance=acceptance_for(docs,session,baseline,major)
 with (directory/'acceptance.json').open('x',encoding='utf-8',newline='\n') as stream:json.dump(acceptance,stream,indent=2);stream.write('\n')
 docs['acceptance.json'],row=read_member(directory,'acceptance.json');records.append(row)
 index={'contract':'echs.c04.current-session-journal-http-index.v1','status':'PASS','postgres_major':major,'tested_commit':acceptance['tested_commit'],'members':records}
 with (directory/'artifact-index.json').open('x',encoding='utf-8',newline='\n') as stream:json.dump(index,stream,indent=2);stream.write('\n')
 docs['artifact-index.json'],row=read_member(directory,'artifact-index.json');records.append(row)
 need(contract.sources(repo,True)==baseline and session_contract.sources(repo,True)==session,'collector-source-after')
 for row in records:need(read_member(directory,row['path'])[1]==row,'collector-member-after')
 need({path.name for path in directory.iterdir()}==set(ALL_NAMES),'collector-exact22')
 return validate_documents(docs,records,baseline,session,major)

def failure_projection(directory,major,error):
 # This fallback must not depend on labels or constants from an unverified
 # current-session source graph. Only fixed identifiers and enums leave here.
 types={'ValueError','TypeError','KeyError','AssertionError','Error','TimeoutError','TargetClosedError','RangeError','ReferenceError','TimeoutExpired','PermissionError','FileNotFoundError','OSError','CalledProcessError','OperationalError','InterfaceError','DatabaseError','CertificateError'}
 def error_type(value):return value if type(value) is str and value in types else 'OtherError'
 result={'contract':'echs.c04.current-session-journal-http-failure.v1','status':'FAIL; NO ACCEPTANCE','postgres_major':major,'production_calls':0,'raw_reports_uploaded':False,'baseline':prior.failure_projection(directory,major,error)}
 point=None;trace=error.__traceback__
 while trace:
  if trace.tb_frame.f_code.co_filename==__file__ and integer(trace.tb_lineno,1,1000000):point=trace.tb_lineno
  trace=trace.tb_next
 result['collector_error']={'type':error_type(type(error).__name__),'line':point}
 try:
  report,_=read_member(directory,'run-report.json');value={}
  need(type(report) is dict and report.get('contract')=='echs.c04.current-session-journal-service-run.v1','failed-run-contract')
  if report.get('status') in {'RUNNING; NOT ACCEPTED','FAIL; NO ACCEPTANCE','ACTUAL CURRENT SESSION JOURNAL SERVICES PASS'}:value['status']=report['status']
  for key in ('current_session_executed','current_session_tls_listeners_absent','production_auth_executed','active_adoption'):
   if type(report.get(key)) is bool:value[key]=report[key]
  if report.get('browser_stderr_scope')=='baseline-browser-driver':value['browser_stderr_scope']='baseline-browser-driver'
  if report.get('status')=='FAIL; NO ACCEPTANCE':
   observation=report.get('current_session_protocol_setup')
   try:prior.validate_protocol_setup(observation)
   except Exception:pass
   else:value['current_session_protocol_setup']=observation
  failure=report.get('failure')
  if type(failure) is dict:
   safe={'type':error_type(failure.get('type'))}
   stages={'checkout','dependency-identity','ephemeral-tls','image-resolution','network-create','postgres-start','install-exact-schema','postgrest-start','postgrest-readiness','browser-launch','actual-http-cases','actual-browser-cases','post-execution-identity','browser-cdp-recheck','actual-browser-driver-start','actual-browser-driver-wait','actual-browser-driver-output','actual-browser-driver-cleanup','actual-browser-report-check','current-session-cdp-recheck','current-session-driver-start','current-session-driver-wait','current-session-driver-output','current-session-driver-cleanup','current-session-report-check'}
   if type(failure.get('stage')) is str and failure['stage'] in stages:safe['stage']=failure['stage']
   if type(failure.get('sqlstate')) is str and re.fullmatch('[A-Z0-9]{5}',failure['sqlstate']):safe['sqlstate']=failure['sqlstate']
   if integer(failure.get('errno'),1,4095):safe['errno']=failure['errno']
   location=failure.get('location')
   if type(location) is dict and type(location.get('file')) is str and location['file'] in {'session-run.py','session_contract.py','run.py','processes.py','owned_children.py','fixture.py','certs.py','contract.py'} and integer(location.get('line'),1,1000000):safe['location']={'file':location['file'],'line':location['line']}
   value['failure']=safe
  result['current_session_run']=value
 except Exception:pass
 try:
  report,_=read_member(directory,'current-session-results.json');value={}
  if type(report) is dict and report.get('contract')=='echs.c04.current-session-journal-http-actual.v1':
   if report.get('status') in {'RUNNING; NOT ACCEPTED','FAIL; NO ACCEPTANCE','ACTUAL CURRENT SESSION HTTPS POSTGREST SQL PASS'}:value['status']=report['status']
   if type(report.get('cleanup_complete')) is bool:value['cleanup_complete']=report['cleanup_complete']
   identifiers=['C'+str(index).zfill(2) for index in range(1,13)]
   def case_id(name):
    match=re.match(r'^(C\d{2})(?: |$)',name) if type(name) is str and len(name)<=4096 else None
    return match[1] if match and match[1] in identifiers else None
   checks=report.get('checks')
   if type(checks) is list and len(checks)<=12:
    names=[case_id(row.get('name')) if type(row) is dict and row.get('status')=='PASS' else None for row in checks]
    if names==identifiers[:len(names)]:value['completed_groups']=names
   failed=case_id(report.get('failed_group'))
   if failed is not None:value['failed_group']=failed
   elif report.get('failed_group')=='setup':value['failed_group']='setup'
   failure=report.get('failure')
   if type(failure) is dict:
    safe={'type':error_type(failure.get('type'))}
    if type(failure.get('stage')) is str and failure['stage'] in BROWSER_FAILURE_STAGES:safe['stage']=failure['stage']
    if type(failure.get('network_error')) is str and failure['network_error'] in BROWSER_NETWORK_ERRORS:safe['network_error']=failure['network_error']
    location=failure.get('location')
    if type(location) is dict and set(location)=={'file','line','column'} and type(location['file']) is str and location['file'] in {'test_current_session_http.mjs','current-session-cases.mjs'} and integer(location['line'],1,1000000) and integer(location['column'],1,1000000):safe['location']=location
    if type(failure.get('operator')) is str and failure['operator'] in {'strictEqual','deepStrictEqual','ok','equal','notStrictEqual'}:safe['operator']=failure['operator']
    for key in ('actual','expected'):
     if type(failure.get(key)) in (bool,int) and (type(failure[key]) is bool or -1000000<=failure[key]<=1000000):safe[key]=failure[key]
    value['failure']=safe
   result['current_session']=value
 except Exception:pass
 return result

def publish(directory,tests,repo,major,output):
 need(type(major) is int and major in (15,17),'matrix-major')
 temporary=Path(os.environ['RUNNER_TEMP']);target=contract.guarded_path(output,temporary)
 need(target.parent==contract.guarded_path(temporary,temporary) and target.name=='private-learning-current-session-journal-http-evidence-'+str(major) and not target.exists(),'fresh-current-evidence');target.mkdir(mode=0o700)
 pending=target/'artifact-index.pending'
 try:
  acceptance=assemble(directory,tests,repo,major);baseline=contract.sources(repo,True);session=session_contract.sources(repo,True);docs={};records=[]
  for name in ALL_NAMES:docs[name],row=read_member(directory,name);records.append(row)
  need(validate_documents(docs,records,baseline,session,major)==acceptance,'publish-current-revalidation')
  for row in records[:-1]:
   raw=bounded_bytes(contract.guarded_path(directory/row['path'],directory));need(len(raw)==row['bytes'] and digest(raw)==row['sha256'],'publish-current-byte-drift')
   with (target/row['path']).open('xb') as stream:stream.write(raw)
  need(contract.sources(repo,True)==baseline and session_contract.sources(repo,True)==session,'publish-current-source-after');validate_current_checkout(repo,docs['checkout.json'])
  for row in records[:-1]:need(read_member(target,row['path'])[1]==row,'publish-current-final-member')
  need({path.name for path in target.iterdir()}==set(ALL_NAMES[:-1]),'publish-current-before-index')
  row=records[-1];raw=bounded_bytes(contract.guarded_path(directory/row['path'],directory))
  need(len(raw)==row['bytes'] and digest(raw)==row['sha256'],'publish-current-final-index')
  # Stage and close the index before its atomic final publication. No check
  # that can fail follows this commit; failures beforehand cannot expose PASS.
  with pending.open('xb') as stream:stream.write(raw)
  need(bounded_bytes(pending)==raw,'publish-current-staged-index')
  pending.rename(target/'artifact-index.json')
  return acceptance
 except Exception as error:
  try:
   if pending.exists():contract.guarded_path(pending,target).unlink()
  except Exception:pass
  failure=failure_projection(directory,major,error)
  with (target/'failure.json').open('x',encoding='utf-8',newline='\n') as stream:json.dump(failure,stream,indent=2);stream.write('\n')
  return failure

if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--repo',type=Path,required=True);parser.add_argument('--postgres-major',type=int,choices=(15,17),required=True);parser.add_argument('--directory',type=Path,required=True);parser.add_argument('--tests',type=Path,required=True);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args()
 result=publish(args.directory,args.tests,args.repo,args.postgres_major,args.output);print(json.dumps(result));raise SystemExit(0 if result.get('status')=='PASS FOR ISOLATED CURRENT SESSION HTTPS SQL SCOPE' else 1)
