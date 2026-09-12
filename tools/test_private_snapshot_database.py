#!/usr/bin/env python3
"""Actual isolated PostgreSQL C08 archive contracts (default major 15).

Requires a fresh loopback echs_bank_test_* database and the accepted prior-chain
report. No production configuration, source question content or Storage API.
Static mode is explicitly not database acceptance.
"""
import argparse
import copy
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import os
from pathlib import Path
import time
import uuid

from private_snapshot_fixture import CONTRACT, canonical, digest, fixture, frame, payload, root as content_root, roots_for, source_root

NEW = '202609090003_private_bank_snapshots.sql'
MEMBERSHIP = '202609090002_membership_authorization.sql'
TABLES = ['private_bank_snapshots', 'private_bank_snapshot_files', 'private_bank_snapshot_questions', 'private_bank_snapshot_question_files', 'private_bank_snapshot_mappings', 'private_bank_snapshot_events']
CAP = {'contract': CONTRACT, 'schema_version': 1, 'immutable_ready': True, 'student_delivery': False, 'max_record_bytes': 65536, 'max_object_bytes': 16777216, 'max_snapshot_bytes': 268435456}

def isolated_hostaddr(info):
    assert info.get('host') in ('127.0.0.1', 'localhost', '::1') and info.get('dbname', '').startswith('echs_bank_test_')
    assert not info.get('hostaddr') and not info.get('service') and not info.get('options')
    return '::1' if info['host'] == '::1' else '127.0.0.1'

def assert_connected_isolation(info, expected_address, expected_database):
    # libpq reports the client connection target. inet_server_addr() instead
    # reports Docker's bridge listener when CI maps a local port to a service.
    assert info.hostaddr == expected_address
    assert info.dbname == expected_database

