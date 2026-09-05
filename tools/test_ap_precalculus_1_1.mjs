/* Independent mathematics and curriculum/content contracts for Topic 1.1. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),base=new URL('../lessons/ap-precalculus/unit-1/',import.meta.url);
const M=require(new URL('assets/tandem-1-1-model-v3.js',base).pathname),Q=require(new URL('assets/tandem-1-1-questions-v3.js',base).pathname);
const html=fs.readFileSync(new URL('AP_Precalculus_1.1_Change_in_Tandem_ECHS_Refined.html',base),'utf8');
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<=tol,String(a)+' != '+b);
assert.deepEqual([0,1,3,4,5,6,8].map(M.reservoir),[10,18,34,34,34,28,16]);
assert.equal(M.reservoir(-1),null);assert.equal(M.reservoir(9),null);
assert.deepEqual([-4,-3,-2,-1,0,1,2,3,4].map(x=>M.linear(M.reader,x)),[-2,0,2,2,2,0,-2,-1,0]);
assert.equal(M.linear(M.reader,4.1),null);
assert.deepEqual(M.preimageLinear(M.reader,0),{values:[-3,1,4],intervals:[]});
assert.deepEqual(M.preimageLinear(M.reader,2),{values:[],intervals:[[-2,0]]});
assert.deepEqual(M.preimage('wave',4),[-3,0,3]);assert.deepEqual(M.preimage('wave',0),[-1.5,1.5]);
assert.deepEqual(M.preimage('wave',2),[-2.25,-.75,.75,2.25]);
for(const level of [-2,-1,0,2,3,4,8,9])for(const restricted of [false,true]){
  const expected=level< -1||level>8?[]:level===-1?[0]:restricted?[Math.sqrt(level+1)]:[-Math.sqrt(level+1),Math.sqrt(level+1)];
  assert.deepEqual(M.preimage('quadratic',level,restricted),expected);
}
const shapes=[['inc-up','increasing','up','increasing',[1,1.5,3,5.5,9]],['inc-down','increasing','down','decreasing',[1,4.5,7,8.5,9]],['dec-up','decreasing','up','increasing',[9,5.5,3,1.5,1]],['dec-down','decreasing','down','decreasing',[9,8.5,7,4.5,1]]];
for(const [key,direction,concavity,rate,values] of shapes){const s=M.shapes[key];assert.deepEqual([s.direction,s.concavity,s.rate],[direction,concavity,rate]);assert.deepEqual([0,1,2,3,4].map(s.fn),values);}
const stories={heating:{keys:['inc-up','inc-down','constant'],values:[20,60,100,100]},draining:{keys:['dec-up','dec-down','constant'],values:[100,60,20,20]},journey:{keys:['inc-linear','constant','inc-linear'],values:[0,40,40,80]}};
for(const [name,s] of Object.entries(stories)){
  assert.ok(M.storyCorrect(s.keys,name));assert.ok(!M.storyCorrect(['constant','constant','constant'],name));
  assert.deepEqual([0,2,4,6].map(x=>M.storyValue(s.keys,x,name)),s.values);
  for(const x of [2,4])near(M.storyValue(s.keys,x-1e-8,name),M.storyValue(s.keys,x+1e-8,name),1e-5);
}
for(const x of [0,1,2,3])near(M.linear(M.evidence,x),x*x);
assert.ok(M.linear(M.evidence,.5)>M.linear(M.evidence,1.5));assert.notEqual(M.linear(M.evidence,.5),.25);
assert.deepEqual([-2,-1,0,1,4,5,6].map(M.constrained),[0,3,4,3,0,1,4]);near(M.constrained(4+Math.sqrt(3)),3);
assert.equal(M.constrained(-3),null);assert.equal(M.constrained(7),null);
near(M.polynomial(-2.4),3.22048);near(M.polynomial(1.7),-1.05336);
assert.equal(M.polynomial(-2.4).toFixed(3),'3.220');assert.equal(M.polynomial(1.7).toFixed(3),'-1.053');
for(const x of [-4,1,5])near(M.polynomial(x),0);
assert.equal(M.turns[0].toFixed(2),'-1.94');assert.equal(M.turns[1].toFixed(2),'3.27');
for(const [i,t] of M.turns.entries())for(const h of [.01,.1]){assert.ok(i?M.polynomial(t)<M.polynomial(t-h):M.polynomial(t)>M.polynomial(t-h));assert.ok(i?M.polynomial(t)<M.polynomial(t+h):M.polynomial(t)>M.polynomial(t+h));}
for(const x of ['', 'abc', '1/0', '1e309', '1e308/1e-308', '2/3/4', '20x', 'Math.random()', 'Infinity'])assert.equal(M.parseNumber(x),null,x);
near(M.parseNumber('−3/4'),-.75);near(M.parseNumber('2e1'),20);assert.ok(M.sameSet('3,0,-3',[-3,0,3]));assert.ok(!M.sameSet('-3,3',[-3,0,3]));assert.ok(M.sameSet('empty',[]));
assert.equal(Q.revision,'ap-precalculus-topic-1-1-v3');assert.equal(Q.questions.length,34);
assert.deepEqual(Q.questions.slice(0,6).map(q=>q.answer),[2,20,1,3,0,2]);
assert.deepEqual(Q.questions.filter(q=>q.id.startsWith('ap')).map(q=>q.answer),[1,3,2,0,1,0,3,1,2,2,3,0,1,2,1,3,0,1,2,3,0,1,2,2]);
assert.deepEqual(Q.questions.filter(q=>q.id.startsWith('ch')).map(q=>q.answer),[1,0,2,3]);
assert.equal(Q.questions.filter(q=>q.calculator).length,1);
for(const q of Q.questions){assert.ok(q.prompt&&q.hint&&q.solution&&q.ek,q.id);if(q.type==='mcq'){assert.equal(q.choices.length,4);assert.equal(new Set(q.choices).size,4);assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4);}}
assert.equal(Q.frqs.length,6);assert.equal(Q.frqs.filter(f=>f.calculator).length,1);
for(const f of Q.frqs){assert.equal(f.totalMarks,6);assert.equal(f.parts.length,3);assert.equal(f.parts.reduce((s,p)=>s+p.marks,0),6);for(const p of f.parts){assert.equal(p.marks,2);assert.equal((p.rubric.match(/<li>/g)||[]).length,2);}}
assert.equal((html.match(/class="slide"/g)||[]).length,48);assert.equal((html.match(/data-tandem-lab=/g)||[]).length,8);
for(const q of Q.questions)assert.ok(html.includes('data-question="'+q.id+'"'));
for(const f of Q.frqs)assert.ok(html.includes('data-frq="'+f.id+'"'));
assert.ok(html.indexOf('id="challenge-mcq-1"')>html.indexOf('id="frq04"'));
assert.match(html,/data-framework="fall-2026"/);assert.match(html,/1\.1\.A\.1–4/);assert.match(html,/1\.1\.B\.1–5/);
assert.match(html,/original AP-style MCQs/);assert.match(html,/Original ECHS questions/);assert.match(html,/open versus closed/i);
assert.doesNotMatch(html,/<script[^>]*src="https?:|engine\.js|\.gz["?]/);
const ctx=vm.createContext({window:{}});vm.runInContext(fs.readFileSync(new URL('../../../data/ap-precalculus-update.js',base),'utf8'),ctx);
const course=ctx.window.ECHS_COURSES.find(c=>c.id==='ap-precalculus-g10-g11');assert.ok(course);
const lesson=course.units[0].lessons[0];assert.equal(lesson.release,'3.0.0');assert.equal(lesson.interactiveSlides,48);assert.equal(lesson.assessment.written_points,36);
console.log('AP Precalculus 1.1 mathematics and content: PASS (48 slides, 8 models, 34 independently keyed checks, 6 six-point FRQs, framework and metadata).');
