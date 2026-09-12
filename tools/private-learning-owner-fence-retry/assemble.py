"""Closed successor evidence graph; partial reports cannot become acceptance."""
import argparse
import ipaddress
import json
import math
import os
from pathlib import Path
import re

import contract as source
import test_retry_http
import test_retry_sql

SQL_NAMES = {'checkout.json', 'acceptance.json', 'membership-baseline.json', 'archive-with-fence-and-journal.json'}
GUARD_NAMES = {'contract.json', 'offline.json', 'bridge.json'}
SERVICE_NAMES = {'source-receipt.json', 'image-receipt.json', 'http-results.json', 'retry-sql-results.json',
                 'retry-http-results.json', 'run-report.json', 'artifact-index.json'}
REPORTS = {f'sql/{x}' for x in SQL_NAMES} | {f'guards/{x}' for x in GUARD_NAMES} | {f'services/{x}' for x in SERVICE_NAMES}
MEMBER_KEYS = {'status', 'contract', 'production_calls', 'postgres_required', 'migration_count', 'migrations', 'checks', 'postgres_version', 'limits'}
ACCEPTANCE_KEYS = {'contract', 'status', 'source_files', 'migrations', 'checks', 'fence_checks', 'production_calls',
    'database_executed', 'production_migration', 'active_api', 'http_executed', 'owner_adoption_api', 'browser_bridge',
    'grading_authoritative', 'checkout_report_sha256', 'tested_sha', 'tested_tree', 'membership_baseline_checks',
    'archive_baseline_checks', 'candidate_installation', 'postgres_required', 'postgres_version', 'journal_check_count',
    'fence_check_count', 'details', 'reports'}
HTTP_SOURCES = ('runtime/wire.mjs', 'runtime/contract.mjs', 'runtime/handler.mjs', 'runtime/pending-intent.mjs',
                'bridge.mjs', 'controls.py', 'fixture.py', 'test_http.mjs')
SERVICE_STATUS = 'ACTUAL OWNER FENCE RETRY SERVICES PASS'


def integer(value, expected=None, minimum=None):
    assert type(value) is int
    if expected is not None: assert value == expected
    if minimum is not None: assert value >= minimum


def decode(raw):
    assert type(raw) is bytes and 0 < len(raw) <= 2097152
    def pairs(items):
        result = {}
        for key, value in items:
            assert key not in result, 'Duplicate metadata key'
            result[key] = value
        return result
    def invalid(_): raise AssertionError('Nonfinite metadata')
    value = json.loads(raw.decode('utf-8'), object_pairs_hook=pairs, parse_constant=invalid)
    stack = [(value, 1)]; left = 50000
    forbidden = {'tokens', 'token', 'bytes_base64', 'dsn', 'password', 'service_key', 'service_role_key', 'access_token',
                 'p_token_hash', 'canonical_record_text', 'payload', 'response', 'private_notes'}
    while stack:
        node, depth = stack.pop(); left -= 1
        assert left >= 0 and depth <= 24
        if type(node) is dict:
            assert not {x.lower() for x in node} & forbidden, 'Private material forbidden'
            stack.extend((v, depth + 1) for v in node.values())
        elif type(node) is list: stack.extend((v, depth + 1) for v in node)
        elif type(node) is str: assert '\0' not in node and len(node) <= 20000
        else:
            assert node is None or type(node) in (bool, int, float)
            if type(node) is float: assert math.isfinite(node)
    return value


def exact(value, expected):
    # JSON boolean must never satisfy an integer evidence counter.
    assert type(value) is type(expected)
    if isinstance(expected, dict):
        assert set(value) == set(expected)
        for key in expected: exact(value[key], expected[key])
    elif isinstance(expected, list):
        assert len(value) == len(expected)
        for a, b in zip(value, expected): exact(a, b)
    else: assert value == expected


