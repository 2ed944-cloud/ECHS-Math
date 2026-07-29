#!/usr/bin/env python3
from __future__ import annotations
import re, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];errors=[]
def read(path):
 p=ROOT/path
 if not p.is_file():errors.append(f'Missing {path}');return''
 return p.read_text(encoding='utf-8',errors='replace')
def require(text,items,label):
 for item in items:
  if item not in text:errors.append(f'{label} missing {item}')
html=read('question-bank/official/admin/upload-manager.html');js=read('question-bank/official/admin/js/upload-manager.js');css=read('question-bank/official/admin/css/upload-manager.css');api=read('supabase/functions/upload-manager-api/index.ts');private_api=read('supabase/functions/private-bank-api/index.ts');practice=read('question-bank/js/private-bank-practice.js');center_html=read('question-bank/official/admin/private-bank-center.html');center_js=read('question-bank/official/admin/js/private-bank-center.js');migration=read('supabase/migrations/202607272201_teacher_upload_manager.sql');workflow=read('.github/workflows/process-teacher-uploads.yml');chunk_deploy=read('.github/workflows/deploy-upload-manager-chunking.yml');processor=read('tools/process_teacher_upload_request.py');fast_processor=read('tools/process_teacher_upload_request_fast.py');ib_processor=read('tools/process_ib_lesson_release.py');uploader=read('tools/upload_private_bank_package.py');fast_uploader=read('tools/upload_private_bank_package_fast.py');verified_uploader=read('tools/upload_private_bank_package_verified_fast.py');free_tier_uploader=read('tools/upload_private_bank_package_verified_free_tier.py');package_validator=read('tools/validate_private_bank_packages.py');deploy=read('.github/workflows/deploy-institution-backend.yml');supabase_config=read('supabase/config.toml');ib_update=read('data/ib-math-ai-unit-1-update.js');ib_bootstrap=read('lessons/ib-math-ai/unit-1/assets/unit-1-bootstrap.js')
require(html,['Private Bank Manager','Lesson &amp; Unit Release Manager','zipFile','upload-manager.js','data-require-account="teacher admin"','bankCourseKey','value="ib-math-ai"','lesson-catalog-patch.json','never merged automatically','free-tier-safe parts'],'Upload manager page')
require(js,['crypto.subtle.digest','XMLHttpRequest','FormData','application/octet-stream','uploadPlan','file.slice','part ${Number(item.index','/complete','requireAuth(["teacher","admin"])'],'Upload manager client')
require(css,['.dropZone','.progressBar','.requestItem','.historyDelete','.historyClear','@media'],'Upload manager styles')
require(api,['createSignedUploadUrl','teacher-upload-staging','CHUNK_BYTES=40*1024*1024','chunkMeta','part_paths','upload_mode:"chunked"','Upload part','1.3.0-free-tier-chunked','"ib-math-ai"'],'Upload manager API')
require(private_api,['SUPPORTED_COURSES','"ap-calculus"','/student-questions','manifest','course_mappings','unit'],'Private bank API')
require(practice,['"ap-calculus"','CALC-BANK-01','dynamicLabels','unit=','private-bank-api'],'Private practice integration')
require(center_html,['AP Calculus','calcBanks','Open Upload Manager'],'Private bank center page')
require(center_js,['manifest?.target_courses','ap-calculus:U0','livePackages','visibleName'],'Private bank center client')
require(migration,['teacher_upload_requests','teacher-upload-staging','file_size_bytes <= 157286400',"'private-bank','course-release'"],'Upload manager migration')
require(workflow,['schedule:','*/5 * * * *','SUPABASE_SERVICE_ROLE_KEY','process_teacher_upload_request_fast.py','process_ib_lesson_release.py','timeout-minutes: 120','(ap-precalculus|ib-math-ai)-unit-','never merged automatically'],'Upload processor workflow')
require(fast_processor,['part_paths','Reassembled staged part','hashlib.sha256','base.download = download','upload_private_bank_package_verified_free_tier.py','process_ib_ai_release','base.process_course = process_course'],'Chunk and lesson processor')
require(ib_processor,['lesson-catalog-patch.json','unit-{unit_number}-portal-object.json','g11-ib-ai','ECHS Lesson Release Manager','echs_course_release_bridge_v1','External runtime asset','never'],'IB lesson release processor')
require(chunk_deploy,['supabase functions deploy upload-manager-api','SUPABASE_PROJECT_REF','institutional-production'],'Chunk deployment workflow')
for text,label in [(uploader,'Private bank uploader'),(fast_uploader,'Fast bank uploader')]:require(text,['SUPPORTED_COURSES','ap-calculus','target_courses','--expected-course','direct_mappings'],label)
require(verified_uploader,['student_ready_verified','independent-solution-audit','question_trust_records','bank-manifest.json','IMPORT_RESULT='],'Verified bank uploader')
require(free_tier_uploader,['PART_BYTES = 40 * 1024 * 1024','echs-chunked-source-archive-v1','part-','application/json'],'Free-tier source archive uploader')
require(package_validator,['ALLOWED_COURSES','ap-calculus','target_courses','Question mappings'],'Private bank package validator')
require(deploy,['upload-manager-api','setup-api/health','supabase functions deploy'],'Backend deployment health contract')
require(supabase_config,['[functions.upload-manager-api]','verify_jwt = false'],'Supabase upload-manager function config')
require(ib_update,['g11-ib-ai','window.ECHS_COURSES.filter','Scientific Notation and Orders of Magnitude','Technology for Equations and Systems','lesson.html?lesson=1.1'],'Canonical IB Unit 1 portal update')
require(ib_bootstrap,['ECHSCompleteIBLesson','echs_math_complete','DecompressionStream','Lesson assets could not be loaded','g11-ib-ai'],'IB lesson bootstrap')
if 'window.ECHS_COURSES.push(course)' in ib_update:errors.append('IB Unit 1 update must not create a duplicate course card')
if 'SUPABASE_SERVICE_ROLE_KEY' in html+js:errors.append('Browser code must not contain the service-role secret name')
if re.search(r"storage\.buckets.*public\s*=\s*true",migration,re.S):errors.append('Teacher upload bucket must not be public')
for path in ['tools/process_teacher_upload_request.py','tools/process_teacher_upload_request_fast.py','tools/process_ib_lesson_release.py','tools/upload_private_bank_package_verified_fast.py','tools/upload_private_bank_package_verified_free_tier.py','tools/test_private_bank_source_archive_chunking.py','tools/validate_upload_manager.py']:
 result=subprocess.run([sys.executable,'-m','py_compile',str(ROOT/path)],capture_output=True,text=True)
 if result.returncode:errors.append(f'Python syntax failure {path}: {result.stderr}')
test=subprocess.run([sys.executable,str(ROOT/'tools/test_private_bank_source_archive_chunking.py')],capture_output=True,text=True,cwd=ROOT/'tools')
if test.returncode:errors.append(f'Source archive chunking regression failure: {test.stderr or test.stdout}')
for path in ['question-bank/official/admin/js/upload-manager.js','question-bank/official/admin/js/private-bank-center.js','question-bank/js/private-bank-practice.js','data/ib-math-ai-unit-1-update.js','lessons/ib-math-ai/unit-1/assets/unit-1-bootstrap.js']:
 result=subprocess.run(['node','--check',str(ROOT/path)],capture_output=True,text=True)
 if result.returncode:errors.append(f'JavaScript syntax failure {path}: {result.stderr}')
print('ECHS Teacher Upload Manager validation');print(f'Errors: {len(errors)}')
for error in errors:print('  ERROR:',error)
if errors:sys.exit(1)
print('Status: PASS')
