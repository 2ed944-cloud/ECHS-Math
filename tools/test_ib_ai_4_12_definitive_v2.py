#!/usr/bin/env python3
"""Deterministic release audit for IB AI SL lesson 4.12 v2."""
from __future__ import annotations
import json, math, re, shutil, subprocess, sys
from collections import Counter
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'lessons/ib-math-ai/unit-4'
HTML=BASE/'lessons/IB_AI_SL_4.12_inferential_statistics_hypotheses_significance_ECHS.html'
CORE=[BASE/'data/lesson-4.12-v2-core-01.js',BASE/'data/lesson-4.12-v2-core-02.js',BASE/'data/lesson-4.12-v2-core-03.js',BASE/'data/lesson-4.12-v2-core-04.js',BASE/'data/lesson-4.12-v2-core-05.js']
PRACTICE=[BASE/'data/lesson-4.12-v2-practice-01.js',BASE/'data/lesson-4.12-v2-practice-02.js',BASE/'data/lesson-4.12-v2-practice-03.js',BASE/'data/lesson-4.12-v2-practice-04.js']
ASSESS=BASE/'data/lesson-4.12-v2-assessment.js'
CSS=[BASE/'assets/css/lesson-4.12-v2-core-a.css',BASE/'assets/css/lesson-4.12-v2-core-b.css',BASE/'assets/css/lesson-4.12-v2-responsive-ti84.css']
JS=[BASE/'assets/js/lesson-4.12-v2-interactions.js',BASE/'assets/js/lesson-4.12-v2-ti84.js']

def require(condition:bool,message:str)->None:
    if not condition: raise AssertionError(message)

def extract(path:Path,start:str,end:str):
    text=path.read_text('utf-8'); a=text.index(start)+len(start); b=text.index(end,a); return json.loads(text[a:b])

def walk_strings(value,path='root'):
    if isinstance(value,str): yield path,value
    elif isinstance(value,list):
        for i,item in enumerate(value): yield from walk_strings(item,f'{path}[{i}]')
    elif isinstance(value,dict):
        for key,item in value.items(): yield from walk_strings(item,f'{path}.{key}')

def normalized_prompt(value:str)->str:
    value=re.sub(r'<[^>]+>',' ',value.lower())
    value=re.sub(r'\\[a-zA-Z]+|[^a-z0-9]+',' ',value)
    return re.sub(r'\s+',' ',value).strip()

# Numerical Recipes style special functions, used only to verify published outputs.
def betacf(a,b,x):
    qab=a+b; qap=a+1; qam=a-1; c=1.0; d=1-qab*x/qap
    if abs(d)<3e-14:d=3e-14
    d=1/d; h=d
    for m in range(1,301):
        m2=2*m; aa=m*(b-m)*x/((qam+m2)*(a+m2)); d=1+aa*d; d=3e-14 if abs(d)<3e-14 else d; c=1+aa/c; c=3e-14 if abs(c)<3e-14 else c; d=1/d; h*=d*c
        aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2)); d=1+aa*d; d=3e-14 if abs(d)<3e-14 else d; c=1+aa/c; c=3e-14 if abs(c)<3e-14 else c; d=1/d; delta=d*c; h*=delta
        if abs(delta-1)<3e-14: break
    return h

def betai(a,b,x):
    if x<=0:return 0.0
    if x>=1:return 1.0
    bt=math.exp(math.lgamma(a+b)-math.lgamma(a)-math.lgamma(b)+a*math.log(x)+b*math.log1p(-x))
    return bt*betacf(a,b,x)/a if x<(a+1)/(a+b+2) else 1-bt*betacf(b,a,1-x)/b

def student_t_cdf(t,df):
    x=df/(df+t*t); ib=betai(df/2,0.5,x)
    return 0.5*ib if t<0 else 1-0.5*ib

