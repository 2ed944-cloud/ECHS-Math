"""Closed metadata evidence. A failed run always remains failed."""
import json,math,os,re
from pathlib import Path
from contract import HERE,sources,digest,checkout_sources,expected_labels
from run_integration import source_snapshot

REPORTS={'checkout.json','input-pins.json','local-results.json','actions-results.json','acceptance.json','membership-baseline.json','archive-with-fence.json'}
MEMBER_DUPLICATES={'invalid null/overlapping member arrays rejected atomically':4}
ARCHIVE_DUPLICATES={'capability rejects RLS/grant/trigger/bucket drift: alter':2,'capability rejects RLS/grant/trigger/bucket drift: grant':2,
    'closed snapshot payload rejects malformed/client scope':6,'current account/session cannot be stale':3,'caller cannot spoof file readiness/profile/path/type':6}

def decode(raw):
    assert 0<len(raw)<=2097152
    def pairs(items):
        result={}
        for key,value in items:assert key not in result;result[key]=value
        return result
    def invalid(_):raise AssertionError('Nonfinite metadata')
    value=json.loads(raw.decode('utf-8'),object_pairs_hook=pairs,parse_constant=invalid)
    remaining=[50000]
    def clean(node):
        remaining[0]-=1;assert remaining[0]>=0
        if isinstance(node,dict):
            assert not {k.lower() for k in node}&{'tokens','token','bytes_base64','dsn','password','service_key','service_role_key','access_token','p_token_hash','canonical_record_text','payload','response','private_notes'}
            for child in node.values():clean(child)
        elif isinstance(node,list):
            for child in node:clean(child)
        elif isinstance(node,str):assert '\0' not in node and len(node)<=20000
        else:
            assert node is None or type(node) in (bool,int,float)
            if type(node) is float:assert math.isfinite(node)
    clean(value);return value

def checks(document,count,status,duplicates=None):
    labels=document.get('checks');assert document.get('status')==status
    assert isinstance(labels,list) and len(labels)==count and all(isinstance(v,str) and 0<len(v)<=1000 for v in labels)
    assert {s:labels.count(s) for s in set(labels) if labels.count(s)>1}==(duplicates or {})

def validate(parsed,raw,checkout_validator=checkout_sources):
    assert set(parsed)==set(raw)==REPORTS
    pins,migrations=sources();rows=[{'file':r['path'].split('/')[-1],'sha256':r['sha256']} for r in migrations]
    checkout=parsed['checkout.json'];acceptance=parsed['acceptance.json'];owned=source_snapshot()
    assert parsed['input-pins.json']==pins and raw['input-pins.json']==(HERE/'input-pins.json').read_bytes()
    checkout_validator(checkout)
    if os.environ.get('GITHUB_ACTIONS')=='true':assert checkout['tested_sha']==os.environ['GITHUB_SHA']
    local=parsed['local-results.json'];actions=parsed['actions-results.json']
    checks(local,6,'LOCAL HARNESS GUARDS PASS; POSTGRESQL NOT EXECUTED')
    checks(actions,10,'LOCAL ACTIONS GUARDS PASS; POSTGRESQL NOT EXECUTED')
    for report,count in ((local,6),(actions,10)):
        assert type(report['check_count']) is int and report['check_count']==count
        assert report['database_executed'] is False and type(report['production_calls']) is int and report['production_calls']==0
        assert report['source_files']==owned
    member=parsed['membership-baseline.json'];archive=parsed['archive-with-fence.json']
    checks(member,55,'PASS',MEMBER_DUPLICATES);checks(archive,222,'PASS',ARCHIVE_DUPLICATES)
    assert member['migrations']==rows[:-1] and archive['migrations']==rows and acceptance['migrations']==rows
    assert type(member['migration_count']) is int and member['migration_count']==26
    assert type(archive['migration_count']) is int and archive['migration_count']==27
    assert type(member['production_calls']) is int and member['production_calls']==0 and archive['production_calls'] is False and archive['external_network'] is False
    checks(acceptance,len(expected_labels()),'ACTUAL POSTGRESQL OWNER FENCE PASS; HTTP AND ADOPTION API NOT IMPLEMENTED')
    assert acceptance['checks']==expected_labels() and type(acceptance['check_count']) is int and acceptance['check_count']==len(expected_labels())
    assert acceptance['database_executed'] is True and acceptance['real_storage_executed'] is False and acceptance['http_executed'] is False and acceptance['owner_adoption_api'] is False
    assert type(acceptance['production_calls']) is int and acceptance['production_calls']==0
    assert acceptance['source_files']==owned and acceptance['checkout_report_sha256']==digest(raw['checkout.json'])
    assert acceptance['tested_sha']==checkout['tested_sha'] and acceptance['tested_tree']==checkout['tested_tree']
    assert type(acceptance['membership_baseline_checks']) is int and acceptance['membership_baseline_checks']==55
    assert type(acceptance['archive_baseline_checks']) is int and acceptance['archive_baseline_checks']==222
    install=acceptance['candidate_installation']
    assert install['after_migration']==rows[-1] and install['candidate_sha256']==owned['owner-fence.sql']['sha256'] and install['existing_objects_preserved'] is True
    for key in ('public_table_count','old_function_count','old_trigger_count'):assert type(install[key]) is int and 1<=install[key]<=10000
    reports=acceptance['reports'];assert len(reports)==2 and {r['file'] for r in reports}=={'membership-baseline.json','archive-with-fence.json'}
    for row in reports:
        assert set(row)=={'file','bytes','sha256'} and type(row['bytes']) is int
        assert row['bytes']==len(raw[row['file']]) and row['sha256']==digest(raw[row['file']])

