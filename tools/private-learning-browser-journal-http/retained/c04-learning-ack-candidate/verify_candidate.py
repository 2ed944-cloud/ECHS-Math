"""Bounded read-only source and native-evidence verification for isolated T3."""
import argparse
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
MANIFEST = 'source-manifest-v1.json'
T2 = 'c04-learning-wire-binding-candidate/'
T2_MANIFEST = T2 + 'source-manifest-v3.json'
SOURCE_PATHS = [
    'source/js/owned-learning-store.mjs', 'source/js/owned-learning-transport.mjs',
    'source/question-bank/js/learning-transition.mjs', 'source/question-bank/js/practice-flow.mjs',
    'browser-page.mjs', 'test_browser.mjs', 'source/js/wire-binding-model.mjs',
    'source/js/journal/wire.mjs', 'source/js/journal/contract.mjs', 'source/js/journal/pending-intent.mjs',
    'test_adversarial.mjs', 'COPY_RECEIPT.json', 'T1_V3_COPY_RECEIPT.json', 'T2_COPY_RECEIPT.json',
    'T3_SOURCE_OVERVIEW.md', 'README.md', 'verify_candidate.py',
]
FIXED_INPUTS = {
    T2_MANIFEST: '34d4640a7fb9176ce93500bdc50ce9273b3be3791f99446e79a0282b92666968',
    'c04-independent/t3-ack-review-outline-v1.md': 'f047ba2a8af5c87b27fbe32916115dadd0f2a27a2af591056e664f8c60b97630',
    'c04-independent/t2-cleanup-reentrant-counterexample-v1.mjs': '69b4e701a1f4586834eeaf29e2feb4885e098dc49f72fc6d84abd5ec84c5ac61',
    'c04-independent/t2-cleanup-reentrant-counterexample-v1.json': '2c94d35265ef9e864199f6f0240b6bac8d9d9770528fc54aae87a44a3c143f41',
    'c04-independent/t3-terminal-origin-counterexample-v2.mjs': '7bd8c3f331018e3cb88fb68175401872cae60359961e205bfe9077961009f7ff',
    'c04-independent/t3-terminal-origin-counterexample-v2.json': 'bd10968e6e1ed6e0dffd5ef6a0248b1afc43a5aff4198ca2e2d5a9d6d3651d55',
}

def require(value, label):
    if not value:
        raise ValueError(label)

def info(path, name):
    data = path.read_bytes()
    return {'path': name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}

def read(path):
    return json.loads(path.read_text(encoding='utf-8'))

def input_paths():
    predecessor = read(ROOT / T2_MANIFEST)
    return list(dict.fromkeys([
        *[r['path'] for r in predecessor['input_files']], T2_MANIFEST,
        *[T2 + r['path'] for r in predecessor['source_files']],
        *[p for p in FIXED_INPUTS if p != T2_MANIFEST],
        'c04-independent/t3-terminal-origin-counterexample-v2.mjs',
    ]))

def verify(manifest):
    require(manifest['contract'] == 'echs.c04.ack-candidate.v1' and manifest['stage'] == 'ISOLATED_T3_LOCAL_CANDIDATE_ONLY', 'manifest boundary')
    for path, digest in FIXED_INPUTS.items():
        require(info(ROOT / path, path)['sha256'] == digest, 'fixed predecessor ' + path)
    predecessor = read(ROOT / T2_MANIFEST)
    for row in predecessor['source_files']:
        require(info(ROOT / T2 / row['path'], row['path']) == row, 'frozen T2 source changed')
    for row in predecessor['input_files']:
        require(info(ROOT / row['path'], row['path']) == row, 'frozen T2 input changed')
    sources = [info(HERE / p, p) for p in SOURCE_PATHS]
    inputs = [info(ROOT / p, p) for p in input_paths()]
    require(sources == manifest['source_files'], 'exact17 source freeze')
    require(inputs == manifest['input_files'], 'exact input closure')
    copied = read(HERE / 'T2_COPY_RECEIPT.json')
    require(copied['frozen_T2_manifest_sha256'] == FIXED_INPUTS[T2_MANIFEST], 'copy manifest pin')
    require(len(copied['files']) == 14, 'exact14 predecessor copies')
    for row in copied['files']:
        actual = info(ROOT / row['from'], row['from'])
        require(actual['bytes'] == row['bytes'] and actual['sha256'] == row['sha256'], 'preserved original copy')
        if row['to'] in SOURCE_PATHS[1:4] + SOURCE_PATHS[7:10] + ['COPY_RECEIPT.json', 'T1_V3_COPY_RECEIPT.json']:
            actual = info(HERE / row['to'], row['to'])
            require(actual['bytes'] == row['bytes'] and actual['sha256'] == row['sha256'], 'fixed copied bytes changed')
    original = (ROOT / T2 / 'test_browser.mjs').read_text(encoding='utf-8').split("await test('S01", 1)[1].split('}finally{await browser.close()', 1)[0].strip()
    current = (HERE / 'test_browser.mjs').read_text(encoding='utf-8').split("await test('S01", 1)[1].split("await test('A01", 1)[0].strip()
    require(original == current, 'original61 case bodies/assertions changed')
    results = []
    for key, contract, count, source_count in [
        ('browser_evidence', 'echs.c04.ack-browser-tests.v1', 84, 10),
        ('adversarial_evidence', 'echs.c04.ack-adversarial-tests.v1', 14, 11),
    ]:
        proof = manifest[key]
        require(info(HERE / proof['path'], proof['path']) == proof, 'native report identity')
        result = read(HERE / proof['path'])
        require(result['contract'] == contract and result['status'] == 'PASS', 'native report status')
        require(result['groups'] == result['passed'] == count and result['failed'] == result['skipped'] == 0, 'exact native groups')
        require(len(result['outcomes']) == count and all(r['status'] == 'PASS' for r in result['outcomes']), 'native outcomes')
        require(len({r['name'] for r in result['outcomes']}) == count, 'unique native outcomes')
        require(result['source_files'] == sources[:source_count], 'native report not bound to final exact JS sources')
        require(result['unexpected_requests'] == result['page_errors'] == [], 'unexpected browser event')
        results.append(result)
    quota = results[1]['outcomes'][0]['details']
    require(quota['code'] == 'storage_error' and 'QuotaExceededError' in quota['native_abort_errors'] and quota['retry_acknowledged'] is True and quota['write_free_wait_ms'] == 32000 and quota['quota_override'] == 1024, 'actual physical ACK quota and recovery')
    require(quota['browser_build']['revision'].startswith('@') and quota['browser_build']['product'].startswith('Chrome/'), 'actual browser build observed')
    require(manifest['database_migrations'] == [] and manifest['active_runtime_changed'] is False and manifest['actual_http_accepted'] is False and manifest['production_authority_accepted'] is False, 'isolation claims')
    return {'contract': 'echs.c04.ack-source-check.v1', 'status': 'PASS', 'sources': len(sources), 'inputs': len(inputs),
            'main_browser_groups': 84, 'adversarial_browser_groups': 14, 'original_T2_case_bodies_preserved': 61,
            'scope': 'Exact-byte verification of isolated T3 native mechanics and actual browser quota. Synthetic authority/delivery evidence; no real HTTP, active adoption or grading acceptance.'}

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--report', required=True)
    args = parser.parse_args()
    result = verify(read(HERE / MANIFEST))
    result['manifest'] = info(HERE / MANIFEST, MANIFEST)
    with Path(args.report).open('x', encoding='utf-8', newline='\n') as out:
        json.dump(result, out, indent=2)
        out.write('\n')
    print(json.dumps(result))
