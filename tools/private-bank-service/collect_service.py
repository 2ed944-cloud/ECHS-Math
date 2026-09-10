"""Closed local actual-service evidence collector; no network or process execution.

Runner receipts are execution claims from that pinned process. Acceptance as
GitHub CI additionally needs independently verified job/head/tree/artifact metadata.
"""
from pathlib import Path
import argparse
import json
import re
from service_contract import HERE,IMAGE_TAGS,RUNTIME_HASHES,PIN_SHA256,UPSTREAM_COMMIT,ContractError,closed,digest,exact,need,strict_json,validate_image_receipt
from run_actual_service import SOURCE_FILES,verify_manifest,validate_network_receipt

RAW_FILES=('service-run-report.json','service-test-results.json','image-receipt.json')

def read(path):
    raw=Path(path).read_bytes();return raw,strict_json(raw)

def accept(directory,expected_head,expected_tree,manifest_hash):
    directory=Path(directory).absolute()
    need(directory.parent==HERE/'runs' and re.fullmatch('[0-9a-f]{32}',directory.name),'run-directory')
    for p in (directory,*directory.parents):need(not p.is_symlink() and not p.is_junction(),'linked-evidence')
    need(not (directory/'secrets').exists(),'private-configuration-still-present')
    manifest_raw=(HERE/'source-manifest.json').read_bytes();manifest=verify_manifest(manifest_raw,manifest_hash)
    raw={};data={}
    for name in RAW_FILES:
        p=directory/name;need(p.is_file() and not p.is_symlink() and not p.is_junction(),'missing-evidence')
        raw[name],data[name]=read(p)
    run=data['service-run-report.json'];tests=data['service-test-results.json'];images=data['image-receipt.json']
    closed(run,('contract','status','run_id','head','tree','source_manifest_sha256','source_pins_sha256','migration_files','image_receipt_sha256',
        'running_image_ids','managed_schema_probed','migrations_applied','tls','services_executed','hosted_edge_executed','corpus_imported',
        'tool_versions','service_start_attempted','failure','cleanup_complete','network'))
    need(run['contract']=='echs.c08.storage-service-run.v1' and run['status']=='PASS' and run['run_id']==directory.name,'runner-contract')
    need(run['failure'] is None,'runner-failure')
    validate_network_receipt(run['network'],run['run_id'])
    for key in ('managed_schema_probed','services_executed','service_start_attempted','cleanup_complete'):need(run[key] is True,'runner-true-flag')
    for key in ('hosted_edge_executed','corpus_imported'):need(run[key] is False,'runner-false-flag')
    need(type(run['migrations_applied']) is int and run['migrations_applied']==27,'migration-count')
    pins=strict_json((HERE/'source-pins.json').read_bytes())
    need(run['source_pins_sha256']==PIN_SHA256 and exact(run['migration_files'],pins['migrations']),'migration-source-binding')
    for obj in (run,tests):
        need(obj['head']==expected_head and obj['tree']==expected_tree and obj['source_manifest_sha256']==manifest_hash,'checkout-binding')
    need(re.fullmatch('[0-9a-f]{40}',expected_head) and re.fullmatch('[0-9a-f]{40}',expected_tree),'checkout-shape')
    validate_image_receipt(raw['image-receipt.json'],run['image_receipt_sha256'])
    need(images['upstream_commit']==UPSTREAM_COMMIT and exact(run['running_image_ids'],{r['service']:r['config_digest'] for r in images['images']}),'running-images')
    closed(run['tls'],('hostname','ca_fingerprint_sha256','leaf_fingerprint_sha256'))
    need(run['tls']['hostname']=='echsc08servicetest.supabase.co','tls-hostname')
    for field in ('ca_fingerprint_sha256','leaf_fingerprint_sha256'):need(type(run['tls'][field]) is str and re.fullmatch('[0-9a-f]{64}',run['tls'][field]),'tls-fingerprint')
    versions=run['tool_versions'];closed(versions,('python','node','docker','compose','cryptography','psycopg'))
    for field,value in versions.items():need(type(value) is str and re.fullmatch(r'v?[0-9]+\.[0-9]+\.[0-9]+(?:[a-z0-9.+-]{0,32})?',value),'tool-version')
    need(versions['cryptography']=='50.0.1' and versions['psycopg']=='3.2.9','dependency-version')
    closed(tests,('contract','status','passed','total','groups','head','tree','source_manifest_sha256','services_executed','actual_postgrest',
        'actual_storage','actual_managed_postgres','verified_tls','synthetic_only','production_calls','hosted_edge_executed','runtime_sha256',
        'explicit_fault_cases','opaque_mime_fixtures_not_decoder_tests','storage_metadata_dml','control_error','gateway_counts','readiness'))
    need(tests['contract']=='echs.c08.actual-storage-service-tests.v1' and tests['status']=='PASS','service-test-contract')
    for key in ('services_executed','actual_postgrest','actual_storage','actual_managed_postgres','verified_tls','synthetic_only','opaque_mime_fixtures_not_decoder_tests'):
        need(tests[key] is True,'service-true-flag')
    for key in ('production_calls','hosted_edge_executed','storage_metadata_dml','control_error'):need(tests[key] is False,'service-false-flag')
    readiness=tests['readiness'];closed(readiness,('status','probes','elapsed_ms'))
    need(readiness['status']=='PASS' and type(readiness['probes']) is int and 1<=readiness['probes']<=41
         and type(readiness['elapsed_ms']) is int and 0<=readiness['elapsed_ms']<=21000,'schema-cache-readiness')
    names=strict_json((HERE/'service-cases.json').read_bytes())
    need(len(names)==19 and type(tests['total']) is int and tests['total']==19 and type(tests['passed']) is int and tests['passed']==19,'case-count')
    need(type(tests['groups']) is list and len(tests['groups'])==19,'case-count')
    for row,name in zip(tests['groups'],names):
        closed(row,('name','status','elapsed_ms'));need(row['name']==name and row['status']=='PASS','case-result')
        need(type(row['elapsed_ms']) is int and 0<=row['elapsed_ms']<=900000,'case-time')
    need(exact(tests['runtime_sha256'],RUNTIME_HASHES),'runtime-source')
    need(exact(tests['explicit_fault_cases'],[names[i] for i in (8,9,10,11)]),'fault-case-scope')
    counts=tests['gateway_counts'];closed(counts,('rest_requests','storage_requests','denied','upstream_errors','request_bytes','response_bytes'))
    need(all(type(v) is int and 0<=v<2**40 for v in counts.values()) and counts['rest_requests']>0 and counts['storage_requests']>0,'socket-counters')
    index={'contract':'echs.c08.actual-storage-service-index.v1','status':'LOCAL_EXECUTION_RECEIPTS_ACCEPTED',
        'github_ci_accepted':False,'head':expected_head,'tree':expected_tree,'source_manifest_sha256':manifest_hash,
        'source_files':len(manifest['files']),'raw_files':[{'file':name,'bytes':len(raw[name]),'sha256':digest(raw[name])} for name in RAW_FILES],
        'service_groups':19,'actual_managed_migrations':27,'services':list(IMAGE_TAGS),'synthetic_only':True,'hosted_edge_executed':False,
        'corpus_imported':False,'whole_c08_complete':False,'requires_independent_workflow_metadata':True}
    return index,raw,manifest_raw

