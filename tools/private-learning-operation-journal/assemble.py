"""Exact eight-member metadata artifact. Partial runs never become acceptance."""
import json,math,os,re
from pathlib import Path
from contract import HERE,INPUT_SHA,sources,snapshot,digest,checkout_sources,planned_labels,local_labels,actions_labels,reviewed

REPORTS={'checkout.json','input-pins.json','local-results.json','actions-results.json','acceptance.json','membership-baseline.json','archive-with-fence-and-journal.json'}
MEMBER_KEYS={'status','contract','production_calls','postgres_required','migration_count','migrations','checks','postgres_version','limits'}
ARCHIVE_KEYS=MEMBER_KEYS|{'connection_isolation_vectors','external_network'}
LOCAL_KEYS={'contract','status','checks','check_count','groups_run','skipped','failures','errors','database_executed','production_calls','source_unchanged','source_files'}
ACTIONS_KEYS={'contract','status','checks','check_count','database_executed','production_calls','source_unchanged','source_files'}
ACCEPTANCE_KEYS={'contract','status','source_files','migrations','checks','fence_checks','production_calls','database_executed','production_migration',
 'active_api','http_executed','owner_adoption_api','browser_bridge','grading_authoritative','checkout_report_sha256','tested_sha','tested_tree',
 'membership_baseline_checks','archive_baseline_checks','candidate_installation','postgres_version','journal_check_count','fence_check_count','details','reports'}
MEMBER_LIMITS=['Isolated PostgreSQL15 only; no production fixtures or data.',
 'Existing membership table grants and other membership-writing APIs are unchanged. New RPC atomicity does not assert control over a trusted direct service-role/database administrator.',
 'Historical same-org inactive student reports are preserved; roster mutations require an active class and active target accounts.']
ARCHIVE_LIMITS=['Synthetic Storage object rows prove namespace/receipt SQL only, not deployed bytes.',
 'No production tenant, import, assignment, private practice, publication or grading authorization was tested.']

def integer(value,expected):assert type(value) is int and value==expected

def source_map(value,expected):
    assert type(value) is dict and set(value)==set(expected)
    for name,row in value.items():
        assert type(row) is dict and set(row)=={'bytes','sha256'}
        integer(row['bytes'],expected[name]['bytes']);assert type(row['sha256']) is str and row['sha256']==expected[name]['sha256']

def decode(raw):
    assert type(raw) is bytes and 0<len(raw)<=2097152
    def pairs(items):
        out={}
        for key,value in items:assert key not in out;out[key]=value
        return out
    def invalid(_):raise AssertionError('Nonfinite metadata')
    value=json.loads(raw.decode('utf-8'),object_pairs_hook=pairs,parse_constant=invalid)
    stack=[(value,1)];remaining=50000
    while stack:
        node,depth=stack.pop();remaining-=1;assert remaining>=0 and depth<=24
        if type(node) is dict:
            assert not {k.lower() for k in node}&{'tokens','token','bytes_base64','dsn','password','service_key','service_role_key','access_token','p_token_hash','canonical_record_text','payload','response','private_notes'}
            stack.extend((v,depth+1) for v in node.values())
        elif type(node) is list:stack.extend((v,depth+1) for v in node)
        elif type(node) is str:assert '\0' not in node and len(node)<=20000
        else:
            assert node is None or type(node) in (bool,int,float)
            if type(node) is float:assert math.isfinite(node)
    return value

def actual_checks(document,expected,status):
    assert document['status']==status and type(document['checks']) is list and document['checks']==expected
    assert all(type(x) is str and 0<len(x)<=1000 for x in document['checks'])

