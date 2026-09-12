"""Nine actual SQL groups for explicit missing-state errors; isolated fixtures only."""
import time
import uuid
from concurrent.futures import ThreadPoolExecutor

TABLES = ('assignment_results', 'learning_attempts', 'learning_sessions',
          'lesson_completions', 'mastery_records', 'review_items')
EXPECTED_LABELS = (
    'R01 Missing singleton rejects adoption without changing owner state',
    'R02 Missing singleton rejects TRUNCATE without deleting legacy records',
    'R03 Missing current companion rejects adoption without creating a route',
    'R04 Missing companion rejects all-six INSERT UPDATE DELETE and restores exact guards',
    'R05 Missing and deleted owners fail finitely under all three isolation levels',
    'R06 Snapshot predating provisioning fails while fresh authority preserves adoption fencing',
    'R07 Observed adoption lock preserves native fixed-snapshot writer serialization',
    'R08 Observed adoption lock preserves native fixed-snapshot TRUNCATE serialization',
    'R09 Parent deletion and identity changes preserve cascades and prevent resurrection',
)


def exercise(db, connect, passed):
    import psycopg
    from psycopg import sql
    from psycopg.types.json import Jsonb

    assert db.autocommit
    assert db.execute('show transaction_isolation').fetchone()[0] == 'read committed'
    assert db.execute('select count(*) from private.learning_owner_routes').fetchone()[0] == 0
    assert db.execute('select count(*) from private.learning_journal_owners').fetchone()[0] == 0
    assert db.execute('select epoch from private.learning_owner_barrier where id=1').fetchone() == (0,)
    counters = {'deliberate_absence_55000': 0, 'native_serialization_40001': 0,
                'observed_lock_waits': 0, 'all_six_mutations': 0}

    def organization():
        value = uuid.uuid4()
        db.execute("insert into public.organizations(id,name,slug) values(%s,'Synthetic retry fixture',%s)",
                   (value, 'retry-' + uuid.uuid4().hex))
        return value

    org = organization()
    other_org = organization()

    def account(scope=org, value=None):
        value = value or uuid.uuid4()
        db.execute("insert into public.accounts(id,organization_id,username,display_name,role) values(%s,%s,%s,'Synthetic retry owner','student')",
                   (value, scope, 'retry-' + uuid.uuid4().hex))
        return value

    admin = account()
    db.execute("update public.accounts set role='admin' where id=%s", (admin,))
    assignment = uuid.uuid4()
    db.execute("insert into public.assignments(id,organization_id,created_by,title,activity_type) values(%s,%s,%s,'Synthetic retry assignment','practice')",
               (assignment, org, admin))

    def values(table, owner, scope=org):
        key = uuid.uuid4().hex
        base = {'account_id': owner, 'organization_id': scope}
        payload = Jsonb({'synthetic': True})
        if table == 'learning_attempts':
            return {**base, 'client_event_id': key, 'question_id': 'SYNTHETIC-RETRY',
                    'correct': False, 'occurred_at': '2026-01-01T00:00:00Z', 'payload': payload}
        if table == 'learning_sessions':
            return {**base, 'client_session_id': key, 'mode': 'practice',
                    'started_at': '2026-01-01T00:00:00Z', 'payload': payload}
        if table == 'review_items':
            return {**base, 'question_id': key, 'payload': payload}
        if table == 'lesson_completions':
            return {**base, 'access_key': key, 'course_key': 'synthetic', 'unit_index': 0,
                    'topic': '1.1', 'completed_at': '2026-01-01T00:00:00Z', 'payload': payload}
        if table == 'mastery_records':
            return {**base, 'skill_key': key, 'source': 'server', 'score': 20,
                    'payload': Jsonb({'algorithm': 'echs-mastery-2.0-foundation', 'synthetic': True})}
        assert table == 'assignment_results'
        return {'assignment_id': assignment, 'student_id': owner,
                'status': 'in_progress', 'payload': payload}

    def insert(table, row, conn=db):
        conn.execute(sql.SQL('insert into public.{} ({}) values ({})').format(
            sql.Identifier(table), sql.SQL(',').join(map(sql.Identifier, row)),
            sql.SQL(',').join(sql.Placeholder() for _ in row)), tuple(row.values()))

    def column(table):
        return 'student_id' if table == 'assignment_results' else 'account_id'

    def count(table, owner, conn=db):
        return conn.execute(sql.SQL('select count(*) from public.{} where {}=%s').format(
            sql.Identifier(table), sql.Identifier(column(table))), (owner,)).fetchone()[0]

    def adopt(owner, conn=db, scope=org):
        conn.execute('insert into private.learning_owner_routes(organization_id,account_id) values(%s,%s)', (scope, owner))

    def fence(owner):
        return db.execute('select id,epoch,live_account_id from private.learning_owner_fences where account_id=%s order by created_at,id', (owner,)).fetchall()

    def schema():
        # Trusted fixture metadata stays in process; it is not a public report.
        return (
            db.execute("select n.nspname,c.relname,c.relacl,c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private') and c.relkind in ('r','p') order by n.nspname,c.relname").fetchall(),
            db.execute("select t.oid,t.tgenabled,pg_get_triggerdef(t.oid) from pg_trigger t where not t.tgisinternal order by t.oid").fetchall(),
            db.execute("select p.oid,md5(pg_get_functiondef(p.oid)),p.proacl from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.prokind='f' order by p.oid").fetchall(),
        )

    def protected():
        names = ['public.' + t for t in TABLES] + [
            'private.learning_owner_fences', 'private.learning_owner_routes',
            'private.learning_owner_barrier', 'private.learning_journal_owners']
        result = []
        for name in names:
            namespace, table = name.split('.')
            result.append(db.execute(sql.SQL("select count(*),md5(coalesce(string_agg(to_jsonb(t)::text,E'\\n' order by to_jsonb(t)::text),'')) from {} t").format(
                sql.Identifier(namespace, table))).fetchone())
        return result

    def rejected(conn, fn, expected='55000', count_absence=True):
        try:
            with conn.transaction():
                fn()
        except psycopg.Error as error:
            assert error.sqlstate == expected, (error.sqlstate, expected)
            if expected == '55000' and count_absence:
                counters['deliberate_absence_55000'] += 1
            if expected == '40001':
                counters['native_serialization_40001'] += 1
        else:
            raise AssertionError('Expected prerequisite or serialization failure')

    def remove_barrier():
        db.execute('alter table private.learning_owner_barrier disable trigger learning_barrier_delete')
        db.execute('delete from private.learning_owner_barrier where id=1')
        db.execute('alter table private.learning_owner_barrier enable trigger learning_barrier_delete')

    def remove_companion(owner):
        db.execute('alter table private.learning_owner_fences disable trigger learning_fence_record_guard')
        assert db.execute('delete from private.learning_owner_fences where live_account_id=%s', (owner,)).rowcount == 1
        db.execute('alter table private.learning_owner_fences enable trigger learning_fence_record_guard')

    original_schema = schema()
    target = account()
    insert('learning_sessions', values('learning_sessions', target))
    before = protected()
    with db.transaction(force_rollback=True):
        remove_barrier()
        rejected(db, lambda: adopt(target))
        assert fence(target)[0][1] == 0
        assert db.execute('select count(*) from private.learning_owner_routes').fetchone()[0] == 0
    assert protected() == before and schema() == original_schema
    passed(EXPECTED_LABELS[0])

    with db.transaction(force_rollback=True):
        remove_barrier()
        rejected(db, lambda: db.execute('truncate public.learning_sessions'))
        assert count('learning_sessions', target) == 1
    assert protected() == before and schema() == original_schema
    passed(EXPECTED_LABELS[1])

    with db.transaction(force_rollback=True):
        remove_companion(target)
        rejected(db, lambda: adopt(target))
        assert db.execute('select count(*) from private.learning_owner_routes').fetchone()[0] == 0
        assert db.execute('select epoch from private.learning_owner_barrier where id=1').fetchone() == (0,)
    assert protected() == before and schema() == original_schema
    passed(EXPECTED_LABELS[2])

    target = account()
    for table in TABLES:
        insert(table, values(table, target))
    before = protected()
    with db.transaction(force_rollback=True):
        remove_companion(target)
        missing_state = protected()
        for table in TABLES:
            rejected(db, lambda table=table: insert(table, values(table, target)))
            rejected(db, lambda table=table: db.execute(sql.SQL('update public.{} set payload=payload where {}=%s').format(
                sql.Identifier(table), sql.Identifier(column(table))), (target,)))
            rejected(db, lambda table=table: db.execute(sql.SQL('delete from public.{} where {}=%s').format(
                sql.Identifier(table), sql.Identifier(column(table))), (target,)))
            counters['all_six_mutations'] += 3
            assert protected() == missing_state
    assert protected() == before and schema() == original_schema
    passed(EXPECTED_LABELS[3])

    deleted = account()
    db.execute('delete from public.accounts where id=%s', (deleted,))
    before = protected()
    for isolation in ('read committed', 'repeatable read', 'serializable'):
        for missing in (uuid.uuid4(), deleted):
            with connect() as conn:
                conn.execute('begin isolation level ' + isolation)
                try:
                    rejected(conn, lambda: insert('learning_sessions', values('learning_sessions', missing), conn))
                finally:
                    conn.execute('rollback')
            assert count('learning_sessions', missing) == 0
    assert protected() == before and schema() == original_schema
    passed(EXPECTED_LABELS[4])

    for isolation in ('repeatable read', 'serializable'):
        target = uuid.uuid4()
        with connect() as stale:
            stale.execute('begin isolation level ' + isolation)
            stale.execute('select count(*) from private.learning_owner_fences')
            account(value=target)
            try:
                rejected(stale, lambda: insert('learning_sessions', values('learning_sessions', target), stale))
            finally:
                stale.execute('rollback')
        assert count('learning_sessions', target) == 0 and fence(target)[0][1] == 0
        with connect() as fresh:
            insert('learning_sessions', values('learning_sessions', target), fresh)
        assert count('learning_sessions', target) == 1
        adopt(target)
        before = protected()
        with connect() as fresh:
            rejected(fresh, lambda: insert('learning_sessions', values('learning_sessions', target), fresh), count_absence=False)
        assert protected() == before and schema() == original_schema
    passed(EXPECTED_LABELS[5])

    def waiting(pid):
        deadline = time.monotonic() + 4
        while time.monotonic() < deadline:
            db.execute('select pg_stat_clear_snapshot()')
            row = db.execute('select wait_event_type from pg_stat_activity where pid=%s', (pid,)).fetchone()
            if row == ('Lock',):
                counters['observed_lock_waits'] += 1
                return
            time.sleep(.02)
        raise AssertionError('Actual PostgreSQL lock overlap was not observed')

    def outcome(conn, fn):
        try:
            fn()
            return 'ok'
        except psycopg.Error as error:
            return error.sqlstate

    with ThreadPoolExecutor(max_workers=1) as pool:
        for isolation in ('repeatable read', 'serializable'):
            target = account()
            with connect() as stale, connect() as adopter:
                stale.execute('begin isolation level ' + isolation)
                stale.execute('select count(*) from private.learning_owner_fences')
                adopter.execute('begin')
                adopt(target, conn=adopter)
                future = pool.submit(outcome, stale, lambda: insert('learning_sessions', values('learning_sessions', target), stale))
                try:
                    waiting(stale.info.backend_pid)
                    adopter.execute('commit')
                    assert future.result(timeout=6) == '40001'
                    counters['native_serialization_40001'] += 1
                finally:
                    adopter.execute('rollback')
                    stale.cancel()
                    stale.execute('rollback')
                assert count('learning_sessions', target) == 0 and fence(target)[0][1] == 1
    assert schema() == original_schema
    passed(EXPECTED_LABELS[6])

    with ThreadPoolExecutor(max_workers=1) as pool:
        for isolation in ('repeatable read', 'serializable'):
            target = account()
            before_rows = protected()[:len(TABLES)]
            with connect() as stale, connect() as adopter:
                stale.execute('begin isolation level ' + isolation)
                stale.execute('select epoch from private.learning_owner_barrier where id=1')
                adopter.execute('begin')
                adopt(target, conn=adopter)
                future = pool.submit(outcome, stale, lambda: stale.execute('truncate public.learning_sessions'))
                try:
                    waiting(stale.info.backend_pid)
                    adopter.execute('commit')
                    assert future.result(timeout=6) == '40001'
                    counters['native_serialization_40001'] += 1
                finally:
                    adopter.execute('rollback')
                    stale.cancel()
                    stale.execute('rollback')
            assert protected()[:len(TABLES)] == before_rows
    assert schema() == original_schema
    passed(EXPECTED_LABELS[7])

    disposable = account()
    for table in TABLES:
        insert(table, values(table, disposable))
    old_fence = fence(disposable)[0][0]
    db.execute('delete from public.accounts where id=%s', (disposable,))
    assert all(count(table, disposable) == 0 for table in TABLES)
    assert fence(disposable) == [(old_fence, 0, None)]
    account(value=disposable)
    current_fence = next(row for row in fence(disposable) if row[2] == disposable)
    assert current_fence[0] != old_fence and current_fence[1] == 0
    renamed = account()
    replacement = uuid.uuid4()
    old_fence = fence(renamed)[0][0]
    db.execute('update public.accounts set id=%s where id=%s', (replacement, renamed))
    assert fence(renamed) == [(old_fence, 0, None)]
    assert fence(replacement)[0][0] != old_fence
    db.execute('update public.accounts set organization_id=%s where id=%s', (other_org, replacement))
    insert('learning_sessions', values('learning_sessions', replacement, other_org))
    adopt(replacement, scope=other_org)
    before = protected()
    rejected(db, lambda: db.execute('update public.accounts set organization_id=%s where id=%s', (org, replacement)), '23503', False)
    assert protected() == before

    with ThreadPoolExecutor(max_workers=1) as pool:
        target = account()
        with connect() as legacy, connect() as deleter:
            legacy.execute('begin')
            insert('learning_sessions', values('learning_sessions', target), legacy)
            future = pool.submit(outcome, deleter, lambda: deleter.execute('delete from public.accounts where id=%s', (target,)))
            try:
                waiting(deleter.info.backend_pid)
                legacy.execute('commit')
                assert future.result(timeout=6) == 'ok'
            finally:
                legacy.execute('rollback')
                deleter.cancel()
        assert count('learning_sessions', target) == 0 and fence(target)[0][2] is None

        target = account()
        with connect() as deleter, connect() as legacy:
            deleter.execute('begin')
            deleter.execute('delete from public.accounts where id=%s', (target,))
            future = pool.submit(outcome, legacy, lambda: insert('learning_sessions', values('learning_sessions', target), legacy))
            try:
                deadline = time.monotonic() + 4
                while True:
                    db.execute('select pg_stat_clear_snapshot()')
                    row = db.execute('select wait_event_type from pg_stat_activity where pid=%s', (legacy.info.backend_pid,)).fetchone()
                    if row == ('Lock',):
                        counters['observed_lock_waits'] += 1
                        break
                    if future.done():
                        assert future.result() == '55000'
                        break
                    assert time.monotonic() < deadline, 'Parent-delete overlap was not observed'
                    time.sleep(.02)
                deleter.execute('commit')
                result = future.result(timeout=6)
                # The existing FK and the explicit missing-fence branch are
                # distinct valid read-committed paths; no timeout is accepted.
                assert result in ('23503', '55000')
            finally:
                deleter.execute('rollback')
                legacy.cancel()
        assert count('learning_sessions', target) == 0
    assert schema() == original_schema
    assert db.execute('select count(*) from private.learning_journal_owners').fetchone()[0] == 0
    passed(EXPECTED_LABELS[8])
    assert counters['all_six_mutations'] == 18
    assert counters['native_serialization_40001'] == 4
    assert counters['observed_lock_waits'] >= 5
    return {**counters, 'fixture_schema_acl_triggers_restored': True,
            'journal_owners_remain_zero': True, 'production_calls': 0}
