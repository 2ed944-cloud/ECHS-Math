"""Bind disposable service execution to the exact reviewed Git checkout.

Only closed metadata is exported. A local collector result is not independent
GitHub job/artifact verification, and this fixture never imports a real corpus.
"""
from pathlib import Path
import argparse
import hashlib
import json
import os
import re
import subprocess
from service_contract import HERE, ContractError, closed, digest, exact, local_file, need, strict_json, verify_sources, postgres_major
from run_actual_service import SOURCE_FILES, verify_manifest, validate_child_failure
from seed_synthetic import load_fixture
from collect_service import collect

BASE = '20e470daa986cae9c4e260e0c90eb3f700131a60'
BASE_TREE = '50f16f647881f3e23edc6a51eebf0db447635636'
PREFIX = 'tools/private-bank-service/'
WORKFLOW = '.github/workflows/private-bank-service-integration.yml'
WRAPPER_FILES = ('ci.py', 'test_ci.py', 'ci-expected-groups.json', 'UPSTREAM_LICENSE.txt', 'UPSTREAM_NOTICE.md')
OWN = tuple(sorted([PREFIX + p for p in (*SOURCE_FILES, 'source-manifest.json', *WRAPPER_FILES)] + [WORKFLOW]))
OFFLINE = ('safety.json', 'tls.json', 'actual-contract.json', 'ci-contract.json')
SHA40 = re.compile('[0-9a-f]{40}')
SHA64 = re.compile('[0-9a-f]{64}')


def encode(value):
    return (json.dumps(value, indent=2, allow_nan=False) + '\n').encode()


def write(path, value):
    with Path(path).open('xb') as handle:
        handle.write(encode(value))


def git(root, *args):
    return subprocess.check_output(['git', '-C', str(root), *args], text=True).strip()


def checkout_policy(head,tree,event_name,event,environment_sha,read_git):
    valid=lambda value:type(value) is str and SHA40.fullmatch(value) and value!='0'*40
    need(valid(head) and head==environment_sha,'checkout-head')
    need(valid(tree) and read_git('rev-parse','HEAD')==head and read_git('rev-parse','HEAD^{tree}')==tree,'checkout-tree')
    need(read_git('rev-parse',BASE+'^{tree}')==BASE_TREE,'source-baseline-tree')
    need(read_git('merge-base',BASE,head)==BASE,'source-baseline-ancestry')
    parents=read_git('rev-list','--parents','-n','1','HEAD').split()[1:]
    need(type(parents) is list and 1<=len(parents)<=2 and all(valid(p) for p in parents),'checkout-parents')
    pr_head=pr_number=None
    if event_name=='pull_request':
        pr=event['pull_request'];pr_head=pr['head']['sha'];pr_number=event['number'];base=pr['base']['sha']
        need(valid(base) and valid(pr_head) and type(pr_number) is int and pr_number>0 and parents==[base,pr_head],'checkout-pull-request')
        need(pr['head']['repo']['full_name']==pr['base']['repo']['full_name']=='2ed944-cloud/ECHS-Math','checkout-repository')
        need(read_git('rev-parse',pr_head)==pr_head,'checkout-pr-head')
    else:
        need(event_name=='workflow_dispatch','checkout-event');base=parents[0]
    base_tree=read_git('rev-parse',base+'^{tree}');need(valid(base_tree),'checkout-base-tree')
    changed=read_git('diff','--name-only',base,head).splitlines()
    need(type(changed) is list and len(changed)<=10000 and len(set(changed))==len(changed),'checkout-diff')
    need(all(type(p) is str and re.fullmatch(r'[A-Za-z0-9._ /()-]{1,500}',p) and not p.startswith('/') and '..' not in p.split('/') for p in changed),'checkout-diff')
    return {'event':event_name,'head':head,'tree':tree,'parents':parents,'base':base,'base_tree':base_tree,
        'pr_head':pr_head,'pr_number':pr_number,'changed_paths':changed,'source_baseline':{'sha':BASE,'tree':BASE_TREE}}


def inputs(root, manifest_hash):
    verify_sources(root, HERE/'runtime')
    load_fixture(root)
    verify_manifest(local_file(HERE, 'source-manifest.json'), manifest_hash)
    pins = strict_json(local_file(HERE, 'source-pins.json'))
    dependencies = [row['path'] for row in pins['migrations']] + ['tools/private_snapshot_fixture.py']
    names = sorted(set(OWN) | set(dependencies))
    need(len(OWN) == 29 and len(dependencies) == 28 and len(names) == 57, 'source-closure')
    return names


