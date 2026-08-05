#!/usr/bin/env python3
"""IB AI SL Lesson 1.4 v6.2 core-first scope regression."""
from __future__ import annotations
import json,re,subprocess,sys
from collections import Counter
from pathlib import Path

ROOT=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
U1=Path('lessons/ib-math-ai/unit-1')
HTML=U1/'lessons/IB_AI_SL_1.4_financial_models_ECHS.html'
ENGINE=U1/'assets/js/engine.js'
INTERACTIONS=U1/'data/lesson-1.4-financial-v6-interactions.js'
RUNTIME=U1/'data/lesson-1.4-scope-runtime-v6-2.js'
SCOPES=[U1/'data/lesson-1.4-sl-core-v6-2-copy-a.js',U1/'data/lesson-1.4-sl-core-v6-2-copy-b.js',U1/'data/lesson-1.4-sl-core-v6-2-copy-c.js',U1/'data/lesson-1.4-sl-core-v6-2-apply.js']
BASE=[
 U1/'data/lesson-1.4.js',U1/'data/lesson-1.4-v3.js',
 U1/'data/unit-1-v5-content-data.js',U1/'data/unit-1-v5-apply.js',
 U1/'data/lesson-1.4-financial-v6-foundations.js',
 U1/'data/lesson-1.4-financial-v6-cashflows.js',
 U1/'data/lesson-1.4-financial-v6-practice.js',
 U1/'data/lesson-1.4-financial-v6-assessment.js',
 U1/'data/lesson-1.4-financial-v6-polish.js'
]
errors=[]
def read(path:Path)->str:
 p=ROOT/path
 if not p.is_file():errors.append(f'Missing {path}');return''
 return p.read_text(encoding='utf-8',errors='replace')

def assemble(extension=False)->dict:
 files=[str(path) for path in (*BASE,*SCOPES)]
 program=f"""
const fs=require('fs'),vm=require('vm');
const sandbox={{window:{{}},console,location:{{search:{json.dumps('?scope=extension' if extension else '')}}}}};
sandbox.window.window=sandbox.window;vm.createContext(sandbox);
for(const file of {json.dumps(files)})vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{{filename:file}});
const d=sandbox.window.LESSON_DATA;
process.stdout.write(JSON.stringify({{
 version:d.version,schemaVersion:d.schemaVersion,scope:d.financialScope,storageScope:d.storageScope,
 lesson:d.lesson,slides:d.slides,practice:d.practice,quiz:d.quiz,exam:d.exam,
 blocks:d.teachingBlocks,catalog:d.financialScopeCatalog,audit:d.v6Audit
}}));
"""
 result=subprocess.run(['node','-e',program],cwd=ROOT,text=True,capture_output=True)
 if result.returncode:errors.append(f"Assembly failed ({'extension' if extension else 'core'}): {result.stderr.strip()}");return{}
 try:return json.loads(result.stdout)
 except Exception as exc:errors.append(f'Assembly JSON failed: {exc}');return{}

html=read(HTML);engine=read(ENGINE);interactions=read(INTERACTIONS);scope_js='\n'.join(read(path) for path in SCOPES);runtime=read(RUNTIME)
for path in (*SCOPES,RUNTIME,INTERACTIONS,ENGINE):
 result=subprocess.run(['node','--check',str(ROOT/path)],capture_output=True,text=True)
 if result.returncode:errors.append(f'JavaScript syntax failure {path}: {result.stderr.strip()}')
for marker in ('lesson-1.4-sl-core-v6-2-copy-a.js?v=6.2.0','lesson-1.4-sl-core-v6-2-copy-b.js?v=6.2.0','lesson-1.4-sl-core-v6-2-copy-c.js?v=6.2.0','lesson-1.4-sl-core-v6-2-apply.js?v=6.2.0','engine.js?v=3.0.0','lesson-1.4-financial-v6-interactions.js?v=6.0.0','lesson-1.4-scope-runtime-v6-2.js?v=6.2.0','id="financial-scope-toggle"'):
 if marker not in html:errors.append(f'Wrapper missing {marker}')
if 'lesson-1.4-teaching-blocks-v6-1.js' in html:errors.append('Obsolete organization overlay is still loaded')
if not (html.index('lesson-1.4-financial-v6-polish.js')<html.index('lesson-1.4-sl-core-v6-2-copy-a.js')<html.index('lesson-1.4-sl-core-v6-2-apply.js')<html.index('../assets/js/katex-global.js')<html.index('../assets/js/engine.js')):
 errors.append('Scope overlay load order is invalid')
if not (html.index('../assets/js/engine.js')<html.index('lesson-1.4-financial-v6-interactions.js')<html.index('lesson-1.4-scope-runtime-v6-2.js')):
 errors.append('Scope runtime load order is invalid')
for marker in ('initScopeToggle','switchScope','patchRoute','data-core-fin-explorer','data-core-generator',"searchParams.set('scope','extension')"):
 if marker not in runtime:errors.append(f'Scope runtime missing: {marker}')

