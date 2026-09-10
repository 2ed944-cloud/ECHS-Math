"""Closed local integration inputs. Importing this module performs no I/O."""
from pathlib import Path
import hashlib,json,re

HERE=Path(__file__).resolve().parent
REPO=HERE.parent.parent
TRANSPORT=HERE

REPOSITORY_INPUTS=('supabase/migrations/202607260001_institutional_platform.sql', 'supabase/migrations/202607260002_bootstrap_function_repair.sql', 'supabase/migrations/202607260003_login_authentication_repair.sql', 'supabase/migrations/202607270001_session_lookup_repair.sql', 'supabase/migrations/202607272001_mastery_evidence_foundation.sql', 'supabase/migrations/202607272002_mastery_authority_guard.sql', 'supabase/migrations/202607272003_attempt_trust_guard.sql', 'supabase/migrations/202607272004_atomic_skill_mapping.sql', 'supabase/migrations/202607272101_private_bank_foundation.sql', 'supabase/migrations/202607272102_private_attempt_trust_bridge.sql', 'supabase/migrations/202607272201_teacher_upload_manager.sql', 'supabase/migrations/202607282330_verified_private_bank_import.sql', 'supabase/migrations/202607290001_raise_teacher_upload_bucket_limit.sql', 'supabase/migrations/202607291900_resumable_private_bank_course_purge.sql', 'supabase/migrations/202607300020_sync_private_bank_mapping_indexes.sql', 'supabase/migrations/202607301500_private_bank_practice_inventory.sql', 'supabase/migrations/202607312230_restore_ib_current_bank_practice_visibility.sql', 'supabase/migrations/202608020002_assignment_routes_and_timetables.sql', 'supabase/migrations/202608300001_lesson_visibility_progression.sql', 'supabase/migrations/202609050100_ib_readiness_pathway_engine.sql', 'supabase/migrations/202609080001_curriculum_versions.sql', 'supabase/migrations/202609080002_lesson_persistence.sql', 'supabase/migrations/202609080003_lesson_content_v2.sql', 'supabase/migrations/202609080004_lesson_media.sql', 'supabase/migrations/202609090001_lesson_draft_recovery.sql', 'supabase/migrations/202609090002_membership_authorization.sql', 'supabase/migrations/202609090003_private_bank_snapshots.sql', 'tools/private_snapshot_fixture.py', 'tools/test_private_snapshot_database.py', 'tools/test_membership_authorization_database.py', 'tools/membership_authorization_rpc_fixture.py', 'tools/test_membership_authorization_e2e.mjs', 'supabase/functions/institution-api/index.ts', 'supabase/functions/institution-api/lesson-access-policy.js', 'supabase/functions/_shared/mastery-status.mjs')
RUNTIME_SHA256={'transport.mjs': '11425bcd086ddb2f88c788969ef82e1f2af8a7803d8b8110baabf785bb3152d3', 'handler.mjs': 'ff49fd68970612cd325dec9819707a91a431eb1799cf6c4d88d1fea675f4cf0e'}
def digest(raw):return hashlib.sha256(raw).hexdigest()
OWN_PATHS=tuple('tools/private-bank-transport/'+p for p in ['handler.mjs','transport.mjs','contract.py','rpc-fixture.py','run-integration.py','test-contract.py','test-http-sql.mjs','source-pins.json','README.md'])+('.github/workflows/private-bank-transport-integration.yml',)
FOLLOWUP_PATHS=tuple('docs/codex/'+p for p in ['OWNER_STORAGE_FOUNDATION_C04_RELEASE.json','OWNER_STORAGE_FOUNDATION_C04.md','MASTER_ARCHITECTURE_AUDIT_20260909.md','MASTER_EXECUTION_PLAN.json','PRIVATE_BANK_SNAPSHOTS_C08.md'])+('tools/validate_master_execution_plan.py','tools/test_master_execution_plan.py')
def checkout_sources(checkout,manifest):
    assert checkout['status']=='EXACT SOURCE CHECKOUT VERIFIED' and checkout['base_sha']==manifest['base_sha'] and checkout['base_tree']==manifest['base_tree']
    rows=checkout['source_files'];expected=set(REPOSITORY_INPUTS)|set(OWN_PATHS)|set(FOLLOWUP_PATHS)
    assert isinstance(rows,list) and len(rows)==len(expected)==52 and {r['path'] for r in rows}==expected
    for row in rows:
        assert set(row)=={'path','bytes','sha256','git_blob_sha'} and type(row['bytes']) is int and 0<=row['bytes']<=16777216
        assert re.fullmatch('[0-9a-f]{64}',row['sha256']) and re.fullmatch('[0-9a-f]{40}',row['git_blob_sha'])
        raw=(REPO/row['path']).read_bytes()
        assert len(raw)==row['bytes'] and digest(raw)==row['sha256'],'Checkout source bytes changed'
        assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==row['git_blob_sha'],'Checkout Git blob changed'