def assemble(results,target):
    assert not target.exists();target.mkdir(parents=True)
    copied=[];parsed={};raws={};error=None
    try:
        found={'checkout.json':results/'checkout.json','input-pins.json':HERE/'input-pins.json','local-results.json':results/'local-results.json','actions-results.json':results/'actions-results.json'}
        runs=list(results.glob('run-*'));assert len(runs)<=1
        if runs:
            assert runs[0].is_dir() and not runs[0].is_symlink() and re.fullmatch('run-[0-9a-f]{32}',runs[0].name)
            found.update({name:runs[0]/name for name in ['acceptance.json','membership-baseline.json','archive-with-fence.json']})
        for name,path in sorted(found.items()):
            if not path.exists():continue
            assert path.is_file() and not path.is_symlink()
            raw=path.read_bytes();parsed[name]=decode(raw);raws[name]=raw
            with (target/name).open('xb') as output:output.write(raw)
            copied.append({'file':name,'bytes':len(raw),'sha256':digest(raw)})
        validate(parsed,raws)
    except Exception as failure:error=type(failure).__name__
    complete=error is None
    index={'contract':'echs.c04.owner-fence-artifact.v1','status':'ACTUAL OWNER-FENCE SQL PASS; NO ADOPTION API' if complete else 'INCOMPLETE OR FAILED; NO ACCEPTANCE',
           'complete':complete,'files':copied,'expected_reports':sorted(REPORTS),'actual_counts':{'membership':55,'archive':222,'owner_fence':len(expected_labels())} if complete else None,
           'database_accepted':complete,'production_migration':False,'owner_adoption_api':False,'http_executed':False,'production_calls':0}
    if error:index['failure_type']=error
    with (target/'artifact-index.json').open('x',encoding='utf-8') as output:output.write(json.dumps(index,indent=2)+'\n')
    assert {p.name for p in target.iterdir()}<=REPORTS|{'artifact-index.json'}
    return index

def main():
    target=Path(os.environ['RUNNER_TEMP'])/'private-learning-owner-fence-evidence'
    result=assemble(HERE/'results',target)
    print(json.dumps({'status':result['status'],'complete':result['complete']}))
    if not result['complete']:raise SystemExit(1)

if __name__=='__main__':main()
