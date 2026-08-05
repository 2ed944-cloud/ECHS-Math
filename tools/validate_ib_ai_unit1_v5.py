#!/usr/bin/env python3
from __future__ import annotations
import json,re,subprocess,sys
from pathlib import Path

ROOT=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve();errors=[]
def req(path):
    p=ROOT/path
    if not p.is_file():errors.append(f'Missing {path}');return ''
    return p.read_text(encoding='utf-8',errors='replace')

raw=req('lessons/ib-math-ai/unit-1/data/unit-1-v5-content-data.js');prefix='window.ECHS_UNIT1_V5_CONTENT='
if raw.startswith(prefix) and raw.rstrip().endswith(';'):
    try:packs=json.loads(raw[len(prefix):].rstrip()[:-1])
    except Exception as exc:errors.append(f'Content JSON parse: {exc}');packs={}
else:errors.append('Content data assignment wrapper is invalid');packs={}
expected=[f'1.{i}' for i in range(2,9)]
if sorted(packs)!=expected:errors.append(f'Expected retained base packs {expected}, got {sorted(packs)}')
for number,pack in packs.items():
    slides=pack.get('slides',[])
    if len(slides)!=36:errors.append(f'{number}: expected 36 retained base slides, got {len(slides)}')
    for index,item in enumerate(slides):
        if not item.get('title') or not item.get('html'):errors.append(f'{number}: empty slide {index+1}')
        if re.search(r'[\x00-\x08\x0b\x0c\x0e-\x1f]',json.dumps(item,ensure_ascii=False)):errors.append(f'{number}: control character slide {index+1}')

active_wrappers={
 '1.2':'IB_AI_SL_1.2_arithmetic_sequences_ECHS.html','1.3':'IB_AI_SL_1.3_geometric_sequences_ECHS.html',
 '1.4':'IB_AI_SL_1.4_financial_models_ECHS.html','1.5':'IB_AI_SL_1.5_logarithms_ECHS.html',
 '1.6':'IB_AI_SL_1.6_technology_equations_ECHS.html'
}
for number,name in active_wrappers.items():
    text=req(f'lessons/ib-math-ai/unit-1/lessons/{name}')
    for marker in ('ap-screen-lesson','class="topbar"','class="routebar"','data-route="practice"','../assets/js/engine.js','unit-1-v5-runtime.js'):
        if marker not in text:errors.append(f'{number} wrapper missing {marker}')

lesson12=req('lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.2_arithmetic_sequences_ECHS.html')
for marker in ('lesson-1.2-arithmetic-definitive-v6.js?v=6.0.0','lesson-1.2-arithmetic-v6-interactions.js?v=6.0.0','lesson-1.2-exam-focus-v6.js?v=6.0.0'):
    if marker not in lesson12:errors.append(f'Lesson 1.2 wrapper missing {marker}')
lesson13=req('lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.3_geometric_sequences_ECHS.html')
for marker in ('lesson-1.3-geometric-definitive-v6.js?v=6.0.0','lesson-1.3-geometric-v6-interactions.js?v=6.0.0','lesson-1.2-exam-focus-v6.js?v=6.0.0'):
    if marker not in lesson13:errors.append(f'Lesson 1.3 wrapper missing {marker}')
lesson14=req('lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.4_financial_models_ECHS.html')
for marker in (
 'lesson-1.4-financial-v6-foundations.js?v=6.0.0','lesson-1.4-financial-v6-cashflows.js?v=6.0.0',
 'lesson-1.4-financial-v6-practice.js?v=6.0.0','lesson-1.4-financial-v6-assessment.js?v=6.0.0',
 'lesson-1.4-financial-v6-polish.js?v=6.0.0','lesson-1.4-sl-core-v6-2-copy-a.js?v=6.2.0','lesson-1.4-sl-core-v6-2-copy-b.js?v=6.2.0','lesson-1.4-sl-core-v6-2-copy-c.js?v=6.2.0','lesson-1.4-sl-core-v6-2-apply.js?v=6.2.0',
 'lesson-1.4-financial-v6-interactions.js?v=6.0.0','lesson-1.4-scope-runtime-v6-2.js?v=6.2.0','id="financial-scope-toggle"'
):
    if marker not in lesson14:errors.append(f'Lesson 1.4 wrapper missing {marker}')