def snapshot(root, manifest_hash,expected_major=15):
    major=postgres_major(expected_major)
    names = inputs(root, manifest_hash)
    head = git(root, 'rev-parse', 'HEAD')
    tree = git(root, 'rev-parse', 'HEAD^{tree}')
    need(os.environ['GITHUB_REPOSITORY']=='2ed944-cloud/ECHS-Math','checkout-repository')
    event_name=os.environ['GITHUB_EVENT_NAME'];event=strict_json(Path(os.environ['GITHUB_EVENT_PATH']).read_bytes())
    context=checkout_policy(head,tree,event_name,event,os.environ['GITHUB_SHA'],lambda *args:git(root,*args))
    rows = []
    for name in names:
        raw = local_file(root, name)
        blob = git(root, 'rev-parse', head+':'+name)
        need(hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest() == blob, 'checkout-file-drift')
        rows.append({'path':name, 'bytes':len(raw), 'sha256':digest(raw), 'git_blob':blob})
    return {'contract':'echs.c08.storage-service-checkout.v1', 'status':'EXACT_SOURCE_CHECKOUT_VERIFIED',
        **context,'postgres_required':major,'source_manifest_sha256':manifest_hash,
        'owned_paths':list(OWN), 'source_files':rows, 'production_calls':False}


def validate_offline(name, raw, expected, source_rows):
    value = strict_json(raw)
    spec = expected[name]
    base = {'contract','status','passed','total','groups','source_sha256'}
    extra = set(spec['fields'])
    if name == 'actual-contract.json':
        extra.add('source_manifest_sha256')
    closed(value, base | extra)
    need(value['contract'] == spec['contract'] and value['status'] == 'PASS', 'offline-contract')
    names = spec['groups']
    need(type(value['passed']) is int and type(value['total']) is int
         and value['passed'] == value['total'] == len(names), 'offline-count')
    need(type(value['groups']) is list and len(value['groups']) == len(names), 'offline-count')
    for row, label in zip(value['groups'], names):
        closed(row, ('name','status'))
        need(row['name'] == label and row['status'] == 'PASS', 'offline-case')
    for key, required in spec['fields'].items():
        need(exact(value[key], required), 'offline-execution-scope')
    hashes = value['source_sha256']
    need(type(hashes) is dict and set(hashes) == set(spec['source_files']), 'offline-source-closure')
    for key, actual in hashes.items():
        need(actual == source_rows[PREFIX+key]['sha256'], 'offline-source-drift')
    if name == 'actual-contract.json':
        need(value['source_manifest_sha256'] == source_rows[PREFIX+'source-manifest.json']['sha256'], 'offline-manifest')
    return value


def safe_failure(directory):
    """Retain only typed status metadata on a failed service run, never its body."""
    result = {'run_report_present':False, 'status':'NOT_ACCEPTED'}
    p = directory/'service-run-report.json'
    if not p.is_file() or p.is_symlink() or p.is_junction():
        return result
    value = strict_json(p.read_bytes())
    result['run_report_present'] = True
    for key in ('services_executed','hosted_edge_executed','corpus_imported','service_start_attempted','cleanup_complete'):
        if type(value.get(key)) is bool:
            result[key] = value[key]
    failure = value.get('failure')
    if type(failure) is dict:
        selected = {}
        for key in ('stage','type','code','command_stage','reason'):
            item = failure.get(key)
            if item is None or (type(item) is str and re.fullmatch('[A-Za-z0-9_.-]{1,128}', item)):
                selected[key] = item
        for key in ('exit_code',):
            item = failure.get(key)
            if type(item) is int and -256 <= item <= 65535:
                selected[key] = item
        if type(failure.get('timed_out')) is bool:
            selected['timed_out'] = failure['timed_out']
        if 'child' in failure:
            try:
                selected['child'] = validate_child_failure(failure['child'])
            except ContractError:
                selected['child_diagnostic'] = 'INVALID_OR_UNAVAILABLE'
        elif failure.get('child_diagnostic') == 'INVALID_OR_UNAVAILABLE':
            selected['child_diagnostic'] = 'INVALID_OR_UNAVAILABLE'
        result['failure'] = selected
    test_path = directory/'service-test-results.json'
    if test_path.is_file() and not test_path.is_symlink() and not test_path.is_junction():
        tests = strict_json(test_path.read_bytes())
        expected = strict_json(local_file(HERE, 'service-cases.json'))
        groups = tests.get('groups') if type(tests) is dict else None
        if (type(groups) is list and len(groups) == len(expected) == 19
                and all(type(row) is dict and row.get('name') == label
                    and row.get('status') in ('PASS','FAIL') for row, label in zip(groups, expected))):
            selected = []
            for row in groups:
                item = {'name':row['name'], 'status':row['status']}
                for key in ('error_type','sqlstate'):
                    value = row.get(key)
                    if type(value) is str and re.fullmatch('[A-Za-z0-9_]{1,80}', value):
                        item[key] = value
                selected.append(item)
            result['service_groups'] = selected
    return result


