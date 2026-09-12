"""Run six fixed local suites with owned cleanup and source-bound report bytes.

Default: source preflight only. --execute requires disposable hosted Linux CI.
--output is a fresh direct child of RUNNER_TEMP; raw diagnostics stay private.
"""
import argparse
import ast
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import stat
import sys
import tempfile

import assemble
import contract
from fixture import execution_guard
from owned_children import OwnedChildren
from processes import OwnedProcess

SUITES = (
    ('contract','contract-tests.json',180),
    ('cert','cert-tests.json',120),
    ('supervisor','supervisor-tests.json',90),
    ('descendant','descendant-tests.json',180),
    ('https','https-tests.json',90),
    ('bridge','bridge-tests.json',60),
)
MAX_BYTES = 1048576


def need(value, code):
    if not value:
        raise ValueError(code)


def file_bytes(path):
    need(not path.is_symlink() and path.is_file() and path.stat().st_nlink == 1,'local-report-file')
    with path.open('rb') as stream:
        raw = stream.read(MAX_BYTES + 1)
    need(0 < len(raw) <= MAX_BYTES,'local-report-size')
    return raw


def metadata(name, raw):
    return {'path':name,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}


def private_stream(path):
    fd = os.open(path,os.O_CREAT | os.O_EXCL | os.O_WRONLY | getattr(os,'O_NOFOLLOW',0),0o600)
    return os.fdopen(fd,'wb')


def write_new(path, raw):
    with path.open('xb') as stream:
        stream.write(raw)


def encode(value):
    return (json.dumps(value,indent=2,allow_nan=False)+'\n').encode('utf-8')


def diagnostic_allowlist(suite):
    # Read declared identifiers before the child runs; private failure text can
    # select these public source identifiers, but cannot supply new text.
    names = {'contract':'test_contract.py','cert':'test_certs.py',
             'supervisor':'test_supervisor.py','descendant':'test_owned_children.py',
             'https':'test_https_bridge.mjs','bridge':'test_bridge.mjs'}
    name = names[suite]
    source = file_bytes(contract.HERE/name).decode('utf-8')
    identifiers = set()
    if name.endswith('.py'):
        for item in ast.parse(source).body:
            if isinstance(item,ast.ClassDef) and re.fullmatch(r'[A-Za-z0-9_]{1,120}',item.name):
                for method in item.body:
                    if isinstance(method,ast.FunctionDef) and re.fullmatch(r'test_[A-Za-z0-9_]{1,120}',method.name):
                        identifiers.add('__main__.'+item.name+'.'+method.name)
    return {'file':name,'lines':len(source.splitlines()),'identifiers':identifiers}


def failure_identifiers(allowed, paths):
    identifiers = set(); locations = set()
    for path in paths:
        if not path.exists():
            continue
        need(not path.is_symlink() and path.is_file() and path.stat().st_nlink == 1,'local-diagnostic-file')
        with path.open('rb') as stream:
            raw = stream.read(MAX_BYTES+1)
        need(len(raw)<=MAX_BYTES,'local-diagnostic-size')
        text = raw.decode('utf-8',errors='replace')
        candidates = re.findall(r'(?<![A-Za-z0-9_.])(__main__\.[A-Za-z0-9_]+\.test_[A-Za-z0-9_]+)(?![A-Za-z0-9_.])',text)
        if path.suffix == '.stderr':
            # Verbose unittest stderr also lists successful tests. Restrict
            # that stream to the actual FAIL/ERROR headings.
            candidates = []
            for method,owner in re.findall(r'^(?:FAIL|ERROR): (test_[A-Za-z0-9_]+) \((__main__\.[A-Za-z0-9_.]+)\)',text,re.MULTILINE):
                candidates.append(owner if owner.endswith('.'+method) else owner+'.'+method)
        identifiers.update(set(candidates) & allowed['identifiers'])
        if allowed['file'].endswith('.mjs'):
            for line,column in re.findall(r'(?<![A-Za-z0-9_.-])'+re.escape(allowed['file'])+r':([0-9]{1,6}):([0-9]{1,5})(?![0-9])',text):
                if 1 <= int(line) <= allowed['lines'] and 1 <= int(column) <= 2000:
                    locations.add((allowed['file'],int(line),int(column)))
    return sorted(identifiers)[:30],[{'file':file,'line':line,'column':column} for file,line,column in sorted(locations)[:10]]


