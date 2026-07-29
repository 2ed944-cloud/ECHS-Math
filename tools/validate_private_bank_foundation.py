#!/usr/bin/env python3
"""Validate direct-linked authenticated private-bank integration."""
from __future__ import annotations
import json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];errors=[]
def fail(msg):errors.append(msg)
def read(rel):
 p=ROOT/rel
 if not p.is_file():fail(f'Missing required file: {rel}');return''
 return p.read_text(encoding='utf-8',errors='replace')
def load(rel):
 try:return json.loads(read(rel))
 except Exception as exc:fail(f'Invalid JSON {rel}: {exc}');return{}
def require(text,markers,label):
 for marker in markers:
  if marker not in text:fail(f'{label} missing marker: {marker}')
def forbid(text,markers,label):
 for marker in markers:
  if marker in text:fail(f'{label} contains forbidden marker: {marker}')

registry=load('question-bank/private-sources/data/private-bank-registry.json')
if registry.get('totals')!={'banks':4,'questions':15671,'pools':1484,'media_files':38593}:fail('Registry totals mismatch')
policy=registry.get('release_policy') or {}
if policy.get('default_trust_tier')!='publisher_key_direct' or policy.get('student_visible') is not True or policy.get('manual_question_trust_required') is not False:fail('Registry direct-release policy is incomplete')
if policy.get('independent_math_review_claimed') is not False:fail('Registry must not claim independent audit')
banks=registry.get('banks') or []
if len(banks)!=4:fail('Registry must contain four banks')
seen=set()
for row in banks:
 code=row.get('bank_code');
 if not re.fullmatch(r'ECHS-BB-[A-Z0-9]+',str(code)):fail(f'Invalid bank code {code}')
 if not re.fullmatch(r'[0-9a-f]{64}',str(row.get('package_sha256',''))):fail(f'{code} invalid SHA-256')
 if row.get('access')!='private-school-authenticated' or row.get('trust_default')!='publisher_key_direct' or row.get('student_visible') is not True:fail(f'{code} direct access contract is incomplete')
 if row.get('manual_question_trust_required') is not False or row.get('verification_basis')!='publisher-answer-key':fail(f'{code} source-key contract is incomplete')
 if row.get('source_content_committed_to_public_repo') is not False:fail(f'{code} source-content flag is unsafe')
 for course,alias in (row.get('display_aliases') or {}).items():
  if alias in seen:fail(f'Duplicate visible alias {alias}')
  seen.add(alias)
if sum(int(r.get('questions') or 0) for r in banks)!=15671:fail('Question counts do not reconcile')

for rel,course,count in [('data/knowledge-graph/ap-precalculus-v1.json','ap-precalculus',50),('data/knowledge-graph/ib-math-ai-v1.json','ib-math-ai',26)]:
 graph=load(rel);skills=graph.get('skills') or []
 if graph.get('course')!=course or len(skills)!=count:fail(f'{rel} graph count/course mismatch')
 ids=[row.get('id') for row in skills]
 if len(ids)!=len(set(ids)):fail(f'{rel} contains duplicate skill IDs')
 known=set(ids)
 for row in skills:
  if not row.get('lesson_ids'):fail(f"{row.get('id')} missing lesson")
  for prereq in row.get('prerequisites') or []:
   if prereq not in known:fail(f"{row.get('id')} unknown prerequisite {prereq}")

catalog=load('data/ib-math-ai-lesson-catalog.json');lessons=[row for unit in catalog.get('units') or [] for row in unit.get('lessons') or []]
if len(lessons)!=26 or 'u0-readiness' not in {row.get('lesson_key') for row in lessons}:fail('IB catalogue must contain 26 lessons including readiness')
if any(row.get('student_visible') is not False or row.get('status')!='content-build-required' for row in lessons):fail('Unbuilt IB lesson pages must remain hidden')

ap=load('question-bank/private-sources/data/ap-precalculus-crosswalk.json');ib=load('question-bank/private-sources/data/ib-math-ai-crosswalk.json')
for name,crosswalk in [('AP',ap),('IB',ib)]:
 if crosswalk.get('mapping_verified') is not True:fail(f'{name} direct mapping must be verified by deterministic source policy')
 p=crosswalk.get('policy') or {}
 if p.get('student_release_requires_question_trust') is not False or p.get('student_release_basis')!='publisher-key-direct':fail(f'{name} manual Trust bypass policy is missing')
 if (p.get('unmatched_destination') or {}).get('unit')!=0:fail(f'{name} readiness Unit 0 is missing')
