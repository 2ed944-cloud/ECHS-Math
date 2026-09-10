"""Synthetic evidence negatives; no browser, source mutation, or production access."""
import copy
import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from verify_owner_storage_ci import LOG_MARKERS, REPORT_NAMES, validate

ROOT = Path(__file__).resolve().parents[1]


def fixture():
    sha = lambda p: hashlib.sha256((ROOT / p).read_bytes()).hexdigest()
    rows = lambda n: [{'name': 'independent case ' + str(i), 'status': 'PASS'} for i in range(n)]
    reports = {}
    for name, contract, count in [
        ('core.json', 'echs.c04.owner-storage-tests.v1', 21),
        ('client.json', 'echs.c04.canonical-owner-authority-tests.v1', 28),
        ('browser.json', 'echs.c04.owner-browser.v1', 8),
    ]:
        reports[name] = {'contract': contract, 'status': 'PASS', 'passed': count,
                         'groups' if name == 'browser.json' else 'checks': count,
                         'results': rows(count), 'production_calls': 0, 'raw_storage_adoption': False}
    reports['core.json'].update(source='js/owner-storage.mjs', source_sha256=sha('js/owner-storage.mjs'))
    reports['client.json'].update(source_sha256=sha('js/institution-client.js'),
                                 core_sha256=sha('js/owner-storage.mjs'),
                                 baseline_sha256=sha('tools/fixtures/institution-client.pre-c04.js'))
    reports['browser.json'].update(source_unchanged_during_run=True, unexpected_network=[], active_source_edits=0,
                                  source_files=[{'path': p, 'bytes': (ROOT / p).stat().st_size, 'sha256': sha(p)}
                                                for p in ['js/institution-client.js', 'js/owner-storage.mjs']])
    reports['worker.json'] = {'contract': 'echs.c04.owner-worker.v1', 'status': 'PASS',
                              'checks': ['worker case ' + str(i) for i in range(8)], 'source_sha256': sha('sw.js'),
                              'paths': ['js/institution-client.js', 'js/owner-storage.mjs'], 'production_calls': 0}
    reports['c01-worker.json'] = {'stage': 'ECHS-C01', 'suite': 'public-question-service-worker',
                                  'status': 'PASS', 'passed': 26, 'checks': rows(26),
                                  'production_calls': False, 'external_network': False}
    reports['c02-worker.json'] = {'contract': 'echs.mastery-worker.v1', 'status': 'PASS', 'passed': 12,
                                  'checks': rows(12), 'source_sha256': sha('sw.js'), 'production_calls': 0}
    return reports


class EvidenceTests(unittest.TestCase):
    def check_reports(self, reports=None, outcomes=None, log_override=None):
        reports = fixture() if reports is None else reports
        outcomes = {'contracts': 'success', 'browser': 'success'} if outcomes is None else outcomes
        with tempfile.TemporaryDirectory(prefix='echs-owner-evidence-') as name:
            path = Path(name)
            for p, value in reports.items():
                (path / p).write_text(json.dumps(value), encoding='utf-8')
            for p, value in LOG_MARKERS.items():
                (path / p).write_text((log_override or {}).get(p, value) + '\n', encoding='utf-8')
            return validate(ROOT, path, outcomes)

    def test_01_accept_exact_fixture(self):
        self.assertEqual(self.check_reports(), [])

    def test_02_every_missing_report_rejected(self):
        for name in REPORT_NAMES:
            reports = fixture(); del reports[name]
            self.assertTrue(self.check_reports(reports), name)

    def test_03_wrong_contract_and_failed_status(self):
        for name in REPORT_NAMES:
            reports = fixture(); reports[name]['status'] = 'FAIL'
            self.assertTrue(self.check_reports(reports), name)
            reports = fixture(); reports[name]['contract' if name != 'c01-worker.json' else 'stage'] = 'foreign'
            self.assertTrue(self.check_reports(reports), name)

    def test_04_truncated_and_duplicate_results(self):
        for name in REPORT_NAMES:
            key = 'checks' if name in ('worker.json', 'c01-worker.json', 'c02-worker.json') else 'results'
            for duplicate in (False, True):
                reports = fixture(); rows = reports[name][key]
                if duplicate: rows[-1] = copy.deepcopy(rows[0])
                else: rows.pop()
                self.assertTrue(self.check_reports(reports), (name, duplicate))

    def test_05_count_types_and_false_zero(self):
        for name in ('core.json', 'client.json', 'browser.json', 'c01-worker.json', 'c02-worker.json'):
            for invalid in (True, '21', None, 0, 1):
                reports = fixture(); reports[name]['passed'] = invalid
                self.assertTrue(self.check_reports(reports), (name, invalid))
        for name in ('core.json', 'client.json', 'worker.json', 'browser.json', 'c02-worker.json'):
            reports = fixture(); reports[name]['production_calls'] = False
            self.assertTrue(self.check_reports(reports), name)

    def test_06_embedded_runtime_hashes(self):
        for name, fields in [('core.json', ['source_sha256']), ('client.json', ['source_sha256', 'core_sha256', 'baseline_sha256']),
                             ('worker.json', ['source_sha256']), ('c02-worker.json', ['source_sha256'])]:
            for field in fields:
                reports = fixture(); reports[name][field] = '0' * 64
                self.assertTrue(self.check_reports(reports), (name, field))

    def test_07_browser_source_closure(self):
        for change in ('missing', 'foreign', 'hash', 'size', 'duplicate'):
            reports = fixture(); rows = reports['browser.json']['source_files']
            if change == 'missing': rows.pop()
            elif change == 'duplicate': rows[-1] = copy.deepcopy(rows[0])
            else: rows[0][{'foreign': 'path', 'hash': 'sha256', 'size': 'bytes'}[change]] = 'foreign'
            self.assertTrue(self.check_reports(reports), change)

    def test_08_browser_lifecycle_and_network(self):
        for field, value in [('source_unchanged_during_run', 1), ('unexpected_network', ['https://unapproved.invalid/']),
                             ('active_source_edits', 1), ('production_calls', 1)]:
            reports = fixture(); reports['browser.json'][field] = value
            self.assertTrue(self.check_reports(reports), field)

    def test_09_failed_skipped_and_missing_steps(self):
        for field in ('contracts', 'browser'):
            for value in ('failure', 'skipped', None):
                outcomes = {'contracts': 'success', 'browser': 'success'}; outcomes[field] = value
                self.assertTrue(self.check_reports(outcomes=outcomes), (field, value))

    def test_10_legacy_acceptance_markers(self):
        for name in LOG_MARKERS:
            self.assertTrue(self.check_reports(log_override={name: 'started but never finished'}), name)

    def test_11_adoption_and_C01_scope_flags(self):
        for name, field in [('core.json', 'raw_storage_adoption'), ('client.json', 'raw_storage_adoption'),
                             ('c01-worker.json', 'production_calls'), ('c01-worker.json', 'external_network')]:
            for value in (0, True, None):
                reports = fixture(); reports[name][field] = value
                self.assertTrue(self.check_reports(reports), (name, field, value))

    def test_12_failed_result_and_worker_boundary(self):
        for name in ('core.json', 'client.json', 'browser.json', 'c01-worker.json', 'c02-worker.json'):
            reports = fixture(); reports[name]['results' if name in ('core.json', 'client.json', 'browser.json') else 'checks'][0]['status'] = 'FAIL'
            self.assertTrue(self.check_reports(reports), name)
        reports = fixture(); reports['worker.json']['paths'].append('js/unknown.js')
        self.assertTrue(self.check_reports(reports))


if __name__ == '__main__':
    unittest.main(verbosity=2)
