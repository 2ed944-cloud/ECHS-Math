import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const base=new URL('../lessons/ap-calculus/unit-1/',import.meta.url);
const M=require(new URL('assets/lesson-1-1-model.js',base).pathname);
const Q=require(new URL('assets/lesson-1-1-questions.js',base).pathname);
const html=fs.readFileSync(new URL('1-1-can-change-occur-at-an-instant.html',base),'utf8');
const runtime=fs.readFileSync(new URL('assets/lesson-1-1.js',base),'utf8');
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<=tol,`${a} should equal ${b}`);
// Numerical expectations are calculated independently of displayed answers.
assert.equal(M.average(M.models.square,2,2),null);
near(M.average(M.models.square,1,3),4);
near(M.average(M.models.falling,1,3),-4);
near(M.average(M.models.square,3,1),4);
for(const key of ['square','line','falling','drop','airport','moon','pendulum','balance','cube']){
  const model=M.models[key],c=model.at;
  for(const h of [.1,.01,.001]){
    if(c-h<model.domain[0]||c+h>model.domain[1])continue;
    const pair=M.nearby(model,c,h);
    near(pair.left,(model.f(c)-model.f(c-h))/h,1e-6);
    near(pair.right,(model.f(c+h)-model.f(c))/h,1e-6);
    near(pair.center,(model.f(c+h)-model.f(c-h))/(2*h),1e-6);
  }
  const fine=M.nearby(model,c,.0001);
  near(fine.center,model.slope(c),1e-5);
}
assert.equal(M.nearby(M.models.airport,0,.01),null,'No out-of-domain sampling');
assert.equal(M.nearby(M.models.airport,18,0),null);
for(const [time,position,distance] of [[0,0,0],[2,600,600],[4,1000,1000],[4.5,850,1150],[5,700,1300],[6,900,1500],[8,1300,1900]]){
  const result=M.bike(time);near(result.position,position);near(result.distance,distance);
}
near(M.bike(8).distance/8,237.5);near(M.bike(8).position/8,162.5);
for(const h of [1,.1,.001]){const pair=M.nearby(M.models.corner,2,h);near(pair.left,-1);near(pair.right,1);near(pair.center,0);}
const f=t=>t*t,g=t=>t*t+10*(t-1)*(t-2)*(t-3);
for(const t of [1,2,3])near(f(t),g(t));
near((f(2.0001)-f(2))/.0001,4.0001,1e-7);
near((g(2.0001)-g(2))/.0001,-5.9998999,1e-7);
const V=t=>92-15*Math.sin(t/3);
assert.equal(V(18).toFixed(3),'96.191');
assert.equal(((V(20)-V(15))/5).toFixed(3),'-3.999');
assert.equal(((V(18)-V(17.99))/.01).toFixed(3),'-4.799');
assert.equal(((V(18.01)-V(18))/.01).toFixed(3),'-4.803');
near((180-240)/8,-7.5);near((201.23-202.77)/.2,-7.7);
near((113.2-117)/2,-1.9);
const numericExpected={'bike-distance':1900,'bike-speed':237.5,'bike-velocity':162.5,'drop-estimate':22.4,'heart-rate':-1.9,'exit-rate':4.1};
for(const [id,answer] of Object.entries(numericExpected))near(Q.questions.find(q=>q.id===id).answer,answer);
assert.equal(Q.questions.filter(q=>q.group==='AP-style MCQ').length,12);
assert.deepEqual(Q.questions.filter(q=>q.group==='AP-style MCQ').map(q=>q.answer),[1,2,3,1,0,2,0,3,1,2,3,0]);
for(const q of Q.questions){assert.ok(q.hint&&q.solution);if(q.type==='mcq'){assert.equal(q.choices.length,4);assert.equal(new Set(q.choices).size,4);assert.ok(q.answer>=0&&q.answer<4);}}
assert.equal(Q.frqs.length,3);for(const f of Q.frqs){assert.equal(f.parts.length,3);for(const p of f.parts)assert.equal((p.rubric.match(/1 point:/g)||[]).length,3);}
assert.equal(new Set(Q.questions.map(q=>q.id)).size,Q.questions.length);
for(const value of ['',' ','1/0','Infinity','NaN','2+2','0x10'])assert.equal(M.parseNumber(value),null);
for(const [value,answer] of [['0',0],['−1.9',-1.9],['19/4',4.75],['-3 / 2',-1.5],['1e-3',.001]])near(M.parseNumber(value),answer);
assert.ok(M.correctNumber('0',0));assert.ok(!M.correctNumber('',0));assert.ok(M.correctNumber('-1.900',-1.9));assert.ok(!M.correctNumber('1.9',-1.9));
for(const key of ['ArrowRight','ArrowLeft','Home','End']){assert.ok(M.navKey({key,target:{closest:()=>null}}));assert.ok(!M.navKey({key,target:{closest:()=>({})}}));assert.ok(!M.navKey({key,ctrlKey:true,target:{closest:()=>null}}));}
// Check every authored equation using the same local KaTeX renderer used in the lesson.
const katexContext=vm.createContext({window:{},console});
vm.runInContext(fs.readFileSync(new URL('../lessons/ib-math-ai/unit-1/assets/js/katex-global.js',import.meta.url),'utf8'),katexContext);
const decode=s=>s.replace(/&quot;/g,'"').replace(/&#x27;|&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const equations=[...html.matchAll(/data-tex="([^"]+)"/g)].map(m=>decode(m[1]));
const walk=v=>{if(typeof v==='string')equations.push(...[...v.matchAll(/\\\((.*?)\\\)/gs)].map(m=>m[1]));else if(v&&typeof v==='object')Object.values(v).forEach(walk);};walk(Q);equations.push(...Object.values(M.models).map(m=>m.tex));
for(const tex of equations)assert.doesNotThrow(()=>katexContext.window.katex.renderToString(tex,{throwOnError:true,strict:'ignore'}),tex);
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'Static IDs are unique');
assert.equal((html.match(/class="slide"/g)||[]).length,33);
for(const match of html.matchAll(/data-question="([^"]+)"/g))assert.ok(Q.questions.some(q=>q.id===match[1]),match[1]);
for(const match of html.matchAll(/data-frq="([^"]+)"/g))assert.ok(Q.frqs.some(q=>q.id===match[1]),match[1]);
assert.ok(!html.includes('data:image'),'Lesson does not embed multi-megabyte imagery');
assert.match(html,/CHA-1\.A/);assert.match(html,/mathematical practice 2\.B/);
assert.match(runtime,/\[data-finish-lesson\]/,'Use the existing protected progression action');
assert.doesNotMatch(runtime,/markCompleted|recordAttempt|echs_math_complete/,'Practice feedback must not silently award platform mastery');
const legacy=fs.readFileSync(new URL('../lessons/ap-calculus/1-1-introducing-calculus.html',import.meta.url),'utf8');
let redirected;
vm.runInNewContext(legacy.match(/<script>([\s\S]*?)<\/script>/)[1],{URL,location:{href:'https://example.test/ECHS-Math/lessons/ap-calculus/1-1-introducing-calculus.html?course=ap-calculus&lessonKey=l1&accessKey=a1#slide=4',replace:url=>redirected=url},document:{getElementById:()=>({})}});
assert.equal(redirected,'https://example.test/ECHS-Math/lessons/ap-calculus/unit-1/1-1-can-change-occur-at-an-instant.html?course=ap-calculus&lessonKey=l1&accessKey=a1#slide=4');
console.log(`AP Calculus 1.1: PASS (33 slides; 12 MCQs; 3 FRQs; ${equations.length} valid equations; rates, units, keys, models, input and navigation contracts)`);
