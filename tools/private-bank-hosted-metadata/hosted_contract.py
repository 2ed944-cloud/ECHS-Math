"""Offline C08 hosted-probe planning guard. No network, credentials or execution.

Target JSON is declarative input, never authenticated project evidence. This
module cannot deploy, seed, upload, clean up, or accept a hosted result.
"""
from pathlib import Path, PurePosixPath
import argparse
import datetime as dt
import hashlib
import json
import re

HERE = Path(__file__).resolve().parent
PRODUCTION_REF = 'wkqadnfloiohqfnesmyq'
FUNCTION = 'private-bank-snapshot-transport'
CONTRACT = 'echs.c08.hosted-probe-plan.v1'
MIB = 1024 * 1024
SIZES = (6 * MIB + 1, 11 * MIB, 16 * MIB)
RUNTIME_HASHES = {
    'handler.mjs': 'ff49fd68970612cd325dec9819707a91a431eb1799cf6c4d88d1fea675f4cf0e',
    'transport.mjs': '11425bcd086ddb2f88c788969ef82e1f2af8a7803d8b8110baabf785bb3152d3',
}
TARGET_KEYS = frozenset(('contract', 'purpose', 'project_ref', 'organization_id',
    'origin', 'region', 'plan', 'run_id', 'starts_at', 'expires_at', 'function_slug',
    'handler_deadline_ms', 'upstream_timeout_ms', 'max_concurrency',
    'max_registered_bytes', 'max_transfer_bytes', 'cleanup_policy'))


class PlanError(ValueError):
    """Safe, closed error code only. Never echo arbitrary input."""


def need(condition, code):
    if not condition:
        raise PlanError(code)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def strict_json(data):
    need(type(data) is bytes and len(data) <= 1024 * 1024, 'json-budget')
    def object_pairs(pairs):
        result = {}
        for key, value in pairs:
            need(key not in result, 'duplicate-key')
            result[key] = value
        return result
    def constant(_):
        raise PlanError('nonfinite-json')
    try:
        return json.loads(data.decode('utf-8'), object_pairs_hook=object_pairs,
                          parse_constant=constant)
    except (UnicodeError, json.JSONDecodeError):
        raise PlanError('invalid-json') from None