def private_directory(path, parent):
    need(contract.guarded_path(path,parent).parent == contract.guarded_path(parent,parent),'local-private-containment')
    value = path.stat()
    need(stat.S_ISDIR(value.st_mode) and stat.S_IMODE(value.st_mode)==0o700 and value.st_uid==os.getuid(),'local-private-owner')


def command(suite, repo, private, report, node, openssl):
    here = contract.HERE
    if suite == 'contract':
        return [sys.executable,'-B',str(here/'test_contract.py'),'--repo',str(repo),'--work-dir',str(private),'--report',str(report)]
    if suite == 'cert':
        return [sys.executable,'-B',str(here/'test_certs.py'),'--require-openssl','--openssl',openssl,'--work-dir',str(private),'--report',str(report)]
    if suite == 'supervisor':
        return [sys.executable,'-B',str(here/'test_supervisor.py'),'--require-linux','--work-dir',str(private),'--report',str(report)]
    if suite == 'descendant':
        return [sys.executable,'-B',str(here/'test_owned_children.py'),'--require-linux','--work-dir',str(private)]
    if suite == 'https':
        return [node,str(here/'test_https_bridge.mjs'),sys.executable,openssl]
    need(suite == 'bridge','local-suite')
    return [node,str(here/'test_bridge.mjs')]


