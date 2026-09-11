"""Actual PostgreSQL journal assertions; imported only by the guarded runner.

No connection, driver import, fixture creation or claimed PASS at module import.
J049 is a future HTTP/browser gate and is deliberately not an executed label.
"""
import copy
import hashlib
import json
import time
import uuid
from contextlib import contextmanager
from concurrent.futures import ThreadPoolExecutor

EXPECTED_LABELS = (
    'J001 Exact PostgreSQL foundation has zero journal rows and the scoped route key',
    'J003 Private journal tables and helper functions deny direct client and service access',
    'J004 Immutable history and owner or head rewind are denied to ordinary privileged DML',
    'J005 Complete tenant and incarnation foreign keys reject crossed scope tuples',
    'J006 Missing routes states and fabricated bindings never provision or adopt',
    'J007 Nonstudent callers and caller supplied ownership fields are rejected',
    'J008 Account reuse and never-adopted tenant movement retain incarnation boundaries',
    'J009 Exact current session and active account are required before any journal write',
    'J010 Session revocation commits during an observed owner-lock wait and the resumed write rejects',
    'J011 Role and activity changes commit during owner waits and invalidate the waiting writer',
    'J012 Revocation during an observed account-lock wait is seen by the subsequent session read',
    'J013 Wall-clock expiry after an observed session-lock wait rejects the resumed request',
    'J014 Authorized account and session locks serialize later revocation after the commit',
    'J015 Expiry before the final check rolls back every compound journal row',
    'J016 Read lookup and replay paths recheck authority after observed waits',
    'J017 New RPCs reject fixed snapshots while legacy unadopted writes retain isolation support',
    'J018 Disjoint owners proceed independently without a global journal lock',
    'J019 Existing session and account maintenance paths obey the tested lock ordering',
    'J020 Concurrent exact operation retries produce one immutable receipt and one charge',
    'J021 Reused operation UUID with any changed normalized intent conflicts atomically',
    'J022 A fresh session for the same incarnation can resolve the original exact operation',
    'J023 Commit and rollback followed by disconnect reconcile through exact operation lookup',
    'J024 Unknown or another-owner operation UUID does not disclose foreign receipt metadata',
    'J025 Distinct operations racing one mutable expected revision have exactly one winner',
    'J026 Disjoint mutable keys serialize with independent record revisions',
    'J027 Missing live and tombstoned records have distinct compare-and-set boundaries',
    'J028 One stale mutable member rolls back the entire compound attempt and record operation',
    'J029 Identical attempt repetition preserves one event and its original generation',
    'J030 Changed immutable attempt content conflicts including after reset',
    'J031 Duplicate keys conflicting aliases and invalid attempt actions reject before writes',
    'J032 Failures after each durable phase roll back every table and allow exact retry',
    'J033 Suppressed durable rows are detected by exact post-write invariants',
    'J034 Reset advances generation once and retains immutable history and old heads',
    'J035 Concurrent identical and conflicting resets have deterministic replay or CAS outcomes',
    'J036 Commit-first ordering forces a stale reset to refuse unseen committed state',
    'J037 Reset-first ordering rejects a delayed old-generation new operation',
    'J038 Exact historical operation replay after resets returns the unchanged receipt only',
    'J039 New-generation mutable data survives a delayed old-generation receipt',
    'J040 Reset revision and retained-history exhaustion refuse without pruning or wraparound',
    'J041 Actual SQL validators enforce row envelope count depth node and revision bounds',
    'J042 Unicode identities preserve supported bytes and reject unsafe identity forms',
    'J043 PostgreSQL normalized text and hash vectors define replay without raw-wire claims',
    'J044 SQL-expanded envelope over the byte budget is refused atomically',
    'J045 Concurrent history quota contenders cannot exceed serialized owner counters',
    'J046 Current head reads return exact ordered missing and tombstone projections',
    'J047 Receipt bytes remain immutable while read wrappers expose the current generation',
    'J048 Local browser command and receipt envelopes cannot impersonate server authority',
    'J002 Existing rows ACLs functions and triggers remain preserved after the journal suite',
)

TABLES = ('learning_journal_owners', 'learning_journal_operations',
          'learning_journal_attempts', 'learning_journal_versions', 'learning_journal_heads')
RPCS = ('state', 'apply', 'operation', 'heads')
CONTRACT = 'echs.learning.server-journal.v1'
MAX_INT = 9007199254740991