if 'lesson-1.4-teaching-blocks-v6-1.js' in lesson14:errors.append('Lesson 1.4 obsolete organization layer is still loaded')
lesson16=req('lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.6_technology_equations_ECHS.html')
for marker in ('lesson-1.8.js','lesson-1.8-v3.js','lesson-1.6-technology-renumber-v6.js','1.6 · Technology for Equations and Systems'):
    if marker not in lesson16:errors.append(f'Renumbered Lesson 1.6 wrapper missing {marker}')

redirects={
 'IB_AI_SL_1.6_approximation_error_ECHS.html':'IB_AI_SL_1.1_standard_form_ECHS.html',
 'IB_AI_SL_1.7_loans_annuities_ECHS.html':'IB_AI_SL_1.4_financial_models_ECHS.html',
 'IB_AI_SL_1.8_technology_equations_ECHS.html':'IB_AI_SL_1.6_technology_equations_ECHS.html'
}
for source,target in redirects.items():
    text=req(f'lessons/ib-math-ai/unit-1/lessons/{source}')
    if target not in text or 'location.replace' not in text:errors.append(f'Legacy redirect invalid: {source}')

catalog=json.loads(req('data/ib-math-ai-unit-1-delivery-catalog.json') or '{}')
expected_totals={'lessons':6,'learn_slides':328,'practice_questions':432,'timed_quiz_questions':80,'extended_tasks':24}
if catalog.get('schema_version')!='1.6.2':errors.append('Catalog schema mismatch')
if catalog.get('release')!='6.2.0':errors.append('Catalog release mismatch')
if catalog.get('totals')!=expected_totals:errors.append(f"Catalog totals mismatch: {catalog.get('totals')}")
lessons=catalog.get('lessons',[])
if [item.get('number') for item in lessons]!=['1.1','1.2','1.3','1.4','1.5','1.6']:errors.append('Catalog does not use the revised six-lesson sequence')
expected_meta={
 '1.1':('Number Foundations, Scientific Notation and Approximation','6.0.0',79,96,14,5),
 '1.2':('Arithmetic Sequences and Series','6.0.0',73,96,14,5),
 '1.3':('Geometric Sequences and Series','6.0.0',73,96,14,5),
 '1.4':('Financial Applications','6.2.0',31,40,10,3),
 '1.5':('Exponent Laws and Logarithms','5.3.0',36,52,14,3),
 '1.6':('Technology for Equations and Systems','5.3.3-renumbered',36,52,14,3)
}
for number,expected_item in expected_meta.items():
    item=next((entry for entry in lessons if entry.get('number')==number),{})
    actual=(item.get('title'),item.get('release'),item.get('learn_slides'),item.get('practice_questions'),item.get('timed_quiz_questions'),item.get('extended_tasks'))
    if actual!=expected_item:errors.append(f'Lesson {number} metadata mismatch: {actual}')
lesson14_meta=next((item for item in lessons if item.get('number')=='1.4'),{})
for key,value in {
 'syllabus_core':'SL 1.4 — financial applications: compound interest and annual depreciation',
 'preserved_unique_learn_slides':100,'extension_learn_slides':71,'extension_practice_questions':80,
 'extension_timed_quiz_questions':12,'extension_extended_tasks':6
}.items():
    if lesson14_meta.get(key)!=value:errors.append(f'Lesson 1.4 catalog {key} mismatch: {lesson14_meta.get(key)!r}')
if not str(lesson14_meta.get('extension_url','')).endswith('?scope=extension#learn'):errors.append('Lesson 1.4 extension URL missing')
if [block.get('code') for block in lesson14_meta.get('teaching_blocks',[])]!=['1.4A','1.4B','1.4C','1.4D','1.4E','1.4F','1.4G']:errors.append('Lesson 1.4 teaching block metadata mismatch')
if sum(item.get('learn_slides',0) for item in lessons)!=328:errors.append('Catalog core lesson slide sum mismatch')
if sum(item.get('practice_questions',0) for item in lessons)!=432:errors.append('Catalog core practice sum mismatch')
if catalog.get('extension_totals')!={'lesson':'1.4','learn_slides':71,'practice_questions':80,'timed_quiz_questions':12,'extended_tasks':6}:errors.append('Catalog extension totals mismatch')

