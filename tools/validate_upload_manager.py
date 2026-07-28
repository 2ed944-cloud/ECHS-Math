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
html=read('question-bank/official/admin/upload-manager.html');js=read('question-bank/official/admin/js/upload-manager.js');css=read('question-bank/official/admin/css/upload-manager.css');api=read('supabase/functions/upload-manager-api/index.ts');private_api=read('supabase/functions/private-bank-api/index.ts');practice=read('question-bank/js/private-bank-practice.js');center_html=read('question-bank/official/admin/private-bank-center.html');center_js=read('question-bank/official/admin/js/private-bank-center.js');migration=read('supabase/migrations/202607272201_teacher_upload_manager.sql');workflow=read('.github/workflows/process-teacher-uploads.yml');processor=read('tools/process_teacher_upload_request.py');fast_processor=read('tools/process_teacher_upload_request_fast.py');uploader=read('tools/upload_private_bank_package.py');fast_uploader=read('tools/upload_private_bank_package_fast.py');verified_uploader=read('tools/upload_private_bank_package_verified_fast.py');package_validator=read('tools/validate_private_bank_packages.py');deploy=read('.github/workflows/deploy-institution-backend.yml');supabase_config=read('supabase/config.toml')
require(html,['Private Bank Manager','Course Release Manager','zipFile','upload-manager.js','data-require-account="teacher admin"','institutionBody','bankCourseKey','Auto-detect from package manifest','value="ap-calculus"','clearTerminalRequests'],'Upload manager page')
require(js,['crypto.subtle.digest','signed_url','XMLHttpRequest','FormData','cacheControl','x-upsert','xhr.timeout','/complete','requireAuth(["teacher","admin"])','escapeHTML','bankCourseKey','target_courses','/requests/terminal','method:"DELETE"','Refreshing signed URL and retrying upload'],'Upload manager client')
require(css,['.dropZone','.progressBar','.requestItem','.historyDelete','.historyClear','@media'],'Upload manager styles')
require(api,['createSignedUploadUrl','teacher-upload-staging','api_session_lookup','Teacher or administrator sign-in is required','status: "queued"','"ap-calculus"','TERMINAL_STATUSES','ACTIVE_STATUSES','Fresh signed upload URL created','Retry upload URL created','/requests/terminal','req.method === "DELETE"'],'Upload manager API')
require(private_api,['SUPPORTED_COURSES','"ap-calculus"','/student-questions','manifest','course_mappings','unit'],'Private bank API')
require(practice,['"ap-calculus"','CALC-BANK-01','dynamicLabels','unit=','private-bank-api'],'Private practice integration')
require(center_html,['AP Calculus','calcBanks','Open Upload Manager'],'Private bank center page')
require(center_js,['manifest?.target_courses','ap-calculus:U0','livePackages','visibleName'],'Private bank center client')
require(migration,['teacher_upload_requests','teacher-upload-staging','file_size_bytes <= 157286400',"'private-bank','course-release'"],'Upload manager migration')
require(workflow,['schedule:','*/5 * * * *','SUPABASE_SERVICE_ROLE_KEY','process_teacher_upload_request_fast.py','timeout-minutes: 120','PYTHONUNBUFFERED','gh pr create','github_pr_url'],'Upload processor workflow')
require(processor,['SHA-256 mismatch','safe_extract','ap-precalculus-unit-','pr_title','--expected-course'],'Base upload processor')
require(fast_processor,['subprocess.Popen','stdout=subprocess.PIPE','status.eq.processing','upload_private_bank_package_verified_fast.py','--expected-course'],'Fast upload processor')
for text,label in [(uploader,'Private bank uploader'),(fast_uploader,'Fast bank uploader')]:
 require(text,['SUPPORTED_COURSES','ap-calculus','target_courses','--expected-course','direct_mappings'],'%s'%label)
require(fast_uploader,['return=minimal','Questions imported:','Media archives uploaded:','IMPORT_RESULT='],'Fast bank uploader')
require(verified_uploader,['student_ready_verified','independent-solution-audit','question_trust_records','bank-manifest.json','IMPORT_RESULT='],'Verified bank uploader')
require(package_validator,['ALLOWED_COURSES','ap-calculus','target_courses','Question mappings'],'Private bank package validator')
require(deploy,['upload-manager-api','setup-api/health','supabase functions deploy'],'Backend deployment health contract')
require(supabase_config,['[functions.upload-manager-api]','verify_jwt = false'],'Supabase upload-manager function config')
if 'SUPABASE_SERVICE_ROLE_KEY' in html+js:errors.append('Browser code must not contain the service-role secret name')
if re.search(r"storage\.buckets.*public\s*=\s*true",migration,re.S):errors.append('Teacher upload bucket must not be public')
if 'public=false' not in migration.replace(' ',''):errors.append('Teacher upload bucket must be explicitly private')
for path in ['tools/test_ap_calculus_private_bank_support.py','tools/process_teacher_upload_request.py','tools/process_teacher_upload_request_fast.py','tools/upload_private_bank_package.py','tools/upload_private_bank_package_fast.py','tools/upload_private_bank_package_verified_fast.py','tools/validate_private_bank_packages.py','tools/validate_upload_manager.py','tools/validate_private_bank_import_performance.py']:
 result=subprocess.run([sys.executable,'-m','py_compile',str(ROOT/path)],capture_output=True,text=True)
 if result.returncode:errors.append(f'Python syntax failure {path}: {result.stderr}')
test=subprocess.run([sys.executable,str(ROOT/'tools/test_ap_calculus_private_bank_support.py')],capture_output=True,text=True)
if test.returncode:errors.append(f'AP Calculus private-bank regression failure: {test.stderr or test.stdout}')
for path in ['question-bank/official/admin/js/upload-manager.js','question-bank/official/admin/js/private-bank-center.js','question-bank/js/private-bank-practice.js','tools/capture_upload_manager.mjs']:
 result=subprocess.run(['node','--check',str(ROOT/path)],capture_output=True,text=True)
 if result.returncode:errors.append(f'JavaScript syntax failure {path}: {result.stderr}')
print('ECHS Teacher Upload Manager validation');print(f'Errors: {len(errors)}')
for error in errors:print('  ERROR:',error)
if errors:sys.exit(1)
print('Status: PASS')
