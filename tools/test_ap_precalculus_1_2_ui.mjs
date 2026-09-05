/* Interaction tests without a browser, network or real student account. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{parseHTML}=require(process.env.ECHS_TEST_DOM_MODULE||'linkedom');
const base=new URL('../lessons/ap-precalculus/unit-1/',import.meta.url),html=fs.readFileSync(new URL('AP_Precalculus_1.2_Rates_of_Change_ECHS_Refined.html',base),'utf8');
const {window:dom,document}=parseHTML(html);
Object.defineProperty(dom.HTMLSelectElement.prototype,'value',{configurable:true,get(){return this.querySelector('option[selected]')?.value??this.querySelector('option')?.value??'';},set(v){for(const o of this.querySelectorAll('option'))o.toggleAttribute('selected',o.value===String(v));}});
const storage=new Map(),legacy='echs-ap-precalculus-1.2-old-state';storage.set(legacy,'old progress');
let account={id:'test-a'},failStorage=false,printed=false;
const events=new dom.EventTarget(),location={pathname:'/ECHS-Math/lessons/ap-precalculus/unit-1/AP_Precalculus_1.2_Rates_of_Change_ECHS_Refined.html',search:'?course=ap-precalculus&lessonKey=test&accessKey=protected',hash:'#practice'};
const math=vm.createContext({window:{}});vm.runInContext(fs.readFileSync(new URL('../../ib-math-ai/unit-1/assets/js/katex-global.js',base),'utf8'),math);
let equations=0;
const win={document,ECHSInstitution:{account:()=>account},RatesModels:require(new URL('assets/rates-1-2-model-v3.js',base).pathname),RatesQuestions:require(new URL('assets/rates-1-2-questions-v3.js',base).pathname),katex:{render(tex,node){math.window.katex.renderToString(tex,{throwOnError:true,strict:'ignore'});node.textContent=tex;equations++;}},addEventListener:events.addEventListener.bind(events),dispatchEvent:events.dispatchEvent.bind(events),print(){printed=true;}};
const scheduled=new Map();let timer=0;
const ctx=vm.createContext({window:win,document,location,history:{replaceState(_s,_t,url){const u=new URL(url,'https://example.test');assert.equal(u.search,location.search);location.hash=u.hash;}},localStorage:{getItem(k){if(failStorage)throw Error('Denied');return storage.get(k)||null;},setItem(k,v){if(failStorage)throw Error('Denied');storage.set(k,v);}},setTimeout:fn=>{scheduled.set(++timer,fn);return timer;},clearTimeout:id=>scheduled.delete(id),console});
for(const file of ['graphs','labs','core'])vm.runInContext(fs.readFileSync(new URL('assets/rates-1-2-'+file+'-v3.js',base),'utf8'),ctx);
const $=id=>document.getElementById(id),click=n=>{assert.ok(n,'Missing click target');n.dispatchEvent(new dom.Event('click',{bubbles:true}));};
const input=(n,v,event='input')=>{assert.ok(n,'Missing input');n.value=String(v);n.dispatchEvent(new dom.Event(event,{bubbles:true}));};
const choose=(id,value)=>{const n=document.querySelector('input[name="answer-'+id+'"][value="'+value+'"]');for(const r of document.querySelectorAll('input[name="answer-'+id+'"]')){r.checked=r===n;r.toggleAttribute('checked',r===n);}input(n,value);};
const flush=()=>{const callbacks=[...scheduled.values()];scheduled.clear();callbacks.forEach(fn=>fn());};
const current=()=>document.querySelector('.slide:not([hidden])').id,key=(target,key)=>{const e=new dom.Event('keydown',{bubbles:true,cancelable:true});Object.defineProperty(e,'key',{value:key});target.dispatchEvent(e);};
const Q=win.RatesQuestions,M=win.RatesModels;
assert.equal(document.documentElement.dataset.ratesLessonReady,'true');assert.equal(current(),'practice-guide');
assert.equal(document.querySelectorAll('.slide:not([hidden])').length,1);
for(const [hash,id] of [['#exam','frq01'],['#mini-frq','frq01'],['#corner-warning','corner-lab'],['#symbolic-worked','challenge-mcq-3'],['#review','finish'],['#learn','start']]){location.hash=hash;win.dispatchEvent(new dom.Event('hashchange'));assert.equal(current(),id);}
key(document,'ArrowRight');assert.equal(current(),'roadmap');
for(const target of [$('answer-q01'),$('slideSelect'),$('lab-secant-a'),$('draft-frq01-0'),$('nextSlide')]){key(target,'ArrowRight');assert.equal(current(),'roadmap');}
click(document.querySelector('[data-solution="q01"]'));assert.equal($('solution-q01').hidden,true);
for(const q of Q.questions){if(q.type==='number')input($('answer-'+q.id),q.answer);else choose(q.id,q.answer);click(document.querySelector('[data-check="'+q.id+'"]'));assert.match($('feedback-'+q.id).textContent,/Correct/,q.id);}
assert.equal($('correctCount').textContent,'38');assert.equal($('attemptedCount').textContent,'38 / 38');
click(document.querySelector('[data-solution="ap01"]'));assert.equal($('solution-ap01').hidden,false);
choose('ap01',0);assert.equal($('solution-ap01').hidden,true);assert.equal($('correctCount').textContent,'37');
click(document.querySelector('[data-solution="ap01"]'));assert.equal($('solution-ap01').hidden,true);
click(document.querySelector('[data-check="ap01"]'));assert.doesNotMatch($('feedback-ap01').textContent,/Correct/);
choose('ap01',1);click(document.querySelector('[data-check="ap01"]'));
input($('answer-q08'),'');click(document.querySelector('[data-check="q08"]'));assert.match($('feedback-q08').textContent,/Enter or select/);
input($('answer-q08'),'zero');click(document.querySelector('[data-check="q08"]'));assert.match($('feedback-q08').textContent,/complete finite/);
input($('answer-q08'),'0');click(document.querySelector('[data-check="q08"]'));
for(const f of Q.frqs)for(const [i,p] of f.parts.entries()){
  const id=f.id+'-'+i;assert.equal($('score-'+id).querySelectorAll('option').length,4);
  click(document.querySelector('[data-rubric="'+id+'"]'));assert.equal($('rubric-'+id).hidden,true);
  input($('draft-'+id),'My response shows the endpoint quotient, units, and a justified comparison.');
  click(document.querySelector('[data-rubric="'+id+'"]'));assert.equal($('rubric-'+id).hidden,false);input($('score-'+id),p.marks,'change');
}
assert.match($('frqSummary').textContent,/36 points across 18 reviewed parts \(out of 36 available\)/);
input($('draft-frq01-0'),'Revised tank interpretation.');assert.equal($('rubric-frq01-0').hidden,true);assert.equal($('score-frq01-0').disabled,true);
input($('score-frq01-0'),2,'change');assert.match($('frqSummary').textContent,/17 reviewed parts/);
const setting=(name,key,value)=>input($('lab-'+name+'-'+key),value,$('lab-'+name+'-'+key).type==='range'?'input':'change');
const prediction=(name,key,value)=>input($('lab-'+name+'-'+key),value);
const correct=name=>{click($('lab-'+name+'-check'));assert.match($('lab-'+name+'-feedback').textContent,/Correct/,name);click($('lab-'+name+'-reveal'));assert.equal($('lab-'+name+'-work').hidden,false);};
for(const [a,b,change,rate] of [[0,2,100,50],[2,5,90,30],[5,8,-60,-20],[0,5,190,38],[5,2,-90,30],[0,8,130,16.25]]){setting('tank','a',a);setting('tank','b',b);prediction('tank','change',change);prediction('tank','answer',rate);correct('tank');}
setting('tank','a',2);setting('tank','b',2);assert.equal($('lab-tank-check').disabled,true);assert.match($('lab-tank-display').textContent,/distinct inputs/);click($('lab-tank-check'));assert.doesNotMatch($('lab-tank-feedback').textContent,/Correct/);
for(const [model,a,b,answer] of [['quadratic',1,4,2],['quadratic',4,1,2],['quadratic',0,2,-1],['falling',-1,5,-2]]){setting('secant','model',model);setting('secant','a',a);setting('secant','b',b);prediction('secant','answer',answer);correct('secant');}
setting('secant','a',1);setting('secant','b',1);assert.equal($('lab-secant-check').disabled,true);assert.match($('lab-secant-display').textContent,/zero-width/i);assert.equal($('lab-secant-display').querySelectorAll('.moving-point').length,1);
for(const model of ['flat','hump','valley']){setting('zero','model',model);prediction('zero','answer',0);prediction('zero','constant',model==='flat'?'yes':'no');correct('zero');}
for(const [model,a,b,winner] of [['tank',50,30,'A'],['people',25,20,'A'],['cooling',-4,-3,'B']]){setting('unequal','model',model);prediction('unequal','aRate',a);prediction('unequal','bRate',b);prediction('unequal','answer',winner);correct('unequal');}
for(const c of [1,2,3])for(const h of [1,.5,.1,.01]){setting('local','c',c);setting('local','h',h);prediction('local','left',2*c-h);prediction('local','right',2*c+h);prediction('local','answer',2*c);correct('local');}
for(const model of ['cube','falling'])for(const h of [.5,.1,.01]){setting('compare','model',model);setting('compare','h',h);prediction('compare','aRate',model==='cube'?3+h*h:-2);prediction('compare','bRate',model==='cube'?12+h*h:-6);prediction('compare','answer',model==='cube'?'B':'A');prediction('compare','magnitude','B');correct('compare');}
for(const c of [1,3])for(const h of [.5,.1,.01]){setting('shared','c',c);setting('shared','h',h);prediction('shared','answer',2);prediction('shared','greater',c===1?'curve':'line');correct('shared');}
for(const model of ['corner','smooth'])for(const h of [1,.5,.1,.01]){setting('corner','model',model);setting('corner','h',h);prediction('corner','left',model==='corner'?-1:-h);prediction('corner','right',model==='corner'?1:h);prediction('corner','answer',model==='smooth'?'yes':'no');correct('corner');}
for(const [i,answer] of ['-9.569','-13.348','-13.333','-3.333'].entries()){setting('calculator','model',i);prediction('calculator','answer',answer);correct('calculator');}
for(const [h,dp,answer] of [[1,1,.05],[.5,1,0],[.1,2,0],[.01,2,0],[.1,4,.04],[.01,4,.04],[.01,6,.04]]){setting('precision','h',h);setting('precision','dp',dp);prediction('precision','answer',answer);prediction('precision','claim','no');correct('precision');}
prediction('precision','answer','999');assert.doesNotMatch($('lab-precision-feedback').textContent,/Correct/);assert.equal($('lab-precision-work').hidden,true);
for(const el of document.querySelectorAll('[data-rates-plot]'))assert.ok(el.querySelector('svg'),'Unrendered graph: '+el.dataset.ratesPlot);
for(const svg of document.querySelectorAll('svg')){assert.ok(svg.getAttribute('aria-label'));assert.doesNotMatch(svg.outerHTML,/NaN|Infinity/);}
assert.ok(document.querySelector('[data-rates-plot="shared"] path.curve[style="stroke:#a26714"][stroke-dasharray]'),'Shared CSS must not erase the gold graph color');
assert.equal(document.querySelectorAll('.math-fallback').length,0);assert.ok(equations>100);
flush();assert.equal(storage.get(legacy),'old progress');assert.ok(storage.has('echs:ap-precalculus:1.2:ap-precalculus-topic-1-2-v3:test-a'));
// Preserve a last edit even if the account changes before the debounce timer.
input($('draft-frq01-0'),'Last edit before switching accounts.');
account={id:'test-b'};win.dispatchEvent(new dom.Event('focus'));assert.equal($('answer-q01').value,'');assert.equal($('draft-frq01-0').value,'');
account={id:'test-a'};win.dispatchEvent(new dom.Event('focus'));assert.equal($('answer-q01').value,'90');assert.equal($('draft-frq01-0').value,'Last edit before switching accounts.');
failStorage=true;input($('answer-q01'),'90');click(document.querySelector('[data-check="q01"]'));assert.match(document.querySelector('.save-note').textContent,/unavailable/);failStorage=false;
click($('printLesson'));assert.ok(printed);click($('resetWork'));click($('cancelReset'));assert.equal($('answer-q01').value,'90');click($('resetWork'));click($('confirmReset'));assert.equal($('answer-q01').value,'');assert.match($('attemptedCount').textContent,/^0/);
key(document,'End');assert.equal(current(),'alignment');key(document,'Home');assert.equal(current(),'start');
let continued=false;const finish=document.createElement('button');finish.dataset.finishLesson='';finish.addEventListener('click',()=>continued=true);document.body.append(finish);click($('continuePractice'));assert.ok(continued);
const ids=[...document.querySelectorAll('[id]')].map(n=>n.id);assert.equal(new Set(ids).size,ids.length);for(const n of document.querySelectorAll('[aria-controls]'))assert.ok($(n.getAttribute('aria-controls')));
const css=fs.readFileSync(new URL('assets/rates-1-2-v3.css',base),'utf8');assert.match(css,/@media print\{\.solution,\.rubric,\.hint,\.feedback/);assert.match(css,/@media\(max-width:650px\)/);
// Execute the legacy redirect and verify the protected URL survives.
const legacyHTML=fs.readFileSync(new URL('../1-2-rates-of-change.html',base),'utf8');
let destination='';const link={};const legacyLocation={href:'https://example.test/ECHS-Math/lessons/ap-precalculus/1-2-rates-of-change.html?accessKey=keep&course=ap-precalculus#mini-frq',search:'?accessKey=keep&course=ap-precalculus',hash:'#mini-frq',replace(url){destination=url;}};
vm.runInNewContext(legacyHTML.match(/<script>([\s\S]*?)<\/script>/)[1],{URL,location:legacyLocation,document:{getElementById(){return link;}}});
assert.equal(new URL(destination).search,legacyLocation.search);assert.equal(new URL(destination).hash,'#mini-frq');assert.equal(link.href,destination);
console.log('AP Precalculus 1.2 UI: PASS (10 labs, 38 checks, 18 scoring parts, equations, zero-width safety, account isolation, edit invalidation, legacy redirects and protected progression).');