required_files=(
 'lessons/ib-math-ai/unit-1/assets/css/unit1-teaching-v5.css',
 'lessons/ib-math-ai/unit-1/assets/css/lesson-1.4-financial-v6-core.css',
 'lessons/ib-math-ai/unit-1/assets/css/lesson-1.4-financial-v6-models.css',
 'lessons/ib-math-ai/unit-1/assets/css/lesson-1.4-financial-v6-interactive.css',
 'lessons/ib-math-ai/unit-1/data/lesson-1.4-financial-v6-foundations.js',
 'lessons/ib-math-ai/unit-1/data/lesson-1.4-financial-v6-cashflows.js',
 'lessons/ib-math-ai/unit-1/data/lesson-1.4-financial-v6-practice.js',
 'lessons/ib-math-ai/unit-1/data/lesson-1.4-financial-v6-assessment.js',
 'lessons/ib-math-ai/unit-1/data/lesson-1.4-financial-v6-polish.js',
 'lessons/ib-math-ai/unit-1/data/lesson-1.4-sl-core-v6-2-copy-a.js',
 'lessons/ib-math-ai/unit-1/data/lesson-1.4-sl-core-v6-2-copy-b.js',
 'lessons/ib-math-ai/unit-1/data/lesson-1.4-sl-core-v6-2-copy-c.js',
 'lessons/ib-math-ai/unit-1/data/lesson-1.4-sl-core-v6-2-apply.js',
 'lessons/ib-math-ai/unit-1/data/lesson-1.4-scope-runtime-v6-2.js',
 'lessons/ib-math-ai/unit-1/data/lesson-1.4-financial-v6-interactions.js',
 'lessons/ib-math-ai/unit-1/data/lesson-1.6-technology-renumber-v6.js',
 'lessons/ib-math-ai/unit-1/START_HERE.html','lessons/ib-math-ai/unit-1/TEACHER_GUIDE.html','data/ib-math-ai-unit-1-update.js'
)
for path in required_files:req(path)

checks={'1.2':['S_{27}=1971','S_{28}=2114'],'1.5':['11.672'],'1.8':['x=4.2','y=3.2','P=2,Q=3,R=4']}
for number,needles in checks.items():
    body=json.dumps(packs.get(number,{}),ensure_ascii=False)
    for needle in needles:
        if needle not in body:errors.append(f'{number}: missing retained audited value {needle}')

start=req('lessons/ib-math-ai/unit-1/START_HERE.html')
for marker in ('Six classroom-ready lessons','31 Core Learn','40 Core Practice','71 Optional Learn','Release 6.2.0','?scope=extension#learn'):
    if marker not in start:errors.append(f'Unit landing page missing {marker}')
guide=req('lessons/ib-math-ai/unit-1/TEACHER_GUIDE.html')
for marker in ('Revised six-lesson architecture','Lesson 1.4 core-first route','Core Day 1','Core Day 4','Optional Day 4','31 core screens','71 optional financial screens retained'):
    if marker not in guide:errors.append(f'Teacher guide missing {marker}')

for path in ('data/ib-math-ai-unit-1-update.js','lessons/ib-math-ai/unit-1/assets/js/engine.js','lessons/ib-math-ai/unit-1/data/lesson-1.4-sl-core-v6-2-copy-a.js','lessons/ib-math-ai/unit-1/data/lesson-1.4-sl-core-v6-2-copy-b.js','lessons/ib-math-ai/unit-1/data/lesson-1.4-sl-core-v6-2-copy-c.js','lessons/ib-math-ai/unit-1/data/lesson-1.4-sl-core-v6-2-apply.js','lessons/ib-math-ai/unit-1/data/lesson-1.4-scope-runtime-v6-2.js','lessons/ib-math-ai/unit-1/data/lesson-1.4-financial-v6-interactions.js'):
    result=subprocess.run(['node','--check',str(ROOT/path)],capture_output=True,text=True)
    if result.returncode:errors.append(f'JavaScript syntax failure {path}: {result.stderr}')

print('IB Mathematics AI Unit 1 consolidated structural validator')
print('Errors:',len(errors))
for error in errors:print(' ERROR:',error)
if errors:raise SystemExit(1)
print('Status: PASS')
