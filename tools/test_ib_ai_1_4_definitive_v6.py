#!/usr/bin/env python3
"""Structural, mathematical and integration checks for IB AI SL Lesson 1.4 v6."""
from __future__ import annotations
import json,re,subprocess,sys
from collections import Counter
from pathlib import Path

ROOT=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
U1=Path('lessons/ib-math-ai/unit-1')
HTML=U1/'lessons/IB_AI_SL_1.4_financial_models_ECHS.html'
DATA=[
 U1/'data/lesson-1.4.js',U1/'data/lesson-1.4-v3.js',
 U1/'data/unit-1-v5-content-data.js',U1/'data/unit-1-v5-apply.js',
 U1/'data/lesson-1.4-financial-v6-foundations.js',
 U1/'data/lesson-1.4-financial-v6-cashflows.js',
 U1/'data/lesson-1.4-financial-v6-practice.js',
 U1/'data/lesson-1.4-financial-v6-assessment.js',
 U1/'data/lesson-1.4-financial-v6-polish.js',
]
INTERACTIONS=U1/'data/lesson-1.4-financial-v6-interactions.js'
PAGER=U1/'data/lesson-1.2-exam-focus-v6.js'
CSS=[
 U1/'assets/css/lesson-1.4-financial-v6-core.css',
 U1/'assets/css/lesson-1.4-financial-v6-models.css',
 U1/'assets/css/lesson-1.4-financial-v6-interactive.css',
]
errors=[]

def read(path:Path)->str:
    full=ROOT/path
    if not full.is_file():errors.append(f'Missing file: {path}');return ''
    return full.read_text(encoding='utf-8',errors='replace')

html=read(HTML);css='\n'.join(read(path) for path in CSS);interactions=read(INTERACTIONS);pager=read(PAGER)
for path in (*DATA,INTERACTIONS,U1/'data/lesson-1.6-technology-renumber-v6.js'):
    result=subprocess.run(['node','--check',str(ROOT/path)],text=True,capture_output=True)
    if result.returncode:errors.append(f'JavaScript syntax failure in {path}: {result.stderr.strip()}')

assets=(
 'lesson-1.4-financial-v6-core.css?v=6.0.0','lesson-1.4-financial-v6-models.css?v=6.0.0',
 'lesson-1.4-financial-v6-interactive.css?v=6.0.0','lesson-1.4-financial-v6-foundations.js?v=6.0.0',
 'lesson-1.4-financial-v6-cashflows.js?v=6.0.0','lesson-1.4-financial-v6-practice.js?v=6.0.0',
 'lesson-1.4-financial-v6-assessment.js?v=6.0.0','lesson-1.4-financial-v6-polish.js?v=6.0.0',
 'lesson-1.4-financial-v6-interactions.js?v=6.0.0','lesson-1.2-exam-focus-v6.js?v=6.0.0'
)
for marker in assets:
    if marker not in html:errors.append(f'Wrapper missing asset: {marker}')
if not (html.index('lesson-1.4-financial-v6-foundations.js')<html.index('lesson-1.4-financial-v6-cashflows.js')<html.index('lesson-1.4-financial-v6-practice.js')<html.index('lesson-1.4-financial-v6-assessment.js')<html.index('lesson-1.4-financial-v6-polish.js')<html.index('../assets/js/engine.js')<html.index('lesson-1.4-financial-v6-interactions.js')):
    errors.append('Lesson data, audit layer, engine and interactions load order is invalid')
if html.index('lesson-1.4-financial-v6-interactive.css')>html.index('katex.css'):
    errors.append('Canonical KaTeX CSS must load after lesson CSS')
for forbidden in (r'\.katex[^\{]*span',r'\.katex-display[^\{]*span',r'display\s*:\s*revert'):
    if re.search(forbidden,css):errors.append(f'Destructive KaTeX CSS pattern: {forbidden}')

program=f"""
const fs=require('fs'),vm=require('vm');
const files={json.dumps([str(path) for path in DATA])};
const sandbox={{window:{{}},console}};sandbox.window.window=sandbox.window;vm.createContext(sandbox);
for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{{filename:file}});
const d=sandbox.window.LESSON_DATA;if(!d)throw new Error('LESSON_DATA missing');
process.stdout.write(JSON.stringify({{
 version:d.version,title:d.lesson.title,number:d.lesson.number,slides:d.slides,
 practice:d.practice,quiz:d.quiz,exam:d.exam,audit:d.v6Audit,practiceAudit:d.financialPracticeAudit
}}));
"""
result=subprocess.run(['node','-e',program],cwd=ROOT,text=True,capture_output=True)
if result.returncode:errors.append(f'Lesson assembly failure: {result.stderr.strip()}');data={}
else:
    try:data=json.loads(result.stdout)
    except json.JSONDecodeError as exc:errors.append(f'Invalid assembled JSON: {exc}');data={}

