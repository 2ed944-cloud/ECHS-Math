/* Independent numerical, curriculum and content contracts for Topic 1.2. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),base=new URL('../lessons/ap-precalculus/unit-1/',import.meta.url);
const M=require(new URL('assets/rates-1-2-model-v3.js',base).pathname),Q=require(new URL('assets/rates-1-2-questions-v3.js',base).pathname);
const read=p=>fs.readFileSync(new URL(p,base),'utf8'),html=read('AP_Precalculus_1.2_Rates_of_Change_ECHS_Refined.html'),core=read('assets/rates-1-2-core-v3.js');
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<=tol,String(a)+' != '+b);
const volume=x=>M.linear(M.tank,x),reader=x=>M.linear(M.reader,x);
for(const [a,b,value] of [[0,2,50],[2,5,30],[5,8,-20],[0,5,38],[0,8,16.25],[5,2,30]])near(M.average(volume,a,b),value);
assert.equal(M.average(volume,2,2),null);assert.equal(M.average(volume,-1,5),null);assert.equal(M.average(volume,0,9),null);
for(const [a,b,value] of [[-2,4,-4/3],[-2,2,0],[0,4,-1],[2,6,-1],[4,6,2],[.9,1.1,2],[2.9,3.1,-4]])near(M.average(reader,a,b),value);
assert.equal(reader(-3),null);assert.equal(reader(7),null);
near(M.average(M.functions.quadratic.fn,1,4),2);near(M.average(M.functions.quadratic.fn,0,2),-1);
near(M.reconstruct(7,[{rate:-3,width:4}]),-5);near(M.reconstruct(5,[{rate:4,width:2},{rate:-2,width:3}]),7);
near(M.reconstruct(0,[{rate:8,width:1},{rate:-2,width:4}]),0);
for(const f of Object.values(M.zeroModels))near(M.average(f,0,4),0);
assert.equal(M.zeroModels.hump(2),17);assert.equal(M.zeroModels.valley(2),1);assert.equal(M.zeroModels.flat(2),5);
for(const c of [1,2,3])for(const h of [1,.5,.1,.01]){
  const r=M.nearby(x=>x*x,c,h);near(r.left,2*c-h);near(r.right,2*c+h);near(r.center,2*c);
}
assert.equal(M.nearby(x=>x*x,2,0),null);assert.equal(M.nearby(x=>x*x,2,-.1),null);
for(const c of [1,2])for(const h of [.5,.1,.01]){
  const r=M.nearby(M.compareModels.cube.fn,c,h);near(r.left,3*c*c-3*c*h+h*h);near(r.right,3*c*c+3*c*h+h*h);near(r.center,3*c*c+h*h);
}
for(const [c,value] of [[1,-2],[3,-6]])near(M.nearby(M.compareModels.falling.fn,c,.01).center,value);
for(const h of [1,.5,.1,.01]){
  const c=M.nearby(M.corner,2,h),s=M.nearby(M.smooth,2,h);near(c.left,-1);near(c.right,1);near(c.center,0);near(s.left,-h);near(s.right,h);near(s.center,0);
}
for(const model of ['line','curve'])near(M.average(x=>M.shared(model,x),0,4),2);
near(M.nearby(x=>M.shared('curve',x),1,.1).center,6);near(M.nearby(x=>M.shared('curve',x),3,.1).center,-2);
near(M.average(M.jump,0,4),2);near(M.jump(2),6);near(M.nearby(M.jump,2,.01).left,401);near(M.nearby(M.jump,2,.01).right,1);
const calculatorExpected=[-9.569377990430623,-13.3481646273637,-13.3334814831276,-3.3333425926183];
for(const [i,c] of M.calculatorCases.entries())near(M.average(M.remaining,c.a,c.b),calculatorExpected[i],1e-9);
assert.equal(M.average(M.remaining,1.2,4.7).toFixed(3),'-9.569');assert.equal(M.average(M.remaining,1.99,2.01).toFixed(3),'-13.333');
assert.equal(M.remaining(-.1),null);assert.equal(M.remaining(8.1),null);
for(const [h,dp,value] of [[1,1,.05],[.5,1,0],[.1,2,0],[.01,2,0],[.1,4,.04],[.01,4,.04],[.01,6,.04]])near(M.precision(h,dp).rate,value);
for(const bad of ['', '20 apples', '1/0', '1e309', '1e308/1e-308', '2/3/4', 'Infinity','NaN'])assert.equal(M.parseNumber(bad),null,bad);
near(M.parseNumber('−4/3'),-4/3);assert.ok(M.checkAnswer('0',{answer:0}).correct);assert.ok(!M.checkAnswer('',{answer:0}).correct);
assert.equal(M.navKey({key:'ArrowRight',target:{tagName:'DIV',isContentEditable:true}}),false);
assert.equal(Q.revision,'ap-precalculus-topic-1-2-v3');assert.equal(Q.questions.length,38);
assert.deepEqual(Q.questions.slice(0,8).map(q=>q.answer),[90,30,2,1,3,4,0,0]);
assert.deepEqual(Q.questions.filter(q=>q.id.startsWith('ap')).map(q=>q.answer),[1,3,2,0,1,0,3,1,2,2,3,0,1,2,0,3,1,3,2,0,1,2,0,2]);
assert.deepEqual(Q.questions.filter(q=>q.id.startsWith('ch')).map(q=>q.answer),[1,0,2,3,0,3]);
for(const q of Q.questions){assert.ok(q.hint&&q.solution&&q.ek);if(q.type==='mcq'){assert.equal(q.choices.length,4);assert.equal(new Set(q.choices).size,4);assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4);}assert.ok(html.includes('data-question="'+q.id+'"'));}
assert.equal(Q.questions.filter(q=>q.calculator).length,2);assert.equal(Q.frqs.filter(f=>f.calculator).length,2);
assert.equal(Q.frqs.length,6);
for(const f of Q.frqs){assert.equal(f.totalMarks,6);assert.equal(f.parts.length,3);assert.equal(f.parts.reduce((n,p)=>n+p.marks,0),6);for(const p of f.parts){assert.equal(p.marks,2);assert.equal((p.rubric.match(/<li>/g)||[]).length,2);}assert.ok(html.includes('data-frq="'+f.id+'"'));}
// Independently verify the finite table used by FRQ 3.
for(const [c,h,left,right,avg] of [[1,.1,.729,1.331,3.01],[1,.01,.970299,1.030301,3.0001],[2,.1,6.859,9.261,12.01],[2,.01,7.880599,8.120601,12.0001]]){near((right-left)/(2*h),avg);near((c-h)**3,left);near((c+h)**3,right);}
assert.equal((html.match(/class="slide"/g)||[]).length,55);assert.equal((html.match(/data-rates-lab=/g)||[]).length,10);
assert.ok(html.indexOf('id="corner-lab"')>html.indexOf('id="frq04"'));assert.ok(html.indexOf('id="challenge-mcq-1"')>html.indexOf('id="frq04"'));
assert.match(html,/data-lesson="1.2"/);assert.match(html,/data-framework="fall-2026"/);assert.match(html,/1\.2\.A\.1/);assert.match(html,/1\.2\.A\.2–3/);assert.match(html,/1\.2\.B\.1–3/);assert.match(html,/Skills 2.A and 3.A/);
assert.doesNotMatch(html,/<script[^>]*src="https?:|lesson-1\.2-engine|lesson-1\.2-content/);
const ids=new Set([...html.matchAll(/<section class="slide" id="([^"]+)"/g)].map(m=>m[1]));
const aliases=JSON.parse(core.match(/const aliases=(\{.*?\});/)[1]);for(const [old,target] of Object.entries(aliases))assert.ok(ids.has(target),old+' -> '+target);
const ctx=vm.createContext({window:{}});vm.runInContext(fs.readFileSync(new URL('../../../data/ap-precalculus-update.js',base),'utf8'),ctx);
const lessons=ctx.window.ECHS_COURSES[0].units[0].lessons;assert.equal(lessons[0].interactiveSlides,48);assert.equal(lessons[1].interactiveSlides,55);assert.equal(lessons[1].assessment.written_points,36);assert.equal(lessons[1].interactiveInvestigations,10);
console.log('AP Precalculus 1.2 mathematics: PASS (10 models, 38 independent answer keys, 6 six-point FRQs, scope, legacy links and portal metadata).');
