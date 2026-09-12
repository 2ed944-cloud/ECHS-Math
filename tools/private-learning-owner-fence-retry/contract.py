"""Successor provenance; retained validators only validate retained sources."""
import ast
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import subprocess
import sys

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
FENCE = REPO / 'tools/private-learning-owner-fence'
JOURNAL = REPO / 'tools/private-learning-operation-journal'
HTTP = REPO / 'tools/private-learning-journal-http'
PREFIX = 'tools/private-learning-owner-fence-retry/'
WORKFLOW = '.github/workflows/private-learning-owner-fence-retry.yml'
INPUT_SHA = '00b4c33a095ca5bb53b655c63151116976829250fe85073d4dda2cc98bf8295c'
FENCE_BEFORE = '2c4ece7736e858d7923601898cc3a5c8ac77b57500a0f0f3e22dc566eb31348f'
FENCE_AFTER = 'cd553dc8e1a715af588553f19d74df6b5f2f20d6a4c5c86930ecb74ab933600b'
FIXTURE_BEFORE = '7d64147d0e27956446b5d26f74f3ae4b13e0b6c7406b1879cdf9c9206b6fab0f'
FIXTURE_AFTER = '165528a3d69b7b22ff8ba8f92bd2a7d2d05885f6fe6114248041f8540a426ec3'
FIXTURE_EDITS = (
    ("values('learning_sessions',target)),'40001')", "values('learning_sessions',target)),'55000')"),
    ("if future.done():assert future.result()=='40001';observed=True;break", "if future.done():assert future.result()=='55000';observed=True;break"),
    ("deleter.execute('commit');assert future.result(timeout=6) in ('23503','40001')", "deleter.execute('commit');assert future.result(timeout=6) in ('23503','55000')"),
    ("  except psycopg.Error as e:assert e.sqlstate=='40001'\n  else:raise AssertionError('Invisible fence was treated as legacy')", "  except psycopg.Error as e:assert e.sqlstate=='55000'\n  else:raise AssertionError('Invisible fence was treated as legacy')"),
)

def digest(raw):
    return hashlib.sha256(raw).hexdigest()

def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value

def retained_pin(path):
    pins = json.loads((HERE / 'input-pins.json').read_bytes())
    return next(row for row in pins['files'] if row['path'] == path)

def validate_delta(sql_raw=None, fixture_raw=None):
    sql_raw = (HERE / 'owner-fence.sql').read_bytes() if sql_raw is None else sql_raw
    fixture_raw = (HERE / 'test_fence.py').read_bytes() if fixture_raw is None else fixture_raw
    old_sql = (FENCE / 'owner-fence.sql').read_bytes()
    old_fixture = (FENCE / 'test_fence.py').read_bytes()
    assert digest(old_sql) == FENCE_BEFORE and digest(sql_raw) == FENCE_AFTER
    assert old_sql.count(b"errcode='40001'") == 4
    assert sql_raw == old_sql.replace(b"errcode='40001'", b"errcode='55000'")
    assert digest(old_fixture) == FIXTURE_BEFORE and digest(fixture_raw) == FIXTURE_AFTER
    inverse = fixture_raw
    for before, after in reversed(FIXTURE_EDITS):
        assert inverse.count(after.encode()) == 1
        inverse = inverse.replace(after.encode(), before.encode())
    assert inverse == old_fixture
    assert fixture_raw.count(b"'40001'") == 2
    # Parse both buffers independently; source equality above bounds every edit.
    ast.parse(fixture_raw.decode('utf-8'))
    ast.parse(old_fixture.decode('utf-8'))
    return {'sql_replacements': 4, 'fixture_replacements': 4,
            'native_serialization_sites_retained': 2,
            'successor_fence_sha256': digest(sql_raw), 'fixture_sha256': digest(fixture_raw)}

def sources():
    raw = (HERE / 'input-pins.json').read_bytes()
    assert digest(raw) == INPUT_SHA
    pins = json.loads(raw)
    assert pins['contract'] == 'echs.c04.owner-fence-retry-retained-inputs.v1'
    assert pins['tree'] == '42148dda6ec82d8bf470cd17a9b9f2752170aa3d'
    assert len(pins['files']) == len({r['path'] for r in pins['files']}) == 72
    assert pins['accepted_sql_run_id'] == 34659866520 and pins['accepted_http_run_id'] == 34660368314
    assert type(pins['production_calls']) is int and pins['production_calls'] == 0
    for row in pins['files']:
        assert set(row) == {'path', 'bytes', 'sha256', 'git_blob_sha'}
        assert re.fullmatch('[A-Za-z0-9._/-]+', row['path']) and '..' not in row['path'].split('/')
        data = (REPO / row['path']).read_bytes()
        assert type(row['bytes']) is int and len(data) == row['bytes'] and digest(data) == row['sha256']
        assert hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest() == row['git_blob_sha']
    migrations = [r for r in pins['files'] if r['path'].startswith('supabase/migrations/')]
    assert len(migrations) == 27
    assert sorted(p.name for p in (REPO / 'supabase/migrations').glob('*.sql')) == [Path(r['path']).name for r in migrations]
    validate_delta()
    # This unchanged validator asserts its ORIGINAL 45 inputs, not our new SQL.
    retained = module('retained_journal_contract', JOURNAL / 'contract.py')
    retained.sources()
    return pins, migrations

