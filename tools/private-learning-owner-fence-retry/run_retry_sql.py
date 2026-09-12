"""Nine focused SQL groups in a third, separately initialized fixture database."""
import ipaddress
import json
import os
from pathlib import Path
import sys

import contract
from fixture import BOOTSTRAP, DATABASE, HERE, need, project, sha
from test_retry_sql import EXPECTED_LABELS, exercise


def main(config_path, output_path, major):
    import psycopg
    from psycopg import sql
    need(sys.platform == 'linux' and os.environ.get('GITHUB_ACTIONS') == 'true'
         and os.environ.get('RUNNER_ENVIRONMENT') == 'github-hosted', 'hosted-fixture-only')
    need(major in (15, 17) and type(major) is int, 'major')
    before = contract.snapshot()
    path = Path(config_path).resolve()
    config = json.loads(path.read_bytes())
    need(path.name == 'control-private.json' and path.parent.name == 'secrets'
         and path.parents[1].name == config['run_id'] and path.parents[2] == (HERE / 'runs').resolve(), 'owned-config')
    need(sha((HERE / 'source-manifest.json').read_bytes()) == config['source_manifest_sha256'], 'source-manifest')
    address = ipaddress.IPv4Address(config['db_ip'])
    need(any(address in ipaddress.ip_network(net) for net in
             ('10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16')), 'private-database')
    database = DATABASE + '_retry'
    marker = project(config['run_id']) + ':retry-sql'
    output = Path(output_path).resolve()
    need(output.parent == path.parents[1] and output.name == 'retry-sql-results.json' and not output.exists(), 'owned-output')
    report = {'contract': 'echs.c04.owner-fence-retry-focused-sql.v1', 'status': 'RUNNING; NOT ACCEPTED',
              'planned_groups': list(EXPECTED_LABELS), 'checks': [], 'postgres_major': major,
              'database_executed': False, 'postgrest_executed': False, 'production_calls': 0,
              'source_files': before, 'dedicated_fresh_database': False}

    def connect_to(name):
        db = psycopg.connect(host=config['db_ip'], hostaddr=config['db_ip'], port=5432,
            dbname=name, user='postgres', password=config['password'], sslmode='disable',
            autocommit=True, connect_timeout=5)
        try:
            need(db.info.hostaddr == config['db_ip'] and db.info.dbname == name, 'connected-identity')
            need(int(db.execute('show server_version_num').fetchone()[0]) // 10000 == major, 'connected-major')
            db.execute("set statement_timeout='10s'")
            db.execute("set lock_timeout='8s'")
            db.execute('set search_path=public,extensions')
            return db
        except BaseException:
            db.close()
            raise

    def connect():
        db = connect_to(database)
        try:
            need(db.execute("select shobj_description(oid,'pg_database') from pg_database where datname=current_database()").fetchone()[0]
                 == marker, 'retry-database-marker')
            return db
        except BaseException:
            db.close()
            raise

    def passed(label):
        need(label == EXPECTED_LABELS[len(report['checks'])], 'ordered-focused-sql')
        report['checks'].append(label)

    try:
        with connect_to(DATABASE) as main_db:
            need(main_db.execute("select shobj_description(oid,'pg_database') from pg_database where datname=current_database()").fetchone()[0]
                 == project(config['run_id']), 'primary-owned-database-marker')
            need(main_db.execute('select 1 from pg_database where datname=%s', (database,)).fetchone() is None, 'fresh-retry-database')
            main_db.execute(sql.SQL('create database {}').format(sql.Identifier(database)))
        with connect_to(database) as db:
            need(db.execute("select count(*) from pg_tables where schemaname in ('public','private','storage')").fetchone() == (0,), 'empty-retry-database')
            prefix, suffix = BOOTSTRAP.split('create schema storage;', 1)
            need(prefix.strip() == '\n'.join([
                'create role anon nologin noinherit nobypassrls;',
                'create role authenticated nologin noinherit nobypassrls;',
                'create role service_role nologin noinherit bypassrls;',
                'create role fixture_unprivileged nologin noinherit nobypassrls;']), 'retained-bootstrap-role-boundary')
            with db.transaction():
                # Roles are cluster-scoped and already belong to the primary
                # fresh fixture. Every schema/table below is in this new DB.
                db.execute('create schema storage;' + suffix, prepare=False)
                _, migrations = contract.sources()
                for row in migrations:
                    db.execute((contract.REPO / row['path']).read_text(encoding='utf-8'), prepare=False)
                fence, journal = contract.sql_buffers(before, None)
                db.execute(fence, prepare=False)
                db.execute(journal, prepare=False)
                db.execute(sql.SQL('comment on database {} is {}').format(sql.Identifier(database), sql.Literal(marker)))
            report['dedicated_fresh_database'] = True
            report['postgres_version'] = db.execute('show server_version').fetchone()[0]
        with connect() as db:
            report['database_executed'] = True
            details = exercise(db, connect, passed)
        need(report['checks'] == list(EXPECTED_LABELS), 'all-nine-focused-groups')
        need(set(details) == {'deliberate_absence_55000', 'native_serialization_40001', 'observed_lock_waits',
                             'all_six_mutations', 'fixture_schema_acl_triggers_restored',
                             'journal_owners_remain_zero', 'production_calls'}, 'closed-focused-details')
        for name, expected in (('deliberate_absence_55000', 29), ('native_serialization_40001', 4),
                               ('all_six_mutations', 18), ('production_calls', 0)):
            need(type(details[name]) is int and details[name] == expected, 'focused-count')
        need(type(details['observed_lock_waits']) is int and details['observed_lock_waits'] >= 5, 'observed-locks')
        need(details['fixture_schema_acl_triggers_restored'] is True and details['journal_owners_remain_zero'] is True, 'focused-restoration')
        contract.unchanged(before)
        report.update(status='ACTUAL FOCUSED SQL R01-R09 PASS', details=details, source_unchanged=True)
    except BaseException as error:
        report.update(status='FAIL; NO ACCEPTANCE', failure_type=type(error).__name__)
        state = getattr(error, 'sqlstate', None)
        if isinstance(state, str) and len(state) == 5 and state.isalnum(): report['sqlstate'] = state
        raise
    finally:
        with output.open('x', encoding='utf-8') as stream:
            json.dump(report, stream, indent=2); stream.write('\n')
    print(json.dumps({'status': report['status'], 'groups': len(report['checks'])}))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], int(sys.argv[3]))
