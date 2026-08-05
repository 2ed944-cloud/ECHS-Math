#!/usr/bin/env python3
"""IB AI SL Lesson 1.4 core-scope and extension-preservation checks."""
from __future__ import annotations

import json
import subprocess
import sys
from collections import Counter
from pathlib import Path

ROOT=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
U1=Path('lessons/ib-math-ai/unit-1')
HTML=U1/'lessons/IB_AI_SL_1.4_financial_models_ECHS.html'
TEACHING=U1/'data/lesson-1.4-teaching-blocks-v6-1.js'
SCOPE=U1/'data/lesson-1.4-ib-sl-scope-v6-2.js'
RUNTIME=U1/'data/lesson-1.4-ib-sl-scope-runtime-v6-2.js'
BASE=[
 U1/'data/lesson-1.4.js',U1/'data/lesson-1.4-v3.js',
 U1/'data/unit-1-v5-content-data.js',U1/'data/unit-1-v5-apply.js',
 U1/'data/lesson-1.4-financial-v6-foundations.js',
 U1/'data/lesson-1.4-financial-v6-cashflows.js',
 U1/'data/lesson-1.4-financial-v6-practice.js',
 U1/'data/lesson-1.4-financial-v6-assessment.js',
 U1/'data/lesson-1.4-financial-v6-polish.js',TEACHING,
]
errors=[]

def read(path:Path)->str:
    target=ROOT/path
    if not target.is_file():
        errors.append(f'Missing file: {path}')
        return ''
    return target.read_text(encoding='utf-8',errors='replace')

def assemble(search:str,include_scope:bool=True)->dict:
    files=[*BASE,*([SCOPE] if include_scope else [])]
    program=f"""
const fs=require('fs'),vm=require('vm');
const files={json.dumps([str(path) for path in files])};
const sandbox={{window:{{location:{{search:{json.dumps(search)}}}}},console}};
sandbox.window.window=sandbox.window;vm.createContext(sandbox);
for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{{filename:file}});
const d=sandbox.window.LESSON_DATA;if(!d)throw new Error('LESSON_DATA missing');
process.stdout.write(JSON.stringify({{
 version:d.version,lesson:d.lesson,audit:d.v6Audit,
 slides:d.slides.map(s=>({{title:s.title,html:s.html,kind:s.kind,scope:s.scope,section:s.section,
   originalSection:s.originalSection,teachingBlock:s.teachingBlock,blockBoundary:s.blockBoundary,
   classification:s.classification,learningFocus:s.learningFocus}})),
 practice:d.practice.map(q=>({{id:q.id,level:q.level,scope:q.scope,prompt:q.prompt}})),
 quiz:d.quiz.map(q=>({{id:q.id,scope:q.scope,prompt:q.prompt}})),
 exam:d.exam.map(t=>({{id:t.id,scope:t.scope,title:t.title,context:t.context}})),
 collections:d.scopeCollections?{{
   practice:d.scopeCollections.practice.map(q=>({{id:q.id,scope:q.scope,prompt:q.prompt}})),
   quiz:d.scopeCollections.quiz.map(q=>({{id:q.id,scope:q.scope,prompt:q.prompt}})),
   exam:d.scopeCollections.exam.map(t=>({{id:t.id,scope:t.scope,title:t.title}})),
   slides:d.scopeCollections.slides.map(s=>({{title:s.title,scope:s.scope,html:s.html,kind:s.kind}}))
 }}:null
}}));
"""
    result=subprocess.run(['node','-e',program],cwd=ROOT,text=True,capture_output=True)
    if result.returncode:
        errors.append(f'Assembly failed for search={search!r}: {result.stderr.strip()}')
        return {}
    try:return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        errors.append(f'Invalid assembled JSON for search={search!r}: {exc}')
        return {}

html=read(HTML);scope_source=read(SCOPE);runtime_source=read(RUNTIME)
for path in (TEACHING,SCOPE,RUNTIME):
    result=subprocess.run(['node','--check',str(ROOT/path)],cwd=ROOT,text=True,capture_output=True)
    if result.returncode:errors.append(f'JavaScript syntax failure in {path}: {result.stderr.strip()}')

for marker in (
 'lesson-1.4-teaching-blocks-v6-1.js?v=6.1.0',
 'lesson-1.4-ib-sl-scope-v6-2.js?v=6.2.0',
 'lesson-1.4-ib-sl-scope-runtime-v6-2.js?v=6.2.0'
):
    if marker not in html:errors.append(f'Wrapper missing scope asset: {marker}')
if all(marker in html for marker in ('lesson-1.4-financial-v6-polish.js','lesson-1.4-teaching-blocks-v6-1.js','lesson-1.4-ib-sl-scope-v6-2.js','../assets/js/engine.js','lesson-1.4-ib-sl-scope-runtime-v6-2.js')):
    if not (html.index('lesson-1.4-financial-v6-polish.js')<html.index('lesson-1.4-teaching-blocks-v6-1.js')<html.index('lesson-1.4-ib-sl-scope-v6-2.js')<html.index('../assets/js/engine.js')<html.index('lesson-1.4-ib-sl-scope-runtime-v6-2.js')):
        errors.append('Scope metadata must load before engine and scope runtime after engine')

