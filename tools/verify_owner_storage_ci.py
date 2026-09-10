"""Accept bounded C04 reports only against the actual checkout; never read learner data."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess

SOURCE_PATHS = (
    'js/institution-client.js', 'js/owner-storage.mjs', 'sw.js',
    'tools/test_canonical_owner_authority.mjs', 'tools/test_owner_storage.mjs',
    'tools/test_owner_worker.mjs', 'tools/test_owner_storage_browser.mjs',
    'tools/test_mastery_sync.mjs', 'tools/test_platform_resilience.mjs',
    'tools/test_institution_identity_mount.mjs', 'tools/test_public_question_worker.mjs',
    'tools/test_mastery_worker.mjs', 'tools/fixtures/institution-client.pre-c04.js',
    'tools/fixtures/c04-prior-worker.js', 'tools/fixtures/c02-prior-worker.js',
    'question-bank/js/learning-system.js', 'js/institution-mastery-evidence.js',
    'question-bank/official/tools/package.json', 'question-bank/official/tools/package-lock.json',
    '.github/workflows/owner-storage.yml', 'tools/verify_owner_storage_ci.py',
    'tools/test_owner_storage_ci.py',
)
REPORT_NAMES = ('core.json', 'client.json', 'worker.json', 'browser.json',
                'c01-worker.json', 'c02-worker.json')
LOG_MARKERS = {
    'sync.log': 'Mastery sync: PASS (raw engine/bridge/event payloads, owned queues, account races, retries, completions)',
    'resilience.log': 'Platform resilience: PASS (session races, timeouts, sync payloads, queue ownership, private caching, optional assets)',
    'identity.log': 'Institution identity mount regression test: PASS',
    'c01-worker.log': 'Public question worker: 26 groups PASS',
    'c02-worker.log': 'Mastery worker: 12 groups PASS',
}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def read_bounded(path):
    with path.open('rb') as stream:
        data = stream.read(1024 * 1024 + 1)
    if len(data) > 1024 * 1024:
        raise ValueError('oversized evidence')
    return data


def validate(root, reports, outcomes):
    """Return safe diagnostics; false/zero and missing fields never imply acceptance."""
    errors = []
    def require(condition, label):
        if not condition:
            errors.append(label)
    require(outcomes == {'contracts': 'success', 'browser': 'success'}, 'step outcomes')
    loaded = {}
    for name in REPORT_NAMES:
        try:
            value = json.loads(read_bounded(reports / name))
            if type(value) is not dict:
                raise ValueError('report object')
            loaded[name] = value
        except (OSError, ValueError, TypeError):
            errors.append('missing or invalid ' + name)
    def integer(value, expected):
        return type(value) is int and value == expected
    def result_rows(value, count):
        return (type(value) is list and len(value) == count
                and all(type(row) is dict and type(row.get('name')) is str
                        and row['name'].strip() and row.get('status') == 'PASS' for row in value)
                and len({row['name'] for row in value}) == count)
    hashes = {p: digest((root / p).read_bytes()) for p in SOURCE_PATHS}
    for name, contract, count in (
        ('core.json', 'echs.c04.owner-storage-tests.v1', 21),
        ('client.json', 'echs.c04.canonical-owner-authority-tests.v1', 28),
        ('browser.json', 'echs.c04.owner-browser.v1', 8),
    ):
        report = loaded.get(name, {})
        require(report.get('contract') == contract and report.get('status') == 'PASS', name + ' contract/status')
        require(integer(report.get('groups' if name == 'browser.json' else 'checks'), count)
                and integer(report.get('passed'), count) and result_rows(report.get('results'), count), name + ' exact results')
        require(integer(report.get('production_calls'), 0), name + ' production calls')
        if name != 'browser.json':
            require(report.get('raw_storage_adoption') is False, name + ' adoption scope')
    core = loaded.get('core.json', {})
    require(core.get('source') == 'js/owner-storage.mjs'
            and core.get('source_sha256') == hashes['js/owner-storage.mjs'], 'core source')
    client = loaded.get('client.json', {})
    require(client.get('source_sha256') == hashes['js/institution-client.js']
            and client.get('core_sha256') == hashes['js/owner-storage.mjs']
            and client.get('baseline_sha256') == hashes['tools/fixtures/institution-client.pre-c04.js'], 'client source closure')
    worker = loaded.get('worker.json', {})
    names = worker.get('checks')
    require(worker.get('contract') == 'echs.c04.owner-worker.v1' and worker.get('status') == 'PASS'
            and type(names) is list and len(names) == 8
            and all(type(n) is str and n.strip() for n in names) and len(set(names)) == 8, 'worker exact results')
    require(worker.get('source_sha256') == hashes['sw.js'] and integer(worker.get('production_calls'), 0), 'worker source/scope')
    expected_assets = ['js/institution-client.js', 'js/owner-storage.mjs']
    require(worker.get('paths') == expected_assets, 'worker asset boundary')
    browser = loaded.get('browser.json', {})
    require(browser.get('source_unchanged_during_run') is True and browser.get('unexpected_network') == []
            and integer(browser.get('active_source_edits'), 0), 'browser lifecycle/network scope')
    require(browser.get('source_files') == [
        {'path': p, 'bytes': (root / p).stat().st_size, 'sha256': hashes[p]} for p in expected_assets
    ], 'browser source closure')
    for name, count in [('c01-worker.json', 26), ('c02-worker.json', 12)]:
        report = loaded.get(name, {})
        require(report.get('status') == 'PASS' and integer(report.get('passed'), count)
                and result_rows(report.get('checks'), count), name + ' exact results')
    c01 = loaded.get('c01-worker.json', {})
    require(c01.get('stage') == 'ECHS-C01' and c01.get('suite') == 'public-question-service-worker'
            and c01.get('production_calls') is False and c01.get('external_network') is False, 'C01 contract/scope')
    c02 = loaded.get('c02-worker.json', {})
    require(c02.get('contract') == 'echs.mastery-worker.v1' and c02.get('source_sha256') == hashes['sw.js']
            and integer(c02.get('production_calls'), 0), 'C02 contract/source/scope')
    for name, marker in LOG_MARKERS.items():
        try:
            require(marker in read_bounded(reports / name).decode('utf-8').splitlines(), name + ' acceptance marker')
        except (OSError, ValueError, UnicodeError):
            errors.append('missing or invalid ' + name)
    return errors


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--reports', type=Path, default=Path('artifacts/owner-storage'))
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    reports = args.reports.resolve()
    reports.mkdir(parents=True, exist_ok=True)
    outcomes = {'contracts': os.environ.get('CONTRACT_OUTCOME'), 'browser': os.environ.get('BROWSER_OUTCOME')}
    errors = validate(root, reports, outcomes)
    git = lambda *args: subprocess.check_output(['git', *args], cwd=root, text=True).strip()
    source_files = []
    for p in SOURCE_PATHS:
        data = (root / p).read_bytes()
        blob = hashlib.sha1(b'blob ' + str(len(data)).encode('ascii') + b'\0' + data).hexdigest()
        if git('rev-parse', 'HEAD:' + p) != blob:
            errors.append('checkout source changed: ' + p)
        source_files.append({'path': p, 'bytes': len(data), 'sha256': digest(data), 'git_blob_sha': blob})
    metadata = {
        'contract': 'echs.c04.ownership-ci.v1', 'status': 'FAIL' if errors else 'PASS',
        'checkout_sha': git('rev-parse', 'HEAD'), 'tree_sha': git('rev-parse', 'HEAD^{tree}'),
        'run_id': os.environ['GITHUB_RUN_ID'], 'step_outcomes': outcomes,
        'source_files': source_files,
        'reports': [{'path': p.name, 'sha256': digest(read_bounded(p))} for p in sorted(reports.iterdir())
                    if p.name != 'ci-metadata.json' and p.suffix in ('.json', '.log')],
        'errors': errors, 'production_calls': 0, 'whole_c04_complete': False,
        'limits': ['The unchanged C01 approved corpus is bound by the tested checkout tree and source-derived worker assertions; corpus payloads are not copied into this evidence bundle.',
                   'Local synthetic/browser ownership contracts do not establish production deployment or legacy storage adoption.'],
    }
    (reports / 'ci-metadata.json').write_text(json.dumps(metadata, indent=2) + '\n', encoding='utf-8')
    if errors:
        raise SystemExit('Ownership evidence rejected: ' + '; '.join(errors))
    print('Ownership evidence: PASS (21 core, 28 client, 8 worker, 8 browser, C01 26, C02 12)')


if __name__ == '__main__':
    main()