def prepare(root, manifest_hash,expected_major=15):
    value = snapshot(root, manifest_hash,expected_major)
    results = HERE/'results'
    need(not results.exists(), 'existing-ci-results')
    need(not (HERE/'runs').exists(), 'existing-ci-runs')
    results.mkdir()
    write(results/'checkout.json', value)
    return {'status':value['status'], 'source_files':len(value['source_files'])}


def assemble(root, manifest_hash,expected_major=15):
    major=postgres_major(expected_major)
    destination = Path(os.environ['RUNNER_TEMP'])/('private-bank-service-evidence-pg'+str(major))
    for p in (destination, *destination.parents):
        need(not p.is_symlink() and not p.is_junction(), 'linked-artifact')
    need(not destination.exists(), 'artifact-exists')
    destination.mkdir()
    complete = False; accepted_service = None
    failure = None
    try:
        fresh = snapshot(root, manifest_hash,major)
        checkout_raw = local_file(HERE, 'results/checkout.json')
        need(exact(strict_json(checkout_raw), fresh), 'checkout-changed')
        expected = strict_json(local_file(HERE, 'ci-expected-groups.json'))
        need(set(expected) == set(OFFLINE), 'offline-report-set')
        sources = {row['path']:row for row in fresh['source_files']}
        offline = {}
        for name in OFFLINE:
            raw = local_file(HERE, 'results/'+name)
            validate_offline(name, raw, expected, sources)
            offline[name] = raw
        runs = list((HERE/'runs').iterdir())
        need(len(runs) == 1 and runs[0].is_dir() and re.fullmatch('[0-9a-f]{32}', runs[0].name), 'actual-run-set')
        local_target = HERE/'results'/'accepted-service'
        accepted_service=collect(runs[0], local_target, fresh['head'], fresh['tree'], manifest_hash,major)
        members = {'checkout.json':checkout_raw, **offline}
        for p in local_target.iterdir():
            need(p.is_file() and not p.is_symlink() and not p.is_junction(), 'artifact-member')
            members[p.name] = p.read_bytes()
        need(len(members) == 10, 'artifact-count')
        need(exact(snapshot(root, manifest_hash,major), fresh), 'source-changed-before-export')
        for name, raw in members.items():
            with (destination/name).open('xb') as handle:
                handle.write(raw)
        complete = True
    except Exception as error:
        failure = {'type':type(error).__name__, 'code':getattr(error,'code',None)}
        runs = list((HERE/'runs').glob('*')) if (HERE/'runs').is_dir() else []
        if len(runs) == 1 and runs[0].is_dir() and re.fullmatch('[0-9a-f]{32}', runs[0].name):
            try:
                failure['runner'] = safe_failure(runs[0])
            except Exception:
                failure['runner'] = {'status':'UNREADABLE_METADATA'}
    rows = [{'file':p.name,'bytes':p.stat().st_size,'sha256':digest(p.read_bytes())}
            for p in sorted(destination.iterdir())]
    result = {'contract':'echs.c08.storage-service-ci-index.v1',
        'status':'ACTUAL_SERVICES_PASS' if complete else 'INCOMPLETE_OR_FAILED', 'complete':complete,
        'github_ci_accepted':False, 'requires_independent_workflow_metadata':True,
        'source_manifest_sha256':manifest_hash, 'files':rows, 'failure':failure,
        'postgres_required':major,'postgres_observation':accepted_service['postgres_observation'] if complete else None,
        'production_calls':False, 'hosted_edge_executed':False, 'corpus_imported':False, 'whole_c08_complete':False}
    write(destination/'ci-index.json', result)
    need(complete, 'service-ci-incomplete')
    return {'status':result['status'], 'artifact_members':len(rows)+1, 'service_groups':19}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=('prepare','assemble'))
    parser.add_argument('--manifest-sha256', required=True)
    parser.add_argument('--postgres-major',type=int,choices=(15,17),default=15)
    args = parser.parse_args()
    need(SHA64.fullmatch(args.manifest_sha256), 'manifest-hash-shape')
    root = HERE.parents[1]
    try:
        print(json.dumps((prepare if args.mode == 'prepare' else assemble)(root, args.manifest_sha256,args.postgres_major)))
        return 0
    except ContractError as error:
        print(json.dumps({'status':'REJECTED','code':error.code}))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
