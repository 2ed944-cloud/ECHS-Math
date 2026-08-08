"""Release checks for the packed IB Mathematics AI SL Lesson 2.6 V5."""
from __future__ import annotations
import json,math,subprocess
from ib_ai_2_6_v5_pack_support import ROOT,DATA,HTML,LOADER,archive,sources,node,regression,browser_boot

def test_verified_pack_and_html_contract():
    m,p=archive(); html=HTML.read_text()
    assert m['format']==p['format']=='echs-ib-ai-2.6-v5-source-pack'
    assert m['version']==p['version']=='5.0.0' and m['chunkCount']==11
    assert p['counts']=={'slides':96,'practice':80,'quiz':12,'exam':6,'visuals':74}
    refs=[f'lesson-2.6-v5-pack-{i:02d}.js' for i in range(11)]+['lesson-2.6-v5-loader.js']
    assert [html.index(x) for x in refs]==sorted(html.index(x) for x in refs)
    assert html.index('lesson-2.6.js')<html.index(refs[0])
    for route in ('learn','practice','exam','quiz','review'): assert f'data-route="{route}"' in html
    assert 'aria-label="Lesson routes"' in html and 'aria-pressed="false"' in html


def test_payload_module_order_and_javascript_syntax(tmp_path):
    _,p=archive(); s=sources(p)
    assert list(s)==[
      'css/lesson-2.6-v5-core.css','css/lesson-2.6-v5-responsive-ti84.css',
      'data/lesson-2.6-v5-build.js','data/lesson-2.6-v5-content-a.js',
      'data/lesson-2.6-v5-content-b.js','data/lesson-2.6-v5-finalize.js',
      'data/lesson-2.6-v5-graphics.js','data/lesson-2.6-v5-interactions.js','data/lesson-2.6-v5-ti84.js']
    js=[(name,text) for name,text in s.items() if name.endswith('.js')]
    js += [(LOADER.name,LOADER.read_text())]
    js += [(f.name,f.read_text()) for f in sorted(DATA.glob('lesson-2.6-v5-pack-*.js'))]
    for name,text in js:
        path=tmp_path/name.rsplit('/',1)[-1]; path.write_text(text)
        subprocess.run(['node','--check',str(path)],check=True,capture_output=True,text=True)


def test_built_lesson_counts_ids_labs_and_ti_routes():
    _,p=archive(); before=[x['source'] for x in p['beforeEngine']]
    code=f"""
const fs=require('fs'),vm=require('vm');const c={{window:{{}},console}};c.globalThis=c;vm.createContext(c);
vm.runInContext(fs.readFileSync({json.dumps(str(DATA/'lesson-2.6.js'))},'utf8'),c);
const old={{p:c.window.LESSON_DATA.practice.map(x=>x.id),q:c.window.LESSON_DATA.quiz.map(x=>x.id),e:c.window.LESSON_DATA.exam.map(x=>x.id)}};
for(const src of {json.dumps(before)})vm.runInContext(src,c);const d=c.window.LESSON_DATA;
const ids=r=>[...new Set(d.slides.flatMap(s=>[...s.html.matchAll(r)].map(m=>m[1])))];
console.log(JSON.stringify({{counts:d.counts,p:d.practice.map(x=>x.id),q:d.quiz.map(x=>x.id),e:d.exam.map(x=>x.id),old,
visuals:ids(/data-rv5-visual=\"([^\"]+)\"/g),labs:ids(/data-rv5-lab=\"([^\"]+)\"/g),ti:ids(/data-rv5-ti-workflow=\"([^\"]+)\"/g),audit:d.audit,last:d.slides.at(-1).title}}));
"""
    out=json.loads(node(code))
    assert out['counts']=={'slides':96,'practice':80,'quiz':12,'exam':6}
    assert out['p'][:60]==out['old']['p'] and out['q']==out['old']['q'] and out['e'][:3]==out['old']['e']
    assert out['p'][-20:]==[f'IBAI-2.6-V5-P{i}' for i in range(61,81)]
    assert out['e'][-3:]==['U2-2.6-V5-T4','U2-2.6-V5-T5','U2-2.6-V5-T6']
    assert len(out['visuals'])==74 and out['labs']==['outlier-influence','model-compare']
    assert out['ti']==['lists-scatter','linreg-diagnostics','residual-plot','quadratic-compare','exponential-regression','stored-prediction','outlier-sensitivity']
    assert out['audit']['legacyAssessmentIdsPreserved'] and out['last']=='Model validation exit ticket'


