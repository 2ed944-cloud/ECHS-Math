#!/usr/bin/env python3
"""Deterministic source, scope, assessment and wrapper checks for IB AI SL Lesson 2.1 v3."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path

ROOT=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
U2=Path('lessons/ib-math-ai/unit-2')
HTML=U2/'lessons/IB_AI_SL_2.1_functions_domain_range_representations_ECHS.html'
BASE=U2/'data/lesson-2.1.js'
FOUNDATIONS=U2/'data/lesson-2.1-definitive-v3-foundations.js'
PRACTICE=U2/'data/lesson-2.1-definitive-v3-practice.js'
ASSESSMENT=U2/'data/lesson-2.1-definitive-v3-assessment.js'
INTERACTIONS=U2/'data/lesson-2.1-definitive-v3-interactions.js'
SCOPE_RUNTIME=U2/'data/lesson-2.1-definitive-v3-scope-runtime.js'
CSS=U2/'assets/css/lesson-2.1-definitive-v3.css'
START=U2/'START_HERE.html'
PORTAL=Path('data/ib-math-ai-unit-2-update.js')
errors:list[str]=[]

def read(path:Path)->str:
    target=ROOT/path
    if not target.is_file():
        errors.append(f'Missing file: {path}')
        return ''
    return target.read_text(encoding='utf-8',errors='replace')

def run(args:list[str],label:str)->subprocess.CompletedProcess[str]|None:
    try:result=subprocess.run(args,cwd=ROOT,text=True,capture_output=True,timeout=90)
    except (OSError,subprocess.TimeoutExpired) as exc:
        errors.append(f'{label}: {exc}')
        return None
    if result.returncode:errors.append(f'{label}: {result.stderr.strip() or result.stdout.strip()}')
    return result

def assemble(search:str,files:list[Path])->dict:
    program=f"""
