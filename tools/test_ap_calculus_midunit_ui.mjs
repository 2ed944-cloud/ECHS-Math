import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{parseHTML}=require(process.env.ECHS_TEST_DOM_MODULE||'linkedom');
const root=new URL('../',import.meta.url),base=new URL('lessons/ap-calculus/unit-1/',root),html=fs.readFileSync(new URL('middle-unit-important-checking-questions.html',base),'utf8');
const Q=require(new URL('assets/midunit-questions.js',base).pathname),G=require(new URL('assets/midunit-graphs.js',base).pathname);
const storage=new Map(),N=Q.questions.length;
function fixture(data=Q){
  const {window:dom,document}=parseHTML(html);let account={id:'student-a'},failStorage=false;
  Object.defineProperty(dom.HTMLSelectElement.prototype,'value',{configurable:true,get(){return this.querySelector('option[selected]')?.value??this.querySelector('option')?.value??'';},set(v){for(const o of this.querySelectorAll('option'))o.toggleAttribute('selected',o.value===String(v));}});
  Object.defineProperty(dom.HTMLInputElement.prototype,'checked',{configurable:true,get(){return this.hasAttribute('checked');},set(v){this.toggleAttribute('checked',Boolean(v));}});
  const target=new dom.EventTarget(),location={pathname:'/ECHS-Math/lessons/ap-calculus/unit-1/middle-unit-important-checking-questions.html',search:'?course=ap-calculus&lessonKey=protected-key&accessKey=ap-calculus%3A%3A0%3A%3A1.M',hash:''};
  const win={ECHSMidunitQuestions:data,ECHSMidunitGraphs:G,ECHSInstitution:{account:()=>account},katex:{render(tex,node){node.textContent=tex;}},addEventListener:target.addEventListener.bind(target),print(){}};
  const context=vm.createContext({window:win,document,location,history:{replaceState(_a,_b,u){const url=new URL(u,'https://example.test');assert.equal(url.search,location.search);location.hash=url.hash;}},localStorage:{getItem:k=>storage.get(k)||null,setItem(k,v){if(failStorage)throw Error('unavailable');storage.set(k,v);}},console});
  vm.runInContext(fs.readFileSync(new URL('assets/midunit-checkpoint.js',base),'utf8'),context);
  const $=id=>document.getElementById(id),click=n=>n.dispatchEvent(new dom.Event('click',{bubbles:true}));
  function answer(id,index){const r=$('question-'+id).querySelector(`input[value="${index}"]`);r.checked=true;r.dispatchEvent(new dom.Event('change',{bubbles:true}));}
  return {dom,document,$,click,answer,location,account(v){account=v;target.dispatchEvent(new dom.Event('focus'));},fail(){failStorage=true;},goHash(hash){location.hash=hash;target.dispatchEvent(new dom.Event('hashchange'));},key(node,key){const e=new dom.Event('keydown',{bubbles:true,cancelable:true});Object.defineProperty(e,'key',{value:key});node.dispatchEvent(e);}};
}
// Load work saved by the original 24-question release into the expanded lesson.
const legacy=fixture({...Q,questions:Q.questions.slice(0,24)});legacy.answer('q02',Q.questions[1].answer);legacy.click(legacy.document.querySelector('[data-check="q02"]'));legacy.click(legacy.document.querySelector('[data-flag="q03"]'));
const restored=fixture();assert.equal(restored.$('correctCount').textContent,'1');assert.equal(restored.$('flaggedCount').textContent,'1');assert.equal(restored.$('status-q25').textContent,'Not attempted');storage.clear();
const f=fixture(),{$,click,answer,document}=f;
assert.equal(document.documentElement.dataset.checkpointReady,'true');assert.equal(document.querySelectorAll('[data-question]').length,Q.questions.length);assert.equal(document.querySelectorAll('.slide:not([hidden])').length,1);assert.equal(document.querySelectorAll('svg').length,Q.questions.reduce((n,q)=>n+(q.graph?1:0)+(q.graphs?.length||0)+(q.choiceGraphs?.length||0),0));
const current=()=>document.querySelector('.slide:not([hidden])').id;
click($('nextSlide'));assert.equal(current(),'route');f.key(document,'ArrowRight');assert.equal(current(),'question-q01');f.key($('question-q01').querySelector('input'),'ArrowRight');assert.equal(current(),'question-q01');
click(document.querySelector('[data-check="q01"]'));assert.match($('feedback-q01').textContent,/Select an answer/);assert.equal($('attemptedCount').textContent,`0 / ${N}`);
click(document.querySelector('[data-solution="q01"]'));assert.ok($('solution-q01').hidden);click(document.querySelector('[data-hint="q01"]'));assert.equal($('hint-q01').hidden,false);
answer('q01',0);click(document.querySelector('[data-check="q01"]'));assert.match($('feedback-q01').textContent,/Not yet/);click(document.querySelector('[data-solution="q01"]'));assert.equal($('solution-q01').hidden,false);
answer('q01',Q.questions[0].answer);assert.ok($('solution-q01').hidden);assert.equal($('feedback-q01').textContent,'');click(document.querySelector('[data-check="q01"]'));assert.match($('feedback-q01').textContent,/Correct after review/);assert.equal($('firstCount').textContent,'0');
for(const q of Q.questions.slice(1)){answer(q.id,(q.answer+1)%4);click(document.querySelector(`[data-check="${q.id}"]`));assert.match($('feedback-'+q.id).textContent,/Not yet/);answer(q.id,q.answer);click(document.querySelector(`[data-check="${q.id}"]`));assert.match($('feedback-'+q.id).textContent,/Correct/);}
assert.equal($('correctCount').textContent,String(N));answer('q03',0);assert.equal($('correctCount').textContent,String(N-1));assert.match($('status-q03').textContent,/check again/);
click(document.querySelector('[data-flag="q03"]'));assert.equal($('flaggedCount').textContent,'1');f.goHash('#question=q44');assert.equal(current(),'question-q44');click(document.querySelector('[data-go="question-q25"]'));assert.equal(current(),'question-q25');f.goHash('#question=q03');assert.equal(current(),'question-q03');
const key='echs:ap-calculus:1.M:midunit-v1:student-a';assert.ok(storage.has(key));assert.equal(JSON.parse(storage.get(key)).slide,'question-q03');
// Appending questions preserves the old account's answers and flags using stable IDs.
const extended={...Q,questions:[...Q.questions,{...Q.questions[0],id:'future-question',title:'Additional check'}]},next=fixture(extended);assert.equal(next.$('correctCount').textContent,String(N-1));assert.equal(next.$('flaggedCount').textContent,'1');assert.equal(next.$('attemptedCount').textContent,`${N} / ${N+1}`);
f.account({id:'student-b'});assert.equal($('correctCount').textContent,'0');assert.equal($('flaggedCount').textContent,'0');assert.ok($('hint-q01').hidden);assert.equal(current(),'start');
answer('q02',Q.questions[1].answer);click(document.querySelector('[data-check="q02"]'));assert.equal($('firstCount').textContent,'1');f.account({id:'student-a'});assert.equal($('correctCount').textContent,String(N-1));
click($('resetWork'));assert.equal($('resetConfirmation').hidden,false);click($('cancelReset'));assert.equal($('correctCount').textContent,String(N-1));click($('resetWork'));click($('confirmReset'));assert.equal($('correctCount').textContent,'0');assert.equal($('flaggedCount').textContent,'0');assert.ok($('solution-q01').hidden);
f.fail();answer('q02',1);assert.match(document.querySelector('.checkpoint-save-note').textContent,/storage is unavailable/);
f.account(null);const saved=JSON.stringify([...storage]);answer('q02',0);assert.equal(JSON.stringify([...storage]),saved,'Anonymous answers do not write another account’s storage');
// Exercise the deployed access guard: embedded routing remains behind both course and lesson checks.
async function guard({embedded=true,allowed=true,courseAllowed=true}={}){
  const {window:dom,document}=parseHTML(html);if(!embedded)delete document.documentElement.dataset.practice;
  const location={href:'https://example.test/ECHS-Math/lessons/ap-calculus/unit-1/middle-unit-important-checking-questions.html?course=ap-calculus&unit=1&topic=1.M&lessonKey=key&accessKey=ap-calculus%3A%3A0%3A%3A1.M',search:'?course=ap-calculus&unit=1&topic=1.M&lessonKey=key&accessKey=ap-calculus%3A%3A0%3A%3A1.M',replace(url){this.redirect=url;}};
  let checked=false;const access={authenticated:true,role:'student',current:{}},api={root:p=>'https://example.test/ECHS-Math/'+p,async api(_a,_b,request){checked=true;assert.equal(request.body.access_key,'ap-calculus::0::1.M');return{allowed};}},portal={ready:Promise.resolve(access),normaliseCourseKey:v=>v,courseAllowed:()=>courseAllowed,roleHome:()=>'/student'};
  const win={ECHSPortalAccess:portal,__ECHS_LESSON_TUTOR_LOADER__:true,dispatchEvent(){}},store=new Map();
  const context=vm.createContext({window:win,document,location,ECHSPortalAccess:portal,ECHSInstitution:api,URL,URLSearchParams,MutationObserver:class{observe(){}},ResizeObserver:class{observe(){}},addEventListener(){},CustomEvent:class{},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},console});
  await vm.runInContext(fs.readFileSync(new URL('js/lesson-access-guard.js',root),'utf8'),context);
  if(!courseAllowed||!allowed){assert.ok(location.redirect);assert.notEqual(document.documentElement.dataset.lessonGate,'allowed');assert.equal(checked,courseAllowed);return;}
  assert.equal(document.documentElement.dataset.lessonGate,'allowed');assert.ok(checked);const button=document.querySelector('[data-finish-lesson]');assert.ok(button);button.dispatchEvent(new dom.Event('click',{bubbles:true}));
  const url=new URL(location.href);if(embedded){assert.match(url.pathname,/middle-unit-important-checking-questions.html$/);assert.equal(url.hash,'#question=q01');assert.equal(url.searchParams.get('accessKey'),'ap-calculus::0::1.M');}else assert.match(url.pathname,/question-bank\/practice.html$/);assert.deepEqual(JSON.parse(store.get('echs_math_complete')),['key']);
}
await guard();await guard({allowed:false});await guard({courseAllowed:false});await guard({embedded:false});
console.log('AP Calculus checkpoint interactions: PASS (answers, hints, solutions, flags, scoring, navigation, append persistence, account isolation, reset, unavailable storage, protected practice routes)');
