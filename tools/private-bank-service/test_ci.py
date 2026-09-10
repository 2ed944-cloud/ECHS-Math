"""Offline negative tests for exact-source CI acceptance; no service execution."""
from pathlib import Path
import argparse
import copy
import json
import tempfile
from ci import BASE, BASE_TREE, OWN, PREFIX, checkout_policy, encode, safe_failure, validate_offline
from service_contract import HERE, ContractError, digest, write_report_exclusive

NAMES = [
    'exact same-repository pull-request merge is bound to reviewed base and source paths',
    'missing duplicate or unrelated changed paths cannot pass checkout acceptance',
    'stale tree head parents repository and event are rejected',
    'exact offline reports remain explicitly separate from actual service execution',
    'missing renamed failing and duplicate test groups cannot be accepted',
    'numeric boolean substitutes and broadened execution claims are rejected',
    'changed source hashes extra body fields and wrong manifest are rejected',
    'failure export preserves safe stage codes without private output fields',
]


def rejects(fn):
    try:
        fn()
    except ContractError:
        return
    raise AssertionError('Expected closed rejection')


def suite():
    rows = []
    def group(i, fn):
        try:
            fn()
            rows.append({'name':NAMES[i], 'status':'PASS'})
        except Exception as error:
            rows.append({'name':NAMES[i], 'status':'FAIL', 'error_type':type(error).__name__})
    head, tree, pr_head = 'a'*40, 'b'*40, 'c'*40
    event = {'number':371,'pull_request':{'head':{'sha':pr_head,'repo':{'full_name':'2ed944-cloud/ECHS-Math'}},
        'base':{'sha':BASE,'repo':{'full_name':'2ed944-cloud/ECHS-Math'}}}}
    args = [head, tree, [BASE,pr_head], BASE_TREE, list(OWN), 'pull_request', event, head]
    def first():
        assert len(OWN) == len(set(OWN)) == 29
        assert checkout_policy(*args) == (pr_head,371)
    group(0, first)
    def changed():
        for paths in [list(OWN)[:-1], list(OWN)+[OWN[0]], list(OWN)[:-1]+['supabase/functions/private-api/index.ts']]:
            value = copy.deepcopy(args)
            value[4] = paths
            rejects(lambda:checkout_policy(*value))
    group(1, changed)
    def stale():
        for index, value in [(0,'d'*40),(3,'d'*40),(2,[pr_head,BASE]),(5,'push')]:
            modified = copy.deepcopy(args)
            modified[index] = value
            rejects(lambda:checkout_policy(*modified))
        for side in ('head','base'):
            modified = copy.deepcopy(args)
            modified[6]['pull_request'][side]['repo']['full_name'] = 'foreign/repository'
            rejects(lambda:checkout_policy(*modified))
        modified = copy.deepcopy(args)
        modified[6]['number'] = True
        rejects(lambda:checkout_policy(*modified))
    group(2, stale)
    name = 'actual-contract.json'
    labels = ['first exact contract','second exact contract']
    spec = {name:{'contract':'synthetic-offline.v1','groups':labels,
        'fields':{'services_executed':False,'hosted_edge_executed':False},'source_files':['ci.py']}}
    sources = {PREFIX+'ci.py':{'sha256':'1'*64},PREFIX+'source-manifest.json':{'sha256':'2'*64}}
    positive = {'contract':'synthetic-offline.v1','status':'PASS','passed':2,'total':2,
        'groups':[{'name':label,'status':'PASS'} for label in labels], 'services_executed':False,
        'hosted_edge_executed':False,'source_sha256':{'ci.py':'1'*64},'source_manifest_sha256':'2'*64}
    def validate(value):
        return validate_offline(name,encode(value),spec,sources)
    def valid():
        assert validate(positive)['services_executed'] is False
    group(3, valid)
    def bad_groups():
        for mutation in ('missing','renamed','fail','duplicate'):
            value = copy.deepcopy(positive)
            if mutation == 'missing':
                value['groups'].pop()
            elif mutation == 'renamed':
                value['groups'][0]['name'] = 'easier replacement'
            elif mutation == 'fail':
                value['groups'][0]['status'] = 'FAIL'
            else:
                value['groups'][1] = value['groups'][0].copy()
            rejects(lambda:validate(value))
    group(4, bad_groups)
    def claims():
        for key, replacement in [('services_executed',0),('services_executed',True),('passed',True),('hosted_edge_executed',True)]:
            value = copy.deepcopy(positive)
            value[key] = replacement
            rejects(lambda:validate(value))
    group(5, claims)
    def private():
        for mutation in ('hash','extra','manifest','unknown-source'):
            value = copy.deepcopy(positive)
            if mutation == 'hash':
                value['source_sha256']['ci.py'] = '3'*64
            elif mutation == 'extra':
                value['groups'][0]['response_body'] = 'synthetic-sensitive-sentinel'
            elif mutation == 'manifest':
                value['source_manifest_sha256'] = '3'*64
            else:
                value['source_sha256']['unreviewed.py'] = '3'*64
            rejects(lambda:validate(value))
    group(6, private)
    def failure_export():
        with tempfile.TemporaryDirectory(prefix='ci-contract-',dir=HERE) as name:
            temporary = Path(name).resolve()
            assert temporary.parent == HERE and not temporary.is_symlink() and not temporary.is_junction()
            value = {'status':'FAIL','services_executed':True,'cleanup_complete':False,
                'tokens':['synthetic-sensitive-sentinel'], 'failure':{'stage':'start-services','type':'RunnerError',
                'command_stage':'compose-up','code':None,'exit_code':1,'timed_out':False,
                'stderr':'synthetic-sensitive-sentinel','stdout':'synthetic-sensitive-sentinel'}}
            (temporary/'service-run-report.json').write_bytes(encode(value))
            labels = json.loads((HERE/'service-cases.json').read_bytes())
            (temporary/'service-test-results.json').write_bytes(encode({'groups':[
                {'name':label,'status':'FAIL','error_type':'AssertionError',
                 'response_body':'synthetic-sensitive-sentinel'} for label in labels]}))
            result = safe_failure(temporary)
            assert result['cleanup_complete'] is False and result['failure']['exit_code'] == 1
            assert result['failure']['command_stage'] == 'compose-up'
            assert 'synthetic-sensitive-sentinel' not in json.dumps(result)
            assert 'tokens' not in result and 'stderr' not in result['failure']
            assert len(result['service_groups']) == 19 and result['service_groups'][0]['error_type'] == 'AssertionError'
            value['failure']['code'] = 'unexpected private payload with spaces'
            (temporary/'service-run-report.json').write_bytes(encode(value))
            assert 'code' not in safe_failure(temporary)['failure']
    group(7, failure_export)
    return rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--report', type=Path, default=HERE/'results'/'ci-contract.json')
    args = parser.parse_args()
    names = ('ci.py','test_ci.py','ci-expected-groups.json')
    before = {name:digest((HERE/name).read_bytes()) for name in names}
    rows = suite()
    assert before == {name:digest((HERE/name).read_bytes()) for name in names}
    result = {'contract':'echs.c08.storage-service-ci-offline-tests.v1',
        'status':'PASS' if all(row['status']=='PASS' for row in rows) else 'FAIL',
        'passed':sum(row['status']=='PASS' for row in rows),'total':len(rows),'groups':rows,
        'source_sha256':before, 'services_executed':False, 'hosted_edge_executed':False}
    write_report_exclusive(args.report, result)
    print(json.dumps({'status':result['status'],'passed':result['passed'],'total':result['total'],'services_executed':False}))
    return 0 if result['status']=='PASS' else 1


if __name__ == '__main__':
    raise SystemExit(main())
