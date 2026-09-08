import {fileURLToPath} from 'node:url';
/* DOM interaction tests; no browser, network or real student account. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{parseHTML}=require(process.env.ECHS_TEST_DOM_MODULE||'linkedom');
const base=new URL('../lessons/ib-math-ai/unit-1/',import.meta.url),html=fs.readFileSync(new URL('lessons/IB_AI_SL_1.2_arithmetic_sequences_ECHS.html',base),'utf8');
const {window:dom,document}=parseHTML(html);
Object.defineProperty(dom.HTMLSelectElement.prototype,'value',{configurable:true,get(){return this.querySelector('option[selected]')?.value??this.querySelector('option')?.value??'';},set(v){for(const o of this.querySelectorAll('option'))o.toggleAttribute('selected',o.value===String(v));}});
const storage=new Map(),legacy='echs:ib-ai:u1:1.2:state';storage.set(legacy,'old questions');
let account={id:'test-a'},failStorage=false,printed=false;
const events=new dom.EventTarget(),location={pathname:'/ECHS-Math/lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.2_arithmetic_sequences_ECHS.html',search:'?course=ib-math-ai&lessonKey=test&accessKey=protected',hash:'#practice'};
const math=vm.createContext({window:{}});vm.runInContext(fs.readFileSync(new URL('assets/js/katex-global.js',base),'utf8'),math);
let equations=0;
const win={document,ECHSInstitution:{account:()=>account},ArithmeticLessonModels:require(fileURLToPath(new URL('data/lesson-1.2-arithmetic-model-v7.js',base))),ArithmeticLessonQuestions:require(fileURLToPath(new URL('data/lesson-1.2-arithmetic-questions-v7.js',base))),katex:{render(tex,node){math.window.katex.renderToString(tex,{throwOnError:true,strict:'ignore'});node.textContent=tex;equations++;}},addEventListener:events.addEventListener.bind(events),dispatchEvent:events.dispatchEvent.bind(events),print(){printed=true;}};
const scheduled=new Map();let timer=0;
const ctx=vm.createContext({window:win,document,location,history:{replaceState(_s,_t,url){const u=new URL(url,'https://example.test');assert.equal(u.search,location.search);location.hash=u.hash;}},localStorage:{getItem:k=>storage.get(k)||null,setItem(k,v){if(failStorage)throw Error('Denied');storage.set(k,v);}},setTimeout:fn=>{scheduled.set(++timer,fn);return timer;},clearTimeout:id=>scheduled.delete(id),console});
for(const file of ['labs','core'])vm.runInContext(fs.readFileSync(new URL('data/lesson-1.2-arithmetic-'+file+'-v7.js',base),'utf8'),ctx);
const $=id=>document.getElementById(id),click=n=>n.dispatchEvent(new dom.Event('click',{bubbles:true}));
const input=(n,v,event='input')=>{n.value=String(v);n.dispatchEvent(new dom.Event(event,{bubbles:true}));};
const flush=()=>{const callbacks=[...scheduled.values()];scheduled.clear();callbacks.forEach(fn=>fn());};
const current=()=>document.querySelector('.slide:not([hidden])').id,key=(target,key)=>{const e=new dom.Event('keydown',{bubbles:true,cancelable:true});Object.defineProperty(e,'key',{value:key});target.dispatchEvent(e);};
const Q=win.ArithmeticLessonQuestions,M=win.ArithmeticLessonModels;
assert.equal(document.documentElement.dataset.arithmeticLessonReady,'true');
assert.equal(current(),'practice-guide');assert.equal(document.querySelectorAll('.slide:not([hidden])').length,1);
for(const [hash,id] of [['#exam','short-s01'],['#quiz','check-final'],['#review','finish'],['#learn','start']]){location.hash=hash;win.dispatchEvent(new dom.Event('hashchange'));assert.equal(current(),id);}
key(document,'ArrowRight');assert.equal(current(),'roadmap');assert.equal(location.hash,'#roadmap');key($('answer-q01'),'ArrowRight');assert.equal(current(),'roadmap');
click(document.querySelector('[data-solution="q01"]'));assert.equal($('solution-q01').hidden,true);
const answers=['5','47','80','16','6','11','488','119','6600','14','2','8'];
for(const [i,q] of Q.questions.entries()){
  input($('answer-'+q.id),'999999');click(document.querySelector('[data-check="'+q.id+'"]'));assert.match($('feedback-'+q.id).textContent,/Not yet/);
  input($('answer-'+q.id),answers[i]);click(document.querySelector('[data-check="'+q.id+'"]'));assert.match($('feedback-'+q.id).textContent,/Correct/);
}
assert.equal($('correctCount').textContent,'12');
click(document.querySelector('[data-hint="q01"]'));assert.equal($('hint-q01').hidden,false);
click(document.querySelector('[data-solution="q01"]'));assert.equal($('solution-q01').hidden,false);
for(const f of Q.frqs)for(const [i,p] of f.parts.entries()){
  const id=f.id+'-'+i;
  assert.equal($('score-'+id).querySelectorAll('option').length,p.marks+2);
  click(document.querySelector('[data-rubric="'+id+'"]'));assert.equal($('rubric-'+id).hidden,true);
  input($('draft-'+id),'My working includes the numerical setup, units and a justified conclusion.');
  click(document.querySelector('[data-rubric="'+id+'"]'));assert.equal($('rubric-'+id).hidden,false);
  input($('score-'+id),p.marks,'change');
}
assert.match($('frqSummary').textContent,/100 points across 49 reviewed parts \(out of 100 available\)/);
input($('draft-s01-0'),'Revised response.');assert.equal($('rubric-s01-0').hidden,true);assert.equal($('score-s01-0').disabled,true);
input($('score-s01-0'),2,'change');assert.match($('frqSummary').textContent,/48 reviewed parts/,'A disabled score cannot be inserted');
const predict=(name,value)=>{input($('lab-'+name+'-answer'),value);click($('lab-'+name+'-check'));assert.match($('lab-'+name+'-feedback').textContent,/Correct/,name+': '+value);click($('lab-'+name+'-explain'));assert.equal($('lab-'+name+'-work').hidden,false);input($('lab-'+name+'-answer'),'999999');assert.equal($('lab-'+name+'-feedback').textContent,'');};
for(const [name,values] of Object.entries({difference:[5,-4,0,3],recover:[6,-3,0],calculator:[74,306,19],model:[33,56.5]}))for(const [i,result] of values.entries()){
 input($('lab-'+name+'-case'),i,'change');assert.equal($('lab-'+name+'-answer').value,'');assert.equal($('lab-'+name+'-work').hidden,true);predict(name,result);
}
for(const [a,d,n,answer] of [[12,4,8,40],[-10,-6,1,-10],[-10,-6,20,-124],[40,8,20,192],[6,0,20,6]]){input($('lab-term-a'),a);input($('lab-term-d'),d);input($('lab-term-n'),n);predict('term',answer);}
for(const [a,d,n,answer] of [[5,3,7,98],[2,0,1,2],[20,6,12,636],[7,0,8,56]]){input($('lab-pairing-a'),a);input($('lab-pairing-d'),d);input($('lab-pairing-n'),n);predict('pairing',answer);}
for(const [lo,n,answer] of [[3,7,140],[0,1,2],[8,9,342]]){input($('lab-sigma-low'),lo);input($('lab-sigma-count'),n);predict('sigma',answer);}
for(const [p,r,t,answer] of [[6000,2.5,4,6600],[1000,1,0,1000],[10000,8,10,18000]]){input($('lab-interest-p'),p);input($('lab-interest-r'),r);input($('lab-interest-t'),t);predict('interest',answer);}
input($('lab-model-next'),10);predict('model',67.5);
// Discrete plots contain every term, including negative terms and the first point at time zero.
assert.equal($('lab-term-display').querySelectorAll('circle').length,20);
assert.equal($('lab-interest-display').querySelectorAll('circle').length,11);
assert.equal($('lab-model-display').querySelectorAll('circle').length,15);
for(const svg of document.querySelectorAll('svg')){assert.ok(svg.getAttribute('aria-label'));assert.doesNotMatch(svg.outerHTML,/NaN|Infinity/);}
assert.equal(document.querySelectorAll('.math-fallback').length,0);assert.ok(equations>100);
flush();assert.equal(storage.get(legacy),'old questions');
assert.ok(storage.has('echs:ib-math-ai:1.2:ib-ai-sl-1-2-arithmetic-v7:test-a'));
account={id:'test-b'};win.dispatchEvent(new dom.Event('focus'));assert.equal($('answer-q01').value,'');assert.equal($('draft-s01-0').value,'');assert.equal($('solution-q01').hidden,true);
account={id:'test-a'};win.dispatchEvent(new dom.Event('focus'));assert.equal($('answer-q01').value,answers[0]);assert.equal($('draft-s01-0').value,'Revised response.');
failStorage=true;input($('answer-q01'),answers[0]);click(document.querySelector('[data-check="q01"]'));assert.match(document.querySelector('.save-note').textContent,/unavailable/);failStorage=false;
click($('printLesson'));assert.ok(printed);
input($('answer-q01'),'6');assert.equal($('solution-q01').hidden,true);input($('answer-q01'),answers[0]);
click($('resetWork'));click($('cancelReset'));assert.equal($('answer-q01').value,answers[0]);click($('resetWork'));click($('confirmReset'));assert.equal($('answer-q01').value,'');assert.match($('attemptedCount').textContent,/^0/);
key(document,'End');assert.equal(current(),'alignment');key(document,'Home');assert.equal(current(),'start');
let continued=false;const finish=document.createElement('button');finish.dataset.finishLesson='';finish.addEventListener('click',()=>continued=true);document.body.append(finish);click($('continuePractice'));assert.ok(continued);
const ids=[...document.querySelectorAll('[id]')].map(n=>n.id);assert.equal(new Set(ids).size,ids.length);for(const n of document.querySelectorAll('[aria-controls]'))assert.ok($(n.getAttribute('aria-controls')));
account=null;win.dispatchEvent(new dom.Event('focus'));const before=storage.size;input($('answer-q01'),'5');click(document.querySelector('[data-check="q01"]'));flush();assert.equal(storage.size,before,'Anonymous responses remain in memory');
console.log('IB arithmetic UI: PASS (8 labs, 12 checks, 49 variable-mark parts, account isolation, storage denial, reset, stable links and protected progression)');