def snapshot():
    sources()
    raw = (HERE / 'source-manifest.json').read_bytes()
    manifest = json.loads(raw)
    assert manifest['contract'] == 'echs.c04.owner-fence-retry-sources.v1'
    names = [r['path'] for r in manifest['files']]
    assert len(names) == len(set(names))
    assert WORKFLOW in names and PREFIX + 'contract.py' in names and PREFIX + 'owner-fence.sql' in names
    result = {}
    for row in manifest['files']:
        name = row['path']
        assert name == WORKFLOW or (name.startswith(PREFIX) and '..' not in name.split('/'))
        data = (REPO / name).read_bytes()
        assert type(row['bytes']) is int and len(data) == row['bytes'] and digest(data) == row['sha256']
        result[name] = {'bytes': len(data), 'sha256': digest(data)}
    result[PREFIX + 'source-manifest.json'] = {'bytes': len(raw), 'sha256': digest(raw)}
    return result

def unchanged(expected):
    assert snapshot() == expected, 'Successor source changed'

def sql_buffers(expected, pins):
    unchanged(expected)
    fence = (HERE / 'owner-fence.sql').read_bytes()
    journal = (JOURNAL / 'operation-journal.sql').read_bytes()
    assert digest(fence) == FENCE_AFTER
    row = retained_pin('tools/private-learning-operation-journal/operation-journal.sql')
    assert len(journal) == row['bytes'] and digest(journal) == row['sha256']
    assert row['sha256'] == '9ce98da90d5c141fdf184d32a00067eca1aaa800870204edd9c383cc22b1e1bf'
    return fence.decode('utf-8'), journal.decode('utf-8')

def retained_journal():
    return module('retained_journal_contract', JOURNAL / 'contract.py')

def connection_guard(info, prefix):
    return retained_journal().connection_guard(info, prefix)

def connected(db, info, address, expected_major):
    return retained_journal().connected(db, info, address, expected_major)

def load_fence():
    validate_delta()
    companion = module('retained_fence_contract', FENCE / 'contract.py')
    labels = companion.expected_labels()
    assert len(labels) == 123 and labels == companion.labels_from_source((HERE / 'test_fence.py').read_text())
    old = sys.modules.get('contract')
    try:
        # Supply only the unchanged TABLES dependency expected by the copied fixture.
        sys.modules['contract'] = companion
        fixture = module('successor_fence_fixture', HERE / 'test_fence.py')
    finally:
        if old is None: sys.modules.pop('contract', None)
        else: sys.modules['contract'] = old
    return fixture, labels

def journal_fixture():
    return module('retained_journal_fixture', JOURNAL / 'test_journal.py')

def planned_labels():
    labels = list(journal_fixture().EXPECTED_LABELS)
    assert len(labels) == 48
    return labels

def checkout_sources(value, expected_major):
    # Retained receipt covers its exact original source graph and real Git event.
    retained_journal().checkout_sources(value, expected_major=expected_major)
    # Fifteen retained HTTP paths extend the predecessor's57-file graph.
    # Their accepted tree hashes must match the tested Git tree as well.
    pins, _ = sources()
    covered = {row['path'] for row in value['source_files']}
    extra = [row for row in pins['files'] if row['path'] not in covered]
    assert len(extra) == 15
    for row in extra:
        data = subprocess.check_output(['git', '-C', str(REPO), 'show', value['tested_sha'] + ':' + row['path']], timeout=20)
        assert len(data) == row['bytes'] and digest(data) == row['sha256']
    # Independent new graph is required; the old validator never grants it provenance.
    own = snapshot()
    for path in own:
        data = subprocess.check_output(['git', '-C', str(REPO), 'show', value['tested_sha'] + ':' + path], timeout=20)
        assert len(data) == own[path]['bytes'] and digest(data) == own[path]['sha256']
    return own
