#!/usr/bin/env python3
from __future__ import annotations
import json,re,subprocess,sys
from collections import Counter
from pathlib import Path

ROOT=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
U2=Path('lessons/ib-math-ai/unit-2')
U1=Path('lessons/ib-math-ai/unit-1')
ASSEMBLY=[
 U2/'data/lesson-2.1-v5-core.js',
 U2/'data/lesson-2.1-v5-practice.js',
 U2/'data/lesson-2.1-v5-assessment.js',
 U2/'data/lesson-2.1-v5-challenge-a.js',
 U2/'data/lesson-2.1-v5-challenge-b.js',
 U2/'data/lesson-2.1-v5-precision-repair.js',
]
HTML=U2/'lessons/IB_AI_SL_2.1_functions_domain_range_representations_ECHS.html'
CSS=[
 U2/'assets/css/lesson-2.1-v5-core.css',
 U2/'assets/css/lesson-2.1-v5-responsive.css',
 U2/'assets/css/lesson-2.1-v5-precision-repair.css',
 U1/'assets/css/unit-1-ti84-simulator-v7.css',
]
INTERACTIONS=U2/'data/lesson-2.1-v5-interactions.js'
SIMULATOR=U1/'data/unit-1-ti84-simulator-v7.js'
PORTAL=Path('data/ib-math-ai-unit-2-update.js')
START=U2/'START_HERE.html'
INDEX=U2/'index.html'
IB_WORKFLOW=Path('.github/workflows/ib-lesson-platform-qa.yml')
VISUAL_WORKFLOW=Path('.github/workflows/platform-visual-qa.yml')
BROWSER=Path('tools/browser_qa_ib_ai_2_1_definitive_v5.mjs')
errors=[]

def read(path:Path)->str:
 p=ROOT/path
 if not p.is_file():
  errors.append(f'Missing {path}')
  return ''
 return p.read_text(encoding='utf-8',errors='replace')

for path in [*ASSEMBLY,INTERACTIONS,SIMULATOR]:
 r=subprocess.run(['node','--check',str(ROOT/path)],capture_output=True,text=True)
 if r.returncode:errors.append(f'JavaScript syntax {path}: {r.stderr.strip()}')

program=f"""
const fs=require('fs'),vm=require('vm');
const files={json.dumps([str(p) for p in ASSEMBLY])};
const sandbox={{window:{{}},console}};sandbox.window.window=sandbox.window;vm.createContext(sandbox);
for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{{filename:file}});
process.stdout.write(JSON.stringify(sandbox.window.LESSON_DATA));
"""
r=subprocess.run(['node','-e',program],cwd=ROOT,capture_output=True,text=True)
if r.returncode:
 errors.append(f'Assembly failure: {r.stderr.strip()}');data={}
else:
 try:data=json.loads(r.stdout)
 except Exception as exc:errors.append(f'Assembly JSON: {exc}');data={}