def timestamp(value):
    need(type(value) is str and re.fullmatch(r'\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ', value), 'timestamp-type')
    try:
        return dt.datetime.strptime(value, '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=dt.timezone.utc)
    except ValueError:
        raise PlanError('timestamp-value') from None


def validate_target(value, now):
    need(type(value) is dict and set(value) == TARGET_KEYS, 'target-shape')
    need(value['contract'] == CONTRACT and value['purpose'] == 'dedicated-nonproduction-synthetic', 'target-purpose')
    ref = value['project_ref']
    need(type(ref) is str and re.fullmatch(r'[a-z]{20}', ref), 'project-ref')
    need(ref != PRODUCTION_REF, 'production-project-denied')
    need(value['origin'] == 'https://' + ref + '.supabase.co', 'project-origin')
    need(value['function_slug'] == FUNCTION, 'function-slug')
    need(type(value['organization_id']) is str and re.fullmatch(r'[a-z0-9][a-z0-9_-]{0,79}', value['organization_id']), 'organization-id')
    need(type(value['region']) is str and re.fullmatch(r'[a-z]{2}(?:-[a-z]+){1,2}-[1-9]', value['region']), 'region')
    need(value['plan'] in ('free', 'pro', 'team', 'enterprise'), 'plan')
    need(type(value['run_id']) is str and re.fullmatch(r'[0-9a-f]{32}', value['run_id']), 'run-id')
    begin, end = timestamp(value['starts_at']), timestamp(value['expires_at'])
    need(isinstance(now, dt.datetime) and now.tzinfo is not None, 'clock')
    need(begin <= now < end and dt.timedelta(0) < end - begin <= dt.timedelta(hours=1), 'execution-window')
    expected = {'handler_deadline_ms': 20000, 'upstream_timeout_ms': 5000,
                'max_concurrency': 2, 'max_registered_bytes': 128 * MIB,
                'max_transfer_bytes': 512 * MIB}
    for key, wanted in expected.items():
        need(type(value[key]) is int and value[key] == wanted, 'bounded-' + key)
    need(value['cleanup_policy'] == 'abort-revoke-exact-objects-function-retain-immutable-metadata', 'cleanup-policy')
    # A freshly reconstructed projection prevents arbitrary caller properties
    # from becoming a command argument or an authorization/evidence receipt.
    return {key: value[key] for key in sorted(TARGET_KEYS)}


def case_plan():
    rows = []
    for index, length in enumerate(SIZES):
        for repeat in range(2):
            rows.append({'case': f'size-{index + 1}-fresh-{repeat + 1}',
                         'bytes': length, 'fresh_file_required': True,
                         'scheduled_concurrency': 1,
                         'classification': 'observe-instance-sequence'})
    for index in range(2):
        rows.append({'case': f'concurrent-16mib-{index + 1}', 'bytes': SIZES[-1],
                     'fresh_file_required': True, 'scheduled_concurrency': 2,
                     'classification': 'observe-instance-overlap'})
    total = sum(row['bytes'] for row in rows)
    need(total == 102760450 and total < 128 * MIB, 'matrix-budget')
    need(total * 4 < 512 * MIB, 'transfer-budget')
    return {'cases': rows, 'positive_uploads': len(rows), 'upload_bytes': total,
            'minimum_accounted_transfer_bytes': 4 * total,
            'transfer_multiplier_reason': 'client-send,edge-put,edge-readback,control-readback',
            'automatic_retries': 0, 'max_concurrency': 2,
            'cold_or_warm_guaranteed': False, 'same_instance_overlap_guaranteed': False}


def verify_sources(workspace, pins_data, expected_digest):
    need(type(expected_digest) is str and re.fullmatch(r'[0-9a-f]{64}', expected_digest), 'pins-digest')
    need(sha(pins_data) == expected_digest, 'pins-drift')
    pins = strict_json(pins_data)
    need(type(pins) is dict and pins.get('contract') == 'echs.c08.hosted-source-pins.v1', 'pins-contract')
    need(type(pins.get('sources')) is list and len(pins['sources']) == 34, 'source-count')
    workspace = Path(workspace).resolve(strict=True)
    seen, runtime, migrations = set(), {}, []
    for row in pins['sources']:
        need(type(row) is dict and set(row) == {'path', 'bytes', 'sha256', 'kind', 'publication_path', 'git_blob'}, 'source-shape')
        path = row['path']
        need(type(path) is str and '\\' not in path and ':' not in path and not path.startswith('/'), 'source-path')
        parts = PurePosixPath(path).parts
        need(parts and all(part not in ('', '.', '..') for part in path.split('/')) and '/'.join(parts) == path, 'source-path')
        need(path not in seen, 'duplicate-source'); seen.add(path)
        target = workspace.joinpath(*parts)
        probe = workspace
        for part in parts:
            probe = probe / part
            need(not probe.is_symlink() and not probe.is_junction(), 'source-link')
        need(target.resolve(strict=True).is_relative_to(workspace) and target.is_file(), 'source-containment')
        need(type(row['bytes']) is int and row['bytes'] > 0 and type(row['sha256']) is str, 'source-metadata')
        data = target.read_bytes()
        need(len(data) == row['bytes'] and sha(data) == row['sha256'], 'source-drift')
        git_blob = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
        need(git_blob == row['git_blob'], 'source-git-blob')
        if row['kind'] == 'runtime':
            name = PurePosixPath(path).name
            need(name in RUNTIME_HASHES and name not in runtime and sha(data) == RUNTIME_HASHES[name], 'runtime-drift')
            runtime[name] = sha(data)
        elif row['kind'] == 'migration':
            migrations.append(row['publication_path'])
        else:
            need(row['kind'] == 'discovery', 'source-kind')
    need(runtime == RUNTIME_HASHES and len(migrations) == 27 and len(set(migrations)) == 27, 'source-closure')
    need(sorted(migrations)[-1] == 'supabase/migrations/202609090003_private_bank_snapshots.sql', 'migration-prefix')
    return {'source_rows': len(seen), 'migration_count': len(migrations),
            'runtime_sha256': runtime, 'pins_sha256': expected_digest,
            'source_bytes_verified': True, 'remote_authentication_performed': False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--workspace', type=Path, default=HERE.parents[2])
    parser.add_argument('--pins-sha256', required=True)
    parser.add_argument('--target', type=Path)
    parser.add_argument('--report', type=Path, required=True)
    args = parser.parse_args()
    result = {'contract': CONTRACT, 'status': 'OFFLINE_PREFLIGHT_ONLY',
              'hosted_execution': False, 'authenticated_project_verified': False,
              'deployment_authorized_by_this_report': False,
              'production_access': False, 'real_corpus_access': False,
              'case_plan': case_plan()}
    result['sources'] = verify_sources(args.workspace, (HERE / 'source-pins.json').read_bytes(), args.pins_sha256)
    if args.target:
        result['declarative_target'] = validate_target(strict_json(args.target.read_bytes()), dt.datetime.now(dt.timezone.utc))
    else:
        result['declarative_target'] = None
    report = args.report.absolute()
    need(report.resolve().is_relative_to(args.workspace.resolve()), 'report-containment')
    report.parent.mkdir(parents=True, exist_ok=True)
    with report.open('x', encoding='utf-8', newline='\n') as handle:
        json.dump(result, handle, indent=2); handle.write('\n')
    print('PASS offline source/matrix preflight; hosted execution NOT PERFORMED')


if __name__ == '__main__':
    try:
        main()
    except PlanError as error:
        raise SystemExit('FAIL ' + str(error)) from None
