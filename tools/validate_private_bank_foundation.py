#!/usr/bin/env python3
"""Validate the public-safe private-bank integration foundation."""
from __future__ import annotations
import json, re, subprocess, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
errors=[]

def fail(msg): errors.append(msg)
def read(rel):
    p=ROOT/rel
    if not p.is_file(): fail(f'Missing required file: {rel}'); return ''
    return p.read_text(encoding='utf-8',errors='replace')
def load(rel):
    text=read(rel)
    if not text:return {}
    try:return json.loads(text)
    except Exception as e:fail(f'Invalid JSON {rel}: {e}');return {}
def require(text,markers,label):
    for m in markers:
        if m not in text: fail(f'{label} missing marker: {m}')
def forbid(text,markers,label):
    for m in markers:
        if m in text: fail(f'{label} contains forbidden marker: {m}')

registry=load('question-bank/private-sources/data/private-bank-registry.json')
if registry.get('totals')!={'banks':4,'questions':15671,'pools':1484,'media_files':38593}:
    fail(f"Registry totals mismatch: {registry.get('totals')}")
if registry.get('source_content_in_registry') is not False: fail('Registry must not contain source question content')
banks=registry.get('banks') or []
if len(banks)!=4: fail('Registry must contain four banks')
seen_codes=set();seen_aliases=set()
for row in banks:
    code=row.get('bank_code');seen_codes.add(code)
    if not re.fullmatch(r'ECHS-BB-[A-Z0-9]+',str(code)): fail(f'Invalid bank code {code}')
    if not re.fullmatch(r'[0-9a-f]{64}',str(row.get('package_sha256',''))): fail(f'{code} invalid SHA-256')
    if row.get('student_visible') is not False or row.get('trust_default')!='teacher_review_required': fail(f'{code} does not fail closed')
    if row.get('source_content_committed_to_public_repo') is not False: fail(f'{code} public source-content flag is unsafe')
    aliases=row.get('display_aliases') or {}
    for course in ('ap-precalculus','ib-math-ai'):
        alias=aliases.get(course)
        if not alias: fail(f'{code} missing {course} alias')
        if alias in seen_aliases: fail(f'Duplicate visible bank alias {alias}')
        seen_aliases.add(alias)
if sum(int(r.get('questions') or 0) for r in banks)!=15671: fail('Bank question counts do not reconcile')
if sum(int(r.get('pools') or 0) for r in banks)!=1484: fail('Bank pool counts do not reconcile')

for rel,course,min_skills in [
    ('data/knowledge-graph/ap-precalculus-v1.json','ap-precalculus',49),
    ('data/knowledge-graph/ib-math-ai-v1.json','ib-math-ai',24),
]:
    graph=load(rel);skills=graph.get('skills') or []
    if graph.get('course')!=course: fail(f'{rel} course mismatch')
    if len(skills)<min_skills: fail(f'{rel} has only {len(skills)} skills')
    ids=[s.get('id') for s in skills]
    if len(ids)!=len(set(ids)): fail(f'{rel} has duplicate skill IDs')
    known=set(ids)
    defaults=graph.get('skill_defaults') or {}
    if not defaults.get('representations'): fail(f'{rel} missing default representations')
    if not defaults.get('misconception_policy'): fail(f'{rel} missing misconception policy')
    default_rules=defaults.get('evidence_rules') or {}
    for key in ('minimum_independent','minimum_days','requires_transfer','requires_retention','minimum_confidence'):
        if key not in default_rules: fail(f'{rel} default evidence rules missing {key}')
    for skill in skills:
        if not skill.get('lesson_ids'): fail(f"{skill.get('id')} missing lesson IDs")
        for p in skill.get('prerequisites') or []:
            if p not in known: fail(f"{skill.get('id')} unknown prerequisite {p}")

ap=load('question-bank/private-sources/data/ap-precalculus-crosswalk.json')
ib=load('question-bank/private-sources/data/ib-math-ai-crosswalk.json')
if ap.get('mapping_verified') is not False or ib.get('mapping_verified') is not False: fail('Automatic crosswalks must remain unverified')
if (ap.get('policy') or {}).get('unmatched_destination',{}).get('unit')!=0: fail('AP unmatched content must map to readiness Unit 0')
if (ib.get('policy') or {}).get('unmatched_destination',{}).get('unit')!=0: fail('IB unmatched content must map to readiness Unit 0')
if len(ap.get('topic_catalog') or [])<49: fail('AP topic catalog is incomplete')
if len(ib.get('unit_catalog') or [])!=5: fail('IB unit catalog must contain five units')

for name in ('at9','ca9','ca9b','acs10'):
    cfg=load(f'question-bank/private-sources/config/{name}.json')
    if cfg.get('student_visible') is not False or cfg.get('trust_default')!='teacher_review_required': fail(f'{name} config is not fail-closed')
    if cfg.get('publisher_metadata_visibility')!='internal-only': fail(f'{name} publisher metadata visibility must be internal-only')

importer=read('question-bank/private-sources/tools/import_blackboard_qti_secure.py')
require(importer,[
    "'teacher_review_required'", "'student_visible':False", "'student_accessible':False", "'student_ready':False",
    "'restricted-instructor-resource'", 'private-bank://', 'retain_duplicate', "qid=f'{code}-P{pool_index:04d}-Q{item_index:04d}'", 'accepted_answers'
],'Secure importer')
forbid(importer,["'student_visible':True","'student_accessible':True","'student_ready':True"],'Secure importer')
if importer:
    result=subprocess.run([sys.executable,'-m','py_compile',str(ROOT/'question-bank/private-sources/tools/import_blackboard_qti_secure.py')],capture_output=True,text=True)
    if result.returncode: fail(f'Importer syntax error: {result.stderr.strip()}')

page=read('question-bank/official/admin/private-bank-center.html')
controller=read('question-bank/official/admin/js/private-bank-center.js')
require(page,['Private Bank Center','15,671','private-bank-center.js'],'Private Bank Center')
require(controller,['requireAuth(["teacher","admin"])','private-bank-registry.json','publisher names stay internal'],'Private Bank controller')

print('ECHS private Blackboard bank foundation')
print(f'Errors: {len(errors)}')
for e in errors: print(f'  ERROR: {e}')
if errors: sys.exit(1)
print('Status: PASS')