def validate(parsed,raws,checkout_validator=checkout_sources):
    assert set(parsed)==set(raws)==REPORTS
    assert all(type(v) is dict for v in parsed.values())
    for name in REPORTS:assert decode(raws[name])==parsed[name]
    pins,migrations=sources();owned=snapshot();reference=reviewed()
    assert digest(raws['input-pins.json'])==INPUT_SHA and parsed['input-pins.json']==pins
    rows=[{'file':r['path'].split('/')[-1],'sha256':r['sha256']} for r in migrations]
    checkout=parsed['checkout.json'];checkout_validator(checkout)
    if os.environ.get('GITHUB_ACTIONS')=='true':assert checkout['tested_sha']==os.environ['GITHUB_SHA']
    local=parsed['local-results.json'];actions=parsed['actions-results.json']
    assert set(local)==LOCAL_KEYS and local['contract']=='echs.c04.journal-local-guards.v1'
    actual_checks(local,local_labels(),'LOCAL JOURNAL GUARDS PASS; POSTGRESQL NOT EXECUTED')
    integer(local['groups_run'],14);integer(local['check_count'],14);integer(local['failures'],0);integer(local['errors'],0)
    assert type(local['skipped']) is list and local['skipped']==[]
    assert set(actions)==ACTIONS_KEYS and actions['contract']=='echs.c04.journal-actions-guards.v1'
    actual_checks(actions,actions_labels(),'LOCAL JOURNAL ACTIONS GUARDS PASS; POSTGRESQL NOT EXECUTED')
    integer(actions['check_count'],len(actions_labels()))
    for report in (local,actions):
        assert report['database_executed'] is False and report['source_unchanged'] is True
        integer(report['production_calls'],0);source_map(report['source_files'],owned)
    member=parsed['membership-baseline.json'];archive=parsed['archive-with-fence-and-journal.json'];accepted=parsed['acceptance.json']
    assert set(member)==MEMBER_KEYS and member['contract']=='echs.membership-database-tests.v1'
    assert set(archive)==ARCHIVE_KEYS and archive['contract']=='echs.private-snapshot-database-test.v1'
    actual_checks(member,reference['checks']['membership-baseline.json'],'PASS')
    actual_checks(archive,reference['checks']['archive-with-fence-and-journal.json'],'PASS')
    assert len(member['checks'])==55 and len(archive['checks'])==222
    integer(member['postgres_required'],15);integer(archive['postgres_required'],15)
    integer(member['migration_count'],26);integer(archive['migration_count'],27)
    integer(member['production_calls'],0);assert archive['production_calls'] is False and archive['external_network'] is False
    integer(archive['connection_isolation_vectors'],16)
    assert member['migrations']==rows[:-1] and archive['migrations']==rows
    for report in (member,archive):
        assert type(report['limits']) is list and all(type(x) is str and 0<len(x)<=2000 for x in report['limits'])
        assert type(report['postgres_version']) is str and re.fullmatch(r'15\.[0-9]+(?: \([^\r\n]{1,180}\))?',report['postgres_version'])
    assert member['limits']==MEMBER_LIMITS and archive['limits']==ARCHIVE_LIMITS
    assert set(accepted)==ACCEPTANCE_KEYS and accepted['contract']=='echs.c04.operation-journal-acceptance.v1'
    actual_checks(accepted,planned_labels(),'ACTUAL POSTGRESQL JOURNAL PASS; NO ACTIVE API OR ADOPTION')
    assert accepted['fence_checks']==reference['checks']['fence'] and len(accepted['fence_checks'])==123
    integer(accepted['journal_check_count'],48);integer(accepted['fence_check_count'],123)
    integer(accepted['membership_baseline_checks'],55);integer(accepted['archive_baseline_checks'],222)
    assert accepted['migrations']==rows and accepted['postgres_version']==member['postgres_version']==archive['postgres_version']
    assert accepted['database_executed'] is True
    for key in ('production_migration','active_api','http_executed','owner_adoption_api','browser_bridge','grading_authoritative'):assert accepted[key] is False
    integer(accepted['production_calls'],0);source_map(accepted['source_files'],owned)
    assert accepted['checkout_report_sha256']==digest(raws['checkout.json'])
    assert accepted['tested_sha']==checkout['tested_sha'] and accepted['tested_tree']==checkout['tested_tree']
    install=accepted['candidate_installation']
    assert type(install) is dict and set(install)=={'after_migration','unchanged_fence_sha256','journal_sha256','existing_public_rows_preserved','existing_function_acl_rls_triggers_preserved','row_representation','initial_routes','initial_journal_owners'}
    assert install['after_migration']==rows[-1] and install['journal_sha256']==owned['operation-journal.sql']['sha256']
    assert install['unchanged_fence_sha256']==next(r['sha256'] for r in pins['files'] if r['path']=='tools/private-learning-owner-fence/owner-fence.sql')
    assert install['existing_public_rows_preserved'] is True and install['existing_function_acl_rls_triggers_preserved'] is True
    assert install['row_representation']=='postgres-jsonb-text-length-prefixed-v1'
    integer(install['initial_routes'],0);integer(install['initial_journal_owners'],0)
    details=accepted['details'];assert type(details) is dict and set(details)=={'executed_case_ids','deferred_case_ids','deferred_reason','network_scope'}
    assert details['executed_case_ids']==[x.split()[0] for x in planned_labels()] and details['deferred_case_ids']==['J049']
    assert details['deferred_reason']=='HTTP status/body/receipt and browser acknowledgement acceptance need the later transport; SQL does not claim those tests.'
    assert details['network_scope']=='guarded disposable PostgreSQL connections only; no production or Storage calls'
    reports=accepted['reports'];assert type(reports) is list and len(reports)==2
    assert {r['file'] for r in reports}=={'membership-baseline.json','archive-with-fence-and-journal.json'}
    for row in reports:
        assert type(row) is dict and set(row)=={'file','bytes','sha256'}
        integer(row['bytes'],len(raws[row['file']]));assert row['sha256']==digest(raws[row['file']])