core=assemble(False);ext=assemble(True)
if core and ext:
 for data,scope,counts in ((core,'core',(31,40,10,3)),(ext,'extension',(71,80,12,6))):
  actual=(len(data['slides']),len(data['practice']),len(data['quiz']),len(data['exam']))
  if actual!=counts:errors.append(f'{scope} counts {actual} != {counts}')
  if data.get('scope')!=scope or data.get('storageScope')!=scope:errors.append(f'{scope} identity mismatch')
  if data.get('version')!='6.2.0' or data.get('schemaVersion')!='1.4.2':errors.append(f'{scope} release metadata mismatch')
  if data['lesson'].get('release')!='6.2.0':errors.append(f'{scope} lesson release mismatch')
  if data['lesson'].get('pacing',{}).get('active_scope')!=scope:errors.append(f'{scope} pacing metadata mismatch')
  for item in data['slides']:
   if not item.get('teachingBlock') or not item.get('classification'):errors.append(f'{scope} missing screen metadata: {item.get("title")}')
  for task in data['exam']:
   marks=sum(part.get('marks',0) for part in task.get('parts',[]))
   if marks!=task.get('total_marks'):errors.append(f'{scope} task marks mismatch: {task.get("id")}')

 expected_core_blocks=['1.4A','1.4B','1.4C','1.4D'];expected_ext_blocks=['1.4E','1.4F','1.4G']
 if [b.get('code') for b in core['blocks']]!=expected_core_blocks:errors.append('Core block sequence mismatch')
 if [b.get('code') for b in ext['blocks']]!=expected_ext_blocks:errors.append('Extension block sequence mismatch')
 if core['slides'][0].get('title')!='1.4 · Financial Applications':errors.append('Core cover missing')
 if core['slides'][-1].get('title')!='Mastery routes and transition to logarithms':errors.append('Core mastery must close default path')
 if ext['slides'][0].get('title')!='Opening decision · three plans, one fair comparison':errors.append('Extension opening boundary mismatch')

 core_text='\n'.join(item.get('title','')+' '+item.get('html','') for item in core['slides']).lower()
 for forbidden in ('annuity due','withdrawal fund','loan-payment formula','outstanding balance','growing annuit'):
  if forbidden in core_text:errors.append(f'Advanced topic leaked into default core Learn path: {forbidden}')
 for required in ('compound interest','nominal annual rate','annual reducing-balance depreciation','interactive sl core explorer','generative core practice'):
  if required not in core_text:errors.append(f'Core Learn path missing {required}')
 if 'compound interest and annual depreciation' not in core['lesson'].get('syllabus_focus','').lower():errors.append('Official SL 1.4 focus metadata missing')

 core_ids={q['id'] for q in core['practice']};ext_ids={q['id'] for q in ext['practice']}
 if core_ids & ext_ids:errors.append('Core and extension Practice Studio overlap')
 if len(core_ids|ext_ids)!=120:errors.append('Original 120 Practice questions were not fully partitioned')
 levels=Counter(q.get('level') for q in core['practice'])
 if levels!=Counter({'Foundation':20,'Application':7,'Reasoning':8,'Challenge':5}):errors.append(f'Core Practice distribution mismatch: {dict(levels)}')
 if len({q['id'] for q in core['quiz']})!=10 or len({q['id'] for q in ext['quiz']})!=12:errors.append('Quiz IDs are not unique by scope')
 if len({t['id'] for t in core['exam']})!=3 or len({t['id'] for t in ext['exam']})!=6:errors.append('Assessment task IDs are not unique by scope')

 catalog=core.get('catalog',{})
 if catalog.get('current_syllabus_core')!='SL 1.4 — financial applications: compound interest and annual depreciation':errors.append('Scope catalog syllabus text mismatch')
 if catalog.get('core',{}).get('learn_screens')!=31 or catalog.get('extension',{}).get('learn_screens')!=71:errors.append('Scope catalog counts mismatch')
 for flag in ('ibScopeReaudit','coreFirstPath','advancedApplicationsRetained','currencyDelimiterRepair','sameCanonicalURL'):
  if core.get('audit',{}).get(flag) is not True:errors.append(f'Audit flag not true: {flag}')

 all_text=json.dumps(core,ensure_ascii=False)+json.dumps(ext,ensure_ascii=False)
 if re.search(r'[€£]\([^\\]+\\\)',all_text):errors.append('Malformed currency math delimiter remains after scope layer')
 if '<svg' in '\n'.join(item.get('html','').lower() for item in core['slides']+ext['slides']):errors.append('Inline SVG introduced by scope refactor')

print('IB AI SL Lesson 1.4 v6.2 scope validation')
print('Errors:',len(errors))
for error in errors:print(' ERROR:',error)
if errors:raise SystemExit(1)
print('Status: PASS')
