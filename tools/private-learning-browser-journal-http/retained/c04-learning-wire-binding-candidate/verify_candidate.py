"""Read-only exact-byte provenance and native evidence verification for isolated T2."""
import argparse
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
SOURCE_PATHS = [
    'source/js/owned-learning-store.mjs', 'source/js/owned-learning-transport.mjs',
    'source/question-bank/js/learning-transition.mjs', 'source/question-bank/js/practice-flow.mjs',
    'browser-page.mjs', 'test_browser.mjs', 'source/js/wire-binding-model.mjs',
    'source/js/journal/wire.mjs', 'source/js/journal/contract.mjs', 'source/js/journal/pending-intent.mjs',
    'COPY_RECEIPT.json', 'T1_V3_COPY_RECEIPT.json', 'README.md', 'verify_candidate.py',
]
T1 = 'c04-learning-source-bundle-candidate/'
V3 = 'c04-journal-http-candidate-v3/'
FIXED_INPUTS = {
    T1 + 'source-manifest-v1.json': '1497ab6384d016be37af7d52eb451d7693ba54a46009e9e7940829b7b0478b66',
    V3 + 'source-manifest.json': '84284f19b00a26b8ee30ed2567132b7913e0a0c8e5cb7c80e4167f62d778445c',
    'c04-learning-p2b-candidate/candidate-manifest.json': '817c3395b1589c74391cce55fd7dffdae9de3a28c2b1f9fd90e371428c788722',
    'c04-durable-intent-candidate/source-manifest.json': 'f449d38c6dbf32f29162b327078966076a4afaf24ca39b93909f8c11934685fd',
    'c04-journal-http-candidate-v2/source-manifest.json': '117cdb0a97cd4408b31fedf9f4eba5928b1385f5e2a86d6ee5e55c750c286817',
    'c04-independent/t2-binding-proposal-v1.md': 'fdbf5003ed39ab5b30350c74ca059dd3026890452f6668dad51da5c4fcd56059',
    'c04-journal-pg-matrix-candidate-v2/source/tools/private-learning-operation-journal/operation-journal.sql': '9ce98da90d5c141fdf184d32a00067eca1aaa800870204edd9c383cc22b1e1bf',
}

def require(value, message):
    if not value:
        raise ValueError(message)

def info(path, name):
    data = path.read_bytes()
    return {'path': name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}

def read(path):
    return json.loads(path.read_text(encoding='utf-8'))

def input_paths():
    t1 = read(ROOT / T1 / 'source-manifest-v1.json')
    return list(dict.fromkeys([
        *[r['path'] for r in t1['input_files']],
        T1 + 'source-manifest-v1.json',
        *[T1 + r['path'] for r in t1['source_files']],
        V3 + 'source-manifest.json', *[V3 + p for p in ['wire.mjs', 'contract.mjs', 'pending-intent.mjs']],
        'c04-independent/t2-binding-proposal-v1.md',
        'c04-journal-pg-matrix-candidate-v2/source/tools/private-learning-operation-journal/operation-journal.sql',
    ]))

