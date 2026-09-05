/* DOM interaction tests; no browser, network or real student account. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{parseHTML}=require(process.env.ECHS_TEST_DOM_MODULE||'linkedom');
const base=new URL('../lessons/ib-math-ai/unit-1/',import.meta.url),html=fs.readFileSync(new URL('lessons/IB_AI_SL_1.1_standard_form_ECHS.html',base),'utf8');
const {window:dom,document}=parseHTML(html);
Object.defineProperty(dom.HTMLSelectElement.prototype,'value',{configurable:true,get(){return this.querySelector('option[selected]')?.value??this.querySelector('option')?.value??'';},set(v){for(const o of this.querySelectorAll('option'))o.toggleAttribute('selected',o.value===String(v));}});
const storage=new Map(),legacy='echs:ib-ai:u1:1.1:state';storage.set(legacy,'old questions');
let account={id:'test-a'},failStorage=false,printed=false;
const events=new dom.EventTarget(),location={pathname:'/ECHS-Math/lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.1_standard_form_ECHS.html',search:'?course=ib-math-ai&lessonKey=test&accessKey=protected',hash:'#practice'};
const math=vm.createContext({window:{}});vm.runInContext(fs.readFileSync(new URL('assets/js/katex-global.js',base),'utf8'),math);
let equations=0;
const win={document,ECHSInstitution:{account:()=>account},PrecisionLessonModels:require(new URL('data/lesson-1.1-merged-model-v7.js',base).pathname),PrecisionLessonQuestions:require(new URL('data/lesson-1.1-merged-questions-v7.js',base).pathname),katex:{render(tex,node){math.window.katex.renderToString(tex,{throwOnError:true,strict:'ignore'});node.textContent=tex;equations++;}},addEventListener:events.addEventListener.bind(events),dispatchEvent:events.dispatchEvent.bind(events),print(){printed=true;}};
const scheduled=new Map();let timer=0;
const ctx=vm.createContext({window:win,document,location,history:{replaceState(_s,_t,url){const u=new URL(url,'https://example.test');assert.equal(u.search,location.search);location.hash=u.hash;}},localStorage:{getItem:k=>storage.get(k)||null,setItem(k,v){if(failStorage)throw Error('Denied');storage.set(k,v);}},setTimeout:fn=>{scheduled.set(++timer,fn);return timer;},clearTimeout:id=>scheduled.delete(id),console});
for(const file of ['labs','core'])vm.runInContext(fs.readFileSync(new URL('data/lesson-1.1-merged-'+file+'-v7.js',base),'utf8'),ctx);
const $=id=>document.getElementById(id),click=n=>n.dispatchEvent(new dom.Event('click',{bubbles:true}));
const input=(n,v,event='input')=>{n.value=String(v);n.dispatchEvent(new dom.Event(event,{bubbles:true}));};
const flush=()=>{const callbacks=[...scheduled.values()];scheduled.clear();callbacks.forEach(fn=>fn());};
const current=()=>document.querySelector('.slide:not([hidden])').id,key=(target,key)=>{const e=new dom.Event('keydown',{bubbles:true,cancelable:true});Object.defineProperty(e,'key',{value:key});target.dispatchEvent(e);};
const Q=win.PrecisionLessonQuestions,M=win.PrecisionLessonModels;
assert.equal(document.documentElement.dataset.precisionLessonReady,'true');
assert.equal(current(),'practice-guide');assert.equal(document.querySelectorAll('.slide:not([hidden])').length,1);
for(const [hash,id] of [['#exam','short-s01'],['#quiz','check-final'],['#review','finish'],['#learn','start']]){location.hash=hash;win.dispatchEvent(new dom.Event('hashchange'));assert.equal(current(),id);}
key(document,'ArrowRight');assert.equal(current(),'roadmap');key($('answer-q01'),'ArrowRight');assert.equal(current(),'roadmap');
click(document.querySelector('[data-solution="q01"]'));assert.equal($('solution-q01').hidden,true);
const answers=['7.25 x 10^-5','3080000','1.92 x 10^3','4.95 x 10^6','6.20','0.00451','4','8.35','3.605','2.4','10','210'];
for(const [i,q] of Q.questions.entries()){input($('answer-'+q.id),answers[i]);click(document.querySelector('[data-check="'+q.id+'"]'));assert.match($('feedback-'+q.id).textContent,/Correct/);}
assert.equal($('correctCount').textContent,'12');
input($('answer-q02'),'3.08e6');click(document.querySelector('[data-check="q02"]'));assert.match($('feedback-q02').textContent,/ordinary decimal number/);
input($('answer-q02'),'3080000');click(document.querySelector('[data-check="q02"]'));
input($('answer-q05'),'6.2');click(document.querySelector('[data-check="q05"]'));assert.match($('feedback-q05').textContent,/exactly 2 decimal places/);assert.equal($('correctCount').textContent,'11');
input($('answer-q05'),'6.20');click(document.querySelector('[data-check="q05"]'));
click(document.querySelector('[data-solution="q01"]'));assert.equal($('solution-q01').hidden,false);
for(const f of Q.frqs)for(const [i,p] of f.parts.entries()){
  const id=f.id+'-'+i;
  assert.equal($('score-'+id).querySelectorAll('option').length,p.marks+2);
  click(document.querySelector('[data-rubric="'+id+'"]'));assert.equal($('rubric-'+id).hidden,true);
  input($('draft-'+id),'My working includes the numerical setup, units and a justified conclusion.');
  click(document.querySelector('[data-rubric="'+id+'"]'));assert.equal($('rubric-'+id).hidden,false);
  input($('score-'+id),p.marks,'change');
}
assert.match($('frqSummary').textContent,/82 points across 46 reviewed parts \(out of 82 available\)/);
input($('draft-s01-0'),'Revised response.');assert.equal($('rubric-s01-0').hidden,true);assert.equal($('score-s01-0').disabled,true);
input($('score-s01-0'),2,'change');assert.match($('frqSummary').textContent,/45 reviewed parts/,'A disabled score cannot be inserted');
const cases={normalize:['7.25 x 10^-5','5.24 x 10^6','4.8 x 10^-3'],operations:['1.92 x 10^3','4.2 x 10^-8','4.95 x 10^6','4.8 x 10^4'],rounding:['0.00507','6.20','0.0100','2.68'],bounds:[['8.35','8.45'],['3.595','3.605'],['745','755']],error:['1.75','1.75','3.44'],calculator:['40000','210','1.75']};
for(const [name,values] of Object.entries(cases))for(const [i,result] of values.entries()){
  input($('lab-'+name+'-model'),i,'change');assert.equal($('lab-'+name+'-feedback').textContent,'');
  input($('lab-'+name+'-answer'),Array.isArray(result)?result[0]:result);
  if(Array.isArray(result))input($('lab-'+name+'-upper'),result[1]);
  click($('lab-'+name+'-check'));assert.match($('lab-'+name+'-feedback').textContent,/Correct/,name+' '+i);
  click($('lab-'+name+'-explain'));assert.equal($('lab-'+name+'-work').hidden,false);
  input($('lab-'+name+'-answer'),'999');assert.doesNotMatch($('lab-'+name+'-feedback').textContent,/Correct/);
}
for(const dp of [1,2,3,4,6]){input($('lab-guard-digits'),dp,'change');input($('lab-guard-answer'),'210');click($('lab-guard-check'));assert.match($('lab-guard-feedback').textContent,/Correct/);}
for(const [op,lo,hi] of [['sum','8.8','9'],['difference','1.4','1.6'],['product','18.7975','19.6875'],['quotient','103/75','105/73']]){
  input($('lab-calculated-op'),op,'change');input($('lab-calculated-answer'),lo);input($('lab-calculated-upper'),hi);click($('lab-calculated-check'));assert.match($('lab-calculated-feedback').textContent,/Correct/);click($('lab-calculated-explain'));assert.ok($('lab-calculated-work').querySelector('svg'));
}
input($('lab-bounds-sample'),0);assert.match($('lab-bounds-display').textContent,/is inside/);
input($('lab-bounds-sample'),100);assert.match($('lab-bounds-display').textContent,/is outside/);
for(const svg of document.querySelectorAll('svg')){assert.ok(svg.getAttribute('aria-label'));assert.doesNotMatch(svg.outerHTML,/NaN|Infinity/);}
assert.equal(document.querySelectorAll('.math-fallback').length,0);assert.ok(equations>100);
flush();assert.equal(storage.get(legacy),'old questions');
assert.ok(storage.has('echs:ib-math-ai:1.1:ib-ai-sl-1-1-1-6-v7:test-a'));
account={id:'test-b'};win.dispatchEvent(new dom.Event('focus'));assert.equal($('answer-q01').value,'');assert.equal($('draft-s01-0').value,'');assert.equal($('solution-q01').hidden,true);
account={id:'test-a'};win.dispatchEvent(new dom.Event('focus'));assert.equal($('answer-q01').value,answers[0]);assert.equal($('draft-s01-0').value,'Revised response.');
failStorage=true;input($('answer-q01'),answers[0]);click(document.querySelector('[data-check="q01"]'));assert.match(document.querySelector('.save-note').textContent,/unavailable/);failStorage=false;
click($('printLesson'));assert.ok(printed);
click($('resetWork'));click($('cancelReset'));assert.equal($('answer-q01').value,answers[0]);click($('resetWork'));click($('confirmReset'));assert.equal($('answer-q01').value,'');assert.match($('attemptedCount').textContent,/^0/);
key(document,'End');assert.equal(current(),'alignment');key(document,'Home');assert.equal(current(),'start');
let continued=false;const finish=document.createElement('button');finish.dataset.finishLesson='';finish.addEventListener('click',()=>continued=true);document.body.append(finish);click($('continuePractice'));assert.ok(continued);
const ids=[...document.querySelectorAll('[id]')].map(n=>n.id);assert.equal(new Set(ids).size,ids.length);for(const n of document.querySelectorAll('[aria-controls]'))assert.ok($(n.getAttribute('aria-controls')));
console.log('IB merged lesson UI: PASS (all 8 labs, 12 precision-aware checks, 46 variable-mark parts, account isolation, storage denial, reset, links and protected progression)');