if data.get('version')!='6.0.0':errors.append(f"Version mismatch: {data.get('version')!r}")
if data.get('title')!='Financial Applications' or data.get('number')!='1.4':errors.append('Lesson identity is not 1.4 Financial Applications')
slides=data.get('slides',[]);practice=data.get('practice',[]);quiz=data.get('quiz',[]);exam=data.get('exam',[])
for label,items,expected in (('slides',slides,100),('practice',practice,120),('quiz',quiz,16),('exam',exam,6)):
    if len(items)!=expected:errors.append(f'Expected {expected} {label}; found {len(items)}')
for label,items,key in (('slide titles',slides,'title'),('practice IDs',practice,'id'),('quiz IDs',quiz,'id'),('exam IDs',exam,'id')):
    values=[item.get(key) for item in items]
    if len(values)!=len(set(values)):errors.append(f'Duplicate {label}: {[v for v,c in Counter(values).items() if c>1]}')
levels=Counter(item.get('level') for item in practice)
if levels!=Counter({'Foundation':30,'Application':30,'Reasoning':30,'Challenge':30}):errors.append(f'Practice distribution mismatch: {dict(levels)}')
if data.get('practiceAudit',{}).get('total')!=120:errors.append('Practice audit total is stale')

required_titles=(
 'A cash-flow timeline prevents most finance errors','Simple interest is arithmetic change',
 'Compound interest is geometric change','Nominal annual rate is not the periodic rate',
 'Effective annual rate compares different compounding conventions','Reducing-balance depreciation is compound decay',
 'Real value discounts nominal money by inflation','Derive the future value of an ordinary annuity',
 'Future value of an annuity due','Present value of an ordinary annuity',
 'TVM variables encode a cash-flow equation','Derive the loan-payment formula from annuity present value',
 'Amortization is a balance recurrence','Retrospective balance looks back from the original loan',
 'Prospective balance looks forward to remaining payments','Interactive compound-interest explorer',
 'Interactive annuity and loan explorer','Generative Financial Studio','Integrated IB-style financial decision',
 'Extension bridge · growing annuities','Mastery routes and transition to logarithms'
)
titles=[item.get('title') for item in slides]
for title in required_titles:
    if title not in titles:errors.append(f'Missing required screen: {title}')
if titles and titles[-1]!='Mastery routes and transition to logarithms':errors.append('Mastery/transition screen must close the core lesson')
if sum(item.get('section')=='Extension' for item in slides)!=1:errors.append('Expected one clearly labelled growing-annuity extension screen')
joined='\n'.join(item.get('html','') for item in slides)
for marker in ('data-fin-compound-explorer','data-fin-cashflow-explorer','data-fin-generator','PV=R','B_k=B_{k-1}','r_{\\mathrm{eff}}'):
    if marker not in joined:errors.append(f'Required content marker missing: {marker}')
if '<svg' in joined.lower():errors.append('Inline SVG found in lesson graphics')

for task in exam:
    labels=[part.get('label') for part in task.get('parts',[])]
    if len(labels)!=len(set(labels)):errors.append(f"Duplicate part labels in {task.get('id')}")
    total=sum(part.get('marks',0) for part in task.get('parts',[]))
    if total!=task.get('total_marks'):errors.append(f"Mark mismatch in {task.get('id')}: {total} != {task.get('total_marks')}")
expected_marks={
 'FINV6-1.4-E01':(13,[2,2,3,2,2,2]),'FINV6-1.4-E02':(14,[2,3,3,2,3,1]),
 'FINV6-1.4-E03':(16,[3,2,3,2,3,2,1]),'FINV6-1.4-E04':(15,[3,3,3,3,2,1]),
 'FINV6-1.4-E05':(14,[2,3,3,2,2,2]),'FINV6-1.4-E06':(16,[2,3,1,3,4,3])
}
for item in exam:
    actual=(item.get('total_marks'),[part.get('marks') for part in item.get('parts',[])])
    if expected_marks.get(item.get('id'))!=actual:errors.append(f"Unexpected task structure for {item.get('id')}: {actual}")

practice_prompts={re.sub(r'\s+',' ',str(item.get('prompt',''))).strip().lower() for item in practice}
for item in quiz:
    if re.sub(r'\s+',' ',str(item.get('prompt',''))).strip().lower() in practice_prompts:errors.append(f"Quiz prompt duplicates Practice Studio: {item.get('id')}")
