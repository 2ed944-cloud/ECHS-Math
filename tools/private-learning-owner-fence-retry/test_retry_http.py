"""Actual bounded PostgREST retry probes; only an owned disposable DB is valid."""
from concurrent.futures import ThreadPoolExecutor
from contextlib import contextmanager
import ipaddress
import http.client
import json
import time
import urllib.error
import urllib.request
import uuid

from fixture import DATABASE, HERE, need, project
import contract

EXPECTED_LABELS = (
    'R10 Persistent missing-state HTTP failures execute one transaction and retain no writes',
    'R11 Retained 40001 counterexample repeats then stops with no owned PostgREST backends',
)


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, response, code, message, headers, new_url):
        raise ValueError('fixture-redirect')


def function_buffer(raw):
    start = 'create function private.learning_legacy_owner_guard()'
    end = 'create function private.learning_legacy_truncate_guard()'
    text = raw.decode('utf-8')
    need(text.count(start) == text.count(end) == 1, 'fixed-function-boundaries')
    result = text[text.index(start):text.index(end)].strip()
    need(result.endswith('end $$;'), 'complete-function-buffer')
    return result.replace('create function ', 'create or replace function ', 1)


def observe_retries(counter, before, future_done, *, clock=time.monotonic, sleep=time.sleep, timeout=3):
    deadline = clock() + timeout
    while True:
        need(clock() < deadline, 'bounded-old-code-observation')
        attempts = counter() - before
        need(clock() < deadline, 'bounded-old-code-observation')
        if attempts >= 2:
            return attempts
        need(not future_done(), 'old-code-did-not-repeat')
        sleep(.01)


def stop_owned_backends(stop_rest, backends, terminate, *, clock=time.monotonic, sleep=time.sleep, timeout=3):
    need(stop_rest() is True, 'owned-postgrest-container-stopped')
    deadline = clock() + timeout
    terminated = 0
    while True:
        need(clock() < deadline, 'owned-backend-stop-deadline')
        remaining = backends()
        need(clock() < deadline, 'owned-backend-stop-deadline')
        if not remaining:
            return terminated
        for pid, started in remaining:
            if terminate(pid, started): terminated += 1
        need(clock() < deadline, 'owned-backend-stop-deadline')
        sleep(.02)


