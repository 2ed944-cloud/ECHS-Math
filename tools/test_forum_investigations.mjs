import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {INVESTIGATIONS, WORKSHOP, lessonURL} from '../lessons/shared/forum/investigations.mjs';
import {LESSONS} from '../lessons/ap-calculus/unit-8/assets/volume-lessons.mjs';
import {buildModel} from '../lessons/ap-calculus/unit-8/assets/volume-model.mjs';
const require = createRequire(import.meta.url);
const C = require('../lessons/ap-precalculus/unit-1/assets/tandem-context-models-v4.js');
const allStages = Object.values(LESSONS).flatMap(l => l.stages);
const entries = Object.fromEntries(INVESTIGATIONS.map(e => [e.id,e]));
const near = (a,b,tolerance=1e-9) => assert.ok(Math.abs(a-b)<tolerance, `${a} != ${b}`);
// A separately implemented Simpson rule evaluates the stated transfer areas.
function integrate(fn,a,b,n=12000) {let sum=fn(a)+fn(b);for(let i=1;i<n;i++)sum+=(i%2?4:2)*fn(a+(b-a)*i/n);return sum*(b-a)/(3*n);}
assert.equal(INVESTIGATIONS.length,9);
assert.equal(new Set(INVESTIGATIONS.map(e=>e.id)).size,9);
for (const e of INVESTIGATIONS) {
  assert.ok(e.original && e.calculatorPolicy && e.cedTopics.length);
  for (const key of ['predict','transfer','misconception','support','challenge']) assert.ok(typeof e[key]==='string' && e[key].length>20);
  for (const key of ['explore','explain','comparison']) assert.ok(e[key].length>=2 && e[key].every(x=>typeof x==='string'));
  const html=fs.readFileSync(e.path,'utf8');
  assert.ok(html.includes('shared/forum/lesson-guide.mjs?v=20260930-forum1'));
  if(e.path.includes('ap-precalculus')) assert.ok(html.includes(`id="${e.anchor}"`));
  else assert.ok(allStages.some(s=>s.id===e.anchor));
  const url=lessonURL(e,'https://example.test/ECHS-Math/');
  assert.equal(url.pathname,'/ECHS-Math/'+e.path);assert.equal(url.hash,'#'+e.anchor);assert.equal(url.search,'?forum=1');
}
const {radius,period,gap,start,distances}=entries.car.modelCheck;
for(let i=0;i<5;i++) near(C.car(i*period/4,{radius,period,gap,start}).distance,distances[i]);
for(const t of [.4,1.8,3.3]) {
  near(C.car(t,{radius:6,period:10}).distance,2*C.car(t,{radius:3,period:10}).distance);
  near(C.car(2*t,{radius:3,period:20}).distance,C.car(t,{radius:3,period:10}).distance);
  const slope=(s,T)=>(C.car(s+.00001,{period:T}).distance-C.car(s-.00001,{period:T}).distance)/.00002;
  near(slope(2*t,20),slope(t,10)/2,1e-8);
}
entries.vase.modelCheck.areas.forEach((area,i)=>near(entries.vase.modelCheck.flow*entries.vase.modelCheck.time/area,entries.vase.modelCheck.heights[i]));
near(integrate(x=>Math.PI/8*(2*x-x*x)**2,0,2),entries.cross.modelCheck.volume);
near(integrate(x=>Math.PI*2*x,0,3),entries.disk.modelCheck.volume);
near(Math.PI*(Math.sqrt(2*2))**2,entries.disk.modelCheck.faceArea);
// Substitute y=u³ so the independent quadrature has a smooth polynomial integrand.
near(integrate(u=>Math.PI*(u*u-u**6)*3*u*u,0,1),entries.washer.modelCheck.volume);
near(integrate(x=>Math.PI*((2-x*x)**2-(2-x)**2),0,1),entries.shifted.modelCheck.volume);
near(buildModel({scenario:'shifted-washer-x',axisOffset:2}).exactVolume,entries.shifted.modelCheck.volume);
near(integrate(x=>Math.PI*((x+2)**2-(x*x+2)**2),0,1),entries.shifted.modelCheck.belowVolume);
near(entries.pearl.modelCheck.scale**3,entries.pearl.modelCheck.ratio);
near((entries.pearl.modelCheck.ratio-1)*100,entries.pearl.modelCheck.increase);
near(2**3/15,entries.water.modelCheck.volume);near(entries.water.modelCheck.volume*1000,entries.water.modelCheck.liters);
near(20+8*entries.ball.modelCheck.peakTime-4*entries.ball.modelCheck.peakTime**2,entries.ball.modelCheck.peakHeight);
for(const h of [.01,.2,.7]) near(20+8*(1-h)-4*(1-h)**2,20+8*(1+h)-4*(1+h)**2);
assert.match(WORKSHOP.evidencePolicy,/do not award mastery/);
assert.equal(WORKSHOP.outcomes.length,3);
const code=fs.readFileSync('lessons/shared/forum/lesson-guide.mjs','utf8');
assert.ok(!/\b(?:fetch|localStorage|sessionStorage|indexedDB|supabase|awardMastery|markCompleted)\s*[.(]/.test(code));
assert.match(code,/observer\.disconnect/);assert.match(code,/lifetime\.abort/);
console.log('PASS: nine original investigations; independent transfer arithmetic, quadrature, scaling, geometric radii, source links and lesson registration.');

// Real adapter controls, isolated DOM; no production account or institutional data.
const {parseHTML}=require(process.env.ECHS_TEST_DOM_MODULE||'linkedom');
const {window,document}=parseHTML('<html data-volume-lesson="cross-sections"><head></head><body><header><div class="head-actions"></div></header><main id="lessonStage"><div id="stage-body" data-investigation="cs-explore-square"><div class="stage-copy">Existing explanation</div></div><section id="workspace">Model controls</section></main></body></html>');
Object.assign(globalThis,{window,document,MutationObserver:window.MutationObserver,location:{pathname:'/ECHS-Math/'+entries.cross.path,search:'?forum=1'}});
await import('../lessons/shared/forum/lesson-guide.mjs?isolated-test');
const tick=()=>new Promise(r=>setTimeout(r,0));
await tick();
const panel=()=>document.querySelector('[data-guided-entry="cross"]');
const click=text=>{const node=[...panel().querySelectorAll('button')].find(n=>n.textContent===text);assert.ok(node,text);node.click();};
const fill=(id,text)=>{const node=document.getElementById(id);node.value=text;node.dispatchEvent(new window.Event('input',{bubbles:true}));};
assert.equal(document.querySelector('#lessonStage').dataset.guidedPhase,'predict');
click('Explore the model');assert.equal(document.querySelector('#lessonStage').dataset.guidedPhase,'predict');assert.match(panel().textContent,/Make a prediction/);
fill('ew-cross-prediction','Square faces should give more volume.');click('Explore the model');
assert.equal(document.querySelector('#lessonStage').dataset.guidedPhase,'explore');
click('Next change');assert.match(panel().textContent,/Test 2 of 3/);
click('Explain what changed');click('Try independent transfer');assert.equal(document.querySelector('#lessonStage').dataset.guidedPhase,'explain');
fill('ew-cross-explanation','Each face area determines its small volume.');click('Try independent transfer');
click('Compare with worked reasoning');assert.ok(panel().querySelector('.ew-comparison').hidden);
fill('ew-cross-transfer','The radius is half the width and I integrate the face area.');click('Compare with worked reasoning');assert.ok(!panel().querySelector('.ew-comparison').hidden);
fill('ew-cross-transfer','I am revising my bounds.');assert.ok(panel().querySelector('.ew-comparison').hidden);
// Native stage replacement remounts the panel while preserving the tab draft.
const body=document.querySelector('#stage-body');body.innerHTML='<div class="stage-copy">New native stage</div>';body.dataset.investigation='cs-shape-lab';await tick();
assert.ok(!document.querySelector('#lessonStage').classList.contains('ew-guided-active'));
body.innerHTML='<div class="stage-copy">Original native stage</div>';body.dataset.investigation='cs-explore-square';await tick();
assert.equal(document.getElementById('ew-cross-transfer').value,'I am revising my bounds.');
click('Full lesson');assert.ok(!document.querySelector('#lessonStage').classList.contains('ew-guided-active'));
click('Start guided investigation');assert.equal(document.querySelector('#lessonStage').dataset.guidedPhase,'transfer');
const hide=new window.Event('pagehide');window.dispatchEvent(hide);
body.innerHTML='<div class="stage-copy">After disposal</div>';await tick();assert.ok(!body.querySelector('[data-guided-entry]'));
console.log('PASS: prediction gating, explained transition, independent comparison gating, draft revision, native navigation, full-lesson restore and lifecycle disposal.');