def exercise(db, connect, passed):
    import psycopg
    from psycopg import sql
    from psycopg.types.json import Jsonb

    labels = {x.split(' ', 1)[0]: x for x in EXPECTED_LABELS}
    done = []

    def mark(case):
        label = labels[case]
        assert label not in done
        done.append(label)
        passed(label)

    def objects():
        return {
            'acls': db.execute("select oid,relacl,relrowsecurity from pg_class where relnamespace in ('public'::regnamespace,'private'::regnamespace) and relkind='r' order by oid").fetchall(),
            'functions': db.execute("select oid,md5(pg_get_functiondef(oid)),proacl from pg_proc where pronamespace in ('public'::regnamespace,'private'::regnamespace) and prokind='f' order by oid").fetchall(),
            'triggers': db.execute("select oid,md5(pg_get_triggerdef(oid)),tgenabled from pg_trigger where not tgisinternal order by oid").fetchall(),
        }

    original_objects = objects()
    original_rows = {}
    for table, in db.execute("select tablename from pg_tables where schemaname='public' order by tablename"):
        original_rows[table] = {row[0] for row in db.execute(sql.SQL('select to_jsonb(t)::text from public.{} t').format(sql.Identifier(table)))}

    def rejected(fn, expected, conn=db):
        try:
            with conn.transaction():
                fn()
        except psycopg.Error as error:
            codes = (expected,) if isinstance(expected, str) else expected
            assert error.sqlstate in codes, ('unexpected SQLSTATE', error.sqlstate, codes)
        else:
            raise AssertionError('Expected SQL rejection did not occur')

    def organization():
        value = uuid.uuid4()
        db.execute("insert into public.organizations(id,name,slug) values(%s,'Synthetic journal organization',%s)", (value, 'journal-' + uuid.uuid4().hex))
        return value

    org = organization()
    other_org = organization()

    def owner(scope=org, role='student', route=True, state=True, account_id=None):
        account_id = account_id or uuid.uuid4()
        db.execute("insert into public.accounts(id,organization_id,username,display_name,role) values(%s,%s,%s,'Synthetic journal student',%s)",
                   (account_id, scope, 'journal-' + uuid.uuid4().hex, role))
        incarnation = db.execute('select id from private.learning_owner_fences where live_account_id=%s', (account_id,)).fetchone()[0]
        token_hash = hashlib.sha256(uuid.uuid4().bytes).hexdigest()
        session_id = uuid.uuid4()
        db.execute("insert into private.sessions(id,account_id,token_hash,expires_at) values(%s,%s,%s,clock_timestamp()+interval '1 hour')",
                   (session_id, account_id, token_hash))
        if route:
            db.execute('insert into private.learning_owner_routes(organization_id,account_id) values(%s,%s)', (scope, account_id))
            if state:
                db.execute('insert into private.learning_journal_owners(organization_id,account_id,incarnation_id,adoption_epoch) values(%s,%s,%s,1)',
                           (scope, account_id, incarnation))
        return {'account': account_id, 'organization': scope, 'incarnation': incarnation, 'token': token_hash, 'session': session_id}

    def bind(who):
        return {'contract': CONTRACT, 'incarnation_id': str(who['incarnation']), 'adoption_epoch': 1}

    def value(kind, key, **extra):
        field = {'attempts': 'id', 'sessions': 'id', 'review': 'questionId', 'lessons': 'access_key', 'mastery': 'key'}[kind]
        return {field: key, 'synthetic': True, **extra}

    def record(kind='sessions', key='synthetic-session', revision=0, local=1, action=None, **extra):
        action = action or ('append' if kind == 'attempts' else 'put')
        item = {'kind': kind, 'record_id': key, 'local_revision': local, 'action': action}
        if kind != 'attempts':
            item['expected_revision'] = revision
        if action != 'delete':
            item['value'] = value(kind, key, **extra)
        return item

    def commit(who, records=None, generation=0, operation_id=None):
        return {**bind(who), 'action': 'commit', 'operation_id': str(operation_id or uuid.uuid4()),
                'reset_generation': generation, 'records': records if records is not None else [record()]}

    def reset(who, revision, generation=0, operation_id=None):
        return {**bind(who), 'action': 'reset', 'operation_id': str(operation_id or uuid.uuid4()),
                'reset_generation': generation, 'expected_owner_revision': revision}

    def call(name, who, payload=None, conn=db, token=None):
        assert name in RPCS
        with conn.transaction():
            caller_role = conn.execute('select current_role').fetchone()[0]
            conn.execute('set local role service_role')
            result = conn.execute(sql.SQL('select public.{}(%s,%s::jsonb)').format(sql.Identifier('learning_journal_' + name)),
                                  (who['token'] if token is None else token, Jsonb({} if payload is None else payload))).fetchone()[0]
            # SET LOCAL survives successful nested savepoint release. Restore
            # the prior caller before returning to a held fixture transaction;
            # errors instead restore it by rolling back this transaction scope.
            conn.execute(sql.SQL('set local role {}').format(sql.Identifier(caller_role)))
            return result

    def lookup(who, body, conn=db):
        return call('operation', who, {**bind(who), 'operation_id': body['operation_id']}, conn)

    def heads(who, keys, generation=0, conn=db):
        return call('heads', who, {**bind(who), 'reset_generation': generation, 'keys': [{'kind': k, 'record_id': i} for k, i in keys]}, conn)

    def snapshot(who, conn=db):
        return {table: [row[0] for row in conn.execute(sql.SQL('select to_jsonb(t)::text from private.{} t where incarnation_id=%s order by to_jsonb(t)::text').format(sql.Identifier(table)), (who['incarnation'],))] for table in TABLES}

    def unchanged_rejection(who, body, code='22023'):
        before = snapshot(who)
        rejected(lambda: call('apply', who, body), code)
        assert snapshot(who) == before

    def waiting(conn, timeout=3):
        end = time.monotonic() + timeout
        while time.monotonic() < end:
            db.execute('select pg_stat_clear_snapshot()')
            row = db.execute('select wait_event_type from pg_stat_activity where pid=%s', (conn.info.backend_pid,)).fetchone()
            if row and row[0] == 'Lock':
                return
            time.sleep(.01)
        raise AssertionError('Actual PostgreSQL lock wait was not observed')

    def async_call(name, who, payload, conn):
        try:
            return {'value': call(name, who, payload, conn)}
        except psycopg.Error as error:
            return {'error': error.sqlstate}

    def async_sql(conn, query, args=()):
        try:
            conn.execute(query, args)
            return 'ok'
        except psycopg.Error as error:
            return error.sqlstate

    @contextmanager
    def hook(who, table, event='insert', timing='after', body="raise exception 'Synthetic journal failure' using errcode='P0001';"):
        assert table in TABLES and event in ('insert', 'update', 'insert or update') and timing in ('before', 'after')
        name = 'fixture_journal_' + uuid.uuid4().hex
        query = sql.SQL('create function private.{}() returns trigger language plpgsql as $fixture$ begin if new.incarnation_id={}::uuid then {} end if; return new; end $fixture$').format(
            sql.Identifier(name), sql.Literal(str(who['incarnation'])), sql.SQL(body))
        db.execute(query)
        try:
            db.execute(sql.SQL('create trigger {} {} {} on private.{} for each row execute function private.{}()').format(sql.Identifier(name), sql.SQL(timing), sql.SQL(event), sql.Identifier(table), sql.Identifier(name)))
            try:
                yield
            finally:
                db.execute(sql.SQL('drop trigger {} on private.{}').format(sql.Identifier(name), sql.Identifier(table)))
        finally:
            db.execute(sql.SQL('drop function private.{}()').format(sql.Identifier(name)))

    @contextmanager
    def owner_position(who, **fields):
        allowed = {'operation_count', 'attempt_count', 'version_count', 'head_count', 'charged_bytes', 'reset_generation', 'owner_revision'}
        assert set(fields) <= allowed
        with db.transaction(force_rollback=True):
            db.execute('alter table private.learning_journal_owners disable trigger journal_owners_transition')
            assignments = sql.SQL(',').join(sql.SQL('{}=%s').format(sql.Identifier(key)) for key in fields)
            db.execute(sql.SQL('update private.learning_journal_owners set {} where incarnation_id=%s').format(assignments), (*fields.values(), who['incarnation']))
            db.execute('alter table private.learning_journal_owners enable trigger journal_owners_transition')
            yield

    assert db.execute('show server_version_num').fetchone()[0].startswith('15')
    assert all(db.execute(sql.SQL('select count(*) from private.{}').format(sql.Identifier(t))).fetchone()[0] == 0 for t in TABLES)
    key = db.execute("select pg_get_constraintdef(oid) from pg_constraint where conrelid='private.learning_owner_routes'::regclass and conname='learning_route_journal_scope_key'").fetchone()[0]
    assert key == 'UNIQUE (organization_id, account_id, fence_id, epoch)'
    mark('J001')

    for table in TABLES:
        assert db.execute('select relrowsecurity from pg_class where oid=%s::regclass', ('private.' + table,)).fetchone()[0]
        for role in ('anon', 'authenticated', 'service_role', 'fixture_unprivileged'):
            assert all(not db.execute('select has_table_privilege(%s,%s,%s)', (role, 'private.' + table, privilege)).fetchone()[0] for privilege in ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'))
            for statement in ('select * from private.{}', 'insert into private.{} default values',
                              'update private.{} set incarnation_id=incarnation_id',
                              'delete from private.{}', 'truncate private.{} cascade'):
                def direct():
                    db.execute(sql.SQL('set local role {}').format(sql.Identifier(role)))
                    db.execute(sql.SQL(statement).format(sql.Identifier(table)))
                rejected(direct, '42501')
    for signature, in db.execute("select oid::regprocedure::text from pg_proc where pronamespace='private'::regnamespace and proname like 'learning_journal_%'"):
        for role in ('anon', 'authenticated', 'service_role', 'fixture_unprivileged'):
            assert not db.execute('select has_function_privilege(%s,%s,%s)', (role, signature, 'EXECUTE')).fetchone()[0]
    for name in RPCS:
        for role in ('anon', 'authenticated', 'service_role', 'fixture_unprivileged'):
            assert db.execute('select has_function_privilege(%s,%s,%s)', (role, 'public.learning_journal_' + name + '(text,jsonb)', 'EXECUTE')).fetchone()[0] is (role == 'service_role')
    mark('J003')

    a = owner()
    state = call('state', a)
    assert state == {'ok': True, 'contract': CONTRACT, 'organization_id': str(a['organization']),
                     'account_id': str(a['account']), 'incarnation_id': str(a['incarnation']),
                     'adoption_epoch': 1, 'reset_generation': 0, 'owner_revision': 0,
                     'grading_authoritative': False, 'limits': {
                         'record_operations': 128, 'row_bytes': 65536, 'normalized_request_bytes': 1048576,
                         'heads_per_read': 8, 'read_response_bytes': 1048576, 'depth': 24, 'nodes': 100000,
                         'retained_operations': 50000, 'retained_attempts': 50000, 'retained_versions': 200000,
                         'retained_heads': 50000, 'retained_normalized_bytes': 268435456, 'integer_max': MAX_INT}}
    assert type(state['ok']) is bool and type(state['grading_authoritative']) is bool
    assert all(type(v) is int for v in state['limits'].values())
    first = commit(a, [record('attempts', 'attempt-a'), record()])
    call('apply', a, first)
    before = snapshot(a)
    for table in TABLES:
        for operation in ('delete', 'truncate'):
            # CASCADE includes only the candidate's dependent journal tables
            # and reaches the retention trigger instead of the earlier FK
            # TRUNCATE preflight. The statement must still roll back entirely.
            rejected(lambda table=table, operation=operation: db.execute(sql.SQL(operation + ' ' + ('from ' if operation == 'delete' else '') + 'private.{}' + (' cascade' if operation == 'truncate' else '')).format(sql.Identifier(table))), '23514')
    for table in ('learning_journal_operations', 'learning_journal_attempts', 'learning_journal_versions'):
        rejected(lambda table=table: db.execute(sql.SQL('update private.{} set incarnation_id=incarnation_id').format(sql.Identifier(table))), '23514')
    rejected(lambda: db.execute('update private.learning_journal_owners set owner_revision=0 where incarnation_id=%s', (a['incarnation'],)), '23514')
    rejected(lambda: db.execute('update private.learning_journal_heads set record_revision=record_revision where incarnation_id=%s', (a['incarnation'],)), '23514')
    assert snapshot(a) == before
    mark('J004')

    b = owner(other_org)
    invalid = owner(route=True, state=False)
    rejected(lambda: db.execute('insert into private.learning_journal_owners(organization_id,account_id,incarnation_id,adoption_epoch) values(%s,%s,%s,1)', (other_org, invalid['account'], invalid['incarnation'])), ('23503', '23514'))
    rejected(lambda: db.execute('insert into private.learning_journal_attempts values(%s,%s,%s,1,%s,0,%s,%s,%s)', (b['organization'], a['account'], a['incarnation'], 'crossed', uuid.UUID(first['operation_id']), Jsonb(value('attempts', 'crossed')), '0' * 64)), ('23503', '23514'))
    mark('J005')
    for missing in (owner(route=False), invalid):
        rejected(lambda missing=missing: call('state', missing), '55000')
        assert not snapshot(missing)['learning_journal_owners']
    bad = commit(a);bad['incarnation_id'] = str(b['incarnation'])
    unchanged_rejection(a, bad, '55000')
    bad = commit(a);bad['adoption_epoch'] = 0
    unchanged_rejection(a, bad, '55000')
    mark('J006')
    for role in ('teacher', 'admin', 'parent'):
        who = owner(role=role)
        rejected(lambda who=who: call('state', who), '42501')
    for field in ('organization_id', 'account_id', 'role', 'owner', 'verified'):
        bad = commit(a);bad[field] = 'synthetic'
        unchanged_rejection(a, bad)
    mark('J007')

    old = owner(route=False)
    db.execute('delete from public.accounts where id=%s', (old['account'],))
    replacement = owner(account_id=old['account'])
    assert old['incarnation'] != replacement['incarnation']
    bad = commit(replacement);bad['incarnation_id'] = str(old['incarnation'])
    unchanged_rejection(replacement, bad, '55000')
    moving = owner(route=False)
    db.execute('update public.accounts set organization_id=%s where id=%s', (other_org, moving['account']))
    assert db.execute('select id from private.learning_owner_fences where live_account_id=%s', (moving['account'],)).fetchone()[0] == moving['incarnation']
    rejected(lambda: call('state', moving), '55000')
    mark('J008')
    for token in ('', 'g' * 64, '0' * 64):
        rejected(lambda token=token: call('state', a, token=token), '28000')
    for change in ("expires_at=clock_timestamp()-interval '1 second'", 'revoked_at=clock_timestamp()'):
        who = owner();db.execute('update private.sessions set ' + change + ' where id=%s', (who['session'],))
        unchanged_rejection(who, commit(who), '28000')
    who = owner();db.execute("update public.accounts set status='suspended' where id=%s", (who['account'],))
    unchanged_rejection(who, commit(who), '28000')
    mark('J009')

    def owner_wait(change, expected, name='apply', known=False):
        who = owner();body = commit(who)
        if known:call('apply', who, body)
        payload = body if name == 'apply' else {**bind(who), 'operation_id': body['operation_id']} if name == 'operation' else {**bind(who), 'reset_generation': 0, 'keys': [{'kind': 'sessions', 'record_id': 'synthetic-session'}]} if name == 'heads' else {}
        initial = snapshot(who)
        with connect() as blocker, connect() as worker, ThreadPoolExecutor(max_workers=1) as pool:
            blocker.execute('begin');blocker.execute('select 1 from private.learning_journal_owners where incarnation_id=%s for update', (who['incarnation'],))
            future = pool.submit(async_call, name, who, payload, worker)
            try:
                waiting(worker);change(who);blocker.execute('commit')
                assert future.result(timeout=7) == {'error': expected}
            finally:
                blocker.execute('rollback')
        assert snapshot(who) == initial

    owner_wait(lambda w: db.execute('update private.sessions set revoked_at=clock_timestamp() where id=%s', (w['session'],)), '28000')
    mark('J010')
    owner_wait(lambda w: db.execute("update public.accounts set role='teacher' where id=%s", (w['account'],)), '42501')
    owner_wait(lambda w: db.execute("update public.accounts set status='suspended' where id=%s", (w['account'],)), '28000')
    mark('J011')
    who = owner();body = commit(who)
    with connect() as blocker, connect() as worker, ThreadPoolExecutor(max_workers=1) as pool:
        blocker.execute('begin');blocker.execute('select 1 from public.accounts where id=%s for update', (who['account'],))
        future = pool.submit(async_call, 'apply', who, body, worker)
        try:
            waiting(worker);db.execute('update private.sessions set revoked_at=clock_timestamp() where id=%s', (who['session'],));blocker.execute('rollback')
            assert future.result(timeout=7) == {'error': '28000'}
        finally:blocker.execute('rollback')
    assert call('operation', a, {**bind(a), 'operation_id': body['operation_id']})['found'] is False
    assert not snapshot(who)['learning_journal_operations']
    mark('J012')
    who = owner();body = commit(who)
    with connect() as blocker, connect() as worker, ThreadPoolExecutor(max_workers=1) as pool:
        blocker.execute('begin')
        # The initial unlocked lookup sees the old one-hour expiry. The fresh
        # locked lookup must observe this committed, now-expired row version.
        blocker.execute("update private.sessions set expires_at=clock_timestamp()+interval '800 milliseconds' where id=%s", (who['session'],))
        future = pool.submit(async_call, 'apply', who, body, worker)
        try:
            waiting(worker);db.execute('select pg_sleep(0.9)');blocker.execute('commit')
            assert future.result(timeout=7) == {'error': '28000'}
        finally:blocker.execute('rollback')
    assert not snapshot(who)['learning_journal_operations']
    mark('J013')

    who = owner();body = commit(who);lock_id = uuid.uuid4().int % (2 ** 62)
    with hook(who, 'learning_journal_operations', body='perform pg_advisory_xact_lock(' + str(lock_id) + ');'):
        with connect() as gate, connect() as worker, connect() as revoker, ThreadPoolExecutor(max_workers=2) as pool:
            gate.execute('begin');gate.execute('select pg_advisory_xact_lock(%s)', (lock_id,))
            first_future = pool.submit(async_call, 'apply', who, body, worker)
            try:
                waiting(worker)
                revoke_future = pool.submit(async_sql, revoker, 'update private.sessions set revoked_at=clock_timestamp() where id=%s', (who['session'],))
                waiting(revoker);gate.execute('commit')
                assert first_future.result(timeout=7)['value']['receipt']['durability'] == 'committed'
                assert revoke_future.result(timeout=7) == 'ok'
            finally:gate.execute('rollback')
    rejected(lambda: lookup(who, body), '28000')
    assert len(snapshot(who)['learning_journal_operations']) == 1
    mark('J014')
    who = owner();body = commit(who, [record('attempts', 'expiry-attempt'), record()]);initial = snapshot(who)
    lock_id = uuid.uuid4().int % (2 ** 62)
    with hook(who, 'learning_journal_owners', event='update', body='perform pg_advisory_xact_lock(' + str(lock_id) + ');'):
        with connect() as gate, connect() as worker, ThreadPoolExecutor(max_workers=1) as pool:
            gate.execute('begin');gate.execute('select pg_advisory_xact_lock(%s)', (lock_id,))
            db.execute("update private.sessions set expires_at=clock_timestamp()+interval '2 seconds' where id=%s", (who['session'],))
            future = pool.submit(async_call, 'apply', who, body, worker)
            try:
                waiting(worker)
                # The observed advisory wait is in the AFTER owner update,
                # proving all compound writes happened before natural expiry.
                db.execute("select pg_sleep(greatest(0,extract(epoch from expires_at-clock_timestamp()))+0.05) from private.sessions where id=%s", (who['session'],))
                gate.execute('commit')
                assert future.result(timeout=7) == {'error': '28000'}
            finally:gate.execute('rollback')
    assert snapshot(who) == initial
    mark('J015')
    for name in ('state', 'operation', 'heads', 'apply'):
        owner_wait(lambda w: db.execute('update private.sessions set revoked_at=clock_timestamp() where id=%s', (w['session'],)), '28000', name, True)
    mark('J016')
    for isolation in ('repeatable read', 'serializable'):
        who = owner()
        for name, payload in [('state', {}), ('apply', commit(who)), ('operation', {**bind(who), 'operation_id': str(uuid.uuid4())}), ('heads', {**bind(who), 'reset_generation': 0, 'keys': [{'kind': 'sessions', 'record_id': 'none'}]})]:
            with connect() as connection:
                connection.execute('begin isolation level ' + isolation)
                rejected(lambda: call(name, who, payload, connection), '0A000', connection)
                connection.execute('rollback')
        legacy = owner(route=False)
        with connect() as connection:
            connection.execute('begin isolation level ' + isolation)
            connection.execute("insert into public.learning_sessions(organization_id,account_id,client_session_id,mode,started_at,payload) values(%s,%s,%s,'practice',clock_timestamp(),%s)", (legacy['organization'], legacy['account'], uuid.uuid4().hex, Jsonb({'synthetic': True})))
            connection.execute('rollback')
    mark('J017')
    one = owner();two = owner()
    with connect() as blocker, connect() as worker, ThreadPoolExecutor(max_workers=1) as pool:
        blocker.execute('begin');blocker.execute('select 1 from private.learning_journal_owners where incarnation_id=%s for update', (one['incarnation'],))
        try:assert pool.submit(async_call, 'apply', two, commit(two), worker).result(timeout=3)['value']['replayed'] is False
        finally:blocker.execute('rollback')
    mark('J018')
    who = owner();body = commit(who)
    with connect() as maintenance, connect() as worker, ThreadPoolExecutor(max_workers=1) as pool:
        maintenance.execute('begin');maintenance.execute('select * from public.api_session_lookup(%s)', (who['token'],))
        future = pool.submit(async_call, 'apply', who, body, worker)
        try:
            waiting(worker);maintenance.execute('commit');assert 'value' in future.result(timeout=7)
        finally:maintenance.execute('rollback')
    assert lookup(who, body)['found'] is True
    maintainer = owner(role='admin', route=False)
    owner_wait(lambda w: db.execute('select public.api_set_account_status(%s,%s,%s)',
                                   (maintainer['account'], w['account'], 'suspended')), '28000')

    def password_reset(w):
        db.execute("insert into private.account_credentials(account_id,password_hash) values(%s,'synthetic-not-a-login-hash')", (w['account'],))
        db.execute('select public.api_reset_password(%s,%s,%s)', (maintainer['account'], w['account'], 'SyntheticOnly-4!Journal'))
        assert db.execute('select password_version from private.account_credentials where account_id=%s', (w['account'],)).fetchone()[0] == 2

    owner_wait(password_reset, '28000')
    mark('J019')

    def contenders(who, left, right):
        with connect() as blocker, connect() as c1, connect() as c2, ThreadPoolExecutor(max_workers=2) as pool:
            blocker.execute('begin');blocker.execute('select 1 from private.learning_journal_owners where incarnation_id=%s for update', (who['incarnation'],))
            f1 = pool.submit(async_call, 'apply', who, left, c1)
            f2 = pool.submit(async_call, 'apply', who, right, c2)
            try:
                waiting(c1);waiting(c2);blocker.execute('commit')
                return f1.result(timeout=7), f2.result(timeout=7)
            finally:blocker.execute('rollback')

    who = owner();body = commit(who)
    results = contenders(who, body, body)
    assert all('value' in r for r in results) and sorted(r['value']['replayed'] for r in results) == [False, True]
    assert results[0]['value']['receipt'] == results[1]['value']['receipt']
    assert len(snapshot(who)['learning_journal_operations']) == 1 and call('state', who)['owner_revision'] == 1
    mark('J020')
    mutations = []
    for key, val in [('reset_generation', 1), ('adoption_epoch', 0)]:
        changed = copy.deepcopy(body);changed[key] = val;mutations.append((changed, '55000' if key == 'adoption_epoch' else '40001'))
    for key, val in [('local_revision', 2), ('expected_revision', 1)]:
        changed = copy.deepcopy(body);changed['records'][0][key] = val;mutations.append((changed, '40001'))
    changed = copy.deepcopy(body);changed['records'][0]['value']['different'] = True;mutations.append((changed, '40001'))
    mutations.append((reset(who, 1, operation_id=body['operation_id']), '40001'))
    for changed, code in mutations:unchanged_rejection(who, changed, code)
    call('apply', who, reset(who, 1))
    changed = copy.deepcopy(body);changed['records'][0]['value']['different'] = True
    unchanged_rejection(who, changed, '40001')
    mark('J021')
    fresh_token = hashlib.sha256(uuid.uuid4().bytes).hexdigest()
    db.execute("insert into private.sessions(account_id,token_hash,expires_at) values(%s,%s,clock_timestamp()+interval '1 hour')", (who['account'], fresh_token))
    assert call('apply', who, body, token=fresh_token)['receipt'] == results[0]['value']['receipt']
    mark('J022')
    who = owner();body = commit(who)
    with connect() as connection:
        acknowledged = call('apply', who, body, connection)
    assert lookup(who, body)['receipt'] == acknowledged['receipt']
    assert call('apply', who, body)['replayed'] is True
    uncommitted = commit(who, [record(key='rolled-back')])
    with connect() as connection:
        connection.execute('begin');call('apply', who, uncommitted, connection);connection.execute('rollback')
    assert lookup(who, uncommitted)['found'] is False
    assert call('apply', who, uncommitted)['replayed'] is False
    mark('J023')
    foreign = owner(other_org)
    assert lookup(foreign, body) == {'ok': True, 'contract': CONTRACT, 'found': False, 'receipt': None, 'current': {'reset_generation': 0, 'owner_revision': 0}}
    assert lookup(who, {'operation_id': str(uuid.uuid4())})['found'] is False
    mark('J024')
    who = owner();l = commit(who);r = commit(who)
    result = contenders(who, l, r)
    assert sum('value' in x for x in result) == 1 and [x['error'] for x in result if 'error' in x] == ['40001']
    assert call('state', who)['owner_revision'] == 1
    mark('J025')
    who = owner();result = contenders(who, commit(who, [record(key='left')]), commit(who, [record(key='right')]))
    assert all('value' in x for x in result) and sorted(x['value']['receipt']['owner_revision'] for x in result) == [1, 2]
    assert [x['revision'] for x in heads(who, [('sessions', 'left'), ('sessions', 'right')])['records']] == [1, 1]
    mark('J026')
    who = owner();assert heads(who, [('sessions', 'missing')])['records'][0]['revision'] == 0
    unchanged_rejection(who, commit(who, [record(key='missing', action='delete', revision=1)]), '40001')
    call('apply', who, commit(who));call('apply', who, commit(who, [record(action='delete', revision=1)]))
    tomb = heads(who, [('sessions', 'synthetic-session')])['records'][0]
    assert tomb['deleted'] is True and tomb['revision'] == 2 and tomb['value'] is None
    unchanged_rejection(who, commit(who), '40001')
    assert call('apply', who, commit(who, [record(revision=2)]))['receipt']['records'][0]['record_revision'] == 3
    mark('J027')
    body = commit(who, [record('attempts', 'compound-new'), record(revision=1), record('review', 'review-new')])
    unchanged_rejection(who, body, '40001')
    mark('J028')
    who = owner();item = record('attempts', 'stable-attempt', correct=True, verified=True)
    original = call('apply', who, commit(who, [item]));call('apply', who, reset(who, 1))
    repeated = call('apply', who, commit(who, [item], generation=1))
    assert repeated['receipt']['records'][0]['disposition'] == 'existing' and repeated['receipt']['records'][0]['record_generation'] == 0
    assert len(snapshot(who)['learning_journal_attempts']) == 1 and repeated['receipt']['grading_authoritative'] is False
    mark('J029')
    changed = copy.deepcopy(item);changed['value']['correct'] = False
    unchanged_rejection(who, commit(who, [changed], generation=1), '23514')
    mark('J030')
    for items in ([item, item], [record('attempts', 'bad', action='delete')], [record('attempts', 'bad', id=None)]):
        bad = commit(who, items, generation=1);unchanged_rejection(who, bad)
    for alias in ('client_event_id', 'event_id'):
        baditem = record('attempts', 'alias');baditem['value'][alias] = 'different'
        unchanged_rejection(who, commit(who, [baditem], generation=1))
    for key in ('__proto__', 'prototype', 'constructor', 'token', 'access_token', 'refresh_token', 'authorization', 'serviceKey', 'service_key', 'password'):
        baditem = record(key='secret');baditem['value']['nested'] = {key: 'synthetic-secret'}
        unchanged_rejection(who, commit(who, [baditem], generation=1))
    mark('J031')

    for table, event in [('learning_journal_operations', 'insert'), ('learning_journal_attempts', 'insert'), ('learning_journal_versions', 'insert'), ('learning_journal_heads', 'insert'), ('learning_journal_owners', 'update')]:
        who = owner();body = commit(who, [record('attempts', 'failed-attempt'), record()]);initial = snapshot(who)
        with hook(who, table, event=event):rejected(lambda: call('apply', who, body), 'P0001')
        assert snapshot(who) == initial and lookup(who, body)['found'] is False
        assert call('apply', who, body)['replayed'] is False
    mark('J032')
    for table, event in [('learning_journal_operations', 'insert'), ('learning_journal_attempts', 'insert'), ('learning_journal_versions', 'insert'), ('learning_journal_heads', 'insert'), ('learning_journal_owners', 'update')]:
        who = owner();body = commit(who, [record('attempts', 'suppressed-attempt'), record()]);initial = snapshot(who)
        with hook(who, table, event=event, timing='before', body='return null;'):
            rejected(lambda: call('apply', who, body), '23514')
        assert snapshot(who) == initial
    # JSONB equality alone equates 1 and 1.0. Retained value text and hash must
    # still match the exact normalized value planned by the operation.
    for table in ('learning_journal_attempts', 'learning_journal_versions'):
        who = owner()
        kind = 'attempts' if table.endswith('attempts') else 'sessions'
        body = commit(who, [record(kind, 'numeric-scale', a=1, b=2.0)])
        initial = snapshot(who)
        with hook(who, table, timing='before', body="new.value:=jsonb_set(jsonb_set(new.value,'{a}','1.0'::jsonb),'{b}','2'::jsonb);"):
            rejected(lambda: call('apply', who, body), '23514')
        assert snapshot(who) == initial
    who = owner();body = commit(who);initial = snapshot(who)
    with hook(who, 'learning_journal_operations', timing='before', body="new.receipt:=jsonb_set(new.receipt,'{owner_revision}','1.0'::jsonb);"):
        rejected(lambda: call('apply', who, body), '23514')
    assert snapshot(who) == initial
    mark('J033')
    who = owner();body = commit(who, [record('attempts', 'before-reset'), record()]);prior = call('apply', who, body)
    before = snapshot(who);reset_body = reset(who, 1);reset_result = call('apply', who, reset_body)
    after = snapshot(who)
    assert reset_result['receipt']['reset_to'] == 1 and reset_result['receipt']['records'] == []
    assert after['learning_journal_attempts'] == before['learning_journal_attempts'] and after['learning_journal_versions'] == before['learning_journal_versions'] and after['learning_journal_heads'] == before['learning_journal_heads']
    assert heads(who, [('sessions', 'synthetic-session')], generation=1)['records'][0]['revision'] == 0
    mark('J034')
    who = owner();body = reset(who, 0);r = contenders(who, body, body)
    assert all('value' in x for x in r) and sorted(x['value']['replayed'] for x in r) == [False, True]
    assert call('state', who)['reset_generation'] == 1
    who = owner();r = contenders(who, reset(who, 0), reset(who, 0))
    assert sum('value' in x for x in r) == 1 and [x['error'] for x in r if 'error' in x] == ['40001']
    mark('J035')
    def ordered(first_kind):
        who = owner();body = commit(who);reset_body = reset(who, 0)
        with connect() as first_conn, connect() as second_conn, ThreadPoolExecutor(max_workers=1) as pool:
            first_conn.execute('begin');first_payload = body if first_kind == 'commit' else reset_body
            call('apply', who, first_payload, first_conn)
            future = pool.submit(async_call, 'apply', who, reset_body if first_kind == 'commit' else body, second_conn)
            try:
                waiting(second_conn);first_conn.execute('commit');assert future.result(timeout=7) == {'error': '40001'}
            finally:first_conn.execute('rollback')
        return who, body, reset_body
    ordered('commit');mark('J036')
    delayed, delayed_body, _ = ordered('reset');assert lookup(delayed, delayed_body)['found'] is False
    mark('J037')
    who = owner();body = commit(who);original = call('apply', who, body)['receipt']
    call('apply', who, reset(who, 1));call('apply', who, reset(who, 2, generation=1));initial = snapshot(who)
    replay = call('apply', who, body)
    assert replay['receipt'] == original and replay['current'] == {'reset_generation': 2, 'owner_revision': 3} and replay['replayed'] is True
    assert snapshot(who) == initial
    mark('J038')
    call('apply', who, commit(who, [record(new_generation=True)], generation=2));initial = heads(who, [('sessions', 'synthetic-session')], generation=2)
    call('apply', who, body)
    assert heads(who, [('sessions', 'synthetic-session')], generation=2) == initial
    mark('J039')
    for field, amount, expected_revision, generation in [('reset_generation', MAX_INT, 4, MAX_INT), ('owner_revision', MAX_INT, MAX_INT, 2), ('operation_count', 50000, 4, 2), ('charged_bytes', 268435456, 4, 2)]:
        with owner_position(who, **{field: amount}):unchanged_rejection(who, reset(who, expected_revision, generation), '54000')
    mark('J040')

    def size(obj):return db.execute('select octet_length(%s::jsonb::text)', (Jsonb(obj),)).fetchone()[0]
    who = owner();item = record(key='row-limit');item['value']['pad'] = ''
    item['value']['pad'] = 'x' * (65536 - size(item['value']))
    assert size(item['value']) == 65536
    assert call('apply', who, commit(who, [item]))['receipt']['records'][0]['record_revision'] == 1
    item['value']['pad'] += 'x';unchanged_rejection(who, commit(who, [item]), '54000')
    who = owner();assert len(call('apply', who, commit(who, [record(key='n-' + str(i)) for i in range(128)]))['receipt']['records']) == 128
    unchanged_rejection(who, commit(who, [record(key='over-' + str(i)) for i in range(129)]))
    nested = None
    for _ in range(23):nested = [nested]
    db.execute('select private.learning_journal_bounded(%s)', (Jsonb(nested),))
    rejected(lambda: db.execute('select private.learning_journal_bounded(%s)', (Jsonb([nested]),)), '54000')
    db.execute('select private.learning_journal_bounded(%s)', (Jsonb([None] * 99999),))
    rejected(lambda: db.execute('select private.learning_journal_bounded(%s)', (Jsonb([None] * 100000),)), '54000')
    for bad in (None, True, -1, 0, 1.5, MAX_INT + 1, '1'):
        altered = commit(who);altered['records'][0]['local_revision'] = bad;unchanged_rejection(who, altered)
    valid = record(key='maximum-local-revision', local=MAX_INT)
    assert call('apply', who, commit(who, [valid]))['receipt']['records'][0]['local_revision'] == MAX_INT
    # Position only the candidate's synthetic head at the final legal record
    # revision. Its referenced immutable row is also a fixture row; the entire
    # adjustment is rolled back and the normal transition guard restored.
    with db.transaction(force_rollback=True):
        db.execute('insert into private.learning_journal_versions select organization_id,account_id,incarnation_id,adoption_epoch,record_generation,kind,record_id,%s,operation_id,deleted,value,value_sha256 from private.learning_journal_versions where incarnation_id=%s and record_id=%s and record_revision=1',
                   (MAX_INT, who['incarnation'], 'maximum-local-revision'))
        db.execute('alter table private.learning_journal_heads disable trigger journal_heads_transition')
        db.execute('update private.learning_journal_heads set record_revision=%s where incarnation_id=%s and record_id=%s', (MAX_INT, who['incarnation'], 'maximum-local-revision'))
        db.execute('alter table private.learning_journal_heads enable trigger journal_heads_transition')
        unchanged_rejection(who, commit(who, [record(key='maximum-local-revision', revision=MAX_INT)]), '54000')
    mark('J041')
    who = owner();unicode_id = '\U0001f9ee' * 128
    assert call('apply', who, commit(who, [record(key=unicode_id)]))['receipt']['records'][0]['record_id'] == unicode_id
    assert call('apply', who, commit(who, [record(key='中' * 256)]))['receipt']['records'][0]['record_id'] == '中' * 256
    distinct = ['é', 'e\u0301']
    assert [x['record_id'] for x in call('apply', who, commit(who, [record(key=x) for x in distinct]))['receipt']['records']] == distinct
    for bad, code in [('\U0001f9ee' * 129, '54000'), ('中' * 257, '54000'), ('bad\nline', '22023'), ('bad\u007fline', '22023'), ('bad\u009fline', '22023'), ('', '22023'), (42, '22023')]:
        item = record(key='valid');item['record_id'] = bad;unchanged_rejection(who, commit(who, [item]), code)
    for bad in ['é' * 64, 'Ａ' * 64]:rejected(lambda bad=bad: call('state', who, token=bad), '28000')
    rejected(lambda: db.execute('select %s::jsonb', ('"\\u0000"',)), '22P05')
    rejected(lambda: db.execute('select %s::jsonb', ('"\\ud800"',)), ('22P02', '22P05'))
    mark('J042')
    for raw in ['{"b":2,"a":1}', '{ "a" : 1, "b" : 2 }', '1', '1.0', '-0', '1e0', '[true,null,{"x":"é"}]']:
        normalized, actual = db.execute('select %s::jsonb::text, private.learning_journal_hash(%s::jsonb::text)', (raw, raw)).fetchone()
        assert actual == hashlib.sha256(normalized.encode('utf-8')).hexdigest()
    assert db.execute("select '1e0'::jsonb::text, '-0'::jsonb::text, '1.0'::jsonb::text").fetchone() == ('1', '0', '1.0')
    rejected(lambda: db.execute("select private.learning_journal_integer('1.0'::jsonb)"), '22023')
    assert db.execute("select private.learning_journal_integer('1e0'::jsonb)").fetchone()[0] == 1
    who = owner();body = commit(who);normal = call('apply', who, body)
    assert call('apply', who, dict(reversed(list(body.items()))))['receipt'] == normal['receipt']
    mark('J043')
    who = owner()
    # Fill several individually valid rows; the refusal must be caused by
    # the SQL-expanded envelope, never a single oversize value.
    large = commit(who, [record(key='expanded-' + str(i), pad='x' * 61000) for i in range(17)])
    wire = json.dumps(large, ensure_ascii=False, separators=(',', ':')).encode()
    extra = 1048576 - len(wire)
    assert extra > 0
    for item in large['records']:
        add = min(extra, 65536 - size(item['value']))
        item['value']['pad'] += 'x' * add
        extra -= add
    assert extra == 0 and all(size(item['value']) <= 65536 for item in large['records'])
    assert len(json.dumps(large, ensure_ascii=False, separators=(',', ':')).encode()) == 1048576
    assert size(large) > 1048576
    unchanged_rejection(who, large, '54000')
    mark('J044')
    for field, cap, items in [('operation_count', 50000, [record()]), ('attempt_count', 50000, [record('attempts', 'quota')]), ('version_count', 200000, [record()]), ('head_count', 50000, [record()]), ('charged_bytes', 268435456, [record()])]:
        who = owner()
        with owner_position(who, **{field: cap}):unchanged_rejection(who, commit(who, items), '54000')
    # Committed synthetic boundary positions are needed by independent
    # connections. Each altered counter is restored to its actual retained
    # row/byte total afterward. No quota-sized fake corpus is claimed.
    actual_counter = {
        'operation_count': '(select count(*) from private.learning_journal_operations o where o.incarnation_id=j.incarnation_id)',
        'attempt_count': '(select count(*) from private.learning_journal_attempts a where a.incarnation_id=j.incarnation_id)',
        'version_count': '(select count(*) from private.learning_journal_versions v where v.incarnation_id=j.incarnation_id)',
        'head_count': '(select count(*) from private.learning_journal_heads h where h.incarnation_id=j.incarnation_id)',
        'charged_bytes': '(select coalesce(sum(octet_length(o.request_text)+octet_length(o.receipt::text)),0) from private.learning_journal_operations o where o.incarnation_id=j.incarnation_id) + (select coalesce(sum(octet_length(a.value::text)),0) from private.learning_journal_attempts a where a.incarnation_id=j.incarnation_id) + (select coalesce(sum(octet_length(v.value::text)),0) from private.learning_journal_versions v where v.incarnation_id=j.incarnation_id)',
    }
    for field, cap in [('operation_count', 50000), ('attempt_count', 50000), ('version_count', 200000), ('head_count', 50000), ('charged_bytes', 268435456)]:
        who = owner();kind = 'attempts' if field == 'attempt_count' else 'sessions'
        left = commit(who, [record(kind, 'quota-aaaa')]);right = commit(who, [record(kind, 'quota-bbbb')])
        charge = 1
        if field == 'charged_bytes':
            # Measure actual PostgreSQL-normalized operation, receipt and
            # retained-value charge, then roll that probe back completely.
            with db.transaction(force_rollback=True):
                call('apply', who, left)
                charge = db.execute('select charged_bytes from private.learning_journal_owners where incarnation_id=%s', (who['incarnation'],)).fetchone()[0]
            assert charge > 0 and not snapshot(who)['learning_journal_operations']
        with db.transaction():
            db.execute('alter table private.learning_journal_owners disable trigger journal_owners_transition')
            db.execute(sql.SQL('update private.learning_journal_owners set {}=%s where incarnation_id=%s').format(sql.Identifier(field)), (cap-charge, who['incarnation']))
            db.execute('alter table private.learning_journal_owners enable trigger journal_owners_transition')
        try:
            result = contenders(who, left, right)
            assert sum('value' in x for x in result) == 1 and [x['error'] for x in result if 'error' in x] == ['54000']
            assert db.execute(sql.SQL('select {} from private.learning_journal_owners where incarnation_id=%s').format(sql.Identifier(field)), (who['incarnation'],)).fetchone()[0] == cap
        finally:
            with db.transaction():
                db.execute('alter table private.learning_journal_owners disable trigger journal_owners_transition')
                db.execute(sql.SQL('update private.learning_journal_owners j set {}={} where j.incarnation_id=%s').format(sql.Identifier(field), sql.SQL(actual_counter[field])), (who['incarnation'],))
                db.execute('alter table private.learning_journal_owners enable trigger journal_owners_transition')
    mark('J045')
    who = owner();call('apply', who, commit(who, [record(key='deleted'), record('review', 'review')]))
    call('apply', who, commit(who, [record(key='deleted', action='delete', revision=1)]))
    rows = heads(who, [('review', 'review'), ('sessions', 'missing'), ('sessions', 'deleted')])['records']
    assert [x['record_id'] for x in rows] == ['review', 'missing', 'deleted'] and [x['revision'] for x in rows] == [1, 0, 2]
    assert set(rows[0]) == {'kind', 'record_id', 'revision', 'deleted', 'value', 'value_sha256'}
    assert rows[1]['value_sha256'] is None and rows[2]['value_sha256'] == hashlib.sha256(b'null').hexdigest()
    assert len(heads(who, [('sessions', 'empty-' + str(i)) for i in range(8)])['records']) == 8
    rejected(lambda: heads(who, [('review', 'review'), ('review', 'review')]), '22023')
    rejected(lambda: heads(who, [('review', 'review')], generation=1), '40001')
    rejected(lambda: heads(who, [('sessions', str(i)) for i in range(9)]), '22023')
    mark('J046')
    body = commit(who, [record(key='receipt-history')]);receipt = call('apply', who, body)['receipt'];revision = receipt['owner_revision']
    stored_text = db.execute('select receipt::text from private.learning_journal_operations where incarnation_id=%s and operation_id=%s', (who['incarnation'], uuid.UUID(body['operation_id']))).fetchone()[0]
    call('apply', who, reset(who, revision));read = lookup(who, body)
    assert read['receipt'] == receipt and read['current']['reset_generation'] == 1
    assert db.execute('select receipt::text from private.learning_journal_operations where incarnation_id=%s and operation_id=%s', (who['incarnation'], uuid.UUID(body['operation_id']))).fetchone()[0] == stored_text
    mark('J047')
    for bad in [{'contract': 'echs.learning.owned.v1', 'operation_id': str(uuid.uuid4()), 'revision': 1, 'durability': 'committed'}, {'contract': 'echs.learning.sync-journal.v1', 'owner': {'account_id': str(who['account'])}, 'payload': {}}, {'contract': CONTRACT, 'action': 'adopt'}]:
        unchanged_rejection(who, bad)
    mark('J048')

    assert objects() == original_objects
    for table, rows in original_rows.items():
        after = {row[0] for row in db.execute(sql.SQL('select to_jsonb(t)::text from public.{} t').format(sql.Identifier(table)))}
        assert rows <= after, ('pre-existing public row changed', table)
    mark('J002')
    assert tuple(done) == EXPECTED_LABELS
    return {'executed_case_ids': [label.split(' ', 1)[0] for label in done],
            'deferred_case_ids': ['J049'],
            'deferred_reason': 'HTTP status/body/receipt and browser acknowledgement acceptance need the later transport; SQL does not claim those tests.',
            'network_scope': 'guarded disposable PostgreSQL connections only; no production or Storage calls'}
