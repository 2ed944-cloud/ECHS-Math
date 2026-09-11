"""Mocked management-response/HTTP boundary tests; no real authentication."""
from pathlib import Path
from unittest import mock
import argparse
import json
import ssl
import management_preflight as m
import hosted_contract as h


def sample():
    return {'id': m.REF, 'ref': m.REF, 'organization_id': 'synthetic-org',
            'organization_slug': 'synthetic-org-slug', 'name': 'synthetic-project-name',
            'region': 'eu-west-1', 'created_at': '2026-09-11T00:00:00Z',
            'status': 'ACTIVE_HEALTHY', 'database': {'host': 'not-persisted.invalid',
            'version': '15.8.1.085', 'postgres_engine': '15', 'release_channel': 'ga'}}


def raw(value):
    return json.dumps(value).encode()


def rejects(call, code):
    try:
        call()
    except h.PlanError as error:
        assert str(error) == code, (str(error), code)
    else:
        raise AssertionError('expected safe rejection: ' + code)


class Response:
    def __init__(self, body, status=200, headers=None):
        self.body = body; self.status = status; self.closed = False
        self.headers = {'Content-Type': 'application/json', **(headers or {})}
    def getheader(self, name, default=None):
        return self.headers.get(name, default)
    def read1(self, count):
        part, self.body = self.body[:count], self.body[count:]
        return part
    def close(self):
        self.closed = True


class Connection:
    def __init__(self, response):
        self.response = response; self.sock = None; self.requests = []; self.closed = False
    def request(self, *args, **kwargs):
        self.requests.append((args, kwargs))
    def getresponse(self):
        return self.response
    def close(self):
        self.closed = True