const fs=require('fs'),vm=require('vm');
const files={json.dumps([str(path) for path in files])};
const sandbox={{window:{{location:{{search:{json.dumps(search)}}}}},URLSearchParams,console}};
sandbox.window.window=sandbox.window;
vm.createContext(sandbox);
for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{{filename:file}});
const d=sandbox.window.LESSON_DATA;
if(!d)throw new Error('LESSON_DATA missing');
process.stdout.write(JSON.stringify({{
 schemaVersion:d.schemaVersion,version:d.version,lesson:d.lesson,counts:d.counts,audit:d.audit,review:d.review,
 slides:d.slides.map(s=>({{title:s.title,section:s.section,html:s.html,kind:s.kind,scope:s.scope,classification:s.classification,teachingBlock:s.teachingBlock,blockBoundary:s.blockBoundary}})),
 practice:d.practice.map(q=>({{id:q.id,level:q.level,prompt:q.prompt,answer:q.answer,solution:q.solution,marks:q.marks,scope:q.scope,choices:q.choices,correct:q.correct,check:q.check}})),
 quiz:d.quiz.map(q=>({{id:q.id,level:q.level,prompt:q.prompt,answer:q.answer,solution:q.solution,marks:q.marks,scope:q.scope,choices:q.choices,correct:q.correct,check:q.check}})),
 exam:d.exam.map(t=>({{id:t.id,title:t.title,total_marks:t.total_marks,scope:t.scope,parts:t.parts}})),
 collections:d.scopeCollections?{{slides:d.scopeCollections.slides.map(s=>({{title:s.title,html:s.html,kind:s.kind,scope:s.scope,teachingBlock:s.teachingBlock,blockBoundary:s.blockBoundary}})),practice:d.scopeCollections.practice.map(q=>({{id:q.id,level:q.level,prompt:q.prompt,answer:q.answer,solution:q.solution,marks:q.marks,scope:q.scope,choices:q.choices,correct:q.correct,check:q.check}})),quiz:d.scopeCollections.quiz.map(q=>({{id:q.id,prompt:q.prompt,answer:q.answer,solution:q.solution,marks:q.marks,scope:q.scope,choices:q.choices,correct:q.correct,check:q.check}})),exam:d.scopeCollections.exam.map(t=>({{id:t.id,title:t.title,total_marks:t.total_marks,scope:t.scope,parts:t.parts}}))}}:null
}}));
"""
    result=run(['node','-e',program],f'Assemble {search or "core"}')
    if not result or result.returncode:return {}
    try:return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        errors.append(f'Assembly JSON failure: {exc}')
        return {}

def norm(value:str)->str:
    value=re.sub(r'<[^>]+>',' ',str(value or ''))
    value=value.lower().replace('−','-').replace('–','-').replace('—','-')
    return re.sub(r'\s+',' ',value).strip()

def balanced_math(value:str,label:str)->None:
    text=str(value or '')
    for left,right in ((r'\(',r'\)'),(r'\[',r'\]')):
        if text.count(left)!=text.count(right):errors.append(f'Unbalanced math delimiters in {label}: {left}={text.count(left)}, {right}={text.count(right)}')

html=read(HTML);foundation_source=read(FOUNDATIONS);practice_source=read(PRACTICE);assessment_source=read(ASSESSMENT);interaction_source=read(INTERACTIONS);runtime_source=read(SCOPE_RUNTIME);css=read(CSS);start=read(START);portal=read(PORTAL)
for path in (FOUNDATIONS,PRACTICE,ASSESSMENT,INTERACTIONS,SCOPE_RUNTIME):run(['node','--check',str(ROOT/path)],f'JavaScript syntax {path}')

assets=[
 'lesson-2.1.js?v=2.0.0','lesson-2.1-definitive-v3-foundations.js?v=3.0.0','lesson-2.1-definitive-v3-practice.js?v=3.0.0','lesson-2.1-definitive-v3-assessment.js?v=3.0.0','../assets/js/katex-global.js','../assets/js/engine.js?v=2.0.0','lesson-2.1-definitive-v3-interactions.js?v=3.0.0','lesson-2.1-definitive-v3-scope-runtime.js?v=3.0.0'
]
for marker in assets+['lesson-2.1-definitive-v3.css?v=3.0.0','unit2-lesson-2-1','ib-ai-2-1-v3']:
    if marker not in html:errors.append(f'Wrapper missing marker: {marker}')
if all(marker in html for marker in assets):
    positions=[html.index(marker) for marker in assets]
    if positions!=sorted(positions):errors.append('Lesson 2.1 asset loading order is incorrect')

legacy=assemble('',[BASE])
core=assemble('',[BASE,FOUNDATIONS,PRACTICE,ASSESSMENT])
all_content=assemble('?scope=all',[BASE,FOUNDATIONS,PRACTICE,ASSESSMENT])
if legacy and core and all_content:
    if core.get('version')!='3.0.0' or core.get('schemaVersion')!='3.0.0':errors.append('Definitive release version/schema must be 3.0.0')
    if core.get('lesson',{}).get('number')!='2.1':errors.append('Assembled lesson number is not 2.1')
    if core.get('lesson',{}).get('active_scope')!='core' or all_content.get('lesson',{}).get('active_scope')!='all':errors.append('Core/all scope selection is incorrect')
    if core.get('lesson',{}).get('default_scope')!='core':errors.append('Default scope is not core')

    collections=core.get('collections') or {}
    full_counts=(len(collections.get('slides',[])),len(collections.get('practice',[])),len(collections.get('quiz',[])),len(collections.get('exam',[])))
    if full_counts!=(79,80,14,4):errors.append(f'All-content collection counts are {full_counts}, expected (79,80,14,4)')
    core_counts=(len(core.get('slides',[])),len(core.get('practice',[])),len(core.get('quiz',[])),len(core.get('exam',[])))
    if core_counts!=(79,72,12,3):errors.append(f'Core assembled counts are {core_counts}, expected stored slides plus 72/12/3')
    if (len(all_content.get('slides',[])),len(all_content.get('practice',[])),len(all_content.get('quiz',[])),len(all_content.get('exam',[])))!=(79,80,14,4):errors.append('All-content query does not restore every assessment item')
    scope_counts=core.get('lesson',{}).get('scope_counts',{})
    expected_scope={'learn':{'core':67,'extension':12,'total':79},'practice':{'core':72,'extension':8,'total':80},'quiz':{'core':12,'extension':2,'total':14},'exam':{'core':3,'extension':1,'total':4}}
    if scope_counts!=expected_scope:errors.append(f'Scope metadata mismatch: {scope_counts}')

    all_slides=collections.get('slides',[])
    titles=[item.get('title') for item in all_slides]
    if any(not title for title in titles):errors.append('A Learn screen has no title')
    if len(titles)!=len(set(titles)):errors.append(f'Duplicate Learn screen titles: {[t for t,c in Counter(titles).items() if c>1]}')
    if any(not item.get('html') or not item.get('kind') for item in all_slides):errors.append('A Learn screen lacks HTML or kind')
    for index,item in enumerate(all_slides,1):
        if item.get('scope') not in {'core','extension'}:errors.append(f'Invalid scope on Learn screen {index}')
        if item.get('teachingBlock') not in {'2.1A','2.1B','2.1C','2.1D','2.1E'}:errors.append(f'Invalid teaching block on Learn screen {index}')
        balanced_math(item.get('html'),f'Learn screen {index} {item.get("title")}')
    if sum(item.get('scope')=='core' for item in all_slides)!=67 or sum(item.get('scope')=='extension' for item in all_slides)!=12:errors.append('Learn core/extension partition is not 67/12')
    if sum(bool(item.get('blockBoundary')) for item in all_slides)!=5:errors.append('Expected exactly five teaching-block boundary screens')
    blocks=core.get('lesson',{}).get('teaching_blocks',[])
    if [item.get('code') for item in blocks]!=['2.1A','2.1B','2.1C','2.1D','2.1E']:errors.append('Teaching block sequence is incorrect')
    if any(item.get('estimated_classroom_time')!='60–75 minutes' for item in blocks):errors.append('Teaching block pacing metadata is incomplete')
    official=[item.get('code') for item in core.get('lesson',{}).get('official_scope',{}).get('core_sections',[])]
    if official!=['SL 2.2','SL 2.3','SL 2.4']:errors.append(f'Official scope codes are incorrect: {official}')

    legacy_practice={item.get('id') for item in legacy.get('practice',[])};legacy_quiz={item.get('id') for item in legacy.get('quiz',[])};legacy_exam={item.get('id') for item in legacy.get('exam',[])}
    all_practice=collections.get('practice',[]);all_quiz=collections.get('quiz',[]);all_exam=collections.get('exam',[])
    if not legacy_practice.issubset({item.get('id') for item in all_practice}):errors.append('One or more legacy Practice IDs were lost')
    if not legacy_quiz.issubset({item.get('id') for item in all_quiz}):errors.append('One or more legacy Quiz IDs were lost')
    if not legacy_exam.issubset({item.get('id') for item in all_exam}):errors.append('One or more legacy IB Task IDs were lost')
    all_ids=[item.get('id') for item in all_practice+all_quiz+all_exam]
    if any(not value for value in all_ids) or len(all_ids)!=len(set(all_ids)):errors.append('Assessment IDs are missing or duplicated')
    levels=Counter(item.get('level') for item in all_practice)
    if levels!=Counter({'Foundation':20,'Application':20,'Reasoning':20,'Challenge':20}):errors.append(f'All-content Practice level balance is {dict(levels)}')
    if Counter(item.get('scope') for item in all_practice)!=Counter({'core':72,'extension':8}):errors.append('Practice core/extension balance is incorrect')
    if Counter(item.get('scope') for item in all_quiz)!=Counter({'core':12,'extension':2}):errors.append('Quiz core/extension balance is incorrect')
    if Counter(item.get('scope') for item in all_exam)!=Counter({'core':3,'extension':1}):errors.append('IB Task core/extension balance is incorrect')
    if {item.get('id') for item in core.get('exam',[])}!={'U2-2.1-T1','U2-2.1-T3','U2-2.1-V3-T4'}:errors.append(f'Unexpected core task IDs: {[item.get("id") for item in core.get("exam",[])]}')

    for item in all_practice+all_quiz:
        if not item.get('prompt') or not item.get('answer') or not item.get('solution'):errors.append(f'Incomplete question record: {item.get("id")}')
        if not isinstance(item.get('marks'),int) or item.get('marks',0)<=0:errors.append(f'Invalid marks: {item.get("id")}')
        choices=item.get('choices')
        if choices is not None:
            correct=item.get('correct')
            if not isinstance(choices,list) or len(choices)<2 or not isinstance(correct,int) or not 0<=correct<len(choices):errors.append(f'Invalid MCQ contract: {item.get("id")}')
        balanced_math(item.get('prompt'),f'question {item.get("id")} prompt');balanced_math(item.get('answer'),f'question {item.get("id")} answer');balanced_math(item.get('solution'),f'question {item.get("id")} solution')
    practice_prompts={norm(item.get('prompt')) for item in all_practice};quiz_prompts={norm(item.get('prompt')) for item in all_quiz}
    if len(practice_prompts)!=len(all_practice):errors.append('Practice Studio contains duplicate prompts')
    if len(quiz_prompts)!=len(all_quiz):errors.append('Quiz contains duplicate prompts')
    if practice_prompts & quiz_prompts:errors.append('Quiz repeats one or more Practice prompts')
    for task in all_exam:
        parts=task.get('parts') or []
        if not parts or sum(part.get('marks',0) for part in parts)!=task.get('total_marks'):errors.append(f'IB Task mark total mismatch: {task.get("id")}')
        for part in parts:
            if not part.get('prompt') or not part.get('answer') or not part.get('markscheme'):errors.append(f'Incomplete task part: {task.get("id")} {part.get("label")}')
            balanced_math(part.get('prompt'),f'task {task.get("id")} prompt');balanced_math(part.get('answer'),f'task {task.get("id")} answer')
    solar=next((item for item in all_exam if item.get('id')=='U2-2.1-V3-T4'),{})
    if solar.get('total_marks')!=12 or solar.get('scope')!='core' or 'Solar-output' not in solar.get('title',''):errors.append('New solar-output core task is incomplete')

for marker in ('fn21-cover','fn21-mapping','fn21-vlt','fn21-feature-graph','fn21-inverse-svg','@media(max-width:760px)','data-lesson-access-layout'):
    if marker not in css:errors.append(f'Lesson 2.1 CSS missing marker: {marker}')
for marker in ('data-fn21-match','data-fn21-trace','data-fn21-inverse','MutationObserver'):
    if marker not in interaction_source:errors.append(f'Interaction layer missing marker: {marker}')
for marker in ('fn21-scope-toggle','visibleIndices','stopImmediatePropagation','IB SL Core','scope_counts','core-only weighted learning evidence'):
    if marker not in runtime_source:errors.append(f'Scope runtime missing marker: {marker}')
for marker in ('SL 2.2','SL 2.3','SL 2.4','five classroom teaching blocks','scopeCounts','67','79','72','80','12','14','3','4'):
    if marker not in portal:errors.append(f'Unit 2 portal metadata missing marker: {marker}')
for marker in ('399','380','93','67 core · 79 all screens','72 core · 80 all questions','12 core · 14 all quiz','3 core · 4 all IB tasks'):
    if marker not in start:errors.append(f'Unit 2 START_HERE missing marker: {marker}')
for marker in ('SL 2.2','SL 2.3','SL 2.4','teaching_blocks','coreFirst','learnScreenCount'):
    if marker not in foundation_source:errors.append(f'Foundation layer missing metadata marker: {marker}')
for marker in ('IBAI-2.1-V3-P061','IBAI-2.1-V3-P080','practiceLevels'):
    if marker not in practice_source:errors.append(f'Practice layer missing marker: {marker}')
for marker in ('IBAI-2.1-V3-Q13','U2-2.1-V3-T4','scopeCollections','defaultCoreAssessment'):
    if marker not in assessment_source:errors.append(f'Assessment layer missing marker: {marker}')

print('IB Mathematics AI SL Lesson 2.1 definitive v3 validation')
print(f'Root: {ROOT}')
if core:print('Scope counts:',json.dumps(core.get('lesson',{}).get('scope_counts',{}),sort_keys=True))
print(f'Errors: {len(errors)}')
for error in errors:print(f'  ERROR: {error}')
if errors:raise SystemExit(1)
print('Status: PASS')