if data:
 if data.get('version')!='5.0.0':errors.append('Base lesson version must remain 5.0.0')
 slides=data.get('slides',[]);practice=data.get('practice',[]);quiz=data.get('quiz',[]);exam=data.get('exam',[])
 if (len(slides),len(practice),len(quiz),len(exam))!=(88,96,18,6):errors.append(f'Counts {(len(slides),len(practice),len(quiz),len(exam))}')
 levels=Counter(q.get('level') for q in practice)
 if levels!=Counter({'Foundation':24,'Application':24,'Reasoning':24,'Challenge':24}):errors.append(f'Practice levels {dict(levels)}')

 titles=[s.get('title') for s in slides]
 if len(titles)!=len(set(titles)):errors.append('Duplicate slide titles')
 ids=[q.get('id') for q in practice+quiz]+[t.get('id') for t in exam]
 if len(ids)!=len(set(ids)) or any(not i for i in ids):errors.append('Missing or duplicate assessment IDs')

 def norm(v):return re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',str(v or '')).lower()).strip()
 pp={norm(q.get('prompt')) for q in practice};qp={norm(q.get('prompt')) for q in quiz}
 if len(pp)!=len(practice):errors.append('Duplicate Practice prompts')
 if len(qp)!=len(quiz):errors.append('Duplicate Quiz prompts')
 if pp&qp:errors.append('Quiz repeats Practice prompts')

 challenge=[q for q in practice if q.get('level')=='Challenge']
 if [q.get('id') for q in challenge]!=[f'C{i:02d}' for i in range(1,25)]:errors.append('Challenge IDs are not C01-C24 in order')
 for q in challenge:
  prompt=str(q.get('prompt') or '').strip()
  if len(prompt)<35 or prompt==q.get('id') or re.fullmatch(r'C\d+',prompt):errors.append(f'Challenge prompt is not substantive: {q.get("id")} -> {prompt!r}')
  if len(str(q.get('solution') or '').strip())<30:errors.append(f'Challenge solution too short: {q.get("id")}')
  if not isinstance(q.get('marks'),int) or q['marks']<3:errors.append(f'Challenge marks invalid: {q.get("id")}')
 byid={q['id']:q for q in practice}
 if 'never a function' not in str(byid.get('C01',{}).get('answer','')).lower():errors.append('C01 function-condition answer is incorrect')
 for key,value in {'A18':2.115,'A20':10}.items():
  actual=float(byid.get(key,{}).get('check',{}).get('value',999))
  if abs(actual-value)>1e-9:errors.append(f'Audited value {key}: {actual}')

 def check_string(value,label):
  value=str(value or '')
  controls=[ord(c) for c in value if ord(c)<32 and c not in '\n\r\t']
  if controls:errors.append(f'Control character in {label}: {controls[:3]}')
  for left,right in ((r'\(',r'\)'),(r'\[',r'\]')):
   if value.count(left)!=value.count(right):errors.append(f'Unbalanced math in {label}: {left}/{right}')
  for segment in re.findall(r'\\\((?:.|\n)*?\\\)|\\\[(?:.|\n)*?\\\]',value):
   if '<' in segment or '>' in segment:errors.append(f'HTML-sensitive inequality in {label}: {segment[:90]}')
 for i,s in enumerate(slides):check_string(s.get('html'),f'slide {i+1}')
 for q in practice+quiz:
  for key in ('prompt','answer','solution'):check_string(q.get(key),f'{q.get("id")} {key}')
  if not q.get('prompt') or not q.get('answer') or not q.get('solution') or not isinstance(q.get('marks'),int):errors.append(f'Incomplete question {q.get("id")}')
  if isinstance(q.get('choices'),list) and (not isinstance(q.get('correct'),int) or not 0<=q['correct']<len(q['choices'])):errors.append(f'Invalid MCQ {q.get("id")}')
 for t in exam:
  if sum(p.get('marks',0) for p in t.get('parts',[]))!=t.get('total_marks'):errors.append(f'Mark total {t.get("id")}')
  for p in t.get('parts',[]):
   for key in ('prompt','answer','markscheme'):
    if not p.get(key):errors.append(f'Incomplete {t.get("id")} {p.get("label")} {key}')
    check_string(p.get(key),f'{t.get("id")} {p.get("label")} {key}')

 if data.get('lesson',{}).get('ti84_workflows')!=['Zero','Minimum/Maximum','Intersect','TABLE/TBLSET']:errors.append('TI-84 workflow metadata incomplete')
 blocks=Counter(s.get('block') for s in slides)
 if blocks!=Counter({'A':14,'B':13,'C':18,'D':15,'E':16,'F':12}):errors.append(f'Block counts {blocks}')

 bytitle={s.get('title'):s for s in slides}
 exact={
  'The vertical-line test':['data-v5-math-graph="vertical-line"','(1,3)','(1,±√3)','y = 4 − x²'],
  'Read an image and preimages from a graph':['data-v5-math-graph="image-preimage"','f(x)=−(x−1)²+6','x=0','x=2'],
  'TI‑84 Zero workflow':['data-v5-math-graph="ti84-zero"','2.115','MATHEMATICAL PREVIEW','data-open-ti84'],
  'TI‑84 Intersect workflow':['data-v5-math-graph="ti84-intersect"','0.764,5.236','EXACT GRAPH PREVIEW','data-open-ti84'],
  'Graphs reflect in y=x':['data-v5-math-graph="inverse-reflection"','(2,4)','(4,2)','f⁻¹(x)=√x'],
  'TABLE and TBLSET for discrete evidence':['49.915','55.905','n=10','data-open-ti84'],
 }
 for title,markers in exact.items():
  body=str(bytitle.get(title,{}).get('html',''))
  if not body:errors.append(f'Missing repaired graph slide: {title}');continue
  for marker in markers:
   if marker not in body:errors.append(f'{title} missing precision marker {marker}')
 for title in ('TI‑84 Zero workflow','TI‑84 Intersect workflow'):
  if 'v5-ti-screen graph' in str(bytitle.get(title,{}).get('html','')):errors.append(f'{title} still contains fake calculator screen')
 repair=data.get('precisionRepair') or {}
 if repair.get('release')!='5.1.0' or repair.get('sharedTi84Simulator') is not True:errors.append(f'Precision repair metadata invalid: {repair}')

 banned=re.compile(r'\b(production|release candidate|source alignment|build version|public/private)\b',re.I)
 visible='\n'.join([str(s.get('title',''))+' '+str(s.get('section',''))+' '+str(s.get('eyebrow',''))+' '+str(s.get('html','')) for s in slides]+[str(q.get('prompt',''))+' '+str(q.get('solution','')) for q in practice+quiz])
 if banned.search(visible):errors.append(f'Student-facing internal wording: {banned.search(visible).group(0)}')

