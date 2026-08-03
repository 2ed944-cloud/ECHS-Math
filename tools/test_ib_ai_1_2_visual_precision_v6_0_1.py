#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
U1=ROOT/'lessons/ib-math-ai/unit-1'
HTML=U1/'lessons/IB_AI_SL_1.2_arithmetic_sequences_ECHS.html'
CSS=U1/'assets/css/lesson-1.2-visual-precision-v6-0-1.css'
PATCH=U1/'data/lesson-1.2-visual-precision-v6-0-1.js'
DATA=[
 U1/'data/lesson-1.2.js',
 U1/'data/lesson-1.2-v3.js',
 U1/'data/unit-1-v5-content-data.js',
 U1/'data/unit-1-v5-apply.js',
 U1/'data/lesson-1.2-arithmetic-definitive-v6.js',
 U1/'data/lesson-1.2-arithmetic-v6-polish.js',
 PATCH,
]
errors=[]

def read(path:Path)->str:
 if not path.is_file(): errors.append(f'Missing {path.relative_to(ROOT)}'); return ''
 return path.read_text(encoding='utf-8',errors='replace')

html=read(HTML); css=read(CSS); patch=read(PATCH)
for marker in (
 'lesson-1.2-visual-precision-v6-0-1.css?v=6.0.1',
 'lesson-1.2-visual-precision-v6-0-1.js?v=6.0.1',
):
 if marker not in html: errors.append(f'HTML missing {marker}')
if html and not (html.index('lesson-1.2-arithmetic-v6-polish.js?v=6.0.0') < html.index('lesson-1.2-visual-precision-v6-0-1.js?v=6.0.1') < html.index('../assets/js/engine.js')):
 errors.append('Visual patch must load after lesson data polish and before engine rendering')
if html and html.index('lesson-1.2-visual-precision-v6-0-1.css?v=6.0.1') > html.index('katex.css'):
 errors.append('Visual patch CSS must load before canonical KaTeX CSS')

result=subprocess.run(['node','--check',str(PATCH)],text=True,capture_output=True)
if result.returncode: errors.append(f'Patch syntax failure: {result.stderr.strip()}')

program=f"""
const fs=require('fs'),vm=require('vm');
const files={json.dumps([str(path) for path in DATA])};
const sandbox={{window:{{}},console}};sandbox.window.window=sandbox.window;vm.createContext(sandbox);
for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{{filename:file}});
const d=sandbox.window.LESSON_DATA;
const wanted=['One sequence, two tracks','Arithmetic sequences graph as discrete linear points'];
const slides=Object.fromEntries(d.slides.filter(s=>wanted.includes(s.title)).map(s=>[s.title,s.html]));
process.stdout.write(JSON.stringify({{slides,audit:d.v6Audit,count:d.slides.length}}));
"""
assembled=subprocess.run(['node','-e',program],cwd=ROOT,text=True,capture_output=True)
if assembled.returncode:
 errors.append(f'Assembly failure: {assembled.stderr.strip()}'); payload={}
else:
 try: payload=json.loads(assembled.stdout)
 except json.JSONDecodeError as exc: errors.append(f'Invalid assembly JSON: {exc}'); payload={}

if payload.get('count')!=73: errors.append(f"Slide count changed to {payload.get('count')}")
slides=payload.get('slides',{})
tracks=slides.get('One sequence, two tracks','')
graph=slides.get('Arithmetic sequences graph as discrete linear points','')

for value,label in [('4','u_1'),('7','u_2'),('10','u_3'),('13','u_4'),('16','u_5')]:
 pattern=rf'<strong>{value}</strong><small>\\\({re.escape(label)}\\\)</small>'
 if not re.search(pattern,tracks): errors.append(f'Term track does not separate value {value} from {label}')
for value,label in [('4','S_1'),('11','S_2'),('21','S_3'),('34','S_4'),('50','S_5')]:
 pattern=rf'<strong>{value}</strong><small>\\\({re.escape(label)}\\\)</small>'
 if not re.search(pattern,tracks): errors.append(f'Partial-sum track does not separate value {value} from {label}')

for marker in (
 'as-discrete-graph-precise',
 'as-exact-linear-guide',
 '--x:18%;--y:78%',
 '--x:34%;--y:64%',
 '--x:50%;--y:50%',
 '--x:66%;--y:36%',
 '--x:82%;--y:22%',
 'u_n=3n+1',
 'integer-index points only',
):
 if marker not in graph: errors.append(f'Precise graph missing {marker}')

for marker in (
 'clip-path:polygon(17.55% 78.75%,18.45% 77.25%,82.45% 21.25%,81.55% 22.75%)',
 '.as-track-precise>div>strong',
 '.as-track-precise>div>small',
 'transform:none',
):
 if marker not in css.replace('\n',''): errors.append(f'Visual CSS missing {marker}')
if re.search(r'\.as-track-precise[^\{]*\{[^}]*position\s*:\s*absolute',css,re.S):
 errors.append('Track labels must not use absolute positioning')
if '.katex' in css:
 errors.append('Hotfix CSS must not style KaTeX internals')

audit=payload.get('audit') or {}
for flag in ('exactDiscreteGuide','separatedTermAndValueLabels'):
 if audit.get(flag) is not True: errors.append(f'Audit flag is not true: {flag}')

print('IB AI SL Lesson 1.2 visual precision v6.0.1')
print('Errors:',len(errors))
for error in errors: print(' ERROR:',error)
if errors: raise SystemExit(1)
print('Status: PASS')
