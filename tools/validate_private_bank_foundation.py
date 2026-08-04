#!/usr/bin/env python3
"""Validate the empty private-bank baseline and exact future upload boundary."""
from __future__ import annotations
import json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];errors=[]
def read(rel):
 p=ROOT/rel
 if not p.is_file():errors.append(f'Missing required file: {rel}');return''
 return p.read_text(encoding='utf-8',errors='replace')
def load(rel):
 try:return json.loads(read(rel))
 except Exception as exc:errors.append(f'Invalid JSON {rel}: {exc}');return{}
def need(text,markers,label):
 for marker in markers:
  if marker not in text:errors.append(f'{label} missing marker: {marker}')

registry=load('question-bank/private-sources/data/private-bank-registry.json')
if registry.get('totals')!={'banks':0,'questions':0,'pools':0,'media_files':0}:errors.append('Registry must be empty after the Calculus-only reset')
banks=registry.get('banks') or []
if banks:errors.append('Removed private bank records must not remain in the registry')

for rel,course,count in [('data/knowledge-graph/ap-precalculus-v1.json','ap-precalculus',50),('data/knowledge-graph/ib-math-ai-v1.json','ib-math-ai',26)]:
 graph=load(rel);skills=graph.get('skills') or []
 if graph.get('course')!=course or len(skills)!=count:errors.append(f'{rel} graph count/course mismatch')
 ids=[row.get('id') for row in skills]
 if len(ids)!=len(set(ids)):errors.append(f'{rel} contains duplicate skill IDs')

catalog=load('data/ib-math-ai-lesson-catalog.json');units=catalog.get('units') or []
lessons=[row for unit in units for row in unit.get('lessons') or []]
if len(lessons)!=26 or 'u0-readiness' not in {row.get('lesson_key') for row in lessons}:errors.append('IB catalogue must contain 26 aggregate skills including readiness')
unit1=next((unit for unit in units if unit.get('unit')==1),{})
unit1_lessons=unit1.get('lessons') or []
if len(unit1_lessons)!=5 or unit1.get('status')!='ready' or unit1.get('student_visible') is not True:errors.append('IB Unit 1 aggregate catalogue must be released')
if any(row.get('student_visible') is not True or row.get('status')!='ready' for row in unit1_lessons):errors.append('Released IB Unit 1 skills must be visible and ready')
unit5=next((unit for unit in units if unit.get('unit')==5),{})
unit5_lessons=unit5.get('lessons') or []
if len(unit5_lessons)!=4 or unit5.get('status')!='ready' or unit5.get('student_visible') is not True:errors.append('Released IB Unit 5 aggregate catalogue must remain visible and ready')
if any(row.get('student_visible') is not True or row.get('status')!='ready' for row in unit5_lessons):errors.append('Released IB Unit 5 skills must remain visible and ready')
unreleased=[row for unit in units if unit.get('unit') in {0,2,3,4} for row in unit.get('lessons') or []]
if any(row.get('student_visible') is not False or row.get('status')!='content-build-required' for row in unreleased):errors.append('Unbuilt IB readiness and Units 2–4 must remain hidden')
if not unit1.get('delivery_catalog') or not unit1.get('unit_home'):errors.append('IB Unit 1 delivery links are missing')
if not unit5.get('delivery_catalog') or not unit5.get('unit_home'):errors.append('IB Unit 5 delivery links are missing')

migration=read('supabase/migrations/202607272101_private_bank_foundation.sql')
need(migration,['publisher_key_direct','private.enforce_private_bank_question_release','private-question-banks','public = false'],'Private bank migration')
inventory_migration=read('supabase/migrations/202607301500_private_bank_practice_inventory.sql')
need(inventory_migration,['private_bank_practice_inventory','course_key, bank_code','cardinality(q.course_keys) = 1'],'Practice inventory migration')
api=read('supabase/functions/private-bank-api/index.ts')
need(api,['/student-questions','publisher_key_direct','Source-key practice; not independently audited','createSignedUrl(path, 300)'],'Private bank API')
practice=read('question-bank/js/mapped-private-bank-practice.js');assets=read('question-bank/js/private-bank-assets.js')
need(practice,['practice-bank-api','ECHSBank.loadBundle','skill_key','exactRoute','scope.bank'],'Practice integration')
need(assets,['data-private-src','media-url','MutationObserver'],'Private media integration')

for relative in ('question-bank/private-sources/tools/import_blackboard_qti_secure.py','tools/upload_private_bank_package.py','tools/validate_private_bank_packages.py'):
 if read(relative):
  result=subprocess.run([sys.executable,'-m','py_compile',str(ROOT/relative)],capture_output=True,text=True)
  if result.returncode:errors.append(f'Python syntax error for {relative}: {result.stderr.strip()}')
for relative in ('question-bank/js/private-bank-assets.js','question-bank/js/mapped-private-bank-practice.js'):
 result=subprocess.run(['node','--check',str(ROOT/relative)],capture_output=True,text=True)
 if result.returncode:errors.append(f'JavaScript syntax error for {relative}: {result.stderr.strip()}')
print('ECHS direct-linked private banks and IB lessons');print(f'Errors: {len(errors)}')
for error in errors:print('  ERROR:',error)
if errors:sys.exit(1)
print('Status: PASS')