def test_all_svg_factories_render_cleanly():
    _,p=archive(); graphics=sources(p)['data/lesson-2.6-v5-graphics.js']
    code=f"""
const vm=require('vm');const c={{window:{{LESSON_DATA:{{lesson:{{number:'2.6'}}}}}},document:{{readyState:'loading',addEventListener(){{}}}},MutationObserver:function(){{}},console}};c.globalThis=c;vm.createContext(c);vm.runInContext({json.dumps(graphics)},c);
const g=c.window.ECHS_RV5_GRAPHICS,rendered=g.factoryIds.map(id=>g.renderById(id));
console.log(JSON.stringify({{n:g.factoryIds.length,bad:rendered.filter(x=>!/role=\"img\"/.test(x)||/NaN|undefined|Infinity/.test(x)).length,svgOnly:g.svgOnly,purpose:g.allPurposeBuilt}}));
"""
    out=json.loads(node(code)); assert out=={'n':74,'bad':0,'svgOnly':True,'purpose':True}


def test_runtime_calculator_labs_and_responsive_contract():
    _,p=archive(); s=sources(p); ti=s['data/lesson-2.6-v5-ti84.js']; inter=s['data/lesson-2.6-v5-interactions.js']
    for token in ('[STAT]','[2nd] [Y=]','9:ZoomStat','DiagnosticOn','4:LinReg(ax+b)','5:QuadReg','0:ExpReg','RESID','Y₁(7.5)'): assert token in ti
    assert 'https://ti84calc.com/ti84calc' in ti and 'manualFirst:true' in ti and 'diagnosticSpaceWarning:true' in ti
    for token in ('function linearRegression','sxy/sxx','1-sse/syy','data-influence-range','modelEvidence','localStorage'): assert token in inter
    core=s['css/lesson-2.6-v5-core.css']; responsive=s['css/lesson-2.6-v5-responsive-ti84.css']
    for selector in ('.rv5-cover','.rv5-worked','.rv5-influence-lab','.rv5-ti-dock','.rv5-ti-overlay'): assert selector in core
    assert '@media (max-width:760px)' in responsive and '@media print' in responsive and 'prefers-reduced-motion' in responsive


def test_loader_verifies_before_execution_and_fails_clearly():
    text=LOADER.read_text(); m,_=archive()
    for value in (m['compressedSha256'],m['payloadSha256'],"crypto.subtle.digest('SHA-256'","DecompressionStream('gzip')",'payload.beforeEngine.forEach(evaluate)','katex-global.js','engine.js?v=2.0.0','payload.afterEngine.forEach(evaluate)','Lesson resources could not be verified'): assert value in text


def test_published_regression_values():
    a,b,r2,e=regression(list(range(1,9)),[52,57,61,65,72,74,80,84])
    assert math.isclose(a,4.583333333333333) and math.isclose(b,47.5) and math.isclose(r2,.9948320413436695)
    assert all(math.isclose(x,y,abs_tol=1e-12) for x,y in zip(e,[-1/12,1/3,-1/4,-5/6,19/12,-1,5/12,-1/6]))
    assert math.isclose(a*7.5+b,81.875)
    all_fit=regression([1,2,3,4,5,6,7],[12,15,19,22,25,29,45])
    base=regression([1,2,3,4,5,6],[12,15,19,22,25,29])
    assert math.isclose(all_fit[0],4.75) and math.isclose(base[0],3.3714285714285714)
    x=list(range(7)); y=[120,150,188,238,300,376,475]; la,lb,tr2,_=regression(x,[math.log(v) for v in y]); A=math.exp(lb); B=math.exp(la)
    pred=[A*B**v for v in x]; original=1-sum((u-v)**2 for u,v in zip(y,pred))/sum((u-sum(y)/len(y))**2 for u in y)
    assert math.isclose(A,119.42786853593662) and math.isclose(B,1.2582726993623459)
    assert math.isclose(tr2,.9999514327973145) and math.isclose(original,.9999644073811916)


def test_loader_boots_verified_archive_in_browser_like_runtime():
    out=browser_boot(); assert out['verified'] and out['counts']['slides']==96 and len(out['modules'])==9
