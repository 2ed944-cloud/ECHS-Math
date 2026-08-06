#!/usr/bin/env python3
"""Precision regression for Lesson 2.1 assessment math and mobile cover."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
U2=Path('lessons/ib-math-ai/unit-2')
HTML=U2/'lessons/IB_AI_SL_2.1_functions_domain_range_representations_ECHS.html'
BASE=U2/'data/lesson-2.1.js'
FOUNDATIONS=U2/'data/lesson-2.1-definitive-v3-foundations.js'
PRACTICE=U2/'data/lesson-2.1-definitive-v3-practice.js'
ASSESSMENT=U2/'data/lesson-2.1-definitive-v3-assessment.js'
POLISH=U2/'data/lesson-2.1-definitive-v3-polish.js'
MOBILE=U2/'assets/css/lesson-2.1-definitive-v3-mobile.css'
errors=[]

def read(path:Path)->str:
    target=ROOT/path
    if not target.is_file():errors.append(f'Missing {path}');return ''
    return target.read_text(encoding='utf-8',errors='replace')

html=read(HTML);polish=read(POLISH);mobile=read(MOBILE)
for path in (POLISH,):
    result=subprocess.run(['node','--check',str(ROOT/path)],cwd=ROOT,text=True,capture_output=True)
    if result.returncode:errors.append(f'JavaScript syntax failure: {result.stderr.strip()}')
markers=['lesson-2.1-definitive-v3-mobile.css?v=3.0.1','lesson-2.1-definitive-v3-assessment.js?v=3.0.0','lesson-2.1-definitive-v3-polish.js?v=3.0.1','../assets/js/katex-global.js']
for marker in markers:
    if marker not in html:errors.append(f'Wrapper missing {marker}')
if all(marker in html for marker in markers):
    if not (html.index(markers[0])<html.index(markers[1])<html.index(markers[2])<html.index(markers[3])):errors.append('Precision assets load in the wrong order')
for marker in ('overflow-wrap:anywhere','max-width:100%','overflow-x:clip','fn21-cover h1','font-size:clamp(31px'):
    if marker not in mobile:errors.append(f'Mobile CSS missing {marker}')
for marker in ('IBAI-2.1-P05','U2-2.1-T1','U2-2.1-V3-T4','malformedNotEqualDelimiterRepaired','taskContextsUseStableInlineMath'):
    if marker not in polish:errors.append(f'Polish layer missing {marker}')

files=[BASE,FOUNDATIONS,PRACTICE,ASSESSMENT,POLISH]
program=f"""
const fs=require('fs'),vm=require('vm');
const files={json.dumps([str(path) for path in files])};
const sandbox={{window:{{location:{{search:'?scope=all'}}}},URLSearchParams,console}};sandbox.window.window=sandbox.window;vm.createContext(sandbox);
for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{{filename:file}});
const d=sandbox.window.LESSON_DATA;
const p=d.scopeCollections.practice.find(item=>item.id==='IBAI-2.1-P05');
const t1=d.scopeCollections.exam.find(item=>item.id==='U2-2.1-T1');
const t4=d.scopeCollections.exam.find(item=>item.id==='U2-2.1-V3-T4');
process.stdout.write(JSON.stringify({{p,t1,t4,audit:d.audit}}));
"""
result=subprocess.run(['node','-e',program],cwd=ROOT,text=True,capture_output=True)
if result.returncode:errors.append(f'Assembly failure: {result.stderr.strip()}')
else:
    try:data=json.loads(result.stdout)
    except json.JSONDecodeError as exc:errors.append(f'Assembly JSON failure: {exc}');data={}
    p=data.get('p') or {};t1=data.get('t1') or {};t4=data.get('t4') or {};audit=data.get('audit') or {}
    if p.get('answer')!='\\(x\\ne4\\)':errors.append(f"P05 answer was not repaired: {p.get('answer')!r}")
    if '\n' in str(p.get('answer','')):errors.append('P05 answer still contains a newline')
    for task in (t1,t4):
        context=str(task.get('context',''))
        if not context or context.count('\\(')!=context.count('\\)'):errors.append(f"Unbalanced task context: {task.get('id')}")
        if '\\[' in context or '\\]' in context:errors.append(f"Task context still uses fragile display delimiters: {task.get('id')}")
    if audit.get('malformedNotEqualDelimiterRepaired') is not True or audit.get('taskContextsUseStableInlineMath') is not True:errors.append('Precision audit flags are missing')

print('IB AI SL Lesson 2.1 v3.0.1 precision validation')
print(f'Errors: {len(errors)}')
for error in errors:print(f'  ERROR: {error}')
if errors:raise SystemExit(1)
print('Status: PASS')
