#!/usr/bin/env python3
"""Deterministic validation for IB Mathematics AI SL Lesson 2.1 v4."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path

ROOT=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
U2=Path('lessons/ib-math-ai/unit-2')
FILES=[
 U2/'data/lesson-2.1-v4-build.js',
 U2/'data/lesson-2.1-v4-content-a.js',
 U2/'data/lesson-2.1-v4-content-b.js',
 U2/'data/lesson-2.1-v4-content-c.js',
 U2/'data/lesson-2.1-v4-finalize.js',
 U2/'data/lesson-2.1-v4-practice.js',
 U2/'data/lesson-2.1-v4-polish.js',
 U2/'data/lesson-2.1-v4-assessment.js',
 U2/'data/lesson-2.1-v4-assessment-polish.js',
]
HTML=U2/'lessons/IB_AI_SL_2.1_functions_domain_range_representations_ECHS.html'
CSS=[U2/'assets/css/lesson-2.1-v4-core.css',U2/'assets/css/lesson-2.1-v4-responsive.css']
GRAPHICS=U2/'data/lesson-2.1-v4-graphics.js'
INTERACTIONS=U2/'data/lesson-2.1-v4-interactions.js'
START=U2/'START_HERE.html'
PORTAL=Path('data/ib-math-ai-unit-2-update.js')
errors=[]

def read(path:Path)->str:
    target=ROOT/path
    if not target.is_file():
        errors.append(f'Missing file: {path}')
        return ''
    return target.read_text(encoding='utf-8',errors='replace')

def check_js(path:Path)->None:
    result=subprocess.run(['node','--check',str(ROOT/path)],cwd=ROOT,text=True,capture_output=True)
    if result.returncode:errors.append(f'JavaScript syntax failure in {path}: {result.stderr.strip()}')

def norm(value:str)->str:
    value=re.sub(r'<[^>]+>',' ',str(value or '')).lower()
    return re.sub(r'\s+',' ',value).strip()

def balanced(value:str,label:str)->None:
    text=str(value or '')
    for left,right in ((r'\(',r'\)'),(r'\[',r'\]')):
        if text.count(left)!=text.count(right):
            errors.append(f'Unbalanced math delimiters in {label}')

html=read(HTML)
css='\n'.join(read(path) for path in CSS)
graphics=read(GRAPHICS)
interactions=read(INTERACTIONS)
start=read(START)
portal=read(PORTAL)
for path in [*FILES,GRAPHICS,INTERACTIONS]:check_js(path)

assets=[
 'lesson-2.1-v4-build.js?v=4.0.0',
 'lesson-2.1-v4-content-a.js?v=4.0.0',
 'lesson-2.1-v4-content-b.js?v=4.0.0',
 'lesson-2.1-v4-content-c.js?v=4.0.0',
 'lesson-2.1-v4-finalize.js?v=4.0.0',
 'lesson-2.1-v4-practice.js?v=4.0.0',
 'lesson-2.1-v4-polish.js?v=4.0.0',
 'lesson-2.1-v4-assessment.js?v=4.0.0',
 'lesson-2.1-v4-assessment-polish.js?v=4.0.1',
 '../assets/js/katex-global.js','../assets/js/engine.js?v=2.0.0',
 'lesson-2.1-v4-graphics.js?v=4.0.0','lesson-2.1-v4-interactions.js?v=4.0.0'
]
for marker in assets+['lesson-2.1-v4-core.css?v=4.0.0','lesson-2.1-v4-responsive.css?v=4.0.0','unit2-lesson-2-1-v4']:
    if marker not in html:errors.append(f'Wrapper missing marker: {marker}')
if all(marker in html for marker in assets):
    positions=[html.index(marker) for marker in assets]
    if positions!=sorted(positions):errors.append('Lesson asset order is incorrect')

program=f"""
const fs=require('fs'),vm=require('vm');
const files={json.dumps([str(path) for path in FILES])};
const sandbox={{window:{{}},console}};sandbox.window.window=sandbox.window;vm.createContext(sandbox);
for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{{filename:file}});
const d=sandbox.window.LESSON_DATA;if(!d)throw new Error('LESSON_DATA missing');
process.stdout.write(JSON.stringify(d));
"""
result=subprocess.run(['node','-e',program],cwd=ROOT,text=True,capture_output=True)
if result.returncode:
    errors.append(f'Lesson assembly failed: {result.stderr.strip()}')
    data={}
else:
    try:data=json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        errors.append(f'Invalid assembled JSON: {exc}')
        data={}

if data:
    if data.get('version')!='4.0.0' or data.get('schemaVersion')!='4.0.0':errors.append('Version/schema must be 4.0.0')
    lesson=data.get('lesson',{})
    if lesson.get('number')!='2.1' or lesson.get('title')!='Functions, Domain, Range, and Representations':errors.append('Lesson identity is incorrect')
    slides=data.get('slides',[]);practice=data.get('practice',[]);quiz=data.get('quiz',[]);exam=data.get('exam',[])
    if (len(slides),len(practice),len(quiz),len(exam))!=(72,80,16,6):errors.append(f'Content counts are {(len(slides),len(practice),len(quiz),len(exam))}, expected (72,80,16,6)')

    titles=[slide.get('title') for slide in slides]
    if any(not title for title in titles):errors.append('A Learn screen has no title')
    if len(titles)!=len(set(titles)):errors.append(f'Duplicate Learn titles: {[title for title,count in Counter(titles).items() if count>1]}')
    for index,slide in enumerate(slides,1):
        if not slide.get('html') or not slide.get('kind') or not slide.get('section'):errors.append(f'Incomplete Learn screen {index}')
        balanced(slide.get('html'),f'Learn screen {index}')

    student_surface='\n'.join(str(slide.get(key,'')) for slide in slides for key in ('title','section','eyebrow','html')).lower()
    for forbidden in ('production','release candidate','source alignment','quality assurance','qa status','build version'):
        if forbidden in student_surface:errors.append(f'Student-facing development language remains: {forbidden}')

    levels=Counter(item.get('level') for item in practice)
    expected=Counter({'Foundation':20,'Application':20,'Reasoning':20,'Challenge':20})
    if levels!=expected:errors.append(f'Practice level balance is {dict(levels)}')

    all_items=practice+quiz
    ids=[item.get('id') for item in all_items]+[task.get('id') for task in exam]
    if any(not value for value in ids) or len(ids)!=len(set(ids)):errors.append('Assessment IDs are missing or duplicated')
    for item in all_items:
        if not item.get('prompt') or not item.get('answer') or not item.get('solution'):errors.append(f'Incomplete question: {item.get("id")}')
        if not isinstance(item.get('marks'),int) or item.get('marks',0)<=0:errors.append(f'Invalid marks: {item.get("id")}')
        balanced(item.get('prompt'),f'{item.get("id")} prompt')
        balanced(item.get('answer'),f'{item.get("id")} answer')
        balanced(item.get('solution'),f'{item.get("id")} solution')
        choices=item.get('choices')
        if choices is not None:
            correct=item.get('correct')
            if not isinstance(choices,list) or len(choices)<2 or not isinstance(correct,int) or not 0<=correct<len(choices):errors.append(f'Invalid MCQ contract: {item.get("id")}')

    practice_prompts={norm(item.get('prompt')) for item in practice}
    quiz_prompts={norm(item.get('prompt')) for item in quiz}
    if len(practice_prompts)!=len(practice):errors.append('Practice Studio contains duplicate prompts')
    if len(quiz_prompts)!=len(quiz):errors.append('Quiz contains duplicate prompts')
    overlap=practice_prompts & quiz_prompts
    if overlap:errors.append(f'Quiz repeats Practice prompts: {sorted(overlap)}')

    for task in exam:
        parts=task.get('parts') or []
        if not parts:errors.append(f'Task has no parts: {task.get("id")}')
        if sum(part.get('marks',0) for part in parts)!=task.get('total_marks'):errors.append(f'Task mark total mismatch: {task.get("id")}')
        labels=[part.get('label') for part in parts]
        if len(labels)!=len(set(labels)):errors.append(f'Duplicate task part labels: {task.get("id")}')
        for part in parts:
            if not part.get('prompt') or not part.get('answer') or not part.get('markscheme'):errors.append(f'Incomplete task part: {task.get("id")} {part.get("label")}')
            balanced(part.get('prompt'),f'{task.get("id")} prompt')
            balanced(part.get('answer'),f'{task.get("id")} answer')

    by_id={item.get('id'):item for item in practice}
    if by_id.get('IBAI-2.1-V4-P063',{}).get('answer')!=r'\([2,7)\)':errors.append('Absolute-value range correction is missing')
    if by_id.get('IBAI-2.1-V4-P039',{}).get('marks')!=2:errors.append('TI-84 Practice mark value is not numeric 2')
    if data.get('audit',{}).get('quizPracticePromptIndependence') is not True:errors.append('Quiz-independence audit flag is missing')

for marker in ('fn4-cover','fn4-worked','fn4-card-grid','fn4-ti84','fn4-inverse-lab','@media(max-width:760px)'):
    if marker not in css:errors.append(f'Lesson CSS missing marker: {marker}')
for marker in ('cover-parking','mapping-types','vertical-test','complete-feature-graph','ti84-zero','inverse-reflection','MutationObserver'):
    if marker not in graphics:errors.append(f'Graphics runtime missing marker: {marker}')
for marker in ('data-cover-next','data-inverse-x','route-jump','MutationObserver'):
    if marker not in interactions:errors.append(f'Interaction runtime missing marker: {marker}')
for marker in ('408','400','104','72 Learn screens','80 Practice Studio questions','16-question quiz','6 IB tasks'):
    if marker not in start+portal:errors.append(f'Unit 2 metadata missing marker: {marker}')

print('IB Mathematics AI SL Lesson 2.1 v4 validation')
print(f'Root: {ROOT}')
print(f'Errors: {len(errors)}')
for error in errors:print(f'  ERROR: {error}')
if errors:raise SystemExit(1)
print('Status: PASS')
