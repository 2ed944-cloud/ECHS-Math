/* Interaction tests without a browser, network or real student account. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{parseHTML}=require(process.env.ECHS_TEST_DOM_MODULE||'linkedom');
const base=new URL('../lessons/ap-precalculus/unit-1/',import.meta.url),html=fs.readFileSync(new URL('AP_Precalculus_1.1_Change_in_Tandem_ECHS_Refined.html',base),'utf8');
const {window:dom,document}=parseHTML(html);
Object.defineProperty(dom.HTMLSelectElement.prototype,'value',{configurable:true,get(){return this.querySelector('option[selected]')?.value??this.querySelector('option')?.value??'';},set(v){for(const o of this.querySelectorAll('option'))o.toggleAttribute('selected',o.value===String(v));}});
const storage=new Map(),legacy='echs-ap-precalculus-1.1-slide-deck-v2';storage.set(legacy,'old progress');
let account={id:'test-a'},failStorage=false,printed=false;
const events=new dom.EventTarget(),location={pathname:'/ECHS-Math/lessons/ap-precalculus/unit-1/AP_Precalculus_1.1_Change_in_Tandem_ECHS_Refined.html',search:'?course=ap-precalculus&lessonKey=test&accessKey=protected',hash:'#practice'};
const math=vm.createContext({window:{}});vm.runInContext(fs.readFileSync(new URL('../../ib-math-ai/unit-1/assets/js/katex-global.js',base),'utf8'),math);
let equations=0;
const win={document,ECHSInstitution:{account:()=>account},TandemModels:require(new URL('assets/tandem-1-1-model-v3.js',base).pathname),TandemQuestions:require(new URL('assets/tandem-1-1-questions-v3.js',base).pathname),katex:{render(tex,node){math.window.katex.renderToString(tex,{throwOnError:true,strict:'ignore'});node.textContent=tex;equations++;}},addEventListener:events.addEventListener.bind(events),dispatchEvent:events.dispatchEvent.bind(events),print(){printed=true;}};
const scheduled=new Map();let timer=0;
const ctx=vm.createContext({window:win,document,location,history:{replaceState(_s,_t,url){const u=new URL(url,'https://example.test');assert.equal(u.search,location.search);location.hash=u.hash;}},localStorage:{getItem(k){if(failStorage)throw Error('Denied');return storage.get(k)||null;},setItem(k,v){if(failStorage)throw Error('Denied');storage.set(k,v);}},setTimeout:fn=>{scheduled.set(++timer,fn);return timer;},clearTimeout:id=>scheduled.delete(id),console});
for(const file of ['graphs','labs','core'])vm.runInContext(fs.readFileSync(new URL('assets/tandem-1-1-'+file+'-v3.js',base),'utf8'),ctx);
const $=id=>document.getElementById(id),click=n=>{assert.ok(n,'Missing click target');n.dispatchEvent(new dom.Event('click',{bubbles:true}));};
const input=(n,v,event='input')=>{assert.ok(n,'Missing input');n.value=String(v);n.dispatchEvent(new dom.Event(event,{bubbles:true}));};
const choose=(id,value)=>{const n=document.querySelector('input[name="answer-'+id+'"][value="'+value+'"]');for(const r of document.querySelectorAll('input[name="answer-'+id+'"]')){r.checked=r===n;r.toggleAttribute('checked',r===n);}input(n,value);};
const flush=()=>{const callbacks=[...scheduled.values()];scheduled.clear();callbacks.forEach(fn=>fn());};
const current=()=>document.querySelector('.slide:not([hidden])').id,key=(target,key)=>{const e=new dom.Event('keydown',{bubbles:true,cancelable:true});Object.defineProperty(e,'key',{value:key});target.dispatchEvent(e);};
const Q=win.TandemQuestions,M=win.TandemModels;
assert.equal(document.documentElement.dataset.tandemLessonReady,'true');assert.equal(current(),'practice-guide');
assert.equal(document.querySelectorAll('.slide:not([hidden])').length,1);
for(const [hash,id] of [['#exam','frq01'],['#ap-frq-graph','frq02'],['#preimage-explorer','preimage-lab'],['#sketch-lab','builder-lab'],['#challenge-constraints','challenge01'],['#review','finish'],['#learn','start']]){location.hash=hash;win.dispatchEvent(new dom.Event('hashchange'));assert.equal(current(),id);}
key(document,'ArrowRight');assert.equal(current(),'roadmap');
for(const target of [$('answer-q02'),$('slideSelect'),$('lab-reservoir-time'),$('draft-frq01-0'),$('nextSlide')]){key(target,'ArrowRight');assert.equal(current(),'roadmap');}
click(document.querySelector('[data-solution="q01"]'));assert.equal($('solution-q01').hidden,true);
for(const q of Q.questions){if(q.type==='number')input($('answer-'+q.id),20);else choose(q.id,q.answer);click(document.querySelector('[data-check="'+q.id+'"]'));assert.match($('feedback-'+q.id).textContent,/Correct/,q.id);}
assert.equal($('correctCount').textContent,'34');assert.equal($('attemptedCount').textContent,'34 / 34');
click(document.querySelector('[data-solution="q01"]'));assert.equal($('solution-q01').hidden,false);
choose('q01',0);assert.equal($('solution-q01').hidden,true);assert.equal($('correctCount').textContent,'33');
click(document.querySelector('[data-solution="q01"]'));assert.equal($('solution-q01').hidden,true);
click(document.querySelector('[data-check="q01"]'));assert.doesNotMatch($('feedback-q01').textContent,/Correct/);
choose('q01',2);click(document.querySelector('[data-check="q01"]'));
input($('answer-q02'),'20 apples');click(document.querySelector('[data-check="q02"]'));assert.match($('feedback-q02').textContent,/complete finite number/);input($('answer-q02'),'20');click(document.querySelector('[data-check="q02"]'));
for(const f of Q.frqs)for(const [i,p] of f.parts.entries()){
  const id=f.id+'-'+i;assert.equal($('score-'+id).querySelectorAll('option').length,4);
  click(document.querySelector('[data-rubric="'+id+'"]'));assert.equal($('rubric-'+id).hidden,true);
  input($('draft-'+id),'My response includes a construction or comparison and the evidence supporting it.');
  click(document.querySelector('[data-rubric="'+id+'"]'));assert.equal($('rubric-'+id).hidden,false);input($('score-'+id),p.marks,'change');
}
assert.match($('frqSummary').textContent,/36 points across 18 reviewed parts \(out of 36 available\)/);
input($('draft-frq01-0'),'Revised comparison.');assert.equal($('rubric-frq01-0').hidden,true);assert.equal($('score-frq01-0').disabled,true);
input($('score-frq01-0'),2,'change');assert.match($('frqSummary').textContent,/17 reviewed parts/);
const setting=(name,key,v)=>input($('lab-'+name+'-'+key),v,$('lab-'+name+'-'+key).type==='range'?'input':'change');
const prediction=(name,key,v)=>input($('lab-'+name+'-'+key),v);
const correct=name=>{click($('lab-'+name+'-check'));assert.match($('lab-'+name+'-feedback').textContent,/Correct/,name);click($('lab-'+name+'-reveal'));assert.equal($('lab-'+name+'-work').hidden,false);};
for(const [t,value] of [[0,10],[1,18],[3,34],[4,34],[5,34],[6,28],[8,16]]){setting('reservoir','time',t);prediction('reservoir','answer',value);correct('reservoir');}
for(const [outputs,answer] of [[[1,1,1],'yes'],[[1,3,5],'yes'],[['both',3,5],'no'],[[1,'both',5],'no']]){outputs.forEach((v,i)=>setting('relation','map'+i,v));prediction('relation','answer',answer);correct('relation');}
for(const model of ['quadratic','restricted','wave'])for(const level of [-2,-1,0,2,3,4,8,9]){
  setting('preimage','model',model);setting('preimage','level',level);
  const roots=M.preimage(model==='wave'?'wave':'quadratic',level,model==='restricted');prediction('preimage','answer',roots.length?roots.map(n=>n.toFixed(6)).join(','):'empty');correct('preimage');
}
for(const [segment,direction] of ['increasing','constant','decreasing','increasing'].entries())for(const [x,sign] of [[-3.5,'negative'],[-3,'zero'],[-2,'positive']]){setting('direction','segment',segment);setting('direction','x',x);prediction('direction','answer',direction);prediction('direction','sign',sign);correct('direction');}
for(const [shape,direction,concavity,rate] of [['inc-up','increasing','up','increasing'],['inc-down','increasing','down','decreasing'],['dec-up','decreasing','up','increasing'],['dec-down','decreasing','down','decreasing']]){setting('concavity','shape',shape);prediction('concavity','direction',direction);prediction('concavity','concavity',concavity);prediction('concavity','rate',rate);correct('concavity');}
for(const [story,keys] of Object.entries({heating:['inc-up','inc-down','constant'],draining:['dec-up','dec-down','constant'],journey:['inc-linear','constant','inc-linear']})){
  setting('builder','story',story);keys.forEach((v,i)=>setting('builder','stage'+i,v));correct('builder');setting('builder','stage0','constant');click($('lab-builder-check'));assert.doesNotMatch($('lab-builder-feedback').textContent,/Correct/);
}
for(const view of ['samples','blue','gold','both']){setting('evidence','view',view);prediction('evidence','answer','no');correct('evidence');}
for(const window of ['full','cropped'])for(const [x,y] of [[-2.4,'3.220'],[1.7,'-1.053'],[-4,'0.000'],[5,'0.000'],[6,'4.000']]){setting('calculator','window',window);setting('calculator','x',x);prediction('calculator','answer',y);correct('calculator');}
prediction('calculator','answer','999');assert.doesNotMatch($('lab-calculator-feedback').textContent,/Correct/);assert.equal($('lab-calculator-work').hidden,true);
for(const el of document.querySelectorAll('[data-tandem-plot]'))assert.ok(el.querySelector('svg'),'Unrendered graph: '+el.dataset.tandemPlot);
for(const svg of document.querySelectorAll('svg')){assert.ok(svg.getAttribute('aria-label'));assert.doesNotMatch(svg.outerHTML,/NaN|Infinity/);}
assert.ok(document.querySelector('[data-tandem-plot="evidence"] path.curve[style="stroke:#a26714"][stroke-dasharray]'),'Gold counterexample must retain its color despite shared CSS');
assert.equal(document.querySelectorAll('.math-fallback').length,0);assert.ok(equations>100);
flush();assert.equal(storage.get(legacy),'old progress');assert.ok(storage.has('echs:ap-precalculus:1.1:ap-precalculus-topic-1-1-v3:test-a'));
account={id:'test-b'};win.dispatchEvent(new dom.Event('focus'));assert.equal($('answer-q02').value,'');assert.equal($('draft-frq01-0').value,'');
account={id:'test-a'};win.dispatchEvent(new dom.Event('focus'));assert.equal($('answer-q02').value,'20');assert.equal($('draft-frq01-0').value,'Revised comparison.');
failStorage=true;input($('answer-q02'),'20');click(document.querySelector('[data-check="q02"]'));assert.match(document.querySelector('.save-note').textContent,/unavailable/);failStorage=false;
click($('printLesson'));assert.ok(printed);click($('resetWork'));click($('cancelReset'));assert.equal($('answer-q02').value,'20');click($('resetWork'));click($('confirmReset'));assert.equal($('answer-q02').value,'');assert.match($('attemptedCount').textContent,/^0/);
key(document,'End');assert.equal(current(),'alignment');key(document,'Home');assert.equal(current(),'start');
let continued=false;const finish=document.createElement('button');finish.dataset.finishLesson='';finish.addEventListener('click',()=>continued=true);document.body.append(finish);click($('continuePractice'));assert.ok(continued);
const ids=[...document.querySelectorAll('[id]')].map(n=>n.id);assert.equal(new Set(ids).size,ids.length);for(const n of document.querySelectorAll('[aria-controls]'))assert.ok($(n.getAttribute('aria-controls')));
const css=fs.readFileSync(new URL('assets/tandem-1-1-v3.css',base),'utf8');assert.match(css,/@media print\{\.solution,\.rubric,\.hint,\.feedback/);assert.match(css,/@media\(max-width:650px\)/);
console.log('AP Precalculus 1.1 UI: PASS (8 labs, 34 checks, 18 scored parts, mathematical rendering, account isolation, edit invalidation, storage denial, legacy navigation and protected progression).');
