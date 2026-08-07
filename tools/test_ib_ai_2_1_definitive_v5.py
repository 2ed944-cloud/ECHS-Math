#!/usr/bin/env python3
from __future__ import annotations
import json,re,subprocess,sys
from collections import Counter
from pathlib import Path

ROOT=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
U2=Path('lessons/ib-math-ai/unit-2')
FILES=[U2/'data/lesson-2.1-v5-core.js',U2/'data/lesson-2.1-v5-practice.js',U2/'data/lesson-2.1-v5-assessment.js']
HTML=U2/'lessons/IB_AI_SL_2.1_functions_domain_range_representations_ECHS.html'
CSS=[U2/'assets/css/lesson-2.1-v5-core.css',U2/'assets/css/lesson-2.1-v5-responsive.css',U2/'assets/css/lesson-2.1-v5-ti84.css']
JS=[U2/'data/lesson-2.1-v5-interactions.js',U2/'data/lesson-2.1-v5-ti84.js']
PORTAL=Path('data/ib-math-ai-unit-2-update.js')
START=U2/'START_HERE.html'
INDEX=U2/'index.html'
IB_WORKFLOW=Path('.github/workflows/ib-lesson-platform-qa.yml')
VISUAL_WORKFLOW=Path('.github/workflows/platform-visual-qa.yml')
BROWSER=Path('tools/browser_qa_ib_ai_2_1_definitive_v5.mjs')
errors=[]

def read(path):
 p=ROOT/path
 if not p.is_file():errors.append(f'Missing {path}');return''
 return p.read_text(encoding='utf-8',errors='replace')

for path in [*FILES,*JS]:
 r=subprocess.run(['node','--check',str(ROOT/path)],capture_output=True,text=True)
 if r.returncode:errors.append(f'JavaScript syntax {path}: {r.stderr.strip()}')

program=f"""
const fs=require('fs'),vm=require('vm');const files={json.dumps([str(p) for p in FILES])};
const sandbox={{window:{{}},console}};sandbox.window.window=sandbox.window;vm.createContext(sandbox);
for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{{filename:file}});
process.stdout.write(JSON.stringify(sandbox.window.LESSON_DATA));
"""
r=subprocess.run(['node','-e',program],cwd=ROOT,capture_output=True,text=True)
if r.returncode:errors.append(f'Assembly failure: {r.stderr.strip()}');data={}
else:
 try:data=json.loads(r.stdout)
 except Exception as exc:errors.append(f'Assembly JSON: {exc}');data={}

