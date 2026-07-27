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
html=read('question-bank/official/admin/upload-manager.html');js=read('question-bank/official/admin/js/upload-manager.js');css=read('question-bank/official/admin/css/upload-manager.css');api=read('supabase/functions/upload-manager-api/index.ts');migration=read('supabase/migrations/202607272201_teacher_upload_manager.sql');workflow=read('.github/workflows/process-teacher-uploads.yml');processor=read('tools/process_teacher_upload_request.py');deploy=read('.github/workflows/deploy-institution-backend.yml')
require(html,['Private Bank Manager','Course Release Manager','zipFile','upload-manager.js','data-require-account="teacher admin"','institutionBody'],'Upload manager page')
require(js,['crypto.subtle.digest','signed_url','XMLHttpRequest','/complete','requireAuth(["teacher","admin"])','escapeHTML'],'Upload manager client')
require(css,['.dropZone','.progressBar','.requestItem','@media'],'Upload manager styles')
require(api,['createSignedUploadUrl','teacher-upload-staging','api_session_lookup','Teacher or administrator sign-in is required','status: "queued"'],'Upload manager API')
require(migration,['teacher_upload_requests','teacher-upload-staging','file_size_bytes <= 157286400',"'private-bank','course-release'"],'Upload manager migration')
require(workflow,['schedule:','*/5 * * * *','SUPABASE_SERVICE_ROLE_KEY','process_teacher_upload_request.py','gh pr create','github_pr_url'],'Upload processor workflow')
require(processor,['SHA-256 mismatch','safe_extract','upload_private_bank_package.py','ap-precalculus-unit-','pr_title'],'Upload processor')
require(deploy,['upload-manager-api','setup-api/health','supabase functions deploy'],'Backend deployment health contract')
if 'SUPABASE_SERVICE_ROLE_KEY' in html+js:errors.append('Browser code must not contain the service-role secret name')
if re.search(r"storage\.buckets.*public\s*=\s*true",migration,re.S):errors.append('Teacher upload bucket must not be public')
if 'public=false' not in migration.replace(' ',''):errors.append('Teacher upload bucket must be explicitly private')
for path in ['tools/process_teacher_upload_request.py','tools/validate_upload_manager.py']:
 result=subprocess.run([sys.executable,'-m','py_compile',str(ROOT/path)],capture_output=True,text=True)
 if result.returncode:errors.append(f'Python syntax failure {path}: {result.stderr}')
for path in ['question-bank/official/admin/js/upload-manager.js','tools/capture_upload_manager.mjs']:
 result=subprocess.run(['node','--check',str(ROOT/path)],capture_output=True,text=True)
 if result.returncode:errors.append(f'JavaScript syntax failure {path}: {result.stderr}')
print('ECHS Teacher Upload Manager validation');print(f'Errors: {len(errors)}')
for error in errors:print('  ERROR:',error)
if errors:sys.exit(1)
print('Status: PASS')