def version(value, major):
    assert type(major) is int and major in (15, 17)
    assert type(value) is str and re.fullmatch(str(major) + r'\.\d+(?:\s[^\x00\r\n]{1,200})?', value)


def source_rows(own, names):
    return [{'path': name, **own[source.PREFIX + name]} for name in names]


def check_labels(value, labels, status):
    assert value['status'] == status
    exact(value['checks'], list(labels))


def node_labels(filename, prefix):
    text = (source.HERE / filename).read_text(encoding='utf-8')
    # Both copied files have a single literal occurrence of every ordered label.
    labels = re.findall(r"['\"](" + prefix + r"\d{2} [^'\"\r\n]+)['\"]", text)
    assert len(labels) == len(set(labels))
    return labels


def validate_sql(doc, raw, own, checkout, major):
    _, migrations = source.sources()
    rows = [{'file': Path(r['path']).name, 'sha256': r['sha256']} for r in migrations]
    reference = source.retained_journal().reviewed()
    member = doc['sql/membership-baseline.json']; archive = doc['sql/archive-with-fence-and-journal.json']
    assert set(member) == MEMBER_KEYS and member['contract'] == 'echs.membership-database-tests.v1'
    assert set(archive) == MEMBER_KEYS | {'connection_isolation_vectors', 'external_network'}
    assert archive['contract'] == 'echs.private-snapshot-database-test.v1'
    for name, value, count, migration_count in (('membership-baseline.json', member, 55, 26),
                                              ('archive-with-fence-and-journal.json', archive, 222, 27)):
        labels = [x.replace('PostgreSQL15', 'PostgreSQL' + str(major)) for x in reference['checks'][name]]
        assert len(labels) == count
        check_labels(value, labels, 'PASS'); integer(value['postgres_required'], major)
        integer(value['migration_count'], migration_count); exact(value['migrations'], rows[:migration_count])
        version(value['postgres_version'], major)
    integer(member['production_calls'], 0)
    assert archive['production_calls'] is False and archive['external_network'] is False
    integer(archive['connection_isolation_vectors'], 16)
    exact(member['limits'], [f'Isolated PostgreSQL{major} only; no production fixtures or data.',
        'Existing membership table grants and other membership-writing APIs are unchanged. New RPC atomicity does not assert control over a trusted direct service-role/database administrator.',
        'Historical same-org inactive student reports are preserved; roster mutations require an active class and active target accounts.'])
    exact(archive['limits'], ['Synthetic Storage object rows prove namespace/receipt SQL only, not deployed bytes.',
        'No production tenant, import, assignment, private practice, publication or grading authorization was tested.'])
    accepted = doc['sql/acceptance.json']
    assert set(accepted) == ACCEPTANCE_KEYS and accepted['contract'] == 'echs.c04.owner-fence-retry-sql.v1'
    labels = source.planned_labels()
    check_labels(accepted, labels, 'ACTUAL SUCCESSOR FENCE SQL448 PASS; NO ACTIVE API OR ADOPTION')
    exact(accepted['fence_checks'], source.load_fence()[1])
    for name, count in (('journal_check_count', 48), ('fence_check_count', 123), ('membership_baseline_checks', 55),
                        ('archive_baseline_checks', 222), ('production_calls', 0), ('postgres_required', major)):
        integer(accepted[name], count)
    exact(accepted['source_files'], own); exact(accepted['migrations'], rows)
    assert accepted['postgres_version'] == member['postgres_version'] == archive['postgres_version']
    assert accepted['database_executed'] is True
    for key in ('production_migration', 'active_api', 'http_executed', 'owner_adoption_api', 'browser_bridge', 'grading_authoritative'):
        assert accepted[key] is False
    assert accepted['checkout_report_sha256'] == source.digest(raw['sql/checkout.json'])
    assert accepted['tested_sha'] == checkout['tested_sha'] and accepted['tested_tree'] == checkout['tested_tree']
    exact(accepted['candidate_installation'], {'after_migration': rows[-1], 'successor_fence_sha256': source.FENCE_AFTER,
        'journal_sha256': source.retained_pin('tools/private-learning-operation-journal/operation-journal.sql')['sha256'],
        'existing_public_rows_preserved': True, 'existing_function_acl_rls_triggers_preserved': True,
        'row_representation': 'postgres-jsonb-text-length-prefixed-v1', 'initial_routes': 0, 'initial_journal_owners': 0})
    exact(accepted['details'], {'executed_case_ids': [x.split()[0] for x in labels], 'deferred_case_ids': ['J049'],
        'deferred_reason': 'HTTP status/body/receipt and browser acknowledgement acceptance need the later transport; SQL does not claim those tests.',
        'network_scope': 'guarded disposable PostgreSQL connections only; no production or Storage calls'})
    names = ('membership-baseline.json', 'archive-with-fence-and-journal.json')
    exact(accepted['reports'], [{'file': name, 'bytes': len(raw['sql/' + name]), 'sha256': source.digest(raw['sql/' + name])} for name in names])


