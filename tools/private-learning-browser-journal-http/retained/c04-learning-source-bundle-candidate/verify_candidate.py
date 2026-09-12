"""Bounded, read-only source/provenance and native-result verification."""
import argparse
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
SOURCE_PATHS = [
    'source/js/owned-learning-store.mjs',
    'source/js/owned-learning-transport.mjs',
    'source/question-bank/js/learning-transition.mjs',
    'source/question-bank/js/practice-flow.mjs',
    'browser-page.mjs', 'test_browser.mjs', 'COPY_RECEIPT.json',
    'README.md', 'verify_candidate.py',
]
FIXED_INPUTS = {
    'c04-learning-p2b-candidate/candidate-manifest.json': '817c3395b1589c74391cce55fd7dffdae9de3a28c2b1f9fd90e371428c788722',
    'c04-durable-intent-candidate/source-manifest.json': 'f449d38c6dbf32f29162b327078966076a4afaf24ca39b93909f8c11934685fd',
    'c04-journal-http-candidate-v2/source-manifest.json': '117cdb0a97cd4408b31fedf9f4eba5928b1385f5e2a86d6ee5e55c750c286817',
}


def require(value, message):
    if not value:
        raise ValueError(message)


def info(path, name):
    data = path.read_bytes()
    return {'path': name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


def verify():
    manifest = json.loads((HERE / 'source-manifest-v1.json').read_text(encoding='utf-8'))
    require(manifest['contract'] == 'echs.c04.source-bundle-candidate.v1', 'manifest contract')
    require([r['path'] for r in manifest['source_files']] == SOURCE_PATHS, 'exact nine sources')
    sources = [info(HERE / p, p) for p in SOURCE_PATHS]
    require(sources == manifest['source_files'], 'source bytes differ from freeze')
    for path, digest in FIXED_INPUTS.items():
        require(info(ROOT / path, path)['sha256'] == digest, 'fixed predecessor ' + path)
    inputs = [info(ROOT / r['path'], r['path']) for r in manifest['input_files']]
    require(inputs == manifest['input_files'], 'input bytes changed')
    copy = json.loads((HERE / 'COPY_RECEIPT.json').read_text(encoding='utf-8'))
    require(copy['frozen_p2b_manifest_sha256'] == FIXED_INPUTS['c04-learning-p2b-candidate/candidate-manifest.json'], 'copy manifest')
    for r in copy['source_files'] + copy['preserved_original_tests']:
        expected = {k: r[k] for k in ['path', 'bytes', 'sha256']}
        require(info(ROOT / 'c04-learning-p2b-candidate' / r['path'], r['path']) == expected, 'original source or test changed')
    for r in copy['source_files'][1:]:
        require(info(HERE / r['path'], r['path']) == r, 'copied fixed transition/transport changed')
    proof = manifest['native_evidence']
    require(info(HERE / proof['path'], proof['path']) == proof, 'native evidence changed')
    result = json.loads((HERE / proof['path']).read_text(encoding='utf-8'))
    require(result['contract'] == 'echs.c04.source-bundle-browser-tests.v1', 'native report contract')
    require(result['status'] == 'PASS' and result['groups'] == result['passed'] == 29 and result['failed'] == result['skipped'] == 0, 'native groups')
    require(len(result['outcomes']) == 29 and all(r['status'] == 'PASS' for r in result['outcomes']), 'native outcomes')
    require(len({r['name'] for r in result['outcomes']}) == 29, 'unique outcomes')
    require(result['source_files'] == sources[:6], 'native evidence not exact current six JS files')
    require(result['unexpected_requests'] == result['page_errors'] == [], 'unexpected browser event')
    require(result['original_manifest_sha256'] == copy['frozen_p2b_manifest_sha256'], 'native original identity')
    return {
        'contract': 'echs.c04.source-bundle-source-check.v1', 'status': 'PASS',
        'sources': len(sources), 'inputs': len(inputs), 'native_groups': 29,
        'manifest': info(HERE / 'source-manifest-v1.json', 'source-manifest-v1.json'),
        'scope': 'Read-only exact-byte verification. No active runtime, database migration, T2/T3 or remote test claim.',
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--report', required=True)
    args = parser.parse_args()
    report = verify()
    with Path(args.report).open('x', encoding='utf-8', newline='\n') as out:
        json.dump(report, out, indent=2)
        out.write('\n')
    print(json.dumps(report))
