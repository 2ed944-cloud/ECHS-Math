"""Offline harness guards. These tests never execute SQL or connect to a DB."""
from pathlib import Path
import ast,copy,importlib,json,subprocess,sys,tempfile
from types import SimpleNamespace
import contract
import run_integration

checks=[]
def passed(label):checks.append(label)
def denied(callback):
    try:callback()
    except (AssertionError,TypeError,ValueError,FileNotFoundError):return
    raise AssertionError('Invalid local input was accepted')

pins,migrations=contract.sources()
assert len(migrations)==27 and len(pins['files'])==33
assert len([r for r in pins['files'] if r['path'].startswith('supabase/functions/')])==3
passed('Exact27 unchanged migrations, three writers and three baseline helpers are byte-pinned')

prefix='echs_bank_test_owner_fence_'
base={'host':'127.0.0.1','dbname':prefix+'synthetic','port':'5432'}
for host,address in [('localhost','127.0.0.1'),('127.0.0.1','127.0.0.1'),('::1','::1')]:
    assert contract.connection_guard({**base,'host':host},prefix)==address
for patch in [{'host':'example.invalid'},{'host':'127.0.0.1,other'},{'host':'/tmp'},{'host':'127.1'},
    {'dbname':'postgres'},{'dbname':prefix+'Uppercase'},{'dbname':prefix+'a'*38},{'dbname':prefix},
    {'port':'0'},{'port':'65536'},{'port':'05432'},{'port':'5432,5433'},
    {'hostaddr':'127.0.0.1'},{'service':'other'},{'options':'-c search_path=other'},
    {'passfile':'secret'},{'target_session_attrs':'any'}]:
    denied(lambda patch=patch:contract.connection_guard({**base,**patch},prefix))
denied(lambda:contract.connection_guard(base,'production_'))
passed('Loopback and closed database names accept three local forms and reject host/libpq overrides')

class DB:
    def __init__(self,address='127.0.0.1',name=base['dbname'],version=150000):
        self.info=SimpleNamespace(hostaddr=address,dbname=name);self.version=version
    def execute(self,query):assert query=='show server_version_num';return self
    def fetchone(self):return (self.version,)
contract.connected(DB(),base,'127.0.0.1')
for bad in [DB(address='192.0.2.1'),DB(name='postgres'),DB(version=140000),DB(version=160000)]:
    denied(lambda bad=bad:contract.connected(bad,base,'127.0.0.1'))
passed('Connected target and PostgreSQL15 guard reject wrong endpoint, database and major version')

with tempfile.TemporaryDirectory(prefix='owner-fence-local-') as scratch:
    root=Path(scratch)
    for row in pins['files']:
        target=root/row['path'];target.parent.mkdir(parents=True,exist_ok=True)
        target.write_bytes((contract.REPO/row['path']).read_bytes())
    contract.sources(root)
    target=root/pins['files'][0]['path'];original=target.read_bytes();target.write_bytes(original+b'\n')
    denied(lambda:contract.sources(root));target.write_bytes(original)
    extra=root/'supabase/migrations/202609090099_unapproved.sql';extra.write_text('select 1;')
    denied(lambda:contract.sources(root));extra.unlink()
    target.unlink();denied(lambda:contract.sources(root))
passed('Copied dependency changes, extra migration and missing source are rejected')

with tempfile.TemporaryDirectory(prefix='owner-fence-harness-') as scratch:
    root=Path(scratch)
    for name in run_integration.OWNED:(root/name).write_bytes((contract.HERE/name).read_bytes())
    original=run_integration.HERE
    try:
        run_integration.HERE=root;expected=run_integration.source_snapshot()
        run_integration.assert_snapshot(expected)
        (root/'test_fence.py').write_bytes((root/'test_fence.py').read_bytes()+b'\n')
        denied(lambda:run_integration.assert_snapshot(expected))
    finally:run_integration.HERE=original
passed('Changed SQL/harness source cannot pass final candidate source binding')

for name in ['contract.py','run_integration.py','test_fence.py','test_local.py']:
    ast.parse((contract.HERE/name).read_text(encoding='utf-8'),filename=name)
# A poison import proves the default CLI never imports the DB driver or opens a
# connection; it does not imitate any SQL result or database acceptance path.
script="import sys,runpy;sys.modules['psycopg']=None;sys.argv=['run_integration.py'];runpy.run_path('run_integration.py',run_name='__main__')"
done=subprocess.run([sys.executable,'-B','-c',script],cwd=contract.HERE,capture_output=True,text=True,timeout=20)
assert done.returncode==0
output=json.loads(done.stdout);assert output['database_executed'] is False and output['migration_count']==27 and output['production_calls']==0
passed('Python syntax and default no-driver/no-database execution boundary pass')

report={'contract':'echs.c04.owner-fence-local-tests.v1','status':'LOCAL HARNESS GUARDS PASS; POSTGRESQL NOT EXECUTED',
    'checks':checks,'check_count':len(checks),'database_executed':False,'production_calls':0,
    'source_files':run_integration.source_snapshot()}
target=contract.HERE/'results'/'local-results.json';target.parent.mkdir(exist_ok=True);target.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'status':report['status'],'check_count':len(checks)}))
