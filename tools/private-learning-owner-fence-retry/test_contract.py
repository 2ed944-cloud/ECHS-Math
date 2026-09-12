"""Offline successor and stop-boundary tests; never connect or start a service."""
import ast
import copy
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

import contract
import fixture
import run_services
import test_retry_http as retry
import test_retry_sql
import assemble


def synthetic_services():
    """Metadata validator input only. No socket, database or actual result file."""
    own = contract.snapshot(); pins, _ = contract.sources()
    checkout = {'tested_sha': '1' * 40, 'tested_tree': '2' * 40}
    images = {name: {'tag': tag, 'image_id': 'sha256:' + digit * 64,
        'repository_digest': tag.rsplit(':', 1)[0] + '@sha256:' + digit * 64}
        for name, tag, digit in (('db', 'postgres:15', '3'), ('rest', 'postgrest/postgrest:v14.17', '4'))}
    run = {'contract': 'echs.c04.owner-fence-retry-service-run.v1', 'status': assemble.SERVICE_STATUS,
        'run_id': '5' * 32, 'postgres_major': 15, 'production_calls': 0, 'hosted_edge_executed': False,
        'tls_executed': False, 'browser_persistence_executed': False, 'service_start_attempted': True,
        'cleanup_complete': True, **checkout,
        'installation': {'migrations': 27, 'journal_owners_initial': 0, 'postgres_version': '15.19', 'storage_service_executed': False},
        'network': {'name': 'echs-journal-http-' + '5' * 32, 'network_id': '6' * 64, 'internal': True,
            'published_ports': False, 'services': {name: {'container_id': digit * 64, 'ipv4': ip, 'image_id': images[name]['image_id']}
                for name, digit, ip in (('db', '7', '172.18.0.2'), ('rest', '8', '172.18.0.3'))}},
        'readiness': {'http_status': 403, 'code': '28000', 'ready': True}, 'fresh_sql_denial_observed': True,
        'groups': 20, 'focused_sql_groups': 9, 'retry_http_groups': 2,
        'r12_reference': 'The unchanged twenty J049 HTTP cases above are counted once.'}
    labels = assemble.node_labels('test_http.mjs', 'S')
    http = {'contract': 'echs.c04.journal-http-actual.v1', 'status': 'ACTUAL HTTP POSTGREST SQL PASS',
        'planned_groups': labels, 'checks': labels[:], 'real_http_executed': True, 'postgrest_executed': True,
        'database_executed': True, 'hosted_edge_executed': False, 'tls_executed': False,
        'browser_persistence_executed': False, 'production_calls': 0, 'http_attempted': True,
        'http_metrics': {'requests': 42, 'responses': 40, 'dropped': 2},
        'rpc_observations': [{'route': 'learning_journal_apply', 'status': 200} for _ in range(40)],
        'source_files': assemble.source_rows(own, assemble.HTTP_SOURCES), 'control_reaped': True}
    focused = {'contract': 'echs.c04.owner-fence-retry-focused-sql.v1', 'status': 'ACTUAL FOCUSED SQL R01-R09 PASS',
        'planned_groups': list(test_retry_sql.EXPECTED_LABELS), 'checks': list(test_retry_sql.EXPECTED_LABELS),
        'postgres_major': 15, 'database_executed': True, 'postgrest_executed': False, 'production_calls': 0,
        'source_files': own, 'dedicated_fresh_database': True, 'postgres_version': '15.19', 'source_unchanged': True,
        'details': {'deliberate_absence_55000': 29, 'native_serialization_40001': 4, 'all_six_mutations': 18,
            'observed_lock_waits': 5, 'fixture_schema_acl_triggers_restored': True, 'journal_owners_remain_zero': True, 'production_calls': 0}}
    retry_http = {'contract': 'echs.c04.owner-fence-retry-http.v1', 'status': 'ACTUAL RETRY HTTP PASS; OWNED POSTGREST STOPPED',
        'planned_groups': list(retry.EXPECTED_LABELS), 'checks': list(retry.EXPECTED_LABELS), 'postgres_major': 15,
        'database_executed': True, 'postgrest_executed': True, 'production_calls': 0, 'hosted_edge_executed': False,
        'browser_persistence_executed': False, 'finite_missing_state_requests': 4, 'finite_missing_state_transaction_attempts': 4,
        'old_code_transaction_attempts_observed': 2, 'old_code_repeated': True, 'owned_postgrest_stopped': True,
        'owned_backend_count_after_stop': 0, 'explicitly_terminated_backends': 0, 'http_worker_reaped': True,
        'fixture_schema_acl_triggers_restored': True}
    receipt = {'manifest_sha256': own[contract.PREFIX + 'source-manifest.json']['sha256'],
        'source_files': json.loads((contract.HERE / 'source-manifest.json').read_bytes())['files'], 'inputs': pins['files']}
    doc = {'services/' + name: value for name, value in (
        ('run-report.json', run), ('image-receipt.json', images), ('http-results.json', http),
        ('retry-sql-results.json', focused), ('retry-http-results.json', retry_http), ('source-receipt.json', receipt))}
    raw = {name: json.dumps(value).encode() for name, value in doc.items()}
    index = {'status': assemble.SERVICE_STATUS, 'cleanup_complete': True,
        'members': [{'path': name.split('/')[1], 'bytes': len(value), 'sha256': contract.digest(value)} for name, value in raw.items()]}
    doc['services/artifact-index.json'] = index; raw['services/artifact-index.json'] = json.dumps(index).encode()
    return doc, raw, own, checkout


