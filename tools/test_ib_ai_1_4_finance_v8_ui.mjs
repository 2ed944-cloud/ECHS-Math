/* DOM interaction tests; no browser, network or real student account. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{parseHTML}=require(process.env.ECHS_TEST_DOM_MODULE||'linkedom');
const base=new URL('../lessons/ib-math-ai/unit-1/',import.meta.url),html=fs.readFileSync(new URL('lessons/IB_AI_SL_1.4_financial_models_ECHS.html',base),'utf8');
const {window:dom,document}=parseHTML(html);
Object.defineProperty(dom.HTMLSelectElement.prototype,'value',{configurable:true,get(){return this.querySelector('option[selected]')?.value??this.querySelector('option')?.value??'';},set(v){for(const o of this.querySelectorAll('option'))o.toggleAttribute('selected',o.value===String(v));}});
const storage=new Map(),legacy='echs:ib-ai:u1:1.4:state';storage.set(legacy,'old questions');
let account={id:'test-a'},failStorage=false,printed=false;
const events=new dom.EventTarget(),location={pathname:'/ECHS-Math/lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.4_financial_models_ECHS.html',search:'?course=ib-math-ai&lessonKey=test&accessKey=protected',hash:'#practice'};
const math=vm.createContext({window:{}});vm.runInContext(fs.readFileSync(new URL('assets/js/katex-global.js',base),'utf8'),math);
let equations=0;
const win={document,ECHSInstitution:{account:()=>account},FinanceLessonModels:require(new URL('data/lesson-1.4-finance-model-v8.js',base).pathname),FinanceLessonQuestions:require(new URL('data/lesson-1.4-finance-questions-v8.js',base).pathname),katex:{render(tex,node){math.window.katex.renderToString(tex,{throwOnError:true,strict:'ignore'});node.textContent=tex;equations++;}},addEventListener:events.addEventListener.bind(events),dispatchEvent:events.dispatchEvent.bind(events),print(){printed=true;}};
const scheduled=new Map();let timer=0;
const ctx=vm.createContext({window:win,document,location,history:{replaceState(_s,_t,url){const u=new URL(url,'https://example.test');assert.equal(u.search,location.search);location.hash=u.hash;}},localStorage:{getItem:k=>storage.get(k)||null,setItem(k,v){if(failStorage)throw Error('Denied');storage.set(k,v);}},setTimeout:fn=>{scheduled.set(++timer,fn);return timer;},clearTimeout:id=>scheduled.delete(id),console});
for(const file of ['labs','core'])vm.runInContext(fs.readFileSync(new URL('data/lesson-1.4-finance-'+file+'-v8.js',base),'utf8'),ctx);
const $=id=>document.getElementById(id),click=n=>n.dispatchEvent(new dom.Event('click',{bubbles:true}));
const input=(n,v,event='input')=>{n.value=String(v);n.dispatchEvent(new dom.Event(event,{bubbles:true}));};
const flush=()=>{const callbacks=[...scheduled.values()];scheduled.clear();callbacks.forEach(fn=>fn());};
const current=()=>document.querySelector('.slide:not([hidden])').id,key=(target,key)=>{const e=new dom.Event('keydown',{bubbles:true,cancelable:true});Object.defineProperty(e,'key',{value:key});target.dispatchEvent(e);};
const Q=win.FinanceLessonQuestions,M=win.FinanceLessonModels;
assert.equal(document.documentElement.dataset.financeLessonReady,'true');
assert.equal(current(),'practice-guide');assert.equal(document.querySelectorAll('.slide:not([hidden])').length,1);
for(const [hash,id] of [['#exam','short-s01'],['#quiz','check-final'],['#review','finish'],['#learn','start']]){location.hash=hash;win.dispatchEvent(new dom.Event('hashchange'));assert.equal(current(),id);}
key(document,'ArrowRight');assert.equal(current(),'roadmap');key($('answer-q01'),'ArrowRight');assert.equal(current(),'roadmap');
click(document.querySelector('[data-solution="q01"]'));assert.equal($('solution-q01').hidden,true);

const answers=Q.questions.map(q=>String(q.answer));
for(const [i,q] of Q.questions.entries()){input($('answer-'+q.id),answers[i]);click(document.querySelector('[data-check="'+q.id+'"]'));assert.match($('feedback-'+q.id).textContent,/Correct/);}
assert.equal($('correctCount').textContent,'28');
click(document.querySelector('[data-solution="q01"]'));assert.equal($('solution-q01').hidden,false);
for(const f of Q.frqs)for(const [i,p] of f.parts.entries()){
  const id=f.id+'-'+i;
  assert.equal($('score-'+id).querySelectorAll('option').length,p.marks+2);
  click(document.querySelector('[data-rubric="'+id+'"]'));assert.equal($('rubric-'+id).hidden,true);
  input($('draft-'+id),'My working includes the numerical setup, units and a justified conclusion.');
  click(document.querySelector('[data-rubric="'+id+'"]'));assert.equal($('rubric-'+id).hidden,false);
  input($('score-'+id),p.marks,'change');
}
assert.match($('frqSummary').textContent,/139 marks across 60 reviewed parts \(out of 139 available\)/);
input($('draft-s01-0'),'Revised response.');assert.equal($('rubric-s01-0').hidden,true);assert.equal($('score-s01-0').disabled,true);
input($('score-s01-0'),2,'change');assert.match($('frqSummary').textContent,/59 reviewed parts/,'A disabled score cannot be inserted');
for(const id of ['growth','frequency','present','rate','threshold','depreciation','inflation','loan','term','amortization','annuity']){
 assert.ok($(id+'-display').textContent.length>50,id);
 const host=document.querySelector('[data-lab="'+id+'"]'),control=host.querySelector('input');
 const original=control.value;input(control,'');assert.ok($(id+'-error').textContent);assert.equal($(id+'-display').textContent,'');input(control,original);assert.equal($(id+'-error').textContent,'');assert.ok($(id+'-display').textContent.length>50);
}
input($('growth-r'),0);assert.match($('growth-display').textContent,/0.00 larger/);
input($('frequency-k'),12,'change');assert.match($('frequency-display').textContent,/60 periods/);
input($('threshold-p'),1000);input($('threshold-f'),1331);input($('threshold-r'),10);input($('threshold-k'),1,'change');assert.match($('threshold-display').textContent,/First qualifying period: 3/);input($('threshold-strict'),1,'change');assert.match($('threshold-display').textContent,/First qualifying period: 4/);input($('threshold-r'),0);assert.match($('threshold-display').textContent,/No qualifying/);input($('threshold-p'),2000);assert.match($('threshold-display').textContent,/already met/);
input($('depreciation-d'),100);assert.ok($('depreciation-error').textContent);input($('depreciation-d'),15);
input($('inflation-f'),9);assert.match($('inflation-display').textContent,/percentage change: -/);
input($('loan-r'),0);input($('loan-k'),12,'change');assert.match($('loan-display').textContent,/375.00/);
input($('amortization-a'),40);assert.match($('amortization-display').textContent,/will not amortize/);input($('amortization-a'),250);
input($('annuity-k'),12,'change');input($('annuity-mode'),1,'change');assert.match($('annuity-display').textContent,/Required initial fund/);input($('annuity-mode'),0,'change');assert.match($('annuity-display').textContent,/Final savings balance/);
const setups=[{N:36,I:4.5,PV:-5000,PMT:0,PpY:12,CpY:12},{N:5,I:4,PMT:0,FV:8000,PpY:1,CpY:1},{N:3,PV:-4000,PMT:0,FV:4630.5,PpY:1,CpY:1},{I:3.6,PV:-5000,PMT:0,FV:7000,PpY:12,CpY:12},{N:48,I:6,PV:18000,FV:0,PpY:12,CpY:12},{N:36,I:4.8,PV:0,PMT:-200,PpY:12,CpY:12},{N:60,I:3.6,PMT:1200,FV:0,PpY:12,CpY:12}];
for(const [i,values] of setups.entries()){
 input($('nspire-case'),i,'change');click($('nspire-check'));assert.match($('nspire-feedback').textContent,/Check/);assert.equal($('nspire-result').textContent,'');
 for(const [k,v] of Object.entries(values))input($('nspire-'+k),v);
 click($('nspire-check'));assert.match($('nspire-feedback').textContent,/match the context/);assert.ok($('nspire-result').textContent.length>30);
 const k=Object.keys(values)[0];input($('nspire-'+k),'999');assert.equal($('nspire-result').textContent,'');click($('nspire-check'));assert.match($('nspire-feedback').textContent,/Check/);
}
click($('nspire-reset'));assert.equal($('nspire-result').textContent,'');
for(const svg of document.querySelectorAll('svg')){assert.ok(svg.getAttribute('aria-label'));assert.ok(svg.querySelector('title'));assert.doesNotMatch(svg.outerHTML,/NaN|Infinity/);}
assert.equal(document.querySelectorAll('.math-fallback').length,0);assert.ok(equations>100);
// Changing an answer invalidates correctness and locks its solution until it is checked again.
input($('answer-q01'),'1.04');assert.equal($('correctCount').textContent,'27');click(document.querySelector('[data-solution="q01"]'));assert.match($('feedback-q01').textContent,/Try the question first/);
input($('answer-q01'),'1.045');click(document.querySelector('[data-check="q01"]'));
flush();assert.equal(storage.get(legacy),'old questions');
assert.ok(storage.has('echs:ib-math-ai:1.4:ib-ai-sl-1-4-1-7-v8:test-a'));
// Switch immediately after typing: pending text must be saved for the old account.
input($('draft-s01-0'),'A last edit before switching accounts.');account={id:'test-b'};win.dispatchEvent(new dom.Event('focus'));assert.equal($('answer-q01').value,'');assert.equal($('draft-s01-0').value,'');assert.equal($('solution-q01').hidden,true);
account={id:'test-a'};win.dispatchEvent(new dom.Event('focus'));assert.equal($('answer-q01').value,'1.045');assert.equal($('draft-s01-0').value,'A last edit before switching accounts.');
failStorage=true;input($('answer-q01'),'1.045');click(document.querySelector('[data-check="q01"]'));assert.match(document.querySelector('.save-note').textContent,/unavailable/);failStorage=false;
click($('printLesson'));assert.ok(printed);
click($('resetWork'));click($('cancelReset'));assert.equal($('answer-q01').value,'1.045');click($('resetWork'));click($('confirmReset'));assert.equal($('answer-q01').value,'');assert.match($('attemptedCount').textContent,/^0/);assert.equal(storage.get(legacy),'old questions');
key(document,'End');assert.equal(current(),'alignment');key(document,'Home');assert.equal(current(),'start');
let continued=false;const finish=document.createElement('button');finish.dataset.finishLesson='';finish.addEventListener('click',()=>continued=true);document.body.append(finish);click($('continuePractice'));assert.ok(continued);
const ids=[...document.querySelectorAll('[id]')].map(n=>n.id);assert.equal(new Set(ids).size,ids.length);for(const n of document.querySelectorAll('[aria-controls]'))assert.ok($(n.getAttribute('aria-controls')));for(const n of document.querySelectorAll('[data-go]'))assert.ok($(n.dataset.go));
console.log('Merged IB finance UI: PASS — 12 investigations, seven TI-Nspire setups, 28 checks, 60 markscheme parts, KaTeX, account isolation, denied storage, printing and protected progression.');