def main():
    parser = argparse.ArgumentParser(); parser.add_argument('--report', type=Path, required=True)
    args = parser.parse_args(); groups = []
    def group(name, fn):
        fn(); groups.append({'name': name, 'status': 'PASS'})
    # Actual HTTPS networking cannot escape the per-case replacement below.
    with mock.patch.object(m.http.client, 'HTTPSConnection', side_effect=AssertionError('network forbidden')):
        def projection():
            value = sample(); value['unknown_key'] = 'synthetic-do-not-persist'; value['database']['password'] = 'synthetic-do-not-persist'
            result = m.project_metadata(raw(value))
            assert result['project_ref'] == m.REF and result['database_major_version'] == 15
            assert result['matches_tested_pg15_major'] is True
            assert result['database_compatibility_verified'] is False
            assert result['eligible_for_hosted_fixture_writes'] is False
            serialized = json.dumps(result)
            for excluded in ('synthetic-do-not-persist', 'synthetic-project-name', 'not-persisted.invalid', 'password'):
                assert excluded not in serialized
        group('production metadata projection excludes names hosts added fields and credentials', projection)

        def types():
            for key, val, code in [('ref','abcdefghijklmnopqrst','management-project-mismatch'),
                                  ('organization_id',True,'management-organization'),
                                  ('region','https://evil.invalid','management-region'),
                                  ('id',123,'management-id'), ('status',None,'management-status')]:
                value = sample(); value[key] = val
                rejects(lambda: m.project_metadata(raw(value)), code)
        group('wrong project or malformed metadata cannot identify the approved target', types)

        def versions():
            value = sample(); value['database']['version'] = '17.4.1.001'
            result = m.project_metadata(raw(value)); assert result['database_major_version'] == 17
            assert result['matches_tested_pg15_major'] is False and result['database_compatibility_verified'] is False
            for version in (15, True, '15; DROP TABLE', None):
                value['database']['version'] = version
                rejects(lambda: m.project_metadata(raw(value)), 'management-version')
        group('database-major match remains distinct from actual schema compatibility', versions)

        def json_safety():
            rejects(lambda: m.project_metadata(b'{"ref":"x","ref":"y"}'), 'duplicate-key')
            rejects(lambda: m.project_metadata(b' ' * (m.MAX_BYTES + 1)), 'management-budget')
            rejects(lambda: m.project_metadata(b'[]'), 'management-shape')
        group('duplicate and oversized or nonobject raw management responses reject', json_safety)

        def missing_token():
            for token in (None, '', 'short', 'Bearer synthetic-token-with-prefix', 'x' * 8193, 'synthetic\r\nheader'):
                rejects(lambda: m.fetch_exact_project(token), 'management-token-unavailable')
        group('missing malformed and header-injecting tokens reject before HTTP construction', missing_token)

        def fixed_get():
            response = Response(raw(sample())); conn = Connection(response); constructed = []
            def build(host, port, *, context, timeout):
                constructed.append((host, port, context, timeout)); return conn
            with mock.patch.object(m.http.client, 'HTTPSConnection', build):
                data = m.fetch_exact_project('synthetic-not-a-real-access-token')
            assert data == raw(sample()) and len(constructed) == 1
            host, port, context, timeout = constructed[0]
            assert (host, port, timeout) == ('api.supabase.com', 443, 5)
            assert context.check_hostname and context.verify_mode == ssl.CERT_REQUIRED
            assert len(conn.requests) == 1
            arguments, options = conn.requests[0]
            assert arguments == ('GET', '/v1/projects/' + m.REF)
            assert 'body' not in options and set(options['headers']) == {'Authorization','Accept','Accept-Encoding','User-Agent'}
            assert conn.closed and response.closed
        group('one fixed GET retains verified TLS and sends no body or dynamic endpoint', fixed_get)

        def redirects():
            for status in (301, 302, 307, 308, 401, 403, 429, 500):
                response = Response(b'ignored-sensitive-upstream', status, {'Location':'https://evil.invalid'})
                conn = Connection(response)
                with mock.patch.object(m.http.client, 'HTTPSConnection', return_value=conn):
                    rejects(lambda: m.fetch_exact_project('synthetic-not-a-real-access-token'), 'management-http-' + str(status))
                assert len(conn.requests) == 1 and conn.closed and response.closed
        group('redirect and denied responses produce only closed status and no second request', redirects)

        def response_bounds():
            cases = [({'Content-Length':str(m.MAX_BYTES + 1)},b'{}','management-budget'),
                     ({'Content-Encoding':'gzip'},b'{}','management-encoding'),
                     ({'Content-Type':'text/html'},b'{}','management-mime'),
                     ({},b'a' * (m.MAX_BYTES + 1),'management-budget')]
            for headers, body, code in cases:
                response = Response(body, headers=headers); conn = Connection(response)
                with mock.patch.object(m.http.client, 'HTTPSConnection', return_value=conn):
                    rejects(lambda: m.fetch_exact_project('synthetic-not-a-real-access-token'), code)
                assert conn.closed and response.closed
        group('content encoding MIME declared and streaming byte budgets reject', response_bounds)

        def exceptions():
            response = Response(b'{}'); conn = Connection(response)
            conn.getresponse = lambda: (_ for _ in ()).throw(RuntimeError('synthetic-secret-and-private-upstream-body'))
            with mock.patch.object(m.http.client, 'HTTPSConnection', return_value=conn):
                rejects(lambda: m.fetch_exact_project('synthetic-not-a-real-access-token'), 'management-transport-error')
            assert conn.closed
            with mock.patch.object(m.http.client, 'HTTPSConnection', side_effect=RuntimeError('synthetic-constructor-details')):
                rejects(lambda: m.fetch_exact_project('synthetic-not-a-real-access-token'), 'management-transport-error')
        group('transport exceptions are closed codes without arbitrary upstream text', exceptions)

        def deadline():
            response = Response(raw(sample())); conn = Connection(response)
            ticks = iter((0, 16))
            with mock.patch.object(m.http.client, 'HTTPSConnection', return_value=conn), mock.patch.object(m.time,'monotonic',side_effect=lambda: next(ticks)):
                rejects(lambda: m.fetch_exact_project('synthetic-not-a-real-access-token'), 'management-deadline')
            assert conn.closed and response.closed
        group('read-loop deadline rejects a late response and closes the connection', deadline)

    output = {'status':'PASS','evidence_origin':'synthetic-mocked-management-only','group_count':len(groups),
              'groups':groups,'real_http_requests':0,'credentials_read':False,'production_requests':0,
              'production_writes':0,'hosted_execution':False,
              'module_sha256':h.sha(Path(m.__file__).read_bytes()),'test_sha256':h.sha(Path(__file__).read_bytes())}
    with args.report.open('x',encoding='utf-8',newline='\n') as handle:
        json.dump(output,handle,indent=2);handle.write('\n')
    print(f'PASS {len(groups)} mocked management groups; no authenticated request performed')


if __name__ == '__main__':
    main()