def sources():
    manifest=json.loads((HERE/'source-pins.json').read_text())
    assert manifest['contract']=='echs.c08.transport-sql-inputs.v1'
    assert len(manifest['files'])==37
    assert {(r['root'],r['path']) for r in manifest['files']}=={('repo',p) for p in REPOSITORY_INPUTS}|{('transport',p) for p in RUNTIME_SHA256}
    assert re.fullmatch(r'[0-9a-f]{40}',manifest['base_sha']) and re.fullmatch(r'[0-9a-f]{40}',manifest['base_tree'])
    assert {r['path']:r['sha256'] for r in manifest['files'] if r['root']=='transport'}==RUNTIME_SHA256
    for row in manifest['files']:
        root=REPO if row['root']=='repo' else TRANSPORT if row['root']=='transport' else None
        assert root and '..' not in Path(row['path']).parts and not Path(row['path']).is_absolute()
        raw=(root/row['path']).read_bytes();assert len(raw)==row['bytes'] and digest(raw)==row['sha256'],'Integration source drift'
    migrations=[{'file':r['path'].split('/')[-1],'sha256':r['sha256']} for r in manifest['files'] if r['path'].startswith('supabase/migrations/')]
    assert len(migrations)==27 and migrations[-1]['file']=='202609090003_private_bank_snapshots.sql'
    assert migrations[-1]['sha256']=='9169cee2067fef09bcd0d15c0f65703c3b2c203bbe2ad3fd6217a6c41c1d6412'
    return manifest,migrations
def connection_guard(info,prefix):
    assert prefix in ['echs_bank_test_transport_','echs_membership_test_transport_']
    assert set(info)<= {'host','port','dbname','user','password','connect_timeout','sslmode','application_name'}
    assert info.get('host') in ['localhost','127.0.0.1','::1']
    assert re.fullmatch(re.escape(prefix)+r'[a-z0-9_]{1,48}',info.get('dbname',''))
    assert len(info['dbname'])<=63,'PostgreSQL must not truncate the chosen test database name'
    assert re.fullmatch(r'[1-9][0-9]{0,4}',info.get('port','5432')) and int(info.get('port','5432'))<=65535
    return '::1' if info['host']=='::1' else '127.0.0.1'
def check_connection(db,info,address):
    assert db.info.hostaddr==address and db.info.dbname==info['dbname']
    assert int(db.execute('show server_version_num').fetchone()[0])//10000==15
def closed(value,keys):
    assert isinstance(value,dict) and set(value)==set(keys),'Unsupported fixture shape'
    return value
def rpc_request(request):
    closed(request,['id','name','args']);name=request['name'];args=request['args']
    if name=='api_session_lookup':closed(args,['p_token_hash'])
    else:
        assert name in ['private_bank_snapshot_import','private_bank_snapshot_file']
        closed(args,['p_token_hash','p_action','p_payload'])
        if name=='private_bank_snapshot_import':assert args['p_action']=='status';closed(args['p_payload'],['snapshot_id'])
        elif args['p_action']=='status':closed(args['p_payload'],['snapshot_id','file_id'])
        else:assert args['p_action']=='verify_bytes';closed(args['p_payload'],['snapshot_id','request_id','file_id','sha256','byte_length','mime_type'])
    assert isinstance(args['p_token_hash'],str) and re.fullmatch(r'[0-9a-f]{64}',args['p_token_hash'])
    return name,args
