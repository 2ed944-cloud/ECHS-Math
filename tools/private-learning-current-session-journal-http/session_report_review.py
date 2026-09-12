"""Independent, offline validation of the closed C01-C12 success report.

This does not authenticate a run. The caller must independently establish the
expected run, exact source bytes, browser and certificate identities. GitHub,
PostgreSQL major, source-before/after closure, process/output binding, baseline
20/12/90 results, private cleanup and ZIP provenance belong to the outer reviewer.
No report failure can pass this validator. No source is imported or executed.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re

MAX_REPORT = 1048576
MAX_SOURCE = 8 * MAX_REPORT
SUCCESS = 'ACTUAL CURRENT SESSION HTTPS POSTGREST SQL PASS'

GROUPS = (
 ('C01 Canonical discovery and explicit learning delivery agree with real SQL', {'canonical_client':True,'empty_raw_state':True,'no_automatic_command':True,'initial_revision':0,'initial_rows':0,'composite_matches_sql':True,'sql_receipt_equal':True,'raw_forwarding_equal':True,'exact_replay':True,'delivery_effects_unchanged':True,'operations':1}),
 ('C02 Guest nonstudent and invalid canonical sessions never open a journal', {'subcases':3,'journal_requests':0,'journal_databases':0,'no_adoption':True}),
 ('C03 Missing SQL owner and foreign canonical profiles cannot establish authority', {'missing_owner_is_real_sql':True,'missing_owner_rows_before':0,'missing_owner_rows_after':0,'foreign_profile_subcases':2,'journal_databases':0,'apply_requests':0}),
 ('C04 Shared canonical work survives disposal but rejects an obsolete session', {'shared_me_survives_disposal':True,'shared_config_survives_disposal':True,'old_session_waiter_rejected':True,'late_bridge_progress_refused':True,'journal_requests':0,'journal_databases':0}),
 ('C05 Session replacement and late state cannot restore captured handles', {'same_account_new_login_fenced':True,'a_b_a_fenced':True,'cross_page_storage_fenced':True,'late_state_body_aborted':True,'late_state_store_unopened':True,'prior_store_bytes_preserved':True}),
 ('C06 Committed native response bodies cancel without ACK and retry exact bytes', {'subcases':2,'sql_commit_proved':True,'prefix_written':True,'request_abort_observed':True,'late_ack_refused':True,'unchanged_stores':11,'exact_retry':True,'one_operation_each':True,'hold_cleanup_complete':True}),
 ('C07 The bridge deadline cancels its native body with caller signal still live', {'direct_port':True,'caller_signal_aborted':False,'bridge_deadline_observed':True,'native_body_rejected':True,'server_abort_observed':True,'t3_deadline_attribution':False,'hold_cleanup_complete':True}),
 ('C08 Real SQL revocation expiry and demotion override stale synthetic profiles', {'subcases':3,'synthetic_me_intentionally_stale':True,'canonical_profile_valid':True,'journal_denied':True,'unchanged_stores':11,'sql_unchanged_after_denial':True,'pending_preserved':True}),
 ('C09 New generation changes context while preserving immutable exact receipts', {'authority_identity_unchanged':True,'new_generation_context_only':True,'first_raw_reply_unchanged':True,'receipt_unchanged':True,'old_context_materialization_blocked':True}),
 ('C10 A labeled changed-incarnation wire mutation cannot acknowledge old work', {'wire_mutation_only':True,'actual_sql_incarnation_transition':False,'original_sql_reply_retained_privately':True,'acknowledged':False,'unchanged_stores':11,'exact_retry':True}),
 ('C11 All five legacy upload holds remain effective across entry lifecycle', {'guarded_paths':5,'stages':4,'online_and_learning_events':True,'legacy_queue_preserved':True,'legacy_request_attempts':0,'early_html_marker':True,'client_before_classic':True}),
 ('C12 Controller disposal and foreign channel notifications cannot adopt a store', {'dispose_during_native_open':True,'late_handle_refused':True,'foreign_incarnation_ignored':True,'channel_is_not_authority':True,'store_bytes_preserved':True,'no_adoption':True}),
)
LABELS = [name for name, _ in GROUPS]
LITERALS = {
 'contract':'echs.c04.current-session-journal-http-actual.v1', 'status':SUCCESS,
 'production_calls':0, 'active_adoption':False, 'production_auth_executed':False,
 'synthetic_account_api':True, 'same_origin_fixture':True,
 'native_browser_executed':True, 'real_https_executed':True,
 'canonical_client_executed':True, 'journal_handler_executed':True,
 'postgrest_executed':True, 'database_executed':True, 'cleanup_complete':True,
 'unexpected_requests':[], 'page_errors':[], 'static_routes':15,
 'served_runtime_scripts':12, 'retained_html_served':False,
}
REPORT_KEYS = set(LITERALS) | {'planned_groups','checks','run_id','source_files','browser','tls','cleanup'}
EXPECTED_KEYS = {'run_id','source_files','browser','der_sha256','spki_sha256'}
TLS_LITERALS = {'accepted_leaf':True,'narrow_spki_exception':True,'fresh_explicit_profile':True,'unrelated_leaf_rejected':True,'negative_application_requests':0,'broad_tls_flags':False}
CLEANUP = {'contexts_closed':True,'browser_connection_closed':True,'control_reaped':True,'listeners_closed':True,'response_tasks_remaining':0}
BROWSER_KEYS = {'product','revision','playwright','descriptor_revision','executable_sha256'}
NEW_SOURCE_PATHS = ('test_current_session_http.mjs','current-session-browser-page.mjs','current-session-cases.mjs','session-fixture.mjs','session-https-bridge.mjs','session-controls.py','session-control-client.mjs','selected-source.json')
# Exact accepted local bridge inputs. The complete selected HTML is retained but
# not served; the driver serves its explicitly source-bound fixture HTML.
SELECTED = (
 ('js/current-session-journal-bridge.mjs',14417,'e5f39170b24d259c5a801fe950d8e1252895e806415e8c18f59f12c965ff8df8'),
 ('js/institution-client.js',35019,'fb2d41425e31d6f51325ec3b254343f0c5d859d3a5ed5d6a2b80c3d76bcac973'),
 ('js/journal/contract.mjs',9956,'050a652f28e957aaabd7e87428b4811dbeb2ebfad80552023ebef9c931271e84'),
 ('js/journal/pending-intent.mjs',3573,'10aa9c3ba04aa0e32483763b5b8ef17d489b6449f4b8738563254d427811f69d'),
 ('js/journal/wire.mjs',4397,'d6e1a9675d12d125454b827ae1187a55e9176408a81dfb8fe2f0397598f8407b'),
 ('js/owned-learning-bootstrap.mjs',9106,'eb7db750c8ea62f4c6c610f2a0bc9ec9558e8fcce66cfaf701aeb90d17375f96'),
 ('js/owned-learning-store.mjs',73123,'75c64156b4a69db6b9f2b9862ec45e673cbd6dc75a090030e9c5383ef3e02773'),
 ('js/owned-learning-transport.mjs',400,'0a214e92e003a1c8a0f3317ba53a502e2a9604aa5d57ba3e77ddf0c11268b860'),
 ('js/wire-binding-model.mjs',12774,'41d8b60bce63d25b6d2da782ee900d0a3e139ce830ffbea2a26ef2e696d990a5'),
 ('question-bank/js/learning-system.js',1757,'69952f6ddbfed512fde53038cfe83a0ff6fcefb262699203db5290f1bdb9ec7b'),
 ('question-bank/js/learning-transition.mjs',27867,'4167b49674f8dcb55d3427817b62dd81c28d5f9d46140c13bf92de55eb601b5b'),
 ('question-bank/js/practice-flow.mjs',10918,'82be3e7149d7375427804331491d75516287b67aaccac519a442be733ef08418'),
 ('question-bank/practice.html',14983,'06c4920c00da32eb35e157c7a4c4e7450cc6841857186e7dfe0a50c01e8fb4b8'),
)
SOURCE_PATHS = [*NEW_SOURCE_PATHS, *('selected/'+name for name, _, _ in SELECTED)]


def need(value, code):
    if not value:
        raise ValueError(code)


def plain_json(value):
    """Bound object callers as strictly as the JSON bytes entry point."""
    pending = [(value, 0)]
    nodes = 0
    while pending:
        item, depth = pending.pop()
        nodes += 1
        need(nodes <= 20000 and depth <= 24, 'json-complexity')
        kind = type(item)
        if kind is dict:
            need(len(item) <= 128 and all(type(key) is str and len(key) <= 256 for key in item), 'json-object')
            pending.extend((child, depth+1) for child in item.values())
        elif kind is list:
            need(len(item) <= 1000, 'json-array')
            pending.extend((child, depth+1) for child in item)
        elif kind is str:
            need(len(item) <= 4096, 'json-string')
        elif kind is int:
            need(-9007199254740991 <= item <= 9007199254740991, 'json-integer')
        else:
            need(item is None or kind is bool, 'json-value-type')


def same(left, right):
    # Encoding preserves the boolean/integer distinction, unlike Python ==.
    return json.dumps(left,sort_keys=True,separators=(',',':'),allow_nan=False) == json.dumps(right,sort_keys=True,separators=(',',':'),allow_nan=False)


def shape(value, keys, code):
    need(type(value) is dict and set(value) == set(keys), code)


def digest(value):
    return type(value) is str and re.fullmatch('[a-f0-9]{64}', value) is not None


def source_rows(rows):
    need(type(rows) is list and len(rows) == 21, 'source-count')
    for row in rows:
        shape(row, {'path','bytes','sha256'}, 'source-row-shape')
        need(type(row['path']) is str and re.fullmatch('[A-Za-z0-9._/-]+',row['path']) is not None and not row['path'].startswith('/') and all(part not in ('','.','..') for part in row['path'].split('/')), 'source-path')
        need(type(row['bytes']) is int and 0 < row['bytes'] <= MAX_SOURCE and digest(row['sha256']), 'source-values')
    need([row['path'] for row in rows] == SOURCE_PATHS, 'source-exact-paths')
    need(sum(row['bytes'] for row in rows) <= 32*MAX_REPORT, 'source-total-size')
    for row, (name, size, pin) in zip(rows[8:], SELECTED):
        need(same(row, {'path':'selected/'+name,'bytes':size,'sha256':pin}), 'selected-source-pin')


def expected_values(expected):
    plain_json(expected)
    shape(expected, EXPECTED_KEYS, 'expected-shape')
    need(type(expected['run_id']) is str and re.fullmatch('[a-f0-9]{32}',expected['run_id']) is not None, 'expected-run')
    need(digest(expected['der_sha256']) and digest(expected['spki_sha256']), 'expected-tls')
    source_rows(expected['source_files'])
    browser = expected['browser']
    shape(browser, BROWSER_KEYS, 'expected-browser-shape')
    need(browser['product'] in ('Chrome/149.0.7827.55','HeadlessChrome/149.0.7827.55') and type(browser['revision']) is str and re.fullmatch('@[a-f0-9]{40}',browser['revision']) is not None, 'expected-browser-version')
    need(browser['playwright'] == '1.61.1' and browser['descriptor_revision'] == '1228' and digest(browser['executable_sha256']), 'expected-browser-dependency')


def validate_current_session(report, *, expected):
    """Return consistency only; expected must come from the outer reviewer."""
    expected_values(expected)
    plain_json(report)
    shape(report, REPORT_KEYS, 'report-shape')
    need(same({key:report[key] for key in LITERALS}, LITERALS), 'report-success-literals')
    need(same(report['planned_groups'], LABELS), 'planned-groups')
    need(type(report['checks']) is list and len(report['checks']) == 12, 'check-count')
    for row, (name, details) in zip(report['checks'], GROUPS):
        shape(row, {'name','status','elapsed_ms','details'}, 'check-shape')
        need(row['name'] == name and row['status'] == 'PASS', 'check-order-status')
        need(type(row['elapsed_ms']) is int and 0 <= row['elapsed_ms'] <= 90000, 'check-elapsed')
        need(same(row['details'], details), 'check-details')
    need(report['run_id'] == expected['run_id'], 'run-binding')
    source_rows(report['source_files'])
    need(same(report['source_files'], expected['source_files']), 'source-binding')
    shape(report['browser'], BROWSER_KEYS, 'browser-shape')
    need(same(report['browser'], expected['browser']), 'browser-binding')
    shape(report['tls'], set(TLS_LITERALS)|{'served_der_sha256','served_spki_sha256'}, 'tls-shape')
    tls = dict(TLS_LITERALS, served_der_sha256=expected['der_sha256'], served_spki_sha256=expected['spki_sha256'])
    need(same(report['tls'], tls), 'tls-binding')
    need(same(report['cleanup'], CLEANUP), 'cleanup-binding')
    return {
        'contract':'echs.c04.current-session-report-consistency.v1',
        'status':'PASS FOR REPORT CONSISTENCY ONLY',
        'run_id':expected['run_id'], 'current_session_groups':12,
        'source_rows':21, 'run_provenance_authenticated':False,
        'baseline_verified_here':False, 'charter_c04_complete':False,
    }


def decode_report(raw):
    need(type(raw) is bytes and 0 < len(raw) <= MAX_REPORT, 'report-size')
    def pairs(items):
        result = {}
        for key, value in items:
            need(key not in result, 'duplicate-json-key')
            result[key] = value
        return result
    def forbidden(_):
        raise ValueError('nonfinite-json')
    try:
        value = json.loads(raw.decode('utf-8'),object_pairs_hook=pairs,parse_constant=forbidden)
    except (ValueError, UnicodeError, RecursionError):
        raise ValueError('report-json') from None
    plain_json(value)
    return value


def validate_bytes(raw, *, expected):
    return validate_current_session(decode_report(raw), expected=expected)


def read_bounded(path):
    with Path(path).open('rb') as stream:
        raw = stream.read(MAX_REPORT+1)
    need(0 < len(raw) <= MAX_REPORT, 'report-size')
    return raw


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--report',required=True)
    parser.add_argument('--expected',required=True)
    parser.add_argument('--output',required=True)
    args = parser.parse_args()
    raw = read_bounded(args.report)
    expected_raw = read_bounded(args.expected)
    result = validate_bytes(raw,expected=decode_report(expected_raw))
    result['report_sha256'] = hashlib.sha256(raw).hexdigest()
    result['expected_sha256'] = hashlib.sha256(expected_raw).hexdigest()
    with Path(args.output).open('x',encoding='utf-8',newline='\n') as stream:
        stream.write(json.dumps(result,indent=2,sort_keys=True)+'\n')
    print(result['status'])


if __name__ == '__main__':
    main()