def run(repo_arg, output_arg, execute):
    # Preserve the supplied spelling until ancestor/link validation is complete.
    repo = contract.guarded_path(repo_arg,repo_arg)
    source_before = contract.sources(repo,contract.HERE == repo/contract.PREFIX)
    if not execute:
        return {'status':'SOURCE PREFLIGHT PASS; LOCAL SUITES NOT EXECUTED','source_manifest_sha256':source_before['manifest_sha256']}
    execution_guard(os.environ,sys.platform,repo)
    need(contract.HERE == repo/contract.PREFIX,'local-published-layout')
    runner_temp = contract.guarded_path(Path(os.environ['RUNNER_TEMP']),Path(os.environ['RUNNER_TEMP']))
    output = contract.guarded_path(output_arg,runner_temp)
    need(output.parent == runner_temp and re.fullmatch(r'[A-Za-z0-9_-]{1,100}',output.name) and not output.exists(),'local-fresh-output')
    node,openssl = shutil.which('node'),shutil.which('openssl')
    need(node is not None and openssl is not None,'local-executables')
    output.mkdir(mode=0o700)
    private = Path(tempfile.mkdtemp(prefix='echs-browser-local-private-',dir=runner_temp))
    registry = None; children = []; records = []; raw_reports = {}; parsed_reports = {}
    stage = 'private-directory'; failed = None; source_after = None; cleanup_ok = True
    safe_failed_tests = []; safe_locations = []
    receipt = {'contract':'echs.c04.browser-http-local-executions.v1','status':'FAIL',
               'source_manifest_sha256':source_before['manifest_sha256'],'source_before':source_before,
               'source_after':None,'executions':records}
    try:
        private_directory(private,runner_temp)
        (private/'home').mkdir(mode=0o700)
        env = {'PATH':os.environ['PATH'],'HOME':str(private/'home'),'TMPDIR':str(private),
               'LANG':'C.UTF-8','PYTHONDONTWRITEBYTECODE':'1','GITHUB_ACTIONS':'true',
               'RUNNER_ENVIRONMENT':'github-hosted','GITHUB_WORKSPACE':str(repo)}
        registry = OwnedChildren.enable()
        for suite,name,timeout in SUITES:
            stage = suite
            need(contract.sources(repo,True)==source_before,'local-source-before-suite')
            allowed_diagnostics = diagnostic_allowlist(suite)
            report_path = private/name; stdout_path = private/(suite+'.stdout'); stderr_path = private/(suite+'.stderr')
            execution = {'suite':suite,'exit_code':None,'output':None}; records.append(execution)
            with private_stream(stdout_path) as stdout, private_stream(stderr_path) as stderr:
                child = OwnedProcess(command(suite,repo,private,report_path,node,openssl),env=env,cwd=repo,
                                     role='driver',reap=registry.reap_adopted,stdout=stdout,stderr=stderr)
                children.append(child); registry.register_root(child.child)
                execution['exit_code'] = child.wait(timeout)
                child.close()
            if execution['exit_code'] != 0:
                ids,locations = failure_identifiers(allowed_diagnostics,[stdout_path,stderr_path,report_path])
                safe_failed_tests.extend(ids); safe_locations.extend(locations)
            need(execution['exit_code']==0,'local-suite-exit')
            raw = file_bytes(report_path if suite in ('contract','cert','supervisor') else stdout_path)
            parsed = json.loads(raw,object_pairs_hook=assemble.no_duplicates,
                                parse_constant=lambda _:(_ for _ in ()).throw(ValueError('local-nonfinite-json')))
            need(type(parsed) is dict,'local-report-object')
            raw_reports[name] = raw; parsed_reports[name] = parsed; execution['output'] = metadata(name,raw)
            need(contract.sources(repo,True)==source_before,'local-source-after-suite')
    except Exception as error:
        failed = {'stage':stage,'type':type(error).__name__}
    finally:
        # Each cleanup attempt is independent. Incomplete descendant knowledge
        # cannot prevent attempts on separately verified direct child handles.
        for child in reversed(children):
            try:
                if not child.closed:
                    child.close()
            except Exception:
                cleanup_ok = False
        if registry is not None:
            try:
                registry.cleanup(term_seconds=3,kill_seconds=3); registry.assert_empty()
            except Exception:
                cleanup_ok = False
        try:
            source_after = contract.sources(repo,True)
            need(source_after==source_before,'local-final-source')
        except Exception:
            failed = failed or {'stage':'final-source','type':'SourceValidationError'}
        # A failed source sweep never skips removal of the independently owned
        # private directory. rmtree unlinks interior links without following them.
        try:
            private_directory(private,runner_temp)
            shutil.rmtree(private)
            need(not private.exists(),'local-private-remains')
        except Exception:
            cleanup_ok = False
    receipt['source_after'] = source_after
    if failed is None and cleanup_ok:
        receipt['status'] = 'PASS'
        parsed_reports['local-executions.json'] = receipt
        try:
            # Do not copy an unknown report field into the artifact directory.
            # Final collection separately binds these exact output byte hashes.
            assemble.validate_local(parsed_reports)
            private_directory(output,runner_temp)
            for _suite,name,_timeout in SUITES:
                write_new(output/name,raw_reports[name])
        except Exception as error:
            failed = {'stage':'report-validation','type':type(error).__name__}
    if failed is not None or not cleanup_ok:
        receipt['status'] = 'FAIL'
    private_directory(output,runner_temp)
    write_new(output/'local-executions.json',encode(receipt))
    summary = {'status':receipt['status'],'suites_completed':sum(row['exit_code']==0 for row in records),
               'cleanup_complete':cleanup_ok,'source_manifest_sha256':source_before['manifest_sha256']}
    if failed is not None:
        summary['failure'] = failed
    if safe_failed_tests:
        summary['failed_test_identifiers'] = sorted(set(safe_failed_tests))[:30]
    if safe_locations:
        summary['failure_source_locations'] = safe_locations[:10]
    return summary


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo',required=True,type=Path)
    parser.add_argument('--output',required=True,type=Path)
    parser.add_argument('--execute',action='store_true')
    args = parser.parse_args()
    try:
        result = run(args.repo,args.output,args.execute)
        print(json.dumps(result))
        raise SystemExit(0 if result['status'] in ('PASS','SOURCE PREFLIGHT PASS; LOCAL SUITES NOT EXECUTED') else 1)
    except Exception as error:
        print(json.dumps({'status':'FAIL BEFORE LOCAL EXECUTION RECEIPT','type':type(error).__name__}))
        raise SystemExit(1)
