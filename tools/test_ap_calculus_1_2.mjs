/* Exact-model, curriculum and rendering checks for original Topic 1.2 content. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),base=new URL('../lessons/ap-calculus/unit-1/',import.meta.url);
const M=require(new URL('assets/lesson-1-2-model.js',base).pathname),Q=require(new URL('assets/lesson-1-2-questions.js',base).pathname);
const html=fs.readFileSync(new URL('1-2-defining-limits-and-using-limit-notation.html',base),'utf8'),runtime=fs.readFileSync(new URL('assets/lesson-1-2.js',base),'utf8');
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<=tol,`${a} should equal ${b}`);
// Independently computed limiting values, including a negative target, zero, a constant and a jump.
const expected={hole:[4,4,7],missing:[4,4,null],smooth:[4,4,4],zero:[0,0,3],constant:[-2,-2,3],jump:[1,4,2]};
for(const [key,[left,right,at]] of Object.entries(expected)){
 const model=M.models[key];assert.equal(M.value(model,model.c),at);assert.equal(M.limit(model,'left'),left);assert.equal(M.limit(model,'right'),right);assert.equal(M.limit(model),left===right?left:'DNE');
 for(const side of ['left','right']){let previous=Infinity;for(const h of [.1,.01,.001,.0001]){const row=M.sample(model,h,side);assert.ok(side==='left'?row.x<model.c:row.x>model.c);assert.notEqual(row.x,model.c);near(row.y,model.near(row.x));const gap=Math.abs(row.y-(side==='left'?left:right));assert.ok(gap<=previous);previous=gap;}near(M.sample(model,1e-7,side).y,side==='left'?left:right,2e-7);}
 assert.equal(M.sample(model,0,'left'),null);assert.equal(M.sample(model,-1,'right'),null);assert.equal(M.sample(model,Infinity,'left'),null);assert.equal(M.sample(model,1,'up'),null);
}
for(const l of [-3,0,2,6])for(const r of [-3,0,2,6])for(const at of [-3,0,6]){const model=M.branches(l,r,at);assert.equal(M.limit(model),l===r?l:'DNE');near(M.value(model,1.99),l-.005);near(M.value(model,2.01),r+.005);assert.equal(M.value(model,2),at);}
for(const far of [-2,4,9])for(const at of [-2,4,9]){const model=M.localModel(far,at);near(M.value(model,1),far);near(M.value(model,3),far);near(M.value(model,1.999),3.999);near(M.value(model,2.001),4.001);assert.equal(M.value(model,2),at);assert.equal(M.limit(model),4);}
// The finite-sample counterexample agrees at every listed input, but is constant 8 closer to 2.
const table=new Map([[1.9,4.9],[1.99,4.99],[2.01,5.01],[2.1,5.1]]),f=x=>x+3,g=x=>table.has(x)?table.get(x):8;
for(const [x,y] of table){near(f(x),y);near(g(x),y);}for(const h of [.009,.001,.0001]){near(g(2-h),8);near(g(2+h),8);near(f(2-h),5-h);near(f(2+h),5+h);}
const mcqs=Q.questions.filter(q=>q.group==='AP-style MCQ');assert.equal(mcqs.length,16);assert.deepEqual(mcqs.map(q=>q.answer),[2,0,3,1,2,3,0,1,3,2,1,0,2,0,3,1]);
const numeric={'read-target':-3,'read-output':0,'missing-limit':4,'missing-value':'undefined','jump-limit':'DNE','exit-limit':0};for(const [id,answer] of Object.entries(numeric))assert.equal(Q.questions.find(q=>q.id===id).answer,answer);
assert.equal(Q.questions.length,24);assert.equal(Q.frqs.length,3);for(const q of Q.questions){assert.ok(q.hint&&q.solution);if(q.type==='mcq'){assert.equal(q.choices.length,4);assert.equal(new Set(q.choices).size,4);assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4);}}
for(const f of Q.frqs){assert.equal(f.parts.length,3);for(const p of f.parts)assert.equal((p.rubric.match(/1 point:/g)||[]).length,3);}
// Context values in the FRQs.
near(15+2.99,17.99);near(15+3.01,18.01);assert.equal(15+3,18);
for(const invalid of ['',' ','1/0','Infinity','NaN','2+2','0x10','undefined now','DNE!'])assert.equal(M.parseAnswer(invalid),null);
for(const [input,answer] of [['0',0],['−3',-3],['8/2',4],['1e-3',.001],[' dne ','DNE'],['Undefined','undefined']])assert.equal(M.parseAnswer(input),answer);
assert.equal(M.parseAnswer('9'.repeat(400)+'/2'),null);assert.ok(M.correctAnswer('0',0));assert.ok(!M.correctAnswer('',0));assert.ok(!M.correctAnswer('DNE','undefined'));assert.ok(!M.correctAnswer('undefined','DNE'));assert.ok(!M.correctAnswer('4.001',4));
assert.equal(M.notationTasks.length,6);for(const task of M.notationTasks){const entry={...task,target:String(task.target),output:String(task.output)};assert.ok(Object.values(M.checkNotation(task,entry)).every(Boolean));assert.equal(M.checkNotation(task,{...entry,target:''}).target,false);assert.equal(M.checkNotation(task,{...entry,side:'wrong'}).side,false);}
for(const key of ['ArrowRight','ArrowLeft','Home','End']){assert.ok(M.navKey({key,target:{closest:()=>null}}));assert.ok(!M.navKey({key,target:{closest:()=>({})}}));assert.ok(!M.navKey({key,ctrlKey:true,target:{closest:()=>null}}));}
// Use the exact locally bundled math renderer. Every authored expression must parse.
const context=vm.createContext({window:{},console});vm.runInContext(fs.readFileSync(new URL('../lessons/ib-math-ai/unit-1/assets/js/katex-global.js',import.meta.url),'utf8'),context);
const decode=s=>s.replace(/&quot;/g,'"').replace(/&#x27;|&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const equations=[...html.matchAll(/data-tex="([^"]+)"/g)].map(m=>decode(m[1]));
const walk=v=>{if(typeof v==='string')equations.push(...[...v.matchAll(/\\\((.*?)\\\)/gs)].map(m=>m[1]));else if(v&&typeof v==='object')Object.values(v).forEach(walk);};walk(Q);equations.push(...Object.values(M.models).map(m=>m.tex));
for(const tex of equations)assert.doesNotThrow(()=>context.window.katex.renderToString(tex,{throwOnError:true,strict:'ignore'}),tex);
assert.equal((html.match(/class="slide"/g)||[]).length,35);const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
const renderedQuestions=[...html.matchAll(/data-question="([^"]+)"/g)].map(m=>m[1]);assert.deepEqual([...renderedQuestions].sort(),Q.questions.map(q=>q.id).sort());assert.equal((html.match(/data-frq=/g)||[]).length,3);
assert.match(html,/LIM-1\.A/);assert.match(html,/LIM-1\.B/);assert.match(html,/mathematical practice 2\.B/);assert.ok(!html.includes('data:image'));assert.match(runtime,/\[data-finish-lesson\]/);assert.doesNotMatch(runtime,/markCompleted|recordAttempt|echs_math_complete/);
const legacy=fs.readFileSync(new URL('../lessons/ap-calculus/1-2-understanding-limits-graphically.html',import.meta.url),'utf8');let redirected;vm.runInNewContext(legacy.match(/<script>([\s\S]*?)<\/script>/)[1],{URL,location:{href:'https://example.test/ECHS-Math/lessons/ap-calculus/1-2-understanding-limits-graphically.html?course=ap-calculus&lessonKey=l2&accessKey=a2#slide=4',replace:url=>redirected=url},document:{getElementById:()=>({})}});assert.equal(redirected,'https://example.test/ECHS-Math/lessons/ap-calculus/unit-1/1-2-defining-limits-and-using-limit-notation.html?course=ap-calculus&lessonKey=l2&accessKey=a2#slide=4');
console.log(`AP Calculus 1.2: PASS (35 slides, 24 answer keys, 16 MCQs, 3 FRQs, ${equations.length} rendered equations, exact models, notation and progression contracts)`);
