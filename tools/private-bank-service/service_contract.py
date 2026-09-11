"""Offline C08 service-fixture guards. Importing this module performs no I/O.

These validate plans and observed metadata. They do not start services, prove a
registry lookup, authorize production work, or make an injected test a service test.
"""
from pathlib import Path
import hashlib
import json
import math
import re

HERE = Path(__file__).resolve().parent
PIN_SHA256 = '1c12cbf8c3e5d420d50032912586d8472aa2ed16d5bcdd73c47be5e98cb72a73'
OBSERVATION_SHA256 = 'c17720ce76be5f136264440818b7c708141e0c6e08515449f652b09616b98d67'
UPSTREAM_COMMIT = '8c7a4d9dbbaf8b552893822e89d7bf06f33f9220'
UPSTREAM_TREE = 'cfff91877eb85435d69c02b2680da05b2ecc150e'
DOCKER_TREE = '2e0e90793e486fb10f2b5a291d6f64530cb1a0ae'
ORIGIN = 'https://echsc08servicetest.supabase.co'
SERVICES = ('db', 'auth', 'rest', 'storage', 'imgproxy')
IMAGE_TAGS = dict(zip(SERVICES, ('supabase/postgres:15.8.1.085',
    'supabase/gotrue:v2.196.0', 'postgrest/postgrest:v14.17',
    'supabase/storage-api:v1.74.0', 'darthsim/imgproxy:v3.31.4')))
POSTGRES_TAGS = {15:'supabase/postgres:15.8.1.085',17:'supabase/postgres:17.6.1.136'}
RUNTIME_HASHES = {'handler.mjs':'ff49fd68970612cd325dec9819707a91a431eb1799cf6c4d88d1fea675f4cf0e',
    'transport.mjs':'11425bcd086ddb2f88c788969ef82e1f2af8a7803d8b8110baabf785bb3152d3'}
INIT_SQL = tuple('docker/volumes/db/'+n+'.sql' for n in
    ('_supabase', 'jwt', 'logs', 'pooler', 'realtime', 'roles', 'webhooks'))
UPSTREAM_PATHS = set(INIT_SQL) | {'docker/docker-compose.yml',
    'docker/docker-compose.pg15.yml', 'docker/volumes/api/kong.yml'}
UNSAFE_ENVIRONMENT = frozenset(('DOCKER_HOST','DOCKER_CONTEXT','DOCKER_CONFIG','DOCKER_CERT_PATH','DOCKER_TLS_VERIFY','COMPOSE_FILE','COMPOSE_PROJECT_NAME',
    'NODE_TLS_REJECT_UNAUTHORIZED','NODE_EXTRA_CA_CERTS','SSL_CERT_FILE','SSL_CERT_DIR',
    'HTTPS_PROXY','HTTP_PROXY','ALL_PROXY','https_proxy','http_proxy','all_proxy',
    'SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','DATABASE_URL','PGHOST','PGSERVICE','PGSERVICEFILE'))

class ContractError(ValueError):
    def __init__(self, code):
        self.code = code
        super().__init__('C08 service preflight rejected: '+code)

def need(condition, code):
    if not condition:
        raise ContractError(code)

def digest(raw):
    return hashlib.sha256(raw).hexdigest()

def closed(value, keys):
    need(type(value) is dict and set(value) == set(keys), 'closed-shape')
    return value

def exact(value, expected):
    if type(value) is not type(expected):
        return False
    if type(value) is dict:
        return set(value) == set(expected) and all(exact(value[k], expected[k]) for k in value)
    if type(value) is list:
        return len(value) == len(expected) and all(exact(a,b) for a,b in zip(value,expected))
    return value == expected

def strict_json(raw):
    need(type(raw) is bytes and 0 < len(raw) <= 262144, 'metadata-size')
    def pairs(items):
        result = {}
        for key, value in items:
            need(key not in result, 'duplicate-key')
            result[key] = value
        return result
    def nonfinite(_):
        raise ContractError('nonfinite-number')
    def floating(token):
        value = float(token)
        need(math.isfinite(value), 'nonfinite-number')
        return value
    try:
        return json.loads(raw.decode('utf-8'), object_pairs_hook=pairs, parse_constant=nonfinite, parse_float=floating)
    except (UnicodeError, json.JSONDecodeError):
        raise ContractError('invalid-json') from None

def relative_path(value):
    need(type(value) is str and re.fullmatch(r'[A-Za-z0-9_./-]{1,512}',value)
         and not value.startswith('/') and all(p not in ('','.','..') for p in value.split('/')),
         'relative-path')
    return value

def local_file(root, relative):
    relative_path(relative)
    root = Path(root).absolute()
    need(root.is_dir() and not root.is_symlink() and not root.is_junction(), 'source-root')
    path = root
    for part in relative.split('/'):
        path = path / part
        need(not path.is_symlink() and not path.is_junction(), 'linked-path')
    need(path.resolve().is_relative_to(root.resolve()) and path.is_file(), 'source-file')
    need(path.stat().st_size <= 4194304, 'source-size')
    return path.read_bytes()