html=read(HTML)
for marker in [
 'lesson-2.1-v5-core.css?v=5.0.0','lesson-2.1-v5-responsive.css?v=5.0.0','lesson-2.1-v5-precision-repair.css?v=5.1.0',
 '../../unit-1/assets/css/unit-1-ti84-simulator-v7.css?v=7.1.2','lesson-2.1-v5-core.js?v=5.0.0','lesson-2.1-v5-practice.js?v=5.0.0',
 'lesson-2.1-v5-assessment.js?v=5.0.0','lesson-2.1-v5-challenge-a.js?v=5.1.0','lesson-2.1-v5-challenge-b.js?v=5.1.0',
 'lesson-2.1-v5-precision-repair.js?v=5.1.0','../assets/js/katex-global.js','../assets/js/engine.js?v=2.0.0',
 'lesson-2.1-v5-interactions.js?v=5.0.0','../../unit-1/data/unit-1-ti84-simulator-v7.js?v=7.1.2'
]:
 if marker not in html:errors.append(f'Wrapper missing {marker}')
for obsolete in ('lesson-2.1-v5-ti84.css','lesson-2.1-v5-ti84.js','lesson-2.1-v4-'):
 if obsolete in html:errors.append(f'Wrapper still loads obsolete asset {obsolete}')

css='\n'.join(read(path) for path in CSS)
for marker in ('.v5-block-open h2','color:#fff!important','.v5-math-plot','@media(max-width:580px)'):
 if marker not in css:errors.append(f'Precision CSS missing {marker}')
simulator=read(SIMULATOR)
for marker in ("https://ti84calc.com/ti84calc","2\\.1","[data-open-ti84]","TI‑84 Simulator","model:'TI-84 Plus CE'","'2.1'","release:'7.1.2'"):
 if marker not in simulator:errors.append(f'Shared TI-84 simulator missing {marker}')

portal=read(PORTAL);start=read(START);index=read(INDEX);ib_workflow=read(IB_WORKFLOW);visual_workflow=read(VISUAL_WORKFLOW);browser=read(BROWSER)
for marker in ('424 Learn screens','416 Practice questions','82 Quiz questions','24 extended tasks','release: "5.0.0"','learn: 88','practice: 96','quiz: 18','tasks: 6'):
 if marker not in portal:errors.append(f'Unit 2 portal metadata missing {marker}')
for page,label in ((start,'START_HERE'),(index,'Unit 2 index')):
 for marker in ('424','416','106','88 Learn screens','96 Practice Studio questions','18-question quiz','6 IB tasks'):
  if marker not in page:errors.append(f'{label} missing {marker}')
for marker in ('tools/test_ib_ai_2_1_definitive_v5.py','Validate Lesson 2.1 definitive v5'):
 if marker not in ib_workflow:errors.append(f'IB QA workflow missing {marker}')
for marker in ('tools/browser_qa_ib_ai_2_1_definitive_v5.mjs','Functions Lesson 2.1 v5'):
 if marker not in visual_workflow:errors.append(f'Visual QA workflow missing {marker}')
for marker in ('expected:{slides:88,practice:96,quiz:18,exam:6}','Shared TI-84 simulator failed','Challenge prompt failed','block contrast failed','Mobile selection'):
 if marker not in browser:errors.append(f'Browser QA missing {marker}')

print('IB AI SL Lesson 2.1 v5.1 precision validation')
print('Errors:',len(errors))
for e in errors:print(' ERROR:',e)
if errors:raise SystemExit(1)
print('Status: PASS')