def verify():
    manifest = read(HERE / 'source-manifest-v3.json')
    require(manifest['contract'] == 'echs.c04.wire-binding-candidate.v1', 'manifest contract')
    require(manifest['stage'] == 'FUTURE_T1_FIRST_T2_LOCAL_CANDIDATE_ONLY', 'stage')
    for path, digest in FIXED_INPUTS.items():
        require(info(ROOT / path, path)['sha256'] == digest, 'fixed predecessor ' + path)
    sources = [info(HERE / p, p) for p in SOURCE_PATHS]
    require([r['path'] for r in manifest['source_files']] == SOURCE_PATHS, 'exact fourteen sources')
    require(sources == manifest['source_files'], 'source bytes differ from freeze')
    inputs = [info(ROOT / p, p) for p in input_paths()]
    require(inputs == manifest['input_files'], 'exact input closure differs')
    t1 = read(ROOT / T1 / 'source-manifest-v1.json')
    for r in t1['source_files']:
        require(info(ROOT / T1 / r['path'], r['path']) == r, 'frozen T1 source changed')
    for r in t1['input_files']:
        require(info(ROOT / r['path'], r['path']) == r, 'frozen T1 input changed')
    copy = read(HERE / 'COPY_RECEIPT.json')
    origin = read(HERE / 'T1_V3_COPY_RECEIPT.json')
    require(origin['t1_manifest_sha256'] == FIXED_INPUTS[T1 + 'source-manifest-v1.json'], 'copy T1 pin')
    require(origin['j049_v3_manifest_sha256'] == FIXED_INPUTS[V3 + 'source-manifest.json'], 'copy V3 pin')
    for r in origin['files']:
        actual = info(ROOT / r['from'], r['from'])
        require(actual['sha256'] == r['sha256'] and actual['bytes'] == r['bytes'], 'preserved original ' + r['from'])
        if r['to'] in SOURCE_PATHS[1:4] + SOURCE_PATHS[7:11]:
            actual = info(HERE / r['to'], r['to'])
            require(actual['sha256'] == r['sha256'] and actual['bytes'] == r['bytes'], 'fixed runtime copy ' + r['to'])
    for r in copy['source_files'] + copy['preserved_original_tests']:
        require(info(ROOT / 'c04-learning-p2b-candidate' / r['path'], r['path']) == {k:r[k] for k in ['path','bytes','sha256']}, 'P2b source/test changed')
    original_cases = (ROOT / T1 / 'test_browser.mjs').read_text(encoding='utf-8').split("await test('S01", 1)[1].split('}finally{await browser.close()', 1)[0].strip()
    current_cases = (HERE / 'test_browser.mjs').read_text(encoding='utf-8').split("await test('S01", 1)[1].split("await test('T01", 1)[0].strip()
    require(current_cases == original_cases, 'original 29 case bodies or assertions changed')
    proof = manifest['browser_evidence']
    require(info(HERE / proof['path'], proof['path']) == proof, 'browser evidence changed')
    result = read(HERE / proof['path'])
    require(result['contract'] == 'echs.c04.wire-binding-browser-tests.v1', 'browser report contract')
    require(result['status'] == 'PASS' and result['groups'] == result['passed'] == 61 and result['failed'] == result['skipped'] == 0, '61 browser groups')
    require(len(result['outcomes']) == 61 and all(r['status'] == 'PASS' for r in result['outcomes']), 'browser outcomes')
    require(len({r['name'] for r in result['outcomes']}) == 61, 'unique outcomes')
    require(result['source_files'] == sources[:10], 'browser evidence not exact ten JS sources')
    require(result['unexpected_requests'] == result['page_errors'] == [], 'unexpected browser event')
    require(result['original_manifest_sha256'] == copy['frozen_p2b_manifest_sha256'], 'browser original identity')
    require(manifest['database_migrations'] == [] and manifest['active_runtime_changed'] is False and manifest['network_transport_connected'] is False and manifest['T3_accepted'] is False, 'isolation claims')
    return {'contract': 'echs.c04.wire-binding-source-check.v1', 'status': 'PASS',
            'sources': len(sources), 'inputs': len(inputs), 'browser_groups': 61, 'original_T1_case_bodies_preserved': 29,
            'manifest': info(HERE / 'source-manifest-v3.json', 'source-manifest-v3.json'),
            'scope': 'Read-only exact-byte check. Native IndexedDB with synthetic port/authority and one labeled pure-model group. No actual HTTP, active runtime, T3 ACK, adoption or grading acceptance.'}

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--report', required=True)
    args = parser.parse_args()
    report = verify()
    with Path(args.report).open('x', encoding='utf-8', newline='\n') as out:
        json.dump(report, out, indent=2)
        out.write('\n')
    print(json.dumps(report))
