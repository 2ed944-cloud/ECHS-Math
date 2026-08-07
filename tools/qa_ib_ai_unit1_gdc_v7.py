#!/usr/bin/env python3
from __future__ import annotations
import json, math, re, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
UNIT=ROOT/'lessons/ib-math-ai/unit-1'
LESSONS=UNIT/'lessons'
TARGETS={'1.2':'IB_AI_SL_1.2_arithmetic_sequences_ECHS.html','1.3':'IB_AI_SL_1.3_geometric_sequences_ECHS.html','1.4':'IB_AI_SL_1.4_financial_models_ECHS.html','1.5':'IB_AI_SL_1.5_logarithms_ECHS.html','1.6':'IB_AI_SL_1.6_technology_equations_ECHS.html'}
EXPECTED={'1.2':(4,6,1),'1.3':(5,7,1),'1.4':(7,10,3),'1.5':(5,7,1),'1.6':(8,10,3)}
errors=[]
def need(ok,msg):
    if not ok: errors.append(msg)
js=(UNIT/'data/unit-1-gdc-integration-v7.js').read_text(encoding='utf-8')
css=(UNIT/'assets/css/unit-1-gdc-integration-v7.css').read_text(encoding='utf-8')
sim_js=(UNIT/'data/unit-1-ti84-simulator-v7.js').read_text(encoding='utf-8')
sim_css=(UNIT/'assets/css/unit-1-ti84-simulator-v7.css').read_text(encoding='utf-8')
need('MODEL' in js and 'ENTER' in js and 'READ' in js and 'INTERPRET' in js and 'VERIFY' in js,'missing five-stage framework')
need('iframe' not in js.lower() and 'ti84calc.com' not in js.lower(),'new runtime contains external calculator dependency')
need('@media(max-width:720px)' in css,'mobile CSS missing')
need('ti84calc.com/ti84calc' in sim_js and '<iframe' in sim_js,'shared TI-84 simulator runtime missing')
need('keyboardFocusTrap:true' in sim_js,'simulator keyboard focus trap missing')
need('.routebar .u1-ti84-sim-launch{display:none}' in sim_css,'mobile route launcher collision fix missing')
need('@media(max-width:720px)' in sim_css,'simulator mobile CSS missing')
for n,f in TARGETS.items():
    text=(LESSONS/f).read_text(encoding='utf-8')
    need('../assets/css/unit-1-gdc-integration-v7.css' in text,f'{n}: CSS not wired')
    need('../data/unit-1-gdc-integration-v7.js' in text,f'{n}: JS not wired')
    need(text.count('unit-1-gdc-integration-v7.js')==1,f'{n}: duplicate JS wiring')
    need('../assets/css/unit-1-ti84-simulator-v7.css' in text,f'{n}: simulator CSS not wired')
    need('../data/unit-1-ti84-simulator-v7.js' in text,f'{n}: simulator JS not wired')
    need(text.count('unit-1-ti84-simulator-v7.js')==1,f'{n}: duplicate simulator JS wiring')
    if n in {'1.4','1.6'}:
        need('ti84calc.com' not in text.lower(),f'{n}: external calculator URL remains active')
        need('ti84-finance-classroom-v6-3.js' not in text if n=='1.4' else 'ti84-classroom-runtime-v6-2-1.js' not in text,f'{n}: legacy iframe runtime remains')
