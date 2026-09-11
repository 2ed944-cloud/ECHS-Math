"""One fixed Management API GET; never a provisioner, deployer or SQL client.

Default mode projects a pinned local JSON response and is not authentication
evidence. --fetch-supplied-project is a separate explicit read-only operation;
it has NOT been run while preparing this candidate.
"""
from pathlib import Path
import argparse
import hashlib
import http.client
import json
import os
import re
import ssl
import time
import hosted_contract as h

HOST = 'api.supabase.com'
REF = h.PRODUCTION_REF
PATH = '/v1/projects/' + REF
MAX_BYTES = 131072


def text_field(value, pattern, code):
    h.need(type(value) is str and re.fullmatch(pattern, value), code)
    return value


def project_metadata(data):
    h.need(type(data) is bytes and len(data) <= MAX_BYTES, 'management-budget')
    value = h.strict_json(data)
    h.need(type(value) is dict, 'management-shape')
    h.need(value.get('ref') == REF, 'management-project-mismatch')
    project_id = text_field(value.get('id'), r'[A-Za-z0-9_-]{1,80}', 'management-id')
    org = text_field(value.get('organization_id'), r'[A-Za-z0-9_-]{1,80}', 'management-organization')
    region = text_field(value.get('region'), r'[a-z]{2}(?:-[a-z]+){1,2}-[1-9]', 'management-region')
    status = text_field(value.get('status'), r'[A-Z_]{1,40}', 'management-status')
    database = value.get('database'); h.need(type(database) is dict, 'management-database')
    version = text_field(database.get('version'), r'\d{1,2}(?:\.\d{1,9}){1,5}', 'management-version')
    major = int(version.split('.')[0])
    # Names, database host, arbitrary added fields, keys and entire source rows
    # are intentionally not returned. Metadata is not test-isolation authority.
    return {'project_ref': REF, 'management_project_id': project_id,
            'organization_id': org, 'region': region, 'status': status,
            'active_healthy': status == 'ACTIVE_HEALTHY',
            'database_version': version, 'database_major_version': major,
            'matches_tested_pg15_major': major == 15,
            'database_compatibility_verified': False,
            'matches_configured_production_project': True,
            'eligible_for_hosted_fixture_writes': False}


def fetch_exact_project(token):
    h.need(type(token) is str and 20 <= len(token) <= 8192 and re.fullmatch(r'[A-Za-z0-9._~-]+', token), 'management-token-unavailable')
    # Fixed host/path, default verified TLS, no proxy/environment URL, redirects,
    # retries, list endpoint, secrets endpoint, function write or database query.
    conn = response = None
    started = time.monotonic()
    try:
        context = ssl.create_default_context()
        conn = http.client.HTTPSConnection(HOST, 443, context=context, timeout=5)
        conn.request('GET', PATH, headers={'Authorization': 'Bearer ' + token,
            'Accept': 'application/json', 'Accept-Encoding': 'identity',
            'User-Agent': 'echs-c08-readonly-project-preflight/1'})
        response = conn.getresponse()
        h.need(response.status == 200, 'management-http-' + str(response.status) if response.status in (301,302,303,307,308,401,403,429,500,502,503,504) else 'management-http-error')
        content_type = response.getheader('Content-Type', '').split(';')[0].strip()
        h.need(content_type == 'application/json', 'management-mime')
        h.need(response.getheader('Content-Encoding', 'identity') in ('', 'identity'), 'management-encoding')
        length = response.getheader('Content-Length')
        h.need(length is None or (length.isdecimal() and int(length) <= MAX_BYTES), 'management-budget')
        body = bytearray()
        while True:
            h.need(time.monotonic() - started < 15, 'management-deadline')
            if conn.sock is not None:
                conn.sock.settimeout(max(0.001, min(2, 15 - (time.monotonic() - started))))
            chunk = response.read1(min(16384, MAX_BYTES + 1 - len(body)))
            if not chunk:
                break
            body.extend(chunk)
            h.need(len(body) <= MAX_BYTES, 'management-budget')
        h.need(time.monotonic() - started < 15, 'management-deadline')
        return bytes(body)
    except h.PlanError:
        raise
    except Exception:
        # Do not print an upstream exception, URL, headers or credential value.
        raise h.PlanError('management-transport-error') from None
    finally:
        if response is not None:
            try:
                response.close()
            except Exception:
                pass
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--input', type=Path)
    mode.add_argument('--fetch-supplied-project', action='store_true')
    parser.add_argument('--input-sha256')
    parser.add_argument('--report', type=Path, required=True)
    args = parser.parse_args()
    # Refuse a collision before any possible authenticated request. This is a
    # local output check, not a claim of filesystem transaction isolation.
    h.need(not args.report.exists(), 'report-exists')
    if args.fetch_supplied_project:
        h.need(args.input_sha256 is None, 'mode-options')
        data = fetch_exact_project(os.environ.get('SUPABASE_ACCESS_TOKEN'))
        origin = 'actual-fixed-management-get'
    else:
        data = args.input.read_bytes()
        h.need(type(args.input_sha256) is str and h.sha(data) == args.input_sha256, 'management-input-drift')
        origin = 'offline-projection-not-authentication'
    result = {'contract': 'echs.c08.readonly-project-preflight.v1',
              'status': 'READ_ONLY_METADATA_PROJECTED', 'evidence_origin': origin,
              'request': {'method': 'GET', 'host': HOST, 'path': PATH},
              'source_response_sha256': hashlib.sha256(data).hexdigest(),
              'projection': project_metadata(data), 'write_requests': 0,
              'production_metadata_gets': 1 if args.fetch_supplied_project else 0,
              'function_invocations': 0, 'learner_queries': 0,
              'secret_values_persisted': False, 'hosted_execution': False}
    args.report.parent.mkdir(parents=True, exist_ok=True)
    with args.report.open('x', encoding='utf-8', newline='\n') as handle:
        json.dump(result, handle, indent=2); handle.write('\n')
    print('PASS metadata projection only; production target remains ineligible for fixture writes')


if __name__ == '__main__':
    try:
        main()
    except h.PlanError as error:
        raise SystemExit('FAIL ' + str(error)) from None
    except Exception:
        raise SystemExit('FAIL management-preflight-error') from None