core_prompts='\n'.join(str(item.get('prompt','')) for item in practice+quiz)+'\n'+'\n'.join(str(task.get('context',''))+' '+' '.join(str(part.get('prompt','')) for part in task.get('parts',[])) for task in exam)
if 'growing annuit' in core_prompts.lower():errors.append('Growing-annuity extension leaked into core assessment')

math_pattern=re.compile(r'\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]')
sources=[]
for item in slides:sources.append((f"slide {item.get('title')}",item.get('html','')))
for group,items in (('practice',practice),('quiz',quiz)):
    for item in items:
        for field in ('prompt','answer','solution'):sources.append((f"{group} {item.get('id')} {field}",str(item.get(field,'') or '')))
for item in exam:
    sources.append((f"exam {item.get('id')} context",str(item.get('context',''))))
    for part in item.get('parts',[]):
        for field in ('prompt','answer','markscheme'):sources.append((f"exam {item.get('id')} {part.get('label')} {field}",str(part.get(field,'') or '')))
for label,source in sources:
    for segment in math_pattern.findall(source):
        if '<' in segment or '>' in segment:errors.append(f'Raw comparison character in math: {label}')

for marker in ('data-fin-compound-explorer','data-fin-cashflow-explorer','data-fin-generator','factories','initCompound','initCashFlow','initGenerator'):
    if marker not in interactions:errors.append(f'Interaction layer missing: {marker}')
for marker in ('exam-task-tabs','exam-part-tabs','exam-step-footer-nav','exam-task-index'):
    if marker not in pager:errors.append(f'Focused assessment pager missing: {marker}')

audit=data.get('audit') or {}
for flag in (
 'unifiedFinancialApplications','mergedLegacyLoansAnnuities','approximationRemainsInLesson11','cashFlowTimelines',
 'nominalPeriodicEffectiveRates','compoundInterest','depreciationInflationRealValue','ordinaryAnnuity','annuityDue',
 'withdrawalAnnuity','loanPayments','amortization','outstandingBalances','extraPaymentStrategies',
 'interactiveCompoundExplorer','interactiveCashFlowExplorer','generativeStudio','focusedAssessmentPager','noInlineSvg',
 'growingAnnuityExtensionExcludedFromCore','independentNumericalReaudit','correctedPeriodConversionExamples',
 'correctedDepreciationExamples','correctedRealValueExamples','correctedAnnuityExamples',
 'correctedSavingsThresholdValues','correctedOutstandingBalanceExamples','correctedExitTicketValues'
):
    if audit.get(flag) is not True:errors.append(f'Audit flag not true: {flag}')

spot_slides={
 'Student turn · match rates to periods':['10145.04','31084.63'],
 'Worked example · replacement threshold':['17795.51','14592.32'],
 'Student turn · inflation-adjusted decisions':['23,651.79','20,691.02'],
 'Student turn · ordinary annuity future value':['33,545.60'],
 'Worked example · least number of monthly deposits':['38125.56','38656.65'],
 'Student turn · loan balance':['1,137.78','37,849.32'],
 'Independent exit ticket':['42,404.75','1,422.22']
}
by_title={item.get('title'):item for item in slides}
for title,needles in spot_slides.items():
    body=str(by_title.get(title,{}).get('html',''))
    for needle in needles:
        if needle not in body:errors.append(f'Numerical spot check failed in {title}: {needle}')

redirects={
 U1/'lessons/IB_AI_SL_1.6_approximation_error_ECHS.html':'IB_AI_SL_1.1_standard_form_ECHS.html',
 U1/'lessons/IB_AI_SL_1.7_loans_annuities_ECHS.html':'IB_AI_SL_1.4_financial_models_ECHS.html',
 U1/'lessons/IB_AI_SL_1.8_technology_equations_ECHS.html':'IB_AI_SL_1.6_technology_equations_ECHS.html'
}
for path,target in redirects.items():
    body=read(path)
    if target not in body or 'location.replace' not in body:errors.append(f'Legacy redirect invalid: {path}')
tech=read(U1/'lessons/IB_AI_SL_1.6_technology_equations_ECHS.html')
for marker in ('lesson-1.8.js','lesson-1.8-v3.js','lesson-1.6-technology-renumber-v6.js','1.6 · Technology for Equations and Systems'):
    if marker not in tech:errors.append(f'Canonical renumbered technology wrapper missing: {marker}')

print('IB AI SL Lesson 1.4 Financial Applications v6 validation')
print(f'Root: {ROOT}')
print(f'Errors: {len(errors)}')
for error in errors:print(f'  ERROR: {error}')
if errors:raise SystemExit(1)
print('Status: PASS')
