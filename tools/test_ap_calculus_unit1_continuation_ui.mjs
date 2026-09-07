import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),{parseHTML}=require(process.env.ECHS_TEST_DOM_MODULE||'linkedom');
const root=new URL('../',import.meta.url),base=new URL('lessons/ap-calculus/unit-1/assets/',root),manifest=JSON.parse(fs.readFileSync(new URL('docs/releases/ap-calculus-1-7-1-16-coverage.json',root),'utf8'));
const read=p=>fs.readFileSync(new URL(p,base),'utf8');
const katexContext=vm.createContext({window:{},console});vm.runInContext(fs.readFileSync(new URL('lessons/ib-math-ai/unit-1/assets/js/katex-global.js',root),'utf8'),katexContext);
for(const lesson of manifest.lessons){
 const {window:dom,document}=parseHTML(fs.readFileSync(new URL(lesson.url,root),'utf8'));
 Object.defineProperty(dom.HTMLSelectElement.prototype,'value',{configurable:true,get(){return this.querySelector('option[selected]')?.value??this.querySelector('option')?.value??'';},set(v){for(const o of this.querySelectorAll('option'))o.toggleAttribute('selected',o.value===String(v));}});
 Object.defineProperty(dom.HTMLInputElement.prototype,'checked',{configurable:true,get(){return this.hasAttribute('checked');},set(v){this.toggleAttribute('checked',Boolean(v));}});
 let account={id:'student-a'},denied=false;const storage=new Map(),events=new dom.EventTarget(),scheduled=new Map();let timer=0;
 const location={pathname:'/ECHS-Math/'+lesson.url,search:'?course=ap-calculus&lessonKey=protected-fixture',hash:''};
 const win={document,ECHSInstitution:{account:()=>account},katex:{render(tex,node){katexContext.window.katex.renderToString(tex,{throwOnError:true,strict:'ignore'});node.textContent=tex;}},addEventListener:events.addEventListener.bind(events),dispatchEvent:events.dispatchEvent.bind(events),print(){}};
 const context=vm.createContext({window:win,document,location,history:{replaceState(_,__,url){const u=new URL(url,'https://test.local');assert.equal(u.search,location.search);location.hash=u.hash;}},localStorage:{getItem:k=>storage.get(k)||null,setItem(k,v){if(denied)throw Error('storage denied');storage.set(k,v);}},setTimeout:fn=>{scheduled.set(++timer,fn);return timer;},clearTimeout:id=>scheduled.delete(id),console,Blob,URL});
 const n=lesson.topic.split('.')[1];for(const file of ['limit-lesson-models.js','limit-lesson-graphs.js',`lesson-1-${n}-ab.js`,'unit1-continuation-ui.js','unit1-continuation-labs.js','unit1-continuation-core.js'])vm.runInContext(read(file),context);
 const $=id=>document.getElementById(id),click=node=>node.dispatchEvent(new dom.Event('click',{bubbles:true})),input=(node,value,event='input')=>{node.value=String(value);node.dispatchEvent(new dom.Event(event,{bubbles:true}));},flush=()=>{for(const fn of scheduled.values())fn();scheduled.clear();};
 assert.equal(document.documentElement.dataset.limitLessonReady,'true');assert.equal(document.querySelectorAll('.slide').length,lesson.slides);
 const first=win.LimitLessonQuestions.questions[0];click(document.querySelector(`[data-solution="${first.id}"]`));assert.equal($('solution-'+first.id).hidden,true);
 click(document.querySelector(`[data-check="${first.id}"]`));assert.match($('feedback-'+first.id).textContent,/Enter or select/);
 function answer(q,value=q.answer){if(q.type==='number')input($('answer-'+q.id),value);else{const el=document.querySelector(`[data-question="${q.id}"] input[value="${value}"]`);el.checked=true;el.dispatchEvent(new dom.Event('input',{bubbles:true}));}click(document.querySelector(`[data-check="${q.id}"]`));}
 for(const q of win.LimitLessonQuestions.questions){answer(q);assert.match($('feedback-'+q.id).textContent,/Correct/);}
 assert.equal($('correctCount').textContent,'16');assert.match($('firstAttemptSummary').textContent,/16 \/ 16/);
 // Changing a checked answer invalidates the displayed correctness until checked again.
 const q=win.LimitLessonQuestions.questions.find(q=>q.type==='number')||first;if(q.type==='number')input($('answer-'+q.id),'999');else{const wrong=(q.answer+1)%4;document.querySelector(`[data-question="${q.id}"] input[value="${q.answer}"]`).checked=false;const el=document.querySelector(`[data-question="${q.id}"] input[value="${wrong}"]`);el.checked=true;el.dispatchEvent(new dom.Event('input',{bubbles:true}));}assert.equal($('feedback-'+q.id).textContent,'');assert.equal($('correctCount').textContent,'15');
 const part='frq1-0';click(document.querySelector(`[data-rubric="${part}"]`));assert.equal($('rubric-'+part).hidden,true);input($('draft-'+part),'My independent mathematical argument.');click(document.querySelector(`[data-rubric="${part}"]`));assert.equal($('rubric-'+part).hidden,false);assert.equal($('score-'+part).disabled,false);input($('score-'+part),'2','change');assert.match($('frqSummary').textContent,/2 points/);input($('draft-'+part),'Revised argument.');assert.equal($('rubric-'+part).hidden,true);assert.equal($('score-'+part).disabled,true);assert.match($('frqSummary').textContent,/not been automatically graded/);
 // Every selectable investigation case rejects blanks and checks a complete correct response.
 for(let k=0;k<win.Unit1LabModels.labels[Number(n)].length;k++){input($('labCase'),k,'change');click($('checkLab'));assert.match($('labFeedback').textContent,/Complete every/);const t=$('labScale')?Number($('labScale').value):1,m=win.Unit1LabModels.model(Number(n),k,t);for(const field of m.fields)input($('lab-'+field.id),field.answer,field.options?'change':'input');click($('checkLab'));assert.match($('labFeedback').textContent,/Correct/);input($('lab-'+m.fields[0].id),'','input');assert.equal($('labFeedback').textContent,'');}
 flush();account={id:'student-b'};win.dispatchEvent(new dom.Event('focus'));assert.equal($('draft-'+part).value,'');assert.equal($('correctCount').textContent,'0');account={id:'student-a'};win.dispatchEvent(new dom.Event('focus'));assert.equal($('draft-'+part).value,'Revised argument.');
 denied=true;answer(first);assert.match(document.querySelector('.save-note').textContent,/unavailable/);denied=false;
 click($('resetWork'));click($('cancelReset'));assert.equal($('draft-'+part).value,'Revised argument.');click($('resetWork'));click($('confirmReset'));assert.equal($('draft-'+part).value,'');assert.equal($('correctCount').textContent,'0');
 click(document.querySelector(`[data-hint="${first.id}"]`));answer(first);assert.match($('firstAttemptSummary').textContent,/0 \/ 16/);
 let continued=false;const finish=document.createElement('button');finish.setAttribute('data-finish-lesson','');finish.addEventListener('click',()=>continued=true);document.body.append(finish);click($('continuePractice'));assert.ok(continued);
 const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);assert.equal(new Set(ids).size,ids.length);for(const control of document.querySelectorAll('[aria-controls]'))assert.ok($(control.getAttribute('aria-controls')));
 console.log(`Topic ${lesson.topic}: PASS (16 answers, all lab cases, hint provenance, rubric edits, account isolation, unavailable storage, reset and protected continuation).`);
}