def validate_guards(doc):
    exact(doc['guards/contract.json'], {'contract': 'echs.c04.owner-fence-retry-contract-tests.v1', 'status': 'PASS',
        'groups': 25, 'failures': 0, 'errors': 0, 'skipped': 0, 'source_unchanged': True,
        'database_executed': False, 'network_requests': 0, 'production_calls': 0})
    exact(doc['guards/offline.json'], {'contract': 'echs.c04.owner-fence-retry-offline.v1', 'status': 'PASS', 'groups': 17,
        'failed': 0, 'errors': 0, 'skipped': 0, 'docker_executed': False, 'database_executed': False, 'network_requests': 0})
    labels = node_labels('test_bridge.mjs', 'B'); assert len(labels) == 9
    exact(doc['guards/bridge.json'], {'contract': 'echs.c04.journal-http-loopback-adapter.v1', 'status': 'PASS', 'groups': 9,
        'outcomes': [{'name': x, 'status': 'PASS'} for x in labels], 'real_loopback_http': True,
        'postgrest_executed': False, 'database_executed': False, 'production_calls': 0})


def validate_services(doc, raw, own, checkout, major):
    report = doc['services/run-report.json']; images = doc['services/image-receipt.json']
    assert set(report) == {'contract', 'status', 'run_id', 'postgres_major', 'production_calls', 'hosted_edge_executed',
        'tls_executed', 'browser_persistence_executed', 'service_start_attempted', 'cleanup_complete', 'tested_sha',
        'tested_tree', 'installation', 'network', 'readiness', 'fresh_sql_denial_observed', 'groups',
        'focused_sql_groups', 'retry_http_groups', 'r12_reference'}
    assert report['contract'] == 'echs.c04.owner-fence-retry-service-run.v1' and report['status'] == SERVICE_STATUS
    assert report['tested_sha'] == checkout['tested_sha'] and report['tested_tree'] == checkout['tested_tree']
    for name in ('cleanup_complete', 'service_start_attempted', 'fresh_sql_denial_observed'): assert report[name] is True
    for name in ('hosted_edge_executed', 'tls_executed', 'browser_persistence_executed'): assert report[name] is False
    for name, value in (('postgres_major', major), ('production_calls', 0), ('groups', 20), ('focused_sql_groups', 9), ('retry_http_groups', 2)):
        integer(report[name], value)
    assert report['r12_reference'] == 'The unchanged twenty J049 HTTP cases above are counted once.'
    version(report['installation']['postgres_version'], major)
    exact(report['installation'], {'migrations': 27, 'journal_owners_initial': 0,
        'postgres_version': report['installation']['postgres_version'], 'storage_service_executed': False})
    exact(report['readiness'], {'http_status': 403, 'code': '28000', 'ready': True})
    assert re.fullmatch('[a-f0-9]{32}', report['run_id'])
    network = report['network']
    assert set(network) == {'name', 'network_id', 'internal', 'published_ports', 'services'}
    assert network['name'] == 'echs-journal-http-' + report['run_id'] and re.fullmatch('[a-f0-9]{64}', network['network_id'])
    assert network['internal'] is True and network['published_ports'] is False
    assert set(images) == set(network['services']) == {'db', 'rest'}
    for service, tag in (('db', 'postgres:' + str(major)), ('rest', 'postgrest/postgrest:v14.17')):
        row = images[service]; node = network['services'][service]
        assert set(row) == {'tag', 'image_id', 'repository_digest'} and row['tag'] == tag
        assert re.fullmatch('sha256:[a-f0-9]{64}', row['image_id'])
        assert re.fullmatch(re.escape(tag.rsplit(':', 1)[0]) + '@sha256:[a-f0-9]{64}', row['repository_digest'])
        assert set(node) == {'container_id', 'ipv4', 'image_id'} and node['image_id'] == row['image_id']
        assert re.fullmatch('[a-f0-9]{64}', node['container_id'])
        address = ipaddress.IPv4Address(node['ipv4'])
        assert any(address in ipaddress.ip_network(x) for x in ('10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'))
    assert network['services']['db']['ipv4'] != network['services']['rest']['ipv4']
    pins, _ = source.sources()
    manifest = decode((source.HERE / 'source-manifest.json').read_bytes())
    exact(doc['services/source-receipt.json'], {'manifest_sha256': own[source.PREFIX + 'source-manifest.json']['sha256'],
        'source_files': manifest['files'], 'inputs': pins['files']})
    http = doc['services/http-results.json']
    assert set(http) == {'contract', 'status', 'planned_groups', 'checks', 'real_http_executed', 'postgrest_executed',
        'database_executed', 'hosted_edge_executed', 'tls_executed', 'browser_persistence_executed', 'production_calls',
        'http_attempted', 'http_metrics', 'rpc_observations', 'source_files', 'control_reaped'}
    assert http['contract'] == 'echs.c04.journal-http-actual.v1'
    labels = node_labels('test_http.mjs', 'S'); assert len(labels) == 20
    check_labels(http, labels, 'ACTUAL HTTP POSTGREST SQL PASS'); exact(http['planned_groups'], labels)
    for name in ('real_http_executed', 'postgrest_executed', 'database_executed', 'http_attempted', 'control_reaped'): assert http[name] is True
    for name in ('hosted_edge_executed', 'tls_executed', 'browser_persistence_executed'): assert http[name] is False
    integer(http['production_calls'], 0); exact(http['http_metrics'], {'requests': 42, 'responses': 40, 'dropped': 2})
    exact(http['source_files'], source_rows(own, HTTP_SOURCES))
    assert type(http['rpc_observations']) is list and len(http['rpc_observations']) == 40
    for row in http['rpc_observations']:
        assert set(row) == {'route', 'status'} and row['route'] in {'learning_journal_' + x for x in ('state', 'apply', 'operation', 'heads')}
        integer(row['status']); assert row['status'] in (200, 400, 403, 409, 500)
    focused = doc['services/retry-sql-results.json']
    assert set(focused) == {'contract', 'status', 'planned_groups', 'checks', 'postgres_major', 'database_executed',
        'postgrest_executed', 'production_calls', 'source_files', 'dedicated_fresh_database', 'postgres_version', 'details', 'source_unchanged'}
    assert focused['contract'] == 'echs.c04.owner-fence-retry-focused-sql.v1'
    check_labels(focused, test_retry_sql.EXPECTED_LABELS, 'ACTUAL FOCUSED SQL R01-R09 PASS')
    exact(focused['planned_groups'], list(test_retry_sql.EXPECTED_LABELS)); exact(focused['source_files'], own)
    integer(focused['postgres_major'], major); integer(focused['production_calls'], 0)
    assert focused['postgres_version'] == report['installation']['postgres_version']
    for name in ('database_executed', 'dedicated_fresh_database', 'source_unchanged'): assert focused[name] is True
    assert focused['postgrest_executed'] is False
    details = focused['details']; integer(details['observed_lock_waits'], minimum=5)
    exact(details, {'deliberate_absence_55000': 29, 'native_serialization_40001': 4, 'all_six_mutations': 18,
        'observed_lock_waits': details['observed_lock_waits'], 'fixture_schema_acl_triggers_restored': True,
        'journal_owners_remain_zero': True, 'production_calls': 0})
    retry = doc['services/retry-http-results.json']
    integer(retry['old_code_transaction_attempts_observed'], minimum=2)
    integer(retry['explicitly_terminated_backends'], minimum=0)
    exact(retry, {'contract': 'echs.c04.owner-fence-retry-http.v1', 'status': 'ACTUAL RETRY HTTP PASS; OWNED POSTGREST STOPPED',
        'planned_groups': list(test_retry_http.EXPECTED_LABELS), 'checks': list(test_retry_http.EXPECTED_LABELS),
        'postgres_major': major, 'database_executed': True, 'postgrest_executed': True, 'production_calls': 0,
        'hosted_edge_executed': False, 'browser_persistence_executed': False, 'finite_missing_state_requests': 4,
        'finite_missing_state_transaction_attempts': 4, 'old_code_transaction_attempts_observed': retry['old_code_transaction_attempts_observed'],
        'old_code_repeated': True, 'owned_postgrest_stopped': True, 'owned_backend_count_after_stop': 0,
        'explicitly_terminated_backends': retry['explicitly_terminated_backends'], 'http_worker_reaped': True,
        'fixture_schema_acl_triggers_restored': True})
    index = doc['services/artifact-index.json']
    assert set(index) == {'status', 'members', 'cleanup_complete'}
    assert index['status'] == SERVICE_STATUS and index['cleanup_complete'] is True
    members = SERVICE_NAMES - {'artifact-index.json'}
    assert type(index['members']) is list and len(index['members']) == len(members)
    assert {x['path'] for x in index['members']} == members
    for row in index['members']:
        blob = raw['services/' + row['path']]
        exact(row, {'path': row['path'], 'bytes': len(blob), 'sha256': source.digest(blob)})


