"""New source closure; historical validators validate only historical sources."""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re

HERE = Path(__file__).resolve().parent
PREFIX = 'tools/private-learning-browser-journal-http/'
WORKFLOW = '.github/workflows/private-learning-browser-journal-http.yml'
INPUT_SHA = '439dec3b15b9e58dd09d34a0b22c0350ae3117b21e418462bba9cb071cf4710a'
T3_SHA = '62ceef6e1a69bc8462aaa80ff56800e27452ee5a028b527b3fc88a6a853222ce'
FENCE_SHA = 'cd553dc8e1a715af588553f19d74df6b5f2f20d6a4c5c86930ecb74ab933600b'
SQL_SHA = '9ce98da90d5c141fdf184d32a00067eca1aaa800870204edd9c383cc22b1e1bf'
COPIES = ['runtime/handler.mjs','runtime/wire.mjs','runtime/contract.mjs','runtime/pending-intent.mjs',
          'bridge.mjs','controls.py','test_http.mjs','test_bridge.mjs']
NEW_NAMES = ['T3_COPY_RECEIPT.json','input-pins.json','fixture.py','https-bridge.mjs','browser-page.mjs',
             'control-client.mjs','browser-dependency.json','contract.py','certs.py','test_certs.py',
             'test_browser_http.mjs','browser-cases.mjs','run.py','assemble.py','test_contract.py','test_https_bridge.mjs',
             'test_supervisor.py','processes.py','owned_children.py','test_owned_children.py','local_tests.py','README.md']


def need(value, code):
    if not value:
        raise ValueError(code)


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def file_path(path):
    # Windows candidate-only long path support; published path entries stay relative.
    return Path('\\\\?\\' + os.path.abspath(path)) if os.name == 'nt' and not str(path).startswith('\\\\?\\') else path


def safe_relative(value):
    need(type(value) is str and re.fullmatch('[A-Za-z0-9._/-]+', value) and not value.startswith('/') and not any(x in ('','..','.') for x in value.split('/')), 'source-path')
    return value


def guarded_path(path, base):
    # Inspect original components before resolve() could erase link identity.
    original = Path(os.path.abspath(path)); declared = Path(os.path.abspath(base))
    need(original.is_relative_to(declared), 'source-lexical-containment')
    for component in (original, *original.parents, declared, *declared.parents):
        item = file_path(component)
        need(not item.is_symlink() and not getattr(item, 'is_junction', lambda:False)(), 'source-linked-component')
    resolved = file_path(original).resolve(); resolved_base = file_path(declared).resolve()
    need(resolved.is_relative_to(resolved_base), 'source-resolved-containment')
    return resolved


def info(path, name, base):
    path = guarded_path(path, base)
    need(path.is_file(), 'source-file')
    raw = path.read_bytes()
    return {'path': name, 'bytes': len(raw), 'sha256': digest(raw),
            'git_blob_sha': hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest()}


def check_rows(base, rows, count):
    need(type(rows) is list and len(rows) == count, 'source-count')
    seen = set()
    for row in rows:
        need(type(row) is dict and set(row) == {'path','bytes','sha256','git_blob_sha'}, 'source-row-shape')
        name = safe_relative(row['path'])
        need(name not in seen, 'source-duplicate'); seen.add(name)
        need(type(row['bytes']) is int and row['bytes'] >= 0 and re.fullmatch('[a-f0-9]{64}', row['sha256']) and re.fullmatch('[a-f0-9]{40}', row['git_blob_sha']), 'source-row-type')
        need(info(base / name, name, base) == row, 'source-byte-identity')
    return rows


def inputs(repo):
    raw = guarded_path(HERE / 'input-pins.json', HERE).read_bytes()
    need(digest(raw) == INPUT_SHA, 'input-manifest')
    value = json.loads(raw)
    need(value['contract'] == 'echs.c04.browser-journal-http-inputs.v1' and value['accepted_server_main'] == '2c1a0ec618d7a4231195876ff6cbdfb53ad4c819' and value['accepted_server_tree'] == 'a4a4ca451e98afff6908339edc87ea42f9e0e184' and value['accepted_server_run'] == 34676455969, 'accepted-input-boundary')
    need(type(value['production_calls']) is int and value['production_calls'] == 0 and value['native_t3_prerequisite_manifest'] == T3_SHA, 'input-scope')
    check_rows(repo, value['files'], 98)
    migration_rows = [r for r in value['files'] if r['path'].startswith('supabase/migrations/')]
    need(len(migration_rows) == 27 and sorted(p.name for p in (repo / 'supabase/migrations').glob('*.sql')) == sorted(Path(r['path']).name for r in migration_rows), 'exact27-migrations')
    validate_sql(repo)
    return value


def validate_sql(repo):
    fence = guarded_path(repo / 'tools/private-learning-owner-fence-retry/owner-fence.sql', repo).read_bytes()
    journal = guarded_path(repo / 'tools/private-learning-operation-journal/operation-journal.sql', repo).read_bytes()
    need(digest(fence) == FENCE_SHA and digest(journal) == SQL_SHA, 'exact-installed-sql')
    return {'fence_sha256': FENCE_SHA, 'journal_sha256': SQL_SHA, 'production_installation': False}