node=r'''
const fs=require('fs'),vm=require('vm');const code=fs.readFileSync(process.argv[1],'utf8');
for(const n of ['1.2','1.3','1.4','1.5','1.6']){global.window={LESSON_DATA:{lesson:{number:n},slides:[],practice:[],exam:[]}};global.document={addEventListener(){},body:{},querySelector(){return null}};global.MutationObserver=function(){this.observe=()=>{}};global.HashChangeEvent=function(){};global.setTimeout=()=>{};vm.runInThisContext(code);const d=window.LESSON_DATA;console.log(JSON.stringify({n,s:d.slides.filter(x=>String(x.id).includes('GDC-V7')).length,p:d.practice.filter(x=>String(x.id).includes('GDC-V7')).length,t:d.exam.filter(x=>String(x.id).includes('GDC-V7')).length,ids:[...d.slides,...d.practice,...d.exam].map(x=>x.id),stages:d.slides.every(x=>['MODEL','ENTER','READ','INTERPRET','VERIFY'].every(k=>x.html.includes(k)))}));}
'''
proc=subprocess.run(['node','-e',node,str(UNIT/'data/unit-1-gdc-integration-v7.js')],text=True,capture_output=True)
need(proc.returncode==0,'node data audit failed: '+proc.stderr)
tot=[0,0,0]
if proc.returncode==0:
    for line in proc.stdout.splitlines():
        row=json.loads(line); exp=EXPECTED[row['n']]
        need((row['s'],row['p'],row['t'])==exp,f"{row['n']}: count mismatch {(row['s'],row['p'],row['t'])} != {exp}")
        need(len(row['ids'])==len(set(row['ids'])),f"{row['n']}: duplicate IDs")
        need(row['stages'],f"{row['n']}: a teaching screen lacks a stage")
        tot=[tot[i]+(row['s'],row['p'],row['t'])[i] for i in range(3)]
need(tuple(tot)==(29,40,9),f'total counts wrong: {tot}')
need(sum(5+3*(k-1) for k in range(1,41))==2540,'arithmetic sigma wrong')
need(sum(18+3*(n-1) for n in range(1,48))==4089 and sum(18+3*(n-1) for n in range(1,49))==4248,'auditorium totals wrong')
need(abs(8500*(1.037**18)-16346.942714984983)<1e-8,'large power wrong')
need(abs(sum(600*(1.025**k) for k in range(25))-20494.658359731715)<1e-8,'geometric sum wrong')
ng=next(n for n in range(100) if 15000*(.82**n)<1000); need(ng==14,'geometric threshold wrong')
need(abs(math.log(17,3)-2.578901923)<1e-8,'exponential root wrong')
roots=[]
for a,b in [(0.2,0.3),(4.4,4.6)]:
    for _ in range(80):
        m=(a+b)/2
        if (2**a-5*a)*(2**m-5*m)<=0:b=m
        else:a=m
    roots.append((a+b)/2)
need(abs(roots[0]-.235455)<1e-5 and abs(roots[1]-4.488001)<1e-5,'intersection roots wrong')
need(all(abs(v)<1e-10 for v in [37/13+46/13+73/13-12,2*37/13-46/13+3*73/13-19,3*37/13+2*46/13-73/13-10]),'3x3 solution wrong')
for f in [UNIT/'data/unit-1-gdc-integration-v7.js',UNIT/'data/unit-1-ti84-simulator-v7.js',ROOT/'tools/browser_qa_ib_ai_unit1_gdc_v7.mjs']:
    p=subprocess.run(['node','--check',str(f)],capture_output=True,text=True);need(p.returncode==0,f'JS syntax failed {f}: {p.stderr}')
try:
    subprocess.run(['git','fetch','origin','main','--quiet'],cwd=ROOT,check=False)
    changed=subprocess.run(['git','diff','--name-only','origin/main...HEAD'],cwd=ROOT,text=True,capture_output=True).stdout.splitlines()
    need(not any('IB_AI_SL_1.1_' in x or 'lesson-1.1' in x for x in changed),'Lesson 1.1 was modified')
except Exception as exc: errors.append('git scope check failed: '+str(exc))
if errors:
    print('IB AI Unit 1 GDC v7 QA: FAIL')
    print('\n'.join('- '+e for e in errors));sys.exit(1)
print(json.dumps({'status':'PASS','lessons':EXPECTED,'totals':{'screens':29,'practice':40,'tasks':9},'lesson11Modified':False,'externalCalculatorDependencies':1,'simulatorProvider':'ti84calc.com'},indent=2))