def row_hash(row, raw, git=False):
    need(type(row['bytes']) is int and row['bytes'] == len(raw) and row['sha256'] == digest(raw), 'source-hash')
    if git:
        actual = hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
        need(row['git_blob'] == actual, 'git-blob')

def postgres_major(value):
    need(type(value) is int and value in (15,17),'configured-postgres-major')
    return value

def image_tags(expected_major=15):
    return dict(IMAGE_TAGS,db=POSTGRES_TAGS[postgres_major(expected_major)])

def postgres_observation(value,expected_major=15):
    major=postgres_major(expected_major)
    closed(value,('server_version_num','server_version'))
    number=value['server_version_num'];version=value['server_version']
    need(type(number) is int and number//10000==major,'actual-postgres-major')
    need(type(version) is str,'actual-postgres-version')
    match=re.fullmatch(str(major)+r'\.(0|[1-9][0-9]{0,3})(?: \([^\r\n]{1,180}\))?',version)
    need(match is not None and int(match.group(1))==number%10000,'actual-postgres-version')
    return value

def verify_sources(repo, runtime, candidate=HERE):
    raw = local_file(candidate,'source-pins.json')
    need(digest(raw) == PIN_SHA256, 'unapproved-source-pins')
    pins = strict_json(raw)
    closed(pins, ('contract','status','upstream','migrations','runtime','image_tags_by_major',
        'image_digests_resolved','services_executed','hosted_edge_executed','corpus_imported'))
    need(pins['contract'] == 'echs.c08.storage-service-source-pins.v1'
         and pins['status'] == 'SOURCE_BOUND_SERVICES_NOT_EXECUTED', 'source-contract')
    for key in ('image_digests_resolved','services_executed','hosted_edge_executed','corpus_imported'):
        need(pins[key] is False, 'false-execution-claim')
    need(exact(pins['image_tags_by_major'],{str(m):image_tags(m) for m in (15,17)}), 'image-tags')
    upstream = pins['upstream']
    closed(upstream, ('tag','tag_object','commit','tree','docker_tree','files'))
    need(upstream['tag'] == 'self-hosted/v0.8.1' and upstream['tag_object'] == '690080884040e238926ba22606e8c05a3536829b'
         and upstream['commit'] == UPSTREAM_COMMIT and upstream['tree'] == UPSTREAM_TREE
         and upstream['docker_tree'] == DOCKER_TREE, 'upstream-chain')
    observation_raw = local_file(candidate,'upstream-observation.json')
    need(digest(observation_raw) == OBSERVATION_SHA256, 'upstream-observation')
    observation = strict_json(observation_raw)
    need(observation['tag']['object']['sha'] == UPSTREAM_COMMIT
         and observation['commit']['tree']['sha'] == UPSTREAM_TREE
         and observation['root_docker_entry']['sha'] == DOCKER_TREE
         and observation['docker_tree']['truncated'] is False, 'upstream-chain')
    rows = upstream['files']
    need(type(rows) is list and len(rows) == 10 and {r['path'] for r in rows} == UPSTREAM_PATHS, 'upstream-files')
    observed = observation['files']
    need(len(observed) == 10 and {r['path'] for r in observed} == UPSTREAM_PATHS, 'upstream-files')
    for row in rows:
        closed(row, ('path','git_blob','bytes','sha256'))
        source = next(r for r in observed if r['path'] == row['path'])
        row_hash(row,source['content'].encode('utf-8'),git=True)
    migrations = pins['migrations']
    need(type(migrations) is list and len(migrations) == 27, 'migration-prefix')
    names = [r['path'] for r in migrations]
    need(names == sorted(set(names)) and names[-1] == 'supabase/migrations/202609090003_private_bank_snapshots.sql', 'migration-prefix')
    for row in migrations:
        closed(row, ('path','git_blob','bytes','sha256'))
        need(re.fullmatch(r'supabase/migrations/[0-9]{12}_[a-z0-9_]+\.sql',row['path']), 'migration-path')
        row_hash(row,local_file(repo,row['path']),git=True)
    need(type(pins['runtime']) is list and len(pins['runtime']) == 2
         and {r['path']:r['sha256'] for r in pins['runtime']} == RUNTIME_HASHES, 'runtime-pin')
    for row in pins['runtime']:
        closed(row, ('path','bytes','sha256'))
        row_hash(row,local_file(runtime,row['path']))
    return {'source_pins_sha256':PIN_SHA256,'upstream_commit':UPSTREAM_COMMIT,
        'upstream_files_verified':10,'migration_files_verified':27,'runtime_files_verified':2,
        'runtime_sha256':RUNTIME_HASHES.copy()}

def run_identifier(value):
    need(type(value) is str and re.fullmatch(r'[0-9a-f]{32}',value), 'run-id')
    return value

def fixture_plan(run_id,expected_major=15):
    major=postgres_major(expected_major);run_identifier(run_id)
    project = 'echs-c08-service-'+run_id
    return {'contract':'echs.c08.storage-service-fixture-plan.v1', 'run_id':run_id,
        'project':project,'origin':ORIGIN,'bind_address':'127.0.0.1',
        'network':{'name':project+'_internal','internal':True,'external':False},
        'volumes':[{'name':project+'_'+name,'external':False} for name in ('db-data','db-config','storage-data')],
        'ownership_labels':{'echs.fixture':project,'echs.run_id':run_id},
        'tls':{'hostname':'echsc08servicetest.supabase.co','verify_certificate':True,
               'verify_hostname':True,'test_ca':'GENERATED_PER_RUN','resolver':'LOOPBACK_ONLY'},
        'postgres_required':major,'services':image_tags(major),'data_scope':'SYNTHETIC_ONLY',
        'managed_schema':'OFFICIAL_IMAGE_AND_SERVICE_MIGRATIONS',
        'image_digests_resolved':False,'services_executed':False,
        'hosted_edge_executed':False,'corpus_imported':False}

def validate_fixture_plan(value,expected_major=15):
    need(type(value) is dict and 'run_id' in value, 'fixture-shape')
    need(exact(value,fixture_plan(value['run_id'],expected_major)), 'fixture-policy')
    return value

def clean_environment(environ):
    # Check keys only. Never stringify or log a rejected value.
    need(type(environ) is dict and not UNSAFE_ENVIRONMENT.intersection(environ), 'ambient-service-configuration')

def validate_image_receipt(raw, approved_sha256,expected_major=15):
    major=postgres_major(expected_major)
    need(type(approved_sha256) is str and re.fullmatch('[0-9a-f]{64}',approved_sha256)
         and digest(raw) == approved_sha256, 'unapproved-image-receipt')
    receipt = strict_json(raw)
    closed(receipt, ('contract','upstream_commit','platform','images','postgres_required'))
    need(receipt['contract'] == 'echs.c08.storage-image-receipt.v1'
         and receipt['upstream_commit'] == UPSTREAM_COMMIT and receipt['platform'] == 'linux/amd64', 'image-receipt-contract')
    need(type(receipt['postgres_required']) is int and receipt['postgres_required']==major,'image-postgres-major')
    rows = receipt['images']
    need(type(rows) is list and len(rows) == 5, 'image-service-set')
    for row in rows:
        closed(row, ('service','tag','manifest_digest','config_digest'))
        need(type(row['service']) is str and row['service'] in SERVICES, 'image-service-set')
    need({r['service'] for r in rows} == set(SERVICES), 'image-service-set')
    for row in rows:
        closed(row, ('service','tag','manifest_digest','config_digest'))
        need(row['tag'] == image_tags(major)[row['service']], 'image-version')
        for key in ('manifest_digest','config_digest'):
            need(type(row[key]) is str and re.fullmatch(r'sha256:[0-9a-f]{64}',row[key]), 'image-digest')
    # Shape/hash validation cannot independently establish a registry observation.
    return {r['service']:r['tag']+'@'+r['manifest_digest'] for r in rows}

def cleanup_targets(plan, observed_resources,expected_major=15):
    """Validate caller-provided observations only; perform no Docker/filesystem action."""
    validate_fixture_plan(plan,expected_major)
    expected = {('network',plan['network']['name'])} | {('volume',r['name']) for r in plan['volumes']}
    need(type(observed_resources) is list and len(observed_resources) == len(expected), 'resource-set')
    actual = set()
    for row in observed_resources:
        closed(row, ('kind','name','labels','external'))
        need(row['external'] is False and exact(row['labels'],plan['ownership_labels']), 'resource-ownership')
        need(type(row['kind']) is str and type(row['name']) is str, 'resource-set')
        actual.add((row['kind'],row['name']))
    need(actual == expected, 'resource-set')
    return sorted(actual)

def write_report_exclusive(path, value, root=HERE/'results'):
    """Write an explicit report under this candidate, never replace evidence."""
    root = Path(root).absolute()
    path = Path(path).absolute()
    need(path.parent == root and re.fullmatch(r'[a-z0-9][a-z0-9_-]{0,80}\.json',path.name), 'report-path')
    for item in (root,*root.parents):
        need(not item.is_symlink() and not item.is_junction(), 'linked-report-path')
    root.mkdir(exist_ok=True)
    try:
        with path.open('x',encoding='utf-8',newline='\n') as f:
            f.write(json.dumps(value,indent=2,allow_nan=False)+'\n')
    except FileExistsError:
        raise ContractError('report-exists') from None