if len(ap.get('topic_catalog') or [])!=50:fail('AP crosswalk must contain 50 lessons including readiness')
if len(ib.get('skill_catalog') or [])!=26:fail('IB crosswalk must contain 26 direct lessons')

for name in ('at9','ca9','ca9b','acs10'):
 cfg=load(f'question-bank/private-sources/config/{name}.json')
 if cfg.get('student_visible') is not True or cfg.get('trust_default')!='publisher_key_direct' or cfg.get('manual_question_trust_required') is not False:fail(f'{name} direct config is incomplete')
 if cfg.get('publisher_metadata_visibility')!='internal-only':fail(f'{name} publisher metadata must remain internal')

importer=read('question-bank/private-sources/tools/import_blackboard_qti_secure.py')
require(importer,["'publisher_key_direct'","'student_visible':True","'mapping_verified':True","'manual_question_trust_required':False",'direct_ap_map','direct_ib_map','private-bank://'], 'Direct importer')
forbid(importer,["'teacher_review_required'","'student_visible':False"], 'Direct importer')
upload=read('tools/upload_private_bank_package.py')
require(upload,['SUPABASE_SERVICE_ROLE_KEY','private-school-authenticated','publisher_key_direct','student_visible": True','direct_mappings','validate_direct_question','--dry-run'],'Direct upload tool')

migration=read('supabase/migrations/202607272101_private_bank_foundation.sql')
require(migration,["'publisher_key_direct'","private.enforce_private_bank_question_release","manual_question_trust_required","verification_basis}', '') <> 'publisher-answer-key'","'private-question-banks'",'public = false'],'Private bank migration')
purge_migration=read('supabase/migrations/202607291900_resumable_private_bank_course_purge.sql')
require(purge_migration,['private_bank_course_purge_jobs','purge_private_bank_course_mappings_batch','delete_private_bank_questions_batch','service_role','limit greatest(1, least','Resumable administrator course purge state'],'Resumable purge migration')
api=read('supabase/functions/private-bank-api/index.ts')
require(api,['current.role === "student"','/student-questions','publisher_key_direct','Source-key practice; not independently audited','createSignedUrl(path, 300)'],'Private bank API')
purge_api=read('supabase/functions/private-bank-purge-api/index.ts')
require(purge_api,['MIXED_BATCH = 100','QUESTION_BATCH = 250','MEDIA_BATCH = 100','purge_private_bank_course_mappings_batch','delete_private_bank_questions_batch','/jobs/','status: "completed"','Administrator access is required'],'Resumable purge API')
practice=read('question-bank/js/private-bank-practice.js');assets=read('question-bank/js/private-bank-assets.js');practice_html=read('question-bank/practice.html')
require(practice,['private-bank-api','publisher_key_direct','Source-key practice','ECHSBank.loadBundle','skill_key'],'Practice integration')
require(assets,['data-private-src','media-url','MutationObserver'],'Private media integration')
require(practice_html,['private-bank-assets.js','private-bank-practice.js'],'Practice HTML')
center_html=read('question-bank/official/admin/private-bank-center.html');center_js=read('question-bank/official/admin/js/private-bank-center.js');config=read('supabase/config.toml')
require(center_html,['small, resumable batches','purgeProgress','safely resumable','private-bank-center.js?v=20260729-resumable-purge'],'Private Bank Center purge UI')
require(center_js,['private-bank-purge-api','/courses/ib-math-ai','/step','runPurge','Reset paused safely','DELETE IB AI'],'Private Bank Center purge client')
require(config,['[functions.private-bank-api]','[functions.private-bank-purge-api]','verify_jwt = false'],'Supabase purge function config')

for relative in ('question-bank/private-sources/tools/import_blackboard_qti_secure.py','tools/upload_private_bank_package.py','tools/validate_private_bank_packages.py'):
 if read(relative):
  result=subprocess.run([sys.executable,'-m','py_compile',str(ROOT/relative)],capture_output=True,text=True)
  if result.returncode:fail(f'Python syntax error for {relative}: {result.stderr.strip()}')
for relative in ('question-bank/js/private-bank-assets.js','question-bank/js/private-bank-practice.js','question-bank/official/admin/js/private-bank-center.js'):
 result=subprocess.run(['node','--check',str(ROOT/relative)],capture_output=True,text=True)
 if result.returncode:fail(f'JavaScript syntax error for {relative}: {result.stderr.strip()}')

print('ECHS direct-linked private Blackboard banks')
print(f'Errors: {len(errors)}')
for error in errors:print(f'  ERROR: {error}')
if errors:sys.exit(1)
print('Status: PASS')