if data:
 if data.get('version')!='5.0.0':errors.append('Version is not 5.0.0')
 slides=data.get('slides',[]);practice=data.get('practice',[]);quiz=data.get('quiz',[]);exam=data.get('exam',[])
 if (len(slides),len(practice),len(quiz),len(exam))!=(88,96,18,6):errors.append(f'Counts {(len(slides),len(practice),len(quiz),len(exam))}')
 if Counter(q.get('level') for q in practice)!=Counter({'Foundation':24,'Application':24,'Reasoning':24,'Challenge':24}):errors.append('Practice levels are not 24/24/24/24')
 titles=[s.get('title') for s in slides]
 if len(titles)!=len(set(titles)):errors.append('Duplicate slide titles')
 ids=[q.get('id') for q in practice+quiz]+[t.get('id') for t in exam]
 if len(ids)!=len(set(ids)) or any(not i for i in ids):errors.append('Missing or duplicate assessment IDs')
 def norm(v):return re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',str(v or '')).lower()).strip()
 pp={norm(q.get('prompt')) for q in practice};qp={norm(q.get('prompt')) for q in quiz}
 if len(pp)!=len(practice):errors.append('Duplicate Practice prompts')
 if len(qp)!=len(quiz):errors.append('Duplicate Quiz prompts')
 if pp&qp:errors.append('Quiz repeats Practice prompts')
 banned=re.compile(r'\b(production|release|qa|definitive|source alignment|build version|public/private)\b',re.I)
 visible='\n'.join([str(s.get('title',''))+' '+str(s.get('section',''))+' '+str(s.get('eyebrow',''))+' '+str(s.get('html','')) for s in slides]+[str(q.get('prompt',''))+' '+str(q.get('solution','')) for q in practice+quiz]+[str(t.get('title',''))+' '+str(t.get('context',''))+' '+' '.join(str(p.get('prompt','')) for p in t.get('parts',[])) for t in exam])
 if banned.search(visible):errors.append(f'Student-facing production wording: {banned.search(visible).group(0)}')
 def check_string(value,label):
  value=str(value or '')
  controls=[ord(c) for c in value if ord(c)<32 and c not in '\n\r']
  if controls:errors.append(f'Control character in {label}: {controls[:3]}')
  for left,right in ((r'\(',r'\)'),(r'\[',r'\]')):
   if value.count(left)!=value.count(right):errors.append(f'Unbalanced math in {label}: {left}/{right}')
  for segment in re.findall(r'\\\((?:.|\n)*?\\\)|\\\[(?:.|\n)*?\\\]',value):
   if '<' in segment or '>' in segment:errors.append(f'HTML-sensitive inequality in {label}: {segment[:80]}')
 for i,s in enumerate(slides):check_string(s.get('html'),f'slide {i+1}')
 for q in practice+quiz:
  for k in ('prompt','answer','solution'):check_string(q.get(k),f'{q.get("id")} {k}')
  if not q.get('prompt') or not q.get('answer') or not q.get('solution') or not isinstance(q.get('marks'),int):errors.append(f'Incomplete question {q.get("id")}')
  if isinstance(q.get('choices'),list):
   if not isinstance(q.get('correct'),int) or not 0<=q['correct']<len(q['choices']):errors.append(f'Invalid MCQ {q.get("id")}')
 for t in exam:
  if sum(p.get('marks',0) for p in t.get('parts',[]))!=t.get('total_marks'):errors.append(f'Mark total {t.get("id")}')
  for p in t.get('parts',[]):
   for k in ('prompt','answer','markscheme'):
    if not p.get(k):errors.append(f'Incomplete {t.get("id")} {p.get("label")} {k}')
    check_string(p.get(k),f'{t.get("id")} {p.get("label")} {k}')
 expected={'A18':2.115,'A20':10,'C09':0.390,'C10':2.214,'C11':14,'C12':7.77}
 byid={q['id']:q for q in practice}
 for key,value in expected.items():
  actual=float(byid.get(key,{}).get('check',{}).get('value',999))
  if abs(actual-value)>1e-9:errors.append(f'Audited value {key}: {actual}')
 if data.get('lesson',{}).get('ti84_workflows')!=['Zero','Minimum/Maximum','Intersect','TABLE/TBLSET']:errors.append('TI-84 workflow metadata incomplete')
 blocks=Counter(s.get('block') for s in slides)
 if blocks!=Counter({'A':14,'B':13,'C':18,'D':15,'E':16,'F':12}):errors.append(f'Block counts {blocks}')

html=read(HTML)
for marker in ['lesson-2.1-v5-core.css?v=5.0.0','lesson-2.1-v5-responsive.css?v=5.0.0','lesson-2.1-v5-ti84.css?v=5.0.0','lesson-2.1-v5-core.js?v=5.0.0','lesson-2.1-v5-practice.js?v=5.0.0','lesson-2.1-v5-assessment.js?v=5.0.0','../assets/js/katex-global.js','../assets/js/engine.js?v=2.0.0','lesson-2.1-v5-interactions.js?v=5.0.0','lesson-2.1-v5-ti84.js?v=5.0.0']:
 if marker not in html:errors.append(f'Wrapper missing {marker}')
if 'lesson-2.1-v4-' in html:errors.append('Wrapper still loads v4 assets')
for path in CSS:
 text=read(path)
 if not text:continue
 if '@media' not in text and 'ti84' not in path.name:errors.append(f'No responsive contract in {path}')
for marker in ('Zero','Maximum','Intersect','TABLE','externalService:false','v5-ti84-launch'):
 if marker not in read(JS[1]):errors.append(f'TI-84 layer missing {marker}')

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
for marker in ('expected:{slides:88,practice:96,quiz:18,exam:6}','TI-84 Intersect result failed','Mobile selection'):
 if marker not in browser:errors.append(f'Browser QA missing {marker}')

print('IB AI SL Lesson 2.1 v5 validation')
print('Errors:',len(errors))
for e in errors:print(' ERROR:',e)
if errors:raise SystemExit(1)
print('Status: PASS')
