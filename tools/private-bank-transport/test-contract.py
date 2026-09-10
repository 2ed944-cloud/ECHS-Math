"""Local guard and source preflight tests. Never PostgreSQL execution evidence."""
import copy,hashlib,json,py_compile,tempfile,types
from pathlib import Path
import contract
from contract import HERE,sources,connection_guard,check_connection,rpc_request
checks=[]
def check(label,fn):fn();checks.append(label);print('PASS '+label)
def rejects(fn):
    try:fn()
    except (AssertionError,KeyError,TypeError):return
    raise AssertionError('Unsafe candidate input accepted')
def source_test():
    manifest,migrations=sources();assert len(migrations)==27
    for name in ['contract.py','rpc-fixture.py','run-integration.py','test-contract.py']:py_compile.compile(str(HERE/name),doraise=True)
check('Exact27 migration prefix and reviewed handler inputs are byte-bound; Python modules compile',source_test)
def host_test():
    for host,address in [('localhost','127.0.0.1'),('127.0.0.1','127.0.0.1'),('::1','::1')]:
        for prefix in ['echs_bank_test_transport_','echs_membership_test_transport_']:
            assert connection_guard({'host':host,'dbname':prefix+'ci','port':'5432'},prefix)==address
check('Only explicit loopback addresses and separate synthetic database prefixes are accepted',host_test)
def negative_connections():
    base={'host':'127.0.0.1','dbname':'echs_bank_test_transport_ci','port':'5432'}
    vectors=[{'host':'example.com'},{'host':'127.0.0.1,example.com'},{'host':'/tmp'},{'host':''},{'dbname':'production'},{'dbname':'echs_bank_test_ci'},{'dbname':'echs_bank_test_transport_A'},{'dbname':'echs_bank_test_transport_'+'a'*48},
             {'port':'0'},{'port':'65536'},{'port':'05432'},{'port':'5432,5433'},{'service':'other'},{'hostaddr':'127.0.0.1'},{'options':'-c search_path=evil'}, {'sslrootcert':'unreviewed'}]
    for change in vectors:rejects(lambda change=change:connection_guard({**base,**change},'echs_bank_test_transport_'))
check('Remote, DSN override, ambiguous path and port variants fail before connection',negative_connections)
def connected_targets():
    def mock(addr='127.0.0.1',name='echs_bank_test_transport_ci',version=150009):return types.SimpleNamespace(info=types.SimpleNamespace(hostaddr=addr,dbname=name),execute=lambda _:types.SimpleNamespace(fetchone=lambda:(version,)))
    expected={'dbname':'echs_bank_test_transport_ci'};check_connection(mock(),expected,'127.0.0.1')
    for args in [('192.0.2.1',expected['dbname'],150009),('127.0.0.1','other',150009),('127.0.0.1',expected['dbname'],160000)]:rejects(lambda args=args:check_connection(mock(*args),expected,'127.0.0.1'))
check('libpq connected address, exact database identity and PostgreSQL15 are required',connected_targets)
token='a'*64;sid='11111111-1111-4111-8111-111111111111';fid='22222222-2222-4222-8222-222222222222'
valid=[{'id':1,'name':'api_session_lookup','args':{'p_token_hash':token}},
 {'id':2,'name':'private_bank_snapshot_import','args':{'p_token_hash':token,'p_action':'status','p_payload':{'snapshot_id':sid}}},
 {'id':3,'name':'private_bank_snapshot_file','args':{'p_token_hash':token,'p_action':'status','p_payload':{'snapshot_id':sid,'file_id':fid}}},
 {'id':4,'name':'private_bank_snapshot_file','args':{'p_token_hash':token,'p_action':'verify_bytes','p_payload':{'snapshot_id':sid,'request_id':fid,'file_id':fid,'sha256':token,'byte_length':12,'mime_type':'application/json'}}}]
check('Only the three reviewed RPC names and exact status/byte-receipt shapes pass the bridge',lambda:[rpc_request(v) for v in valid])
def closed_actions():
    for name in ['private_bank_practice','arbitrary_sql','private_bank_snapshot_capabilities']:rejects(lambda name=name:rpc_request({**valid[0],'name':name}))
    for action in ['reserve','register','records','mappings','verify_records','seal','abort']:
        for name in ['private_bank_snapshot_import','private_bank_snapshot_file']:
            v=copy.deepcopy(valid[2]);v['name']=name;v['args']['p_action']=action;rejects(lambda v=v:rpc_request(v))
    for original in valid:
        for place in ['top','args','payload']:
            v=copy.deepcopy(original)
            if place=='top':v['sql']='untrusted'
            elif place=='args':v['args']['p_organization_id']=sid
            elif 'p_payload' in v['args']:v['args']['p_payload']['verified']=True
            else:continue
            rejects(lambda v=v:rpc_request(v))
check('Arbitrary SQL, mutation forwarding and injected authority fields are rejected',closed_actions)
def invalid_tokens():
    for token in ['',None,'A'*64,'a'*63,'a'*65,{'value':'a'*64}]:
        v=copy.deepcopy(valid[0]);v['args']['p_token_hash']=token;rejects(lambda:rpc_request(v))
check('Only exact lowercase SHA256 session lookup tokens cross the fixture RPC boundary',invalid_tokens)

def checkout_binding():
    original=contract.REPO
    with tempfile.TemporaryDirectory(prefix='echs-checkout-guard-') as directory:
        root=Path(directory);manifest={'base_sha':'a'*40,'base_tree':'b'*40};rows=[]
        for name in sorted(set(contract.REPOSITORY_INPUTS)|set(contract.OWN_PATHS)|set(contract.FOLLOWUP_PATHS)):
            raw=('synthetic fixture: '+name+'\n').encode();target=root/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(raw)
            rows.append({'path':name,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'git_blob_sha':hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()})
        receipt={'status':'EXACT SOURCE CHECKOUT VERIFIED',**manifest,'source_files':rows}
        contract.REPO=root
        try:
            contract.checkout_sources(receipt,manifest)
            for name in ['tools/private-bank-transport/run-integration.py','.github/workflows/private-bank-transport-integration.yml','docs/codex/OWNER_STORAGE_FOUNDATION_C04_RELEASE.json']:
                target=root/name;original_bytes=target.read_bytes();target.write_bytes(original_bytes+b'changed')
                rejects(lambda:contract.checkout_sources(receipt,manifest));target.write_bytes(original_bytes)
            for vector in [rows[:-1],rows+[rows[0]],[*rows[:-1],rows[0]]]:
                rejects(lambda vector=vector:contract.checkout_sources({**receipt,'source_files':vector},manifest))
            wrong=copy.deepcopy(receipt);wrong['source_files'][0]['git_blob_sha']='0'*40
            rejects(lambda:contract.checkout_sources(wrong,manifest))
            contract.checkout_sources(receipt,manifest)
        finally:contract.REPO=original
check('All52 checkout bindings reject altered harness/workflow/follow-up bytes, missing or duplicate paths and forged Git blobs',checkout_binding)
report={'status':'LOCAL HARNESS PREFLIGHT PASS; ACTUAL POSTGRESQL NOT EXECUTED','checks':checks,'passed':len(checks),'production_calls':0,'database_executed':False,'real_storage_executed':False,'hosted_edge_executed':False}
(HERE/'results').mkdir(exist_ok=True);(HERE/'results/local-preflight.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'status':report['status'],'groups':len(checks)}))