def exercise(config, expected_major, stop_rest):
    import psycopg
    from psycopg import sql
    contract.sources()
    need(type(expected_major) is int and expected_major in (15, 17), 'major')
    need(callable(stop_rest), 'owned-stop-callback')
    for key in ('db_ip', 'rest_ip'):
        address = ipaddress.IPv4Address(config[key])
        need(any(address in ipaddress.ip_network(net) for net in
                 ('10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16')), 'private-address')
    outcomes = []
    result = {'contract': 'echs.c04.owner-fence-retry-http.v1', 'status': 'RUNNING; NOT ACCEPTED',
              'planned_groups': list(EXPECTED_LABELS), 'checks': outcomes, 'postgres_major': expected_major,
              'database_executed': False, 'postgrest_executed': False, 'production_calls': 0,
              'hosted_edge_executed': False, 'browser_persistence_executed': False}
    with psycopg.connect(host=config['db_ip'], hostaddr=config['db_ip'], port=5432,
                         dbname=DATABASE, user='postgres', password=config['password'],
                         sslmode='disable', autocommit=True, connect_timeout=5) as db:
        need(db.info.hostaddr == config['db_ip'] and db.info.dbname == DATABASE, 'database-identity')
        need(int(db.execute('show server_version_num').fetchone()[0]) // 10000 == expected_major, 'database-major')
        need(db.execute("select shobj_description(oid,'pg_database') from pg_database where datname=current_database()").fetchone()[0]
             == project(config['run_id']), 'database-marker')
        db.execute("set statement_timeout='5s'")
        db.execute("set lock_timeout='3s'")
        result['database_executed'] = True

        def counter():
            value, called = db.execute('select last_value,is_called from private.owner_fence_retry_attempts').fetchone()
            return value if called else 0

        def schema():
            return db.execute("""select 'function',oid::text,md5(pg_get_functiondef(oid)),coalesce(proacl::text,'')
                from pg_proc where pronamespace in ('public'::regnamespace,'private'::regnamespace) and prokind='f'
                union all select 'trigger',oid::text,md5(pg_get_triggerdef(oid)),tgenabled::text from pg_trigger where not tgisinternal
                union all select 'table',oid::text,coalesce(relacl::text,''),relrowsecurity::text from pg_class
                where relnamespace in ('public'::regnamespace,'private'::regnamespace) and relkind='r'
                order by 1,2""").fetchall()

        original_schema = schema()

        def owner():
            organization, account = uuid.uuid4(), uuid.uuid4()
            with db.transaction():
                db.execute("insert into public.organizations(id,name,slug) values(%s,'Synthetic HTTP retry',%s)",
                           (organization, 'retry-http-' + uuid.uuid4().hex))
                db.execute("insert into public.accounts(id,organization_id,username,display_name,role) values(%s,%s,%s,'Synthetic retry','student')",
                           (account, organization, 'retry-http-' + uuid.uuid4().hex))
            return organization, account

        @contextmanager
        def absent_barrier():
            row = db.execute('select id,epoch from private.learning_owner_barrier where id=1').fetchone()
            need(row is not None, 'barrier-present')
            with db.transaction():
                db.execute('alter table private.learning_owner_barrier disable trigger learning_barrier_delete')
                db.execute('delete from private.learning_owner_barrier where id=1')
                db.execute('alter table private.learning_owner_barrier enable trigger learning_barrier_delete')
            try:
                yield
            finally:
                db.execute('insert into private.learning_owner_barrier(id,epoch) values(%s,%s)', row)
                need(db.execute('select id,epoch from private.learning_owner_barrier where id=1').fetchone() == row, 'barrier-restored')
                need(schema() == original_schema, 'barrier-guards-restored')

        @contextmanager
        def absent_fence(account):
            row = db.execute('select id,account_id,initial_organization_id,live_account_id,epoch,created_at from private.learning_owner_fences where live_account_id=%s', (account,)).fetchone()
            need(row is not None and row[4] == 0, 'fresh-unadopted-fence')
            with db.transaction():
                db.execute('alter table private.learning_owner_fences disable trigger learning_fence_record_guard')
                db.execute('delete from private.learning_owner_fences where id=%s', (row[0],))
                db.execute('alter table private.learning_owner_fences enable trigger learning_fence_record_guard')
            try:
                yield
            finally:
                db.execute('insert into private.learning_owner_fences(id,account_id,initial_organization_id,live_account_id,epoch,created_at) values(%s,%s,%s,%s,%s,%s)', row)
                need(db.execute('select id,account_id,initial_organization_id,live_account_id,epoch,created_at from private.learning_owner_fences where live_account_id=%s', (account,)).fetchone() == row, 'fence-restored')

        def request(path, value):
            need(path in ('rpc/owner_fence_retry_probe', 'learning_sessions'), 'closed-http-route')
            raw = json.dumps(value, separators=(',', ':')).encode()
            need(len(raw) < 4096, 'fixture-body-bound')
            opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
            req = urllib.request.Request('http://' + config['rest_ip'] + ':3000/' + path,
                data=raw, method='POST', headers={'authorization': 'Bearer ' + config['service_key'], 'content-type': 'application/json'})
            try:
                response = opener.open(req, timeout=6)
            except urllib.error.HTTPError as error:
                response = error
            with response:
                body = response.read(4097)
                need(len(body) <= 4096, 'response-bound')
                value = json.loads(body)
                code = value.get('code') if isinstance(value, dict) else None
                return response.status, code

        def session_body(org, account):
            return {'organization_id': str(org), 'account_id': str(account),
                    'client_session_id': uuid.uuid4().hex, 'mode': 'practice',
                    'started_at': '2026-01-01T00:00:00Z', 'payload': {'synthetic': True}}

        def unchanged_owner(account):
            need(db.execute('select count(*) from private.learning_owner_routes where account_id=%s', (account,)).fetchone() == (0,), 'no-partial-route')
            need(db.execute('select count(*) from public.learning_sessions where account_id=%s', (account,)).fetchone() == (0,), 'no-partial-learning-row')

        def one_failure(path, payload):
            before = counter()
            status, code = request(path, payload)
            result['postgrest_executed'] = True
            need(status == 500 and code == '55000', 'finite-missing-state-response')
            need(counter() == before + 1, 'exactly-one-transaction-attempt')

        org, account = owner()
        with absent_barrier():
            for action in ('adopt', 'truncate'):
                one_failure('rpc/owner_fence_retry_probe', {'p_action': action, 'p_org': str(org), 'p_account': str(account)})
                unchanged_owner(account)
        with absent_fence(account):
            one_failure('rpc/owner_fence_retry_probe', {'p_action': 'adopt', 'p_org': str(org), 'p_account': str(account)})
            one_failure('learning_sessions', session_body(org, account))
            unchanged_owner(account)
        need(schema() == original_schema, 'R10-schema-restored')
        outcomes.append(EXPECTED_LABELS[0])
        result['finite_missing_state_requests'] = 4
        result['finite_missing_state_transaction_attempts'] = 4

        def owned_backends():
            db.execute('select pg_stat_clear_snapshot()')
            return db.execute("""select pid,backend_start from pg_stat_activity
                where datname=current_database() and application_name='echs-journal-http-postgrest'
                  and usename='authenticator' and client_addr=%s::inet and pid<>pg_backend_pid()
                order by pid""", (config['rest_ip'],)).fetchall()

        old_sql = (contract.FENCE / 'owner-fence.sql').read_bytes()
        successor_sql = (HERE / 'owner-fence.sql').read_bytes()
        need(contract.digest(old_sql) == contract.FENCE_BEFORE and contract.digest(successor_sql) == contract.FENCE_AFTER, 'counterexample-source-pins')
        old_function = function_buffer(old_sql)
        new_function = function_buffer(successor_sql)
        need(old_function.count("errcode='40001'") == 1 and new_function.count("errcode='40001'") == 0, 'one-old-function')
        attempts = 0
        stopped = False
        terminated = 0
        with absent_fence(account):
            db.execute(old_function, prepare=False)
            try:
                before = counter()
                with ThreadPoolExecutor(max_workers=1) as pool:
                    future = pool.submit(request, 'learning_sessions', session_body(org, account))
                    try:
                        attempts = observe_retries(counter, before, future.done)
                        need(owned_backends(), 'observed-owned-postgrest-backend')
                    finally:
                        # An independent resource owner stops the actual server.
                        # A client timeout alone cannot satisfy this condition.
                        def terminate(pid, started):
                            row = db.execute("""select pg_terminate_backend(pid) from pg_stat_activity
                                where pid=%s and backend_start=%s and datname=current_database()
                                  and application_name='echs-journal-http-postgrest'
                                  and usename='authenticator' and client_addr=%s::inet""",
                                (pid, started, config['rest_ip'])).fetchone()
                            return bool(row and row[0])
                        terminated = stop_owned_backends(stop_rest, owned_backends, terminate)
                        stopped = True
                        try:
                            future.result(timeout=7)
                        except (urllib.error.URLError, TimeoutError, ConnectionError, http.client.IncompleteRead, json.JSONDecodeError):
                            pass
                        need(future.done() and not owned_backends(), 'client-reaped-and-backends-absent')
            finally:
                db.execute(new_function, prepare=False)
        unchanged_owner(account)
        need(schema() == original_schema, 'R11-schema-restored')
        need(stopped and attempts >= 2 and not owned_backends(), 'actual-retry-counterexample-complete')
        outcomes.append(EXPECTED_LABELS[1])
        result.update(status='ACTUAL RETRY HTTP PASS; OWNED POSTGREST STOPPED',
            old_code_transaction_attempts_observed=attempts, old_code_repeated=True,
            owned_postgrest_stopped=True, owned_backend_count_after_stop=0,
            explicitly_terminated_backends=terminated, http_worker_reaped=True,
            fixture_schema_acl_triggers_restored=True)
    return result