def gammaincc(a,x):
    if x<0 or a<=0: raise ValueError
    if x<a+1:
        ap=a; term=1/a; total=term
        for _ in range(1,1000):
            ap+=1; term*=x/ap; total+=term
            if abs(term)<abs(total)*1e-15:break
        p=total*math.exp(-x+a*math.log(x)-math.lgamma(a)) if x else 0
        return 1-p
    b=x+1-a; c=1/3e-300; d=1/b; h=d
    for i in range(1,1000):
        an=-i*(i-a); b+=2; d=an*d+b; d=3e-300 if abs(d)<3e-300 else d; c=b+an/c; c=3e-300 if abs(c)<3e-300 else c; d=1/d; delta=d*c; h*=delta
        if abs(delta-1)<1e-15:break
    return math.exp(-x+a*math.log(x)-math.lgamma(a))*h

def chi2_sf(x,df): return gammaincc(df/2,x/2)

def main():
    files=[HTML,*CORE,*PRACTICE,ASSESS,*CSS,*JS]
    for path in files: require(path.is_file(),f'Missing {path.relative_to(ROOT)}')
    html=HTML.read_text('utf-8')
    order=['katex-global.js',* [p.name for p in CORE],* [p.name for p in PRACTICE],ASSESS.name,'engine.js',JS[0].name,JS[1].name]
    positions=[html.index(name) for name in order]
    require(positions==sorted(positions),'Script order must load all data before engine and enhancements after engine')
    require('lesson-4.12.js?v=1.0.0' not in html,'Legacy data bundle is still loaded')
    require('https://' not in html and 'http://' not in html,'Lesson HTML must remain static/offline safe')
    node=shutil.which('node');require(node,'Node.js is required for the modular release audit')
    script="global.window={};const fs=require('fs'),vm=require('vm');for(const f of process.argv.slice(1))vm.runInThisContext(fs.readFileSync(f,'utf8'),{filename:f});console.log(JSON.stringify(window.LESSON_DATA));"
    loaded=subprocess.run([node,'-e',script,*map(str,[*CORE,*PRACTICE,ASSESS])],check=True,capture_output=True,text=True)
    core=json.loads(loaded.stdout);practice=core['practice'];exam=core['exam'];quiz=core['quiz']
    require(core['schemaVersion']=='4.2.0' and core['version']=='2.0.0','Unexpected release version')
    require(core['lesson']['number']=='4.12','Wrong lesson number')
    require(len(core['slides'])==50,'Expected exactly 50 learning screens')
    require(len({s['id'] for s in core['slides']})==50,'Duplicate slide IDs')
    require(core['slides'][0]['id']=='launch-cover' and core['slides'][-1]['id']=='exit','Learning sequence boundaries changed')
    for slide in core['slides']:
        require(all(slide.get(k) for k in ('id','section','title','kind','html')),f'Incomplete slide {slide.get("id")}')
        require('{note(' not in slide['html'] and '{details(' not in slide['html'],f'Unresolved template marker in {slide["id"]}')
        for svg in re.findall(r'<svg\b[^>]*>',slide['html']): require('role="img"' in svg or 'aria-label=' in svg or 'aria-labelledby=' in svg,f'Unlabelled SVG in {slide["id"]}')
    all_data={'core':core,'practice':practice,'exam':exam,'quiz':quiz}
    for source,value in all_data.items():
        for path,text in walk_strings(value,source):
            bad=[ord(c) for c in text if ord(c)<32 and c not in '\n\r\t']
            require(not bad,f'Control character corruption in {path}: {bad}')
            require('\t' not in text or '\\t' in text,f'Unexpected tab in {path}')

    require(len(practice)==80,'Expected 80 practice questions')
    levels=Counter(q['level'] for q in practice); require(levels==Counter({'Foundation':16,'Application':16,'Reasoning':16,'Challenge':16,'HOT':16}),f'Bad level distribution {levels}')
    require(len({q['id'] for q in practice})==80,'Duplicate practice IDs')
    require(len({normalized_prompt(q['prompt']) for q in practice})==80,'Duplicate normalized practice prompts')
    type_counts=Counter(q['type'] for q in practice); require(type_counts['mcq']>=25 and type_counts['short']>=25 and type_counts['numeric']>=5,f'Insufficient response variety {type_counts}')
    for q in practice+quiz:
        require(q.get('prompt') and q.get('solution') and q.get('answer'),'Question missing prompt, solution, or answer')
        require(q.get('marks',0)>0 and q.get('calculator'),'Question metadata incomplete')
        if q['type']=='mcq': require(len(q['choices'])==4 and 0<=q['correct_index']<4,'Invalid MCQ structure')
        if q['type']=='numeric': require(isinstance(q['numeric_answer'],(int,float)) and q['tolerance']>=0,'Invalid numeric answer')
    require(len(exam)==3 and sum(t['total_marks'] for t in exam)==41,'Expected three connected tasks worth 41 marks')
    require(all(sum(p['marks'] for p in t['parts'])==t['total_marks'] for t in exam),'Exam part marks do not total correctly')
    require(len(quiz)==10 and len({q['id'] for q in quiz})==10,'Timed quiz must have 10 unique questions')

    # Recompute the three published calculator examples independently.
    x1,s1,n1=42.8,5.6,18; x2,s2,n2=47.1,6.2,20
    df=n1+n2-2; sp2=((n1-1)*s1*s1+(n2-1)*s2*s2)/df; t=(x1-x2)/math.sqrt(sp2*(1/n1+1/n2)); p_left=student_t_cdf(t,df)
    require(abs(t+2.234060717)<1e-9 and df==36,'Pooled t statistic or df is wrong')
    require(abs(p_left-0.0158904683)<2e-9,'One-sided pooled t p-value is wrong')
    observed=[[26,18,16],[15,29,16],[19,13,28]]; rows=[sum(r) for r in observed]; cols=[sum(observed[i][j] for i in range(3)) for j in range(3)]; total=sum(rows); expected=[[rows[i]*cols[j]/total for j in range(3)] for i in range(3)]; chi=sum((observed[i][j]-expected[i][j])**2/expected[i][j] for i in range(3) for j in range(3)); pchi=chi2_sf(chi,4)
    require(all(abs(v-20)<1e-12 for row in expected for v in row),'Independence expected matrix is wrong')
    require(abs(chi-14.6)<1e-12 and abs(pchi-0.00560697183)<2e-10,'Independence output is wrong')
    obs=[66,28,16,10]; exp=[48,36,24,12]; gof=sum((o-e)**2/e for o,e in zip(obs,exp)); pgof=chi2_sf(gof,3)
    require(abs(gof-11.5277777778)<1e-10 and abs(pgof-0.00918894353)<2e-10,'Goodness-of-fit output is wrong')

    combined='\n'.join(path.read_text('utf-8') for path in [HTML,*CSS,*JS,*CORE,*PRACTICE,ASSESS])
    require('ti84calc.com' not in combined and 'iframe' not in combined.lower(),'External calculator dependency detected')
    require(all(token in JS[1].read_text('utf-8') for token in ['2-SampTTest','χ²-Test','χ²GOF-Test','-2.234061','.00560697','.00918894']),'TI-84 workflow evidence is incomplete')
    for path in [*CORE,*PRACTICE,ASSESS,*JS]: subprocess.run([node,'--check',str(path)],check=True,capture_output=True,text=True)
    print(json.dumps({'lesson':'4.12','release':'2.0.0','slides':50,'practice':80,'practice_levels':dict(levels),'practice_types':dict(type_counts),'exam_tasks':3,'exam_marks':41,'quiz':10,'math_examples':{'pooled_t':round(t,9),'pooled_t_p_left':round(p_left,10),'chi_independence':round(chi,6),'chi_independence_p':round(pchi,10),'chi_gof':round(gof,6),'chi_gof_p':round(pgof,10)},'status':'PASS'},indent=2,ensure_ascii=False))

if __name__=='__main__':
    try: main()
    except Exception as exc:
        print(f'FAIL: {exc}',file=sys.stderr); raise