def isolation_guard_vectors():
    from types import SimpleNamespace
    cases = 0
    base = {'host': '127.0.0.1', 'dbname': 'echs_bank_test_synthetic'}
    for host, address in [('127.0.0.1', '127.0.0.1'), ('localhost', '127.0.0.1'), ('::1', '::1')]:
        assert isolated_hostaddr({**base, 'host': host}) == address
        # A port-mapped server can report a bridge address; only libpq's actual
        # client target and exact database identity authorize this harness.
        assert_connected_isolation(SimpleNamespace(hostaddr=address, dbname=base['dbname'], server_side_address='172.19.0.2'), address, base['dbname'])
        cases += 1
    for changed in [{'host': 'database.example'}, {'host': '127.0.0.1,other'}, {'host': '/tmp'}, {'host': ''}, {'dbname': 'production'},
                    {'hostaddr': '127.0.0.1'}, {'hostaddr': '192.0.2.1'}, {'service': 'other'}, {'options': '-c search_path=other'}]:
        try:
            isolated_hostaddr({**base, **changed})
        except AssertionError:
            cases += 1
        else:
            raise AssertionError('Unsafe test connection override accepted')
    for address, database in [('192.0.2.1', base['dbname']), ('', base['dbname']), ('127.0.0.1', 'echs_bank_test_other'), ('127.0.0.1', 'production')]:
        try:
            assert_connected_isolation(SimpleNamespace(hostaddr=address, dbname=database), '127.0.0.1', base['dbname'])
        except AssertionError:
            cases += 1
        else:
            raise AssertionError('Unexpected connected endpoint accepted')
    return cases

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo-root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--baseline-report', type=Path, default=Path('reports/membership-authorization-database.json'))
    parser.add_argument('--report', type=Path, default=Path('reports/private-snapshot-database.json'))
    parser.add_argument('--static-only', action='store_true')
    parser.add_argument('--postgres-major', type=int, choices=(15, 17), default=15)
    args = parser.parse_args()
    repo = args.repo_root.resolve()
    report = {'contract': 'echs.private-snapshot-database-test.v1', 'status': 'RUNNING; NOT PASS', 'production_calls': False, 'external_network': False, 'postgres_required': args.postgres_major, 'checks': []}
    def save():
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    def passed(label):
        report['checks'].append(label)
        print('PASS ' + label, flush=True)
        save()
    try:
        migrations = sorted(p for p in (repo / 'supabase/migrations').glob('*.sql') if p.name <= NEW)
        assert migrations[-1].name == NEW
        report['migrations'] = [{'file': p.name, 'sha256': digest(p.read_bytes())} for p in migrations]
        report['migration_count'] = len(migrations)
        source = migrations[-1].read_text(encoding='utf-8')
        assert source.count('create table public.') == 6
        assert source.count('create function public.') == 3
        assert 'create or replace' not in source.lower()
        assert 'alter table public.private_bank_packages' not in source.lower()
        assert source.rstrip().endswith('commit;')
        assert 'private_bank_class_snapshot_assignments' not in source
        assert frame(['', 'π', 'a:b|c']).hex() == '0000000000000002cf8000000005613a627c63'
        f = fixture('00000000-0000-4000-8000-000000000123', with_manifest=True)
        assert roots_for(f['files'], f['records'], f['mappings'], f['reserve']['unit_review_sets']) == {key: f['reserve'][key] for key in ('question_root', 'file_root', 'membership_root', 'mapping_root')}
        assert len(f['files']) == 5 and sum(len(q['bundle_memberships']) for q in f['records']) == 3
        passed('additive archive-only source and independent UTF-8 framing/manifest exclusion vectors')
        report['connection_isolation_vectors'] = isolation_guard_vectors()
        assert report['connection_isolation_vectors'] == 16
        passed('loopback client targets permit Docker port mapping but reject remote/override/wrong-database connections')
        if args.static_only:
            report['status'] = 'STATIC INPUTS PASS; DATABASE NOT RUN'
            report['pending_dependencies'] = [] if any(p.name == MEMBERSHIP for p in migrations) else [MEMBERSHIP]
            save()
            return

        import psycopg
        from psycopg import sql
        from psycopg.conninfo import conninfo_to_dict
        from psycopg.types.json import Jsonb
        assert any(p.name == MEMBERSHIP for p in migrations), 'Composed membership repair required'
        baseline = json.loads(args.baseline_report.read_text(encoding='utf-8'))
        assert baseline['status'] == 'PASS' and baseline['postgres_required'] == args.postgres_major and baseline['migrations'] == report['migrations'][:-1], 'Exact accepted prior migration chain required'
        dsn = os.environ.get('ECHS_BANK_TEST_DSN', '')
        assert dsn, 'Explicit isolated test DSN required'
        info = conninfo_to_dict(dsn)
        hostaddr = isolated_hostaddr(info)
        def connect():
            db = psycopg.connect(dsn, hostaddr=hostaddr, autocommit=True)
            try:
                assert_connected_isolation(db.info, hostaddr, info['dbname'])
            except BaseException:
                db.close()
                raise
            db.execute("set statement_timeout='10s'")
            return db
        with connect() as conn:
            assert int(conn.execute('show server_version_num').fetchone()[0]) // 10000 == args.postgres_major
            assert conn.execute('select current_database()').fetchone()[0] == info['dbname']
            assert conn.execute("select count(*) from pg_tables where schemaname in ('public','private','storage')").fetchone()[0] == 0, 'Refusing nonempty database'
            report['postgres_version'] = conn.execute('show server_version').fetchone()[0]
            # Infrastructure normally supplied by Supabase. No mocked authorization.
            conn.execute("""
              do $$ begin
                if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin noinherit nobypassrls; end if;
                if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin noinherit nobypassrls; end if;
                if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role nologin noinherit bypassrls; end if;
                if not exists(select 1 from pg_roles where rolname='fixture_unprivileged') then create role fixture_unprivileged nologin noinherit nobypassrls; end if;
              end $$;
              create schema storage;create schema extensions;create extension pgcrypto with schema extensions;
              create table storage.buckets(id text primary key,name text not null,public boolean not null default false,file_size_limit bigint,allowed_mime_types text[]);
              create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text not null,metadata jsonb,unique(bucket_id,name));
              alter table storage.buckets enable row level security;alter table storage.objects enable row level security;
              grant usage on schema public,storage,extensions to anon,authenticated,service_role,fixture_unprivileged;
              grant all on storage.buckets,storage.objects to service_role;
              set search_path=public,extensions;
            """, prepare=False)
            role_rows = conn.execute("select rolname,rolsuper,rolinherit,rolcanlogin,rolbypassrls from pg_roles where rolname=any(%s) order by rolname", (['anon', 'authenticated', 'service_role', 'fixture_unprivileged'],)).fetchall()
            assert role_rows == [('anon', False, False, False, False), ('authenticated', False, False, False, False), ('fixture_unprivileged', False, False, False, False), ('service_role', False, False, False, True)]
            passed('existing cluster roles are preserved and retain the expected isolated Supabase-style privileges')
            for migration in migrations[:-1]:
                conn.execute(migration.read_text(encoding='utf-8'), prepare=False)
            passed(f'full exact accepted prior migration chain executed in a new loopback PostgreSQL{args.postgres_major} database')

            def table_hash(table):
                rows = conn.execute(sql.SQL('select to_jsonb(t) from public.{} t').format(sql.Identifier(table))).fetchall()
                return digest('\n'.join(sorted(json.dumps(row[0], sort_keys=True, default=str) for row in rows)).encode())
            old_tables = [row[0] for row in conn.execute("select tablename from pg_tables where schemaname='public' order by tablename")]
            old_hashes = {table: table_hash(table) for table in old_tables}
            old_functions = conn.execute("select p.oid,md5(pg_get_functiondef(p.oid)) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.prokind='f' order by p.oid").fetchall()
            conn.execute(source, prepare=False)
            assert {table: table_hash(table) for table in old_tables} == old_hashes
            for oid, expected in old_functions:
                assert conn.execute('select md5(pg_get_functiondef(%s::oid))', (oid,)).fetchone()[0] == expected
            assert all(conn.execute(sql.SQL('select count(*) from public.{}').format(sql.Identifier(table))).fetchone()[0] == 0 for table in TABLES)
            passed('new migration preserves every existing public row and function and seeds zero snapshots or assignments')

            def execute(statement, params=(), role='service_role', db=None):
                db = db or conn
                with db.transaction():
                    previous = db.execute('select current_user').fetchone()[0]
                    db.execute(sql.SQL('set local role {}').format(sql.Identifier(role)))
                    cursor = db.execute(statement, params)
                    result = cursor.fetchall() if cursor.description else None
                    db.execute(sql.SQL('set local role {}').format(sql.Identifier(previous)))
                    return result
            def rejected(label, callback, expected):
                expected = (expected,) if isinstance(expected, str) else expected
                try:
                    with conn.transaction():
                        callback()
                except psycopg.Error as exc:
                    assert exc.sqlstate in expected, f'{label}: expected{expected}, observed{exc.sqlstate}'
                    passed(label)
                else:
                    raise AssertionError('Unexpected database authorization: ' + label)
            for role in ('anon', 'authenticated', 'service_role', 'fixture_unprivileged'):
                for table in TABLES:
                    for verb, statement in [('SELECT', f'select * from public.{table}'), ('INSERT', f'insert into public.{table} default values'), ('UPDATE', f'update public.{table} set organization_id=organization_id'), ('DELETE', f'delete from public.{table}'), ('TRUNCATE', f'truncate public.{table}')]:
                        rejected(f'{role} direct{verb} denied on {table}', lambda s=statement, r=role: execute(s, role=r), '42501')
                for name in ('private_bank_snapshot_import', 'private_bank_snapshot_file'):
                    if role != 'service_role':
                        rejected(role + ' cannot execute ' + name, lambda name=name, role=role: execute(f"select public.{name}(null,null,'{{}}')", role=role), '42501')
                if role != 'service_role':
                    rejected(role + ' cannot execute capability RPC', lambda role=role: execute('select public.private_bank_snapshot_capabilities()', role=role), '42501')
            assert execute('select public.private_bank_snapshot_capabilities()')[0][0] == CAP
            passed('actual service-only capability is data-free and explicitly does not authorize student delivery')
            for change in ('alter table public.private_bank_snapshots disable row level security', 'grant select on public.private_bank_snapshot_questions to service_role', 'grant select(canonical_record_text) on public.private_bank_snapshot_questions to authenticated', 'alter table public.private_bank_snapshot_files disable trigger bank_snapshot_immutable', "update storage.buckets set public=true where id='private-bank-snapshots'"):
                with conn.transaction(force_rollback=True):
                    conn.execute(change)
                    assert execute('select public.private_bank_snapshot_capabilities()')[0][0] is None
                passed('capability rejects RLS/grant/trigger/bucket drift: ' + change.split(' ')[0])

            ids = {name: str(uuid.uuid4()) for name in ['org', 'foreign_org', 'admin', 'second_admin', 'foreign_admin', 'teacher', 'student', 'parent']}
            nonce = uuid.uuid4().hex
            for name in ('org', 'foreign_org'):
                conn.execute('insert into organizations(id,name,slug) values(%s,%s,%s)', (ids[name], 'Synthetic bank fixture', 'bank-' + name + '-' + nonce))
            tokens = {}
            for name in ('admin', 'second_admin', 'foreign_admin', 'teacher', 'student', 'parent'):
                role = 'admin' if 'admin' in name else name
                org = ids['foreign_org'] if name == 'foreign_admin' else ids['org']
                conn.execute("insert into accounts(id,organization_id,username,display_name,role,status) values(%s,%s,%s,%s,%s,'active')", (ids[name], org, 'bank-' + name + '-' + nonce, name, role))
                tokens[name] = digest(('synthetic-' + name + nonce).encode())
                conn.execute("select public.api_create_session(%s,%s,clock_timestamp()+interval '1 hour','fixture','loopback')", (ids[name], tokens[name]))
            course_id = str(conn.execute("select id from course_versions where course_code='ap-calculus-ab' and status='active' and not is_placeholder").fetchone()[0])
            for org in ('org', 'foreign_org'):
                for position, topic in enumerate(('1.1', '1.2')):
                    conn.execute("insert into lesson_catalog(organization_id,access_key,course_key,unit_index,unit_title,topic,title,position,url,is_ready) values(%s,%s,'ap-calculus',0,'Synthetic unit',%s,'Synthetic teaching lesson',%s,%s,true)",
                                 (ids[org], 'ap-calculus::0::' + topic, topic, position, 'lessons/ap-calculus/unit-1/synthetic-' + topic.replace('.', '-') + '.html'))
            def rpc(actor, action, body, *, file=False, db=None):
                name = 'private_bank_snapshot_file' if file else 'private_bank_snapshot_import'
                value = execute(f'select public.{name}(%s,%s,%s)', (tokens.get(actor, actor), action, Jsonb(body)), db=db)[0][0]
                assert value['ok'] is True and value['contract'] == CONTRACT
                return value
            def store_object(f, row, actor='admin'):
                org = ids['foreign_org'] if actor == 'foreign_admin' else ids['org']
                name = '/'.join((org, f['reserve']['snapshot_id'], row['file_id']))
                conn.execute("insert into storage.objects(bucket_id,name,metadata) values('private-bank-snapshots',%s,'{}') on conflict(bucket_id,name) do nothing", (name,))
            def register(f, actor='admin'):
                return rpc(actor, 'register', payload(f['reserve']['snapshot_id'], 'files', f['files']), file=True)
            def bytes_receipt(f, row, actor='admin', *, store=True):
                if store:
                    store_object(f, row, actor)
                p = payload(f['reserve']['snapshot_id'])
                p.update({key: row[key] for key in ('file_id', 'sha256', 'byte_length', 'mime_type')})
                return rpc(actor, 'verify_bytes', p, file=True)
            def load(f, *, actor='admin', receipt=True):
                rpc(actor, 'reserve', f['reserve'])
                register(f, actor)
                for row in f['files']:
                    bytes_receipt(f, row, actor)
                rpc(actor, 'records', payload(f['reserve']['snapshot_id'], 'records', f['records']))
                rpc(actor, 'mappings', payload(f['reserve']['snapshot_id'], 'mappings', f['mappings']))
                if receipt:
                    for row in f['files']:
                        if row['kind'] == 'source-json':
                            p = payload(f['reserve']['snapshot_id'])
                            p.update({key: row[key] for key in ('file_id', 'source_occurrence_count', 'source_record_root')})
                            rpc(actor, 'verify_records', p, file=True)
                return f

            for fields in [[], [''], ['', 'π', 'a:b|c'], ['question', 'SYNTHETIC-A', '00000000-0000-4000-8000-000000000123']]:
                assert bytes(conn.execute('select private.bank_snapshot_frame(%s::text[])', (fields,)).fetchone()[0]) == frame(fields)
                leaves = [frame(fields), frame(['another'])]
                assert conn.execute('select private.bank_snapshot_root(%s,%s::bytea[])', ('synthetic.v1', leaves)).fetchone()[0] == content_root('synthetic.v1', [fields, ['another']])
            passed('actual SQL binary framing and SHA-256 agree with independent Python on empty, Unicode and delimiter vectors')
            for kind, value in [('id', 'SYNTHÉTIC'), ('id', 'ＳＹＮＴＨＥＴＩＣ'), ('path', 'synthetic/é.json'), ('hash', 'ａ' * 64), ('commit', 'é' * 40), ('uuid', '00000000-0000-4000-8000-00000000012ａ')]:
                assert conn.execute('select private.bank_snapshot_value(%s,%s)', (Jsonb(value), kind)).fetchone()[0] is False
            assert conn.execute('select private.bank_snapshot_banks_valid(%s::text[])', (['ＡＤＡＭＳ１０'],)).fetchone()[0] is False
            passed('ASCII identity/path/hash/token contract rejects accented and fullwidth alternatives independently of database locale')
            bulk_leaves = [['synthetic-bulk', str(i), 'x' * 128] for i in range(25000)]
            assert conn.execute('select private.bank_snapshot_root(%s,%s::bytea[])', ('synthetic.bulk.v1', [frame(x) for x in bulk_leaves])).fetchone()[0] == content_root('synthetic.bulk.v1', bulk_leaves)
            rejected('null hash leaves are rejected instead of silently omitted', lambda: conn.execute("select private.bank_snapshot_root('synthetic.v1',array[null]::bytea[])"), '22023')
            passed('large framed roots aggregate25,000 ordered leaves within the bounded SQL statement timeout')

            f = fixture(course_id, with_manifest=True)
            original = rpc('admin', 'reserve', f['reserve'])
            repeated = rpc('admin', 'reserve', f['reserve'])
            assert original['reused'] is False and repeated['reused'] is True
            assert repeated['account_id'] == ids['admin'] and repeated['organization_id'] == ids['org']
            changed = copy.deepcopy(f['reserve']); changed['question_root'] = '0' * 64
            rejected('changed same snapshot ID cannot overwrite frozen roots', lambda: rpc('admin', 'reserve', changed), '40001')
            changed = copy.deepcopy(f['reserve']); changed['snapshot_id'] = str(uuid.uuid4()); changed['request_id'] = str(uuid.uuid4())
            rejected('same organization manifest cannot be silently renamed to another snapshot ID', lambda: rpc('admin', 'reserve', changed), '40001')
            passed('snapshot IDs and frozen manifests support exact idempotent retries')

            for actor in ('teacher', 'student', 'parent'):
                rejected(actor + ' cannot stage an archive', lambda actor=actor: rpc(actor, 'reserve', fixture(course_id)['reserve']), '42501')
            rejected('unknown session cannot inspect archive metadata', lambda: rpc('not-a-session', 'status', {'snapshot_id': f['reserve']['snapshot_id']}), '28000')
            rejected('foreign administrator receives the same not-found result', lambda: rpc('foreign_admin', 'status', {'snapshot_id': f['reserve']['snapshot_id']}), 'P0002')
            for body in (None, [], {}, {'snapshot_id': None}, {'snapshot_id': 'not-uuid'}, {'snapshot_id': f['reserve']['snapshot_id'], 'organization_id': ids['org']}):
                rejected('closed snapshot payload rejects malformed/client scope', lambda body=body: rpc('admin', 'status', body), '22023')
            for field, value in [('expected_total_bytes', 268435457), ('expected_file_count', 25001), ('expected_question_count', 10001), ('expected_occurrence_count', True), ('unit_review_sets', None), ('bank_codes', ['ADAMS10', 'ADAMS10'])]:
                body = copy.deepcopy(fixture(course_id)['reserve']); body[field] = value
                rejected('snapshot bound/type rejects ' + field, lambda body=body: rpc('admin', 'reserve', body), '22023')
            body = fixture(course_id)['reserve']; body['unit_review_sets'][0]['lessons'][0]['route'] = 'lessons/foreign.html'
            rejected('review teaching set cannot claim a foreign catalog identity', lambda: rpc('admin', 'reserve', body), '22023')
            for statement, params in [("update accounts set status='suspended' where id=%s", (ids['admin'],)), ("update private.sessions set revoked_at=clock_timestamp() where token_hash=%s", (tokens['admin'],)), ("update private.sessions set expires_at=clock_timestamp()-interval '1 second' where token_hash=%s", (tokens['admin'],))]:
                with conn.transaction(force_rollback=True):
                    conn.execute(statement, params)
                    rejected('current account/session cannot be stale', lambda: rpc('admin', 'status', {'snapshot_id': f['reserve']['snapshot_id']}), '28000')
            with conn.transaction(force_rollback=True):
                conn.execute("update accounts set role='student' where id=%s", (ids['admin'],))
                rejected('a still-live session cannot retain a former administrator role', lambda: rpc('admin', 'status', {'snapshot_id': f['reserve']['snapshot_id']}), '42501')

            file_batch = payload(f['reserve']['snapshot_id'], 'files', f['files'])
            collision = copy.deepcopy(file_batch); collision['request_id'] = f['reserve']['request_id']
            rejected('a request UUID cannot be reused for a different action', lambda: rpc('admin', 'register', collision, file=True), '40001')
            rpc('admin', 'register', file_batch, file=True)
            assert rpc('admin', 'register', file_batch, file=True)['reused'] is True
            malformed = copy.deepcopy(file_batch); malformed['request_id'] = str(uuid.uuid4()); malformed['files'][0]['sha256'] = '0' * 64
            rejected('same file ID cannot change content hash', lambda: rpc('admin', 'register', malformed, file=True), '40001')
            malformed = payload(f['reserve']['snapshot_id'], 'files', [f['files'][0], f['files'][0]])
            rejected('duplicate file IDs inside a batch are rejected atomically', lambda: rpc('admin', 'register', malformed, file=True), '22023')
            for patch in ({'state': 'verified'}, {'source_content_verified_at': '2026-01-01'}, {'record_layout': 'recursive'}, {'source_occurrence_count': None}, {'source_path': '../private.json'}, {'mime_type': 'text/html'}):
                row = copy.deepcopy(f['files'][0]); row.update(patch)
                rejected('caller cannot spoof file readiness/profile/path/type', lambda row=row: rpc('admin', 'register', payload(f['reserve']['snapshot_id'], 'files', [row]), file=True), '22023')
            row = f['files'][0]
            rejected('claimed matching byte receipt without a stored object fails', lambda: bytes_receipt(f, row, store=False), '23514')
            store_object(f, row)
            bad_receipt = payload(f['reserve']['snapshot_id']); bad_receipt.update({key: row[key] for key in ('file_id', 'sha256', 'byte_length', 'mime_type')}); bad_receipt['sha256'] = 'f' * 64
            rejected('mismatched read-back hash cannot verify a file', lambda: rpc('admin', 'verify_bytes', bad_receipt, file=True), '23514')
            for row in f['files']:
                bytes_receipt(f, row)
            passed('file registration/retry is immutable and separate trusted receipts require exact registered metadata and object namespace')

            body = payload(f['reserve']['snapshot_id'], 'records', f['records'])
            bad = copy.deepcopy(body); bad['records'][0]['canonical_record_text'] += ' '
            rejected('record bytes are hashed directly, not JSONB reserialized', lambda: rpc('admin', 'records', bad), '23514')
            bad = copy.deepcopy(body); bad['records'][0]['canonical_record_text'] = 'x' * 65537
            rejected('record text64KiB bound is enforced before parse', lambda: rpc('admin', 'records', bad), '22023')
            bad = copy.deepcopy(body); bad['records'][0]['dependencies'][0]['file_id'] = f['files'][0]['file_id']
            rejected('source JSON cannot become a student media dependency', lambda: rpc('admin', 'records', bad), '23514')
            bad = copy.deepcopy(body); bad['records'][0]['bundle_memberships'][0]['record_index'] = 999
            rejected('source occurrence cannot exceed the explicit extraction profile', lambda: rpc('admin', 'records', bad), '23514')
            rpc('admin', 'records', body)
            assert rpc('admin', 'records', body)['reused'] is True
            stored = conn.execute('select canonical_record_text,canonical_record_sha256,payload from private_bank_snapshot_questions where organization_id=%s and snapshot_id=%s order by question_id', (ids['org'], f['reserve']['snapshot_id'])).fetchall()
            assert [(text, hashed) for text, hashed, _ in stored] == [(q['canonical_record_text'], q['canonical_record_sha256']) for q in f['records']]
            assert [row[2] for row in stored] == [json.loads(q['canonical_record_text']) for q in f['records']]
            passed('canonical record UTF-8 text/hash and derived parsed value remain exact; three original occurrences retained')
            bad = copy.deepcopy(body); bad['request_id'] = str(uuid.uuid4()); bad['records'][0]['dependencies'] = []
            rejected('an existing question cannot lose a dependency on retry', lambda: rpc('admin', 'records', bad), '40001')
            bad = copy.deepcopy(body); bad['request_id'] = str(uuid.uuid4()); bad['records'][0]['dependencies'][0]['file_id'] = {'unexpected': 'object'}
            rejected('an existing question retry validates dependency types before UUID casts', lambda: rpc('admin', 'records', bad), '22023')
            for row in f['files']:
                if row['kind'] == 'source-json':
                    expected = source_root(f['records'], row['file_id'])
                    observed = conn.execute('select private.bank_snapshot_source_root(%s,%s,%s)', (ids['org'], f['reserve']['snapshot_id'], row['file_id'])).fetchone()[0]
                    assert observed == expected
            mapping_body = payload(f['reserve']['snapshot_id'], 'mappings', f['mappings'])
            bad = copy.deepcopy(mapping_body); bad['mappings'][0]['reviewed_by'] = ids['admin']
            rejected('mapping reviewer is derived from session, never a client field', lambda: rpc('admin', 'mappings', bad), '22023')
            bad = copy.deepcopy(mapping_body); bad['mappings'][0]['catalog_topic'] = '1.2'
            rejected('mappings require the exact current course/catalog identity', lambda: rpc('admin', 'mappings', bad), '23514')
            rpc('admin', 'mappings', mapping_body)
            actual_roots = conn.execute('select private.bank_snapshot_roots(%s,%s)', (ids['org'], f['reserve']['snapshot_id'])).fetchone()[0]
            assert actual_roots == roots_for(f['files'], f['records'], f['mappings'], f['reserve']['unit_review_sets'])
            passed('all four actual SQL roots match independent Python including media edges, unit sets and manifest self-exclusion')
            rejected('byte verification alone is insufficient to seal source consistency', lambda: rpc('admin', 'seal', payload(f['reserve']['snapshot_id'])), '23514')
            for row in f['files']:
                if row['kind'] == 'source-json':
                    p = payload(f['reserve']['snapshot_id']); p.update({key: row[key] for key in ('file_id', 'source_occurrence_count', 'source_record_root')})
                    rpc('admin', 'verify_records', p, file=True)
            with conn.transaction(force_rollback=True):
                conn.execute("update lesson_catalog set position=99 where organization_id=%s and access_key='ap-calculus::0::1.2'", (ids['org'],))
                rejected('catalog drift in an unmapped teaching lesson blocks unit-set seal', lambda: rpc('admin', 'seal', payload(f['reserve']['snapshot_id'])), '23514')
            seal = payload(f['reserve']['snapshot_id'])
            result = rpc('admin', 'seal', seal)
            assert result['state'] == 'ready' and rpc('admin', 'seal', seal)['reused'] is True
            assert conn.execute('select curriculum_mapping_status,rights_status from private_bank_snapshot_mappings where snapshot_id=%s', (f['reserve']['snapshot_id'],)).fetchone() == ('unresolved', 'archive-only')
            assert execute('select public.private_bank_snapshot_capabilities()')[0][0]['student_delivery'] is False
            passed('atomic seal proves preservation while unresolved rights/mappings remain archive-only and no class assignment is created')

            for table in TABLES:
                rejected('owner-level update cannot rewrite ready ' + table, lambda table=table: conn.execute(f'update public.{table} set organization_id=organization_id where snapshot_id=%s' if table != 'private_bank_snapshots' else 'update public.private_bank_snapshots set state=state where id=%s', (f['reserve']['snapshot_id'],)), '23514')
                rejected('owner-level delete cannot erase ' + table, lambda table=table: conn.execute(f'delete from public.{table} where snapshot_id=%s' if table != 'private_bank_snapshots' else 'delete from public.private_bank_snapshots where id=%s', (f['reserve']['snapshot_id'],)), '23514')
            rejected('owner-level truncate cannot erase any archive tables', lambda: conn.execute('truncate ' + ','.join('public.' + t for t in TABLES) + ' cascade'), '23514')
            rejected('ready snapshot cannot be aborted', lambda: rpc('admin', 'abort', payload(f['reserve']['snapshot_id'])), '40001')
            rejected('ready file cannot be replaced under a fresh request ID', lambda: register(f), '40001')
            incomplete = fixture(course_id); rpc('admin', 'reserve', incomplete['reserve'])
            rejected('incomplete snapshot seal rolls back with staging intact', lambda: rpc('admin', 'seal', payload(incomplete['reserve']['snapshot_id'])), '23514')
            abort = payload(incomplete['reserve']['snapshot_id']); assert rpc('admin', 'abort', abort)['state'] == 'aborted'
            assert rpc('admin', 'abort', abort)['reused'] is True
            rejected('aborted snapshot remains terminal and non-deliverable', lambda: register(incomplete), '40001')
            corrupt = fixture(course_id); corrupt['reserve']['question_root'] = '0' * 64; load(corrupt)
            rejected('complete counts cannot override a mismatched frozen content root', lambda: rpc('admin', 'seal', payload(corrupt['reserve']['snapshot_id'])), '23514')

            foreign = load(fixture(course_id), actor='foreign_admin')
            local = load(fixture(course_id))
            cross = copy.deepcopy(local['records'][0]); cross['question_id'] = 'SYNTHETIC-CROSS'; cross['canonical_record_text'] = canonical({'id': cross['question_id']}); cross['canonical_record_sha256'] = digest(cross['canonical_record_text'].encode())
            rejected('cross-tenant question/file composite foreign key rejects owner-level insertion', lambda: conn.execute("insert into private_bank_snapshot_questions(organization_id,snapshot_id,question_id,bank_code,canonical_record_text,canonical_record_sha256,source_file_id,source_record_index,bundle_memberships,source_provenance) values(%s,%s,%s,'ADAMS10',%s,%s,%s,0,%s,%s)",
                     (ids['org'], local['reserve']['snapshot_id'], cross['question_id'], cross['canonical_record_text'], cross['canonical_record_sha256'], foreign['files'][0]['file_id'], Jsonb([{'file_id': foreign['files'][0]['file_id'], 'record_index': 0}]), Jsonb({'source_path': 'synthetic/source.json', 'source_sha256': 'f' * 64}))), '23503')
            rejected('cross-version media edge cannot attach another snapshot file', lambda: conn.execute("insert into private_bank_snapshot_question_files(organization_id,snapshot_id,question_id,file_id,dependency_kind) values(%s,%s,'SYNTHETIC-A',%s,'direct-image')", (ids['org'], local['reserve']['snapshot_id'], f['files'][2]['file_id'])), '23514')
            rejected('foreign administrator cannot submit a file receipt to local snapshot', lambda: rpc('foreign_admin', 'status', {'snapshot_id': local['reserve']['snapshot_id'], 'file_id': local['files'][0]['file_id']}, file=True), 'P0002')

            # Both operations use independent actual connections, not mocked locks.
            race = fixture(course_id)
            def concurrent_reserve(_):
                with connect() as db:
                    return rpc('admin', 'reserve', race['reserve'], db=db)
            with ThreadPoolExecutor(2) as pool:
                outcomes = list(pool.map(concurrent_reserve, range(2)))
            assert sorted(row['reused'] for row in outcomes) == [False, True]
            passed('concurrent identical reserve converges on one immutable snapshot/event')
            quota = fixture(course_id); quota['reserve']['expected_media_count'] = 1
            rpc('admin', 'reserve', quota['reserve'])
            rpc('admin', 'register', payload(quota['reserve']['snapshot_id'], 'files', quota['files'][:2]), file=True)
            def competing_media(row):
                with connect() as db:
                    try:
                        rpc('admin', 'register', payload(quota['reserve']['snapshot_id'], 'files', [row]), file=True, db=db)
                        return 'registered'
                    except psycopg.Error as exc:
                        return exc.sqlstate
            with ThreadPoolExecutor(2) as pool:
                outcomes = list(pool.map(competing_media, quota['files'][2:]))
            assert sorted(outcomes) == ['23514', 'registered']
            assert conn.execute("select count(*) from private_bank_snapshot_files where snapshot_id=%s and kind='media'", (quota['reserve']['snapshot_id'],)).fetchone()[0] == 1
            assert conn.execute("select count(*) from private_bank_snapshot_events where snapshot_id=%s and event_type='register'", (quota['reserve']['snapshot_id'],)).fetchone()[0] == 2
            passed('concurrent media registrations cannot overbook the frozen quota and the losing insert/event roll back')
            sealed_race = load(fixture(course_id)); request = payload(sealed_race['reserve']['snapshot_id'])
            def concurrent_seal(_):
                with connect() as db:
                    return rpc('admin', 'seal', request, db=db)
            with ThreadPoolExecutor(2) as pool:
                outcomes = list(pool.map(concurrent_seal, range(2)))
            assert [row['state'] for row in outcomes] == ['ready', 'ready'] and sorted(row['reused'] for row in outcomes) == [False, True]
            passed('concurrent identical seal preserves one terminal transition and exact retry')
            terminal = load(fixture(course_id))
            def terminal_action(action):
                with connect() as db:
                    try:
                        return rpc('admin', action, payload(terminal['reserve']['snapshot_id']), db=db)['state']
                    except psycopg.Error as exc:
                        return exc.sqlstate
            with ThreadPoolExecutor(2) as pool:
                outcomes = list(pool.map(terminal_action, ('seal', 'abort')))
            assert outcomes.count('40001') == 1 and sum(row in ('ready', 'aborted') for row in outcomes) == 1
            passed('concurrent seal versus abort has one terminal winner and rolls back the losing transition')
            catalog_race = load(fixture(course_id))
            with connect() as waiting, ThreadPoolExecutor(1) as pool:
                pid = waiting.execute('select pg_backend_pid()').fetchone()[0]
                def seal_after_catalog_writer():
                    try:
                        rpc('admin', 'seal', payload(catalog_race['reserve']['snapshot_id']), db=waiting)
                        return 'unexpected-seal'
                    except psycopg.Error as exc:
                        return exc.sqlstate
                with conn.transaction():
                    conn.execute("update lesson_catalog set position=99 where organization_id=%s and access_key='ap-calculus::0::1.2'", (ids['org'],))
                    future = pool.submit(seal_after_catalog_writer)
                    deadline = time.monotonic() + 3
                    while True:
                        conn.execute('select pg_stat_clear_snapshot()')
                        observed = conn.execute('select wait_event_type from pg_stat_activity where pid=%s', (pid,)).fetchone()[0]
                        if observed == 'Lock':
                            break
                        assert not future.done() and time.monotonic() < deadline
                        time.sleep(0.02)
                assert future.result(timeout=5) == '23514'
            assert rpc('admin', 'status', {'snapshot_id': catalog_race['reserve']['snapshot_id']})['state'] == 'staging'
            conn.execute("update lesson_catalog set position=1 where organization_id=%s and access_key='ap-calculus::0::1.2'", (ids['org'],))
            passed('seal waits for a real catalog writer and rejects committed identity drift without a terminal event')
            waiting_fixture = fixture(course_id); rpc('admin', 'reserve', waiting_fixture['reserve'])
            short = digest(('short-bank-session-' + nonce).encode())
            conn.execute("select public.api_create_session(%s,%s,clock_timestamp()+interval '5 seconds','fixture','loopback')", (ids['admin'], short))
            with connect() as waiting, ThreadPoolExecutor(1) as pool:
                pid = waiting.execute('select pg_backend_pid()').fetchone()[0]
                def expire_wait():
                    try:
                        rpc(short, 'abort', payload(waiting_fixture['reserve']['snapshot_id']), db=waiting)
                        return 'unexpected-write'
                    except psycopg.Error as exc:
                        return exc.sqlstate
                with conn.transaction():
                    conn.execute('select id from private_bank_snapshots where id=%s for update', (waiting_fixture['reserve']['snapshot_id'],))
                    future = pool.submit(expire_wait)
                    deadline = time.monotonic() + 3
                    while True:
                        conn.execute('select pg_stat_clear_snapshot()')
                        observed = conn.execute('select wait_event_type from pg_stat_activity where pid=%s', (pid,)).fetchone()[0]
                        if observed == 'Lock':
                            break
                        assert not future.done() and time.monotonic() < deadline
                        time.sleep(0.02)
                    conn.execute("select pg_sleep(greatest(extract(epoch from expires_at-clock_timestamp()),0)::double precision+0.05) from private.sessions where token_hash=%s", (short,))
                assert future.result(timeout=5) == '28000'
            assert rpc('admin', 'status', {'snapshot_id': waiting_fixture['reserve']['snapshot_id']})['state'] == 'staging'
            passed('session expiry during an observed real snapshot lock rolls back the pending mutation')

            for table in ('private_bank_packages', 'private_bank_questions', 'private_bank_media_objects', 'private_bank_import_runs', 'class_course_version_assignments'):
                assert table_hash(table) == old_hashes[table]
            assert conn.execute("select to_regprocedure('public.private_bank_practice(text,text,jsonb)')").fetchone()[0] is None
            passed('original private packages/records/media/imports/course pins remain unchanged; no practice RPC or cutover exists')
        report['status'] = 'PASS'
        report['limits'] = ['Synthetic Storage object rows prove namespace/receipt SQL only, not deployed bytes.', 'No production tenant, import, assignment, private practice, publication or grading authorization was tested.']
        save()
        print(f'Private snapshot PostgreSQL: PASS; {len(report["checks"])} checks', flush=True)
    except BaseException as exc:
        report['status'] = 'FAIL'
        report['error_type'] = type(exc).__name__
        save()
        raise

if __name__ == '__main__':
    main()