def t3():
    copy = json.loads(guarded_path(HERE / 'T3_COPY_RECEIPT.json', HERE).read_bytes())
    need(copy['contract'] == 'echs.c04.browser-http-t3-copies.v1' and copy['exact_files'] == 69 and copy['manifest_sha256'] == T3_SHA, 't3-copy-contract')
    rows = copy['source_files']
    need(type(rows) is list and len(rows) == 69 and len({r['path'] for r in rows}) == 69, 't3-closure')
    for row in rows:
        need(set(row) == {'path','bytes','sha256','git_blob_sha','from'}, 't3-row-shape')
        safe_relative(row['from']); safe_relative(row['path'])
        need(row['path'] == 'retained/' + row['from'], 't3-layout')
        need(info(HERE / row['path'], row['path'], HERE) == {key:row[key] for key in ('path','bytes','sha256','git_blob_sha')}, 't3-copy-bytes')
    candidate = file_path(HERE / 'retained/c04-learning-ack-candidate')
    raw = (candidate / 'source-manifest-v1.json').read_bytes()
    need(digest(raw) == T3_SHA, 't3-manifest')
    manifest = json.loads(raw)
    expected = {'retained/c04-learning-ack-candidate/' + r['path'] for r in manifest['source_files']}
    expected.update('retained/' + r['path'] for r in manifest['input_files'])
    expected.update('retained/c04-learning-ack-candidate/' + manifest[key]['path'] for key in ('browser_evidence','adversarial_evidence'))
    expected.add('retained/c04-learning-ack-candidate/source-manifest-v1.json')
    need({r['path'] for r in rows} == expected, 't3-exact-members')
    # This original verifier sees only its byte-identical retained input layout.
    spec = importlib.util.spec_from_file_location('retained_t3_native_prerequisite', candidate / 'verify_candidate.py')
    module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
    result = module.verify(manifest)
    need(result['status'] == 'PASS' and result['main_browser_groups'] == 84 and result['adversarial_browser_groups'] == 14, 't3-native-prerequisite')
    return {'manifest_sha256': T3_SHA, 'source_files': rows, 'native_groups': [84,14],
            'fresh_browser_execution': False, 'verification': result}


def preserved(repo):
    rows = []
    for name in COPIES:
        old = guarded_path(repo / 'tools/private-learning-owner-fence-retry' / name, repo).read_bytes()
        need(guarded_path(HERE / name, HERE).read_bytes() == old, 'exact-server-copy')
        rows.append(info(HERE / name, name, HERE))
    for name in ('wire','contract','pending-intent'):
        need((HERE / 'runtime' / (name + '.mjs')).read_bytes() == (HERE / 'retained/c04-learning-ack-candidate/source/js/journal' / (name + '.mjs')).read_bytes(), 'same-browser-server-journal')
    original = (repo / 'tools/private-learning-owner-fence-retry/test_http.mjs').read_text(encoding='utf-8')
    control = original.split('async function control(',1)[1].split('\nexport function diagnostic(',1)[0]
    copied = (HERE / 'control-client.mjs').read_text(encoding='utf-8').split('export async function control(',1)[1]
    need(copied == control, 'exact-private-control-function')
    return rows


def sources(repo, published=False):
    retained = inputs(repo); browser = t3(); copies = preserved(repo)
    raw = guarded_path(HERE / 'source-manifest.json', HERE).read_bytes(); manifest = json.loads(raw)
    need(manifest['contract'] == 'echs.c04.browser-journal-http-sources.v1', 'source-manifest-contract')
    expected = {PREFIX + row['path'] for row in browser['source_files']}
    expected.update(PREFIX + name for name in COPIES + NEW_NAMES); expected.add(WORKFLOW)
    rows = manifest['files']
    need(type(rows) is list and len(rows) == len(expected) and {r['path'] for r in rows} == expected, 'new-source-exact-closure')
    base = repo if published else HERE.parents[1]
    # A candidate uses source/<published paths>; a checkout uses repo/<paths>.
    check_rows(base, rows, len(expected))
    return {'manifest_sha256': digest(raw), 'source_files': rows, 'inputs': retained['files'],
            't3_prerequisite': browser, 'server_exact_copies': copies}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, required=True)
    parser.add_argument('--inputs-only', action='store_true')
    args = parser.parse_args(); repo = Path(os.path.abspath(args.repo))
    if args.inputs_only:
        value = {'inputs': len(inputs(repo)['files']), 't3_files': len(t3()['source_files']), 'server_copies': len(preserved(repo))}
    else:
        value = {'source_files': len(sources(repo, HERE == repo / PREFIX)['source_files'])}
    print(json.dumps({'status':'SOURCE PREFLIGHT PASS; NO EXECUTION', **value}))
