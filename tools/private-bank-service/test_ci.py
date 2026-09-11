"""Offline negative tests for exact-source CI acceptance; no service execution."""
from pathlib import Path
import argparse
import copy
import json
import tempfile
import os
import subprocess
import sys
from unittest.mock import patch
import ci
from ci import BASE, BASE_TREE, OWN, PREFIX, WORKFLOW, checkout_policy, encode, safe_failure, validate_offline
from service_contract import HERE, ContractError, digest, write_report_exclusive

NAMES = [
    'actual same-repository merge binds event parents tree diff and historical ancestry',
    'duplicate unsafe paths and wrong historical ancestry cannot pass checkout acceptance',
    'stale tree head parents repository and event are rejected',
    'exact offline reports remain explicitly separate from actual service execution',
    'missing renamed failing and duplicate test groups cannot be accepted',
    'numeric boolean substitutes and broadened execution claims are rejected',
    'changed source hashes extra body fields and wrong manifest are rejected',
    'failure export preserves safe stage codes without private output fields',
    'actual local Git accepts an advanced-base merge and rejects a nonancestor baseline',
    'matrix workflow propagates the explicit major and keeps separate closed artifacts',
    'all nineteen service cases and both runtime files remain byte identical',
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
    head,tree,pr_head='a'*40,'b'*40,'c'*40;base='1'*40;base_tree='2'*40
    event={'number':371,'pull_request':{'head':{'sha':pr_head,'repo':{'full_name':'2ed944-cloud/ECHS-Math'}},
        'base':{'sha':base,'repo':{'full_name':'2ed944-cloud/ECHS-Math'}}}}
    def read_git(*args):
        observed={('rev-parse','HEAD'):head,('rev-parse','HEAD^{tree}'):tree,('rev-parse',BASE+'^{tree}'):BASE_TREE,
            ('merge-base',BASE,head):BASE,('rev-list','--parents','-n','1','HEAD'):' '.join([head,base,pr_head]),
            ('rev-parse',pr_head):pr_head,('rev-parse',base+'^{tree}'):base_tree,('diff','--name-only',base,head):'docs/reviewed.md'}
        if args not in observed:raise ContractError('synthetic-git-query')
        return observed[args]
    args=[head,tree,'pull_request',event,head,read_git]
    def first():
        assert len(OWN)==len(set(OWN))==29
        value=checkout_policy(*args)
        assert value['parents']==[base,pr_head] and value['base']==base and value['changed_paths']==['docs/reviewed.md']
        assert value['source_baseline']=={'sha':BASE,'tree':BASE_TREE}
    group(0,first)
    def changed():
        for result in ['docs/reviewed.md\ndocs/reviewed.md','../outside','/absolute']:
            def malformed(*query):return result if query[0]=='diff' else read_git(*query)
            rejects(lambda:checkout_policy(*args[:-1],malformed))
        def nonancestor(*query):return '9'*40 if query[0]=='merge-base' else read_git(*query)
        rejects(lambda:checkout_policy(*args[:-1],nonancestor))
    group(1,changed)
    def stale():
        for index,value in [(0,'d'*40),(1,'d'*40),(2,'push'),(4,'d'*40)]:
            modified=list(args);modified[index]=value;rejects(lambda:checkout_policy(*modified))
        for side in ('head','base'):
            modified=list(args);modified[3]=copy.deepcopy(event);modified[3]['pull_request'][side]['repo']['full_name']='foreign/repository'
            rejects(lambda:checkout_policy(*modified))
        for side in ('head','base'):
            modified=list(args);modified[3]=copy.deepcopy(event);modified[3]['pull_request'][side]['sha']='d'*40
            rejects(lambda:checkout_policy(*modified))
        modified=list(args);modified[3]=copy.deepcopy(event);modified[3]['number']=True
        rejects(lambda:checkout_policy(*modified))
    group(2,stale)
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
            child = {'contract':'echs.c08.service-child-failure.v1','status':'FAIL',
                'phase':'seed-ready','error_type':'Error','code':'CHILD_EXIT',
                'sqlstate':'42501','seed_phase':'database-connect',
                'seed_error_type':'OperationalError','seed_exit_code':1}
            value['failure']['child'] = child
            (temporary/'service-run-report.json').write_bytes(encode(value))
            assert safe_failure(temporary)['failure']['child'] == child
            for key, replacement in [('phase','synthetic-sensitive-sentinel'),
                    ('code','synthetic-sensitive-sentinel'),('seed_exit_code',True),
                    ('seed_exit_code',256),('sqlstate','private body'),
                    ('seed_error_type','synthetic-sensitive-sentinel')]:
                malformed = child.copy();malformed[key] = replacement
                value['failure']['child'] = malformed
                (temporary/'service-run-report.json').write_bytes(encode(value))
                exported = safe_failure(temporary)['failure']
                assert 'child' not in exported and exported['child_diagnostic'] == 'INVALID_OR_UNAVAILABLE'
                assert 'synthetic-sensitive-sentinel' not in json.dumps(exported)
            for malformed in [None, [], {**child,'tokens':['synthetic-sensitive-sentinel']},
                    {k:v for k,v in child.items() if k != 'code'}]:
                value['failure']['child'] = malformed
                (temporary/'service-run-report.json').write_bytes(encode(value))
                exported = safe_failure(temporary)['failure']
                assert 'child' not in exported and exported['child_diagnostic'] == 'INVALID_OR_UNAVAILABLE'
    group(7, failure_export)
    def actual_git():
        with tempfile.TemporaryDirectory(prefix='ci-git-',dir=HERE) as name:
            root=Path(name)
            env={k:v for k,v in os.environ.items() if not k.startswith(('GIT_','GITHUB_','GH_'))}
            env.update(GIT_AUTHOR_NAME='Synthetic fixture',GIT_AUTHOR_EMAIL='fixture@example.invalid',GIT_COMMITTER_NAME='Synthetic fixture',GIT_COMMITTER_EMAIL='fixture@example.invalid',GIT_CONFIG_NOSYSTEM='1',GIT_CONFIG_GLOBAL=os.devnull)
            def git(*args):return subprocess.check_output(['git',*args],cwd=root,env=env,text=True,encoding='utf-8',stderr=subprocess.PIPE,timeout=15).strip()
            git('init','--initial-branch','main');git('config','core.autocrlf','false')
            def commit(filename,contents,parent=None):
                (root/filename).write_bytes(contents);git('add','--',filename);tree=git('write-tree')
                args=['commit-tree',tree,'-m','Synthetic reviewed source']
                if parent:args+=['-p',parent]
                sha=git(*args);git('update-ref','HEAD',sha);return sha
            initial=commit('baseline.txt',b'baseline');initial_tree=git('rev-parse','HEAD^{tree}')
            git('checkout','-b','feature');feature=commit('feature.txt',b'feature',initial)
            git('checkout','main');base=commit('base.txt',b'advanced',initial)
            git('merge','--no-ff','--no-gpg-sign','-m','Synthetic merge','feature')
            tested=git('rev-parse','HEAD');tree=git('rev-parse','HEAD^{tree}')
            assert tree!=git('rev-parse',feature+'^{tree}')
            event={'number':3,'pull_request':{'head':{'sha':feature,'repo':{'full_name':'2ed944-cloud/ECHS-Math'}},'base':{'sha':base,'repo':{'full_name':'2ed944-cloud/ECHS-Math'}}}}
            with patch.object(ci,'BASE',initial),patch.object(ci,'BASE_TREE',initial_tree):
                result=checkout_policy(tested,tree,'pull_request',event,tested,git)
                assert result['parents']==[base,feature] and result['changed_paths']==['feature.txt']
                dispatch=checkout_policy(tested,tree,'workflow_dispatch',{},tested,git)
                assert dispatch['base']==base and dispatch['pr_head'] is None
                wrong=copy.deepcopy(event);wrong['pull_request']['base']['sha']=initial
                rejects(lambda:checkout_policy(tested,tree,'pull_request',wrong,tested,git))
                sibling=git('commit-tree',initial_tree,'-p',initial,'-m','Nonancestor')
                with patch.object(ci,'BASE',sibling):rejects(lambda:checkout_policy(tested,tree,'pull_request',event,tested,git))
    group(8,actual_git)
    def matrix_workflow():
        workflow=(HERE.parents[1]/WORKFLOW).read_text()
        assert 'postgres_major: [15, 17]' in workflow and 'fail-fast: false' in workflow and 'max-parallel: 2' in workflow
        for text in ['ci.py prepare --postgres-major ${{ matrix.postgres_major }}','ci.py assemble --postgres-major ${{ matrix.postgres_major }}','run_actual_service.py --postgres-major ${{ matrix.postgres_major }} --execute','name: private-bank-actual-service-pg${{ matrix.postgres_major }}','private-bank-service-evidence-pg${{ matrix.postgres_major }}/']:
            assert text in workflow
        assert 'secrets.' not in workflow and 'continue-on-error' not in workflow
        for mode in ('prepare','assemble'):
            for invalid in ('16','latest','15.0'):
                done=subprocess.run([sys.executable,'-B',str(HERE/'ci.py'),mode,'--manifest-sha256','0'*64,'--postgres-major',invalid],capture_output=True,timeout=15)
                assert done.returncode==2
    group(9,matrix_workflow)
    def frozen_cases():
        expected={'service-cases.json':'1cc0de93711fcb31410130f6df4a86a3ba7f6da0bb4cafe46b41d7301ec2bf4b',
            'test_service.mjs':'aab049a737c1962dc5ad310db57c45218edd9f429aeb4eac08c66ca396810338',
            'runtime/handler.mjs':'ff49fd68970612cd325dec9819707a91a431eb1799cf6c4d88d1fea675f4cf0e',
            'runtime/transport.mjs':'11425bcd086ddb2f88c788969ef82e1f2af8a7803d8b8110baabf785bb3152d3'}
        for path,value in expected.items():assert digest((HERE/path).read_bytes())==value
        assert len(json.loads((HERE/'service-cases.json').read_bytes()))==19
    group(10,frozen_cases)
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