baseline=assemble('',False)
core=assemble('',True)
all_content=assemble('?scope=all',True)
if baseline and core and all_content:
    if baseline.get('version')!='6.0.0' or core.get('version')!='6.0.0' or all_content.get('version')!='6.0.0':
        errors.append('The mathematical/content release must remain 6.0.0')

    baseline_slides=baseline.get('slides',[])
    core_slides=core.get('slides',[])
    all_slides=all_content.get('slides',[])
    if not (len(baseline_slides)==len(core_slides)==len(all_slides)==100):
        errors.append(f'All 100 Learn screens must remain stored: {len(baseline_slides)}, {len(core_slides)}, {len(all_slides)}')
    if [s.get('title') for s in baseline_slides]!=[s.get('title') for s in core_slides]:
        errors.append('Scope layer changed Learn screen titles or order')
    for index,(before,after) in enumerate(zip(baseline_slides,core_slides)):
        for field in ('title','html','kind'):
            if before.get(field)!=after.get(field):errors.append(f'Scope layer changed {field} on screen {index+1}')

    collections=core.get('collections') or {}
    full_counts=(len(collections.get('slides',[])),len(collections.get('practice',[])),len(collections.get('quiz',[])),len(collections.get('exam',[])))
    if full_counts!=(100,120,16,6):errors.append(f'Full content collections changed: {full_counts}')
    if (len(all_content.get('practice',[])),len(all_content.get('quiz',[])),len(all_content.get('exam',[])))!=(120,16,6):
        errors.append('All-content mode does not restore the full assessment collections')

    counts=core.get('lesson',{}).get('scope_counts',{})
    core_counts=(counts.get('learn',{}).get('core'),len(core.get('practice',[])),len(core.get('quiz',[])),len(core.get('exam',[])))
    if not (40<=core_counts[0]<=75):errors.append(f'Core Learn route is not cognitively reduced enough: {core_counts[0]} screens')
    if not (30<=core_counts[1]<120):errors.append(f'Core Practice count is implausible: {core_counts[1]}')
    if not (5<=core_counts[2]<16):errors.append(f'Core Quiz count is implausible: {core_counts[2]}')
    if core_counts[3]!=2:errors.append(f'Expected two core IB tasks, found {core_counts[3]}')
    for group in ('practice','quiz','exam'):
        if any(item.get('scope')!='core' for item in core.get(group,[])):
            errors.append(f'Extension content leaked into default {group}')
    if {item.get('id') for item in core.get('exam',[])}!={'FINV6-1.4-E03','FINV6-1.4-E06'}:
        errors.append(f"Unexpected core IB tasks: {[item.get('id') for item in core.get('exam',[])]}")

    levels=Counter(item.get('level') for item in core.get('practice',[]))
    for level in ('Foundation','Application','Reasoning','Challenge'):
        if levels[level]<3:errors.append(f'Core Practice has insufficient {level} coverage: {levels[level]}')

    official=core.get('lesson',{}).get('official_scope',{})
    codes=[item.get('code') for item in official.get('core_sections',[])]
    if codes!=['SL 1.4','SL 1.7']:errors.append(f'Official core section metadata is incorrect: {codes}')
    if core.get('lesson',{}).get('default_scope')!='core' or core.get('lesson',{}).get('active_scope')!='core':
        errors.append('Default scope is not IB SL Core')
    if all_content.get('lesson',{}).get('active_scope')!='all':errors.append('All-content query mode is not active')

    by_title={slide.get('title'):slide for slide in core_slides}
    required_core=(
      'Compound interest is geometric change','Nominal annual rate is not the periodic rate',
      'Reducing-balance depreciation is compound decay','TVM variables encode a cash-flow equation',
      'Amortization is a balance recurrence','Loan term trades payment size against total interest',
      'One financial structure, many applications','Independent exit ticket'
    )
    for title in required_core:
        if by_title.get(title,{}).get('scope')!='core':errors.append(f'Required IB SL core screen is not core: {title}')
    required_extension=(
      'Effective annual rate compares different compounding conventions',
      'Derive the future value of an ordinary annuity','Future value of an annuity due',
      'Present value of an ordinary annuity','Retrospective balance looks back from the original loan',
      'A recommendation needs sensitivity, not one perfect-looking answer',
      'Extension bridge · growing annuities'
    )
    for title in required_extension:
        if by_title.get(title,{}).get('scope')!='extension':errors.append(f'Reference extension is not separated: {title}')
    for title,code in (
      ('Loan term trades payment size against total interest','1.4F'),
      ('One financial structure, many applications','1.4G')
    ):
        item=by_title.get(title,{})
        if item.get('teachingBlock')!=code or item.get('blockBoundary') is not True:
            errors.append(f'Visible core boundary is incorrect for {code}')

    audit=core.get('audit') or {}
    for flag in ('defaultCoreScope','allOriginalSlidesRetained','allOriginalPracticeRetained','allOriginalQuizRetained','allOriginalTasksRetained','advancedTopicsRemainAccessible','extensionExcludedFromDefaultMastery','coreAssessmentExcludesReferenceExtensions'):
        if audit.get(flag) is not True:errors.append(f'Core-scope audit flag is not true: {flag}')

for marker in (
 "searchParams.set('scope','all')",'financial-scope-toggle','visibleIndices','stopImmediatePropagation','IB SL Core',
 'syncPracticeToolbar','scope_counts','core-only weighted learning evidence','data-financial-scope-summary'
):
    if marker not in runtime_source:errors.append(f'Scope runtime missing marker: {marker}')
for marker in ('SL 1.4','SL 1.7','scopeCollections','extensionQuestionPattern','official_scope','defaultCoreScope'):
    if marker not in scope_source:errors.append(f'Scope metadata missing marker: {marker}')

print('IB AI SL Lesson 1.4 official core-scope validation')
print(f'Root: {ROOT}')
if core:
    c=core.get('lesson',{}).get('scope_counts',{})
    print('Core counts:',json.dumps(c,ensure_ascii=False,sort_keys=True))
print(f'Errors: {len(errors)}')
for error in errors:print(f'  ERROR: {error}')
if errors:raise SystemExit(1)
print('Status: PASS')
