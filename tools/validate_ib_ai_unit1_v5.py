#!/usr/bin/env python3
from __future__ import annotations
import json,re,sys
from pathlib import Path

ROOT=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
errors=[]

def req(path):
    p=ROOT/path
    if not p.is_file(): errors.append(f'Missing {path}'); return ''
    return p.read_text(encoding='utf-8',errors='replace')

raw=req('lessons/ib-math-ai/unit-1/data/unit-1-v5-content-data.js')
prefix='window.ECHS_UNIT1_V5_CONTENT='
if raw.startswith(prefix) and raw.rstrip().endswith(';'):
    try: packs=json.loads(raw[len(prefix):].rstrip()[:-1])
    except Exception as exc: errors.append(f'Content JSON parse: {exc}'); packs={}
else:
    errors.append('Content data assignment wrapper is invalid'); packs={}
expected=[f'1.{i}' for i in range(2,9)]
if sorted(packs)!=expected: errors.append(f'Expected lesson packs {expected}, got {sorted(packs)}')
for number,pack in packs.items():
    slides=pack.get('slides',[])
    if len(slides)!=36: errors.append(f'{number}: expected 36 base slides, got {len(slides)}')
    for i,s in enumerate(slides):
        if not s.get('title') or not s.get('html'): errors.append(f'{number}: empty slide {i+1}')
        if re.search(r'[\x00-\x08\x0b\x0c\x0e-\x1f]',json.dumps(s,ensure_ascii=False)): errors.append(f'{number}: control character slide {i+1}')
    if sum('Misconception clinic'==s.get('title') for s in slides)!=5: errors.append(f'{number}: expected 5 misconception clinics in base pack')
    if sum('Student turn'==s.get('title') for s in slides)!=5: errors.append(f'{number}: expected 5 student turns in base pack')
    if not any('lesson-lab' in s.get('html','') for s in slides): errors.append(f'{number}: missing technology lab in base pack')

wrapper_names={
'1.2':'IB_AI_SL_1.2_arithmetic_sequences_ECHS.html','1.3':'IB_AI_SL_1.3_geometric_sequences_ECHS.html','1.4':'IB_AI_SL_1.4_financial_models_ECHS.html','1.5':'IB_AI_SL_1.5_logarithms_ECHS.html','1.6':'IB_AI_SL_1.6_approximation_error_ECHS.html','1.7':'IB_AI_SL_1.7_loans_annuities_ECHS.html','1.8':'IB_AI_SL_1.8_technology_equations_ECHS.html'}
for n,name in wrapper_names.items():
    text=req(f'lessons/ib-math-ai/unit-1/lessons/{name}')
    for marker in ('ap-screen-lesson','class="topbar"','class="routebar"','data-route="practice"','../assets/js/engine.js','unit-1-v5-content-data.js','unit-1-v5-apply.js','unit-1-v5-runtime.js'):
        if marker not in text: errors.append(f'{n} wrapper missing {marker}')
    if 'unit-1-v3-enhancements.js' in text: errors.append(f'{n} still loads old slide enhancement layer')

lesson12_wrapper=req('lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.2_arithmetic_sequences_ECHS.html')
for marker in (
    'lesson-1.2-arithmetic-definitive-v6.js?v=6.0.0',
    'lesson-1.2-arithmetic-v6-core.css?v=6.0.0',
    'lesson-1.2-arithmetic-v6-concepts.css?v=6.0.0',
    'lesson-1.2-arithmetic-v6-series.css?v=6.0.0',
    'lesson-1.2-arithmetic-v6-interactive.css?v=6.0.0',
    'lesson-1.2-arithmetic-v6-polish.js?v=6.0.0',
    'lesson-1.2-arithmetic-v6-interactions.js?v=6.0.0',
    'lesson-1.2-exam-focus-v6.js?v=6.0.0',
):
    if marker not in lesson12_wrapper: errors.append(f'Lesson 1.2 wrapper missing {marker}')

catalog=json.loads(req('data/ib-math-ai-unit-1-delivery-catalog.json') or '{}')
if catalog.get('release')!='5.3.2': errors.append('Catalog release mismatch')
if catalog.get('totals')!={'lessons':8,'learn_slides':368,'practice_questions':504,'timed_quiz_questions':112,'extended_tasks':28}: errors.append('Catalog totals mismatch')
lesson11=next((lesson for lesson in catalog.get('lessons',[]) if lesson.get('number')=='1.1'),{})
if {key:lesson11.get(key) for key in ('release','learn_slides','practice_questions','timed_quiz_questions','extended_tasks')}!={'release':'6.0.0','learn_slides':79,'practice_questions':96,'timed_quiz_questions':14,'extended_tasks':5}: errors.append('Lesson 1.1 v6 metadata mismatch')
lesson12=next((lesson for lesson in catalog.get('lessons',[]) if lesson.get('number')=='1.2'),{})
if {key:lesson12.get(key) for key in ('release','learn_slides','practice_questions','timed_quiz_questions','extended_tasks')}!={'release':'6.0.0','learn_slides':73,'practice_questions':96,'timed_quiz_questions':14,'extended_tasks':5}: errors.append('Lesson 1.2 v6 metadata mismatch')

for rel in (
'lessons/ib-math-ai/unit-1/assets/css/unit1-teaching-v5.css',
'lessons/ib-math-ai/unit-1/assets/css/lesson-1.2-arithmetic-v6-core.css',
'lessons/ib-math-ai/unit-1/assets/css/lesson-1.2-arithmetic-v6-concepts.css',
'lessons/ib-math-ai/unit-1/assets/css/lesson-1.2-arithmetic-v6-series.css',
'lessons/ib-math-ai/unit-1/assets/css/lesson-1.2-arithmetic-v6-interactive.css',
'lessons/ib-math-ai/unit-1/data/unit-1-v5-apply.js',
'lessons/ib-math-ai/unit-1/data/unit-1-v5-runtime.js',
'lessons/ib-math-ai/unit-1/data/lesson-1.2-arithmetic-definitive-v6.js',
'lessons/ib-math-ai/unit-1/data/lesson-1.2-arithmetic-v6-polish.js',
'lessons/ib-math-ai/unit-1/data/lesson-1.2-arithmetic-v6-interactions.js',
'lessons/ib-math-ai/unit-1/data/lesson-1.2-exam-focus-v6.js',
'lessons/ib-math-ai/unit-1/START_HERE.html',
'lessons/ib-math-ai/unit-1/TEACHER_GUIDE.html',
'data/ib-math-ai-unit-1-update.js'):
    req(rel)

checks={'1.2':['S_{27}=1971','S_{28}=2114'],'1.4':['22538.81','14095.04','16161.42','22779.99','31999.73','11.09'],'1.5':['11.672'],'1.6':['21.010','21.282'],'1.7':['61452.78','1726.40','6185.41','1376.82','1253.59','234214.17'],'1.8':['x=4.2','y=3.2','P=2,Q=3,R=4']}
for n,needles in checks.items():
    body=json.dumps(packs.get(n,{}),ensure_ascii=False)
    for needle in needles:
        if needle not in body: errors.append(f'{n}: missing audited base value {needle}')

print('IB Mathematics AI Unit 1 v5/v6 structural validator')
print('Errors:',len(errors))
for e in errors: print(' ERROR:',e)
if errors: raise SystemExit(1)
print('Status: PASS')