def collect(directory,destination,head,tree,manifest_hash):
    destination=Path(destination).absolute()
    need(destination.parent==HERE/'results' and re.fullmatch('[a-z0-9][a-z0-9_-]{0,80}',destination.name),'artifact-directory')
    need(not destination.exists(),'artifact-exists')
    for p in (destination,*destination.parents):need(not p.is_symlink() and not p.is_junction(),'linked-artifact')
    index,raw,manifest_raw=accept(directory,head,tree,manifest_hash)
    # Revalidate every byte immediately before exclusive creation and after copy.
    again=accept(directory,head,tree,manifest_hash);need(exact(index,again[0]) and raw==again[1] and manifest_raw==again[2],'evidence-changed')
    destination.mkdir();members={**raw,'source-manifest.json':manifest_raw,'service-evidence-index.json':(json.dumps(index,indent=2)+'\n').encode()}
    for name,value in members.items():
        with (destination/name).open('xb') as f:f.write(value)
    need({p.name for p in destination.iterdir()}==set(members),'artifact-members')
    for name,value in members.items():need((destination/name).read_bytes()==value,'artifact-copy')
    need(accept(directory,head,tree,manifest_hash)[1]==raw,'evidence-changed')
    return index

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--run-dir',type=Path,required=True)
    parser.add_argument('--destination',type=Path,required=True);parser.add_argument('--head',required=True);parser.add_argument('--tree',required=True)
    parser.add_argument('--source-manifest-sha256',required=True);args=parser.parse_args()
    try:
        index=collect(args.run_dir,args.destination,args.head,args.tree,args.source_manifest_sha256)
        print(json.dumps({'status':index['status'],'raw_files':3,'artifact_members':5,'service_groups':19,'github_ci_accepted':False}));return 0
    except ContractError as error:
        print(json.dumps({'status':'REJECTED','code':error.code}));return 1

if __name__=='__main__':raise SystemExit(main())