class Clock:
    def __init__(self): self.now = 0.0
    def __call__(self): return self.now
    def sleep(self, seconds): self.now += seconds


class Guards(unittest.TestCase):
    def test_01_exact_four_sql_and_four_fixture_replacements(self):
        self.assertEqual(contract.validate_delta()['sql_replacements'], 4)
        raw = (contract.HERE / 'owner-fence.sql').read_bytes()
        for changed in (raw + b'\n', raw.replace(b"errcode='55000'", b"errcode='40001'", 1)):
            with self.assertRaises(AssertionError): contract.validate_delta(sql_raw=changed)

    def test_02_native_serialization_sites_cannot_be_reclassified(self):
        raw = (contract.HERE / 'test_fence.py').read_bytes()
        self.assertEqual(raw.count(b"'40001'"), 2)
        with self.assertRaises(AssertionError):
            contract.validate_delta(fixture_raw=raw.replace(b"'40001'", b"'55000'", 1))
        self.assertEqual(len(contract.load_fence()[1]), 123)
        self.assertEqual(len(contract.planned_labels()), 48)

    def test_03_postgres_parser_accepts_both_exact_sql_buffers(self):
        import pglast
        self.assertEqual(pglast.__version__, 'v7.7')
        before = (contract.FENCE / 'owner-fence.sql').read_text()
        after = (contract.HERE / 'owner-fence.sql').read_text()
        self.assertEqual(len(pglast.parse_sql(before)), len(pglast.parse_sql(after)))
        self.assertGreater(len(pglast.parse_sql(after)), 20)

    def test_04_retained_source_graph_and_copied_j049_are_exact(self):
        pins, migrations = contract.sources()
        self.assertEqual((len(pins['files']), len(migrations)), (72, 27))
        for name in ('runtime/wire.mjs', 'runtime/contract.mjs', 'runtime/handler.mjs',
                     'runtime/pending-intent.mjs', 'test_http.mjs', 'test_bridge.mjs', 'bridge.mjs', 'controls.py'):
            self.assertEqual((contract.HERE / name).read_bytes(), (contract.HTTP / name).read_bytes())

    def test_05_new_manifest_never_borrows_old_source_authority(self):
        own = contract.snapshot()
        self.assertIn(contract.PREFIX + 'owner-fence.sql', own)
        self.assertIn(contract.PREFIX + 'source-manifest.json', own)
        self.assertNotIn('tools/private-learning-owner-fence/owner-fence.sql', own)
        self.assertEqual(contract.digest((contract.HERE / 'input-pins.json').read_bytes()), contract.INPUT_SHA)

    def test_06_fixed_counterexample_function_extraction(self):
        old = retry.function_buffer((contract.FENCE / 'owner-fence.sql').read_bytes())
        new = retry.function_buffer((contract.HERE / 'owner-fence.sql').read_bytes())
        self.assertEqual(old.count("errcode='40001'"), 1)
        self.assertEqual(new, old.replace("errcode='40001'", "errcode='55000'"))
        self.assertTrue(old.startswith('create or replace function private.learning_legacy_owner_guard()'))
        for bad in (b'', b'create function private.learning_legacy_owner_guard()'):
            with self.assertRaises(ValueError): retry.function_buffer(bad)

    def test_07_counter_requires_two_observed_transaction_attempts(self):
        clock = Clock(); values = iter((10, 11, 12))
        self.assertEqual(retry.observe_retries(lambda: next(values), 10, lambda: False,
                                              clock=clock, sleep=clock.sleep), 2)

    def test_08_completed_single_attempt_is_not_retry_evidence(self):
        clock = Clock()
        with self.assertRaisesRegex(ValueError, 'old-code-did-not-repeat'):
            retry.observe_retries(lambda: 11, 10, lambda: True, clock=clock, sleep=clock.sleep)

    def test_09_counter_observation_has_a_monotonic_deadline(self):
        clock = Clock()
        with self.assertRaisesRegex(ValueError, 'bounded-old-code-observation'):
            retry.observe_retries(lambda: 10, 10, lambda: False, clock=clock, sleep=clock.sleep, timeout=.03)
        self.assertLessEqual(clock.now, .05)

    def test_10_late_counter_progress_cannot_bypass_deadline(self):
        clock = Clock()
        def slow(): clock.now += 1; return 12
        with self.assertRaisesRegex(ValueError, 'bounded-old-code-observation'):
            retry.observe_retries(slow, 10, lambda: False, clock=clock, sleep=clock.sleep, timeout=.03)

    def test_11_backend_stop_precedes_termination_and_requires_absence(self):
        clock = Clock(); events = []; alive = [(101, 'fixture-start')]
        def stop(): events.append('stop'); return True
        def backends(): events.append('inspect'); return list(alive)
        def terminate(pid, start):
            events.append((pid, start)); alive.clear(); return True
        self.assertEqual(retry.stop_owned_backends(stop, backends, terminate, clock=clock, sleep=clock.sleep), 1)
        self.assertEqual(events, ['stop', 'inspect', (101, 'fixture-start'), 'inspect'])

    def test_12_unconfirmed_server_stop_cannot_claim_backend_cleanup(self):
        with self.assertRaisesRegex(ValueError, 'owned-postgrest-container-stopped'):
            retry.stop_owned_backends(lambda: False, lambda: self.fail('no backend authority'), lambda *_: False)

    def test_13_persistent_backends_fail_instead_of_claiming_cleanup(self):
        clock = Clock()
        with self.assertRaisesRegex(ValueError, 'owned-backend-stop-deadline'):
            retry.stop_owned_backends(lambda: True, lambda: [(101, 'fixture-start')], lambda *_: False,
                                      clock=clock, sleep=clock.sleep, timeout=.03)

    def test_14_late_empty_backend_snapshot_cannot_bypass_deadline(self):
        clock = Clock()
        def slow(): clock.now += 1; return []
        with self.assertRaisesRegex(ValueError, 'owned-backend-stop-deadline'):
            retry.stop_owned_backends(lambda: True, slow, lambda *_: False,
                                      clock=clock, sleep=clock.sleep, timeout=.03)

    def test_15_fixture_counter_is_configured_outside_production_sql(self):
        config = fixture.rest_environment('a' * 48, 'b' * 64)
        self.assertEqual(config['PGRST_DB_PRE_REQUEST'], 'public.owner_fence_retry_attempt')
        self.assertNotIn('owner_fence_retry_attempt', (contract.HERE / 'owner-fence.sql').read_text())
        self.assertIn('create sequence private.owner_fence_retry_attempts', Path(fixture.__file__).read_text())

    def test_16_focused_sql_contract_and_outer_process_bound_are_explicit(self):
        self.assertEqual(len(test_retry_sql.EXPECTED_LABELS), 9)
        self.assertEqual([x[:3] for x in test_retry_sql.EXPECTED_LABELS], [f'R{x:02d}' for x in range(1, 10)])
        tree = ast.parse(Path(run_services.__file__).read_text())
        calls = [n for n in ast.walk(tree) if isinstance(n, ast.Call) and isinstance(n.func, ast.Name)
                 and n.func.id == 'command' and any(isinstance(v, ast.Constant) and v.value == 'run_retry_sql.py' for v in ast.walk(n))]
        self.assertEqual(len(calls), 1)
        self.assertEqual(next(x.value.value for x in calls[0].keywords if x.arg == 'timeout'), 120)

    def test_17_workflow_has_closed_matrix_and_no_production_secrets(self):
        import yaml
        text = (contract.REPO / contract.WORKFLOW).read_text()
        data = yaml.safe_load(text)
        self.assertEqual(data['permissions'], {'contents': 'read'})
        job = data['jobs']['postgres']
        self.assertEqual(job['strategy']['matrix'], {'postgres_major': [15, 17]})
        self.assertFalse(job['strategy']['fail-fast'])
        self.assertNotIn('secrets.', text)
        self.assertNotIn('supabase.co', text)
        self.assertIn('persist-credentials: false', text)
        self.assertIn('run_sql.py', text)
        self.assertIn('run_services.py', text)

    def test_18_metadata_rejects_ambiguous_private_and_unbounded_values(self):
        for raw in (b'{"x":1,"x":2}', b'{"PASSWORD":"synthetic"}', b'{"x":NaN}', b'{"x":1e9999}',
                    b'\xff', b'[' * 25 + b'0' + b']' * 25, b'0' * 2097153):
            with self.subTest(raw_length=len(raw)), self.assertRaises((AssertionError, ValueError, UnicodeError)):
                assemble.decode(raw)
        self.assertEqual(assemble.decode(b'{"status":"PASS","count":2}'), {'status': 'PASS', 'count': 2})

    def test_19_boolean_cannot_impersonate_integer_evidence(self):
        for value, expected in ((True, 1), (False, 0), ({'count': True}, {'count': 1})):
            with self.assertRaises(AssertionError): assemble.exact(value, expected)
        with self.assertRaises(AssertionError): assemble.integer(True, minimum=0)

    def test_20_node_labels_and_metadata_members_are_closed(self):
        self.assertEqual(len(assemble.node_labels('test_http.mjs', 'S')), 20)
        self.assertEqual(len(assemble.node_labels('test_bridge.mjs', 'B')), 9)
        self.assertEqual(len(assemble.REPORTS), 14)
        with self.assertRaises(AssertionError): assemble.validate({}, {}, 15)
        with self.assertRaises(AssertionError): assemble.validate({}, {}, True)

    def test_21_mismatched_or_incomplete_guard_results_reject(self):
        result = {'contract': 'echs.c04.owner-fence-retry-contract-tests.v1', 'status': 'PASS', 'groups': 25,
            'failures': 0, 'errors': 0, 'skipped': 0, 'source_unchanged': True, 'database_executed': False,
            'network_requests': 0, 'production_calls': 0}
        for name, bad in (('groups', 17), ('skipped', 1), ('source_unchanged', False), ('database_executed', True)):
            changed = {**result, name: bad}
            with self.assertRaises(AssertionError): assemble.validate_guards({'guards/contract.json': changed})

    def test_22_synthetic_service_metadata_binds_successor_graph(self):
        doc, raw, own, checkout = synthetic_services()
        # Unit input is in memory only, and never enters the actual collector.
        assemble.validate_services(doc, raw, own, checkout, 15)
        with self.assertRaises(AssertionError): assemble.validate_services(doc, raw, own, checkout, 17)

    def test_23_service_acceptance_requires_actual_retry_stop_and_every_group(self):
        doc, raw, own, checkout = synthetic_services()
        cases = [('run-report.json', 'cleanup_complete', False), ('run-report.json', 'retry_http_groups', 1),
            ('retry-http-results.json', 'owned_backend_count_after_stop', 1),
            ('retry-http-results.json', 'owned_postgrest_stopped', False),
            ('retry-http-results.json', 'http_worker_reaped', False),
            ('retry-http-results.json', 'old_code_transaction_attempts_observed', 1),
            ('retry-http-results.json', 'finite_missing_state_transaction_attempts', 5),
            ('retry-sql-results.json', 'dedicated_fresh_database', False),
            ('http-results.json', 'control_reaped', False)]
        for filename, key, value in cases:
            changed = copy.deepcopy(doc); changed['services/' + filename][key] = value
            with self.subTest(filename=filename, key=key), self.assertRaises(AssertionError):
                assemble.validate_services(changed, raw, own, checkout, 15)

    def test_24_source_or_artifact_digest_drift_cannot_be_accepted(self):
        doc, raw, own, checkout = synthetic_services()
        for mutate in (
            lambda d: d['services/source-receipt.json']['inputs'].pop(),
            lambda d: d['services/http-results.json']['source_files'][0].update(sha256='0' * 64),
            lambda d: d['services/artifact-index.json']['members'][0].update(bytes=1),
            lambda d: d['services/retry-sql-results.json']['details'].update(native_serialization_40001=0)):
            changed = copy.deepcopy(doc); mutate(changed)
            with self.assertRaises(AssertionError): assemble.validate_services(changed, raw, own, checkout, 15)

    def test_25_missing_actual_evidence_writes_only_incomplete_index(self):
        with tempfile.TemporaryDirectory() as tmp:
            result = assemble.assemble(Path(tmp), 15)
            self.assertIs(result['complete'], False)
            self.assertIsNone(result['actual_counts'])
            self.assertEqual(result['status'], 'INCOMPLETE OR FAILED; NO ACCEPTANCE')
            with self.assertRaises(AssertionError): assemble.assemble(Path(tmp), 15)


if __name__ == '__main__':
    before = contract.snapshot()
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(Guards)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    stable = contract.snapshot() == before
    report = {'contract': 'echs.c04.owner-fence-retry-contract-tests.v1',
              'status': 'PASS' if result.wasSuccessful() and stable and not result.skipped else 'FAIL',
              'groups': result.testsRun, 'failures': len(result.failures), 'errors': len(result.errors),
              'skipped': len(result.skipped), 'source_unchanged': stable, 'database_executed': False,
              'network_requests': 0, 'production_calls': 0}
    with Path(sys.argv[1]).open('x', encoding='utf-8') as stream:
        json.dump(report, stream, indent=2); stream.write('\n')
    raise SystemExit(0 if report['status'] == 'PASS' else 1)
