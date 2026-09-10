"""Validate charter scope/evidence/dependency integrity; does not certify production."""
from pathlib import Path, PurePosixPath
import argparse
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / 'docs/codex/MASTER_EXECUTION_PLAN.json'
STATES = {'PLANNED','IN PROGRESS','IMPLEMENTED','TESTED','DEPLOYED','VERIFIED','BLOCKED'}
HEX40 = re.compile(r'^[0-9a-f]{40}$')
HEX64 = re.compile(r'^[0-9a-f]{64}$')

def load(path=PLAN):
    return json.loads(Path(path).read_text(encoding='utf-8'))

def safe_path(value):
    return (isinstance(value,str) and bool(value) and not value.startswith('/')
        and '\\' not in value and ':' not in value
        and not any(p in ('','.','..') for p in value.split('/'))
        and not PurePosixPath(value).is_absolute())

def validate(plan, root=ROOT):
    errors=[]
    def need(condition,message):
        if not condition: errors.append(message)
    need(plan.get('schema_version')=='echs.master-execution-plan.v1','schema version')
    tasks=plan.get('tasks',[])
    need(isinstance(tasks,list) and bool(tasks),'tasks required')
    ids=[t.get('id') for t in tasks]
    need(len(set(ids))==len(ids),'duplicate task ID')
    by_id={t.get('id'):t for t in tasks}
    contracts=plan.get('shared_acceptance_contracts',{})
    need(bool(contracts) and all(isinstance(v,list) and v for v in contracts.values()),'shared acceptance contracts')
    for t in tasks:
        id=t.get('id','')
        need(bool(re.fullmatch(r'ECHS-(?:C\d{2}|\d{3})',id)),f'{id}: invalid ID')
        need(t.get('status') in STATES,f'{id}: status')
        for key in ['title','phase','acceptance_criteria','implementation_location','rollback','shared_acceptance_contracts']:
            need(bool(t.get(key)),f'{id}: missing {key}')
        need(isinstance(t.get('known_limits'),list),f'{id}: known limits required')
        deps=t.get('depends_on',[])
        need(isinstance(deps,list) and len(set(deps))==len(deps),f'{id}: duplicate dependency')
        need(all(d in by_id and d!=id for d in deps),f'{id}: unknown/self dependency')
        need(t.get('next_dependency')==[x['id'] for x in tasks if id in x.get('depends_on',[])],f'{id}: reverse dependency drift')
        need(all(c in contracts for c in t.get('shared_acceptance_contracts',[])),f'{id}: unknown shared contract')
        for entry in t.get('implementation_location',[]):
            p=entry.get('path')
            need(safe_path(p),f'{id}: unsafe implementation path')
            need(entry.get('state') in ('existing','planned'),f'{id}: location state')
            if safe_path(p) and entry.get('state')=='existing':
                need((root/p).exists(),f'{id}: existing path missing: {p}')
        test=t.get('tests',{}); deployment=t.get('deployment',{})
        need(test.get('status') in ('NOT_RUN','PASS','FAIL','PARTIAL'),f'{id}: test status')
        need(isinstance(test.get('evidence'),list),f'{id}: test evidence list')
        need(deployment.get('status') in ('NOT_DEPLOYED','DEPLOYED','VERIFIED'),f'{id}: deployment status')
        if test.get('status')=='PASS':
            need(bool(test.get('evidence')),f'{id}: passing tests need evidence')
        if t.get('status') in ('TESTED','DEPLOYED','VERIFIED'):
            need(test.get('status')=='PASS',f'{id}: claimed status needs passing tests')
        if t.get('status')=='VERIFIED':
            need(deployment.get('status')=='VERIFIED',f'{id}: verified deployment required')
            need(bool(HEX40.fullmatch(deployment.get('verified_at_main',''))),f'{id}: verified revision required')
            need(bool(deployment.get('evidence')),f'{id}: deployment evidence required')
            need(all(by_id.get(d,{}).get('status')=='VERIFIED' for d in deps),f'{id}: unverified dependency')
        for evidence in test.get('evidence',[])+deployment.get('evidence',[]):
            need(isinstance(evidence,dict) and bool(evidence.get('kind')),f'{id}: evidence kind')
            p=evidence.get('path')
            if p:
                need(safe_path(p) and (root/p).is_file(),f'{id}: evidence path')
            url=evidence.get('url')
            if url:
                need(url.startswith('https://github.com/2ed944-cloud/ECHS-Math/'),f'{id}: evidence repository')
    active=set(); visited=set()
    def walk(id):
        if id in active:
            errors.append(f'{id}: dependency cycle'); return
        if id in visited or id not in by_id: return
        active.add(id)
        for d in by_id[id].get('depends_on',[]): walk(d)
        active.remove(id); visited.add(id)
    for id in ids: walk(id)
    # The final gate must depend on every work item, not merely list its section.
    reached=set()
    def closure(id):
        if id in reached or id not in by_id:return
        reached.add(id)
        for d in by_id[id].get('depends_on',[]): closure(d)
    closure('ECHS-062')
    need(reached==set(ids),'final acceptance omits tasks: '+', '.join(sorted(set(ids)-reached)))
    charter=plan.get('charter',{})
    if safe_path(charter.get('path')) and (root/charter['path']).is_file():
        raw=(root/charter['path']).read_bytes()
        need(hashlib.sha256(raw).hexdigest()==charter.get('sha256'),'charter hash mismatch')
        sections={int(n):title.strip() for n,title in re.findall(r'^# (\d+)\. (.+)$',raw.decode('utf-8'),re.M)}
        coverage=plan.get('charter_coverage',[])
        need(len(coverage)==len(sections) and {r.get('section') for r in coverage}==set(sections),'charter coverage incomplete')
        for r in coverage:
            n=r.get('section')
            need(r.get('title')==sections.get(n),f'section {n}: title drift')
            need(bool(r.get('tasks')) and r['tasks']==[t['id'] for t in tasks if n in t.get('charter_sections',[])],f'section {n}: missing/incorrect task mapping')
        need(all(set(t.get('charter_sections',[]))<=set(sections) for t in tasks),'invented charter section')
    else: errors.append('charter file missing/unsafe')
    families=plan.get('component_families',[])
    need(len(families)==26 and {r.get('family') for r in families}==set(range(1,27)),'26 component families required')
    for f in families:
        need(bool(f.get('tasks')) and all(id in by_id for id in f['tasks']),'family task mapping')
        if f.get('status')=='VERIFIED':
            need(all(by_id.get(id,{}).get('status')=='VERIFIED' for id in f.get('tasks',[])),'unverified component family')
    baseline=plan.get('production_baseline',{})
    need(bool(HEX40.fullmatch(baseline.get('main_sha',''))) and bool(HEX40.fullmatch(baseline.get('tree_sha',''))),'production baseline identity')
    need(baseline.get('local_git_head_is_production_evidence') is False,'local checkout is not deployed evidence')
    source_path=root/'docs/codex/MASTER_SOURCE_BASELINE_20260909.json'
    if source_path.is_file():
        source=load(source_path); rows=source.get('files',[])
        need(source.get('main_sha')==baseline.get('main_sha'),'source baseline main drift')
        need(len(rows)==baseline.get('source_files_verified') and len({r.get('path') for r in rows})==len(rows),'source baseline count/duplicates')
        for r in rows:
            need(safe_path(r.get('path')) and bool(HEX40.fullmatch(r.get('git_blob_sha',''))) and bool(HEX64.fullmatch(r.get('sha256',''))) and isinstance(r.get('bytes'),int) and r['bytes']>=0,'invalid source hash record')
    else:errors.append('source baseline missing')
    for risk in plan.get('unresolved_risks',[]):
        need(risk.get('owner_task') in by_id,'risk owner missing')
    latest=plan.get('last_verified_release')
    if latest is not None:
        task=by_id.get(latest.get('task'),{})
        need(task.get('status')=='VERIFIED','latest release task is not verified')
        need(bool(HEX40.fullmatch(latest.get('main_sha',''))) and latest.get('main_sha')==task.get('deployment',{}).get('verified_at_main'),'latest release revision mismatch')
        need(bool(HEX40.fullmatch(latest.get('tree_sha',''))),'latest release tree identity')
        p=latest.get('evidence')
        need(safe_path(p) and (root/p).is_file(),'latest release evidence missing')
        if safe_path(p) and (root/p).is_file():
            receipt=load(root/p)
            need(receipt.get('status')=='VERIFIED' and receipt.get('main_sha')==latest.get('main_sha') and receipt.get('tree_sha')==latest.get('tree_sha'),'latest release evidence identity mismatch')
    foundation=plan.get('last_verified_foundation_slice')
    if foundation is not None:
        id=foundation.get('task'); task=by_id.get(id,{})
        need(id in ('ECHS-C04','ECHS-C08'),'unsupported foundation task')
        need(task.get('status')=='IN PROGRESS' and task.get('tests',{}).get('status')=='PARTIAL','foundation does not complete the whole task')
        deployment=task.get('deployment',{})
        need(deployment.get('status')=='DEPLOYED' and bool(deployment.get('scope')),'foundation deployed scope required')
        need(bool(HEX40.fullmatch(foundation.get('main_sha',''))) and foundation.get('main_sha')==deployment.get('deployed_at_main'),'foundation deployment revision mismatch')
        need(bool(HEX40.fullmatch(foundation.get('tree_sha',''))),'foundation tree identity')
        p=foundation.get('evidence')
        need(safe_path(p) and (root/p).is_file(),'foundation receipt missing')
        if safe_path(p) and (root/p).is_file():
            receipt=load(root/p)
            key='whole_'+str(id).removeprefix('ECHS-').lower()+'_status'
            need(receipt.get('status')=='FOUNDATION VERIFIED' and receipt.get(key)=='IN PROGRESS' and receipt.get('whole_program_complete') is False,'foundation receipt scope mismatch')
            need(receipt.get('main_sha')==foundation.get('main_sha') and receipt.get('tree_sha')==foundation.get('tree_sha'),'foundation receipt identity mismatch')
            need(bool(HEX64.fullmatch(receipt.get('source_manifest_sha256',''))),'foundation source manifest required')
    if plan.get('whole_program_complete') is True:
        need(all(t.get('status')=='VERIFIED' for t in tasks),'whole program has unverified tasks')
        need(all(f.get('status')=='VERIFIED' for f in families),'whole program has unverified components')
        need(not plan.get('unresolved_risks'),'whole program has unresolved risks')
    else:need(plan.get('whole_program_complete') is False,'explicit overall completion status')
    return errors

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--plan',type=Path,default=PLAN)
    args=parser.parse_args()
    errors=validate(load(args.plan))
    if errors:
        print('\n'.join('FAIL '+error for error in errors));return 1
    print('PASS master execution plan: dependencies, source identity, evidence claims and charter coverage')
    return 0

if __name__=='__main__':raise SystemExit(main())
