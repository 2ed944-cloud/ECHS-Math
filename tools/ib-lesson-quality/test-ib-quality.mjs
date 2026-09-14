// Controlled DOM/component evidence, not a native browser or remote grading test.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const { parseHTML } = require(process.env.ECHS_TEST_DOM_MODULE || 'linkedom');
const arg = name => { const i=process.argv.indexOf(name); return i<0?null:process.argv[i+1]; };
const repo=path.resolve(arg('--repo') || '.');
assert.ok(arg('--baseline-root'),'Supply --baseline-root containing the five pinned original source paths');
const baseline=path.resolve(arg('--baseline-root'));
const baselinePins=JSON.parse(fs.readFileSync(new URL('./baseline-pins.json',import.meta.url),'utf8'));
const dataPath='lessons/ib-math-ai/unit-1/data/lesson-1.5-exponents-logarithms-definitive-v6.js';
const enginePath='lessons/ib-math-ai/unit-1/assets/js/engine.js';
const graphPath='lessons/ib-math-ai/unit-1/data/lesson-1.6-technology-v6-interactions.js';
const gdcPath='lessons/ib-math-ai/unit-1/data/unit-1-gdc-classroom-training-v8.js';
const text=(kind,p)=>fs.readFileSync(path.join(kind==='original'?baseline:repo,p),'utf8');
const plain=value=>JSON.parse(JSON.stringify(value));
function lesson(kind='source') {
  const window={LESSON_DATA:{lesson:{number:'1.5'}}};
  vm.runInNewContext(text(kind,dataPath),{window,console});
  return plain(window.LESSON_DATA);
}
const original=lesson('original'), updated=lesson();
const checks=[];
function test(name,body){try{body();checks.push({name,status:'PASS'});}catch(error){checks.push({name,status:'FAIL',error:error.stack});}}
const sha=b=>createHash('sha256').update(b).digest('hex');
test('01 five originals match exact baseline pins; updated source paths are present',()=>{
  assert.equal(baselinePins.baseline_main,'dcc65f84dafd2dc5cb4518ea03d18b4087ddf4ff');assert.equal(baselinePins.files.length,5);
  for(const row of baselinePins.files){
    const bytes=fs.readFileSync(path.join(baseline,row.path));assert.equal(bytes.length,row.bytes);assert.equal(sha(bytes),row.sha256);
    assert.ok(fs.readFileSync(path.join(repo,row.path)).length>0);
  }
});
test('02 all 73 screens,96 practice,14 quiz,5 written tasks and original answer payloads retained',()=>{
  for(const [key,n] of [['slides',73],['practice',96],['quiz',14],['exam',5]]){
    assert.equal(updated[key].length,n);
    assert.deepEqual(updated[key].map(x=>x.id),original[key].map(x=>x.id));
    for(let i=0;i<n;i++)for(const field of ['answer','solution','check','correct','choices','parts'])assert.deepEqual(updated[key][i][field],original[key][i][field]);
  }
  assert.deepEqual(updated.slides.map(s=>s.title),original.slides.map(s=>s.title),'later patches find original titles');
});
test('03 exact core12/optional2 quiz partition covers every original ID once',()=>{
  assert.deepEqual(updated.quizScopes.map(s=>[s.id,s.questionIds.length]),[['core',12],['extension',2]]);
  assert.deepEqual(updated.quizScopes[1].questionIds,['ELV6-1.5-Q01','ELV6-1.5-Q12']);
  assert.deepEqual(updated.quizScopes.flatMap(s=>s.questionIds).sort(),original.quiz.map(q=>q.id).sort());
});
test('04 visible rational/log-law labels and mixed-screen optional subparts',()=>{
  for(const n of [21,22,23,24,25,26,27,42,45,46,47,67]){
    assert.equal(updated.slides[n-1].scope.kind,'extension');
    assert.match(updated.slides[n-1].html,/Optional extension/);
  }
  for(const [n,part] of [[4,'B'],[28,'B'],[68,'A'],[73,'1']])assert.ok(updated.slides[n-1].html.includes(`<b>${part} · optional extension</b>`));
  for(const id of ['F08','A02','A15','A16','A17','C12','C13','C14']){
    const item=updated.practice.find(x=>x.id==='ELV6-1.5-'+id);
    assert.equal(item.scope.kind,'extension');assert.match(item.prompt,/Optional extension/);
  }
});
test('05 rational identity gives positive-base condition and negative-base restriction',()=>{
  assert.match(updated.slides[20].html,/positive base a, an integer m and a positive integer n/);
  assert.match(updated.slides[20].html,/negative base, reduce the fractional exponent/);
  assert.equal(Math.cbrt(-8),-2);assert.equal(64**(1/6),2);
});
test('06 optional fluency label makes no no-calculator paper claim',()=>{
  for(const key of ['practice','quiz','exam'])for(const item of updated[key])assert.notEqual(item.calculator,'No calculator');
  assert.match(updated.exam[0].style,/Optional extension/);
  assert.doesNotMatch(updated.exam[0].style,/Paper 1/i);
  assert.match(updated.assessmentDesign.calculatorPolicy,/both AI SL papers/);
  assert.equal(updated.lesson.curriculum_version,'ib-ai-sl-first-assessment-2021');
});
test('07 later visual patches still match titles and preserve extension labels',()=>{
  const window={LESSON_DATA:structuredClone(updated)};
  for(const name of ['lesson-1.5-product-law-visual-v6-0-1.js','lesson-1.5-visual-clarity-v6-0-2.js']){
    vm.runInNewContext(fs.readFileSync(path.join(repo,'lessons/ib-math-ai/unit-1/data',name),'utf8'),{window,console});
  }
  assert.match(window.LESSON_DATA.slides[6].html,/same base/);
  assert.match(window.LESSON_DATA.slides[35].html,/el-log-condition-grid-v602/);
  assert.match(window.LESSON_DATA.slides[44].html,/Optional extension/);
});
function storage(seed={}){
  const obj={...seed};
  Object.defineProperties(obj,{
    getItem:{value:k=>obj[k]??null},setItem:{value:(k,v)=>{obj[k]=String(v);}},removeItem:{value:k=>{delete obj[k];}}
  });return obj;
}
const ids=['app','lesson-footer','prev-slide','next-slide','open-map','slide-drawer','drawer-list','drawer-backdrop','close-map','progress-fill','progress-label','header-lesson-title','header-unit-title','lesson-home'];
function engine(data,{kind='source',route='quiz',saved={},math=false}={}){
  const {document,window:dom}=parseHTML('<html><body>'+ids.map(id=>`<div id="${id}"></div>`).join('')+['learn','practice','exam','quiz','review'].map(r=>`<button class="route-btn" data-route="${r}">${r}</button>`).join('')+'</body></html>');
  // Math typesetting is deliberately outside these event/state tests.
  const mathCalls=[];
  document.createTreeWalker=(root,_what,filter)=>{
    if(!math)return {nextNode:()=>null};
    const nodes=[];const visit=n=>{for(const child of n.childNodes){if(child.nodeType===3&&filter.acceptNode(child)===1)nodes.push(child);visit(child);}};visit(root);let i=0;
    return {currentNode:null,nextNode(){this.currentNode=nodes[i++]||null;return this.currentNode;}};
  };
  const timers=new Map(),callbacks=new Map(),observers=[];let timerId=0;
  const localStorage=storage(saved),location={hash:'#'+route};
  const window={LESSON_DATA:structuredClone(data),localStorage,katex:{renderToString:(s,options)=>{mathCalls.push({s,options});return math?'<span class="katex">'+s.replace(/[&<>]/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[x]))+'</span>':s;}},scrollTo(){},addEventListener(type,fn){callbacks.set(type,fn);}};
  class Observer{constructor(fn){this.fn=fn;observers.push(this);}observe(){}disconnect(){}}
  class FixedDate extends Date{constructor(...args){super(...(args.length?args:[1800000000000]));}static now(){return 1800000000000;}}
  const context=vm.createContext({window,document,localStorage,location,history:{replaceState(_a,_b,hash){location.hash=hash;}},NodeFilter:{SHOW_TEXT:4,FILTER_REJECT:2,FILTER_ACCEPT:1},console,Date:FixedDate,confirm:()=>true,setInterval:fn=>{timers.set(++timerId,fn);return timerId;},clearInterval:id=>timers.delete(id),MutationObserver:Observer,getComputedStyle:n=>n.style,requestAnimationFrame:fn=>fn(),setTimeout:fn=>{fn();return 1;},matchMedia:()=>({matches:false})});
  vm.runInContext(text(kind,enginePath),context);
  const fire=(selector,type='click')=>{const node=document.querySelector(selector);assert.ok(node,selector);node.dispatchEvent(new dom.Event(type,{bubbles:true}));};
  return {document,window,context,localStorage,timers,mathCalls,fire,route(r){location.hash='#'+r;callbacks.get('hashchange')();},patchV5(){vm.runInContext(fs.readFileSync(path.join(repo,'lessons/ib-math-ai/unit-1/data/unit-1-v5-runtime.js'),'utf8'),context);},html:()=>document.querySelector('#app').innerHTML};
}
const prefix='echs:ib-ai:u1:1.5:';
test('08 default core renders actual12 IDs with no optional question and truthful later runtime counts',()=>{
  const h=engine(updated);assert.equal(h.document.querySelectorAll('[data-quiz-index]').length,12);
  assert.match(h.html(),/Question 1 of 12/);assert.match(h.html(),/SL core and applications · 12 questions/);
  assert.ok(!h.document.querySelector('.question-prompt').textContent.includes('64'));
  h.patchV5();assert.match(h.html(),/SL core and applications · 12 questions/);assert.doesNotMatch(h.html(),/14-question|All 14 questions/);
});
test('09 switching scopes/reloading preserves exact responses and workspace IDs',()=>{
  const h=engine(updated);
  const radio=h.document.querySelector('input[name="quiz-choice"]');radio.setAttribute('checked','');h.fire('input[name="quiz-choice"]','change');
  const note=h.document.querySelector('#quiz-workspace');note.value='Retained core reasoning';h.fire('#quiz-workspace','input');
  h.fire('[data-quiz-scope="extension"]');assert.match(h.html(),/Question 1 of 2/);
  h.document.querySelector('#quiz-response').value='0.0625';h.fire('#quiz-response','input');h.fire('#quiz-check');
  h.fire('[data-quiz-scope="core"]');assert.equal(h.document.querySelector('#quiz-workspace').value,'Retained core reasoning');
  const answers=JSON.parse(h.localStorage.getItem(prefix+'quiz-answers'));
  assert.equal(answers['ELV6-1.5-Q02'],'0');assert.equal(answers['ELV6-1.5-Q01'],'0.0625');
  const reloaded=engine(updated,{saved:h.localStorage});
  reloaded.fire('[data-quiz-scope="extension"]');assert.equal(reloaded.document.querySelector('#quiz-response').value,'0.0625');
  assert.equal(reloaded.timers.size,1);
});
test('10 current totals and review exclude extension/foreign IDs from core score',()=>{
  const results={'ELV6-1.5-Q02':{attempted:true,correct:true},'ELV6-1.5-Q01':{attempted:true,correct:true},'ELV6-1.5-Q12':{attempted:true,correct:true},foreign:{attempted:true,correct:true}};
  const h=engine(updated,{saved:{[prefix+'quiz-results']:JSON.stringify(results)}});
  assert.match(h.document.querySelector('.route-header').textContent,/1 correct · 1 attempted/);
  h.fire('[data-quiz-scope="extension"]');assert.match(h.document.querySelector('.route-header').textContent,/2 correct · 2 attempted/);
  h.route('review');const cards=[...h.document.querySelectorAll('.stat-card')];
  assert.match(cards.find(c=>c.querySelector('span')?.textContent==='SL core quiz').textContent,/1\/12/);
  assert.match(cards.find(c=>c.querySelector('span')?.textContent==='Optional extension').textContent,/2\/2/);
  assert.match(h.html(),/optional; excluded from core quiz score/);
});
test('11 restarting selected scope retains other responses and does not award results on reveal',()=>{
  const rows={'ELV6-1.5-Q02':{attempted:true,correct:true},'ELV6-1.5-Q01':{attempted:true,correct:true}};
  const h=engine(updated,{saved:{[prefix+'quiz-results']:JSON.stringify(rows),[prefix+'quiz-answers']:JSON.stringify({'ELV6-1.5-Q02':'0','ELV6-1.5-Q01':'0.0625'})}});
  const before=h.localStorage.getItem(prefix+'quiz-results');h.fire('#quiz-hint');h.fire('#quiz-solution');assert.equal(h.localStorage.getItem(prefix+'quiz-results'),before);
  h.fire('#restart-quiz');const after=JSON.parse(h.localStorage.getItem(prefix+'quiz-results'));
  assert.deepEqual(after,{'ELV6-1.5-Q01':rows['ELV6-1.5-Q01']});
  h.fire('[data-quiz-scope="extension"]');assert.equal(h.document.querySelector('#quiz-response').value,'0.0625');
});
test('12 unconfigured lessons retain exact visible behavior and storage in all five routes',()=>{
  const data=structuredClone(original);data.lesson.number='1.2';
  for(const route of ['learn','quiz','review','practice','exam']){
    const a=engine(data,{kind:'original',route}),b=engine(data,{route});
    const normalize=s=>s.replace(/>\s+</g,'><').trim();
    assert.equal(normalize(b.html()),normalize(a.html()),route);
    assert.deepEqual({...b.localStorage},{...a.localStorage},route);
    assert.equal(b.document.querySelectorAll('[data-quiz-scope]').length,0);
  }
});
test('13 missing/duplicate/foreign IDs and incomplete scope coverage fail before quiz selection',()=>{
  for(const mutate of [x=>x.quizScopes[0].questionIds.pop(),x=>x.quizScopes[0].questionIds[0]=x.quizScopes[1].questionIds[0],x=>x.quizScopes[0].questionIds[0]='foreign',x=>x.quizScopes[0].id='wrong']){
    const data=structuredClone(updated);mutate(data);assert.throws(()=>engine(data),/Invalid lesson quiz scopes/);
  }
});
function graph(kind='source'){
  const {document,window:dom}=parseHTML('<html><body><div data-te-lab="system"></div></body></html>');
  const root=document.querySelector('[data-te-lab]');
  vm.runInNewContext(text(kind,graphPath),{document,window:{LESSON_DATA:{lesson:{number:'1.6'}}},MutationObserver:class{observe(){}},requestAnimationFrame:fn=>fn()});
  return {root,set(m,b,m2=-1,b2=3){for(const [key,value] of Object.entries({m1:m,b1:b,m2,b2}))root.querySelector(`[data-field="${key}"]`).value=String(value);root.querySelector('[data-field="m1"]').dispatchEvent(new dom.Event('input'));},points(selector='.line-one'){
    const d=root.querySelector(selector).getAttribute('d');assert.match(d,/^M .* L /);
    const a=d.match(/[-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi).map(Number);
    return [[(a[0]-42)/486*12-6,(294-a[1])/252*12-6],[(a[2]-42)/486*12-6,(294-a[3])/252*12-6]];
  }};
}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('14 actual steep positive path represents y=4x+5, not the old clamped chord',()=>{
  const h=graph();h.set(4,5);const p=h.points();near(p[0][0],-2.75);near(p[0][1],-6);near(p[1][0],.25);near(p[1][1],6);
  for(const [x,y] of p)near(y,4*x+5);
  const old=graph('original');old.set(4,5);assert.ok(old.points().some(([x,y])=>Math.abs(y-4*x-5)>1));
});
test('15 negative gradients, horizontal lines and complete legal slider grid stay on the true line',()=>{
  const h=graph();
  for(let mi=-16;mi<=16;mi++)for(let bi=-10;bi<=10;bi++){
    const m=mi/4,b=bi/2;h.set(m,b);
    const p=h.points();assert.ok(p[0][0]<=p[1][0]);
    for(const [x,y] of p){assert.ok(x>=-6-1e-9&&x<=6+1e-9&&y>=-6-1e-9&&y<=6+1e-9);near(y,m*x+b);}
    const x=(p[0][0]+p[1][0])/2,y=(p[0][1]+p[1][1])/2;near(y,m*x+b);
  }
  assert.equal(h.root.querySelector('[data-field="m1"]').getAttribute('max'),'4','slope-intercept model does not claim vertical-line support');
});
test('16 intersection marker lies on both lines and outside-window unique solutions remain unique',()=>{
  const h=graph();h.set(4,5,-1,3);
  const marker=h.root.querySelector('.intersection');
  const x=(Number(marker.getAttribute('cx'))-42)/486*12-6,y=(294-Number(marker.getAttribute('cy')))/252*12-6;
  near(x,-.4);near(y,3.4);near(y,4*x+5);near(y,-x+3);
  h.set(.25,5,0,-5);assert.match(h.root.querySelector('.te-lab-result').textContent,/Unique solution/);assert.equal(marker.style.display,'none');
  h.set(1,1,1,-2);assert.match(h.root.querySelector('.te-lab-result').textContent,/Inconsistent/);
  h.set(1,1,1,1);assert.match(h.root.querySelector('.te-lab-result').textContent,/Dependent/);
});
function gdc(number,kind='source'){
  const {document,window:dom}=parseHTML('<html><body><button class="gdc-v7-open">Open</button><div class="gdc-v7-shell"><div class="gdc-v7-workspace"></div></div></body></html>');
  // Linkedom does not implement the browser's select.value setter.
  const prototype=Object.getPrototypeOf(document.createElement('select'));
  const descriptor=Object.getOwnPropertyDescriptor(prototype,'value');
  Object.defineProperty(prototype,'value',{configurable:true,get(){return this.querySelector('option[selected]')?.getAttribute('value')||'0';},set(value){this.querySelectorAll('option').forEach(n=>{if(n.getAttribute('value')===String(value))n.setAttribute('selected','');else n.removeAttribute('selected');});}});
  const window={LESSON_DATA:structuredClone(updated)};window.LESSON_DATA.lesson.number=number;
  try{
    const context=vm.createContext({window,document,MutationObserver:class{observe(){}},setTimeout:fn=>fn()});
    // The actual later visual patches still run before the separate GDC layer.
    if(number==='1.5')for(const name of ['lesson-1.5-product-law-visual-v6-0-1.js','lesson-1.5-visual-clarity-v6-0-2.js'])vm.runInContext(fs.readFileSync(path.join(repo,'lessons/ib-math-ai/unit-1/data',name),'utf8'),context);
    vm.runInContext(text(kind,gdcPath),context);
    document.querySelector('.gdc-v7-open').dispatchEvent(new dom.Event('click',{bubbles:true}));
    const select=document.querySelector('.gdc8-select');
    const result=[];
    if(select)for(let i=0;i<select.querySelectorAll('option').length;i++){
      select.value=String(i);select.dispatchEvent(new dom.Event('change'));result.push(document.querySelector('.gdc8-body').innerHTML);
    }
    return {cards:result,data:window.LESSON_DATA};
  }finally{if(descriptor)Object.defineProperty(prototype,'value',descriptor);else delete prototype.value;}
}
test('17 actual composed GDC cards show optional method/extension labels with original task mathematics',()=>{
  const h=gdc('1.5'),old=gdc('1.5','original');assert.equal(h.cards.length,5);
  for(const [i,label] of [[0,'optional change-of-base derivation'],[1,'optional AHL 1.9 manual method'],[3,'Optional extension · AHL 1.9 logarithm laws']])assert.ok(h.cards[i].includes(label));
  for(let i=0;i<5;i++){
    const withoutGroup=s=>s.replace(/<div class="gdc8-tags">[\s\S]*?<\/div>/,'');
    assert.equal(withoutGroup(h.cards[i]),withoutGroup(old.cards[i]));
  }
  assert.equal(h.data.quiz.length,14);assert.deepEqual(h.data.quizScopes,updated.quizScopes);
  assert.match(h.data.slides[44].html,/Optional extension/);
});
test('18 unrelated GDC lesson cards remain unchanged',()=>{
  for(const number of ['1.1','1.2','1.3','1.4','1.6'])assert.deepEqual(gdc(number).cards,gdc(number,'original').cards,number);
});

test('19 math-only bridge uses the existing renderer with trustfalse and preserves scores/timers',()=>{
  const h=engine(updated,{math:true}),root=h.document.createElement('section');root.innerHTML='<p>Formula \\(x^2\\)</p><textarea>\\(private input\\)</textarea><input value="\\(not math\\)">';h.document.body.append(root);
  const storageBefore={...h.localStorage},timerBefore=[...h.timers.keys()],before=h.mathCalls.length;
  assert.equal(typeof h.window.ECHSIBLessonRenderMath,'function');h.window.ECHSIBLessonRenderMath(root);
  assert.equal(root.querySelectorAll('.katex').length,1);assert.equal(h.mathCalls.length,before+1);assert.equal(h.mathCalls.at(-1).s,'x^2');assert.equal(h.mathCalls.at(-1).options.trust,false);
  assert.deepEqual({...h.localStorage},storageBefore);assert.deepEqual([...h.timers.keys()],timerBefore);
  h.window.ECHSIBLessonRenderMath(root);assert.equal(h.mathCalls.length,before+1,'idempotent existing rendered math');
  const foreign=parseHTML('<html><body><p>\\(foreign\\)</p></body></html>').document.querySelector('p');
  for(const invalid of [undefined,null,h.document,foreign])h.window.ECHSIBLessonRenderMath(invalid);
  assert.equal(h.mathCalls.length,before+1,'only same-document elements are eligible');
});
const v7Path='lessons/ib-math-ai/unit-1/data/unit-1-gdc-integration-v7.js';
function renderer(kind,p){const code=text(kind,p);if(p===v7Path)return code.slice(code.indexOf('  const renderMath = root => {'),code.indexOf('  const dialogHtml',code.indexOf('  const renderMath = root => {')));return code.slice(code.indexOf('function renderMath(root){'),code.indexOf('function normalized',code.indexOf('function renderMath(root){')));}
for(const p of [v7Path,gdcPath])test((p===v7Path?'20':'21')+' actual GDC math routing preserves auto-render and falls back once with trustfalse',()=>{
  const code=renderer('source',p),root={id:'owned-panel'},auto=[],fallback=[];
  const window={renderMathInElement:(...args)=>auto.push(args),ECHSIBLessonRenderMath:node=>fallback.push(node)};
  const run=()=>vm.runInNewContext(code+';renderMath(root);',{window,root});run();
  assert.equal(auto.length,1);assert.equal(auto[0][0],root);assert.equal(auto[0][1].trust,false);assert.equal(auto[0][1].throwOnError,false);assert.equal(fallback.length,0);
  delete window.renderMathInElement;run();assert.deepEqual(fallback,[root]);
  delete window.ECHSIBLessonRenderMath;assert.doesNotThrow(run);
  window.renderMathInElement=()=>{throw Error('renderer-error')};assert.doesNotThrow(run);
});
test('22 fifth source preserves all prompts/cards outside the exact renderMath function',()=>{
  assert.equal(text('source',v7Path).replace(renderer('source',v7Path),()=>renderer('original',v7Path)),text('original',v7Path));
});

const report={contract:'echs.ib-next.component-tests.v1',scope:'Controlled DOM, actual source execution and mathematical representation checks; no native browser or remote acceptance',status:checks.every(x=>x.status==='PASS')?'PASS':'FAIL',tests:checks.length,failed:checks.filter(x=>x.status==='FAIL').length,checks,source_files:baselinePins.files.map(({path:p})=>({path:p,sha256:sha(fs.readFileSync(path.join(repo,p)))}))};
if(arg('--report'))fs.writeFileSync(path.resolve(arg('--report')),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
process.exitCode=report.failed?1:0;