def validate(doc, raw, major):
    assert type(major) is int and major in (15, 17)
    assert set(doc) == set(raw) == REPORTS
    for name in REPORTS: exact(decode(raw[name]), doc[name]); assert type(doc[name]) is dict
    own = source.snapshot(); checkout = doc['sql/checkout.json']
    source.checkout_sources(checkout, expected_major=major)
    if os.environ.get('GITHUB_ACTIONS') == 'true': assert checkout['tested_sha'] == os.environ['GITHUB_SHA']
    validate_sql(doc, raw, own, checkout, major)
    validate_guards(doc)
    validate_services(doc, raw, own, checkout, major)
    source.unchanged(own)


def no_links(path):
    path = Path(os.path.abspath(path))
    for part in (path, *path.parents):
        assert not part.is_symlink() and not getattr(part, 'is_junction', lambda: False)(), 'Linked artifact path'
    return path


def write(path, raw):
    no_links(path); path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('xb') as stream: stream.write(raw); stream.flush(); os.fsync(stream.fileno())
    assert path.read_bytes() == raw


def assemble(temporary, major):
    assert type(major) is int and major in (15, 17)
    temporary = no_links(temporary)
    target = no_links(temporary / ('private-learning-owner-fence-retry-evidence-' + str(major)))
    assert not target.exists(); target.mkdir()
    found = {'sql/checkout.json': source.JOURNAL / 'results/checkout.json'}
    for name in GUARD_NAMES: found['guards/' + name] = temporary / ('owner-fence-retry-' + name)
    for name in SERVICE_NAMES: found['services/' + name] = temporary / ('private-learning-owner-fence-retry-' + str(major)) / name
    raw = {}; doc = {}; failure = None; before = None
    try:
        before = source.snapshot()
        runs = list((source.HERE / 'results').glob('run-*')); assert len(runs) <= 1
        if runs:
            run = no_links(runs[0]); assert run.is_dir() and re.fullmatch('run-[a-f0-9]{32}', run.name)
            for name in SQL_NAMES - {'checkout.json'}: found['sql/' + name] = run / name
        for name, path in sorted(found.items()):
            no_links(path)
            if not path.exists(): continue
            assert path.is_file() and path.stat().st_size <= 2097152
            blob = path.read_bytes(); parsed = decode(blob)
            write(target / name, blob); raw[name] = blob; doc[name] = parsed
        validate(doc, raw, major); source.unchanged(before)
        for name, path in found.items(): no_links(path); assert path.read_bytes() == raw[name]
        final = {name: (target / name).read_bytes() for name in REPORTS}
        assert final == raw; validate({name: decode(blob) for name, blob in final.items()}, final, major)
    except Exception as error: failure = type(error).__name__
    complete = failure is None
    index = {'contract': 'echs.c04.owner-fence-retry-artifact.v1',
        'status': 'ACTUAL OWNER FENCE RETRY SQL AND HTTP PASS' if complete else 'INCOMPLETE OR FAILED; NO ACCEPTANCE',
        'complete': complete, 'postgres_major': major, 'expected_reports': sorted(REPORTS),
        'files': [{'file': name, 'bytes': len(blob), 'sha256': source.digest(blob)} for name, blob in sorted(raw.items())],
        'production_calls': 0, 'production_migration': False, 'active_api': False, 'browser_persistence_executed': False,
        'hosted_edge_executed': False, 'tls_executed': False, 'owner_adoption_api': False,
        'actual_counts': {'membership': 55, 'archive': 222, 'legacy_fence': 123, 'journal': 48,
            'retained_sql_total': 448, 'base_http': 20, 'focused_sql': 9, 'retry_http': 2, 'executed_groups_total': 479} if complete else None,
        'local_counts': {'successor_contract': 25, 'service_offline': 17, 'native_loopback': 9} if complete else None,
        'counting_note': 'R12 references the twenty base HTTP groups once. Focused SQL groups overlap legacy-fence semantics but are separate executions.',
        'tested_sha': doc['sql/checkout.json']['tested_sha'] if complete else None,
        'tested_tree': doc['sql/checkout.json']['tested_tree'] if complete else None,
        'sql_postgres_version': doc['sql/acceptance.json']['postgres_version'] if complete else None,
        'service_postgres_version': doc['services/run-report.json']['installation']['postgres_version'] if complete else None,
        'sql_postgres_image': doc['sql/checkout.json']['postgres_image'] if complete else None,
        'service_images': doc['services/image-receipt.json'] if complete else None}
    if failure: index['failure_type'] = failure
    index_path = target / 'artifact-index.json'
    write(index_path, (json.dumps(index, indent=2) + '\n').encode())
    try:
        files = {p.relative_to(target).as_posix() for p in target.rglob('*') if p.is_file()}
        assert files == set(raw) | {'artifact-index.json'}
        for path in target.rglob('*'): no_links(path)
        for name, blob in raw.items(): assert (target / name).read_bytes() == blob
        if complete:
            for name, path in found.items(): no_links(path); assert path.read_bytes() == raw[name]
            source.unchanged(before); validate(doc, raw, major); source.unchanged(before)
        exact(decode(index_path.read_bytes()), index)
    except BaseException:
        if index_path.is_file() and not index_path.is_symlink(): index_path.unlink()
        raise
    return index


if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('--postgres-major', type=int, choices=(15, 17), required=True)
    args = parser.parse_args(); result = assemble(Path(os.environ['RUNNER_TEMP']), args.postgres_major)
    print(json.dumps({'status': result['status'], 'complete': result['complete']}))
    raise SystemExit(0 if result['complete'] else 1)