def no_links(path):
    path=Path(os.path.abspath(path))
    for item in (path,*path.parents):
        assert not item.is_symlink() and not getattr(item,'is_junction',lambda:False)(),'Linked artifact component'
    return path

def write_exclusive(path,raw):
    no_links(path)
    with path.open('xb') as out:out.write(raw);out.flush();os.fsync(out.fileno())
    assert path.read_bytes()==raw,'Artifact copy differs'

def assemble(results,target,checkout_validator=checkout_sources):
    results=no_links(results);target=no_links(target)
    assert not target.exists(),'Artifact destination already exists'
    target.mkdir(parents=True)
    found={};captured={};parsed={};error=None;copied=[]
    try:
        before=snapshot()
        found={'checkout.json':results/'checkout.json','input-pins.json':HERE/'input-pins.json','local-results.json':results/'local-results.json','actions-results.json':results/'actions-results.json'}
        runs=list(results.glob('run-*'));assert len(runs)<=1
        if runs:
            run=no_links(runs[0]);assert run.is_dir() and re.fullmatch('run-[0-9a-f]{32}',run.name)
            found.update({name:run/name for name in ('acceptance.json','membership-baseline.json','archive-with-fence-and-journal.json')})
        for name,path in sorted(found.items()):
            no_links(path)
            if not path.exists():continue
            assert path.is_file();raw=path.read_bytes();value=decode(raw)
            if name=='input-pins.json':assert digest(raw)==INPUT_SHA,'Input provenance differs'
            captured[name]=raw;parsed[name]=value
            write_exclusive(target/name,raw)
            copied.append({'file':name,'bytes':len(raw),'sha256':digest(raw)})
        validate(parsed,captured,checkout_validator)
        assert snapshot()==before,'Sources changed while copying'
        assert {p.name for p in target.iterdir()}==REPORTS
        for name,path in found.items():
            no_links(path);assert path.read_bytes()==captured[name],'Report changed while copying'
        final_raw={name:(target/name).read_bytes() for name in REPORTS}
        assert final_raw==captured
        validate({name:decode(raw) for name,raw in final_raw.items()},final_raw,checkout_validator)
        assert snapshot()==before,'Final source recheck failed'
    except Exception as failure:error=type(failure).__name__
    complete=error is None
    index={'contract':'echs.c04.operation-journal-artifact.v1','status':'ACTUAL JOURNAL SQL PASS; NO ACTIVE API OR ADOPTION' if complete else 'INCOMPLETE OR FAILED; NO ACCEPTANCE',
        'complete':complete,'files':copied,'expected_reports':sorted(REPORTS),'actual_counts':{'membership':55,'archive':222,'owner_fence':123,'journal':48,'total':448} if complete else None,
        'local_counts':{'source_guards':14,'actions_guards':len(actions_labels())} if complete else None,
        'tested_sha':parsed['checkout.json']['tested_sha'] if complete else None,'tested_tree':parsed['checkout.json']['tested_tree'] if complete else None,
        'checkout_report_sha256':digest(captured['checkout.json']) if complete else None,'database_accepted':complete,
        'production_migration':False,'active_api':False,'owner_adoption_api':False,'http_executed':False,'browser_bridge':False,'grading_authoritative':False,'production_calls':0}
    if error:index['failure_type']=error
    raw=(json.dumps(index,indent=2)+'\n').encode('utf-8');path=target/'artifact-index.json';created=False
    try:
        no_links(path)
        with path.open('xb') as out:
            created=True;out.write(raw);out.flush();os.fsync(out.fileno())
        assert path.read_bytes()==raw,'Index write differs'
        names={p.name for p in target.iterdir()}
        assert names==REPORTS|{'artifact-index.json'} if complete else names<=REPORTS|{'artifact-index.json'}
        for name in names:no_links(target/name);assert (target/name).is_file()
        if complete:
            assert snapshot()==before,'Sources changed at index write'
            final_raw={name:(target/name).read_bytes() for name in REPORTS};assert final_raw==captured
            for name,original in found.items():no_links(original);assert original.read_bytes()==captured[name]
            validate({name:decode(data) for name,data in final_raw.items()},final_raw,checkout_validator)
            assert snapshot()==before,'Final source recheck failed'
        assert decode(path.read_bytes())==index and path.read_bytes()==raw
    except BaseException:
        if created and path.exists() and not path.is_symlink():path.unlink()
        raise
    return index

def main():
    result=assemble(HERE/'results',Path(os.environ['RUNNER_TEMP'])/'private-learning-operation-journal-evidence')
    print(json.dumps({'status':result['status'],'complete':result['complete']}))
    if not result['complete']:raise SystemExit(1)

if __name__=='__main__':main()
