#!/usr/bin/env python3
"""Currency-adjacent KaTeX regression for IB AI SL Lesson 1.4."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
U1=Path('lessons/ib-math-ai/unit-1')
HTML=U1/'lessons/IB_AI_SL_1.4_financial_models_ECHS.html'
CURRENCY=U1/'data/lesson-1.4-currency-katex-v6-2.js'
FILES=[
 U1/'data/lesson-1.4.js',U1/'data/lesson-1.4-v3.js',
 U1/'data/unit-1-v5-content-data.js',U1/'data/unit-1-v5-apply.js',
 U1/'data/lesson-1.4-financial-v6-foundations.js',
 U1/'data/lesson-1.4-financial-v6-cashflows.js',
 U1/'data/lesson-1.4-financial-v6-practice.js',
 U1/'data/lesson-1.4-financial-v6-assessment.js',
 U1/'data/lesson-1.4-financial-v6-polish.js',CURRENCY,
]
errors=[]

def read(path:Path)->str:
    target=ROOT/path
    if not target.is_file():
        errors.append(f'Missing file: {path}')
        return ''
    return target.read_text(encoding='utf-8',errors='replace')

html=read(HTML);source=read(CURRENCY)
syntax=subprocess.run(['node','--check',str(ROOT/CURRENCY)],cwd=ROOT,text=True,capture_output=True)
if syntax.returncode:errors.append(f'Currency normalization syntax failure: {syntax.stderr.strip()}')
marker='lesson-1.4-currency-katex-v6-2.js?v=6.2.0'
if marker not in html:errors.append('Lesson wrapper does not load the currency KaTeX layer')
if all(item in html for item in ('lesson-1.4-financial-v6-polish.js',marker,'lesson-1.4-teaching-blocks-v6-1.js','../assets/js/katex-global.js')):
    if not (html.index('lesson-1.4-financial-v6-polish.js')<html.index(marker)<html.index('lesson-1.4-teaching-blocks-v6-1.js')<html.index('../assets/js/katex-global.js')):
        errors.append('Currency normalization must run after content polish and before KaTeX rendering')
for required in ('currencyAdjacentKatexNormalized','currencyKatexReplacementCount','([€£$])'):
    if required not in source:errors.append(f'Currency layer missing marker: {required}')

program=f"""
const fs=require('fs'),vm=require('vm');
const files={json.dumps([str(path) for path in FILES])};
const sandbox={{window:{{}},console}};sandbox.window.window=sandbox.window;vm.createContext(sandbox);
for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{{filename:file}});
const d=sandbox.window.LESSON_DATA;if(!d)throw new Error('LESSON_DATA missing');
process.stdout.write(JSON.stringify({{slides:d.slides.map(s=>({{title:s.title,html:s.html}})),audit:d.v6Audit}}));
"""
result=subprocess.run(['node','-e',program],cwd=ROOT,text=True,capture_output=True)
if result.returncode:errors.append(f'Currency-normalized assembly failed: {result.stderr.strip()}')
else:
    try:data=json.loads(result.stdout)
    except json.JSONDecodeError as exc:errors.append(f'Currency-normalized assembly returned invalid JSON: {exc}');data={}
    joined='\n'.join(str(item.get('html','')) for item in data.get('slides',[]))
    remaining=re.findall(r'[€£$]\\\(',joined)
    if remaining:errors.append(f'Currency remains adjacent to {len(remaining)} inline KaTeX delimiter(s)')
    audit=data.get('audit') or {}
    if audit.get('currencyAdjacentKatexNormalized') is not True:errors.append('Currency normalization audit flag is not true')
    if not isinstance(audit.get('currencyKatexReplacementCount'),int) or audit.get('currencyKatexReplacementCount')<6:
        errors.append(f"Unexpected currency replacement count: {audit.get('currencyKatexReplacementCount')!r}")

print('IB AI SL Lesson 1.4 currency KaTeX validation')
print(f'Errors: {len(errors)}')
for error in errors:print(f'  ERROR: {error}')
if errors:raise SystemExit(1)
print('Status: PASS')
