#!/usr/bin/env python3
"""Definitive structural, mathematical and scope checks for IB AI SL Lesson 1.3 v6."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path

ROOT=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
U1=Path('lessons/ib-math-ai/unit-1')
HTML=U1/'lessons/IB_AI_SL_1.3_geometric_sequences_ECHS.html'
CSS_FILES=[
 U1/'assets/css/lesson-1.3-geometric-v6-core.css',
 U1/'assets/css/lesson-1.3-geometric-v6-concepts.css',
 U1/'assets/css/lesson-1.3-geometric-v6-interactive.css',
]
OVERLAY=U1/'data/lesson-1.3-geometric-definitive-v6.js'
POLISH=U1/'data/lesson-1.3-geometric-v6-polish.js'
INTERACTIONS=U1/'data/lesson-1.3-geometric-v6-interactions.js'
PAGER=U1/'data/lesson-1.2-exam-focus-v6.js'
DATA_FILES=[
 U1/'data/lesson-1.3.js',
 U1/'data/lesson-1.3-v3.js',
 U1/'data/unit-1-v5-content-data.js',
 U1/'data/unit-1-v5-apply.js',
 OVERLAY,
 POLISH,
]
errors=[]

def read(path:Path)->str:
    full=ROOT/path
    if not full.is_file():
        errors.append(f'Missing file: {path}')
        return ''
    return full.read_text(encoding='utf-8',errors='replace')

html=read(HTML)
css='\n'.join(read(path) for path in CSS_FILES)
overlay=read(OVERLAY)
polish=read(POLISH)
interactions=read(INTERACTIONS)
pager=read(PAGER)

for path in (*DATA_FILES,INTERACTIONS,PAGER):
    result=subprocess.run(['node','--check',str(ROOT/path)],text=True,capture_output=True)
    if result.returncode:
        errors.append(f'JavaScript syntax failure in {path}: {result.stderr.strip()}')

for marker in (
 'lesson-1.3-geometric-v6-core.css?v=6.0.0',
 'lesson-1.3-geometric-v6-concepts.css?v=6.0.0',
 'lesson-1.3-geometric-v6-interactive.css?v=6.0.0',
 'lesson-1.3-geometric-definitive-v6.js?v=6.0.0',
 'lesson-1.3-geometric-v6-polish.js?v=6.0.0',
 'lesson-1.3-geometric-v6-interactions.js?v=6.0.0',
 'lesson-1.2-exam-focus-v6.js?v=6.0.0',
):
    if marker not in html: errors.append(f'HTML missing cache-safe asset: {marker}')
if not (
 html.index('lesson-1.3-geometric-definitive-v6.js?v=6.0.0')
 < html.index('lesson-1.3-geometric-v6-polish.js?v=6.0.0')
 < html.index('../assets/js/engine.js')
 < html.index('lesson-1.3-geometric-v6-interactions.js?v=6.0.0')
): errors.append('Lesson data/polish must load before engine and interactions after engine')
if html.index('lesson-1.3-geometric-v6-interactive.css?v=6.0.0')>html.index('katex.css'):
    errors.append('Lesson CSS must load before canonical KaTeX CSS')

for forbidden in (r'\.katex[^\{]*span',r'\.katex-display[^\{]*span',r'display\s*:\s*revert'):
    if re.search(forbidden,css): errors.append(f'KaTeX-destructive CSS pattern found: {forbidden}')

program=f"""
const fs=require('fs'),vm=require('vm');
const files={json.dumps([str(path) for path in DATA_FILES])};
const sandbox={{window:{{}},console}};sandbox.window.window=sandbox.window;vm.createContext(sandbox);
for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{{filename:file}});
const d=sandbox.window.LESSON_DATA;if(!d)throw new Error('LESSON_DATA missing');
process.stdout.write(JSON.stringify({{
 version:d.version,title:d.lesson.title,syllabus:d.lesson.syllabus_focus,
 slides:d.slides.map(s=>({{title:s.title,section:s.section,kind:s.kind,html:s.html}})),
 practice:d.practice.map(q=>({{id:q.id,level:q.level,prompt:q.prompt,answer:q.answer,solution:q.solution,check:q.check}})),
 quiz:d.quiz.map(q=>({{id:q.id,prompt:q.prompt,answer:q.answer,solution:q.solution,check:q.check}})),
 exam:d.exam.map(t=>({{id:t.id,total:t.total_marks,context:t.context,parts:t.parts.map(p=>({{label:p.label,marks:p.marks,prompt:p.prompt,answer:p.answer,markscheme:p.markscheme}}))}})),
 audit:d.v6Audit
}}));
"""
result=subprocess.run(['node','-e',program],cwd=ROOT,text=True,capture_output=True)
if result.returncode:
    errors.append(f'Final lesson assembly failed: {result.stderr.strip()}');data={}
else:
    try:data=json.loads(result.stdout)
    except json.JSONDecodeError as exc:errors.append(f'Final lesson JSON invalid: {exc}');data={}

if data.get('version')!='6.0.0':errors.append(f"Unexpected version: {data.get('version')!r}")
if data.get('title')!='Geometric Sequences and Series':errors.append(f"Unexpected title: {data.get('title')!r}")
if 'finite geometric series' not in str(data.get('syllabus','')).lower():errors.append('Syllabus focus does not identify finite geometric-series core')
slides=data.get('slides',[]);practice=data.get('practice',[]);quiz=data.get('quiz',[]);exam=data.get('exam',[])
for label,items,count in (('slides',slides,73),('practice',practice,96),('quiz',quiz,14),('exam',exam,5)):
    if len(items)!=count:errors.append(f'Expected {count} {label}, found {len(items)}')

for label,items in (('slide titles',slides),('practice IDs',practice),('quiz IDs',quiz),('exam IDs',exam)):
    values=[item.get('title') if label=='slide titles' else item.get('id') for item in items]
    if len(values)!=len(set(values)):errors.append(f'Duplicate {label}: {[v for v,c in Counter(values).items() if c>1]}')
levels=Counter(item.get('level') for item in practice)
expected_levels=Counter({'Foundation':24,'Application':24,'Reasoning':24,'Challenge':24})
if levels!=expected_levels:errors.append(f'Practice distribution mismatch: {dict(levels)}')

for task in exam:
    labels=[part['label'] for part in task['parts']]
    if len(labels)!=len(set(labels)):errors.append(f"Duplicate part labels in {task['id']}")
    total=sum(part['marks'] for part in task['parts'])
    if total!=task['total']:errors.append(f"{task['id']} parts total {total}; declared {task['total']}")

required_titles=(
 'Sequence, ratio, series and partial sum','Constant ratio is the defining invariant',
 'The sign and magnitude of r control behaviour','Why the exponent is n−1',
 'Even and odd gaps control sign ambiguity','Growth thresholds are integer-stage problems',
 'Deriving the finite geometric-sum formula','Equivalent sum forms and the r=1 case',
 'Interactive geometric-sequence explorer','Generative Geometric Studio',
 'Integrated IB-style geometric model','Extension bridge · infinite geometric series'
)
titles=[slide['title'] for slide in slides]
for title in required_titles:
    if title not in titles:errors.append(f'Missing required screen: {title}')
if titles and titles[-1]!='Extension bridge · infinite geometric series':errors.append('Optional extension must remain the final clearly labelled screen')
if sum(slide.get('section')=='Extension' for slide in slides)!=1:errors.append('Expected exactly one extension screen')
joined='\n'.join(slide.get('html','') for slide in slides)
for marker in (r'u_n=u_1r^{n-1}',r'u_1\frac{1-r^n}{1-r}',r'\frac{u_q}{u_p}=r^{q-p}','data-gs-explorer','data-gs-generator','data-gs-sigma'):
    if marker not in joined:errors.append(f'Required lesson marker missing: {marker}')
if '<svg' in joined.lower():errors.append('Lesson contains inline SVG despite stable HTML/CSS graphics contract')

math_pattern=re.compile(r'\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]')
all_sources=[]
for slide_item in slides:all_sources.append((f"slide {slide_item.get('title')}",slide_item.get('html','')))
for group_name,items,fields in (
 ('practice',practice,('prompt','answer','solution')),
 ('quiz',quiz,('prompt','answer','solution')),
):
    for item in items:
        for field in fields:all_sources.append((f"{group_name} {item.get('id')} {field}",item.get(field,'') or ''))
for task in exam:
    all_sources.append((f"exam {task.get('id')} context",task.get('context','')))
    for part in task.get('parts',[]):
        for field in ('prompt','answer','markscheme'):all_sources.append((f"exam {task.get('id')} part {part.get('label')} {field}",part.get(field,'') or ''))
for label,source in all_sources:
    for segment in math_pattern.findall(source):
        if '<' in segment or '>' in segment:errors.append(f'Raw comparison character remains in math: {label}')

core_assessment='\n'.join(
 [str(item.get('prompt','')) for item in practice+quiz]
 +[str(task.get('context',''))+' '+ ' '.join(str(part.get('prompt','')) for part in task.get('parts',[])) for task in exam]
).lower()
if 'infinite geometric' in core_assessment or 'sum to infinity' in core_assessment:
    errors.append('Optional infinite-series extension leaked into core assessment prompts')

practice_prompts={re.sub(r'\s+',' ',item['prompt']).strip().lower() for item in practice}
for item in quiz:
    if re.sub(r'\s+',' ',item['prompt']).strip().lower() in practice_prompts:
        errors.append(f"Quiz prompt duplicates Practice Studio: {item['id']}")

for marker in ('data-gs-explorer','data-gs-generator','data-gs-sigma-preset','factories','behaviour(r)','renderInlineMath'):
    if marker not in interactions:errors.append(f'Interaction layer missing marker: {marker}')
for marker in ('exam-task-tabs','exam-part-tabs','exam-step-footer-nav','exam-task-index'):
    if marker not in pager:errors.append(f'Assessment pager missing marker: {marker}')

audit=data.get('audit') or {}
for flag in (
 'htmlCssGraphics','noInlineSvg','geometricExplorer','generativeStudio','sigmaNotation',
 'negativeAndFractionalRatios','separatedTermAmbiguity','finiteGeometricSeries','inverseProblems',
 'integerThresholdChecks','extensionNotAssessedInCore','independentArithmeticReaudit',
 'correctedWildlifeModelValues','correctedBounceDistance','correctedSymbolicParameterRoots',
 'correctedShiftedBlockSum','correctedPiecewiseGrowthValue','correctedSubsequenceQuizValue',
 'extensionExcludedFromCoreAssessment'
):
    if audit.get(flag) is not True:errors.append(f'Audit flag not true: {flag}')

by_practice={item['id']:item for item in practice};by_quiz={item['id']:item for item in quiz};by_exam={item['id']:item for item in exam}
spot_text={
 'GSV6-1.3-A22':'444.00','GSV6-1.3-A23':'4494.03','GSV6-1.3-C04':'sqrt{218}',
 'GSV6-1.3-C10':'531414','GSV6-1.3-C13':'53.2099','GSV6-1.3-C18':'1900.73','GSV6-1.3-C21':'n=6'
}
for item_id,needle in spot_text.items():
    item=by_practice.get(item_id,{})
    if needle not in (str(item.get('answer',''))+str(item.get('solution',''))):errors.append(f'Mathematical spot check failed for {item_id}: {needle}')
if '1638' not in str(by_quiz.get('GSV6-1.3-Q12',{})):errors.append('Quiz subsequence sum correction missing')
part_c=next((part for part in by_exam.get('GSV6-1.3-E04',{}).get('parts',[]) if part.get('label')=='c'),{})
if '53.2099' not in str(part_c.get('answer','')):errors.append('Bouncing-ball task correction missing')
expected_marks={
 'GSV6-1.3-E01':(12,[2,2,2,2,3,1]),
 'GSV6-1.3-E02':(13,[2,2,3,3,1,2]),
 'GSV6-1.3-E03':(13,[2,2,3,3,2,1]),
 'GSV6-1.3-E04':(13,[2,2,4,3,2]),
 'GSV6-1.3-E05':(14,[1,2,2,2,2,3,2]),
}
for task in exam:
    expected=expected_marks.get(task['id'])
    actual=(task['total'],[part['marks'] for part in task['parts']])
    if expected and actual!=expected:errors.append(f"Unexpected mark structure for {task['id']}: {actual}")

print('IB AI SL Lesson 1.3 definitive v6 validation')
print(f'Root: {ROOT}')
print(f'Errors: {len(errors)}')
for error in errors:print(f'  ERROR: {error}')
if errors:raise SystemExit(1)
print('Status: PASS')
